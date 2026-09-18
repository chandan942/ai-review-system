import hashlib
import time
from collections import OrderedDict
from typing import Optional

from backend.config import get_settings
from backend.models import ReviewResponse


class ReviewCache:
    """In-memory TTL hash-based review cache with SHA-256 deduplication and LRU eviction."""

    def __init__(self, max_size: Optional[int] = None, ttl_seconds: Optional[int] = None):
        settings = get_settings()
        self.max_size = max_size if max_size is not None else settings.cache_max_size
        self.ttl_seconds = ttl_seconds if ttl_seconds is not None else settings.cache_ttl_seconds
        # Key -> (ReviewResponse, expiry_timestamp)
        self._cache: OrderedDict[str, tuple[ReviewResponse, float]] = OrderedDict()

    @staticmethod
    def generate_key(code: str, language: str, mode: str, model: str) -> str:
        """Compute SHA-256 hash for given code, language, mode, and model."""
        raw = f"{code.strip()}||{language.lower()}||{mode.lower()}||{model.lower()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, code: str, language: str, mode: str, model: str) -> Optional[ReviewResponse]:
        """Retrieve cached review response if valid and not expired."""
        key = self.generate_key(code, language, mode, model)
        if key not in self._cache:
            return None

        response, expiry = self._cache[key]
        if time.time() > expiry:
            # Expired, remove
            del self._cache[key]
            return None

        # Move to end for LRU
        self._cache.move_to_end(key)
        # Return a copy with cached flag marked
        cached_response = response.model_copy(deep=True)
        cached_response.metadata.cached = True
        return cached_response

    def set(self, code: str, language: str, mode: str, model: str, response: ReviewResponse) -> None:
        """Store review response in cache with TTL and enforce max capacity."""
        key = self.generate_key(code, language, mode, model)
        expiry = time.time() + self.ttl_seconds

        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (response.model_copy(deep=True), expiry)

        # Evict oldest if exceeding max_size
        while len(self._cache) > self.max_size:
            self._cache.popitem(last=False)

    @property
    def size(self) -> int:
        """Current number of items in cache (including unpurged expired entries)."""
        return len(self._cache)

    def clear(self) -> None:
        """Clear all entries in cache."""
        self._cache.clear()


# Global singleton instance
_cache_instance: Optional[ReviewCache] = None


def get_cache() -> ReviewCache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = ReviewCache()
    return _cache_instance
