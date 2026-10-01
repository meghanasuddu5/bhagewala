import pytest


def test_get_digital_twin_state(client):
    response = client.get("/api/v1/digital-twin/state")
    assert response.status_code == 200
    data = response.json()
    assert "state_id" in data
    assert "reservoir" in data
    assert "steam_injection" in data
    assert "well_production" in data
    assert "surface_system" in data
    assert "model_mapping_summary" in data

    # Verify reservoir default heavy oil parameters
    res = data["reservoir"]
    assert res["reservoir_pressure_psia"] > 0
    assert res["oil_viscosity_cp"] >= 10000.0


def test_update_digital_twin_state(client):
    payload = {
        "reservoir": {
            "reservoir_pressure_psia": 3850.0,
            "reservoir_temperature_deg_c": 48.0,
            "oil_viscosity_cp": 14000.0,
            "reservoir_depth_m": 1050.0,
            "reservoir_thickness_m": 18.0,
            "oil_saturation_pct": 66.0,
        },
        "steam_injection": {
            "steam_injection_rate_tpd": 140.0,
            "steam_pressure_bar": 68.0,
            "steam_temperature_deg_c": 282.0,
            "steam_quality_pct": 81.0,
            "cumulative_injected_steam_tonnes": 4800.0,
            "css_cycle_stage": "Injection",
        },
        "well_production": {
            "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
            "current_oil_rate_bopd": 0.0,  # Shut-in during injection
            "water_rate_bwpd": 0.0,
            "gas_rate_mcfd": 0.0,
            "pump_type": "Sucker Rod Pump (SRP)",
            "pump_speed": 0.0,
            "pump_operating_status": "Idle",
        },
        "surface_system": {
            "pump_power_kw": 0.0,
            "energy_consumption_kwh_per_day": 50.0,
            "equipment_status": "Idle",
        },
        "notes": "State updated during CSS injection phase.",
    }
    response = client.post("/api/v1/digital-twin/state", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["reservoir"]["reservoir_pressure_psia"] == 3850.0
    assert data["steam_injection"]["css_cycle_stage"] == "Injection"
    assert data["well_production"]["current_oil_rate_bopd"] == 0.0

    # Ensure get reflects updated state
    get_res = client.get("/api/v1/digital-twin/state")
    assert get_res.status_code == 200
    assert get_res.json()["reservoir"]["reservoir_pressure_psia"] == 3850.0
