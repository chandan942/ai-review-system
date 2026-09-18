import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "AI Code Reviewer API is running!"
    assert data["version"] == "1.0.0"


def test_health_diagnostics_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "provider" in data
    assert "model" in data
    assert "cache_size" in data
    assert isinstance(data["supported_languages"], list)
    assert "python" in data["supported_languages"]
    assert "typescript" in data["supported_languages"]
    assert isinstance(data["supported_modes"], list)
    assert "comprehensive" in data["supported_modes"]
    assert "security" in data["supported_modes"]
    assert "performance" in data["supported_modes"]
    assert "style" in data["supported_modes"]
    assert data["version"] == "1.0.0"


def test_x_request_id_header():
    # Verify that X-Request-ID is generated and returned
    response = client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers

    # Verify custom X-Request-ID propagation
    custom_id = "test-custom-request-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_id