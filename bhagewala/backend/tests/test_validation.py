import pytest


def test_predict_missing_features(client):
    payload = {
        "current_oil_rate_bopd": 400.0,
        "features": {
            "oil_rate_bopd": 400.0,
            "gas_rate_mcfd": 500.0,
            # Missing remaining 48 features
        },
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "Incomplete feature set" in data["detail"]


def test_predict_negative_oil_rate(client, sample_feature_payload):
    payload = sample_feature_payload.copy()
    payload["current_oil_rate_bopd"] = -50.0  # Invalid rate
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422


def test_scenario_not_found(client):
    response = client.get("/api/v1/scenarios/non-existent-scenario-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_digital_twin_state_invalid_negative_pressure(client):
    payload = {
        "reservoir": {
            "reservoir_pressure_psia": -100.0,  # Invalid ge=0
        },
        "steam_injection": {
            "steam_injection_rate_tpd": 100.0,
        },
        "well_production": {
            "current_oil_rate_bopd": 300.0,
        },
        "surface_system": {
            "pump_power_kw": 40.0,
        },
    }
    response = client.post("/api/v1/digital-twin/state", json=payload)
    assert response.status_code == 422
