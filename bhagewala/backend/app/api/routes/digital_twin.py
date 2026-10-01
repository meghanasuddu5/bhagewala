import logging
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.digital_twin import (
    DigitalTwinStateRequest,
    DigitalTwinStateResponse,
)
from backend.app.services.digital_twin_service import digital_twin_service

logger = logging.getLogger("baghewala.api.routes.digital_twin")
router = APIRouter(tags=["Digital Twin"])


@router.post("/digital-twin/state", response_model=DigitalTwinStateResponse, status_code=status.HTTP_201_CREATED, summary="Update Digital Twin Operational State")
def update_digital_twin_state(request: DigitalTwinStateRequest):
    try:
        return digital_twin_service.update_state(request)
    except Exception as e:
        logger.exception("Failed to update digital twin state")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid digital twin state update: {str(e)}",
        )


@router.get("/digital-twin/state", response_model=DigitalTwinStateResponse, summary="Get Latest Digital Twin Operational State")
def get_digital_twin_state():
    state = digital_twin_service.get_latest_state()
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No digital twin state currently recorded.",
        )
    return state
