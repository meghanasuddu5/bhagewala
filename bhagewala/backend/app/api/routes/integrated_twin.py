"""
Baghewala Digital Twin — Integrated Production Twin REST Routes
Provides endpoints for coupled simulation state, scenario execution, timeline stepping,
reset, side-by-side scenario comparison, and audit data provenance.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.coupled_engine import (
    SimulationInputs,
    solve_coupled_state,
    calculate_viscosity,
    compute_pump_capacity_bopd,
)
from backend.app.core.twin_constants import get_all_twin_constants

router = APIRouter(prefix="/twin", tags=["Integrated Production Twin"])

# Shared in-memory active simulation state
_current_inputs = SimulationInputs()


class ScenarioPayload(BaseModel):
    steam_rate_tpd: Optional[float] = Field(default=None, ge=0.0, le=300.0)
    steam_temp_c: Optional[float] = Field(default=None, ge=100.0, le=350.0)
    injection_press_bar: Optional[float] = Field(default=None, ge=10.0, le=120.0)
    steam_quality_pct: Optional[float] = Field(default=None, ge=10.0, le=100.0)
    injection_days: Optional[float] = Field(default=None, ge=1.0, le=60.0)
    soak_days: Optional[float] = Field(default=None, ge=0.0, le=30.0)
    pump_active: Optional[bool] = Field(default=None)
    spm: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    water_cut_pct: Optional[float] = Field(default=None, ge=0.0, le=99.0)
    scrub_stage: Optional[float] = Field(default=None, ge=0.0, le=8.0)
    elapsed_days: Optional[float] = Field(default=None, ge=0.0, le=120.0)


class StepPayload(BaseModel):
    step_delta_days: Optional[float] = Field(default=1.0)
    target_stage: Optional[float] = Field(default=None, ge=0.0, le=8.0)


@router.get("/state", summary="Get Current Coupled Digital Twin State")
def get_twin_state() -> Dict[str, Any]:
    """Returns the unified, deterministic coupled digital twin state across reservoir, steam, well, and surface."""
    state = solve_coupled_state(_current_inputs)
    return {
        "status": "success",
        "inputs": _current_inputs.__dict__,
        "state": state,
    }


@router.post("/scenario", summary="Update Coupled Simulation Drivers")
def update_scenario(payload: ScenarioPayload) -> Dict[str, Any]:
    """Updates one or more simulation drivers and returns newly coupled state."""
    global _current_inputs
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        if hasattr(_current_inputs, k) and v is not None:
            setattr(_current_inputs, k, v)
    
    state = solve_coupled_state(_current_inputs)
    return {
        "status": "success",
        "updated_fields": list(updates.keys()),
        "state": state,
    }


@router.post("/step", summary="Step Timeline Forward/Backward")
def step_simulation(payload: StepPayload) -> Dict[str, Any]:
    """Steps the simulation timeline forward/backward deterministically."""
    global _current_inputs
    if payload.target_stage is not None:
        _current_inputs.scrub_stage = payload.target_stage
    elif payload.step_delta_days is not None:
        _current_inputs.elapsed_days = max(0.0, _current_inputs.elapsed_days + payload.step_delta_days)
    
    state = solve_coupled_state(_current_inputs)
    return {
        "status": "success",
        "state": state,
    }


@router.post("/reset", summary="Reset Digital Twin to Canonical Baseline")
def reset_simulation() -> Dict[str, Any]:
    """Restores all parameters to canonical Single Source of Truth baseline."""
    global _current_inputs
    _current_inputs = SimulationInputs()
    state = solve_coupled_state(_current_inputs)
    return {
        "status": "success",
        "message": "Reset all parameters to canonical SSOT baseline.",
        "state": state,
    }


@router.get("/compare", summary="Compare Named Operational Scenarios")
def compare_scenarios(ids: Optional[str] = Query(default="baseline,css-surge,high-water-cut")) -> Dict[str, Any]:
    """Evaluates and compares up to 3 named scenarios side by side."""
    requested_ids = [i.strip() for i in ids.split(",") if i.strip()]
    results = []

    scenario_library = {
        "baseline": SimulationInputs(steam_rate_tpd=140.0, spm=2.0, scrub_stage=6.0, elapsed_days=26.0),
        "css-surge": SimulationInputs(steam_rate_tpd=180.0, spm=3.2, scrub_stage=6.0, elapsed_days=26.0),
        "high-water-cut": SimulationInputs(steam_rate_tpd=140.0, spm=2.0, water_cut_pct=28.5, scrub_stage=6.0, elapsed_days=26.0),
        "shut-in": SimulationInputs(steam_rate_tpd=0.0, pump_active=False, spm=0.0, scrub_stage=2.0, elapsed_days=10.0),
        "steam-only": SimulationInputs(steam_rate_tpd=140.0, pump_active=False, spm=0.0, scrub_stage=1.0, elapsed_days=15.0),
        "pump-only": SimulationInputs(steam_rate_tpd=0.0, spm=2.0, scrub_stage=6.0, elapsed_days=26.0),
    }

    base_state = solve_coupled_state(scenario_library["baseline"])
    base_cum = base_state["surface"]["cumulative_oil_bbl"]

    for sc_id in requested_ids:
        inputs = scenario_library.get(sc_id, scenario_library["baseline"])
        st = solve_coupled_state(inputs)
        cum = st["surface"]["cumulative_oil_bbl"]
        delta = cum - base_cum
        delta_pct = (delta / max(1.0, base_cum)) * 100.0

        results.append({
            "scenario_id": sc_id,
            "rate_bopd": st["reservoir"]["actual_inflow_bopd"],
            "cum_oil_bbl": cum,
            "steam_oil_ratio": st["surface"]["steam_oil_ratio"],
            "total_power_kw": st["surface"]["total_power_kw"],
            "delta_cum_bbl": delta,
            "delta_pct": round(delta_pct, 1),
            "heated_radius_m": st["reservoir"]["heated_radius_m"],
            "viscosity_cp": st["reservoir"]["wellbore_viscosity_cp"],
            "state": st,
        })

    return {
        "status": "success",
        "comparison": results,
    }


@router.get("/provenance", summary="Data Provenance Disclosure")
def get_provenance() -> Dict[str, Any]:
    """Returns classification of all metrics into Measured, Synthetic, and Simulated."""
    constants = get_all_twin_constants()
    return {
        "status": "success",
        "measured": {
            "flowing_wellhead_pressure_psia": constants["well"]["flowing_wellhead_pressure_psia"],
            "casing_pressure_psia": constants["well"]["casing_pressure_psia"],
            "nominal_spm": constants["well"]["nominal_spm"],
            "surface_motor_kw": constants["well"]["surface_motor_kw"],
            "water_cut_pct": constants["well"]["bsw_water_cut_pct"],
            "gas_rate_mcfd": constants["well"]["gas_rate_mcfd"],
        },
        "calibrated_synthetic": {
            "top_depth_m": constants["reservoir"]["top_depth_m"],
            "initial_pressure_psia": constants["reservoir"]["initial_pressure_psia"],
            "native_temperature_c": constants["reservoir"]["native_temperature_c"],
            "native_viscosity_cp": constants["reservoir"]["native_viscosity_cp"],
            "net_pay_thickness_m": constants["reservoir"]["net_pay_thickness_m"],
            "oil_api_gravity": constants["reservoir"]["oil_api_gravity"],
        },
        "simulated_and_ml": {
            "ml_model": "V1.3 Two-Stage ExtraTrees Hybrid (ENR004 proxy-trained, 0.1500 cutoff)",
            "physics_viscosity": "Calibrated Andrade dynamic equation",
            "heat_chamber": "Marx-Langenheim thermal front radial growth and conductive soak decay",
            "inflow_model": "Vogel Inflow Performance Relationship (IPR)",
        },
    }
