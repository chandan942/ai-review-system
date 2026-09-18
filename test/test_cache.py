import time
from backend.models import IssueSeverity, ReviewIssue, ReviewMetadata, ReviewResponse
from backend.services.cache import ReviewCache


def _make_dummy_response(provider: str = "mock") -> ReviewResponse:
    return ReviewResponse(
        summary="Cache test summary",
        issues=[
            ReviewIssue(
                line=1,
                message="Test issue",
                severity=IssueSeverity.LOW,
                suggestion="Fix it",
            )
        ],
        metadata=ReviewMetadata(
            language="python",
            mode="comprehensive",
            lines_reviewed=10,
            review_time_ms=50,
            provider=provider,
            model="test-model",
            cached=False,
        ),
    )


def test_cache_set_and_get():
    cache = ReviewCache(max_size=10, ttl_seconds=60)
    code = "def foo(): pass"
    lang = "python"
    mode = "comprehensive"
    model = "gemini-2.5-flash"

    # Initially empty
    assert cache.get(code, lang, mode, model) is None

    # Store
    resp = _make_dummy_response()
    cache.set(code, lang, mode, model, resp)
    assert cache.size == 1

    # Fetch
    cached = cache.get(code, lang, mode, model)
    assert cached is not None
    assert cached.summary == resp.summary
    assert cached.metadata.cached is True  # Cached flag marked True


def test_cache_miss_on_different_params():
    cache = ReviewCache(max_size=10, ttl_seconds=60)
    code = "def foo(): pass"
    resp = _make_dummy_response()

    cache.set(code, "python", "comprehensive", "model-a", resp)

    # Different language
    assert cache.get(code, "javascript", "comprehensive", "model-a") is None
    # Different mode
    assert cache.get(code, "python", "security", "model-a") is None
    # Different model
    assert cache.get(code, "python", "comprehensive", "model-b") is None


def test_cache_ttl_expiration():
    cache = ReviewCache(max_size=10, ttl_seconds=1)  # 1 second TTL
    code = "print(123)"
    resp = _make_dummy_response()

    cache.set(code, "python", "comprehensive", "model-a", resp)
    assert cache.get(code, "python", "comprehensive", "model-a") is not None

    time.sleep(1.1)  # Wait for TTL to expire
    assert cache.get(code, "python", "comprehensive", "model-a") is None


def test_cache_lru_eviction():
    cache = ReviewCache(max_size=2, ttl_seconds=60)

    r1 = _make_dummy_response("p1")
    r2 = _make_dummy_response("p2")
    r3 = _make_dummy_response("p3")

    cache.set("code1", "python", "comprehensive", "m", r1)
    cache.set("code2", "python", "comprehensive", "m", r2)
    assert cache.size == 2

    # Add 3rd item -> oldest (code1) should be evicted
    cache.set("code3", "python", "comprehensive", "m", r3)
    assert cache.size == 2
    assert cache.get("code1", "python", "comprehensive", "m") is None
    assert cache.get("code2", "python", "comprehensive", "m") is not None
    assert cache.get("code3", "python", "comprehensive", "m") is not None


def test_cache_clear():
    cache = ReviewCache(max_size=10, ttl_seconds=60)
    cache.set("code", "python", "comprehensive", "m", _make_dummy_response())
    assert cache.size == 1
    cache.clear()
    assert cache.size == 0
