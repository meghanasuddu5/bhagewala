import logging
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.scenario import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioListResponse,
    SimulationRequest,
    SimulationResponse,
)
from backend.app.services.scenario_service import scenario_service

logger = logging.getLogger("baghewala.api.routes.scenarios")
router = APIRouter(tags=["Scenarios"])


@router.post("/scenarios", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED, summary="Create Simulation Scenario")
def create_scenario(data: ScenarioCreate):
    try:
        return scenario_service.create_scenario(data)
    except Exception as e:
        logger.exception("Failed to create scenario")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not create scenario: {str(e)}",
        )


@router.get("/scenarios", response_model=ScenarioListResponse, summary="List All Operating Scenarios")
def list_scenarios():
    scenarios = scenario_service.list_scenarios()
    return ScenarioListResponse(total=len(scenarios), scenarios=scenarios)


@router.get("/scenarios/{scenario_id}", response_model=ScenarioResponse, summary="Retrieve Specific Scenario")
def get_scenario(scenario_id: str):
    sc = scenario_service.get_scenario(scenario_id)
    if not sc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found.",
        )
    return sc


@router.post("/simulate", response_model=SimulationResponse, summary="Run Operational Simulation / Projection")
def run_simulation(request: SimulationRequest):
    """
    Executes an operational simulation for the requested time horizon:
    - Day 1: Genuine V1.3 Two-stage ML prediction.
    - Days 2+: Explicitly labeled illustrative projections.
    - Explicitly sets `is_physical_reservoir_simulation=False`.
    """
    try:
        return scenario_service.simulate(request)
    except Exception as e:
        logger.exception("Simulation execution failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Simulation error: {str(e)}",
        )
