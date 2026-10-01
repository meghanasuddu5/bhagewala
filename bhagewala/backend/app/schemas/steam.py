from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class CSSCycleStage(str, Enum):
    INJECTION = "Injection"
    SOAKING = "Soaking"
    PRODUCTION = "Production"
    INTER_CYCLE_REST = "Inter-cycle Rest"
    UNKNOWN = "Unknown"


class SteamInjectionParameters(BaseModel):
    """
    Thermal Cyclic Steam Stimulation (CSS) parameters for Baghewala heavy oil recovery.
    Note: These are physical digital twin telemetry parameters and are NOT ingested by the current
    ENR004-trained V1.3 ML model.
    """
    steam_injection_rate_tpd: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Steam injection rate in tonnes per day (TPD). [Thermal EOR parameter, not ingested by V1.3 ML]"
    )
    steam_pressure_bar: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Steam injection line pressure in bar. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    steam_temperature_deg_c: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Steam temperature at wellhead in Celsius. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    steam_quality_pct: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Vapor steam quality percentage (X %). [Physical DT parameter, not ingested by V1.3 ML]"
    )
    cumulative_injected_steam_tonnes: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Cumulative injected steam volume in metric tonnes. [Physical DT parameter, not ingested by V1.3 ML]"
    )
    css_cycle_stage: Optional[CSSCycleStage] = Field(
        default=CSSCycleStage.UNKNOWN,
        description="Current operational phase of the CSS cycle: Injection, Soaking, Production, or Rest."
    )
