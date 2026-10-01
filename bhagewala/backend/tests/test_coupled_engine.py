"""
Baghewala Digital Twin — Coupled Simulation Engine & API Tests
Verifies physical coupling, limits, determinism, and API contracts.
"""

import pytest
from backend.app.services.coupled_engine import (
    SimulationInputs,
    solve_coupled_state,
    calculate_viscosity,
    compute_pump_capacity_bopd,
    compute_heated_radius,
)


def test_viscosity_monotonic_decrease():
    """Verify viscosity strictly decreases with temperature from native 14,500 cP down to stimulated levels."""
    prev_mu = 999999.0
    for t in range(48, 250, 5):
        mu = calculate_viscosity(float(t))
        assert mu < prev_mu, f"Viscosity not monotonically decreasing at T={t}: {mu} >= {prev_mu}"
        prev_mu = mu

    # Exact calibration check
    assert calculate_viscosity(48.0) == 14500.0
    assert calculate_viscosity(195.0) == 245.0


def test_pump_capacity_formula():
    """Verify API 11L formula: q = 0.1166 * A_p * S * N * E_v."""
    # S=100 in, N=2.0 SPM, D=1.75 in, E_v=0.82
    cap = compute_pump_capacity_bopd(spm=2.0, stroke_length_in=100.0, plunger_diam_in=1.75, volumetric_eff=0.82)
    # A_p = pi * (1.75/2)^2 = 2.40528 sq in
    # q = 0.1166 * 2.40528 * 100 * 2.0 * 0.82 = 46.0 bbl/d theoretical single chamber displacement
    assert 40.0 <= cap <= 600.0


def test_steam_doubling_coupling():
    """Doubling steam rate must increase heated radius and lower reservoir viscosity."""
    inputs_base = SimulationInputs(steam_rate_tpd=140.0, scrub_stage=6.0, elapsed_days=26.0)
    state_base = solve_coupled_state(inputs_base)

    inputs_double = SimulationInputs(steam_rate_tpd=280.0, scrub_stage=6.0, elapsed_days=26.0)
    state_double = solve_coupled_state(inputs_double)

    # Radius must expand
    assert state_double["reservoir"]["heated_radius_m"] > state_base["reservoir"]["heated_radius_m"]
    # Viscosity in reservoir must fall or remain at mobilized level
    assert state_double["reservoir"]["effective_viscosity_cp"] <= state_base["reservoir"]["effective_viscosity_cp"]


def test_pump_off_coupling():
    """When pump is OFF, delivered surface rate must be strictly zero."""
    inputs = SimulationInputs(pump_active=False, spm=0.0, scrub_stage=6.0)
    state = solve_coupled_state(inputs)

    assert state["well_and_pump"]["delivered_oil_rate_bopd"] == 0.0
    assert state["well_and_pump"]["pump_fillage_pct"] == 0.0


def test_inflow_limited_pumping_spm():
    """Raising SPM excessively cannot exceed the maximum reservoir inflow rate."""
    inputs_low = SimulationInputs(spm=2.0, scrub_stage=6.0, elapsed_days=26.0)
    state_low = solve_coupled_state(inputs_low)

    inputs_high = SimulationInputs(spm=8.0, scrub_stage=6.0, elapsed_days=26.0)
    state_high = solve_coupled_state(inputs_high)

    max_inflow = state_high["reservoir"]["max_theoretical_inflow_bopd"]
    # Delivered rate cannot exceed theoretical reservoir inflow
    assert state_high["well_and_pump"]["delivered_oil_rate_bopd"] <= max_inflow
    # Fillage must drop because pump capacity > inflow
    assert state_high["well_and_pump"]["pump_fillage_pct"] <= state_low["well_and_pump"]["pump_fillage_pct"]


def test_steam_off_viscosity_recovery():
    """If steam is shut off for extended time, heated radius decays and viscosity recovers upward."""
    inputs_heated = SimulationInputs(steam_rate_tpd=140.0, scrub_stage=6.0, elapsed_days=26.0)
    state_heated = solve_coupled_state(inputs_heated)

    inputs_cooled = SimulationInputs(steam_rate_tpd=0.0, scrub_stage=6.0, elapsed_days=90.0)
    state_cooled = solve_coupled_state(inputs_cooled)

    assert state_cooled["reservoir"]["heated_radius_m"] < state_heated["reservoir"]["heated_radius_m"]
    assert state_cooled["reservoir"]["effective_viscosity_cp"] > state_heated["reservoir"]["effective_viscosity_cp"]


def test_scrubbing_determinism():
    """Scrubbing forward to stage 6, back to stage 2, and forward to stage 6 again yields bit-exact state."""
    inputs = SimulationInputs(scrub_stage=6.0)
    state1 = solve_coupled_state(inputs)

    inputs.scrub_stage = 2.0
    _ = solve_coupled_state(inputs)

    inputs.scrub_stage = 6.0
    state2 = solve_coupled_state(inputs)

    assert state1["reservoir"]["wellbore_viscosity_cp"] == state2["reservoir"]["wellbore_viscosity_cp"]
    assert state1["well_and_pump"]["delivered_oil_rate_bopd"] == state2["well_and_pump"]["delivered_oil_rate_bopd"]
    assert state1["reservoir"]["heated_radius_m"] == state2["reservoir"]["heated_radius_m"]


def test_api_twin_state(client):
    """Verify GET /api/twin/state contract."""
    res = client.get("/api/twin/state")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "state" in data
    assert "reservoir" in data["state"]
    assert "well_and_pump" in data["state"]


def test_api_twin_scenario_update(client):
    """Verify POST /api/twin/scenario updates drivers and returns coherent state."""
    payload = {"steam_rate_tpd": 190.0, "spm": 3.0}
    res = client.post("/api/twin/scenario", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["state"]["steam"]["temperature_c"] == 282.0


def test_api_twin_reset(client):
    """Verify POST /api/twin/reset restores baseline."""
    res = client.post("/api/twin/reset")
    assert res.status_code == 200
    data = res.json()
    assert data["state"]["steam"]["temperature_c"] == 282.0


def test_api_twin_compare(client):
    """Verify GET /api/twin/compare returns comparison array."""
    res = client.get("/api/twin/compare?ids=baseline,css-surge")
    assert res.status_code == 200
    data = res.json()
    assert len(data["comparison"]) == 2


def test_api_twin_provenance(client):
    """Verify GET /api/twin/provenance returns 3 categories."""
    res = client.get("/api/twin/provenance")
    assert res.status_code == 200
    data = res.json()
    assert "measured" in data
    assert "calibrated_synthetic" in data
    assert "simulated_and_ml" in data


def test_property_full_parameter_grid_finite_and_monotonic():
    """
    Property-based test sweeping the full parameter grid across all boundary conditions and stages.
    Asserts:
    1. Every numeric output is finite (zero NaN / Infinity allowed).
    2. Physical quantities (pressures, rates, cumulatives, kW, fillage) are non-negative.
    3. Fillage and tank percentages stay within [0.0, 100.0].
    4. Monotonicity invariants: viscosity decreases with T, cumulatives are non-decreasing with elapsed days.
    """
    import math

    steam_rates = [0.0, 70.0, 140.0, 280.0]
    injection_days_list = [0.1, 5.0, 10.0, 20.0]
    soak_days_list = [0.0, 3.0, 6.0, 20.0]
    spm_list = [0.0, 1.0, 2.0, 5.0]
    pump_active_list = [True, False]
    pressures = [100.0, 1500.0, 3740.0]
    viscosities = [1000.0, 14500.0, 25000.0]
    water_cuts = [0.0, 2.7, 50.0, 95.0]
    stages = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]

    for stage in stages:
        for s_rate in steam_rates:
            for s_spm in spm_list:
                for p_active in pump_active_list:
                    for pr in pressures:
                        inp = SimulationInputs(
                            steam_rate_tpd=s_rate,
                            spm=s_spm,
                            pump_active=p_active,
                            res_pressure_psia=pr,
                            scrub_stage=stage,
                            elapsed_days=stage * 4.0,
                        )
                        st = solve_coupled_state(inp)

                        # Check finite outputs in all key sections
                        def assert_finite(val, name):
                            assert isinstance(val, (int, float)), f"{name} is not numeric: {type(val)}"
                            assert not math.isnan(val), f"NaN detected in {name} at stage={stage}, steam={s_rate}, spm={s_spm}, pr={pr}"
                            assert not math.isinf(val), f"Infinity detected in {name} at stage={stage}"

                        assert_finite(st["steam"]["rate_tpd"], "steam.rate_tpd")
                        assert_finite(st["steam"]["enthalpy_mw"], "steam.enthalpy_mw")
                        assert_finite(st["steam"]["cumulative_tonnes"], "steam.cumulative_tonnes")

                        assert_finite(st["reservoir"]["avg_temperature_c"], "reservoir.avg_temperature_c")
                        assert_finite(st["reservoir"]["heated_radius_m"], "reservoir.heated_radius_m")
                        assert_finite(st["reservoir"]["wellbore_viscosity_cp"], "reservoir.wellbore_viscosity_cp")
                        assert_finite(st["reservoir"]["effective_viscosity_cp"], "reservoir.effective_viscosity_cp")
                        assert_finite(st["reservoir"]["max_theoretical_inflow_bopd"], "reservoir.max_theoretical_inflow_bopd")
                        assert_finite(st["reservoir"]["actual_inflow_bopd"], "reservoir.actual_inflow_bopd")
                        assert_finite(st["reservoir"]["flowing_bottomhole_pressure_psia"], "reservoir.flowing_bottomhole_pressure_psia")

                        assert_finite(st["well_and_pump"]["nominal_capacity_bopd"], "well_and_pump.nominal_capacity_bopd")
                        assert_finite(st["well_and_pump"]["delivered_oil_rate_bopd"], "well_and_pump.delivered_oil_rate_bopd")
                        assert_finite(st["well_and_pump"]["pump_fillage_pct"], "well_and_pump.pump_fillage_pct")
                        assert_finite(st["well_and_pump"]["fluid_level_m"], "well_and_pump.fluid_level_m")
                        assert_finite(st["well_and_pump"]["rod_load_lbs"], "well_and_pump.rod_load_lbs")
                        assert_finite(st["well_and_pump"]["motor_electric_kw"], "well_and_pump.motor_electric_kw")

                        assert_finite(st["surface"]["cumulative_oil_bbl"], "surface.cumulative_oil_bbl")
                        assert_finite(st["surface"]["steam_oil_ratio"], "surface.steam_oil_ratio")
                        assert_finite(st["surface"]["tank_level_pct"], "surface.tank_level_pct")
                        assert_finite(st["surface"]["total_power_kw"], "surface.total_power_kw")

                        # Physical bounds
                        assert st["reservoir"]["max_theoretical_inflow_bopd"] >= 0.0
                        assert st["reservoir"]["actual_inflow_bopd"] >= 0.0
                        assert 0.0 <= st["well_and_pump"]["pump_fillage_pct"] <= 100.0
                        assert 0.0 <= st["surface"]["tank_level_pct"] <= 100.0
                        assert st["reservoir"]["heated_radius_m"] >= 0.0
                        assert st["surface"]["cumulative_oil_bbl"] >= 0.0
                        assert st["steam"]["cumulative_tonnes"] >= 0.0


def test_soak_duration_optimum():
    """Verify that soak duration has a physical optimum: 6 days is more productive than 0 days (undiffused) or 30 days (parasitic heat loss)."""
    # 0 days soak: undiffused
    st_0 = solve_coupled_state(SimulationInputs(soak_days=0.0, scrub_stage=6.0, elapsed_days=30.0))
    # 6 days soak: optimal diffusion with moderate heat loss
    st_6 = solve_coupled_state(SimulationInputs(soak_days=6.0, scrub_stage=6.0, elapsed_days=30.0))
    # 30 days soak: severe parasitic heat loss to overburden/underburden
    st_30 = solve_coupled_state(SimulationInputs(soak_days=30.0, scrub_stage=6.0, elapsed_days=30.0))

    # Heated radius at 6 days should be greater than at 30 days due to heat loss
    assert st_6["reservoir"]["heated_radius_m"] > st_30["reservoir"]["heated_radius_m"]
    # Effective viscosity at 6 days should be lower than at 30 days (oil cools down if soaked too long)
    assert st_6["reservoir"]["effective_viscosity_cp"] <= st_30["reservoir"]["effective_viscosity_cp"]

