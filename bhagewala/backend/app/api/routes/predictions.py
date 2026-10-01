import logging
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.prediction import PredictionRequest, PredictionResponse
from backend.app.core.model_loader import ModelLoadError
from backend.app.services.prediction_service import prediction_service

logger = logging.getLogger("baghewala.api.routes.predictions")
router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResponse, summary="Predict Next-Day Oil Production Rate")
def predict_production(request: PredictionRequest):
    """
    Executes V1.3 Two-Stage Hybrid prediction:
    1. Zero-production classifier determines if well is flagged as non-producing (Class 1, cutoff=0.1500).
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
