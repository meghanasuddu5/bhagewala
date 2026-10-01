import pytest
from backend.app.core.model_loader import ModelLoader


def test_model_artifact_loading():
    loader = ModelLoader.get_instance()
    assert loader.is_loaded is True, f"Model failed to load: {loader.load_error}"
    assert loader.classifier is not None
    assert loader.regressor is not None
    assert isinstance(loader.features, list)
    assert len(loader.features) == 50
    assert 0.10 <= loader.zero_threshold <= 0.20


def test_model_positive_class_and_features():
    loader = ModelLoader.get_instance()
    assert hasattr(loader.classifier, "classes_")
    assert 1 in list(loader.classifier.classes_)
    assert loader.class_1_idx == list(loader.classifier.classes_).index(1)

    # Required key features from domain
    assert "oil_rate_bopd" in loader.features
    assert "water_rate_bwpd" in loader.features
    assert "reservoir_pressure_psia" in loader.features
    assert "oil_rate_bopd_lag1" in loader.features
    assert "oil_rate_bopd_lag7" in loader.features
    assert "oil_rate_bopd_rolling7" in loader.features
    assert "well_id" in loader.features
    assert "field_id" in loader.features
    assert "well_status" in loader.features


def test_model_info_content():
    loader = ModelLoader.get_instance()
    info = loader.get_info()
    assert info["is_loaded"] is True
    assert info["model_version"] == "V1.3-Hybrid"
    assert info["target_units"] == "BOPD"
    assert info["feature_count"] == 50
    assert "Experimental" in info["validation_status"]
