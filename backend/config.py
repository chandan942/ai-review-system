from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Primary provider selection
    review_provider: Literal["gemini", "openai", "mock"] = "gemini"
    fallback_provider: Literal["openai", "mock", "none"] = "mock"

    # Gemini settings
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # OpenAI / OpenRouter settings
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"

    # Timeouts
    ai_timeout_seconds: float = 30.0

    # Cache settings
    cache_ttl_seconds: int = 300
    cache_max_size: int = 1000

    # Rate limiting
    rate_limit_rpm: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
