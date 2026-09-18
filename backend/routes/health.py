from fastapi import APIRouter
from backend.config import get_settings
from backend.models import HealthResponse, ReviewMode, SupportedLanguage
from backend.services.cache import get_cache
from backend.services.reviewer import get_provider

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check and diagnostics."""
    settings = get_settings()
    try:
        provider = get_provider(settings.review_provider)
        provider_name = provider.provider_name
        model_name = provider.model_name
    except Exception:
        provider_name = settings.review_provider
        model_name = "unknown"

    cache = get_cache()

    return HealthResponse(
        status="healthy",
        provider=provider_name,
        model=model_name,
        cache_size=cache.size,
        supported_languages=[lang.value for lang in SupportedLanguage],
        supported_modes=[mode.value for mode in ReviewMode],
        version="1.0.0",
    )
