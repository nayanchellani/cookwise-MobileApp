from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    # Time limits in seconds. The total covers all attempts and the wait between them.
    gemini_attempt_timeout_s: float = 40
    gemini_total_timeout_s: float = 60
    gemini_min_retry_s: float = 8  # do not start a retry with less than this left


settings = Settings()
