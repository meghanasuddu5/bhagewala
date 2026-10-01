import pytest


def test_list_scenarios(client):
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert data["total"] >= 1
    # Check default baseline scenario
    scenario_ids = [s["scenario_id"] for s in data["scenarios"]]
    assert "scenario-baseline-prod" in scenario_ids


def test_get_scenario_by_id(client):
    response = client.get("/api/v1/scenarios/scenario-baseline-prod")
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "scenario-baseline-prod"
    assert "parameters" in data
    assert "results" in data


def test_create_custom_scenario(client):
    payload = {
        "name": "CSS Steaming Cycle 3 High Rate",
        "description": "Experimental steam soak with high drawdown and 3.5 SPM rod pump.",
        "reservoir": {
            "reservoir_pressure_psia": 4200.0,
            "reservoir_temperature_deg_c": 52.0,
            "oil_viscosity_cp": 12000.0,
            "reservoir_depth_m": 1050.0,
            "reservoir_thickness_m": 18.0,
            "oil_saturation_pct": 70.0,
        },
        "steam_injection": {
            "steam_injection_rate_tpd": 150.0,
            "steam_pressure_bar": 70.0,
            "steam_temperature_deg_c": 285.0,
            "steam_quality_pct": 82.0,
            "cumulative_injected_steam_tonnes": 5200.0,
            "css_cycle_stage": "Production",
        },
        "well_production": {
            "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
            "current_oil_rate_bopd": 620.0,
            "water_rate_bwpd": 25.0,
            "gas_rate_mcfd": 710.0,
            "pump_type": "Sucker Rod Pump (SRP)",
            "pump_speed": 3.5,
            "pump_operating_status": "Operating",
        },
        "surface_system": {
            "pump_power_kw": 55.0,
            "energy_consumption_kwh_per_day": 1320.0,
            "equipment_status": "Operating",
        },
    }
    response = client.post("/api/v1/scenarios", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "scenario_id" in data
    assert data["name"] == "CSS Steaming Cycle 3 High Rate"
    assert "results" in data
    assert data["results"]["predicted_production"] is not None


def test_simulate_operational_projection(client):
    payload = {
        "scenario_id": "scenario-baseline-prod",
        "horizon_days": 10,
        "current_oil_rate_bopd": 450.0,
        "reservoir": {
            "reservoir_pressure_psia": 3740.0,
        },
        "well_production": {
            "current_oil_rate_bopd": 450.0,
            "pump_operating_status": "Operating",
        },
    }
    response = client.post("/api/v1/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # CRITICAL: Verify physical reservoir simulation is explicitly marked False
    assert data["is_physical_reservoir_simulation"] is False
    assert data["horizon_days"] == 10
    assert len(data["daily_projections"]) == 10

    # Day 1 is genuine ML
    day_1 = data["daily_projections"][0]
    assert day_1["day"] == 1
    assert day_1["is_ml_derived"] is True
    assert day_1["is_illustrative_extrapolation"] is False

    # Day 2+ are illustrative
    day_2 = data["daily_projections"][1]
    assert day_2["day"] == 2
    assert day_2["is_ml_derived"] is False
    assert day_2["is_illustrative_extrapolation"] is True

    # Physics limitations documented
    assert len(data["physics_limitations"]) > 0
