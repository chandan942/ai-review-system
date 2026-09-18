"""Domain exceptions and FastAPI exception handlers for the AI Review System."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Domain exception hierarchy
# ---------------------------------------------------------------------------

class ReviewError(Exception):
    """Base exception for all review-related errors."""

    def __init__(self, message: str = "An error occurred during code review."):
        self.message = message
        super().__init__(self.message)


class ReviewTimeoutError(ReviewError):
    """Raised when an AI provider exceeds the configured timeout."""

    def __init__(self, timeout_seconds: float | None = None):
        msg = "AI review request timed out."
        if timeout_seconds is not None:
            msg = f"AI review request timed out after {timeout_seconds}s."
        super().__init__(msg)


class RateLimitExceededError(ReviewError):
    """Raised when a client exceeds the request rate limit."""

    def __init__(self, retry_after: int | None = None):
        self.retry_after = retry_after
        msg = "Rate limit exceeded. Please slow down."
        if retry_after is not None:
            msg = f"Rate limit exceeded. Retry after {retry_after}s."
        super().__init__(msg)


class ProviderError(ReviewError):
    """Raised when a provider returns an unexpected error (bad gateway)."""

    def __init__(self, provider: str, detail: str = ""):
        self.provider = provider
        msg = f"Provider '{provider}' returned an error."
        if detail:
            msg = f"Provider '{provider}' error: {detail}"
        super().__init__(msg)


class ProviderUnavailableError(ReviewError):
    """Raised when no provider is available to handle the request."""

    def __init__(self, message: str = "No AI review provider is currently available."):
        super().__init__(message)


# ---------------------------------------------------------------------------
# FastAPI exception handler registration
# ---------------------------------------------------------------------------

def register_exception_handlers(app: FastAPI) -> None:
    """Install exception handlers that map domain errors to HTTP status codes."""

    @app.exception_handler(ReviewTimeoutError)
    async def _handle_timeout(request: Request, exc: ReviewTimeoutError):
        return JSONResponse(
            status_code=408,
            content={"detail": exc.message},
        )

    @app.exception_handler(RateLimitExceededError)
    async def _handle_rate_limit(request: Request, exc: RateLimitExceededError):
        headers = {}
        if exc.retry_after is not None:
            headers["Retry-After"] = str(exc.retry_after)
        return JSONResponse(
            status_code=429,
            content={"detail": exc.message},
            headers=headers,
        )

    @app.exception_handler(ProviderError)
    async def _handle_provider_error(request: Request, exc: ProviderError):
        return JSONResponse(
            status_code=502,
            content={"detail": exc.message},
        )

    @app.exception_handler(ProviderUnavailableError)
    async def _handle_unavailable(request: Request, exc: ProviderUnavailableError):
        return JSONResponse(
            status_code=503,
            content={"detail": exc.message},
        )
