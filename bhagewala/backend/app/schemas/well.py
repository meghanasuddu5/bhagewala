from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


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


class WellProductionParameters(BaseModel):
    """
    Well production and artificial lift telemetry parameters.
    Several fields map directly into the 50-feature ML model vector.
    """
    well_id: str = Field(
        ...,
        description="Unique identifier for the well (e.g. UUID string matching model categorical training values)."
    )
    current_oil_rate_bopd: float = Field(
        ...,
        ge=0.0,
        description="Measured oil rate in Barrels of Oil Per Day. [NOTE: Mapped to ML feature 'oil_rate_bopd' and persistence fallback]"
    )
    water_rate_bwpd: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Produced water rate in Barrels of Water Per Day. [NOTE: Mapped to ML feature 'water_rate_bwpd']"
    )
    gas_rate_mcfd: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Associated gas rate in Thousand Cubic Feet Per Day. [NOTE: Mapped to ML feature 'gas_rate_mcfd']"
    )
    pump_type: Optional[PumpType] = Field(
        default=PumpType.SRP,
        description="Type of artificial lift system installed in the well."
    )
    pump_speed: Optional[float] = Field(
        default=2.0,
        ge=0.0,
        description="Speed of the pump. If SRP, strokes per minute (SPM). If ESP, frequency in Hz."
    )
    pump_operating_status: Optional[EquipmentStatus] = Field(
        default=EquipmentStatus.OPERATING,
        description="Current mechanical operating status of the downhole pump."
    )


class SurfaceSystemParameters(BaseModel):
    """
    Surface facilities, flowlines, and power consumption telemetry.
    """
    pump_power_kw: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Electric motor active power draw in kilowatts."
    )
    energy_consumption_kwh_per_day: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Cumulative electrical energy consumed in kWh/day."
    )
    equipment_status: Optional[EquipmentStatus] = Field(
        default=EquipmentStatus.OPERATING,
        description="Operating status of surface motor, drive head, and electrical controls."
    )
