import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.model_loader import ModelLoader
from backend.app.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("baghewala.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML Model
    logger.info("Initializing Baghewala Digital Twin Backend...")
    loader = ModelLoader.get_instance()
    loader.load()
    if loader.is_loaded:
        logger.info(
            f"V1.3 Two-Stage Oil Model loaded successfully ({len(loader.features)} features, threshold={loader.zero_threshold})."
        )
    else:
        logger.warning(f"Model failed to load at startup: {loader.load_error}")
    yield
    # Shutdown
    logger.info("Baghewala Digital Twin Backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade FastAPI backend for the AI-enabled Well-to-Surface Digital Twin "
        "for the Baghewala heavy-oil field (Bikaner-Nagaur Basin, Rajasthan, India).\n\n"
        "Integrates the trained V1.3 Two-Stage Hybrid Oil Production Model with reservoir, well, "
        "steam injection (CSS), and surface pumping state management."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Also mount /api/twin directly to satisfy exact prompt specification
from backend.app.api.routes.integrated_twin import router as direct_twin_router
app.include_router(direct_twin_router, prefix="/api")


from fastapi.staticfiles import StaticFiles

# Mount static frontend build if present
frontend_dist = settings.BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    app.mount("/dashboard", StaticFiles(directory=str(frontend_dist), html=True), name="dashboard")


@app.get("/", summary="Root Status & Service Overview", tags=["System"])
def root_overview():
    loader = ModelLoader.get_instance()
    frontend_available = frontend_dist.exists()
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "dashboard_url": "/dashboard" if frontend_available else None,
        "api_v1_health": f"{settings.API_V1_STR}/health",
        "api_v1_model_info": f"{settings.API_V1_STR}/model/info",
        "api_v1_predict": f"{settings.API_V1_STR}/predict",
        "model_status": {
            "loaded": loader.is_loaded,
            "version": loader.manifest.get("model_version", "V1.3-Hybrid"),
            "target": loader.manifest.get("target", "Next-day oil production rate (BOPD)"),
            "features_required": len(loader.features),
            "disclaimer": "Model is experimental; Baghewala field data applicability unverified.",
        },
    }

