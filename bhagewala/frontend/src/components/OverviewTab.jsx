import React from 'react';
import { 
  Droplet, Flame, Gauge, Zap, ChevronRight, AlertTriangle, 
  Layers, HardHat, Compass, Thermometer, Wind, ArrowUpRight,
  TrendingUp, Activity, CheckCircle2
} from 'lucide-react';
import Twin3DViewer from './Twin3DViewer';
import FieldStoryGuide from './FieldStoryGuide';

export default function OverviewTab({ twinState, onNavigateToPredictor, onNavigateToSimulator }) {
  const reservoir = twinState?.reservoir || {};
  const steam = twinState?.steam_injection || {};
  const well = twinState?.well_production || {};
  const surface = twinState?.surface_system || {};

  return (
    <div className="overview-container">
      {/* 1. Visual Desert Photo Hero & Thematic CSS Walkthrough */}
      <FieldStoryGuide />

      {/* 2. Interactive Real Working 3D WebGL Digital Twin (Pump, Steam, Reservoir) */}
      <Twin3DViewer twinState={twinState} />

      {/* 3. Operational KPIs Strip */}
      <div className="kpi-grid">
        {/* KPI 1: Oil Rate */}
        <div className="kpi-card card-light border-amber">
          <div className="kpi-header">
            <span className="kpi-title">Current Oil Rate</span>
            <div className="icon-badge bg-amber-100 text-amber-700">
              <Droplet size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value font-mono text-amber">
              {well.current_oil_rate_bopd?.toFixed(1) || '450.5'}
            </span>
            <span className="kpi-unit">BOPD</span>
          </div>
          <div className="kpi-footer">
            <span className="badge badge-amber">ML Ingest</span>
            <span className="text-dim text-xs font-mono">Next-day target base</span>
          </div>
        </div>

        {/* KPI 2: CSS Steam Status */}
        <div className="kpi-card card-light border-cyan">
          <div className="kpi-header">
            <span className="kpi-title">CSS Steam Status</span>
            <div className="icon-badge bg-blue-100 text-blue-700">
              <Flame size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value font-mono text-cyan">
              {steam.steam_injection_rate_tpd?.toFixed(0) || '140'}
            </span>
            <span className="kpi-unit">TPD</span>
          </div>
          <div className="kpi-footer">
            <span className="badge badge-blue">{steam.css_cycle_stage || 'Production'}</span>
            <span className="text-dim text-xs font-mono">{steam.steam_pressure_bar || 68} bar &bull; {steam.steam_temperature_deg_c || 282}&deg;C</span>
          </div>
        </div>

        {/* KPI 3: Reservoir Pressure */}
        <div className="kpi-card card-light border-emerald">
          <div className="kpi-header">
            <span className="kpi-title">Reservoir Pressure</span>
            <div className="icon-badge bg-emerald-100 text-emerald-700">
              <Gauge size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value font-mono text-emerald">
              {reservoir.reservoir_pressure_psia?.toFixed(0) || '3,740'}
            </span>
            <span className="kpi-unit">PSIA</span>
          </div>
          <div className="kpi-footer">
            <span className="badge badge-emerald">Depth: {reservoir.reservoir_depth_m || 1050}m</span>
            <span className="text-dim text-xs font-mono">Drawdown ~1,430 psia</span>
          </div>
        </div>

        {/* KPI 4: Surface Power & Pump */}
        <div className="kpi-card card-light border-purple">
          <div className="kpi-header">
            <span className="kpi-title">Surface Power & Lift</span>
            <div className="icon-badge bg-purple-100 text-purple-700">
              <Zap size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value font-mono text-purple">
              {surface.pump_power_kw?.toFixed(1) || '48.0'}
            </span>
            <span className="kpi-unit">kW</span>
          </div>
          <div className="kpi-footer">
            <span className="badge badge-purple">{well.pump_type?.includes('SRP') ? 'SRP @ 2.0 SPM' : 'ESP Active'}</span>
            <span className="text-dim text-xs font-mono">{surface.energy_consumption_kwh_per_day || 1150} kWh/d</span>
          </div>
        </div>
      </div>

      {/* 4. 4-Domain Digital Twin Telemetry Grid */}
      <div className="domains-grid">
        {/* Domain 1: Reservoir Physics */}
        <div className="domain-card card-light">
          <div className="domain-card-header">
            <div className="flex-center gap-2">
              <span className="icon-badge bg-emerald-100 text-emerald-700">
                <Compass size={18} />
              </span>
              <h3 className="domain-card-title">1. Reservoir Physics Domain</h3>
            </div>
            <span className="badge badge-gray font-mono">Subsurface</span>
          </div>

          <div className="domain-metrics-list">
            <div className="metric-row">
              <span className="metric-name">Static Reservoir Pressure</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono">{reservoir.reservoir_pressure_psia || 3740} psia</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Formation Temperature</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{reservoir.reservoir_temperature_deg_c || 48.0} &deg;C</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Dead Oil Viscosity</span>
              <span className="badge badge-rose font-mono text-xxs">Native Heavy</span>
              <span className="metric-val font-mono font-bold text-amber">{reservoir.oil_viscosity_cp?.toLocaleString() || '14,500'} cP</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">True Vertical Depth (TVD)</span>
              <span className="badge badge-gray font-mono text-xxs">Static</span>
              <span className="metric-val font-mono">{reservoir.reservoir_depth_m || 1050} m</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Net Pay Sandstone Thickness</span>
              <span className="badge badge-gray font-mono text-xxs">Static</span>
              <span className="metric-val font-mono">{reservoir.reservoir_thickness_m || 18.0} m</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Oil Saturation (So)</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{reservoir.oil_saturation_pct || 66.0}%</span>
            </div>
          </div>
        </div>

        {/* Domain 2: Thermal CSS Steam Injection */}
        <div className="domain-card card-light">
          <div className="domain-card-header">
            <div className="flex-center gap-2">
              <span className="icon-badge bg-blue-100 text-blue-700">
                <Flame size={18} />
              </span>
              <h3 className="domain-card-title">2. Thermal CSS Steam Domain</h3>
            </div>
            <span className="badge badge-blue font-mono">{steam.css_cycle_stage || 'Production'}</span>
          </div>

          <div className="domain-metrics-list">
            <div className="metric-row">
              <span className="metric-name">Steam Injection Rate</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{steam.steam_injection_rate_tpd || 140} TPD</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Steam Injection Pressure</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{steam.steam_pressure_bar || 68.0} bar</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Steam Temperature</span>
              <span className="badge badge-rose font-mono text-xxs">Superheated</span>
              <span className="metric-val font-mono font-bold text-rose">{steam.steam_temperature_deg_c || 282.0} &deg;C</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Steam Quality (X)</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{steam.steam_quality_pct || 81.0}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Cumulative Steam Injected</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{steam.cumulative_injected_steam_tonnes?.toLocaleString() || '4,800'} T</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">CSS Cycle Phase</span>
              <span className="badge badge-blue font-mono text-xxs">Active Phase</span>
              <span className="metric-val font-mono text-cyan font-bold">{steam.css_cycle_stage || 'Production'}</span>
            </div>
          </div>
        </div>

        {/* Domain 3: Wellbore & Artificial Lift */}
        <div className="domain-card card-light">
          <div className="domain-card-header">
            <div className="flex-center gap-2">
              <span className="icon-badge bg-amber-100 text-amber-700">
                <Droplet size={18} />
              </span>
              <h3 className="domain-card-title">3. Wellbore Production & Lift</h3>
            </div>
            <span className="badge badge-amber font-mono">ENR004 Ingest</span>
          </div>

          <div className="domain-metrics-list">
            <div className="metric-row">
              <span className="metric-name">Current Oil Production</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono font-bold text-amber">{well.current_oil_rate_bopd || 450.5} BOPD</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Produced Water Rate</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono">{well.water_rate_bwpd || 12.5} BWPD</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Associated Gas Rate</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono">{well.gas_rate_mcfd || 620.0} MCFD</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Artificial Lift Type</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono text-xs">{well.pump_type || 'Sucker Rod Pump (SRP)'}</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Rod Pump Speed (SPM)</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono font-bold">{well.pump_speed || 2.0} SPM</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Wellhead Operating Status</span>
              <span className="badge badge-emerald font-mono text-xxs">Online</span>
              <span className="metric-val font-mono text-emerald font-bold">{well.pump_operating_status || 'Operating'}</span>
            </div>
          </div>
        </div>

        {/* Domain 4: Surface Facilities & Power */}
        <div className="domain-card card-light">
          <div className="domain-card-header">
            <div className="flex-center gap-2">
              <span className="icon-badge bg-purple-100 text-purple-700">
                <Zap size={18} />
              </span>
              <h3 className="domain-card-title">4. Surface Facility & Power</h3>
            </div>
            <span className="badge badge-purple font-mono">Surface Grid</span>
          </div>

          <div className="domain-metrics-list">
            <div className="metric-row">
              <span className="metric-name">Motor Power Draw</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono font-bold text-purple">{surface.pump_power_kw || 48.0} kW</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Daily Power Consumption</span>
              <span className="badge badge-gray font-mono text-xxs">Telemetry</span>
              <span className="metric-val font-mono">{surface.energy_consumption_kwh_per_day || 1150} kWh/d</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Flowing WHP</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono">610.0 psia</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Flowing BHP</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono">2,310.0 psia</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Water-Oil Ratio (WOR)</span>
              <span className="badge badge-amber font-mono text-xxs">ML Ingested</span>
              <span className="metric-val font-mono">0.028</span>
            </div>
            <div className="metric-row">
              <span className="metric-name">Equipment Status</span>
              <span className="badge badge-emerald font-mono text-xxs">Operational</span>
              <span className="metric-val font-mono text-emerald font-bold">{surface.equipment_status || 'Operating'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
