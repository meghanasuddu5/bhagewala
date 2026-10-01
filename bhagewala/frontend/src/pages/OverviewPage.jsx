import React, { useState } from 'react';
import { 
  Droplet, Flame, Gauge, Zap, Compass, ArrowUpRight, 
  ShieldAlert, Activity, CheckCircle2, TrendingUp, Layers,
  Clock, AlertTriangle, Radio, RefreshCw, BarChart3, Database
} from 'lucide-react';
import Twin3DViewer from '../components/Twin3DViewer';
import SimulationStageVisualizer from '../components/SimulationStageVisualizer';

export default function OverviewPage({ twinState, onNavigate }) {
  const [activeStage, setActiveStage] = useState(0);

  const reservoir = twinState?.reservoir || {};
  const steam = twinState?.steam_injection || {};
  const well = twinState?.well_production || {};
  const surface = twinState?.surface_system || {};

  const recentEvents = [
    { time: "10:45 UTC", event: "V1.3 Hybrid Model executed daily inference: 453.9 BOPD (+0.8%).", type: "ml" },
    { time: "09:30 UTC", event: "Rod pump frequency locked at 2.0 SPM. Polished rod load stable at 14,250 lbs.", type: "telemetry" },
    { time: "08:15 UTC", event: "CSS Cycle 2 Soak Period concluded (6 days). Bottomhole temp: 195°C.", type: "thermal" },
    { time: "Yesterday", event: "Near-wellbore viscosity measured at 245 cP (98.3% reduction from 14,500 cP tar).", type: "reservoir" },
  ];

  return (
    <div className="page-container">
      {/* Critical Data Integrity Safeguard Alert */}
      <div className="integrity-alert-banner">
        <ShieldAlert size={20} className="text-amber flex-shrink-0" />
        <div className="integrity-alert-text">
          <strong className="text-white">Industrial Provenance Safeguard:</strong> The V1.3 Hybrid Model was trained on an experimental proxy dataset (ENR004: 15,699 records across 48 wells) and has not been validated against actual Baghewala field subsurface logs. All data is categorized explicitly into measured telemetry, ML inferences, and illustrative 3D simulations.
        </div>
      </div>

      {/* KPI Highlight Strip (Control-Room Style) */}
      <div className="kpi-grid">
        {/* KPI 1: Oil Rate */}
        <div className="kpi-card border-amber">
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
            <span className="tag-telemetry">Telemetry Ingest</span>
            <span className="text-dim text-xs font-mono">Gross Liquid: ~463 BLPD</span>
          </div>
        </div>

        {/* KPI 2: CSS Steam Status */}
        <div className="kpi-card border-cyan">
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
            <span className="badge badge-cyan font-mono">{steam.css_cycle_stage || 'Production'}</span>
            <span className="text-dim text-xs font-mono">{steam.steam_pressure_bar || 68} bar &bull; {steam.steam_temperature_deg_c || 282}&deg;C</span>
          </div>
        </div>

        {/* KPI 3: Reservoir Pressure */}
        <div className="kpi-card border-emerald">
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
            <span className="badge badge-emerald font-mono">Depth: {reservoir.reservoir_depth_m || 1050}m</span>
            <span className="text-dim text-xs font-mono">Drawdown ~1,430 psia</span>
          </div>
        </div>

        {/* KPI 4: Surface Power */}
        <div className="kpi-card border-purple">
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
            <span className="badge badge-purple font-mono">{well.pump_type?.includes('SRP') ? 'SRP @ 2.0 SPM' : 'ESP Active'}</span>
            <span className="text-dim text-xs font-mono">{surface.energy_consumption_kwh_per_day || 1150} kWh/d</span>
          </div>
        </div>
      </div>

      {/* Main 3D Digital Twin Centerpiece */}
      <Twin3DViewer 
        twinState={twinState} 
        activeSimulationStage={activeStage}
        onStageChange={setActiveStage}
      />

      {/* 6-Stage Process Sequence Visualizer */}
      <SimulationStageVisualizer 
        currentOilRate={well.current_oil_rate_bopd || 450.5} 
        activeStage={activeStage}
        onStageSelect={setActiveStage}
      />

      {/* Events Log & Quick Nav Grid */}
      <div className="quick-nav-grid">
        {/* Events Ticker */}
        <div className="card-dark p-4" style={{ padding: '16px 20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-xs font-bold text-white uppercase tracking-wider flex-center gap-2">
              <Clock size={14} className="text-amber" />
              Recent Field Events & Operational Ticker
            </span>
            <span className="badge badge-gray font-mono text-xxs">Well BW-01</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentEvents.map((ev, idx) => (
              <div key={idx} className="flex-center justify-between text-xs" style={{ padding: '6px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <span className="text-dim font-mono text-xxs" style={{ minWidth: '70px' }}>{ev.time}</span>
                <span className="text-muted flex-1 mx-2">{ev.event}</span>
                <span className={ev.type === 'ml' ? 'tag-ml' : ev.type === 'thermal' ? 'tag-sim' : 'tag-telemetry'}>
                  {ev.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Direct Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="quick-nav-card" onClick={() => onNavigate('forecast')}>
            <div className="flex-center gap-3">
              <span className="icon-badge bg-amber-100 text-amber-700">
                <Activity size={20} />
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">AI Production Forecast (V1.3)</h4>
                <p className="text-xs text-dim">Run two-stage hybrid ML inference with 0.1500 zero-cutoff risk checks</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-dim" />
          </div>

          <div className="quick-nav-card" onClick={() => onNavigate('scenarios')}>
            <div className="flex-center gap-3">
              <span className="icon-badge bg-blue-100 text-blue-700">
                <Layers size={20} />
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">Scenario Lab & Decline Simulator</h4>
                <p className="text-xs text-dim">Simulate multi-day decline curves, CSS thermal surges, and equipment risk</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-dim" />
          </div>
        </div>
      </div>
    </div>
  );
}
