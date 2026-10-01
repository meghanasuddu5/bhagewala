import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status

from backend.app.core.config import settings
from backend.app.core.model_loader import ModelLoader, ModelLoadError
from backend.app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    ModelInfoResponse,
    HealthResponse,
)
from backend.app.schemas.digital_twin import (
    DigitalTwinStateRequest,
    DigitalTwinStateResponse,
)
from backend.app.schemas.scenario import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioListResponse,
    SimulationRequest,
    SimulationResponse,
)
from backend.app.services.prediction_service import prediction_service
from backend.app.services.scenario_service import scenario_service
from backend.app.services.digital_twin_service import digital_twin_service

logger = logging.getLogger("baghewala.api.routes")
router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Backend and Model Health Check",
    tags=["System"],
)
def get_health():
    """Returns backend operational status, model loading status, and version."""
    loader = ModelLoader.get_instance()
    is_healthy = loader.is_loaded
    return HealthResponse(
        status="healthy" if is_healthy else "degraded",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        model_loaded=loader.is_loaded,
        model_version=loader.manifest.get("model_version", "V1.3-Hybrid") if loader.is_loaded else None,
        feature_count=len(loader.features) if loader.is_loaded else None,
        error=loader.load_error,
    )


@router.get(
    "/model/info",
    response_model=ModelInfoResponse,
    summary="Model Architecture, Strategy & Feature Metadata",
    tags=["Model"],
)
def get_model_info():
    """
    Returns full metadata for the trained V1.3 Two-Stage Hybrid model:
    - Model version, base model, target, engineering units
    - Positive class definition (zero-production event)
    - List of all 50 required features
    - Decision threshold for zero-production classification
    - Training metrics (MAE, RMSE, R2) and validation status
    """
    try:
        return prediction_service.get_model_info()
    except Exception as e:
        logger.error(f"Error fetching model info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model info: {str(e)}",
        )


@router.get(
    "/model/features/sample",
    summary="Get Sample Feature Vector",
    tags=["Model"],
)
def get_sample_features():
    """
    Utility endpoint returning a complete, valid 50-feature dictionary and baseline current oil rate.
    Useful for frontend forms, API clients, and automated testing.
    """
    return {
        "current_oil_rate_bopd": 450.5,
        "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
        "features": prediction_service.generate_baseline_features(current_oil_rate_bopd=450.5),
    }


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict Next-Day Oil Production Rate",
    tags=["Prediction"],
)
def predict_production(request: PredictionRequest):
    """
    Executes V1.3 Two-Stage Hybrid prediction:
    1. Zero-production classifier determines if well is flagged as non-producing.
    2. If flagged zero, output defaults to `current_oil_rate_bopd` (persistence fallback).
    3. Otherwise, output uses the ExtraTrees regressor prediction.
    """
    try:
        return prediction_service.predict(request)
    except ModelLoadError as mle:
        logger.error(f"Model load error during predict: {mle}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(mle),
        )
    except ValueError as ve:
        logger.warning(f"Validation error during predict: {ve}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve),
        )
    except Exception as e:
        logger.exception("Unexpected error during prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}",
        )


@router.post(
    "/scenarios",
    response_model=ScenarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Simulation Scenario",
    tags=["Scenarios"],
)
def create_scenario(data: ScenarioCreate):
    """Creates a user-defined operating scenario with reservoir, well, steam, and surface parameters."""
    try:
        return scenario_service.create_scenario(data)
    except Exception as e:
        logger.exception("Failed to create scenario")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create scenario: {str(e)}",
        )


@router.get(
    "/scenarios",
    response_model=ScenarioListResponse,
    summary="List All Operating Scenarios",
    tags=["Scenarios"],
)
def list_scenarios():
    """Lists all available scenarios and their computed results."""
    scenarios = scenario_service.list_scenarios()
    return ScenarioListResponse(total=len(scenarios), scenarios=scenarios)


@router.get(
    "/scenarios/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Retrieve Specific Scenario",
    tags=["Scenarios"],
)
def get_scenario(scenario_id: str):
    """Retrieves inputs and evaluation results for a scenario by ID."""
    sc = scenario_service.get_scenario(scenario_id)
    if not sc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found.",
        )
    return sc


@router.post(
    "/digital-twin/state",
    response_model=DigitalTwinStateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Update Digital Twin Operational State",
    tags=["Digital Twin"],
)
def update_digital_twin_state(request: DigitalTwinStateRequest):
    """
    Updates the synchronized digital twin state for reservoir, steam injection, well production,
    and surface systems.
    """
    try:
        return digital_twin_service.update_state(request)
    except Exception as e:
        logger.exception("Failed to update digital twin state")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid digital twin state update: {str(e)}",
        )


@router.get(
    "/digital-twin/state",
    response_model=DigitalTwinStateResponse,
    summary="Get Latest Digital Twin Operational State",
    tags=["Digital Twin"],
)
def get_digital_twin_state():
    """Retrieves the latest synchronized digital twin state."""
    state = digital_twin_service.get_latest_state()
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No digital twin state currently recorded.",
        )
    return state


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Run Operational Simulation / Projection",
    tags=["Simulation"],
)
def run_simulation(request: SimulationRequest):
    """
    Executes an operational simulation for the requested time horizon:
    - Day 1: Genuine V1.3 Two-stage ML prediction.
    - Days 2+: Explicitly labeled illustrative projections.
    - Explicitly sets `is_physical_reservoir_simulation=False` to document lack of Navier-Stokes/thermal multiphase reservoir modeling.
    """
    try:
        return scenario_service.simulate(request)
    except Exception as e:
        logger.exception("Simulation execution failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Simulation error: {str(e)}",
        )
