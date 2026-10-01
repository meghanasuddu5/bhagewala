from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    current_oil_rate_bopd: float = Field(
        ...,
        ge=0.0,
        description="Current oil production rate in BOPD, required for V1.3 persistence fallback strategy."
    )
    features: Dict[str, Any] = Field(
        ...,
        description="Key-value mapping of all 50 required model features (lags, rolling averages, engineering variables, categorical tags)."
    )
    well_id: Optional[str] = Field(
        default=None,
        description="Optional well identifier for context and logging."
    )
    production_date: Optional[str] = Field(
        default=None,
        description="Optional production date (YYYY-MM-DD)."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_oil_rate_bopd": 450.5,
                "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
                "production_date": "2026-09-27",
                "features": {
                    "oil_rate_bopd": 450.5,
                    "gas_rate_mcfd": 620.0,
                    "water_rate_bwpd": 12.5,
                    "reservoir_pressure_psia": 3740.0,
                    "flowing_wellhead_pressure_psia": 610.0,
                    "flowing_bottomhole_pressure_psia": 2310.0,
                    "drawdown_psia": 1430.0,
                    "esp_frequency_hz": 30.0,
                    "rod_pump_spm": 2.0,
                    "rod_pump_fillage_pct": 0.0,
                    "gas_lift_rate_mmscfd": 0.0,
                    "bsw_pct": 2.7,
                    "gor_scf_per_bbl": 1376.0,
                    "wor": 0.028,
                    "oil_rate_bopd_lag1": 448.0,
                    "gas_rate_mcfd_lag1": 615.0,
                    "water_rate_bwpd_lag1": 11.8,
                    "reservoir_pressure_psia_lag1": 3741.0,
                    "flowing_wellhead_pressure_psia_lag1": 612.0,
                    "flowing_bottomhole_pressure_psia_lag1": 2311.0,
                    "drawdown_psia_lag1": 1430.0,
                    "esp_frequency_hz_lag1": 30.0,
                    "rod_pump_spm_lag1": 2.0,
                    "rod_pump_fillage_pct_lag1": 0.0,
                    "gas_lift_rate_mmscfd_lag1": 0.0,
                    "bsw_pct_lag1": 2.6,
                    "gor_scf_per_bbl_lag1": 1372.0,
                    "wor_lag1": 0.026,
                    "oil_rate_bopd_lag7": 460.0,
                    "gas_rate_mcfd_lag7": 630.0,
                    "water_rate_bwpd_lag7": 10.5,
                    "reservoir_pressure_psia_lag7": 3745.0,
                    "flowing_wellhead_pressure_psia_lag7": 618.0,
                    "flowing_bottomhole_pressure_psia_lag7": 2315.0,
                    "drawdown_psia_lag7": 1430.0,
                    "esp_frequency_hz_lag7": 30.0,
                    "rod_pump_spm_lag7": 2.0,
                    "rod_pump_fillage_pct_lag7": 0.0,
                    "gas_lift_rate_mmscfd_lag7": 0.0,
                    "bsw_pct_lag7": 2.2,
                    "gor_scf_per_bbl_lag7": 1369.0,
                    "wor_lag7": 0.023,
                    "oil_rate_bopd_rolling7": 452.1,
                    "water_rate_bwpd_rolling7": 11.2,
                    "gas_rate_mcfd_rolling7": 622.4,
                    "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
                    "field_id": "acc35770-82ba-4b5f-65e5-17c372a7539a",
                    "well_status": "PRODUCING",
                    "day_of_week": 6,
                    "month": 9
                }
            }
        }
    }


class PredictionResponse(BaseModel):
    predicted_oil_rate_bopd: float = Field(
        ...,
        description="Final predicted next-day oil production in BOPD, determined by the V1.3 hybrid strategy."
    )
    predicted_zero_probability: float = Field(
        ...,
        description="Classifier probability for zero production event (Class 1)."
    )
    predicted_zero_flag: int = Field(
        ...,
        description="Binary indicator (1 if predicted_zero_probability >= zero_threshold, else 0)."
    )
    zero_threshold: float = Field(
        ...,
        description="Threshold applied to the zero-production classifier."
    )
    raw_regression_prediction_bopd: float = Field(
        ...,
        description="Direct output from the ExtraTrees regression model before applying hybrid fallback."
    )
    current_oil_rate_bopd: float = Field(
        ...,
        description="Input baseline oil rate used for persistence fallback when zero production is flagged."
    )
    prediction_strategy: str = Field(
        ...,
        description="Strategy selected: 'persistence_fallback' or 'v1_2_regression'."
    )
    units: str = Field(
        default="BOPD",
        description="Engineering units of predicted rate."
    )
    model_version: str = Field(
        default="V1.3-Hybrid",
        description="Trained model version identifier."
    )
    target: str = Field(
        default="Next-day oil production rate (BOPD)",
        description="Target definition."
    )
    validation_status: str = Field(
        default="Experimental; not field-validated",
        description="Validation disclaimer indicating field applicability status."
    )
    notes: Optional[str] = Field(
        default="Predicted rate is generated by an experimental ML model trained on ENR004 data; not physically verified for Baghewala reservoir conditions."
    )


class ModelInfoResponse(BaseModel):
    is_loaded: bool
    error: Optional[str] = None
    project: str
    model_version: str
    base_model: str
    target: str
    target_units: str
    prediction_strategy: Dict[str, Any]
    zero_threshold: Optional[float]
    positive_class_definition: str
    feature_count: int
    features: List[str]
    validation_status: str
    dataset: str
    metrics: List[Dict[str, Any]]
    required_runtime_input: List[str]


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Overall service status ('healthy' or 'degraded')")
    service: str = "Baghewala Digital Twin Backend"
    version: str
    model_loaded: bool
    model_version: Optional[str] = None
    feature_count: Optional[int] = None
    error: Optional[str] = None
