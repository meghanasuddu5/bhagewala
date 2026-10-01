import React, { useState, useMemo, useEffect } from 'react';
import { 
  FlaskConical, TrendingUp, Sparkles, CheckCircle2, 
  Flame, Droplet, Zap, Sliders, Award, AlertCircle, ArrowUpRight, ArrowDownRight,
  Play, RotateCcw, Plus, Trash2, Clock
} from 'lucide-react';
import { TWIN_CONSTANTS } from '../constants/twinConstants';
import { formatValue, formatBOPD, formatPercent } from '../utils/formatters';
import { ProvenanceBadge } from '../constants/dataSourceRegistry';
import { DEFAULT_COUPLED_INPUTS, solveCoupledState } from '../utils/coupledEngine';

/**
 * Computes hyperbolic decline trajectory (Arps equation)
 * q(t) = q_i / (1 + b * D_i * t)^(1/b)
 * Returns array of { day, rate } and total cumulative barrels
 */
function computeHyperbolicDecline(initialRate, Di = 0.04, b = 0.65, days = 30) {
  const points = [];
  let cumOil = 0;
  const dt = 1.0;

  for (let t = 0; t <= days; t += dt) {
    const rate = initialRate / Math.pow(1.0 + b * Di * t, 1.0 / b);
    points.push({ day: t, rate });
    if (t > 0) {
      const prevRate = points[points.length - 2].rate;
      cumOil += ((prevRate + rate) / 2.0) * dt;
    }
  }

  return { points, cumOil: Math.round(cumOil), endRate: points[points.length - 1].rate };
}

export default function ScenarioLabPage({ twinState }) {
  // Scenario configurations
  const [scenarioConfigs, setScenarioConfigs] = useState([
    {
      id: 'baseline',
      name: 'Baseline Continuous Lift',
      type: 'baseline',
      color: '#0284c7', // process blue
      steamRateTPD: 0,
      spm: 2.0,
      soakDays: 0,
      waterCutPct: 2.7,
      bFactor: 0.25,
      di: 0.006, // 0.6% gentle decline
      description: 'Cold continuous rod pumping under native reservoir conditions.',
    },
    {
      id: 'css-surge',
      name: 'CSS Post-Soak Thermal Surge',
      type: 'thermal-surge',
      color: '#d97706', // amber
      steamRateTPD: 140,
      spm: 2.8,
      soakDays: 6,
      waterCutPct: 1.5,
      bFactor: 0.65,
      di: 0.038, // steep thermal flush tapering into hyperbolic tail
      description: 'Heated near-wellbore zone directly following 6-day shut-in soak at 195°C.',
      isBest: true,
    },
    {
      id: 'water-cut',
      name: 'High Water-Cut Breakthrough',
      type: 'water-cut',
      color: '#dc2626', // red
      steamRateTPD: 0,
      spm: 2.0,
      soakDays: 0,
      waterCutPct: 28.5,
      bFactor: 0.40,
      di: 0.015,
      description: 'Thermal condensate or edge-water coning causing heavy liquid head loading.',
    },
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState('css-surge');
  const [horizonDays, setHorizonDays] = useState(30);
  const [simStatus, setSimStatus] = useState('UPDATED'); // 'UPDATED' | 'RUNNING' | 'OUTDATED' | 'ERROR'
  const [lastRunTime, setLastRunTime] = useState(new Date().toLocaleTimeString());

  // Function to solve coupled state for a given scenario config
  const runScenarioEngine = (cfg) => {
    const inputs = {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: cfg.steamRateTPD,
      spm: cfg.spm,
      soak_days: cfg.soakDays,
      water_cut_pct: cfg.waterCutPct,
      pump_active: cfg.spm > 0,
      elapsed_days: cfg.soakDays + 10,
    };
    const coupled = solveCoupledState(inputs);
    const initialRate = coupled.well_and_pump.delivered_oil_rate_bopd;
    const motorKw = coupled.well_and_pump.motor_electric_kw;
    
    // Hyperbolic decline trajectory
    const { points, cumOil, endRate } = computeHyperbolicDecline(
      initialRate,
      cfg.di,
      cfg.bFactor,
      horizonDays
    );

    // Energy calculation
    const totalKwh = motorKw * 24 * horizonDays;
    const energyIntensity = cumOil > 0 ? totalKwh / cumOil : 0;

    // Steam-oil ratio
    const steamTonnes = cfg.steamRateTPD * (DEFAULT_COUPLED_INPUTS.injection_days || 10);
    const steamM3 = steamTonnes * 1.0;
    const oilM3 = cumOil / 6.2898;
    const sor = oilM3 > 0 && steamTonnes > 0 ? steamM3 / oilM3 : 0.0;

    return {
      ...cfg,
      initialRate,
      peakRate: initialRate,
      endRate,
      points,
      cumOil,
      motorKw,
      totalKwh,
      energyIntensity,
      sor,
      coupled,
    };
  };

  // Live simulation execution
  const [computedScenarios, setComputedScenarios] = useState(() => {
    return scenarioConfigs.map(runScenarioEngine);
  });

  const handleRunSimulation = () => {
    setSimStatus('RUNNING');
    setTimeout(() => {
      try {
        const results = scenarioConfigs.map(runScenarioEngine);
        setComputedScenarios(results);
        setSimStatus('UPDATED');
        setLastRunTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Simulation error:", err);
        setSimStatus('ERROR');
      }
    }, 200);
  };

  const handleParamChange = (field, val) => {
    setScenarioConfigs(prev => prev.map(s => {
      if (s.id === activeScenarioId) {
        return { ...s, [field]: parseFloat(val) || 0 };
      }
      return s;
    }));
    setSimStatus('OUTDATED');
  };

  const baseline = computedScenarios.find(s => s.id === 'baseline') || computedScenarios[0];
  const activeComputed = computedScenarios.find(s => s.id === activeScenarioId) || computedScenarios[0];
  const bestComputed = computedScenarios.find(s => s.id === 'css-surge') || computedScenarios[1] || computedScenarios[0];

  const bestDeltaBbl = bestComputed.cumOil - baseline.cumOil;
  const bestDeltaPct = baseline.cumOil > 0 ? ((bestDeltaBbl / baseline.cumOil) * 100).toFixed(1) : '0.0';

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="section-banner">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <span className="icon-badge bg-blue-100 text-blue-700">
              <FlaskConical size={20} />
            </span>
            <h2 className="section-title">Scenario Lab & Operational Multi-Curve Decline</h2>
          </div>
          <p className="section-subtitle">
            First-principles coupled thermal-lift engineering simulation: evaluate 30-day hyperbolic cumulative production, Steam-Oil Ratio (SOR), and energy draw across operating regimes.
          </p>
        </div>

        {/* Status Chip & Run Button */}
        <div className="flex-center gap-2">
          <div className={`status-chip font-mono text-xs px-2.5 py-1 rounded border flex-center gap-1.5`} style={{
            background: simStatus === 'UPDATED' ? 'rgba(5, 150, 105, 0.1)' : simStatus === 'OUTDATED' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(59, 130, 246, 0.1)',
            borderColor: simStatus === 'UPDATED' ? 'var(--ok)' : simStatus === 'OUTDATED' ? 'var(--warn)' : 'var(--accent-steam)',
            color: simStatus === 'UPDATED' ? 'var(--ok)' : simStatus === 'OUTDATED' ? 'var(--warn)' : 'var(--accent-steam)',
          }}>
            <Clock size={12} />
            <span>{simStatus === 'UPDATED' ? `Updated (${lastRunTime})` : simStatus === 'OUTDATED' ? 'Results Outdated' : 'Running Engine...'}</span>
          </div>

          <button
            id="run-simulation-btn"
            className="btn btn-primary text-xs py-1.5 px-3 flex-center gap-1.5"
            onClick={handleRunSimulation}
            disabled={simStatus === 'RUNNING'}
            style={{ fontWeight: 600 }}
          >
            <Play size={13} />
            <span>Run Simulation</span>
          </button>
        </div>
      </div>

      {/* Readable Summary Card (Replaces dark gradient banner) */}
      <div className="card-light" style={{
        padding: '16px 20px',
        borderLeft: '4px solid var(--accent-oil)',
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div className="flex items-center gap-3">
          <div className="brand-logo-circle" style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid var(--accent-oil)', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} style={{ color: 'var(--accent-oil)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ProvenanceBadge quantityKey="surface_oil_rate_bopd" />
              <span className="font-bold text-sm text-main">{bestComputed.name}</span>
            </div>
            <p className="text-xs text-muted" style={{ margin: 0 }}>
              Generates <strong style={{ color: 'var(--accent-oil)' }}>+{bestDeltaPct}% higher 30-day cumulative oil</strong> ({formatValue(bestComputed.cumOil, { precision: 0, unit: 'bbl' })} vs {formatValue(baseline.cumOil, { precision: 0, unit: 'bbl' })}) with an energy intensity of <strong style={{ color: 'var(--ink)' }}>{formatValue(bestComputed.energyIntensity, { precision: 2, unit: 'kWh/bbl' })}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-right">
          <div>
            <span className="text-xxs text-dim uppercase block">30-Day Net Gain</span>
            <span className="font-bold text-sm" style={{ color: 'var(--ok)' }}>
              +{formatValue(bestDeltaBbl, { precision: 0, unit: 'bbl' })}
            </span>
          </div>
          <div>
            <span className="text-xxs text-dim uppercase block">SOR Efficiency</span>
            <span className="font-bold text-sm" style={{ color: 'var(--accent-oil)' }}>
              {formatValue(bestComputed.sor, { precision: 2, unit: 'm³/m³' })}
            </span>
          </div>
        </div>
      </div>

      {/* Overlaid Decline Curves (30-Day Hyperbolic Multi-Curve SVG) */}
      <div className="card-light" style={{ padding: '20px' }}>
        <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 className="text-sm font-bold text-main flex-center gap-2">
              <TrendingUp size={16} className="text-cyan-600" />
              Coupled Hyperbolic Production Decline Curves ({horizonDays} Days)
            </h3>
            <span className="text-xxs text-dim">Simultaneous physics forecast comparing early thermal flush and hyperbolic tail</span>
          </div>

          <div className="flex-center gap-3">
            {computedScenarios.map(s => (
              <div key={s.id} className="flex-center gap-1.5 text-xxs font-mono">
                <span style={{ width: '12px', height: '3px', background: s.color, display: 'inline-block', borderRadius: '2px' }} />
                <span className="text-muted font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Multi-Line Chart Canvas */}
        <div style={{ width: '100%', height: '220px', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {/* Grid Lines */}
            {[40, 80, 120, 160].map(y => (
              <line key={y} x1="50" y1={y} x2="780" y2={y} stroke="var(--border)" strokeDasharray="3 3" />
            ))}

            {/* Axis Labels */}
            <text x="10" y="45" fill="var(--ink-muted)" fontSize="10" fontFamily="var(--font-mono)">800 BOPD</text>
            <text x="10" y="95" fill="var(--ink-muted)" fontSize="10" fontFamily="var(--font-mono)">600 BOPD</text>
            <text x="10" y="145" fill="var(--ink-muted)" fontSize="10" fontFamily="var(--font-mono)">300 BOPD</text>
            <text x="10" y="185" fill="var(--ink-muted)" fontSize="10" fontFamily="var(--font-mono)">0 BOPD</text>

            {/* Decline Curves */}
            {computedScenarios.map(s => {
              const maxRate = 850.0;
              const pointsStr = s.points.map(pt => {
                const x = 50 + (pt.day / horizonDays) * 730;
                const y = 185 - (pt.rate / maxRate) * 145;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');

              return (
                <polyline
                  key={s.id}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Scenario Customizer & Side-by-Side Comparison Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Customizer Slider Panel */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-center gap-2">
              <Sliders size={18} className="text-amber" />
              <h3 className="font-bold text-main text-base">Scenario Parameter Controls</h3>
            </div>
            <span className="badge badge-amber font-mono text-xxs">Configure &bull; Run &bull; Results</span>
          </div>

          {/* Active Preset Picker */}
          <div className="flex-center gap-2 mb-4">
            {scenarioConfigs.map(s => (
              <button
                key={s.id}
                className={`btn-pill text-xs py-1 px-3 ${activeScenarioId === s.id ? 'active' : ''}`}
                onClick={() => setActiveScenarioId(s.id)}
                style={{ borderColor: s.color, fontWeight: activeScenarioId === s.id ? 700 : 500 }}
              >
                {s.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Sliders for current active scenario */}
          {(() => {
            const cur = scenarioConfigs.find(s => s.id === activeScenarioId) || scenarioConfigs[0];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div className="flex-center justify-between text-xs font-semibold mb-1">
                    <span className="text-muted">Steam Injection Rate:</span>
                    <span className="font-mono font-bold text-cyan">{cur.steamRateTPD} TPD</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="220"
                    step="10"
                    value={cur.steamRateTPD}
                    onChange={(e) => handleParamChange('steamRateTPD', e.target.value)}
                    className="control-slider"
                  />
                </div>

                <div>
                  <div className="flex-center justify-between text-xs font-semibold mb-1">
                    <span className="text-muted">Pumping Speed:</span>
                    <span className="font-mono font-bold text-amber">{cur.spm} SPM</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.1"
                    value={cur.spm}
                    onChange={(e) => handleParamChange('spm', e.target.value)}
                    className="control-slider"
                  />
                </div>

                <div>
                  <div className="flex-center justify-between text-xs font-semibold mb-1">
                    <span className="text-muted">Soak Shut-In Duration:</span>
                    <span className="font-mono font-bold text-rose">{cur.soakDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="14"
                    step="1"
                    value={cur.soakDays}
                    onChange={(e) => handleParamChange('soakDays', e.target.value)}
                    className="control-slider"
                  />
                </div>

                <div>
                  <div className="flex-center justify-between text-xs font-semibold mb-1">
                    <span className="text-muted">Produced Water Cut:</span>
                    <span className="font-mono font-bold text-dim">{cur.waterCutPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={cur.waterCutPct}
                    onChange={(e) => handleParamChange('waterCutPct', e.target.value)}
                    className="control-slider"
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Live Comparison Table */}
        <div className="card-light" style={{ padding: '20px' }}>
          <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold text-main text-base">Coupled Performance Comparison</h3>
            <ProvenanceBadge quantityKey="surface_oil_rate_bopd" />
          </div>

          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Scenario</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Initial Rate</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>30-Day Cum</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>SOR</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Energy</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Delta vs Base</th>
                </tr>
              </thead>
              <tbody>
                {computedScenarios.map(sc => {
                  const delta = sc.cumOil - baseline.cumOil;
                  const deltaPct = baseline.cumOil > 0 ? ((delta / baseline.cumOil) * 100).toFixed(1) : '0.0';
                  const isPos = delta >= 0;
                  return (
                    <tr key={sc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="font-medium text-main" style={{ padding: '8px 4px' }}>
                        <span style={{ color: sc.color, fontWeight: 700 }}>&bull; </span>
                        {sc.name.split(' ')[0]}
                      </td>
                      <td className="font-mono text-main font-semibold" style={{ padding: '8px 4px' }}>
                        {formatValue(sc.initialRate, { precision: 1, unit: 'BOPD' })}
                      </td>
                      <td className="font-mono font-bold" style={{ padding: '8px 4px', color: sc.color }}>
                        {formatValue(sc.cumOil, { precision: 0, unit: 'bbl' })}
                      </td>
                      <td className="font-mono text-dim" style={{ padding: '8px 4px' }}>
                        {formatValue(sc.sor, { precision: 2 })}
                      </td>
                      <td className="font-mono text-dim" style={{ padding: '8px 4px' }}>
                        {formatValue(sc.energyIntensity, { precision: 2, unit: 'kWh/bbl' })}
                      </td>
                      <td style={{ padding: '8px 4px' }}>
                        <span className={`font-mono text-xxs font-bold px-1.5 py-0.5 rounded`} style={{
                          background: isPos ? 'rgba(5, 150, 105, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                          color: isPos ? 'var(--ok)' : 'var(--alarm)',
                        }}>
                          {isPos ? `+${deltaPct}%` : `${deltaPct}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
