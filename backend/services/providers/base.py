from abc import ABC, abstractmethod
from backend.models import ReviewResponse


class BaseReviewProvider(ABC):
    """Abstract base class for all AI review providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider identifier (e.g. 'gemini', 'openai', 'mock')."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the model identifier used by this provider."""
        ...

    @abstractmethod
    async def review_code(self, code: str, language: str, mode: str) -> ReviewResponse:
        """Analyze code and return structured review findings."""
        ...
