from fastapi.testclient import TestClient

from backend.exceptions import (
    ProviderError,
    ProviderUnavailableError,
    RateLimitExceededError,
    ReviewTimeoutError,
)
from backend.main import app
from backend.routes import review

client = TestClient(app)


def test_timeout_error_maps_to_408(monkeypatch):
    async def fake_timeout(*args, **kwargs):
        raise ReviewTimeoutError(timeout_seconds=15)

    monkeypatch.setattr(review, "ai_review_code", fake_timeout)

    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "python"},
    )
    assert response.status_code == 408
    assert "timed out after 15s" in response.json()["detail"]


def test_rate_limit_error_maps_to_429(monkeypatch):
    async def fake_rate_limit(*args, **kwargs):
        raise RateLimitExceededError(retry_after=45)

    monkeypatch.setattr(review, "ai_review_code", fake_rate_limit)

    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "python"},
    )
    assert response.status_code == 429
    assert "Retry after 45s" in response.json()["detail"]
    assert response.headers.get("Retry-After") == "45"


def test_provider_error_maps_to_502(monkeypatch):
    async def fake_provider_error(*args, **kwargs):
        raise ProviderError(provider="gemini", detail="Upstream server 500")

    monkeypatch.setattr(review, "ai_review_code", fake_provider_error)

    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "python"},
    )
    assert response.status_code == 502
    assert "Provider 'gemini' error: Upstream server 500" in response.json()["detail"]


def test_provider_unavailable_maps_to_503(monkeypatch):
    async def fake_unavailable(*args, **kwargs):
        raise ProviderUnavailableError("All providers are down.")

    monkeypatch.setattr(review, "ai_review_code", fake_unavailable)

    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "python"},
    )
    assert response.status_code == 503
    assert "All providers are down." in response.json()["detail"]
