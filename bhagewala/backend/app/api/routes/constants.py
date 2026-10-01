from fastapi import APIRouter, Query
from backend.app.core.twin_constants import get_all_twin_constants
from backend.app.services.physics import (
    calculate_viscosity,
    get_fluid_physical_state,
    calculate_steam_chamber_radius,
    get_viscosity_curve_samples,
)

router = APIRouter(prefix="", tags=["Single Source of Truth & Physics"])


@router.get("/constants", summary="Unified Physical Constants (SSOT)")
def get_constants():
    """Returns single source of truth physical baselines and field parameters."""
    return get_all_twin_constants()


@router.get("/physics/viscosity", summary="Calibrated Andrade Viscosity Evaluation")
def evaluate_viscosity(temperature_c: float = Query(48.0, ge=20.0, le=300.0, description="Formation Temperature in °C")):
    """Evaluates dynamic heavy crude oil viscosity from calibrated Andrade function."""
    return get_fluid_physical_state(temperature_c)


@router.get("/physics/viscosity-curve", summary="Viscosity Curve Plot Points")
def get_viscosity_curve():
    """Returns calibrated points for plotting dynamic viscosity vs temperature curve."""
    return {
        "unit_temperature": "°C",
        "unit_viscosity": "cP",
        "formula": "mu(T) = 14500 * exp(-0.027759 * (T - 48.0))",
        "points": get_viscosity_curve_samples(),
    }
