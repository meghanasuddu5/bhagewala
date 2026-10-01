"""
Baghewala Well-to-Surface Digital Twin — WCAG 2.1 AA Theme Contrast Audit
Computes relative luminance and contrast ratio for every text/background token pair.
Fails below 4.5:1 (normal text) and 3.0:1 (large text / UI components).
"""

import pytest
import re

def hex_to_rgb(hex_str: str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c * 2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def srgb_to_linear(c: float) -> float:
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(rgb) -> float:
    r, g, b = [srgb_to_linear(v) for v in rgb]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast_ratio(hex1: str, hex2: str) -> float:
    lum1 = relative_luminance(hex_to_rgb(hex1))
    lum2 = relative_luminance(hex_to_rgb(hex2))
    l1 = max(lum1, lum2)
    l2 = min(lum1, lum2)
    return (l1 + 0.05) / (l2 + 0.05)

def test_light_industrial_theme_wcag_contrast():
    """Verify that light theme text-to-background pairs satisfy WCAG 2.1 AA (>= 4.5:1)."""
    # Surfaces
    surfaces = {
        "surface": "#ffffff",
        "surface-2": "#f4f6f8",
        "bg-app": "#eef1f4",
    }

    # Text tokens
    texts = {
        "ink": "#0f172a",          # Primary ink text
        "ink-muted": "#334155",    # Secondary text
        "ink-dim": "#475569",      # Dim metadata (>= 4.5:1 on white)
    }

    for s_name, s_hex in surfaces.items():
        for t_name, t_hex in texts.items():
            ratio = contrast_ratio(s_hex, t_hex)
            assert ratio >= 4.5, f"Contrast failure in light theme: {t_name} ({t_hex}) on {s_name} ({s_hex}) has ratio {ratio:.2f}:1 (< 4.5:1)"

def test_dark_industrial_theme_wcag_contrast():
    """Verify that dark theme text-to-background pairs satisfy WCAG 2.1 AA (>= 4.5:1)."""
    surfaces = {
        "surface": "#111a2e",
        "surface-2": "#16223d",
        "bg-workspace": "#0b1120",
    }

    texts = {
        "ink": "#f8fafc",
        "ink-muted": "#e2e8f0",
        "ink-dim": "#94a3b8",      # Large/metadata text (>= 4.5:1 on dark)
    }

    for s_name, s_hex in surfaces.items():
        for t_name, t_hex in texts.items():
            ratio = contrast_ratio(s_hex, t_hex)
            assert ratio >= 4.5, f"Contrast failure in dark theme: {t_name} ({t_hex}) on {s_name} ({s_hex}) has ratio {ratio:.2f}:1 (< 4.5:1)"

def test_large_accents_contrast():
    """Verify that accent colors have at least 3.0:1 contrast for graphical elements and bold headers."""
    ratio_oil = contrast_ratio("#ffffff", "#d97706")
    ratio_steam = contrast_ratio("#ffffff", "#0284c7")
    ratio_emerald = contrast_ratio("#ffffff", "#059669")
    ratio_red = contrast_ratio("#ffffff", "#dc2626")

    assert ratio_oil >= 3.0, f"Oil accent ratio too low: {ratio_oil:.2f}:1"
    assert ratio_steam >= 3.5, f"Steam accent ratio too low: {ratio_steam:.2f}:1"
    assert ratio_emerald >= 3.5, f"Emerald status ratio too low: {ratio_emerald:.2f}:1"
    assert ratio_red >= 4.5, f"Alarm red ratio too low: {ratio_red:.2f}:1"
