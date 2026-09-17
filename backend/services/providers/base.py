from abc import ABC, abstractmethod
from backend.models import ReviewResponse


class BaseReviewProvider(ABC):
    """Abstract base class for all AI review providers."""

    @abstractmethod
    def review_code(self, code: str, language: str) -> ReviewResponse:
        """Analyze code and return structured review findings."""
        pass
