import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import joblib
import pandas as pd
import numpy as np

from backend.app.core.config import settings

logger = logging.getLogger("baghewala.model_loader")


class ModelLoadError(Exception):
    """Raised when model loading or verification fails."""
    pass


class ModelLoader:
    """
    Manages loading, verification, and runtime caching of the V1.3 Two-Stage Oil Model.
    Artifact:
      - classifier: Pipeline(ColumnTransformer + ExtraTreesClassifier)
      - regressor: Pipeline(ColumnTransformer + ExtraTreesRegressor)
      - features: List[str] (50 required features in strict order)
      - zero_threshold: float (typically 0.15)
    """

    _instance: Optional["ModelLoader"] = None

    def __init__(self):
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.classifier: Optional[Any] = None
        self.regressor: Optional[Any] = None
        self.features: List[str] = []
        self.zero_threshold: float = 0.15
        self.manifest: Dict[str, Any] = {}
        self.metrics: List[Dict[str, Any]] = []
        self.class_1_idx: int = 1
        self.model_path: Path = settings.get_model_path()
        self.manifest_path: Path = settings.get_manifest_path()
        self.metrics_path: Path = settings.get_metrics_path()

    @classmethod
    def get_instance(cls) -> "ModelLoader":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance.load()
        return cls._instance

    def load(self, force_reload: bool = False) -> None:
        """Loads and verifies the model and its metadata."""
        if self.is_loaded and not force_reload:
            return

        logger.info(f"Loading Baghewala ML model from: {self.model_path}")

        # 1. Load manifest if available
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    self.manifest = json.load(f)
                logger.info(f"Loaded model manifest from {self.manifest_path}")
            except Exception as e:
                logger.warning(f"Could not read manifest at {self.manifest_path}: {e}")
                self.manifest = {
                    "project": "Baghewala Well-to-Surface Digital Twin",
                    "model_version": "V1.3-Hybrid",
                    "base_model": "V1.2-Two-Stage",
                    "target": "Next-day oil production rate (BOPD)",
                    "validation_status": "Experimental; not field-validated",
                }
        else:
            logger.warning(f"Manifest not found at {self.manifest_path}")
            self.manifest = {
                "project": "Baghewala Well-to-Surface Digital Twin",
                "model_version": "V1.3-Hybrid",
                "base_model": "V1.2-Two-Stage",
                "target": "Next-day oil production rate (BOPD)",
                "validation_status": "Experimental; not field-validated",
            }

        # 2. Load metrics if available
        if self.metrics_path.exists():
            try:
                metrics_df = pd.read_csv(self.metrics_path)
                self.metrics = metrics_df.to_dict(orient="records")
                logger.info(f"Loaded {len(self.metrics)} benchmark metric records.")
            except Exception as e:
                logger.warning(f"Could not read metrics at {self.metrics_path}: {e}")
                self.metrics = []

        # 3. Load joblib artifact
        if not self.model_path.exists():
            msg = f"Model artifact not found at {self.model_path}"
            logger.error(msg)
            self.load_error = msg
            self.is_loaded = False
            return

        try:
            # Compatibility shim for deserializing ColumnTransformer across sklearn versions (1.6.x to 1.7.x)
            try:
                import sklearn.compose._column_transformer as ct
                if not hasattr(ct, "_RemainderColsList"):
                    ct._RemainderColsList = type("_RemainderColsList", (list,), {})
            except Exception:
                pass

            artifact = joblib.load(self.model_path)
        except Exception as e:
            msg = f"Failed to deserialize joblib artifact from {self.model_path}: {str(e)}"
            logger.error(msg)
            self.load_error = msg
            self.is_loaded = False
            return

        if not isinstance(artifact, dict):
            msg = f"Expected dict artifact, got {type(artifact)}"
            logger.error(msg)
            self.load_error = msg
            self.is_loaded = False
            return

        required_keys = {"classifier", "regressor", "features", "zero_threshold"}
        missing_keys = required_keys - set(artifact.keys())
        if missing_keys:
            msg = f"Artifact missing required keys: {missing_keys}"
            logger.error(msg)
            self.load_error = msg
            self.is_loaded = False
            return

        self.classifier = artifact["classifier"]
        self.regressor = artifact["regressor"]
        self.features = list(artifact["features"])
        self.zero_threshold = float(artifact["zero_threshold"])

        # 4. Verify Classifier positive class for zero-production
        # Classes should include [0, 1] where 1 is zero production
        if hasattr(self.classifier, "classes_"):
            classes = list(self.classifier.classes_)
            if 1 in classes:
                self.class_1_idx = classes.index(1)
            else:
                msg = f"Expected positive class '1' representing zero production in classifier classes: {classes}"
                logger.warning(msg)
                self.class_1_idx = 1 if len(classes) > 1 else 0

        # 5. Verify feature lengths and integrity
        if hasattr(self.classifier, "feature_names_in_"):
            cls_feats = list(self.classifier.feature_names_in_)
            if cls_feats != self.features:
                logger.warning("Classifier feature_names_in_ differs from artifact features list!")

        self.is_loaded = True
        self.load_error = None
        logger.info(
            f"Model loaded successfully: {len(self.features)} features, zero_threshold={self.zero_threshold:.4f}"
        )

    def get_info(self) -> Dict[str, Any]:
        """Returns metadata about the loaded model."""
        return {
            "is_loaded": self.is_loaded,
            "error": self.load_error,
            "project": self.manifest.get("project", "Baghewala Well-to-Surface Digital Twin"),
            "model_version": self.manifest.get("model_version", "V1.3-Hybrid"),
            "base_model": self.manifest.get("base_model", "V1.2-Two-Stage"),
            "target": self.manifest.get("target", "Next-day oil production rate (BOPD)"),
            "target_units": "BOPD",
            "prediction_strategy": self.manifest.get(
                "prediction_strategy",
                {
                    "step_1": "Zero-production classifier flags zero probability against zero_threshold",
                    "step_2_flag_1": "Use persistence baseline (current oil rate)",
                    "step_2_flag_0": "Use V1.2 regression rate",
                },
            ),
            "zero_threshold": self.zero_threshold if self.is_loaded else None,
            "positive_class_definition": "Class 1: Zero production event",
            "feature_count": len(self.features),
            "features": self.features,
            "validation_status": self.manifest.get(
                "validation_status", "Experimental; not field-validated"
            ),
            "dataset": self.manifest.get(
                "dataset", "ENR004 production dataset; Baghewala applicability unverified"
            ),
            "metrics": self.metrics,
            "required_runtime_input": self.manifest.get(
                "required_runtime_input",
                [
                    "50 model feature inputs (exact feature order)",
                    "current oil production rate for persistence fallback",
                ],
            ),
        }

    def predict(
        self,
        features_dict: Dict[str, Any],
        current_oil_rate_bopd: float,
    ) -> Dict[str, Any]:
        """
        Executes V1.3 hybrid inference:
        1. Validates and constructs exact feature row DataFrame.
        2. Computes classifier zero probability.
        3. Applies zero threshold to set predicted_zero_flag.
        4. Runs regression prediction.
        5. Returns final predicted rate (persistence fallback if zero flag is 1, else regression).
        """
        if not self.is_loaded:
            raise ModelLoadError(f"Model is not loaded: {self.load_error}")

        # Check for missing features
        missing_features = [f for f in self.features if f not in features_dict]
        if missing_features:
            raise ValueError(
                f"Missing {len(missing_features)} required model features: {missing_features[:10]}"
                + ("..." if len(missing_features) > 10 else "")
            )

        # Build single-row DataFrame in the EXACT feature order
        row_data = {f: [features_dict[f]] for f in self.features}
        df = pd.DataFrame(row_data)

        # Classifier inference
        zero_probs = self.classifier.predict_proba(df)
        zero_prob = float(zero_probs[0, self.class_1_idx])
        is_zero_flag = bool(zero_prob >= self.zero_threshold)

        # Regressor inference
        raw_reg_pred = float(self.regressor.predict(df)[0])

        # V1.3 Strategy decision
        if is_zero_flag:
            final_pred = float(current_oil_rate_bopd)
            strategy = "persistence_fallback"
        else:
            final_pred = raw_reg_pred
            strategy = "v1_2_regression"

        return {
            "predicted_oil_rate_bopd": final_pred,
            "predicted_zero_probability": zero_prob,
            "predicted_zero_flag": 1 if is_zero_flag else 0,
            "zero_threshold": self.zero_threshold,
            "raw_regression_prediction_bopd": raw_reg_pred,
            "current_oil_rate_bopd": float(current_oil_rate_bopd),
            "prediction_strategy": strategy,
            "units": "BOPD",
            "model_version": self.manifest.get("model_version", "V1.3-Hybrid"),
            "target": "Next-day oil production rate (BOPD)",
            "validation_status": self.manifest.get(
                "validation_status", "Experimental; not field-validated"
            ),
        }
