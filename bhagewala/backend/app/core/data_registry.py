"""
Baghewala Well-to-Surface Digital Twin — Data Source Provenance Registry
SIH26120 National Finale Grade Data Integrity Standards.

Strict Classification:
- MEASURED: Real physical well telemetry from identified Baghewala sensor/SCADA (reserved).
- PROXY: Historical proxy dataset (ENR004 heavy oil benchmark).
- ML: Machine learning model inference (ExtraTrees V1.3 pipeline).
- SIMULATED: First-principles coupled thermal-lift engineering physics engine.
- ASSUMED: Published Jodhpur sandstone geological parameters or operator scenario assumptions.

FORBIDDEN TERMS (unless audited primary record exists in repository):
- "Audited"
- "Calibrated"
- "Metered"
"""

from enum import Enum
from typing import Dict, Any, Optional

class ProvenanceClass(str, Enum):
    MEASURED = "MEASURED"
    PROXY = "PROXY"
    ML = "ML"
    SIMULATED = "SIMULATED"
    ASSUMED = "ASSUMED"

# Authoritative catalog of all displayed/modeled quantities
DATA_SOURCE_CATALOG: Dict[str, Dict[str, Any]] = {
    # Reservoir parameters
    "top_depth_m": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Published Baghewala Jodhpur Sandstone geological literature",
        "description": "Depth to top of Jodhpur heavy oil reservoir (1050 m TVD)"
    },
    "net_pay_m": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Published Baghewala field stratigraphic logs",
        "description": "Net pay reservoir thickness (28 m)"
    },
    "initial_pressure_psia": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Published basin hydrostatic discovery pressure",
        "description": "Virgin reservoir pressure (1520 psia)"
    },
    "native_temperature_c": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Regional geothermal gradient (48.0 C reference)",
        "description": "Native undisturbed formation temperature"
    },
    "native_viscosity_cp": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Dead oil PVT dead-crude benchmark at 48 C reference (14,500 cP)",
        "description": "Native extra-heavy crude dynamic viscosity"
    },
    "oil_api_gravity": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Baghewala crude assay benchmark",
        "description": "17.0 API extra-heavy crude"
    },
    "permeability_md": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Core plug porosity-permeability correlation (420 mD)",
        "description": "Absolute reservoir permeability"
    },
    "porosity_pct": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Petrophysical density-neutron log estimate (24%)",
        "description": "Formation porosity"
    },

    # Steam injection inputs & outputs
    "steam_rate_tpd": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Operator scenario input setpoint",
        "description": "Target daily steam mass injection rate"
    },
    "steam_temp_c": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Once-Through Steam Generator (OTSG) design operating point",
        "description": "Saturated steam injection temperature (310 C)"
    },
    "steam_quality": {
        "class": ProvenanceClass.ASSUMED,
        "source": "OTSG vapor quality target (0.80 fraction)",
        "description": "Steam vapor dryness fraction"
    },
    "heated_radius_m": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Marx-Langenheim heat balance with thermal diffusion & caprock losses",
        "description": "Dynamic radius of 100 C steam condensation front"
    },
    "thermal_enthalpy_gj": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Steam thermodynamic enthalpy integration (h_steam * mass)",
        "description": "Total cumulative thermal energy delivered to reservoir"
    },
    "cum_steam_tonnes": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Integrated steam injection mass over cycle duration",
        "description": "Cumulative steam injected into wellbore"
    },

    # Flow & Thermal coupling
    "effective_temperature_c": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Radial thermal equilibrium solver",
        "description": "Volume-averaged reservoir temperature in drained pore volume"
    },
    "effective_viscosity_cp": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Andrade temperature-viscosity exponential correlation",
        "description": "Dynamic heavy oil viscosity at current heated temperature"
    },
    "mobility_ratio": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Ratio of native dead oil viscosity to effective heated viscosity",
        "description": "Mobility enhancement factor (mu_native / mu_eff)"
    },
    "pwf_psia": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Coupled wellbore fluid head and dynamic pump intake drawdown",
        "description": "Flowing bottomhole pressure at perforation depth"
    },
    "qmax_bopd": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Vogel IPR theoretical zero-drawdown inflow capacity",
        "description": "Maximum theoretical reservoir inflow rate at Pwf = 0"
    },
    "inflow_rate_bopd": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Vogel solution-gas inflow performance relationship",
        "description": "True fluid flow into wellbore perforations"
    },

    # Well & Lift mechanics
    "pumping_speed_spm": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Operator scenario input setpoint",
        "description": "Beam pump surface strokes per minute"
    },
    "stroke_length_in": {
        "class": ProvenanceClass.ASSUMED,
        "source": "API beam unit geometry standard",
        "description": "Pump jack polished rod stroke length (120 in)"
    },
    "plunger_diameter_in": {
        "class": ProvenanceClass.ASSUMED,
        "source": "Downhole pump insert specification",
        "description": "Downhole rod pump plunger diameter (2.25 in)"
    },
    "pump_displacement_bpd": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Kinematic plunger swept volume per day (0.1166 * D^2 * S * SPM)",
        "description": "Theoretical maximum volumetric lifting capacity"
    },
    "pump_fillage_pct": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Ratio of inflow liquid rate to pump displacement capacity",
        "description": "Effective barrel liquid fill fraction"
    },
    "surface_oil_rate_bopd": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Coupled minimum of reservoir inflow and pump displacement efficiency",
        "description": "Realized net oil production rate at surface tank"
    },
    "fluid_level_m": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Acoustic fluid level hydrostatic calculation from Pwf",
        "description": "Distance from surface wellhead to liquid annular level"
    },
    "prl_peak_lbs": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Modified API RP 11L polished rod dynamic load calculation",
        "description": "Maximum polished rod load on upstroke"
    },
    "prl_min_lbs": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Modified API RP 11L polished rod buoyant weight on downstroke",
        "description": "Minimum polished rod load on downstroke"
    },
    "motor_power_kw": {
        "class": ProvenanceClass.SIMULATED,
        "source": "Mechanical polished rod work and electromechanical drivetrain losses",
        "description": "Electric motor real power consumption"
    },

    # ML & Proxy models
    "predicted_oil_rate_bopd": {
        "class": ProvenanceClass.ML,
        "source": "ExtraTrees Regressor V1.3 pipeline (50 lag features)",
        "description": "Machine learning 24h oil rate forecast"
    },
    "dataset_enr004": {
        "class": ProvenanceClass.PROXY,
        "source": "ENR004 multi-well heavy oil operational dataset (15,699 daily logs)",
        "description": "Historical proxy benchmark dataset used to train ML models"
    }
}

def get_provenance(key: str) -> Dict[str, Any]:
    """Retrieve provenance record for a given telemetry or simulation quantity."""
    return DATA_SOURCE_CATALOG.get(key, {
        "class": ProvenanceClass.SIMULATED,
        "source": "Baghewala coupled thermal-lift engineering model",
        "description": "Coupled physics calculation"
    })

def validate_provenance_claim(text: str) -> bool:
    """
    Returns False if banned words ('Audited', 'Calibrated', 'Metered') 
    are used without strict justification.
    """
    banned = ["audited", "calibrated", "metered"]
    text_lower = text.lower()
    for b in banned:
        if b in text_lower:
            return False
    return True
