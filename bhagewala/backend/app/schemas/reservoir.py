from typing import Optional
from pydantic import BaseModel, Field


class ReservoirParameters(BaseModel):
    """
    Conceptual subsurface reservoir telemetry parameters for Baghewala heavy-oil field.
    Only `reservoir_pressure_psia` is directly mapped to the V1.3 ExtraTrees ML model feature.
    Other parameters are stored for digital twin synchronization and future coupled reservoir modeling.
    """
    reservoir_pressure_psia: float = Field(
        ...,
        ge=0.0,
        description="Static/average reservoir pressure in psia. [NOTE: Ingested by ML model feature 'reservoir_pressure_psia']"
    )
    reservoir_temperature_deg_c: Optional[float] = Field(
        default=45.0,
        ge=0.0,
        description="Native reservoir temperature in Celsius. [Baghewala heavy oil ~40-50°C native. Physical DT parameter, not ingested by V1.3 ML]"
    )
    oil_viscosity_cp: Optional[float] = Field(
        default=14500.0,
        ge=0.0,
        description="Dead oil viscosity in centipoise at native reservoir temp. [Baghewala heavy oil: 10,000-25,000+ cP. Physical DT parameter, not ingested by V1.3 ML]"
    )
    reservoir_depth_m: Optional[float] = Field(
        default=1050.0,
        ge=0.0,
        description="True vertical depth of target reservoir in meters. [Baghewala Bikaner-Nagaur basin ~900-1100m. Physical DT parameter, not ingested by V1.3 ML]"
    )
    reservoir_thickness_m: Optional[float] = Field(
        default=18.0,
        ge=0.0,
        description="Net pay sandstone thickness in meters. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    oil_saturation_pct: Optional[float] = Field(
        default=66.0,
        ge=0.0,
        le=100.0,
        description="Initial/current oil saturation percentage (So %). [Physical DT parameter, not ingested by V1.3 ML]"
    )
