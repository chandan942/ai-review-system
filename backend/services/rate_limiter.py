import time
from collections import defaultdict
from typing import Optional

from backend.config import get_settings
from backend.exceptions import RateLimitExceededError


class RateLimiter:
    """Sliding-window in-memory rate limiter per client IP."""

    def __init__(self, requests_per_minute: Optional[int] = None, window_seconds: float = 60.0):
        settings = get_settings()
        self.rpm = requests_per_minute if requests_per_minute is not None else settings.rate_limit_rpm
        self.window_seconds = window_seconds
        # client_ip -> list of request timestamps
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, client_ip: str) -> None:
        """Check if request from client_ip is allowed under the sliding window.

        Raises RateLimitExceededError with retry_after if exceeded.
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Prune older timestamps
        timestamps = [t for t in self._requests[client_ip] if t > window_start]

        if len(timestamps) >= self.rpm:
            # Calculate retry after time in seconds
            oldest_in_window = timestamps[0]
            retry_after = max(1, int(oldest_in_window + self.window_seconds - now))
            self._requests[client_ip] = timestamps
            raise RateLimitExceededError(retry_after=retry_after)

        timestamps.append(now)
        self._requests[client_ip] = timestamps

    def reset(self) -> None:
        """Reset all rate limiter tracking."""
        self._requests.clear()


# Global singleton instance
_limiter_instance: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    global _limiter_instance
    if _limiter_instance is None:
        _limiter_instance = RateLimiter()
    return _limiter_instance
