from typing import Optional
from backend.config import get_settings
from backend.exceptions import ProviderUnavailableError, ReviewError
from backend.models import ReviewResponse
from backend.services.cache import get_cache
from backend.services.providers.base import BaseReviewProvider
from backend.services.providers.gemini import GeminiReviewProvider
from backend.services.providers.mock import MockReviewProvider
from backend.services.providers.openai_provider import OpenAIReviewProvider
from backend.utils.logger import get_current_request_id, get_logger

logger = get_logger("reviewer")


def get_provider(provider_name: Optional[str] = None) -> BaseReviewProvider:
    """Factory function to instantiate the selected review provider."""
    selected = provider_name or get_settings().review_provider
    selected_lower = selected.lower().strip()

    if selected_lower == "gemini":
        return GeminiReviewProvider()
    elif selected_lower == "openai":
        return OpenAIReviewProvider()
    elif selected_lower == "mock":
        return MockReviewProvider()
    else:
        raise ValueError(f"Unsupported review provider: '{selected}'")


async def review_code(code: str, language: str, mode: str = "comprehensive") -> ReviewResponse:
    """Orchestrates code review with cache lookup and multi-provider fallback."""
    settings = get_settings()
    cache = get_cache()
    primary_provider = get_provider(settings.review_provider)

    # 1. Check cache
    cached_result = cache.get(
        code=code,
        language=language,
        mode=mode,
        model=primary_provider.model_name,
    )
    if cached_result:
        req_id = get_current_request_id()
        cached_result.metadata.request_id = req_id
        logger.info(f"Cache hit for {language} review in mode '{mode}'.")
        return cached_result

    # 2. Attempt primary provider
    logger.info(
        f"Attempting review with primary provider '{primary_provider.provider_name}' "
        f"({primary_provider.model_name}) for {language} [{mode}]."
    )

    review_result: Optional[ReviewResponse] = None
    primary_error: Optional[Exception] = None

    try:
        review_result = await primary_provider.review_code(code, language, mode)
    except Exception as e:
        primary_error = e
        logger.error(
            f"Primary provider '{primary_provider.provider_name}' failed: {e}",
            exc_info=True,
        )

    # 3. Fallback cascade if primary provider failed
    if review_result is None:
        fallback_name = settings.fallback_provider
        if fallback_name and fallback_name.lower() != "none" and fallback_name.lower() != primary_provider.provider_name:
            if settings.fallback_on_failure:
                try:
                    fallback_provider = get_provider(fallback_name)
                    logger.info(f"Triggering fallback provider '{fallback_provider.provider_name}'.")
                    review_result = await fallback_provider.review_code(code, language, mode)

                    err_msg = str(primary_error) if primary_error else "Unknown error"
                    # Keep error message concise for metadata
                    short_err = err_msg if len(err_msg) <= 120 else err_msg[:117] + "..."

                    logger.warning(
                        f"Review served via fallback '{fallback_provider.provider_name}' "
                        f"because '{primary_provider.provider_name}' failed: {err_msg}"
                    )

                    if review_result.metadata:
                        review_result.metadata.provider = f"{fallback_provider.provider_name}_fallback_from_{primary_provider.provider_name}:{short_err}"
                except Exception as fb_err:
                    logger.error(f"Fallback provider '{fallback_name}' also failed: {fb_err}", exc_info=True)
                    if isinstance(primary_error, ReviewError):
                        raise primary_error
                    raise ProviderUnavailableError(
                        f"Both primary ('{primary_provider.provider_name}') and fallback ('{fallback_name}') failed."
                    ) from fb_err
            else:
                logger.error(f"Fallback disabled. Primary provider '{primary_provider.provider_name}' failed.")
                if isinstance(primary_error, ReviewError):
                    raise primary_error
                raise ProviderUnavailableError(
                    f"Primary provider '{primary_provider.provider_name}' failed and fallback is disabled."
                ) from primary_error
        else:
            if isinstance(primary_error, ReviewError):
                raise primary_error
            raise ProviderUnavailableError(
                f"Primary provider '{primary_provider.provider_name}' failed and no fallback configured."
            ) from primary_error

    # 4. Attach request_id and update cache
    req_id = get_current_request_id()
    review_result.metadata.request_id = req_id

    cache.set(
        code=code,
        language=language,
        mode=mode,
        model=primary_provider.model_name,
        response=review_result,
    )

    logger.info(
        f"Review successfully completed by '{review_result.metadata.provider}' "
        f"in {review_result.metadata.review_time_ms}ms with {len(review_result.issues)} issue(s)."
    )
    return review_result