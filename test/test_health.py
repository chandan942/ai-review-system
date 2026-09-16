from fastapi.testclient import TestClient

from backend.main import app
from backend.routes import review


client = TestClient(app)


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
        json={
            "code": "print('hello')"
        }
    )

    assert response.status_code == 200

def test_review_empty_code_rejected():
    response = client.post(
        "/review",
        json={
            "code": "",
            "language": "python"
        }
    )

    assert response.status_code == 422


def test_review_whitespace_code_rejected():
    response = client.post(
        "/review",
        json={
            "code": "   \n\t  ",
            "language": "python"
        }
    )

    assert response.status_code == 422


def test_review_code_too_long_rejected():
    response = client.post(
        "/review",
        json={
            "code": "a" * 10001,
            "language": "python"
        }
    )

    assert response.status_code == 422


def test_review_invalid_language_rejected():
    response = client.post(
        "/review",
        json={
            "code": "print('hello')",
            "language": "cobol"
        }
    )

    assert response.status_code == 422


def test_review_supported_language_accepted(monkeypatch):
    fake_response = {
        "summary": "JavaScript code looks good.",
        "issues": []
    }

    def fake_ai_review(code: str, language: str):
        return fake_response

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={
            "code": "console.log('hello');",
            "language": "javascript"
        }
    )

    assert response.status_code == 200
    assert response.json()["summary"] == "JavaScript code looks good."

def test_review_invalid_request():
    response = client.post(
        "/review",
        json={
            "language": "python"
        }
    )

    assert response.status_code == 422

def test_review_ai_failure(monkeypatch):
    def fake_ai_review(code: str, language: str):
        raise RuntimeError("AI service unavailable")

    monkeypatch.setattr(review, "ai_review_code", fake_ai_review)

    response = client.post(
        "/review",
        json={
            "code": "print('hello')",
            "language": "python"
        }
    )

    assert response.status_code == 500

    data = response.json()

    assert "detail" in data
    assert "AI service unavailable" in data["detail"]


def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Code Reviewer API is running!"}