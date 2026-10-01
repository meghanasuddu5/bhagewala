"""
Baghewala Well-to-Surface Digital Twin — Data Source Provenance Tests
Verifies that all displayed/computed quantities have authoritative registry entries,
and validates that banned overclaiming words ("Audited", "Metered", "Calibrated") do not appear.
"""

import pytest
import re
from pathlib import Path
from backend.app.core.data_registry import (
    DATA_SOURCE_CATALOG,
    ProvenanceClass,
    get_provenance,
    validate_provenance_claim
)

def test_data_source_catalog_entries():
    """Verify that all core quantities belong to exactly one valid provenance class."""
    assert len(DATA_SOURCE_CATALOG) >= 20
    for key, item in DATA_SOURCE_CATALOG.items():
        assert "class" in item, f"Missing class for {key}"
        assert isinstance(item["class"], ProvenanceClass), f"Invalid class type for {key}"
        assert "source" in item, f"Missing source description for {key}"
        assert len(item["source"]) > 5

def test_get_provenance_defaults():
    """Verify fallback behavior for unknown quantities."""
    prov = get_provenance("unknown_test_quantity")
    assert prov["class"] == ProvenanceClass.SIMULATED

def test_banned_words_validator():
    """Verify that banned overclaiming words fail validation."""
    assert validate_provenance_claim("Provenance: Audited") is False
    assert validate_provenance_claim("Calibration report: Calibrated") is False
    assert validate_provenance_claim("Wellhead Metered Rate") is False
    assert validate_provenance_claim("Data: Proxy (ENR004) + Simulation") is True
    assert validate_provenance_claim("First-principles coupled thermal-lift engineering model") is True

def test_frontend_files_do_not_contain_banned_provenance_badges():
    """
    Scans all frontend JSX/JS source files to assert that no raw badges 
    with banned words ("MEASURED", "METERED", "CALIBRATED", "AUDITED") are rendered in templates.
    """
    repo_root = Path(__file__).resolve().parents[2]
    frontend_src = repo_root / "frontend" / "src"

    banned_badge_patterns = [
        re.compile(r'>\s*AUDITED\s*<', re.IGNORECASE),
        re.compile(r'>\s*METERED\s*<', re.IGNORECASE),
        re.compile(r'badge-measured', re.IGNORECASE),
        re.compile(r'badge-calibrated', re.IGNORECASE),
        re.compile(r'>\s*CALIBRATED\s*<', re.IGNORECASE),
    ]

    # Files exempted: dataSourceRegistry (where banned words are documented/tested) and DataProvenanceModal (which explains why they are banned)
    exempt_files = {"dataSourceRegistry.js", "dataSourceRegistry.jsx", "DataProvenanceModal.jsx"}

    violations = []
    for file_path in frontend_src.rglob("*.jsx"):
        if file_path.name in exempt_files:
            continue
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception:
            continue

        for pat in banned_badge_patterns:
            matches = pat.findall(content)
            if matches:
                violations.append(f"{file_path.name} contains banned badge pattern: {matches}")

    assert not violations, f"Banned provenance claims found in frontend: {violations}"
