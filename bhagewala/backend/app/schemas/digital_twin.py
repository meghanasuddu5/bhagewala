from datetime import datetime
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CSSCycleStage(str, Enum):
    INJECTION = "Injection"
    SOAKING = "Soaking"
    PRODUCTION = "Production"
    INTER_CYCLE_REST = "Inter-cycle Rest"
    UNKNOWN = "Unknown"


class PumpType(str, Enum):
    ESP = "Electric Submersible Pump (ESP)"
    SRP = "Sucker Rod Pump (SRP)"
    PCP = "Progressing Cavity Pump (PCP)"
    HYDRAULIC_JET = "Hydraulic Jet Pump"
    GAS_LIFT = "Gas Lift"
    NATURAL_FLOW = "Natural Flow"


class EquipmentStatus(str, Enum):
    OPERATING = "Operating"
    IDLE = "Idle"
    STANDBY = "Standby"
    MAINTENANCE = "Maintenance"
    TRIPPED = "Tripped / Fault"


class ReservoirParameters(BaseModel):
    reservoir_pressure_psia: float = Field(
        ..., ge=0.0, description="Static/average reservoir pressure in psia. [NOTE: Mapped to ML feature 'reservoir_pressure_psia']"
    )
    reservoir_temperature_deg_c: Optional[float] = Field(
        default=45.0, ge=0.0, description="Reservoir temperature in Celsius. [Baghewala heavy oil ~40-50°C native. Physical DT parameter, not ingested by V1.3 ML]"
    )
    oil_viscosity_cp: Optional[float] = Field(
        default=15000.0, ge=0.0, description="Dead oil viscosity in centipoise at native reservoir temp. [Baghewala heavy oil: 10,000-25,000+ cP. Physical DT parameter, not ingested by V1.3 ML]"
    )
    reservoir_depth_m: Optional[float] = Field(
        default=1050.0, ge=0.0, description="True vertical depth of target reservoir in meters. [Baghewala Bikaner-Nagaur basin ~900-1100m. Physical DT parameter, not ingested by V1.3 ML]"
    )
    reservoir_thickness_m: Optional[float] = Field(
        default=15.0, ge=0.0, description="Net pay thickness in meters. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    oil_saturation_pct: Optional[float] = Field(
        default=65.0, ge=0.0, le=100.0, description="Initial/current oil saturation percentage (So %). [Physical DT parameter, not ingested by V1.3 ML]"
    )


class SteamInjectionParameters(BaseModel):
    steam_injection_rate_tpd: Optional[float] = Field(
        default=0.0, ge=0.0, description="Steam injection rate in tonnes per day (TPD). [Thermal EOR parameter, not ingested by V1.3 ML]"
    )
    steam_pressure_bar: Optional[float] = Field(
        default=0.0, ge=0.0, description="Steam injection pressure in bar. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    steam_temperature_deg_c: Optional[float] = Field(
        default=0.0, ge=0.0, description="Steam injection temperature in Celsius (~250-320°C for CSS). [Physical DT parameter, not ingested by V1.3 ML]"
    )
    steam_quality_pct: Optional[float] = Field(
        default=80.0, ge=0.0, le=100.0, description="Dry steam vapor quality percentage (x_s %). [Physical DT parameter, not ingested by V1.3 ML]"
    )
    cumulative_injected_steam_tonnes: Optional[float] = Field(
        default=0.0, ge=0.0, description="Cumulative steam injected to date in metric tonnes. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    css_cycle_stage: CSSCycleStage = Field(
        default=CSSCycleStage.PRODUCTION,
        description="Current Cyclic Steam Stimulation (CSS) cycle phase. [Physical DT parameter, not ingested by V1.3 ML]"
    )


class WellProductionParameters(BaseModel):
    well_id: str = Field(
        default="0cacd33e-874a-408f-44e0-67c262ca762e",
        description="Unique well identifier. [Mapped to ML categorical feature 'well_id']"
    )
    current_oil_rate_bopd: float = Field(
        ..., ge=0.0, description="Current oil production rate in BOPD. [Mapped to ML feature 'oil_rate_bopd' & persistence baseline]"
    )
    water_rate_bwpd: float = Field(
        default=0.0, ge=0.0, description="Water production rate in BWPD. [Mapped to ML feature 'water_rate_bwpd']"
    )
    gas_rate_mcfd: Optional[float] = Field(
        default=0.0, ge=0.0, description="Associated gas production rate in MCFD. [Mapped to ML feature 'gas_rate_mcfd']"
    )
    pump_type: PumpType = Field(
        default=PumpType.SRP,
        description="Installed artificial lift type."
    )
    pump_speed: Optional[float] = Field(
        default=2.0, ge=0.0, description="Pump speed: Strokes Per Minute (SPM) for SRP, or Hertz (Hz) for ESP. [Mapped to 'rod_pump_spm' or 'esp_frequency_hz']"
    )
    pump_operating_status: EquipmentStatus = Field(
        default=EquipmentStatus.OPERATING,
        description="Operating status of the downhole pump."
    )
    production_date: str = Field(
        default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"),
        description="Measurement or telemetry date (YYYY-MM-DD)."
    )


class SurfaceSystemParameters(BaseModel):
    pump_power_kw: Optional[float] = Field(
        default=45.0, ge=0.0, description="Active electric motor power in kW. [Surface telemetry, not ingested by V1.3 ML]"
    )
    energy_consumption_kwh_per_day: Optional[float] = Field(
        default=1080.0, ge=0.0, description="Total surface power consumption per day in kWh. [Surface telemetry, not ingested by V1.3 ML]"
    )
    equipment_status: EquipmentStatus = Field(
        default=EquipmentStatus.OPERATING,
        description="Surface facility/wellhead equipment health status."
    )
    operating_constraints: Dict[str, Any] = Field(
        default_factory=lambda: {
            "max_wellhead_pressure_psia": 1500.0,
            "max_motor_temp_deg_c": 120.0,
            "max_flowline_temp_deg_c": 90.0,
            "min_fillage_pct": 50.0
        },
        description="Operating limits and safeguard thresholds."
    )


class DigitalTwinStateRequest(BaseModel):
    reservoir: ReservoirParameters
    steam_injection: SteamInjectionParameters
    well_production: WellProductionParameters
    surface_system: SurfaceSystemParameters
    notes: Optional[str] = Field(
        default=None,
        description="Operational remarks, engineer shift notes, or simulation scenario tags."
    )


class DigitalTwinStateResponse(BaseModel):
    state_id: str
    timestamp: str
    reservoir: ReservoirParameters
    steam_injection: SteamInjectionParameters
    well_production: WellProductionParameters
    surface_system: SurfaceSystemParameters
    notes: Optional[str]
    model_mapping_summary: Dict[str, Any] = Field(
        default_factory=lambda: {
            "directly_mapped_to_ml_features": [
                "reservoir.reservoir_pressure_psia -> reservoir_pressure_psia",
                "well_production.well_id -> well_id",
                "well_production.current_oil_rate_bopd -> oil_rate_bopd (and persistence baseline)",
                "well_production.water_rate_bwpd -> water_rate_bwpd",
                "well_production.gas_rate_mcfd -> gas_rate_mcfd",
                "well_production.pump_speed -> rod_pump_spm / esp_frequency_hz"
            ],
            "unconnected_to_ml_model": [
                "reservoir.reservoir_temperature_deg_c",
                "reservoir.oil_viscosity_cp",
                "reservoir.reservoir_depth_m",
                "reservoir.reservoir_thickness_m",
                "reservoir.oil_saturation_pct",
                "steam_injection.* (steam rate, pressure, temp, quality, cumulative, CSS stage)",
                "surface_system.* (pump power, energy consumption, surface equipment constraints)"
            ],
            "disclaimer": "The current experimental V1.3 ML model was trained on empirical ENR004 time-series data without thermodynamic steam or multi-phase reservoir physics. Operating parameters outside the 50 model features are logged for digital twin twin-state synchronization and future coupled simulation but do not alter current ML inference."
        }
    )
