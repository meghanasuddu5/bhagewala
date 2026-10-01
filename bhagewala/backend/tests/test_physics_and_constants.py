import pytest
from backend.app.core.twin_constants import RESERVOIR, STEAM, WELL, get_all_twin_constants
from backend.app.services.physics import (
    calculate_viscosity,
    calculate_viscosity_reduction_pct,
    calculate_steam_chamber_radius,
    get_fluid_physical_state,
)


def test_constants_integrity():
    constants = get_all_twin_constants()
    assert constants["reservoir"]["native_viscosity_cp"] == 14500.0
    assert constants["reservoir"]["native_temperature_c"] == 48.0
    assert constants["steam"]["steam_temperature_c"] == 282.0
    assert constants["steam"]["steam_pressure_bar"] == 68.0
    assert constants["steam"]["injection_rate_tpd"] == 140.0
    assert constants["steam"]["steam_quality_pct"] == 81.0
    assert constants["well"]["current_oil_rate_bopd"] == 450.5
    assert constants["well"]["nominal_spm"] == 2.0


def test_viscosity_calibration_and_monotonicity():
    # Strict calibration test
    mu_native = calculate_viscosity(48.0)
    assert mu_native == 14500.0

    mu_stimulated = calculate_viscosity(195.0)
    assert mu_stimulated == 245.0

    # Monotonicity test: viscosity must strictly decrease as temperature increases
    prev_mu = 999999.0
    for t in range(40, 240, 5):
        cur_mu = calculate_viscosity(float(t))
        assert cur_mu < prev_mu, f"Viscosity failed to decrease at T={t}: {cur_mu} >= {prev_mu}"
        prev_mu = cur_mu

    # Viscosity drop % at 195°C should be ~98.3%
    drop_pct = calculate_viscosity_reduction_pct(195.0)
    assert 98.0 <= drop_pct <= 98.5


def test_steam_chamber_radius_expansion():
    # 4800 tonnes should give ~18.5m radius
    r = calculate_steam_chamber_radius(4800.0, soak_days=6)
    assert 18.0 <= r <= 19.5

    # More steam must give larger chamber
    r_small = calculate_steam_chamber_radius(1000.0, soak_days=6)
    r_large = calculate_steam_chamber_radius(5000.0, soak_days=6)
    assert r_large > r_small


def test_constants_endpoint(client):
    res = client.get("/api/v1/constants")
    assert res.status_code == 200
    data = res.json()
    assert data["reservoir"]["native_viscosity_cp"] == 14500.0
    assert data["steam"]["steam_temperature_c"] == 282.0


def test_physics_endpoint(client):
    res = client.get("/api/v1/physics/viscosity?temperature_c=195.0")
    assert res.status_code == 200
    data = res.json()
    assert data["viscosity_cp"] == 245.0
    assert "Superheated" in data["state_label"] or "Free-Flowing" in data["state_label"]


def test_no_contradictory_literals_in_source():
    """Verify that contradictory literals identified in Defect B do not reappear in frontend code."""
    from pathlib import Path
    src_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "src"
    
    contradictory_patterns = [
        "15,000 cP",
        "14,000+",
        "280°C",
        "65 bar",
        "120 TPD",
    ]
    
    for js_file in src_dir.rglob("*.jsx"):
        content = js_file.read_text(encoding="utf-8")
        for bad_pat in contradictory_patterns:
            assert bad_pat not in content, f"Found conflicting constant literal '{bad_pat}' in {js_file.name}"

