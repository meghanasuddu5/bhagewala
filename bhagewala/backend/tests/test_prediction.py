import pytest


def test_model_info_endpoint(client):
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["is_loaded"] is True
    assert data["model_version"] == "V1.3-Hybrid"
    assert data["base_model"] == "V1.2-Two-Stage"
    assert data["target_units"] == "BOPD"
    assert len(data["features"]) == 50
    assert data["positive_class_definition"] == "Class 1: Zero production event"
    assert "metrics" in data


def test_sample_features_endpoint(client):
    response = client.get("/api/v1/model/features/sample")
    assert response.status_code == 200
    data = response.json()
    assert "features" in data
    assert len(data["features"]) == 50
    assert "current_oil_rate_bopd" in data


def test_prediction_endpoint_standard(client, sample_feature_payload):
    response = client.post("/api/v1/predict", json=sample_feature_payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_oil_rate_bopd" in data
    assert "predicted_zero_probability" in data
    assert data["predicted_zero_flag"] in [0, 1]
    assert data["units"] == "BOPD"
    assert data["model_version"] == "V1.3-Hybrid"
    assert data["prediction_strategy"] in ["persistence_fallback", "v1_2_regression"]

    # Verify strategy consistency
    if data["predicted_zero_flag"] == 1:
        assert data["predicted_oil_rate_bopd"] == sample_feature_payload["current_oil_rate_bopd"]
        assert data["prediction_strategy"] == "persistence_fallback"
    else:
        assert data["prediction_strategy"] == "v1_2_regression"
        assert data["predicted_oil_rate_bopd"] == data["raw_regression_prediction_bopd"]


def test_prediction_endpoint_zero_fallback(client, sample_feature_payload):
    """
    Test zero-flag persistence fallback condition:
    Using benchmark historical row (Well 0cacd33e... 2020-08-29) where classifier zero probability
    exceeds threshold (0.150447 >= 0.15), triggering the V1.3 persistence fallback.
    """
    payload = sample_feature_payload.copy()
    feat = payload["features"].copy()
    # Apply historical values from ENR004 benchmark row that flags zero production
    feat.update({
        "oil_rate_bopd": 1378.84,
        "gas_rate_mcfd": 4502.45,
        "water_rate_bwpd": 8.1,
        "reservoir_pressure_psia": 8305.1,
        "flowing_wellhead_pressure_psia": 1842.3,
        "flowing_bottomhole_pressure_psia": 4620.3,
        "drawdown_psia": 3684.8,
        "esp_frequency_hz": 47.1,
        "rod_pump_spm": 2.0,
        "rod_pump_fillage_pct": 0.0,
        "gas_lift_rate_mmscfd": 0.0,
        "bsw_pct": 0.58,
        "gor_scf_per_bbl": 3265.0,
        "wor": 0.006,
        "oil_rate_bopd_lag1": 1592.16,
        "gas_rate_mcfd_lag1": 4610.0,
        "water_rate_bwpd_lag1": 174.94,
        "reservoir_pressure_psia_lag1": 8305.2,
        "flowing_wellhead_pressure_psia_lag1": 1850.0,
        "flowing_bottomhole_pressure_psia_lag1": 4625.0,
        "drawdown_psia_lag1": 3680.2,
        "esp_frequency_hz_lag1": 47.1,
        "rod_pump_spm_lag1": 2.0,
        "rod_pump_fillage_pct_lag1": 0.0,
        "gas_lift_rate_mmscfd_lag1": 0.0,
        "bsw_pct_lag1": 9.9,
        "gor_scf_per_bbl_lag1": 2895.0,
        "wor_lag1": 0.11,
        "oil_rate_bopd_lag7": 1400.0,
        "gas_rate_mcfd_lag7": 4200.0,
        "water_rate_bwpd_lag7": 150.0,
        "reservoir_pressure_psia_lag7": 8308.0,
        "flowing_wellhead_pressure_psia_lag7": 1840.0,
        "flowing_bottomhole_pressure_psia_lag7": 4615.0,
        "drawdown_psia_lag7": 3693.0,
        "esp_frequency_hz_lag7": 47.0,
        "rod_pump_spm_lag7": 2.0,
        "rod_pump_fillage_pct_lag7": 0.0,
        "gas_lift_rate_mmscfd_lag7": 0.0,
        "bsw_pct_lag7": 9.7,
        "gor_scf_per_bbl_lag7": 3000.0,
        "wor_lag7": 0.107,
        "oil_rate_bopd_rolling7": 1480.0,
        "water_rate_bwpd_rolling7": 120.0,
        "gas_rate_mcfd_rolling7": 4400.0,
        "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
        "field_id": "acc35770-82ba-4b5f-65e5-17c372a7539a",
        "well_status": "PRODUCING",
        "day_of_week": 5,
        "month": 8,
    })

    current_rate = 1378.84
    payload["features"] = feat
    payload["current_oil_rate_bopd"] = current_rate

    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_zero_flag"] == 1
    assert data["prediction_strategy"] == "persistence_fallback"
    assert data["predicted_oil_rate_bopd"] == current_rate
