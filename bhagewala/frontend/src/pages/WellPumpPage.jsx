import React from 'react';
import { 
  Droplet, Zap, Gauge, Activity, CheckCircle2, 
  AlertTriangle, RotateCw, Info
} from 'lucide-react';
import { TWIN_CONSTANTS } from '../constants/twinConstants';
import { formatValue, formatBOPD, formatPressure, formatPercent } from '../utils/formatters';
import { ProvenanceBadge } from '../constants/dataSourceRegistry';
import { DEFAULT_COUPLED_INPUTS, solveCoupledState } from '../utils/coupledEngine';
import DynamometerCard from '../components/VisualAids/DynamometerCard';
import IprPumpCurve from '../components/VisualAids/IprPumpCurve';
import DownholePumpInset from '../components/VisualAids/DownholePumpInset';

export default function WellPumpPage({ twinState }) {
  // Solve coupled physics state for live, synchronized rod loads and kinematics
  const coupled = solveCoupledState(DEFAULT_COUPLED_INPUTS);
  const well = coupled.well_and_pump;
  const res = coupled.reservoir;

  const spm = well.spm || 2.0;
  const fillagePct = well.pump_fillage_pct || 82.0;
  const peakLoadLbs = well.rod_load_lbs || 14250;
  const minLoadLbs = Math.round(peakLoadLbs * 0.29); // Downstroke buoyant rod weight
  const pwf = res.flowing_bottomhole_pressure_psia || 1120.0;
  const pr = DEFAULT_COUPLED_INPUTS.res_pressure_psia || 1520.0;
  const drawdown = Math.max(0, pr - pwf);
  const fluidLevelM = well.fluid_level_m || 380.0;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div className="section-banner">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <span className="icon-badge bg-amber-100 text-amber-700">
              <Droplet size={20} />
            </span>
            <h2 className="section-title">Well Production & Artificial Lift System</h2>
          </div>
          <p className="section-subtitle">
            Coupled sucker rod pump kinematics, VFD motor performance, bottomhole pressures, and surface gathering metrics for Well BW-01.
          </p>
        </div>
        <ProvenanceBadge quantityKey="pumping_speed_spm" />
      </div>

      {/* Main Well & Pump Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left: Downhole & Surface Pump Telemetry */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <span className="icon-badge bg-purple-100 text-purple-700">
                <Zap size={18} />
              </span>
              <h3 className="font-bold text-main text-base">Artificial Lift & Mechanical Parameters</h3>
            </div>
            <ProvenanceBadge quantityKey="pump_displacement_bpd" />
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Parameter</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Operating Value</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Classification</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Artificial Lift Type</td>
                  <td className="font-mono text-main" style={{ padding: '8px 4px' }}>Sucker Rod Pump (SRP)</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="pumping_speed_spm" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Rod Pumping Speed</td>
                  <td className="font-mono font-bold text-amber" style={{ padding: '8px 4px' }}>{formatValue(spm, { precision: 1, unit: 'SPM' })}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="pumping_speed_spm" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Pump Barrel Fillage</td>
                  <td className="font-mono font-bold text-emerald" style={{ padding: '8px 4px' }}>{formatPercent(fillagePct, 1)}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="pump_fillage_pct" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Delivered Oil Rate</td>
                  <td className="font-mono font-bold text-amber" style={{ padding: '8px 4px' }}>{formatBOPD(well.delivered_oil_rate_bopd, 1)}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="surface_oil_rate_bopd" /></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Motor Electric Power</td>
                  <td className="font-mono text-purple" style={{ padding: '8px 4px' }}>{formatValue(well.motor_electric_kw, { precision: 1, unit: 'kW' })}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="motor_power_kw" /></td>
                </tr>
                <tr>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Dynamic Fluid Level</td>
                  <td className="font-mono text-main" style={{ padding: '8px 4px' }}>{formatValue(fluidLevelM, { precision: 1, unit: 'm' })}</td>
                  <td style={{ padding: '8px 4px' }}><ProvenanceBadge quantityKey="fluid_level_m" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Pressure Hydraulics & Wellhead */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <span className="icon-badge bg-emerald-100 text-emerald-700">
                <Gauge size={18} />
              </span>
              <h3 className="font-bold text-main text-base">Wellhead & Bottomhole Hydraulics</h3>
            </div>
            <ProvenanceBadge quantityKey="pwf_psia" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="stat-item">
              <span className="stat-label">Flowing BHP (Pwf)</span>
              <span className="stat-val font-mono" style={{ color: 'var(--ok)' }}>
                {formatPressure(pwf, 'psia', 1)}
              </span>
              <span className="text-dim text-xxs">At 1,050m reservoir datum</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Drawdown Delta (Pr - Pwf)</span>
              <span className="stat-val font-mono" style={{ color: 'var(--accent-amber)' }}>
                {formatPressure(drawdown, 'psia', 1)}
              </span>
              <span className="text-dim text-xxs">Driving fluid inflow head</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Flowing Wellhead Tubing Pressure</span>
              <span className="stat-val font-mono" style={{ color: 'var(--accent-cyan)' }}>
                {formatPressure(610.0, 'psia', 1)}
              </span>
              <span className="text-dim text-xxs">At surface Christmas tree</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Casing Head Annulus Pressure</span>
              <span className="stat-val font-mono" style={{ color: 'var(--ink-muted)' }}>
                {formatPressure(185.0, 'psia', 1)}
              </span>
              <span className="text-dim text-xxs">Gas vent to separator</span>
            </div>
          </div>

          <div className="integrity-alert-banner mt-4" style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <Info size={16} className="text-amber flex-shrink-0" style={{ marginTop: '2px' }} />
            <div className="integrity-alert-text" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              <strong style={{ color: 'var(--ink)' }}>Dynamometer Status:</strong> Stroke kinematics reflect an operating card with {formatPercent(fillagePct, 1)} barrel fillage ({well.gas_interference ? 'Fluid pound notch detected' : 'Full intake displacement'}). Coupled polished rod peak load is <strong style={{ color: 'var(--ink)' }}>{formatValue(peakLoadLbs, { precision: 0, unit: 'lbs' })}</strong> with a minimum downstroke load of <strong style={{ color: 'var(--ink)' }}>{formatValue(minLoadLbs, { precision: 0, unit: 'lbs' })}</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Live Visual Aids: Real Dynamometer Card & IPR vs Pump Capacity Curve & Pump Inset */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <DynamometerCard 
          fillagePct={fillagePct}
          spm={spm}
          rodLoadLbs={peakLoadLbs}
          strokeLengthIn={120}
          gasInterference={well.gas_interference}
        />
        <IprPumpCurve 
          resPressurePsia={pr}
          flowingPwfPsia={pwf}
          flowingRateBopd={well.delivered_oil_rate_bopd}
          qMaxBopd={res.max_theoretical_inflow_bopd}
          pumpCapacityBopd={well.nominal_capacity_bopd}
          bottleneck={well.bottleneck}
        />
        <div className="card-light" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex-center justify-between mb-2">
            <span className="text-xs font-bold text-main font-mono">DOWNHOLE BARREL INSET</span>
            <ProvenanceBadge quantityKey="plunger_diameter_in" />
          </div>
          <div style={{ flex: 1, minHeight: '140px' }}>
            <DownholePumpInset 
              spm={spm}
              fillagePct={fillagePct}
              pumpActive={well.pump_active}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
