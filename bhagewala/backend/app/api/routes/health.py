from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.core.model_loader import ModelLoader
from backend.app.schemas.prediction import HealthResponse

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse, summary="Backend and Model Health Check")
def get_health():
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
