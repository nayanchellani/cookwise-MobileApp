import logging
import time
from collections.abc import Callable
from dataclasses import dataclass
from functools import lru_cache
from typing import TypeVar

from fastapi import HTTPException
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app.core.config import settings

T = TypeVar("T", bound=BaseModel)

log = logging.getLogger("app.gemini")

# Their DEBUG/INFO output can include request details. Keep them at WARNING.
for _name in ("httpx", "httpx2", "httpcore", "google_genai"):
    logging.getLogger(_name).setLevel(logging.WARNING)

MAX_ATTEMPTS = 2
_BACKOFF_S = 0.5
_NETWORK_MODULES = {"httpx", "httpx2", "httpcore"}  # the SDK may use either httpx or httpx2
_sleep = time.sleep  # replaced in tests

# Messages sent to clients. Never put upstream error text in these.
_MSG_UNAVAILABLE = "AI service is temporarily unavailable, please retry"
_MSG_TIMEOUT = "AI service timed out, please retry"
_MSG_INVALID = "AI returned an invalid response, please retry"
_MSG_NOT_CONFIGURED = "AI service is not configured correctly"
_MSG_REJECTED = "AI service rejected the request"
_MSG_RATE_LIMIT = "AI rate limit or quota reached, try again later"
_MSG_UNEXPECTED = "Unexpected error while contacting the AI service"


@dataclass(frozen=True)
class _Failure:
    """A retryable failure and the HTTP response to give if retries run out."""

    kind: str
    status: int
    detail: str


_UNAVAILABLE = _Failure("unavailable", 503, _MSG_UNAVAILABLE)
_TIMEOUT = _Failure("timeout", 504, _MSG_TIMEOUT)
_INVALID = _Failure("invalid_output", 502, _MSG_INVALID)


class OutputRejected(ValueError):
    """Raised by a caller's check when valid-looking output breaks a request rule (time, allergen...).

    `code` is a short fixed string (e.g. "time_limit"). It is logged, so never put user data in it.
    """

    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


@lru_cache
def _client() -> genai.Client:
    if not settings.gemini_api_key:
        log.error("gemini api key is not configured")
        raise HTTPException(503, _MSG_NOT_CONFIGURED)
    # JSON mode / response_schema is only served on v1beta; the SDK default (v1) rejects it with 400.
    return genai.Client(api_key=settings.gemini_api_key, http_options=types.HttpOptions(api_version="v1beta"))


def _is_key_error(e: errors.APIError) -> bool:
    # An invalid key comes back as 400 INVALID_ARGUMENT, not 401.
    return "api_key_invalid" in str(e.details).lower() or "api key" in (e.message or "").lower()


def _classify_api_error(e: errors.APIError, op: str) -> _Failure:
    """Return a retryable failure, or raise the final HTTP error for permanent ones."""
    code = e.code or 0
    if code in (408, 504):
        return _TIMEOUT
    if code >= 500:
        return _UNAVAILABLE
    # Log code and Gemini status only. The error body is never logged.
    log.error("gemini op=%s permanent error http=%s api_status=%s", op, code, e.status)
    if code == 429:
        raise HTTPException(429, _MSG_RATE_LIMIT)
    if code in (401, 403) or _is_key_error(e):
        raise HTTPException(503, _MSG_NOT_CONFIGURED)
    raise HTTPException(502, _MSG_REJECTED)


def _classify_other(e: Exception) -> _Failure | None:
    """Timeouts and network errors are retryable. Anything else is a bug, not a transient fault."""
    from_http_lib = type(e).__module__.split(".")[0] in _NETWORK_MODULES
    if isinstance(e, TimeoutError) or (from_http_lib and "Timeout" in type(e).__name__):
        return _TIMEOUT
    if isinstance(e, OSError) or from_http_lib:
        return _UNAVAILABLE
    return None


def _call(prompt: str, schema: type[BaseModel], image: bytes | None, mime: str | None, timeout_s: float) -> str:
    parts: list = [prompt]
    if image is not None:
        parts.insert(0, types.Part.from_bytes(data=image, mime_type=mime or "image/jpeg"))
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=schema,
        temperature=0.7,
        http_options=types.HttpOptions(timeout=int(timeout_s * 1000)),  # milliseconds
    )
    response = _client().models.generate_content(model=settings.gemini_model, contents=parts, config=config)
    return response.text or ""


def generate_structured(
    prompt: str,
    schema: type[T],
    image: bytes | None = None,
    mime: str | None = None,
    check: Callable[[T], None] | None = None,
) -> T:
    """The only place that calls Gemini. Returns a validated Pydantic object.

    Retries (at most once) only for timeouts, network errors, Gemini 5xx and invalid output.
    `check(result)` may raise OutputRejected to reject output that parses but breaks request rules;
    that counts as invalid output. Auth, config, bad-request and quota errors fail at once. The whole call, retries included,
    stays inside settings.gemini_total_timeout_s.
    """
    op = schema.__name__
    started = time.monotonic()
    deadline = started + settings.gemini_total_timeout_s
    failure = _INVALID
    for attempt in range(1, MAX_ATTEMPTS + 1):
        timeout_s = min(settings.gemini_attempt_timeout_s, deadline - time.monotonic())
        try:
            text = _call(prompt, schema, image, mime, timeout_s)
            result = schema.model_validate_json(text)
            if check is not None:
                check(result)
            return result
        except HTTPException:
            raise
        except errors.APIError as e:
            failure = _classify_api_error(e, op)
            reason = f"http={e.code} api_status={e.status}"
        except OutputRejected as e:
            failure = _INVALID
            reason = f"rejected={e.code}"
        except ValidationError as e:
            failure = _INVALID
            reason = f"validation_errors={e.error_count()}"  # counts only: messages can echo model output
        except Exception as e:
            classified = _classify_other(e)
            if classified is None:
                log.error("gemini op=%s unexpected %s", op, type(e).__name__)
                raise HTTPException(500, _MSG_UNEXPECTED) from None
            failure = classified
            reason = type(e).__name__
        log.warning(
            "gemini op=%s attempt=%d/%d failed kind=%s %s elapsed=%.1fs",
            op, attempt, MAX_ATTEMPTS, failure.kind, reason, time.monotonic() - started,
        )
        if attempt == MAX_ATTEMPTS or deadline - time.monotonic() - _BACKOFF_S < settings.gemini_min_retry_s:
            break
        _sleep(_BACKOFF_S)
    raise HTTPException(failure.status, failure.detail)
