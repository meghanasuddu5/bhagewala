import logging
from typing import Dict, Any, List

logger = logging.getLogger("baghewala.utils.validation")


def validate_feature_vector(features: Dict[str, Any], required_features: List[str]) -> List[str]:
    """
    Validates that all required ML feature names are present in the provided dictionary.
    Returns a list of missing feature names, or an empty list if all are present.
    """
    missing = [feat for feat in required_features if feat not in features]
    if missing:
      logger.warning(f"Feature vector validation failed: {len(missing)} missing features ({missing[:5]}...)")
    return missing


def validate_numerical_bounds(features: Dict[str, Any]) -> List[str]:
    """
    Checks physical boundaries on key variables. Returns warning strings if non-physical values exist.
    """
    warnings = []
    if features.get("oil_rate_bopd", 0) < 0:
        warnings.append("oil_rate_bopd cannot be negative.")
    if features.get("reservoir_pressure_psia", 0) < 0:
        warnings.append("reservoir_pressure_psia cannot be negative.")
    if features.get("water_rate_bwpd", 0) < 0:
        warnings.append("water_rate_bwpd cannot be negative.")
    if features.get("gas_rate_mcfd", 0) < 0:
        warnings.append("gas_rate_mcfd cannot be negative.")
    return warnings
