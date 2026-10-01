from fastapi import APIRouter
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.model import router as model_router
from backend.app.api.routes.predictions import router as predictions_router
from backend.app.api.routes.scenarios import router as scenarios_router
from backend.app.api.routes.digital_twin import router as digital_twin_router
from backend.app.api.routes.constants import router as constants_router
from backend.app.api.routes.integrated_twin import router as integrated_twin_router

router = APIRouter()

router.include_router(health_router)
router.include_router(model_router)
router.include_router(predictions_router)
router.include_router(scenarios_router)
router.include_router(digital_twin_router)
router.include_router(constants_router)
router.include_router(integrated_twin_router)

__all__ = ["router"]
