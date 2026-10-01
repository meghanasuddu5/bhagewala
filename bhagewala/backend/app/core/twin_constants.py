"""
Baghewala Digital Twin — Unified Physical Constants & Field Baselines
SINGLE SOURCE OF TRUTH (SSOT)

Every component (FastAPI backend, ML schemas, physics engines, and React UI)
derives from these exact numbers.
"""

from dataclasses import asdict, dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class ReservoirConstants:
    formation_name: str = "Jodhpur Sandstone (Lower Cambrian)"
    caprock_name: str = "Bilara Dolomite & Impermeable Shales"
    top_depth_m: float = 1050.0
    net_pay_thickness_m: float = 18.0
    initial_pressure_psia: float = 3740.0
    native_temperature_c: float = 48.0
    native_viscosity_cp: float = 14500.0  # At reference 48.0°C
    stimulated_viscosity_cp: float = 245.0  # At stimulated 195.0°C
    oil_saturation_pct: float = 66.0
    porosity_pct: float = 24.5
    permeability_md: float = 1200.0
    oil_api_gravity: float = 17.4


@dataclass(frozen=True)
class SteamConstants:
    boiler_model: str = "OTS-50 Superheated Once-Through Steam Generator"
    injection_rate_tpd: float = 140.0  # tonnes per day
    steam_pressure_bar: float = 68.0
    steam_temperature_c: float = 282.0
    steam_quality_pct: float = 81.0  # Dry steam fraction
    cumulative_injected_tonnes: float = 4800.0
    injection_days: int = 10
    soak_days: int = 6
    production_days: int = 60
    default_cycle_stage: str = "Production"


@dataclass(frozen=True)
class WellConstants:
    well_id: str = "0cacd33e-874a-408f-44e0-67c262ca762e"
    well_name: str = "BW-01"
    field_id: str = "acc35770-82ba-4b5f-65e5-17c372a7539a"
    field_name: str = "Baghewala Heavy Oil Field"
    basin: str = "Bikaner-Nagaur Basin, Rajasthan"
    pump_type: str = "Sucker Rod Pump (SRP)"
    pump_api_spec: str = "API C-228D-200-86"
    nominal_spm: float = 2.0
    stroke_length_in: float = 86.0
    stroke_length_m: float = 2.18
    barrel_fillage_pct: float = 82.0
    current_oil_rate_bopd: float = 450.5
    water_rate_bwpd: float = 12.5
    gas_rate_mcfd: float = 620.0
    bsw_water_cut_pct: float = 2.7
    gor_scf_per_bbl: float = 1376.0
    flowing_wellhead_pressure_psia: float = 610.0
    flowing_bottomhole_pressure_psia: float = 2310.0
    casing_pressure_psia: float = 185.0
    drawdown_psia: float = 1430.0  # 3740.0 - 2310.0
    rod_peak_load_lbs: float = 14250.0
    rod_rating_lbs: float = 22000.0
    surface_motor_kw: float = 48.0
    daily_energy_kwh: float = 1150.0


@dataclass(frozen=True)
class SurfaceConstants:
    separator_model: str = "V-101 Horizontal 3-Phase Heavy Oil Degasser"
    separator_pressure_psia: float = 140.0
    separator_retention_min: float = 45.0
    storage_tank_spec: str = "API 650 Heated Cylindrical Tank (TK-01/02)"
    tank_capacity_bbl: float = 5000.0
    tank_current_level_pct: float = 68.4
    tank_storage_temp_c: float = 54.0


@dataclass(frozen=True)
class ModelConstants:
    version: str = "V1.3-Hybrid"
    zero_threshold: float = 0.1500
    features_count: int = 50
    dataset_name: str = "Dataset ENR004"
    dataset_records: int = 15699
    dataset_wells: int = 48
    holdout_r2_positive: float = 0.9887
    holdout_r2_overall: float = 0.9507
    holdout_mae_bopd: float = 89.80
    holdout_rmse_bopd: float = 266.44
    baseline_mae_bopd: float = 100.74


RESERVOIR = ReservoirConstants()
STEAM = SteamConstants()
WELL = WellConstants()
SURFACE = SurfaceConstants()
MODEL = ModelConstants()


def get_all_twin_constants() -> Dict[str, Any]:
    """Serializes all constants into a unified dictionary for API/frontend consumption."""
    return {
        "reservoir": asdict(RESERVOIR),
        "steam": asdict(STEAM),
        "well": asdict(WELL),
        "surface": asdict(SURFACE),
        "model": asdict(MODEL),
    }
