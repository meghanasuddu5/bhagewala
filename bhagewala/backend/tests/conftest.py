import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.model_loader import ModelLoader


@pytest.fixture(scope="session")
def client():
    # Ensure model is loaded before tests
    ModelLoader.get_instance().load()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def sample_feature_payload():
    from backend.app.services.prediction_service import prediction_service
    features = prediction_service.generate_baseline_features(
        current_oil_rate_bopd=450.5,
        reservoir_pressure_psia=3740.0,
    )
    return {
        "current_oil_rate_bopd": 450.5,
        "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
        "production_date": "2026-09-27",
        "features": features,
    }
