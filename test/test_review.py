import asyncio
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import IssueSeverity, ReviewMetadata, ReviewResponse
from backend.routes import review
from backend.services.providers.gemini import GeminiReviewProvider
from backend.services.providers.mock import MockReviewProvider
from backend.services.providers.openai_provider import OpenAIReviewProvider
from backend.services.reviewer import get_provider

client = TestClient(app)


def test_review_code_success(monkeypatch):
    async def fake_ai_review(code: str, language: str, mode: str):
        return ReviewResponse(
            summary="The code looks good.",
            issues=[],
            metadata=ReviewMetadata(
                language=language,
                mode=mode,
                lines_reviewed=2,
                review_time_ms=15,
                provider="mock",
                model="mock-deterministic",
                cached=False,
                request_id="test-id",
            ),
        )

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={
            "code": "def add(a, b):\n    return a + b",
            "language": "python",
            "mode": "security",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == "The code looks good."
    assert data["issues"] == []
    assert data["metadata"]["language"] == "python"
    assert data["metadata"]["mode"] == "security"
    assert data["metadata"]["lines_reviewed"] == 2
    assert "review_time_ms" in data["metadata"]


def test_review_defaults_to_python_and_comprehensive(monkeypatch):
    captured_args = {}

    async def fake_ai_review(code: str, language: str, mode: str):
        captured_args["language"] = language
        captured_args["mode"] = mode
        return ReviewResponse(
            summary="Defaults check passed.",
            issues=[],
            metadata=ReviewMetadata(
                language=language,
                mode=mode,
                lines_reviewed=1,
                review_time_ms=10,
                provider="mock",
                model="mock-deterministic",
                cached=False,
            ),
        )

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={"code": "print('hello')"},
    )
    assert response.status_code == 200
    assert captured_args["language"] == "python"
    assert captured_args["mode"] == "comprehensive"


def test_review_empty_code_rejected():
    response = client.post(
        "/review",
        json={"code": "", "language": "python"},
    )
    assert response.status_code == 422


def test_review_whitespace_code_rejected():
    response = client.post(
        "/review",
        json={"code": "   \n\t  ", "language": "python"},
    )
    assert response.status_code == 422


def test_review_code_too_long_rejected():
    response = client.post(
        "/review",
        json={"code": "a" * 15001, "language": "python"},
    )
    assert response.status_code == 422


def test_review_invalid_language_rejected():
    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "cobol"},
    )
    assert response.status_code == 422


def test_review_invalid_mode_rejected():
    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "python", "mode": "invalid_mode"},
    )
    assert response.status_code == 422


def test_mock_provider_clean_code():
    provider = MockReviewProvider()
    res = asyncio.run(provider.review_code("def add(a, b): return a + b", "python", "comprehensive"))
    assert "Mock analysis complete" in res.summary
    assert len(res.issues) == 0
    assert res.metadata.lines_reviewed == 1
    assert res.metadata.provider == "mock"


def test_mock_provider_detects_eval():
    provider = MockReviewProvider()
    res = asyncio.run(provider.review_code("eval('import os')", "python", "security"))
    assert len(res.issues) == 1
    assert res.issues[0].severity == IssueSeverity.CRITICAL
    assert "eval()" in res.issues[0].message
    assert res.issues[0].category == "Security"


def test_provider_factory():
    gemini_p = get_provider("gemini")
    assert isinstance(gemini_p, GeminiReviewProvider)

    mock_p = get_provider("mock")
    assert isinstance(mock_p, MockReviewProvider)

    openai_p = get_provider("openai")
    assert isinstance(openai_p, OpenAIReviewProvider)

    with pytest.raises(ValueError, match="Unsupported review provider"):
        get_provider("unknown_provider")
