import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_batch_review_single_file():
    payload = {
        "files": [
            {
                "filename": "app.py",
                "code": "def divide(a, b):\n    return a / b\n",
                "language": "python",
                "mode": "comprehensive"
            }
        ],
        "default_language": "python",
        "default_mode": "comprehensive"
    }
    response = client.post("/batch-review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == 1
    assert data["successful_files"] == 1
    assert data["failed_files"] == 0
    assert len(data["results"]) == 1
    assert data["results"][0]["filename"] == "app.py"
    assert data["results"][0]["review"] is not None


def test_batch_review_multiple_files():
    payload = {
        "files": [
            {
                "filename": "math_utils.py",
                "code": "def add(x, y):\n    return x + y\n",
                "language": "python",
                "mode": "comprehensive"
            },
            {
                "filename": "index.js",
                "code": "function greet(name) { return 'Hello ' + name; }",
                "language": "javascript",
                "mode": "security"
            }
        ],
        "default_language": "python",
        "default_mode": "comprehensive"
    }
    response = client.post("/batch-review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_files"] == 2
    assert data["successful_files"] == 2
    assert data["failed_files"] == 0
    assert len(data["results"]) == 2
    assert data["results"][0]["filename"] == "math_utils.py"
    assert data["results"][1]["filename"] == "index.js"


def test_batch_review_empty_code_validation():
    payload = {
        "files": [
            {
                "filename": "empty.py",
                "code": "   ",
                "language": "python"
            }
        ]
    }
    response = client.post("/batch-review", json=payload)
    assert response.status_code == 422


def test_batch_review_empty_files_list():
    payload = {
        "files": []
    }
    response = client.post("/batch-review", json=payload)
    assert response.status_code == 422
