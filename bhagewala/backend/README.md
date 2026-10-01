# Baghewala Well-to-Surface Digital Twin — FastAPI Backend

Production-grade, modular FastAPI backend for an AI-enabled Well-to-Surface Digital Twin for the **Baghewala heavy-oil field** (Bikaner-Nagaur Basin, Rajasthan, India).

The backend integrates an experimental machine-learning model (`V1.3-Hybrid`) with operational telemetry, reservoir/steam-system state synchronization, and operational scenario simulation.

---

## 1. System Architecture

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application entrypoint, lifespan loader, CORS middleware
│   ├── api/
│   │   └── routes.py            # API V1 route endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic BaseSettings, path resolution, environment settings
│   │   └── model_loader.py      # Artifact loader, verification, and V1.3 hybrid inference engine
│   ├── schemas/
│   │   ├── prediction.py        # Pydantic schemas for predict, model info, health, feature samples
│   │   ├── digital_twin.py      # Telemetry schemas (Reservoir, Steam Injection, Well, Surface)
│   │   └── scenario.py          # Operational scenarios & multi-day simulation schemas
│   └── services/
│       ├── prediction_service.py # Feature validation, lag/rolling synthesizer, V1.3 prediction orchestration
│       ├── scenario_service.py   # Scenario management, benchmark scenarios, illustrative simulations
│       └── digital_twin_service.py # Twin state management and audit history
├── models/
│   └── production/
│       ├── two_stage_oil_model.joblib # Trained ML artifact (230MB)
│       ├── model_manifest.json        # Model architecture & runtime specification
│       ├── v1_3_metrics.csv           # Benchmark MAE, RMSE, R² comparison table
│       └── v1_3_hybrid_predictions.csv# Precomputed validation predictions
├── tests/
│   ├── conftest.py              # TestClient fixture and mock payloads
│   ├── test_model_loading.py    # Joblib loading, feature count, threshold, and classes verification
│   ├── test_health.py           # Health check and root overview endpoints
│   ├── test_validation.py       # Pydantic validation and error handling
│   ├── test_prediction.py       # Predict endpoint, positive zero-flag fallback verification
│   ├── test_scenarios.py        # Scenario CRUD, illustrative projection disclaimers
│   └── test_digital_twin.py     # Twin state synchronization and ML parameter mapping
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
└── README.md                    # Technical documentation and API specifications
```

---

## 2. ML Model Artifact & V1.3 Strategy

### Artifact Inspection
* **Artifact Path:** `backend/models/production/two_stage_oil_model.joblib`
* **Artifact Structure:**
  ```python
  {
      "classifier": Pipeline(steps=[
          ("prep", ColumnTransformer(num=SimpleImputer(median), cat=Pipeline(SimpleImputer, OneHotEncoder))),
          ("model", ExtraTreesClassifier(class_weight="balanced", min_samples_leaf=2, n_estimators=300, random_state=42))
      ]),
      "regressor": Pipeline(steps=[
          ("prep", ColumnTransformer(num=SimpleImputer(median), cat=Pipeline(SimpleImputer, OneHotEncoder))),
          ("model", ExtraTreesRegressor(max_features=0.9, min_samples_leaf=2, n_estimators=300, random_state=42))
      ]),
      "features": [...],       # Exactly 50 features in strict order
      "zero_threshold": 0.1500 # Classifier probability cutoff
  }
  ```
* **Classifier Positive Class:** Class `1` corresponds to a **zero-production event**.
* **Zero Threshold:** `0.1500`. If `P(Zero Production) >= 0.15`, the model flags zero production (`predicted_zero_flag = 1`).
* **V1.3 Hybrid Strategy:**
  1. Evaluate the zero-production ExtraTrees classifier.
  2. If `predicted_zero_flag == 1`, output is set to `current_oil_rate_bopd` (**persistence fallback**).
  3. Otherwise, output is set to the ExtraTrees regressor prediction (**V1.2 regression rate**).
* **Target:** Next-day oil production rate in **BOPD** (Barrels of Oil Per Day).

### The 50 Model Features
The ML pipeline requires 50 features in exact order:
1. **Base Numerical Features (14):** `oil_rate_bopd`, `gas_rate_mcfd`, `water_rate_bwpd`, `reservoir_pressure_psia`, `flowing_wellhead_pressure_psia`, `flowing_bottomhole_pressure_psia`, `drawdown_psia`, `esp_frequency_hz`, `rod_pump_spm`, `rod_pump_fillage_pct`, `gas_lift_rate_mmscfd`, `bsw_pct`, `gor_scf_per_bbl`, `wor`
2. **Lag 1 Features (14):** Same 14 variables shifted by 1 day (`*_lag1`).
3. **Lag 7 Features (14):** Same 14 variables shifted by 7 days (`*_lag7`).
4. **Rolling 7-Day Means (3):** `oil_rate_bopd_rolling7`, `water_rate_bwpd_rolling7`, `gas_rate_mcfd_rolling7`.
5. **Categoricals (3):** `well_id`, `field_id`, `well_status` (e.g. `PRODUCING`, `SHUT_IN`).
6. **Calendar (2):** `day_of_week` (0–6), `month` (1–12).

---

## 3. Disclaimers & Physics Limitations

> [!IMPORTANT]
> **No Numerical Reservoir Simulator:** The model is an **empirical machine learning proxy** trained on time series from the `ENR004` dataset. It does **not** solve Navier-Stokes equations, multi-phase Darcy flow, thermal steam condensation, or cyclic steam stimulation (CSS) chamber dynamics.

1. **Baghewala Heavy Oil Specifics:** Baghewala crude has an API gravity of ~17–19° API and native dead oil viscosity of 10,000–25,000+ cP at ~45°C. The current ML model has **not** been calibrated or validated against Baghewala field well tests.
2. **Digital Twin Telemetry Separation:**
   - **Ingested by ML Model:** `reservoir_pressure_psia`, `oil_rate_bopd`, `water_rate_bwpd`, `gas_rate_mcfd`, `esp_frequency_hz`, `rod_pump_spm`.
   - **Not Ingested by Current ML Model:** Steam injection parameters (rate, pressure, temp, steam quality, CSS cycle stage), reservoir depth, dead oil viscosity, reservoir thickness, surface motor power, kWh consumption. These parameters are tracked for digital-twin state synchronization and future coupled physical simulation.
3. **Simulation Horizon:** In `POST /api/v1/simulate`, **Day 1** is derived from the V1.3 hybrid ML model. Days 2+ are **explicitly labeled illustrative operational projections** (`is_physical_reservoir_simulation: false`).

---

## 4. Setup and Installation

### Prerequisites
* Python 3.10 or 3.11 (tested on Python 3.11.9)
* Note: `scikit-learn==1.6.1` is strictly required to match the serialized ColumnTransformer bytecode in `two_stage_oil_model.joblib`.

### Installation
```bash
# 1. Clone or navigate to the workspace
cd bhagewala

# 2. Create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt
```

### Running the Backend Server
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The server will start at `http://127.0.0.1:8000`.
* Interactive OpenAPI Swagger Docs: `http://127.0.0.1:8000/docs`
* ReDoc UI: `http://127.0.0.1:8000/redoc`

### Running the Test Suite
```bash
python -m pytest backend/tests -v
```
All 19 tests validate model loading, zero-production fallbacks, health endpoints, Pydantic constraints, and operational scenario simulation.

---

## 5. API Reference & Examples

### 1. Health Check
* **Endpoint:** `GET /api/v1/health`
* **Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "Baghewala Well-to-Surface Digital Twin",
  "version": "1.0.0",
  "model_loaded": true,
  "model_version": "V1.3-Hybrid",
  "feature_count": 50,
  "error": null
}
```

---

### 2. Model Metadata
* **Endpoint:** `GET /api/v1/model/info`
* **Response (200 OK):**
```json
{
  "is_loaded": true,
  "project": "Baghewala Well-to-Surface Digital Twin",
  "model_version": "V1.3-Hybrid",
  "base_model": "V1.2-Two-Stage",
  "target": "Next-day oil production rate (BOPD)",
  "target_units": "BOPD",
  "prediction_strategy": {
    "if_predicted_zero_flag_is_1": "Use persistence baseline",
    "otherwise": "Use V1.2 predicted oil rate"
  },
  "zero_threshold": 0.15,
  "positive_class_definition": "Class 1: Zero production event",
  "feature_count": 50,
  "validation_status": "Experimental; not field-validated",
  "dataset": "ENR004 production dataset; Baghewala applicability unverified"
}
```

---

### 3. Predict Next-Day Oil Production
* **Endpoint:** `POST /api/v1/predict`
* **Request:**
```json
{
  "current_oil_rate_bopd": 450.5,
  "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
  "production_date": "2026-09-27",
  "features": {
    "oil_rate_bopd": 450.5,
    "gas_rate_mcfd": 620.0,
    "water_rate_bwpd": 12.5,
    "reservoir_pressure_psia": 3740.0,
    "flowing_wellhead_pressure_psia": 610.0,
    "flowing_bottomhole_pressure_psia": 2310.0,
    "drawdown_psia": 1430.0,
    "esp_frequency_hz": 30.0,
    "rod_pump_spm": 2.0,
    "rod_pump_fillage_pct": 0.0,
    "gas_lift_rate_mmscfd": 0.0,
    "bsw_pct": 2.7,
    "gor_scf_per_bbl": 1376.0,
    "wor": 0.028,
    "oil_rate_bopd_lag1": 448.0,
    "gas_rate_mcfd_lag1": 615.0,
    "water_rate_bwpd_lag1": 11.8,
    "reservoir_pressure_psia_lag1": 3741.0,
    "flowing_wellhead_pressure_psia_lag1": 612.0,
    "flowing_bottomhole_pressure_psia_lag1": 2311.0,
    "drawdown_psia_lag1": 1430.0,
    "esp_frequency_hz_lag1": 30.0,
    "rod_pump_spm_lag1": 2.0,
    "rod_pump_fillage_pct_lag1": 0.0,
    "gas_lift_rate_mmscfd_lag1": 0.0,
    "bsw_pct_lag1": 2.6,
    "gor_scf_per_bbl_lag1": 1372.0,
    "wor_lag1": 0.026,
    "oil_rate_bopd_lag7": 460.0,
    "gas_rate_mcfd_lag7": 630.0,
    "water_rate_bwpd_lag7": 10.5,
    "reservoir_pressure_psia_lag7": 3745.0,
    "flowing_wellhead_pressure_psia_lag7": 618.0,
    "flowing_bottomhole_pressure_psia_lag7": 2315.0,
    "drawdown_psia_lag7": 1430.0,
    "esp_frequency_hz_lag7": 30.0,
    "rod_pump_spm_lag7": 2.0,
    "rod_pump_fillage_pct_lag7": 0.0,
    "gas_lift_rate_mmscfd_lag7": 0.0,
    "bsw_pct_lag7": 2.2,
    "gor_scf_per_bbl_lag7": 1369.0,
    "wor_lag7": 0.023,
    "oil_rate_bopd_rolling7": 452.1,
    "water_rate_bwpd_rolling7": 11.2,
    "gas_rate_mcfd_rolling7": 622.4,
    "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
    "field_id": "acc35770-82ba-4b5f-65e5-17c372a7539a",
    "well_status": "PRODUCING",
    "day_of_week": 6,
    "month": 9
  }
}
```
* **Response (200 OK):**
```json
{
  "predicted_oil_rate_bopd": 453.90,
  "predicted_zero_probability": 0.0733,
  "predicted_zero_flag": 0,
  "zero_threshold": 0.15,
  "raw_regression_prediction_bopd": 453.90,
  "current_oil_rate_bopd": 450.5,
  "prediction_strategy": "v1_2_regression",
  "units": "BOPD",
  "model_version": "V1.3-Hybrid",
  "target": "Next-day oil production rate (BOPD)",
  "validation_status": "Experimental; not field-validated",
  "notes": "Zero classifier prob=0.0733 (threshold=0.1500). Classifier flagged normal production. Regression output used: 453.90 BOPD."
}
```

---

### 4. Digital Twin State Synchronization
* **Endpoint:** `POST /api/v1/digital-twin/state`
* **Request:**
```json
{
  "reservoir": {
    "reservoir_pressure_psia": 3850.0,
    "reservoir_temperature_deg_c": 48.0,
    "oil_viscosity_cp": 14000.0,
    "reservoir_depth_m": 1050.0,
    "reservoir_thickness_m": 18.0,
    "oil_saturation_pct": 66.0
  },
  "steam_injection": {
    "steam_injection_rate_tpd": 140.0,
    "steam_pressure_bar": 68.0,
    "steam_temperature_deg_c": 282.0,
    "steam_quality_pct": 81.0,
    "cumulative_injected_steam_tonnes": 4800.0,
    "css_cycle_stage": "Production"
  },
  "well_production": {
    "well_id": "0cacd33e-874a-408f-44e0-67c262ca762e",
    "current_oil_rate_bopd": 520.0,
    "water_rate_bwpd": 18.0,
    "gas_rate_mcfd": 640.0,
    "pump_type": "Sucker Rod Pump (SRP)",
    "pump_speed": 2.5,
    "pump_operating_status": "Operating"
  },
  "surface_system": {
    "pump_power_kw": 48.0,
    "energy_consumption_kwh_per_day": 1150.0,
    "equipment_status": "Operating"
  },
  "notes": "Post-soak continuous rod pumping."
}
```
* **Response (201 Created):**
Returns the persisted state with unique `state_id`, `timestamp`, and `model_mapping_summary` highlighting which parameters map to ML vs unmapped digital-twin telemetry.

---

### 5. Multi-Day Operational Simulation
* **Endpoint:** `POST /api/v1/simulate`
* **Request:**
```json
{
  "scenario_id": "scenario-baseline-prod",
  "horizon_days": 7,
  "current_oil_rate_bopd": 450.0
}
```
* **Response (200 OK):**
```json
{
  "simulation_id": "sim-8e2b34a1c0",
  "timestamp": "2026-09-27T01:26:00.000000",
  "horizon_days": 7,
  "is_physical_reservoir_simulation": false,
  "simulation_type": "hybrid_ml_day1_with_illustrative_trend",
  "daily_projections": [
    {
      "day": 1,
      "date": "2026-09-28",
      "predicted_oil_rate_bopd": 453.90,
      "strategy_used": "v1_2_regression",
      "zero_probability": 0.0733,
      "is_ml_derived": true,
      "is_illustrative_extrapolation": false,
      "notes": "Verified V1.3 hybrid ML model output."
    },
    {
      "day": 2,
      "date": "2026-09-29",
      "predicted_oil_rate_bopd": 451.63,
      "strategy_used": "illustrative_exponential_decline_proxy",
      "zero_probability": 0.0,
      "is_ml_derived": false,
      "is_illustrative_extrapolation": true,
      "notes": "ILLUSTRATIVE ONLY: Simplified operational proxy trend. No thermal or multi-phase reservoir physics active."
    }
  ],
  "physics_limitations": [
    "Thermal CSS reservoir dynamics (viscosity reduction vs temperature) are NOT solved by this model.",
    "Multiphase Darcy flow in heavy oil dolomite/sandstone is NOT simulated.",
    "Steam breakthrough, gravity override, and reservoir pressure depletion are NOT physically modeled.",
    "Day 1 prediction is ML-driven (V1.3 hybrid); Day 2+ projections are illustrative operational trends, NOT verified physical forecasts."
  ]
}
```

---

## 6. Frontend Integration Guidelines

* **CORS:** CORS is pre-configured for `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, and `http://127.0.0.1:5173`. Additional origins can be configured in `.env` (`CORS_ORIGINS`).
* **Input Feature Helper:** Frontend forms can call `GET /api/v1/model/features/sample` to populate forms with initial valid vectors.
* **Telemetry Distinction:** UI components should visually separate:
  - **Predicted Oil Rate:** Labeled as `V1.3 Two-Stage ML Proxy (ENR004-trained)`.
  - **Steam & Thermal Status:** Labeled as `Telemetry / Operational State (Non-ML)`.
