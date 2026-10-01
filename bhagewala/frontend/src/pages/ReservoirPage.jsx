import React, { useState } from 'react';
import { 
  Compass, Thermometer, Layers, Activity
} from 'lucide-react';
import { TWIN_CONSTANTS } from '../constants/twinConstants';
import { formatValue, formatTemp, formatViscosity, formatPercent } from '../utils/formatters';
import { ProvenanceBadge } from '../constants/dataSourceRegistry';
import ViscosityTempCurve from '../components/VisualAids/ViscosityTempCurve';
import RadialTempProfile from '../components/VisualAids/RadialTempProfile';

export default function ReservoirPage({ twinState }) {
  const reservoir = twinState?.reservoir || {};
  const [testTemp, setTestTemp] = useState(48.0); // Temperature slider

  // Single-source Andrade viscosity correlation at 48°C reference:
  // mu(T) = 14500 * exp(-0.02776 * (T - 48))
  // At 48°C = 14,500 cP; at 195°C = ~245 cP (-98.3%)
  const calculateViscosity = (tempC) => {
    const v = 14500 * Math.exp(-0.02776 * (tempC - 48));
    return Math.max(80, Math.round(v));
  };

  const calculatedViscosity = calculateViscosity(testTemp);
  const viscosityDropPct = (((14500 - calculatedViscosity) / 14500) * 100).toFixed(1);
  const mobilityRatio = (14500 / Math.max(1, calculatedViscosity)).toFixed(1);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="section-banner">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <span className="icon-badge bg-emerald-100 text-emerald-700">
              <Compass size={20} />
            </span>
            <h2 className="section-title">Reservoir Subsurface Digital Twin</h2>
          </div>
          <p className="section-subtitle">
            Subsurface geology, anticlinal trapping mechanism, heavy-oil rock fluid properties, and thermal viscosity behavior for Baghewala Field.
          </p>
        </div>
        <ProvenanceBadge quantityKey="native_viscosity_cp" />
      </div>

      {/* Top 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left: Interactive Viscosity-Temperature Sensitivity Lab */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <span className="icon-badge bg-rose-100 text-rose-700">
                <Thermometer size={18} />
              </span>
              <h3 className="font-bold text-main text-base">Thermal Viscosity Reduction Lab</h3>
            </div>
            <ProvenanceBadge quantityKey="effective_viscosity_cp" />
          </div>

          <p className="text-xs text-dim mb-3">
            Simulate near-wellbore thermal stimulation. Adjust formation temperature to evaluate viscosity collapse from native tar to mobile fluid.
          </p>

          {/* Temperature Slider */}
          <div style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="flex-center justify-between text-xs font-semibold mb-2">
              <span className="text-muted">Simulated Formation Temp:</span>
              <span className="font-mono text-rose text-sm font-bold">{formatTemp(testTemp, 1)}</span>
            </div>
            <input 
              type="range"
              min="48"
              max="240"
              step="1"
              value={testTemp}
              onChange={(e) => setTestTemp(parseFloat(e.target.value))}
              className="control-slider"
            />
            <div className="flex-center justify-between text-xxs font-mono text-dim mt-1">
              <span>48°C (Native Reservoir)</span>
              <span>100°C</span>
              <span>180°C</span>
              <span>240°C (Max Thermal)</span>
            </div>
          </div>

          {/* Dynamic Result Readout */}
          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="stat-item">
              <span className="stat-label">Dynamic Heavy Oil Viscosity</span>
              <div className="stat-val font-mono" style={{ color: 'var(--accent-amber)', fontSize: '1.3rem' }}>
                {formatViscosity(calculatedViscosity, 0)}
              </div>
              <span className="text-dim text-xxs">Native: 14,500 cP @ 48°C</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Viscosity Collapse</span>
              <div className="stat-val font-mono" style={{ color: 'var(--ok)', fontSize: '1.3rem' }}>
                -{viscosityDropPct}%
              </div>
              <span className="text-dim text-xxs">Effective Darcy Mobility x{mobilityRatio}</span>
            </div>
          </div>
        </div>

        {/* Right: Subsurface Reservoir Characteristics */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <span className="icon-badge bg-emerald-100 text-emerald-700">
                <Layers size={18} />
              </span>
              <h3 className="font-bold text-main text-base">Jodhpur Sandstone Geological Properties</h3>
            </div>
            <ProvenanceBadge quantityKey="top_depth_m" />
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Target Formation</td>
                  <td className="font-mono text-amber font-semibold" style={{ padding: '8px 4px' }}>Jodhpur Sandstone (Lower Cambrian)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Caprock Seal Barrier</td>
                  <td className="font-mono text-dim" style={{ padding: '8px 4px' }}>Bilara Dolomite & Impermeable Shales</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Reservoir Top Depth</td>
                  <td className="font-mono text-main" style={{ padding: '8px 4px' }}>{formatValue(reservoir.reservoir_depth_m || 1050, { precision: 0, unit: 'm TVD' })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Net Pay Thickness</td>
                  <td className="font-mono font-bold text-cyan" style={{ padding: '8px 4px' }}>{formatValue(reservoir.reservoir_thickness_m || 28.0, { precision: 1, unit: 'm' })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Initial Reservoir Pressure</td>
                  <td className="font-mono font-bold text-emerald" style={{ padding: '8px 4px' }}>{formatValue(reservoir.reservoir_pressure_psia || 1520, { precision: 0, unit: 'psia' })}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Reference Reservoir Temp</td>
                  <td className="font-mono text-main" style={{ padding: '8px 4px' }}>48.0 °C (SSOT Reference)</td>
                </tr>
                <tr>
                  <td className="font-medium text-main" style={{ padding: '8px 4px' }}>Dead Crude Viscosity @ Ref</td>
                  <td className="font-mono font-bold text-amber" style={{ padding: '8px 4px' }}>14,500 cP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Live Visual Aids: Viscosity Curve & Radial Temp Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <ViscosityTempCurve currentTempC={testTemp} currentViscosityCp={calculatedViscosity} />
        <RadialTempProfile steamTempC={282} heatedRadiusM={18.5} nativeTempC={48.0} />
      </div>
    </div>
  );
}
