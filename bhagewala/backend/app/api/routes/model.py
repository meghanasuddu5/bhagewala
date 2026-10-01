import logging
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.prediction import ModelInfoResponse
from backend.app.services.prediction_service import prediction_service

logger = logging.getLogger("baghewala.api.routes.model")
router = APIRouter(tags=["Model"])


@router.get("/model/info", response_model=ModelInfoResponse, summary="Model Architecture & Strategy Metadata")
def get_model_info():
    """
    Returns full metadata for the trained V1.3 Two-Stage Hybrid model:
    - Model version, base model, target, engineering units
    - Positive class definition (zero-production event)
    - List of all 50 required features in strict sequence
    - Decision threshold for zero-production classification (0.1500)
    - Training metrics (MAE, RMSE, R2) and validation status
    - PROMINENT WARNING: Experimental model - not calibrated or validated for Baghewala field operations.
    """
    try:
        return prediction_service.get_model_info()
    except Exception as e:
        logger.error(f"Error fetching model info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve model info: {str(e)}",
        )


@router.get("/model/features/sample", summary="Get Valid Sample Feature Vector")
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
