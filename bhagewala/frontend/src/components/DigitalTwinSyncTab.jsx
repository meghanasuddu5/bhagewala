import React, { useState } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertCircle, Save, 
  Layers, Flame, Droplet, Zap, Compass, History, Tag
} from 'lucide-react';
import { updateDigitalTwinState } from '../api';

export default function DigitalTwinSyncTab({ twinState, onTwinStateUpdated }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Editable Form State
  const [reservoirPressure, setReservoirPressure] = useState(twinState?.reservoir?.reservoir_pressure_psia || 3740.0);
  const [reservoirTemp, setReservoirTemp] = useState(twinState?.reservoir?.reservoir_temperature_deg_c || 48.0);
  const [viscosity, setViscosity] = useState(twinState?.reservoir?.oil_viscosity_cp || 14500.0);
  const [depth, setDepth] = useState(twinState?.reservoir?.reservoir_depth_m || 1050.0);
  const [payThickness, setPayThickness] = useState(twinState?.reservoir?.reservoir_thickness_m || 18.0);
  const [oilSaturation, setOilSaturation] = useState(twinState?.reservoir?.oil_saturation_pct || 66.0);

  const [steamRate, setSteamRate] = useState(twinState?.steam_injection?.steam_injection_rate_tpd || 140.0);
  const [steamPressure, setSteamPressure] = useState(twinState?.steam_injection?.steam_pressure_bar || 68.0);
  const [steamTemp, setSteamTemp] = useState(twinState?.steam_injection?.steam_temperature_deg_c || 282.0);
  const [steamQuality, setSteamQuality] = useState(twinState?.steam_injection?.steam_quality_pct || 81.0);
  const [cumulativeSteam, setCumulativeSteam] = useState(twinState?.steam_injection?.cumulative_injected_steam_tonnes || 4800.0);
  const [cycleStage, setCycleStage] = useState(twinState?.steam_injection?.css_cycle_stage || "Production");

  const [currentOilRate, setCurrentOilRate] = useState(twinState?.well_production?.current_oil_rate_bopd || 450.5);
  const [waterRate, setWaterRate] = useState(twinState?.well_production?.water_rate_bwpd || 12.5);
  const [gasRate, setGasRate] = useState(twinState?.well_production?.gas_rate_mcfd || 620.0);
  const [pumpSpeed, setPumpSpeed] = useState(twinState?.well_production?.pump_speed || 2.0);
  const [pumpType, setPumpType] = useState(twinState?.well_production?.pump_type || "Sucker Rod Pump (SRP)");
  const [pumpStatus, setPumpStatus] = useState(twinState?.well_production?.pump_operating_status || "Operating");

  const [pumpPower, setPumpPower] = useState(twinState?.surface_system?.pump_power_kw || 48.0);
  const [energyConsumption, setEnergyConsumption] = useState(twinState?.surface_system?.energy_consumption_kwh_per_day || 1150.0);
  const [equipmentStatus, setEquipmentStatus] = useState(twinState?.surface_system?.equipment_status || "Operating");
  const [syncNotes, setSyncNotes] = useState("Field wellhead telemetry synchronization check.");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      reservoir: {
        reservoir_pressure_psia: parseFloat(reservoirPressure),
        reservoir_temperature_deg_c: parseFloat(reservoirTemp),
        oil_viscosity_cp: parseFloat(viscosity),
        reservoir_depth_m: parseFloat(depth),
        reservoir_thickness_m: parseFloat(payThickness),
        oil_saturation_pct: parseFloat(oilSaturation),
      },
      steam_injection: {
        steam_injection_rate_tpd: parseFloat(steamRate),
        steam_pressure_bar: parseFloat(steamPressure),
        steam_temperature_deg_c: parseFloat(steamTemp),
        steam_quality_pct: parseFloat(steamQuality),
        cumulative_injected_steam_tonnes: parseFloat(cumulativeSteam),
        css_cycle_stage: cycleStage,
      },
      well_production: {
        well_id: "0cacd33e-874a-408f-44e0-67c262ca762e",
        current_oil_rate_bopd: parseFloat(currentOilRate),
        water_rate_bwpd: parseFloat(waterRate),
        gas_rate_mcfd: parseFloat(gasRate),
        pump_type: pumpType,
        pump_speed: parseFloat(pumpSpeed),
        pump_operating_status: pumpStatus,
      },
      surface_system: {
        pump_power_kw: parseFloat(pumpPower),
        energy_consumption_kwh_per_day: parseFloat(energyConsumption),
        equipment_status: equipmentStatus,
      },
      notes: syncNotes,
    };

    try {
      const res = await updateDigitalTwinState(payload);
      setSuccessMsg(`Digital Twin state synchronized successfully (ID: ${res.state_id || 'state-live'})`);
      if (onTwinStateUpdated) onTwinStateUpdated(res);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update digital twin state.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sync-container">
      {/* Banner */}
      <div className="section-banner glass-panel">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <Database size={20} className="text-purple" />
            <h2 className="section-title">Digital Twin Operational State Synchronization</h2>
          </div>
          <p className="section-subtitle">
            Synchronize physical domain telemetry (Reservoir, CSS Thermal Steam, Artificial Lift, Surface Plant) and validate against the V1.3 Machine Learning model schema.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="sync-form-grid">
          {/* Domain 1: Reservoir */}
          <div className="sync-panel glass-panel">
            <div className="panel-header">
              <div className="flex-center gap-2">
                <Compass size={18} className="text-emerald" />
                <h3 className="panel-title">1. Reservoir Subsurface</h3>
              </div>
              <span className="badge badge-emerald">Formation Layer</span>
            </div>

            <div className="form-fields">
              <div className="field-row">
                <label className="field-label">Reservoir Pressure (psia) <span className="badge badge-amber text-xxs">ML Ingest</span></label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={reservoirPressure}
                  onChange={(e) => setReservoirPressure(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Reservoir Temp (&deg;C)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input-control"
                  value={reservoirTemp}
                  onChange={(e) => setReservoirTemp(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Native Viscosity (cP)</label>
                <input
                  type="number"
                  step="100"
                  className="input-control"
                  value={viscosity}
                  onChange={(e) => setViscosity(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Reservoir Depth (m TVD)</label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Net Pay Thickness (m)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input-control"
                  value={payThickness}
                  onChange={(e) => setPayThickness(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Initial Oil Saturation (%)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input-control"
                  value={oilSaturation}
                  onChange={(e) => setOilSaturation(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Domain 2: Thermal Steam */}
          <div className="sync-panel glass-panel">
            <div className="panel-header">
              <div className="flex-center gap-2">
                <Flame size={18} className="text-cyan" />
                <h3 className="panel-title">2. Thermal CSS Steam</h3>
              </div>
              <span className="badge badge-cyan">CSS Injection</span>
            </div>

            <div className="form-fields">
              <div className="field-row">
                <label className="field-label">Steam Rate (TPD)</label>
                <input
                  type="number"
                  step="5"
                  className="input-control"
                  value={steamRate}
                  onChange={(e) => setSteamRate(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Steam Pressure (bar)</label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={steamPressure}
                  onChange={(e) => setSteamPressure(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Steam Temperature (&deg;C)</label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={steamTemp}
                  onChange={(e) => setSteamTemp(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Steam Quality (%)</label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={steamQuality}
                  onChange={(e) => setSteamQuality(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Cumulative Injected (T)</label>
                <input
                  type="number"
                  step="50"
                  className="input-control"
                  value={cumulativeSteam}
                  onChange={(e) => setCumulativeSteam(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">CSS Cycle Stage</label>
                <select 
                  className="input-control" 
                  value={cycleStage}
                  onChange={(e) => setCycleStage(e.target.value)}
                >
                  <option value="Injection">Injection Phase</option>
                  <option value="Soaking">Soaking Phase</option>
                  <option value="Production">Production Phase</option>
                  <option value="Inter-cycle Rest">Inter-cycle Rest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Domain 3: Well Production */}
          <div className="sync-panel glass-panel">
            <div className="panel-header">
              <div className="flex-center gap-2">
                <Droplet size={18} className="text-amber" />
                <h3 className="panel-title">3. Wellbore Production</h3>
              </div>
              <span className="badge badge-amber">Artificial Lift</span>
            </div>

            <div className="form-fields">
              <div className="field-row">
                <label className="field-label">Current Oil Rate (BOPD) <span className="badge badge-amber text-xxs">ML Ingest</span></label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={currentOilRate}
                  onChange={(e) => setCurrentOilRate(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Water Rate (BWPD) <span className="badge badge-amber text-xxs">ML Ingest</span></label>
                <input
                  type="number"
                  step="0.5"
                  className="input-control"
                  value={waterRate}
                  onChange={(e) => setWaterRate(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Gas Rate (MCFD) <span className="badge badge-amber text-xxs">ML Ingest</span></label>
                <input
                  type="number"
                  step="10"
                  className="input-control"
                  value={gasRate}
                  onChange={(e) => setGasRate(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Pump Speed (SPM / Hz) <span className="badge badge-amber text-xxs">ML Ingest</span></label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  value={pumpSpeed}
                  onChange={(e) => setPumpSpeed(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Pump Type</label>
                <select 
                  className="input-control"
                  value={pumpType}
                  onChange={(e) => setPumpType(e.target.value)}
                >
                  <option value="Sucker Rod Pump (SRP)">Sucker Rod Pump (SRP)</option>
                  <option value="Electric Submersible Pump (ESP)">Electric Submersible Pump (ESP)</option>
                  <option value="Progressing Cavity Pump (PCP)">Progressing Cavity Pump (PCP)</option>
                </select>
              </div>

              <div className="field-row">
                <label className="field-label">Operating Status</label>
                <select 
                  className="input-control"
                  value={pumpStatus}
                  onChange={(e) => setPumpStatus(e.target.value)}
                >
                  <option value="Operating">Operating</option>
                  <option value="Idle">Idle</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Tripped / Fault">Tripped / Fault</option>
                </select>
              </div>
            </div>
          </div>

          {/* Domain 4: Surface & Power */}
          <div className="sync-panel glass-panel">
            <div className="panel-header">
              <div className="flex-center gap-2">
                <Zap size={18} className="text-purple" />
                <h3 className="panel-title">4. Surface Facility</h3>
              </div>
              <span className="badge badge-purple">Power Grid</span>
            </div>

            <div className="form-fields">
              <div className="field-row">
                <label className="field-label">Motor Power (kW)</label>
                <input
                  type="number"
                  step="1"
                  className="input-control"
                  value={pumpPower}
                  onChange={(e) => setPumpPower(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Daily Energy (kWh/day)</label>
                <input
                  type="number"
                  step="20"
                  className="input-control"
                  value={energyConsumption}
                  onChange={(e) => setEnergyConsumption(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label">Equipment Status</label>
                <select 
                  className="input-control"
                  value={equipmentStatus}
                  onChange={(e) => setEquipmentStatus(e.target.value)}
                >
                  <option value="Operating">Operating</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Standby">Standby</option>
                </select>
              </div>

              <div className="field-row">
                <label className="field-label">Synchronization Audit Notes</label>
                <input
                  type="text"
                  className="input-control"
                  value={syncNotes}
                  onChange={(e) => setSyncNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="sync-actions-bar glass-panel">
          <div className="sync-info">
            <Tag size={16} className="text-amber" />
            <span className="text-xs text-muted">
              Note: Updating reservoir pressure, oil rate, gas rate, and pump speed immediately updates the baseline inference inputs.
            </span>
          </div>
          <button 
            id="sync-state-btn"
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} />
            <span>{loading ? 'Synchronizing State...' : 'Synchronize Digital Twin State'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
