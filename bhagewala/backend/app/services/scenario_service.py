import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from backend.app.schemas.scenario import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioResult,
    SimulationRequest,
    SimulationResponse,
    DailyForecastPoint,
)
from backend.app.schemas.prediction import PredictionRequest, PredictionResponse
from backend.app.services.prediction_service import prediction_service, PredictionService


class ScenarioService:
    def __init__(self, pred_service: Optional[PredictionService] = None):
        self.pred_service = pred_service or prediction_service
        self._scenarios: Dict[str, ScenarioResponse] = {}
        self._initialize_benchmark_scenarios()

    def _initialize_benchmark_scenarios(self):
        """Initializes default scenarios for the Baghewala field digital twin."""
        scenarios_init = [
            {
                "id": "scenario-baseline-prod",
                "name": "Baseline Continuous Pumping (SRP @ 2 SPM)",
                "description": "Stable heavy-oil rod pumping post-CSS soak with standard 3740 psia reservoir pressure.",
                "current_rate": 450.5,
                "params": {
                    "reservoir_pressure_psia": 3740.0,
                    "pump_speed_spm": 2.0,
                    "steam_injection_rate_tpd": 0.0,
                    "pump_status": "Operating",
                },
            },
            {
                "id": "scenario-css-cycle2-post-soak",
                "name": "CSS Cycle 2 Post-Soak Flush",
                "description": "Immediate post-soak heavy oil production with elevated near-wellbore temperature and reduced viscosity.",
                "current_rate": 780.0,
                "params": {
                    "reservoir_pressure_psia": 4100.0,
                    "pump_speed_spm": 3.0,
                    "steam_injection_rate_tpd": 0.0,
                    "pump_status": "Operating",
                },
            },
            {
                "id": "scenario-well-shutin-maintenance",
                "name": "Well Workover / Surface Pumping Shut-in",
                "description": "Simulated pump shutdown for workover or surface piping maintenance.",
                "current_rate": 0.0,
                "params": {
                    "reservoir_pressure_psia": 3750.0,
                    "pump_speed_spm": 0.0,
                    "steam_injection_rate_tpd": 0.0,
                    "pump_status": "Maintenance",
                },
            },
        ]

        for s in scenarios_init:
            feat = self.pred_service.generate_baseline_features(
                current_oil_rate_bopd=s["current_rate"],
                reservoir_pressure_psia=s["params"]["reservoir_pressure_psia"],
                well_status="SHUT_IN" if s["params"]["pump_status"] == "Maintenance" else "PRODUCING",
            )
            req = PredictionRequest(
                current_oil_rate_bopd=s["current_rate"],
                features=feat,
                well_id="0cacd33e-874a-408f-44e0-67c262ca762e",
                production_date=datetime.utcnow().strftime("%Y-%m-%d"),
            )
            try:
                pred_res = self.pred_service.predict(req)
                result = ScenarioResult(predicted_production=pred_res)
            except Exception:
                result = None

            self._scenarios[s["id"]] = ScenarioResponse(
                scenario_id=s["id"],
                name=s["name"],
                description=s["description"],
                created_at=datetime.utcnow().isoformat(),
                parameters=s["params"],
                results=result,
            )

    def create_scenario(self, data: ScenarioCreate) -> ScenarioResponse:
        scenario_id = f"scenario-{uuid.uuid4().hex[:8]}"

        # Aggregate parameters
        params: Dict[str, Any] = {}
        current_rate = 450.0
        res_press = 3740.0
        well_status = "PRODUCING"

        if data.reservoir:
            params["reservoir"] = data.reservoir.model_dump()
            res_press = data.reservoir.reservoir_pressure_psia
        if data.steam_injection:
            params["steam_injection"] = data.steam_injection.model_dump()
        if data.well_production:
            params["well_production"] = data.well_production.model_dump()
            current_rate = data.well_production.current_oil_rate_bopd
            well_status = "SHUT_IN" if data.well_production.pump_operating_status != "Operating" else "PRODUCING"
        if data.surface_system:
            params["surface_system"] = data.surface_system.model_dump()

        # If 50 features provided directly, use them; otherwise synthesize from parameters
        features = data.features
        if not features:
            features = self.pred_service.generate_baseline_features(
                current_oil_rate_bopd=current_rate,
                reservoir_pressure_psia=res_press,
                well_status=well_status,
            )

        # Run prediction for this scenario
        pred_res = None
        try:
            req = PredictionRequest(
                current_oil_rate_bopd=current_rate,
                features=features,
                well_id=data.well_production.well_id if data.well_production else None,
            )
            pred_res = self.pred_service.predict(req)
        except Exception as e:
            # Prediction failed or incomplete features
            pass

        result = ScenarioResult(
            predicted_production=pred_res,
            illustrative_metrics={
                "estimated_power_cost_usd_per_day": round(params.get("surface_system", {}).get("energy_consumption_kwh_per_day", 1080.0) * 0.08, 2),
                "css_thermal_efficiency_indicator": "Medium" if params.get("steam_injection", {}).get("steam_quality_pct", 80) >= 75 else "Low",
                "label": "Illustrative operational calculations (non-reservoir physics)",
            },
        )

        response = ScenarioResponse(
            scenario_id=scenario_id,
            name=data.name,
            description=data.description,
            created_at=datetime.utcnow().isoformat(),
            parameters=params,
            results=result,
        )
        self._scenarios[scenario_id] = response
        return response

    def get_scenario(self, scenario_id: str) -> Optional[ScenarioResponse]:
        return self._scenarios.get(scenario_id)

    def list_scenarios(self) -> List[ScenarioResponse]:
        return list(self._scenarios.values())

    def simulate(self, request: SimulationRequest) -> SimulationResponse:
        """
        Executes operational simulation:
        1. Day 1 is predicted using the actual trained ML model (V1.3 Two-Stage Hybrid).
        2. Days 2 to horizon_days are calculated as EXPLICITLY LABELED illustrative operational projections.
        3. Strict flags ensure the user is not misled: is_physical_reservoir_simulation=False.
        """
        sim_id = f"sim-{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow()

        # Determine features
        current_rate = request.current_oil_rate_bopd
        res_press = 3740.0
        well_status = "PRODUCING"

        if request.reservoir:
            res_press = request.reservoir.reservoir_pressure_psia
        if request.well_production:
            well_status = "SHUT_IN" if str(request.well_production.pump_operating_status).lower() in ("idle", "maintenance", "tripped") else "PRODUCING"

        features = request.features
        if not features:
            features = self.pred_service.generate_baseline_features(
                current_oil_rate_bopd=current_rate,
                reservoir_pressure_psia=res_press,
                well_status=well_status,
            )

        # 1. Day 1 ML Prediction
        req = PredictionRequest(
            current_oil_rate_bopd=current_rate,
            features=features,
        )
        day_1_pred = self.pred_service.predict(req)

        # 2. Build multi-day trajectory
        daily_points: List[DailyForecastPoint] = []

        # Day 1: Genuine ML prediction
        day_1_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        daily_points.append(
            DailyForecastPoint(
                day=1,
                date=day_1_date,
                predicted_oil_rate_bopd=round(day_1_pred.predicted_oil_rate_bopd, 2),
                strategy_used=day_1_pred.prediction_strategy,
                zero_probability=round(day_1_pred.predicted_zero_probability, 4),
                is_ml_derived=True,
                is_illustrative_extrapolation=False,
                notes="Verified V1.3 hybrid ML model output.",
            )
        )

        # Days 2..N: Explicitly labeled illustrative projections
        running_rate = day_1_pred.predicted_oil_rate_bopd
        # Standard Arps exponential decline proxy for illustrative multi-day display (Di = 0.5% per day)
        daily_decline_rate = 0.005

        for day in range(2, request.horizon_days + 1):
            date_str = (now + timedelta(days=day)).strftime("%Y-%m-%d")
            running_rate = max(0.0, running_rate * (1.0 - daily_decline_rate))
            daily_points.append(
                DailyForecastPoint(
                    day=day,
                    date=date_str,
                    predicted_oil_rate_bopd=round(running_rate, 2),
                    strategy_used="illustrative_exponential_decline_proxy",
                    zero_probability=0.0,
                    is_ml_derived=False,
                    is_illustrative_extrapolation=True,
                    notes="ILLUSTRATIVE ONLY: Simplified operational proxy trend. No thermal or multi-phase reservoir physics active.",
                )
            )

        params_used = {
            "scenario_id": request.scenario_id,
            "current_oil_rate_bopd": request.current_oil_rate_bopd,
            "horizon_days": request.horizon_days,
            "reservoir": request.reservoir.model_dump() if request.reservoir else None,
            "steam_injection": request.steam_injection.model_dump() if request.steam_injection else None,
            "well_production": request.well_production.model_dump() if request.well_production else None,
            "surface_system": request.surface_system.model_dump() if request.surface_system else None,
        }

        return SimulationResponse(
            simulation_id=sim_id,
            timestamp=now.isoformat(),
            horizon_days=request.horizon_days,
            is_physical_reservoir_simulation=False,
            simulation_type="hybrid_ml_day1_with_illustrative_trend",
            day_1_ml_prediction=day_1_pred,
            daily_projections=daily_points,
            parameters_used=params_used,
        )


scenario_service = ScenarioService()
