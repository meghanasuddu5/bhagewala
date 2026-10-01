import pytest


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["model_version"] == "V1.3-Hybrid"
    assert data["feature_count"] == 50
    assert data["version"] == "1.0.0"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Baghewala" in data["service"]
    assert data["model_status"]["loaded"] is True
    assert data["model_status"]["features_required"] == 50
