# Baghewala Field — AI-Enabled Well-to-Surface Digital Twin

## SIH26120: Integrated Cyclic Steam Stimulation (CSS) & Sucker Rod Pump (SRP) Optimization

An enterprise-grade, industrial-fidelity, full-stack digital twin for heavy crude oil production optimization in the **Baghewala Heavy Oil Field, Bikaner-Nagaur Basin, Rajasthan**.

---

## ⚠️ Critical Data-Integrity Notice & Provenance Disclosure

> **MANDATORY SCIENTIFIC SAFEGUARD**:
> - The machine learning model packaged herein (`two_stage_oil_model.joblib`) was trained on **Dataset ENR004** (15,699 daily production records across 48 wells).
> - **This dataset has NOT been calibrated or validated against actual Baghewala field subsurface logs or operator telemetry.**
> - All model predictions are explicitly marked as **experimental proxies** from an unverified dataset.
> - Subsurface 3D thermal plumes and fluid streams are **illustrative digital twin visualizations** and should not be interpreted as certified numerical reservoir simulations (e.g., CMG STARS or ECLIPSE).

---

## System Architecture

```text
baghewala/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application factory with CORS & static dist mounting
│   │   ├── api/routes/              # Modularized REST endpoints
│   │   │   ├── health.py            # System health & backend connectivity
│   │   │   ├── model.py             # Model metadata, features & limits
│   │   │   ├── predictions.py       # V1.3 Two-stage hybrid ML inference
│   │   │   ├── scenarios.py         # Scenario comparison & operational projection
│   │   │   └── digital_twin.py      # Subsurface-to-surface state management
│   │   ├── core/config.py           # Application settings & environment config
│   │   ├── schemas/                 # Strict Pydantic V2 domain validation models
│   │   │   ├── reservoir.py         # Jodhpur sandstone & Bilara dolomite properties
│   │   │   ├── steam.py             # CSS injection parameters (TPD, pressure, quality)
│   │   │   ├── well.py              # Wellbore, casing, perforations & SRP telemetry
│   │   │   ├── prediction.py        # ML feature validation & prediction schemas
│   │   │   ├── scenario.py          # Operational scenarios & comparison metrics
│   │   │   └── digital_twin.py      # Unified digital twin state schema
│   │   ├── services/
│   │   │   ├── model_loader.py      # Singleton Joblib loader for V1.2/V1.3 artifacts
│   │   │   ├── prediction_service.py# Zero-threshold class mapping & persistence fallback
│   │   │   ├── scenario_service.py  # Decline curve & CSS thermal response simulator
│   │   │   └── digital_twin_service.py # Telemetry cache & physical state updates
│   │   └── utils/validation.py      # Feature alignment & column-order enforcement
│   ├── models/production/
│   │   ├── two_stage_oil_model.joblib # ExtraTrees classifier & regressor bundle
│   │   └── model_manifest.json      # Pipeline metadata, zero threshold & feature specs
│   ├── tests/                       # Pytest test suite (19 test cases, 100% pass)
│   └── requirements.txt             # Python runtime dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Persistent 8-section navigation with integrity badge
│   │   │   ├── TopNav.jsx           # UTC clock, well selector & system status HUD
│   │   │   ├── Twin3DViewer.jsx     # Three.js 3D WebGL viewer (nodding donkey, dome strata, steam smoke, oil particles)
│   │   │   ├── SimulationStageVisualizer.jsx # 4-stage thermal CSS player & viscosity gauge
│   │   │   ├── TwinEngineerInsight.jsx # AI Engineer Tanya holographic guidance HUD
│   │   │   └── FieldStoryGuide.jsx  # Thar desert field hero & CSS thermal walkthrough
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx     # Master digital twin cockpit
│   │   │   ├── ReservoirPage.jsx    # Geological strata & viscosity reduction lab
│   │   │   ├── SteamThermalPage.jsx # Steam generator, pipeline & CSS heat-soak dynamics
│   │   │   ├── WellPumpPage.jsx     # SRP nodding donkey kinematics & dynamometer cards
│   │   │   ├── ForecastPage.jsx     # V1.3 Two-Stage ML production forecasting workbench
│   │   │   ├── ScenarioLabPage.jsx  # Multi-scenario operational comparison & trade-offs
│   │   │   ├── AnalyticsPage.jsx    # Historical telemetry vs ML prediction diagnostics
│   │   │   └── ModelInfoPage.jsx    # Architecture, ENR004 provenance & limitations
│   │   ├── api.js                   # Centralized Axios client & mock fallbacks
│   │   ├── App.jsx                  # Root state container & split-screen router
│   │   └── App.css                  # Luminous white design system & technical typography
│   └── package.json                 # React 19, Vite, Three.js, Lucide-React
└── README.md
```

---

## 3D WebGL Digital Twin Highlights

Built with custom **Three.js / WebGL** featuring an eye-pleasing **Luminous White & Desert Energy Palette**:
- **Articulated SRP Nodding Donkey**: Mechanically accurate walking beam, horsehead, bridle cables, polished rod, Samson posts, counterweight crank arms, and pitman links rotating at 8.5 SPM.
- **Natural Anticlinal Dome Strata**: Realistic curved geological cross-section revealing the sandstone reservoir dome, impermeable shale caprock barrier, overburden, and desert surface sands.
- **Dynamic CSS Steam Smoke**: Volumetric billowing particle cloud simulating superheated steam entering reservoir perforations at 285°C.
- **Upward Crude Oil Influx**: 90 amber-gold fluid particles streaming from the hot mobilized reservoir zone up through the wellbore into surface separators.
- **Dynamic Viscosity Transformation**: Real-time visualization of heavy crude undergoing thermal viscosity reduction from **14,500 cP** down to **245 cP** during the 4-stage CSS cycle.

---

## ML Inference Pipeline (V1.3 Two-Stage Hybrid)

1. **Classifier Class Mapping**:
   - The trained classifier predicts `predicted_zero_flag` using decision threshold `0.1500`.
   - Positive class `1` signifies high zero-production risk.
2. **Hybrid Fallback Logic**:
   - If `predicted_zero_flag == 1`, production is predicted using the **persistence baseline** (`current_oil_rate_bopd`).
   - Otherwise, the **ExtraTrees regressor** prediction is used.
3. **Feature Alignment**:
   - Features (`oil_rate_lag_1`, `oil_rate_lag_7`, `oil_rate_roll_mean_7`, `gas_rate_lag_1`, `water_rate_lag_1`, `casing_pressure_lag_1`, `choke_size_lag_1`, etc.) are validated and ordered strictly according to `model_manifest.json`.

---

## Quickstart & Launch Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Windows PowerShell / Linux terminal

### Quick Launch (Recommended)
You can run the entire system using the unified runner `main.py`:

```powershell
# Run the complete application (FastAPI backend + integrated 3D Digital Twin UI)
python main.py

# Or run full development mode with hot reload (FastAPI backend + Vite frontend HMR)
python main.py --dev

# Check environment, dependencies & ML model bundle
python main.py --check

# Run backend pytest suite
python main.py --test
```

- **Interactive 3D Digital Twin Dashboard**: `http://127.0.0.1:8000/dashboard`
- **FastAPI REST API Documentation (Swagger)**: `http://127.0.0.1:8000/docs`
- **System Health Endpoint**: `http://127.0.0.1:8000/api/v1/health`

---

### Manual Launch

#### 1. Start the FastAPI Backend
```powershell
# In project root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start the React Frontend
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Application UI: `http://127.0.0.1:5173/`

#### 3. Run Backend Test Suite
```powershell
# In project root
python -m pytest backend/tests -v
```
**Test Results**: 19 passed in ~1.0 second.


---

## Key REST API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/health` | GET | System uptime, model status, and service health |
| `/api/v1/model/info` | GET | Model metadata, feature list, provenance, and warnings |
| `/api/v1/predict` | POST | V1.3 Two-stage hybrid oil rate inference |
| `/api/v1/model/sample-features` | GET | Valid sample feature payload for testing |
| `/api/v1/scenarios` | GET / POST | List or create operational CSS-SRP scenarios |
| `/api/v1/scenarios/{id}` | GET | Fetch scenario parameters and performance projections |
| `/api/v1/simulate` | POST | Run decline curve & thermal energy simulation |
| `/api/v1/digital-twin/state` | GET / POST | Read or update live digital twin telemetry state |

---

## Verification & Status

- **Theme**: Luminous white with rich amber, cyan, emerald, and slate technical accents.
- **Navigation**: Persistent 8-section sidebar with live badges and collapsible design.
- **3D Visualization**: Real-time WebGL rendering with interactive orbit controls, wireframe toggles, and animated fluid/steam mechanics.
- **Character Insights**: Tanya, Digital Twin AI Engineer avatar card with operational context.
- **Backend Tests**: 100% pass rate (19/19 unit tests passing).
