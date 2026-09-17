from backend.config import get_settings
from backend.models import ReviewResponse
from backend.services.providers.base import BaseReviewProvider
from backend.services.providers.gemini import GeminiReviewProvider
from backend.services.providers.mock import MockReviewProvider


def get_provider(provider_name: str | None = None) -> BaseReviewProvider:
    """Factory function to instantiate the selected review provider."""
    selected = provider_name or get_settings().review_provider
    selected_lower = selected.lower().strip()

    if selected_lower == "gemini":
        return GeminiReviewProvider()
    elif selected_lower == "mock":
        return MockReviewProvider()
    else:
        raise ValueError(f"Unsupported review provider: '{selected}'")


def review_code(code: str, language: str) -> ReviewResponse:
    """Delegate review execution to configured provider."""
    provider = get_provider()
    return provider.review_code(code, language)