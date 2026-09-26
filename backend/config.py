from functools import lru_cache
from typing import Literal
import logging
from pydantic_settings import BaseSettings, SettingsConfigDict


logger = logging.getLogger("config")


class Settings(BaseSettings):
    # Primary provider selection
    review_provider: Literal["gemini", "openai", "mock"] = "gemini"
    fallback_provider: Literal["openai", "mock", "none"] = "mock"
    # Whether to automatically fallback on failure (set to False to require explicit opt-in)
    fallback_on_failure: bool = True

    # Gemini settings
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"  # Active Google Gemini model

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
    settings = Settings()
    if settings.gemini_api_key:
        key = settings.gemini_api_key
        redacted = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "****"
        logger.info(f"Gemini API key loaded: {redacted} (length: {len(key)})")
    else:
        logger.warning("GEMINI_API_KEY is not set. Using mock provider if configured.")
    return settings