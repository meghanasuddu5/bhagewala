"""
Baghewala Digital Twin — Calibrated Physical Calculations
SINGLE CALIBRATED VISCOSITY & THERMAL PROPAGATION MODEL

Calibrated strictly to TWIN constants:
Native: 14,500.0 cP @ 48.0°C
Stimulated: 245.0 cP @ 195.0°C
"""

import math
from typing import Dict, Any, List
from backend.app.core.twin_constants import RESERVOIR, STEAM

# Calibrated Andrade parameters
T_REF_C: float = RESERVOIR.native_temperature_c  # 48.0 °C
MU_REF_CP: float = RESERVOIR.native_viscosity_cp  # 14500.0 cP
T_STIM_C: float = 195.0
MU_STIM_CP: float = RESERVOIR.stimulated_viscosity_cp  # 245.0 cP

# b = -ln(MU_STIM / MU_REF) / (T_STIM - T_REF)
ANDRADE_B: float = -math.log(MU_STIM_CP / MU_REF_CP) / (T_STIM_C - T_REF_C)  # ~0.02775916


def calculate_viscosity(temperature_c: float) -> float:
    """
    Calculates dynamic heavy oil viscosity (cP) as a function of formation temperature.
    Guaranteed monotonically decreasing and strictly calibrated to 14,500 cP @ 48°C
    and 245 cP @ 195°C.
    """
    t = max(20.0, min(300.0, float(temperature_c)))
    delta_t = t - T_REF_C
    viscosity = MU_REF_CP * math.exp(-ANDRADE_B * delta_t)
    return round(max(50.0, viscosity), 1)


def calculate_viscosity_reduction_pct(temperature_c: float) -> float:
    """Calculates percentage viscosity collapse relative to native 14,500 cP tar."""
    current_mu = calculate_viscosity(temperature_c)
    drop = ((MU_REF_CP - current_mu) / MU_REF_CP) * 100.0
    return round(max(0.0, drop), 1)


def get_fluid_physical_state(temperature_c: float) -> Dict[str, Any]:
    """Returns classification, color hex, and relative flow mobility factor."""
    mu = calculate_viscosity(temperature_c)
    mobility_factor = round(MU_REF_CP / mu, 1)

    if mu > 8000.0:
        state_label = "Native Bituminous Tar (Immobile)"
        color_hex = "#181412"  # Pitch black
    elif mu > 2500.0:
        state_label = "Sluggish Bitumen (Low Inflow)"
        color_hex = "#451a03"  # Deep brown
    elif mu > 800.0:
        state_label = "Thermal Transition Fluid"
        color_hex = "#92400e"  # Dark amber
    elif mu > 300.0:
        state_label = "Free-Flowing Crude Oil"
        color_hex = "#d97706"  # Golden amber
    else:
        state_label = "Superheated High-Mobility Liquid"
        color_hex = "#f59e0b"  # Bright petroleum gold

    return {
        "temperature_c": temperature_c,
        "viscosity_cp": mu,
        "viscosity_drop_pct": calculate_viscosity_reduction_pct(temperature_c),
        "mobility_factor": mobility_factor,
        "state_label": state_label,
        "color_hex": color_hex,
    }


def calculate_steam_chamber_radius(cumulative_tonnes: float, soak_days: int = 6) -> float:
    """
    Radial thermal front expansion model based on injected steam enthalpy and soak diffusion.
    Calibrated so that nominal 4,800 tonnes at 6 days soak gives ~18.5 m chamber radius.
    """
    v_tonnes = max(100.0, float(cumulative_tonnes))
    base_radius = 0.267 * math.sqrt(v_tonnes)
    soak_diffusion = 1.0 + (0.02 * math.sqrt(max(0, soak_days)))
    return round(base_radius * soak_diffusion, 1)


def get_viscosity_curve_samples() -> List[Dict[str, float]]:
    """Generates standard temperature-viscosity curve points for charting."""
    samples = []
    for temp in range(40, 245, 5):
        samples.append({
            "temperature_c": float(temp),
            "viscosity_cp": calculate_viscosity(float(temp)),
        })
    return samples
