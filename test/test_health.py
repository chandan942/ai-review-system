import pytest
from fastapi.testclient import TestClient

from backend.config import get_settings
from backend.main import app
from backend.routes import review
from backend.services.providers.gemini import GeminiReviewProvider
from backend.services.providers.mock import MockReviewProvider
from backend.services.reviewer import get_provider
from backend.utils.prompt_builder import build_review_prompt

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Code Reviewer API is running!"}


def test_review_code_success(monkeypatch):
    fake_response = {
        "summary": "The code looks good.",
        "issues": []
    }

    def fake_ai_review(code: str, language: str):
        return fake_response

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={
            "code": "def add(a, b):\n    return a + b",
            "language": "python"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "issues" in data
    assert data["summary"] == "The code looks good."
    assert data["issues"] == []


def test_review_defaults_to_python(monkeypatch):
    fake_response = {
        "summary": "The code looks good.",
        "issues": []
    }

    def fake_ai_review(code: str, language: str):
        assert language == "python"
        return fake_response

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={"code": "print('hello')"}
    )
    assert response.status_code == 200


def test_review_empty_code_rejected():
    response = client.post(
        "/review",
        json={"code": "", "language": "python"}
    )
    assert response.status_code == 422


def test_review_whitespace_code_rejected():
    response = client.post(
        "/review",
        json={"code": "   \n\t  ", "language": "python"}
    )
    assert response.status_code == 422


def test_review_code_too_long_rejected():
    response = client.post(
        "/review",
        json={"code": "a" * 10001, "language": "python"}
    )
    assert response.status_code == 422


def test_review_invalid_language_rejected():
    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "cobol"}
    )
    assert response.status_code == 422


def test_review_ai_failure(monkeypatch):
    def fake_ai_review(code: str, language: str):
        raise RuntimeError("AI service unavailable")

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={"code": "print('hello')", "language": "python"}
    )
    assert response.status_code == 500
    assert "AI service unavailable" in response.json()["detail"]


# --- Phase 2 Specific Unit Tests ---

def test_mock_provider_clean_code():
    provider = MockReviewProvider()
    res = provider.review_code("def add(a, b): return a + b", "python")
    assert "Mock analysis complete" in res.summary
    assert len(res.issues) == 0


def test_mock_provider_detects_eval():
    provider = MockReviewProvider()
    res = provider.review_code("eval('import os')", "python")
    assert len(res.issues) == 1
    assert res.issues[0].severity == "Critical"
    assert "eval()" in res.issues[0].message


def test_prompt_builder_numbered_code():
    code = "line_one()\nline_two()"
    prompt = build_review_prompt(code, "python")
    assert "1 | line_one()" in prompt
    assert "2 | line_two()" in prompt
    assert "Review the following python code:" in prompt


def test_provider_factory():
    gemini_p = get_provider("gemini")
    assert isinstance(gemini_p, GeminiReviewProvider)

    mock_p = get_provider("mock")
    assert isinstance(mock_p, MockReviewProvider)

    with pytest.raises(ValueError):
        get_provider("unknown_provider")


def test_gemini_missing_api_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    get_settings.cache_clear()

    provider = GeminiReviewProvider()
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY is missing"):
        provider.review_code("print('hi')", "python")