import pytest
from fastapi.testclient import TestClient

from backend.config import get_settings
from backend.main import app
from backend.models import IssueSeverity, ReviewIssue, ReviewMetadata, ReviewResponse
from backend.services.cache import get_cache
from backend.services.rate_limiter import get_rate_limiter
from backend.services.reviewer import review_code

client = TestClient(app)


@pytest.mark.anyio
async def test_reviewer_caching_integration(monkeypatch):
    get_cache().clear()
    settings = get_settings()
    settings.review_provider = "mock"

    code = "def sample(): return 1"
    lang = "python"
    mode = "comprehensive"

    # First call - cache miss
    res1 = await review_code(code, lang, mode)
    assert res1.metadata.cached is False

    # Second call with exact same parameters - cache hit
    res2 = await review_code(code, lang, mode)
    assert res2.metadata.cached is True
    assert res2.summary == res1.summary


@pytest.mark.anyio
async def test_reviewer_fallback_cascade(monkeypatch):
    get_cache().clear()
    settings = get_settings()
    settings.review_provider = "gemini"
    settings.fallback_provider = "mock"

    # Mock gemini to fail, mock provider to succeed
    from backend.services.providers.gemini import GeminiReviewProvider

    async def fail_gemini(*args, **kwargs):
        raise RuntimeError("Gemini 500 error")

    monkeypatch.setattr(GeminiReviewProvider, "review_code", fail_gemini)

    res = await review_code("def test_fn(): pass", "python", "comprehensive")
    # Fallback should have kicked in and returned mock provider result
    assert res.metadata.provider == "mock"


def test_rate_limit_middleware_blocks_after_limit():
    limiter = get_rate_limiter()
    limiter.reset()
    # Temporarily set rpm to 2
    original_rpm = limiter.rpm
    limiter.rpm = 2

    try:
        req_payload = {"code": "print('ok')", "language": "python"}
        # 1st request
        r1 = client.post("/review", json=req_payload)
        # 2nd request
        r2 = client.post("/review", json=req_payload)
        # 3rd request -> rate limited
        r3 = client.post("/review", json=req_payload)

        assert r3.status_code == 429
        assert "Rate limit exceeded" in r3.json()["detail"]
        assert "Retry-After" in r3.headers
    finally:
        limiter.rpm = original_rpm
        limiter.reset()
