from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.digital_twin import (
    ReservoirParameters,
    SteamInjectionParameters,
    WellProductionParameters,
    SurfaceSystemParameters,
)
from backend.app.schemas.prediction import PredictionResponse


class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, description="Descriptive scenario name (e.g. 'CSS Cycle 2 High Steam Pressure')")
    description: Optional[str] = Field(default=None, description="Detailed explanation of the operating philosophy or experiment.")
    reservoir: Optional[ReservoirParameters] = None
    steam_injection: Optional[SteamInjectionParameters] = None
    well_production: Optional[WellProductionParameters] = None
    surface_system: Optional[SurfaceSystemParameters] = None
    features: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional 50-feature ML vector if direct model inference is requested for this scenario."
    )


class ScenarioResult(BaseModel):
    predicted_production: Optional[PredictionResponse] = None
    illustrative_metrics: Optional[Dict[str, Any]] = None
    status: str = "completed"
    executed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ScenarioResponse(BaseModel):
    scenario_id: str
    name: str
    description: Optional[str]
    created_at: str
    parameters: Dict[str, Any]
    results: Optional[ScenarioResult] = None
    disclaimer: str = (
        "Operating parameters stored in this scenario are distinguished between ML model inputs and "
        "illustrative/unconnected digital twin physical variables."
    )


class ScenarioListResponse(BaseModel):
    total: int
    scenarios: List[ScenarioResponse]


class SimulationRequest(BaseModel):
    scenario_id: Optional[str] = Field(default=None, description="Optional existing scenario ID to simulate.")
    horizon_days: int = Field(default=7, ge=1, le=30, description="Simulation forecast horizon in days.")
    current_oil_rate_bopd: float = Field(..., ge=0.0, description="Current baseline oil rate for persistence fallback.")
    features: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional 50-feature dictionary. If not fully provided, known values are extracted from scenario parameters."
    )
    reservoir: Optional[ReservoirParameters] = None
    steam_injection: Optional[SteamInjectionParameters] = None
    well_production: Optional[WellProductionParameters] = None
    surface_system: Optional[SurfaceSystemParameters] = None


class DailyForecastPoint(BaseModel):
    day: int
    date: str
    predicted_oil_rate_bopd: float
    strategy_used: str
    zero_probability: float
    is_ml_derived: bool
    is_illustrative_extrapolation: bool
    notes: str


class SimulationResponse(BaseModel):
    simulation_id: str
    timestamp: str
    horizon_days: int
    is_physical_reservoir_simulation: bool = Field(
        default=False,
        description="CRITICAL FLAG: Always FALSE for V1.3 backend. No numerical Navier-Stokes, Darcy flow, or thermal steam simulator is active."
    )
    simulation_type: str = Field(
        default="hybrid_ml_day1_with_illustrative_trend",
        description="Type of simulation executed: Day 1 ML two-stage prediction combined with explicitly labeled illustrative trends."
    )
    day_1_ml_prediction: Optional[PredictionResponse] = None
    daily_projections: List[DailyForecastPoint]
    physics_limitations: List[str] = Field(
        default_factory=lambda: [
            "Thermal CSS reservoir dynamics (viscosity reduction vs temperature) are NOT solved by this model.",
            "Multiphase Darcy flow in heavy oil dolomite/sandstone is NOT simulated.",
            "Steam breakthrough, gravity override, and reservoir pressure depletion are NOT physically modeled.",
            "Day 1 prediction is ML-driven (V1.3 hybrid); Day 2+ projections are illustrative operational trends, NOT verified physical forecasts."
        ]
    )
    parameters_used: Dict[str, Any]
