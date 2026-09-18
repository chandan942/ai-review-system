import pytest
from backend.exceptions import RateLimitExceededError
from backend.services.rate_limiter import RateLimiter


def test_rate_limiter_allows_under_limit():
    limiter = RateLimiter(requests_per_minute=3, window_seconds=60)
    client_ip = "192.168.1.10"

    # 3 allowed
    limiter.check(client_ip)
    limiter.check(client_ip)
    limiter.check(client_ip)

    # 4th should raise
    with pytest.raises(RateLimitExceededError) as exc_info:
        limiter.check(client_ip)

    assert exc_info.value.retry_after is not None
    assert exc_info.value.retry_after > 0


def test_rate_limiter_ip_isolation():
    limiter = RateLimiter(requests_per_minute=2, window_seconds=60)
    ip_a = "10.0.0.1"
    ip_b = "10.0.0.2"

    limiter.check(ip_a)
    limiter.check(ip_a)

    # ip_a is blocked
    with pytest.raises(RateLimitExceededError):
        limiter.check(ip_a)

    # ip_b is unaffected
    limiter.check(ip_b)
    limiter.check(ip_b)

    with pytest.raises(RateLimitExceededError):
        limiter.check(ip_b)


def test_rate_limiter_reset():
    limiter = RateLimiter(requests_per_minute=1, window_seconds=60)
    ip = "10.0.0.5"

    limiter.check(ip)
    with pytest.raises(RateLimitExceededError):
        limiter.check(ip)

    limiter.reset()
    # Now allowed again
    limiter.check(ip)
