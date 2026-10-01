# CHANGELOG: Baghewala Well-to-Surface Digital Twin (SIH26120)

## Adversarial Polish Pass & Production Hardening (SIH 2026 Grand Finale)

This changelog records the complete set of modifications, refactorings, and architectural additions applied to the Baghewala Well-to-Surface Digital Twin prototype for well BW-01 (CSS + SRP, Jodhpur Sandstone formation, Bikaner-Nagaur Basin, Rajasthan).

---

### Priority 1: Engine Stability & NaN / Infinity Elimination [BLOCKER]
- **Files Modified / Created**:
  - `backend/app/core/coupled_engine.py`
  - `frontend/src/utils/coupledEngine.js`
  - `frontend/src/utils/formatters.js` (NEW)
  - `frontend/src/constants/twinConstants.js`
  - `backend/tests/test_coupled_engine.py` (NEW)
- **Rationale & Changes**:
  - **Fixed Missing Parameter**: `DEFAULT_COUPLED_INPUTS` was missing `steam_injection_rate_tpd` / had `steam_rate_tpd: undefined`, triggering `NaN` in thermal calculations during initial render. Unified input keys to support both `steam_injection_rate_tpd` and `injection_rate_tpd`.
  - **Vogel Inflow Quadratic Guard**: Clamped the quadratic inflow equation discriminant `max(0.0, 1.0 - 0.2*(P_wf/P_res) - 0.8*(P_wf/P_res)**2)` to guarantee strictly non-negative real roots even if bottomhole flowing pressure $P_{wf}$ momentarily exceeds reservoir pressure $P_{res}$.
  - **Zero / Negative Value Protection**:
    - Guarded fluid level calculation with non-zero liquid column gradient.
    - Clamped pump fillage fraction strictly to $[0.05, 1.0]$.
    - Bounded steam chamber quality and dissolved gas fraction $x_{sol} \in [0.0, 1.0]$.
    - Guarded Steam-Oil Ratio (SOR) against division by zero ($q_{oil} < 0.1$ BOPD yields capped finite metric).
  - **Unified Safe Formatting Engine**: Created `formatValue(val, fallback, digits, unit)` utility across all frontend components. Guarantees that `"NaN"`, `"null"`, `"undefined"`, or raw internal enum keys never render in the UI.
  - **Property Grid Tests**: Added automated parameter grid sweep test testing 200+ combinations of steam rate ($0-250$ TPD), pressure ($40-120$ bar), quality ($0.5-0.95$), soak days ($0-14$ d), SPM ($0-3.5$), stroke ($50-120$ in) with zero NaNs or Infinities.

---

### Priority 2: Honest Provenance & Banned Claims Elimination [BLOCKER]
- **Files Modified / Created**:
  - `backend/app/core/data_registry.py` (NEW)
  - `frontend/src/constants/dataSourceRegistry.jsx` (NEW)
  - `frontend/src/constants/dataSourceRegistry.js` (NEW)
  - `frontend/src/components/DataProvenanceModal.jsx`
  - `frontend/src/components/TopNav.jsx`
  - `frontend/src/components/Sidebar.jsx`
  - `backend/tests/test_data_registry.py` (NEW)
- **Rationale & Changes**:
  - **Eliminated Banned Buzzwords**: Purged unverified claims (`"Audited"`, `"Metered"`, `"Calibrated SSOT"`, `"Field Certified"`) from headers, badges, tooltips, and code comments.
  - **5-Tier Provenance Taxonomy**: Established a formal registry defining:
    1. `MEASURED`: Physical field telemetry (e.g., surface casing pressure, SPM).
    2. `PROXY`: Heavy-oil production dataset features from proxy well ENR004.
    3. `ML`: ExtraTrees V1.3 hybrid forecaster predictions (trained on ENR004).
    4. `SIMULATED`: Physics-coupled simulation engine outputs (Marx-Langenheim heat chamber, Vogel inflow, API 11L kinematics).
    5. `ASSUMED`: Geological literature baselines (e.g., native 14,500 cP viscosity, 48°C initial temp, Jodhpur sandstone depth 1050m).
  - **Reusable `<ProvenanceBadge />` Component**: Added contextual provenance chips across telemetry tables and KPI cards.
  - **Top Navigation Pill**: Replaced misleading audit badge with `"Data: Proxy (ENR004) + Simulation"` opening an interactive disclosure modal outlining the roadmap to live Baghewala field integration.

---

### Priority 3: 3D Viewport Dominance (>70% Screen) [BLOCKER]
- **Files Modified**:
  - `frontend/src/components/TopNav.jsx`
  - `frontend/src/components/Sidebar.jsx`
  - `frontend/src/App.jsx`
  - `frontend/src/App.css`
  - `frontend/src/components/IntegratedTwin3D.jsx`
  - `frontend/src/pages/IntegratedTwinPage.jsx`
- **Rationale & Changes**:
  - **56px Fixed Header**: Hardened `.top-nav-bar` to strictly `height: 56px !important; max-height: 56px !important; white-space: nowrap !important; overflow: hidden;` preventing wrapping or expansion at 1366x768.
  - **Sidebar Auto-Collapse**: Added `useEffect` in `App.jsx` to automatically collapse the sidebar to 64px icon-rail mode upon entering the Integrated Twin, immediately giving 180px extra horizontal space to the 3D viewport.
  - **Sidebar Label Polish**: Shortened `"Integrated Production Twin"` to `"Integrated Twin"` in sidebar navigation.
  - **Collision-Free Overlay Docks**:
    - Closed the Downhole Pump PiP Inset by default. Added drag handle with position persistence and minimize toggle.
    - Compacted 3D scene legend into an expandable floating chip.
    - Set default camera preset to $3/4$ perspective `[56, 18, 54]` focusing on both the surface facility and subterranean cutaway block simultaneously.

---

### Priority 4: Light Industrial Theme & WCAG Contrast [CRITICAL]
- **Files Modified / Created**:
  - `frontend/src/index.css`
  - `frontend/src/App.css`
  - `frontend/src/pages/IntegratedTwinPage.jsx`
  - `frontend/src/pages/ScenarioLabPage.jsx`
  - `backend/tests/test_theme_contrast.py` (NEW)
- **Rationale & Changes**:
  - **CSS Design Tokens**: Defined light industrial control room tokens (`--surface: #ffffff; --surface-2: #f8fafc; --ink: #0f172a; --ink-muted: #475569; --border: #cbd5e1; --accent-oil: #b45309; --accent-steam: #0284c7; --ok: #15803d; --warn: #b45309; --alarm: #b91c1c;`).
  - **Contrast Compliance**: Ensured all text-to-background combinations meet or exceed WCAG 2.1 AA ($\ge 4.5:1$).
  - **Fixed Native Sliders**: Replaced unstyled browser slider thumbs with custom industrial range styles (`-webkit-slider-thumb` with primary amber accent, clear track, and focus outline).
  - **Eliminated Glued Strings**: Updated `.stat-item` and KPI elements to strict `flex-direction: column; gap: 4px;` layout, preventing concatenated strings such as `124BOPD` or `VISCOSITY14500CP`.

---

### Priority 5: Petroleum Engineering Physics Consistency [CRITICAL]
- **Files Modified**:
  - `backend/app/core/coupled_engine.py`
  - `frontend/src/utils/coupledEngine.js`
  - `frontend/src/constants/twinConstants.js`
  - `frontend/src/pages/IntegratedTwinPage.jsx`
  - `backend/tests/test_physics_and_constants.py` (NEW)
- **Rationale & Changes**:
  - **Darcy Mobility Ratio Definition**: Formulated Darcy mobility ratio strictly as $\mu_{native} / \mu_{effective}$. At native unheated conditions ($T = 48.0^\circ\text{C}, \mu = 14,500\text{ cP}$), the mobility ratio is identically $1.0\times$ (rather than erroneously displaying $0\times$ or $\infty$).
  - **Unified Reference Temperature**: Standardized Baghewala Jodhpur Sandstone native reservoir temperature to $48.0^\circ\text{C}$ across all backend and frontend modules.
  - **Viscosity Collapse Consistency**: Unified viscosity reduction metrics to $98.3\%$ collapse ($14,500\text{ cP} \rightarrow 245\text{ cP}$ at stimulated $195^\circ\text{C}$).
  - **Parasitic Heat Loss & Soak Optimum**: Modeled thermal soak diffusion with parasitic formation heat loss:
    $$r_{soak} = r_{h} \cdot (1 + 0.06\sqrt{t_{soak}}) \cdot e^{-0.022 \cdot t_{soak}}$$
    Capturing physical reality where soak beyond 5–7 days results in net conductive heat loss into caprock/overburden.
  - **Dynamic Stage Text**: Replaced hardcoded text with dynamic parameters (e.g., injection days derived directly from slider state; stage title formatted as `"Puff - Production, stage 6 of 8"`).

---

### Priority 6: Computed Scenario Lab & Arps Decline [CRITICAL]
- **Files Modified**:
  - `frontend/src/pages/ScenarioLabPage.jsx`
  - `frontend/src/api.js`
  - `backend/tests/test_scenarios.py`
- **Rationale & Changes**:
  - **Live Coupled Computation**: Replaced static hardcoded mock scenario values with live calls to `solveCoupledState`.
  - **Arps Hyperbolic Decline Forecast**: Generated 30-day forward production profiles using Arps hyperbolic decline model ($b = 0.65, D_i = 0.038\text{ day}^{-1}$) calibrated to CSS puff surge and thermal cooldown.
  - **Execution State Indicators**: Added visual computation status badge (`"Updated"` / `"Running Simulation"` / `"Parameters Outdated"`).
  - **Design Unification**: Replaced dark gradient card headers with light industrial summary cards and interactive delta chips ($\Delta\text{ Oil}$, $\Delta\text{ SOR}$, $\Delta\text{ Net Energy}$).

---

### Priority 7: Real Visual Diagnostic Aids [MAJOR]
- **Files Modified / Created**:
  - `frontend/src/components/visual_aids/DynamometerCard.jsx`
  - `frontend/src/components/visual_aids/IprPumpCurve.jsx`
  - `frontend/src/components/visual_aids/ViscosityTempCurve.jsx`
  - `frontend/src/components/visual_aids/RadialTempProfile.jsx`
  - `frontend/src/components/visual_aids/HeatFrontMiniMap.jsx`
  - `frontend/src/pages/WellPumpPage.jsx`
  - `frontend/src/pages/ReservoirPage.jsx`
  - `frontend/src/pages/SteamThermalPage.jsx`
- **Rationale & Changes**:
  - **Dynamometer Card**: Added animated SVG surface and downhole dynamometer card on Well & Pump page driven dynamically by SPM, stroke length, and fluid fillage.
  - **Vogel IPR vs Pump Curve**: Implemented live quadratic Vogel curve with operating point intersection dot showing reservoir deliverability vs pump displacement capacity.
  - **Subsurface Diagnostics**: Integrated Andrade viscosity-temperature curve and radial thermal profile across Reservoir and Steam pages.

---

### Priority 8: 3D Graphics Fidelity & Industrial Realism [MAJOR]
- **Files Modified**:
  - `frontend/src/components/IntegratedTwin3D.jsx`
- **Rationale & Changes**:
  - **Instanced Flange Bolts**: Added 32 instanced metallic hex bolts (`THREE.InstancedMesh`) to the casing spool and master valve flange assemblies.
  - **Subterranean Inspection Freedom**: Extended `OrbitControls` polar angle to `Math.PI - 0.05`, allowing judges to rotate underneath the subsurface block to inspect perforation tunnels and basal water contact.
  - **Tone Mapping & Shadow Polish**: Set ACES Filmic tone mapping with balanced ambient and directional shadows for crisp edge visibility in light theme.
  - **Clean Object Metadata**: Replaced all remaining hardcoded `"MEASURED"` / `"CALIBRATED"` tags in 3D clickable objects with honest `"ASSUMED"` and `"SIMULATED"` provenance tiers.
