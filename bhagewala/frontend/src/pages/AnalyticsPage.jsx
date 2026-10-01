import React from 'react';
import { 
  BarChart3, TrendingUp, CheckCircle2, AlertTriangle, 
  Database, Activity, Layers, ArrowUpRight, ShieldCheck, Scale, Cpu,
  Compass, Radio, Milestone, ArrowRight
} from 'lucide-react';
import { BENCHMARK_METRICS } from '../api';

export default function AnalyticsPage() {
  const modelComparisonData = [
    { model: 'V1.2 Two-Stage', mae: 344.8, rmse: 890.0, color: '#ef4444' },
    { model: 'Persistence Baseline', mae: 100.7, rmse: 342.5, color: '#94a3b8' },
    { model: 'V1.3 Hybrid Fallback', mae: 89.8, rmse: 266.4, color: '#10b981' },
  ];

  const historicalTrend = [
    { day: "D-6", actual: 442, predicted: 445 },
    { day: "D-5", actual: 448, predicted: 450 },
    { day: "D-4", actual: 451, predicted: 452 },
    { day: "D-3", actual: 449, predicted: 450 },
    { day: "D-2", actual: 453, predicted: 452 },
    { day: "D-1", actual: 450, predicted: 451 },
    { day: "Today", actual: 450.5, predicted: 453.9 },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="section-banner">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <span className="icon-badge bg-emerald-100 text-emerald-700">
              <BarChart3 size={20} />
            </span>
            <h2 className="section-title">Production Analytics & Model Evaluation</h2>
          </div>
          <p className="section-subtitle">
            Holdout benchmark metrics, delta over persistence baseline, and structured industrial validation roadmap.
          </p>
        </div>
        <span className="badge badge-amber font-mono text-xxs">Dataset: ENR004</span>
      </div>

      {/* Hero Delta Headline Card */}
      <div className="card-dark" style={{
        padding: '18px 24px',
        border: '1px solid var(--accent-emerald)',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 26, 46, 0.95) 100%)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div className="flex-center gap-2 mb-1">
            <span className="badge badge-emerald font-mono text-xxs font-bold">KEY BENCHMARK RESULT</span>
            <span className="text-white font-bold text-sm">V1.3 Hybrid Model Performance</span>
          </div>
          <h3 className="text-xl font-bold font-mono text-white flex-center gap-2">
            MAE 100.7 &rarr; 89.8 BOPD <span className="text-emerald text-base font-bold">(-10.9% vs Persistence Baseline)</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            The core machine learning story is the <strong>11 BOPD error reduction</strong> achieved by combining the zero-production ExtraTrees classifier with persistence fallback, outperforming naive last-day persistence.
          </p>
        </div>

        <div className="flex-center gap-4 font-mono">
          <div className="text-right">
            <span className="text-xxs text-dim uppercase block">RMSE Improvement</span>
            <span className="text-cyan font-bold text-base">342.5 &rarr; 266.4 BOPD (-22.2%)</span>
          </div>
          <div className="text-right">
            <span className="text-xxs text-dim uppercase block">Positive Flow R²</span>
            <span className="text-emerald font-bold text-base">0.9887</span>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart of MAE & RMSE by Model */}
      <div className="card-dark" style={{ padding: '20px' }}>
        <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="text-sm font-bold text-white flex-center gap-2">
              <BarChart3 size={16} className="text-cyan" />
              Benchmark Error Comparison by Model Architecture (Holdout Test Set)
            </h3>
            <span className="text-xxs text-dim">Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) across 15,699 evaluation rows</span>
          </div>
          <div className="flex-center gap-3 text-xxs font-mono">
            <span className="flex-center gap-1"><span style={{ width: '10px', height: '10px', background: '#38bdf8', display: 'inline-block', borderRadius: '2px' }} /> MAE (BOPD)</span>
            <span className="flex-center gap-1"><span style={{ width: '10px', height: '10px', background: '#f59e0b', display: 'inline-block', borderRadius: '2px' }} /> RMSE (BOPD)</span>
          </div>
        </div>

        {/* SVG Grouped Bar Chart */}
        <div style={{ width: '100%', height: '180px', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 700 160" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {/* Grid horizontal lines */}
            {[30, 70, 110, 140].map(y => (
              <line key={y} x1="40" y1={y} x2="680" y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
            ))}
            <text x="5" y="34" fill="var(--text-dim)" fontSize="10" fontFamily="var(--font-mono)">900</text>
            <text x="5" y="74" fill="var(--text-dim)" fontSize="10" fontFamily="var(--font-mono)">500</text>
            <text x="5" y="114" fill="var(--text-dim)" fontSize="10" fontFamily="var(--font-mono)">200</text>
            <text x="5" y="144" fill="var(--text-dim)" fontSize="10" fontFamily="var(--font-mono)">0</text>

            {modelComparisonData.map((d, i) => {
              const xBase = 90 + i * 210;
              const maxVal = 950;
              const maeHeight = (d.mae / maxVal) * 110;
              const rmseHeight = (d.rmse / maxVal) * 110;
              const maeY = 140 - maeHeight;
              const rmseY = 140 - rmseHeight;

              return (
                <g key={i}>
                  {/* MAE Bar */}
                  <rect x={xBase} y={maeY} width="36" height={maeHeight} fill="#38bdf8" rx="3" />
                  <text x={xBase + 18} y={maeY - 5} fill="#38bdf8" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
                    {d.mae}
                  </text>

                  {/* RMSE Bar */}
                  <rect x={xBase + 42} y={rmseY} width="36" height={rmseHeight} fill="#f59e0b" rx="3" />
                  <text x={xBase + 60} y={rmseY - 5} fill="#f59e0b" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
                    {d.rmse}
                  </text>

                  {/* Label */}
                  <text x={xBase + 39} y="156" fill="var(--text-main)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">
                    {d.model}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Progression Timeline: V1.2 to V1.3 */}
      <div className="card-dark" style={{ padding: '20px' }}>
        <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-bold text-white flex-center gap-2">
            <Milestone size={16} className="text-amber" />
            Model Evolution Timeline: V1.2 &rarr; V1.3
          </h3>
          <span className="badge badge-amber font-mono text-xxs">Engineering Iteration</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-rose)' }}>
            <span className="badge badge-rose font-mono text-xxs mb-1">V1.2 TWO-STAGE BASE</span>
            <h4 className="text-xs font-bold text-white mb-1">Raw Regression Unclamped</h4>
            <p className="text-xxs text-dim leading-relaxed mb-2">
              Unconstrained ExtraTrees regressor on shut-in and workover periods produced large spurious out-of-distribution spikes (MAE 344.8 BOPD, RMSE 890.0 BOPD).
            </p>
            <span className="text-xxs font-mono text-rose">Flaw: Hallucinates flow during well shut-in</span>
          </div>

          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
            <span className="badge badge-amber font-mono text-xxs mb-1">BASELINE BENCHMARK</span>
            <h4 className="text-xs font-bold text-white mb-1">Naive Persistence (q_t = q_t-1)</h4>
            <p className="text-xxs text-dim leading-relaxed mb-2">
              Simply carrying forward previous day production achieved MAE 100.7 BOPD due to high operational auto-correlation, proving that raw V1.2 was underperforming baseline.
            </p>
            <span className="text-xxs font-mono text-amber">Benchmark: Strong autoregressive baseline</span>
          </div>

          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-emerald)' }}>
            <span className="badge badge-emerald font-mono text-xxs mb-1">V1.3 HYBRID PRODUCTION</span>
            <h4 className="text-xs font-bold text-white mb-1">Zero Classifier + Fallback Clamping</h4>
            <p className="text-xxs text-dim leading-relaxed mb-2">
              If zero-probability exceeds 0.1500 cutoff, persistence fallback locks rate. In active flow, regressor predicts with high fidelity, cutting MAE to 89.8 BOPD (-11%).
            </p>
            <span className="text-xxs font-mono text-emerald">Result: Superior to persistence baseline</span>
          </div>
        </div>
      </div>

      {/* Path to Field Deployment Card (Roadmap, Not an Apology) */}
      <div className="card-dark" style={{
        padding: '20px',
        border: '1px solid var(--border-metallic)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex-center gap-2">
            <span className="icon-badge bg-cyan-100 text-cyan-700">
              <Compass size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex-center gap-2">
                Path to Field Deployment & Production Calibration
              </h3>
              <span className="text-xxs font-mono text-dim">
                4-Phase Engineering Roadmap to transition from ENR004 proxy to live Baghewala SCADA deployment
              </span>
            </div>
          </div>
          <span className="badge badge-cyan font-mono text-xxs">Deployment Roadmap</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
            <span className="badge badge-cyan font-mono text-xxs mb-1">PHASE 1</span>
            <h4 className="text-xs font-bold text-white mb-1">Baghewala SCADA Ingestion</h4>
            <p className="text-xxs text-dim leading-relaxed">
              Connect real-time WITSML / OPC-UA streaming telemetry from wellhead pressure transmitters, motor VFD, and test separator flowmeters.
            </p>
          </div>

          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
            <span className="badge badge-amber font-mono text-xxs mb-1">PHASE 2</span>
            <h4 className="text-xs font-bold text-white mb-1">Subsurface Recalibration</h4>
            <p className="text-xxs text-dim leading-relaxed">
              Fine-tune the Andrade viscosity parameters using actual Baghewala core PVT analyses and permanent downhole pressure-temperature (PDG) gauges.
            </p>
          </div>

          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-emerald)' }}>
            <span className="badge badge-emerald font-mono text-xxs mb-1">PHASE 3</span>
            <h4 className="text-xs font-bold text-white mb-1">Uncertainty Quantification</h4>
            <p className="text-xxs text-dim leading-relaxed">
              Incorporate conformal prediction or quantile regression forests to provide certified 95% Bayesian confidence bounds for operational safety.
            </p>
          </div>

          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-purple)' }}>
            <span className="badge badge-purple font-mono text-xxs mb-1">PHASE 4</span>
            <h4 className="text-xs font-bold text-white mb-1">Closed-Loop Optimization</h4>
            <p className="text-xxs text-dim leading-relaxed">
              Couple AI forecasts with surface boiler throttle and rod pump VFD controllers for autonomous Cyclic Steam Stimulation cycle management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
