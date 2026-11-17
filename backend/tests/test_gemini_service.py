"""Offline tests for gemini_service: error mapping, retries, time limits, log safety, no network
except to a local throwaway server."""
import json
import logging
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace

import httpx2
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from google import genai
from google.genai import errors, types

from app.core.config import settings
from app.main import app
from app.schemas.recipe import Recipe
from app.services import gemini_service as gs
from app.services.gemini_service import OutputRejected

SECRET_KEY = "AIzaSyFAKE-test-key-0123456789"
PROMPT = "private prompt for alice@example.com"


def valid_recipe(**over) -> dict:
    data = {
        "name": "Aloo Tamatar", "description": "Simple curry", "cuisine": "Indian", "diet": "Vegetarian",
        "prep_min": 10, "cook_min": 15, "difficulty": "Easy", "servings": 2,
        "ingredients": [{"name": "potato", "quantity": 300, "unit": "g"}],
        "steps": ["Chop.", "Cook."], "calories": 350,
        "macros": {"protein_g": 8, "carbs_g": 50, "fat_g": 12}, "labels": ["Vegetarian"],
    }
    return {**data, **over}


GOOD = json.dumps(valid_recipe())


def client_error(code: int, message: str = "upstream detail", status: str = "STATUS", reason: str = "") -> errors.ClientError:
    body = {"error": {"code": code, "message": message, "status": status, "details": [{"reason": reason}]}}
    return errors.ClientError(code, body)


def server_error(code: int) -> errors.ServerError:
    return errors.ServerError(code, {"error": {"code": code, "message": "upstream detail", "status": "UNAVAILABLE"}})


class FakeClient:
    """Stands in for genai.Client. Each call consumes one outcome: an exception to raise or a text to return."""

    def __init__(self, outcomes, clock=None, cost=0.0):
        self.outcomes, self.clock, self.cost = list(outcomes), clock, cost
        self.calls = 0
        self.timeouts_ms: list[int] = []
        self.contents: list = []
        self.models = self

    def generate_content(self, model, contents, config):
        self.calls += 1
        self.timeouts_ms.append(config.http_options.timeout)
        self.contents.append(contents)
        if self.clock is not None:
            self.clock[0] += self.cost
        outcome = self.outcomes[min(self.calls, len(self.outcomes)) - 1]
        if isinstance(outcome, Exception):
            raise outcome
        return SimpleNamespace(text=outcome)


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", SECRET_KEY)
    monkeypatch.setattr(settings, "gemini_attempt_timeout_s", 40)
    monkeypatch.setattr(settings, "gemini_total_timeout_s", 60)
    monkeypatch.setattr(settings, "gemini_min_retry_s", 8)
    monkeypatch.setattr(gs, "_sleep", lambda s: None)
    gs._client.cache_clear()
    yield


@pytest.fixture
def install(monkeypatch):
    def _install(outcomes, **kw) -> FakeClient:
        fake = FakeClient(outcomes, **kw)
        monkeypatch.setattr(gs, "_client", lambda: fake)
        return fake

    return _install


@pytest.fixture
def clock(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(gs, "time", SimpleNamespace(monotonic=lambda: now[0]))
    return now


def call():
    return gs.generate_structured(PROMPT, Recipe)


def status_of(outcomes, install) -> tuple[int, FakeClient, str]:
    fake = install(outcomes)
    with pytest.raises(HTTPException) as exc:
        call()
    return exc.value.status_code, fake, exc.value.detail


# ---- success and retry -------------------------------------------------------------------------

def test_success_first_try(install):
    fake = install([GOOD])
    assert call().name == "Aloo Tamatar"
    assert fake.calls == 1


RETRYABLE_FIRST_FAILURES = [
    server_error(500), server_error(503), client_error(408),
    httpx2.ConnectError("boom"), httpx2.ReadTimeout("slow"), TimeoutError(), ConnectionResetError(),
    "not json", "", json.dumps(valid_recipe(steps=[])),
]


@pytest.mark.parametrize("failure", RETRYABLE_FIRST_FAILURES, ids=lambda f: type(f).__name__ + str(f)[:12])
def test_retries_once_then_succeeds(failure, install):
    fake = install([failure, GOOD])
    assert call().name == "Aloo Tamatar"
    assert fake.calls == 2


@pytest.mark.parametrize(
    "failure,expected",
    [
        (server_error(500), 503), (server_error(503), 503), (server_error(504), 504), (client_error(408), 504),
        (httpx2.ConnectError("boom"), 503), (httpx2.ReadTimeout("slow"), 504), (TimeoutError(), 504),
        ("not json", 502), ("", 502), (json.dumps(valid_recipe(calories=0)), 502),
    ],
    ids=lambda v: type(v).__name__ + str(v)[:12] if not isinstance(v, int) else str(v),
)
def test_retry_exhausted_gives_mapped_status(failure, expected, install):
    status, fake, _ = status_of([failure, failure], install)
    assert status == expected
    assert fake.calls == 2  # one retry, never more


# ---- no retry ----------------------------------------------------------------------------------

@pytest.mark.parametrize(
    "failure,expected",
    [
        (client_error(429, status="RESOURCE_EXHAUSTED"), 429),
        (client_error(401), 503),
        (client_error(403, status="PERMISSION_DENIED"), 503),
        (client_error(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT", "API_KEY_INVALID"), 503),
        (client_error(400, "bad request body", "INVALID_ARGUMENT"), 502),
        (client_error(404, "model not found", "NOT_FOUND"), 502),
    ],
    ids=["429", "401", "403", "400-bad-key", "400-bad-request", "404"],
)
def test_permanent_errors_fail_at_once_with_sanitized_detail(failure, expected, install):
    status, fake, detail = status_of([failure, GOOD], install)
    assert status == expected
    assert fake.calls == 1
    assert "upstream detail" not in detail and "API key not valid" not in detail and "bad request body" not in detail


def test_unexpected_exception_is_not_retried_and_not_leaked(install):
    status, fake, detail = status_of([TypeError("secret internals")], install)
    assert (status, fake.calls) == (500, 1)
    assert "secret internals" not in detail


def test_missing_api_key_returns_503(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", "")
    gs._client.cache_clear()
    with pytest.raises(HTTPException) as exc:
        call()
    assert exc.value.status_code == 503
    assert "GEMINI_API_KEY" not in exc.value.detail


# ---- bounded time ------------------------------------------------------------------------------

def test_second_attempt_timeout_is_clamped_to_time_left(install, clock):
    fake = install([server_error(503), GOOD], clock=clock, cost=40)  # attempt 1 burns 40 of 60 s
    call()
    assert fake.timeouts_ms == [40000, 20000]


def test_no_retry_when_too_little_time_left(install, clock):
    fake = install([server_error(503)] * 2, clock=clock, cost=40)
    settings.gemini_total_timeout_s = 45  # 5 s left, below the 8 s minimum
    with pytest.raises(HTTPException) as exc:
        call()
    assert exc.value.status_code == 503
    assert fake.calls == 1


def test_total_duration_never_exceeds_limit(install, clock):
    fake = install([httpx2.ReadTimeout("slow")] * 2, clock=clock, cost=1e9)  # each call "takes" forever
    settings.gemini_total_timeout_s = 60
    with pytest.raises(HTTPException):
        call()
    assert fake.calls == 1  # nothing left to retry with


class _SlowHandler(BaseHTTPRequestHandler):
    hits = 0

    def do_POST(self):
        type(self).hits += 1
        time.sleep(4)
        try:
            self.send_response(500)
            self.end_headers()
        except OSError:
            pass

    def log_message(self, *args):
        pass


def test_real_sdk_timeout_stops_a_hanging_server(monkeypatch):
    """Real genai client, real HTTP, against a local server that never answers in time."""
    _SlowHandler.hits = 0
    server = ThreadingHTTPServer(("127.0.0.1", 0), _SlowHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    real = genai.Client(
        api_key=SECRET_KEY, http_options=types.HttpOptions(base_url=f"http://127.0.0.1:{server.server_port}")
    )
    monkeypatch.setattr(gs, "_client", lambda: real)
    monkeypatch.setattr(settings, "gemini_attempt_timeout_s", 1)
    monkeypatch.setattr(settings, "gemini_total_timeout_s", 2.5)
    monkeypatch.setattr(settings, "gemini_min_retry_s", 0.5)
    try:
        start = time.perf_counter()
        with pytest.raises(HTTPException) as exc:
            call()
        elapsed = time.perf_counter() - start
    finally:
        server.shutdown()
        server.server_close()
    assert exc.value.status_code == 504
    assert _SlowHandler.hits == 2  # first attempt plus one retry
    assert 1.0 <= elapsed < 3.0  # bounded: the server would have held us for 4 s per attempt


# ---- logs and responses never carry secrets ----------------------------------------------------

def test_logs_and_responses_contain_no_secrets(install, caplog):
    leaky = "SECRET-UPSTREAM-DETAIL alice@example.com"
    scenarios = [
        [client_error(400, f"API key not valid {leaky} {SECRET_KEY}", "INVALID_ARGUMENT", "API_KEY_INVALID")],
        [client_error(429, leaky)],
        [server_error(503), server_error(503)],
        [f'{{"echo": "{leaky}"}}', f'{{"echo": "{leaky}"}}'],  # invalid model output that echoes data
        [httpx2.ConnectError(f"{leaky} {SECRET_KEY}")] * 2,
        [TypeError(f"{leaky} {SECRET_KEY}")],
    ]
    caplog.set_level(logging.DEBUG)
    details = []
    for outcomes in scenarios:
        install(outcomes)
        with pytest.raises(HTTPException) as exc:
            call()
        details.append(exc.value.detail)

    gemini_logs = [r for r in caplog.records if r.name == "app.gemini"]
    assert len(gemini_logs) >= len(scenarios)  # we do log diagnostics
    blob = caplog.text + " ".join(details)
    for secret in (SECRET_KEY, PROMPT, "alice@example.com", "SECRET-UPSTREAM-DETAIL"):
        assert secret not in blob


def test_sdk_loggers_are_quiet():
    for name in ("httpx", "httpx2", "httpcore", "google_genai"):
        assert logging.getLogger(name).level >= logging.WARNING


# ---- through the HTTP layer --------------------------------------------------------------------

@pytest.mark.parametrize(
    "failure,expected",
    [(client_error(429), 429), (client_error(401), 503), (server_error(503), 503), (httpx2.ReadTimeout("x"), 504)],
)
def test_http_endpoint_maps_errors(failure, expected, install):
    install([failure, failure])
    r = TestClient(app).post("/recipes/generate", json={"ingredients": ["egg"]})
    assert r.status_code == expected
    assert set(r.json()) == {"detail"}
    assert "upstream detail" not in r.text and SECRET_KEY not in r.text


# ---- caller-supplied output checks ---------------------------------------------------------------

def _reject_once_then_accept(rejections: int):
    seen = []

    def check(result):
        seen.append(result)
        if len(seen) <= rejections:
            raise OutputRejected("time_limit")

    return check, seen


def test_rejected_output_is_retried_then_accepted(install):
    fake = install([GOOD, GOOD])
    check, seen = _reject_once_then_accept(1)
    assert gs.generate_structured(PROMPT, Recipe, check=check).name == "Aloo Tamatar"
    assert fake.calls == 2 and len(seen) == 2


def test_rejected_output_twice_gives_502_and_logs_the_code(install, caplog):
    fake = install([GOOD, GOOD])
    check, _ = _reject_once_then_accept(2)
    caplog.set_level(logging.DEBUG)
    with pytest.raises(HTTPException) as exc:
        gs.generate_structured(PROMPT, Recipe, check=check)
    assert exc.value.status_code == 502 and fake.calls == 2
    assert "rejected=time_limit" in caplog.text
    assert PROMPT not in caplog.text + exc.value.detail
