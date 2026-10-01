import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from backend.app.core.model_loader import ModelLoader, ModelLoadError
from backend.app.schemas.prediction import PredictionRequest, PredictionResponse, ModelInfoResponse

logger = logging.getLogger("baghewala.prediction_service")


class PredictionService:
    def __init__(self, model_loader: Optional[ModelLoader] = None):
        self.model_loader = model_loader or ModelLoader.get_instance()

    def get_model_info(self) -> ModelInfoResponse:
        info = self.model_loader.get_info()
        return ModelInfoResponse(**info)

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """
        Executes inference for a prediction request under V1.3 hybrid strategy:
        1. Checks 50 features.
        2. Evaluates zero-production classifier.
        3. Applies threshold (0.15).
        4. If zero flagged, returns current_oil_rate_bopd as persistence baseline.
        5. Else returns regressor prediction.
        """
        if not self.model_loader.is_loaded:
            raise ModelLoadError(
                f"Model artifact not loaded. Details: {self.model_loader.load_error}"
            )

        features = request.features
        missing = [f for f in self.model_loader.features if f not in features]
        if missing:
            raise ValueError(
                f"Incomplete feature set: {len(missing)} of 50 features missing. "
                f"Missing: {missing[:8]}{'...' if len(missing) > 8 else ''}. "
                f"The V1.3 model requires all 50 training features."
            )

        raw_result = self.model_loader.predict(
            features_dict=features,
            current_oil_rate_bopd=request.current_oil_rate_bopd,
        )

        explanation = (
            f"Zero classifier prob={raw_result['predicted_zero_probability']:.4f} "
            f"(threshold={raw_result['zero_threshold']:.4f}). "
        )
        if raw_result["prediction_strategy"] == "persistence_fallback":
            explanation += (
                f"Classifier flagged zero production. Persistence fallback applied: "
                f"output locked to current oil rate {raw_result['current_oil_rate_bopd']:.2f} BOPD."
            )
        else:
            explanation += (
                f"Classifier flagged normal production. Regression output used: "
                f"{raw_result['raw_regression_prediction_bopd']:.2f} BOPD."
            )

        return PredictionResponse(
            predicted_oil_rate_bopd=raw_result["predicted_oil_rate_bopd"],
            predicted_zero_probability=raw_result["predicted_zero_probability"],
            predicted_zero_flag=raw_result["predicted_zero_flag"],
            zero_threshold=raw_result["zero_threshold"],
            raw_regression_prediction_bopd=raw_result["raw_regression_prediction_bopd"],
            current_oil_rate_bopd=raw_result["current_oil_rate_bopd"],
            prediction_strategy=raw_result["prediction_strategy"],
            units=raw_result["units"],
            model_version=raw_result["model_version"],
            target=raw_result["target"],
            validation_status=raw_result["validation_status"],
            notes=explanation,
        )

    def generate_baseline_features(
        self,
        current_oil_rate_bopd: float = 450.0,
        water_rate_bwpd: float = 15.0,
        gas_rate_mcfd: float = 600.0,
        reservoir_pressure_psia: float = 3740.0,
        well_id: str = "0cacd33e-874a-408f-44e0-67c262ca762e",
        field_id: str = "acc35770-82ba-4b5f-65e5-17c372a7539a",
        well_status: str = "PRODUCING",
    ) -> Dict[str, Any]:
        """
        Synthesizes a complete 50-feature dictionary based on baseline physical values
        and consistent lag/rolling assumptions. Useful for API scenario testing.
        """
        features: Dict[str, Any] = {
            "oil_rate_bopd": current_oil_rate_bopd,
            "gas_rate_mcfd": gas_rate_mcfd,
            "water_rate_bwpd": water_rate_bwpd,
            "reservoir_pressure_psia": reservoir_pressure_psia,
            "flowing_wellhead_pressure_psia": 615.0,
            "flowing_bottomhole_pressure_psia": 2315.0,
            "drawdown_psia": max(0.0, reservoir_pressure_psia - 2315.0),
            "esp_frequency_hz": 30.0,
            "rod_pump_spm": 2.0,
            "rod_pump_fillage_pct": 0.0,
            "gas_lift_rate_mmscfd": 0.0,
            "bsw_pct": (water_rate_bwpd / (current_oil_rate_bopd + water_rate_bwpd + 1e-6)) * 100.0,
            "gor_scf_per_bbl": (gas_rate_mcfd * 1000.0) / (current_oil_rate_bopd + 1e-6),
            "wor": water_rate_bwpd / (current_oil_rate_bopd + 1e-6),
            "oil_rate_bopd_lag1": current_oil_rate_bopd,
            "gas_rate_mcfd_lag1": gas_rate_mcfd,
            "water_rate_bwpd_lag1": water_rate_bwpd,
            "reservoir_pressure_psia_lag1": reservoir_pressure_psia,
            "flowing_wellhead_pressure_psia_lag1": 615.0,
            "flowing_bottomhole_pressure_psia_lag1": 2315.0,
            "drawdown_psia_lag1": max(0.0, reservoir_pressure_psia - 2315.0),
            "esp_frequency_hz_lag1": 30.0,
            "rod_pump_spm_lag1": 2.0,
            "rod_pump_fillage_pct_lag1": 0.0,
            "gas_lift_rate_mmscfd_lag1": 0.0,
            "bsw_pct_lag1": (water_rate_bwpd / (current_oil_rate_bopd + water_rate_bwpd + 1e-6)) * 100.0,
            "gor_scf_per_bbl_lag1": (gas_rate_mcfd * 1000.0) / (current_oil_rate_bopd + 1e-6),
            "wor_lag1": water_rate_bwpd / (current_oil_rate_bopd + 1e-6),
            "oil_rate_bopd_lag7": current_oil_rate_bopd,
            "gas_rate_mcfd_lag7": gas_rate_mcfd,
            "water_rate_bwpd_lag7": water_rate_bwpd,
            "reservoir_pressure_psia_lag7": reservoir_pressure_psia,
            "flowing_wellhead_pressure_psia_lag7": 615.0,
            "flowing_bottomhole_pressure_psia_lag7": 2315.0,
            "drawdown_psia_lag7": max(0.0, reservoir_pressure_psia - 2315.0),
            "esp_frequency_hz_lag7": 30.0,
            "rod_pump_spm_lag7": 2.0,
            "rod_pump_fillage_pct_lag7": 0.0,
            "gas_lift_rate_mmscfd_lag7": 0.0,
            "bsw_pct_lag7": (water_rate_bwpd / (current_oil_rate_bopd + water_rate_bwpd + 1e-6)) * 100.0,
            "gor_scf_per_bbl_lag7": (gas_rate_mcfd * 1000.0) / (current_oil_rate_bopd + 1e-6),
            "wor_lag7": water_rate_bwpd / (current_oil_rate_bopd + 1e-6),
            "oil_rate_bopd_rolling7": current_oil_rate_bopd,
            "water_rate_bwpd_rolling7": water_rate_bwpd,
            "gas_rate_mcfd_rolling7": gas_rate_mcfd,
            "well_id": well_id,
            "field_id": field_id,
            "well_status": well_status,
            "day_of_week": datetime.utcnow().weekday(),
            "month": datetime.utcnow().month,
        }
        return features


prediction_service = PredictionService()
