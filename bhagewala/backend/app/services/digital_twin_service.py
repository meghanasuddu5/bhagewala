import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from backend.app.schemas.digital_twin import (
    DigitalTwinStateRequest,
    DigitalTwinStateResponse,
    ReservoirParameters,
    SteamInjectionParameters,
    WellProductionParameters,
    SurfaceSystemParameters,
    CSSCycleStage,
    PumpType,
    EquipmentStatus,
)


class DigitalTwinService:
    def __init__(self):
        self._history: List[DigitalTwinStateResponse] = []
        self._latest_state: Optional[DigitalTwinStateResponse] = None
        self._initialize_default_state()

    def _initialize_default_state(self):
        """Initializes a representative Baghewala baseline digital twin state."""
        default_state = DigitalTwinStateResponse(
            state_id="state-default-baghewala-01",
            timestamp=datetime.utcnow().isoformat(),
            reservoir=ReservoirParameters(
                reservoir_pressure_psia=3740.0,
                reservoir_temperature_deg_c=45.0,
                oil_viscosity_cp=15000.0,
                reservoir_depth_m=1050.0,
                reservoir_thickness_m=18.0,
                oil_saturation_pct=68.0,
            ),
            steam_injection=SteamInjectionParameters(
                steam_injection_rate_tpd=120.0,
                steam_pressure_bar=65.0,
                steam_temperature_deg_c=280.0,
                steam_quality_pct=80.0,
                cumulative_injected_steam_tonnes=4500.0,
                css_cycle_stage=CSSCycleStage.PRODUCTION,
            ),
            well_production=WellProductionParameters(
                well_id="0cacd33e-874a-408f-44e0-67c262ca762e",
                current_oil_rate_bopd=450.5,
                water_rate_bwpd=12.5,
                gas_rate_mcfd=620.0,
                pump_type=PumpType.SRP,
                pump_speed=2.0,
                pump_operating_status=EquipmentStatus.OPERATING,
                production_date=datetime.utcnow().strftime("%Y-%m-%d"),
            ),
            surface_system=SurfaceSystemParameters(
                pump_power_kw=45.0,
                energy_consumption_kwh_per_day=1080.0,
                equipment_status=EquipmentStatus.OPERATING,
                operating_constraints={
                    "max_wellhead_pressure_psia": 1500.0,
                    "max_motor_temp_deg_c": 120.0,
                    "max_flowline_temp_deg_c": 90.0,
                    "min_fillage_pct": 50.0,
                },
            ),
            notes="Default baseline state initialized for Baghewala Well-1 (Bikaner-Nagaur Basin).",
        )
        self._latest_state = default_state
        self._history.append(default_state)

    def get_latest_state(self) -> DigitalTwinStateResponse:
        return self._latest_state

    def update_state(self, request: DigitalTwinStateRequest) -> DigitalTwinStateResponse:
        new_state = DigitalTwinStateResponse(
            state_id=f"state-{uuid.uuid4().hex[:12]}",
            timestamp=datetime.utcnow().isoformat(),
            reservoir=request.reservoir,
            steam_injection=request.steam_injection,
            well_production=request.well_production,
            surface_system=request.surface_system,
            notes=request.notes,
        )
        self._latest_state = new_state
        self._history.append(new_state)
        return new_state

    def get_history(self, limit: int = 20) -> List[DigitalTwinStateResponse]:
        return self._history[-limit:]


digital_twin_service = DigitalTwinService()
