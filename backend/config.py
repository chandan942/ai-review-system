from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    review_provider: Literal["gemini", "mock"] = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    ai_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
