import React from 'react';
import { 
  Flame, Gauge, Sparkles
} from 'lucide-react';
import SimulationStageVisualizer from '../components/SimulationStageVisualizer';
import HeatFrontMiniMap from '../components/VisualAids/HeatFrontMiniMap';
import RadialTempProfile from '../components/VisualAids/RadialTempProfile';
import { TWIN_CONSTANTS } from '../constants/twinConstants';
import { formatValue, formatTemp, formatPressure } from '../utils/formatters';
import { ProvenanceBadge } from '../constants/dataSourceRegistry';
import { DEFAULT_COUPLED_INPUTS, solveCoupledState } from '../utils/coupledEngine';

export default function SteamThermalPage({ twinState }) {
  const coupled = solveCoupledState(DEFAULT_COUPLED_INPUTS);
  const steam = coupled.steam;
  const res = coupled.reservoir;

  const injectionDays = DEFAULT_COUPLED_INPUTS.injection_days || 10;
  const soakDays = DEFAULT_COUPLED_INPUTS.soak_days || 6;
  const steamRate = steam.rate_tpd || 140.0;
  const steamTemp = DEFAULT_COUPLED_INPUTS.steam_temp_c || 282.0;
  const steamPress = DEFAULT_COUPLED_INPUTS.injection_press_bar || 68.0;
  const cumSteam = steam.cumulative_tonnes || 1400;
  const heatedRadius = res.heated_radius_m || 18.5;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="section-banner">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <span className="icon-badge bg-blue-100 text-blue-700">
              <Flame size={20} />
            </span>
            <h2 className="section-title">Steam & Thermal Recovery System (CSS)</h2>
          </div>
          <p className="section-subtitle">
            Cyclic Steam Stimulation operational telemetry: Once-Through Steam Generator (OTSG), {injectionDays}-day superheated injection cycle, and {soakDays}-day thermal equilibration soak.
          </p>
        </div>
        <ProvenanceBadge quantityKey="steam_rate_tpd" />
      </div>

      {/* 6-Stage Process Sequence Visualizer */}
      <SimulationStageVisualizer currentOilRate={coupled.well_and_pump.delivered_oil_rate_bopd || 450.5} />

      {/* Boiler Facility & Steam Quality Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Boiler Plant Operating Parameters */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <span className="icon-badge bg-blue-100 text-blue-700">
                <Gauge size={18} />
              </span>
              <h3 className="font-bold text-main text-base">Boiler Plant & Injection Telemetry</h3>
            </div>
            <ProvenanceBadge quantityKey="steam_rate_tpd" />
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Steam Injection Rate</td>
                  <td className="font-mono font-bold text-cyan" style={{ padding: '8px 4px' }}>{formatValue(steamRate, { precision: 1, unit: 't/d' })}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="steam_rate_tpd" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Wellhead Steam Pressure</td>
                  <td className="font-mono font-bold text-amber" style={{ padding: '8px 4px' }}>{formatPressure(steamPress, 'bar', 1)}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="steam_pressure_bar" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Superheated Steam Temp</td>
                  <td className="font-mono font-bold text-rose" style={{ padding: '8px 4px' }}>{formatTemp(steamTemp, 1)}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="steam_temp_c" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Steam Quality (Dryness)</td>
                  <td className="font-mono text-emerald" style={{ padding: '8px 4px' }}>80.0 % (Dry)</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="steam_quality" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Cumulative Steam Injected</td>
                  <td className="font-mono text-purple" style={{ padding: '8px 4px' }}>{formatValue(cumSteam, { precision: 0, unit: 't' })}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="cum_steam_tonnes" /></td>
                </tr>
                <tr>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Cycle Huff Duration</td>
                  <td className="font-mono font-semibold text-main" style={{ padding: '8px 4px' }}>{injectionDays} Days (Current Setpoint)</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="steam_rate_tpd" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Thermal Chamber Physics & Heat Transfer */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <span className="icon-badge bg-amber-100 text-amber-700">
                <Sparkles size={18} />
              </span>
              <h3 className="font-bold text-main text-base">Subsurface Heat Soak Dynamics</h3>
            </div>
            <ProvenanceBadge quantityKey="heated_radius_m" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="stat-item">
              <span className="stat-label">Radial Heat Chamber Extent (rh)</span>
              <span className="stat-val font-mono" style={{ color: 'var(--accent-amber)' }}>
                {formatValue(heatedRadius, { precision: 1, unit: 'meters' })} from wellbore
              </span>
              <span className="text-dim text-xxs">Marx-Langenheim heat balance from {formatValue(cumSteam, { precision: 0, unit: 'tonnes' })} steam</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Equilibrated Soak Matrix Temperature</span>
              <span className="stat-val font-mono" style={{ color: 'var(--alarm)' }}>
                {formatTemp(res.wellbore_temperature_c || 195.0, 1)}
              </span>
              <span className="text-dim text-xxs">Conductive thermal soak across {soakDays} shut-in days</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Thermal Recovery Mechanism</span>
              <span className="stat-val font-mono" style={{ color: 'var(--accent-steam)', fontSize: '0.95rem' }}>
                Latent Heat Condensation + Viscosity Collapse
              </span>
              <span className="text-dim text-xxs">Reduces dead oil flow resistance by 98.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Visual Aids: Heat Front Mini-Map & Radial Temperature Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <HeatFrontMiniMap heatedRadiusM={heatedRadius} isInjecting={true} />
        <RadialTempProfile steamTempC={steamTemp} heatedRadiusM={heatedRadius} nativeTempC={48.0} />
      </div>
    </div>
  );
}
