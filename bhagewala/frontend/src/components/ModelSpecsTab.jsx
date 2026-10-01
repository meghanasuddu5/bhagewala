import React from 'react';
import { 
  Layers, CheckCircle2, AlertTriangle, Cpu, Database, 
  FileText, BarChart3, HelpCircle, GitBranch, ArrowRight, ShieldAlert, Check
} from 'lucide-react';
import { BENCHMARK_METRICS } from '../api';

export default function ModelSpecsTab({ modelInfo }) {
  const featuresList = [
    { category: "Base Numerical (14)", features: "oil_rate_bopd, gas_rate_mcfd, water_rate_bwpd, reservoir_pressure_psia, flowing_wellhead_pressure_psia, flowing_bottomhole_pressure_psia, drawdown_psia, esp_frequency_hz, rod_pump_spm, rod_pump_fillage_pct, gas_lift_rate_mmscfd, bsw_pct, gor_scf_per_bbl, wor" },
    { category: "Lag 1 Day (14)", features: "oil_rate_bopd_lag1, gas_rate_mcfd_lag1, water_rate_bwpd_lag1, reservoir_pressure_psia_lag1, flowing_wellhead_pressure_psia_lag1, flowing_bottomhole_pressure_psia_lag1, drawdown_psia_lag1, esp_frequency_hz_lag1, rod_pump_spm_lag1, rod_pump_fillage_pct_lag1, gas_lift_rate_mmscfd_lag1, bsw_pct_lag1, gor_scf_per_bbl_lag1, wor_lag1" },
    { category: "Lag 7 Days (14)", features: "oil_rate_bopd_lag7, gas_rate_mcfd_lag7, water_rate_bwpd_lag7, reservoir_pressure_psia_lag7, flowing_wellhead_pressure_psia_lag7, flowing_bottomhole_pressure_psia_lag7, drawdown_psia_lag7, esp_frequency_hz_lag7, rod_pump_spm_lag7, rod_pump_fillage_pct_lag7, gas_lift_rate_mmscfd_lag7, bsw_pct_lag7, gor_scf_per_bbl_lag7, wor_lag7" },
    { category: "Rolling 7-Day Means (3)", features: "oil_rate_bopd_rolling7, water_rate_bwpd_rolling7, gas_rate_mcfd_rolling7" },
    { category: "Categoricals (3)", features: "well_id (UUID), field_id (UUID), well_status (e.g. PRODUCING, SHUT_IN)" },
    { category: "Calendar Time (2)", features: "day_of_week (0-6), month (1-12)" },
  ];

  return (
    <div className="specs-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner */}
      <div className="section-banner">
        <div className="banner-text">
          <div className="flex-center gap-2">
            <span className="icon-badge bg-cyan-100 text-cyan-700">
              <Layers size={20} />
            </span>
            <h2 className="section-title">Model Architecture & Benchmark Metrics</h2>
          </div>
          <p className="section-subtitle">
            Specifications, benchmark validation comparisons, and feature tensors for the V1.3 Two-Stage Hybrid model artifact.
          </p>
        </div>
        <span className="badge badge-amber font-mono">Artifact: two_stage_oil_model.joblib</span>
      </div>

      {/* Two-Stage Architectural Decision Flowchart (Industrial SVG / Card Design) */}
      <div className="card-dark" style={{ padding: '20px' }}>
        <div className="flex-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-bold text-white flex-center gap-2">
            <GitBranch size={16} className="text-amber" />
            V1.3 Two-Stage Hybrid Architectural Flowchart
          </h3>
          <span className="badge badge-amber font-mono">Decision Threshold = 0.1500</span>
        </div>

        {/* Clean Visual Architecture Diagram */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
          {/* Step 1: Input Tensor */}
          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
            <span className="badge badge-cyan font-mono text-xxs mb-1">STAGE 1: INGEST</span>
            <h4 className="text-xs font-bold text-white mb-1">50-Feature Input Vector</h4>
            <p className="text-xxs text-dim leading-relaxed">
              Base rates, 1-day lags, 7-day lags, 7-day rolling means, wellbore choke & status.
            </p>
          </div>

          <div className="flex-center justify-center text-dim">
            <ArrowRight size={20} className="text-cyan" />
          </div>

          {/* Step 2: ExtraTrees Classifier */}
          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
            <span className="badge badge-amber font-mono text-xxs mb-1">STAGE 2: CLASSIFIER</span>
            <h4 className="text-xs font-bold text-white mb-1">ExtraTrees Zero Detector</h4>
            <p className="text-xxs text-dim leading-relaxed">
              Evaluates P(Zero-Production). Predicts whether well is in shut-in or zero-inflow state.
            </p>
          </div>

          <div className="flex-center justify-center text-dim">
            <ArrowRight size={20} className="text-amber" />
          </div>

          {/* Step 3: Decision Branching */}
          <div className="stat-item" style={{ borderLeft: '3px solid var(--accent-rose)' }}>
            <span className="badge badge-rose font-mono text-xxs mb-1">STAGE 3: DECISION</span>
            <h4 className="text-xs font-bold text-white mb-1">Cutoff Evaluation</h4>
            <p className="text-xxs text-dim leading-relaxed">
              If P(Zero) &ge; 0.1500 &rarr; <span className="text-rose font-bold">Persistence Fallback</span><br />
              If P(Zero) &lt; 0.1500 &rarr; <span className="text-emerald font-bold">ExtraTrees Regressor</span>
            </p>
          </div>
        </div>
      </div>

      {/* 50-Feature Tensor Schema Breakdown */}
      <div className="card-dark" style={{ padding: '20px' }}>
        <div className="flex-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-bold text-white flex-center gap-2">
            <Database size={16} className="text-cyan" />
            Ordered 50-Feature Input Tensor Schema
          </h3>
          <span className="tag-ml font-mono">model_manifest.json Strict Ordering</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature Category</th>
                <th>Included Feature Variables</th>
              </tr>
            </thead>
            <tbody>
              {featuresList.map((f, idx) => (
                <tr key={idx}>
                  <td className="font-bold text-white" style={{ minWidth: '180px' }}>{f.category}</td>
                  <td className="font-mono text-xs text-dim" style={{ wordBreak: 'break-all' }}>{f.features}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Provenance & Limitations Notice */}
      <div className="integrity-alert-banner">
        <ShieldAlert size={20} className="text-amber flex-shrink-0" />
        <div className="integrity-alert-text">
          <strong className="text-white">Dataset Provenance & Boundary Constraints:</strong> The model was trained on Dataset ENR004 (15,699 daily production records). Key limitations include:
          <ul style={{ marginTop: '6px', marginLeft: '16px', listStyleType: 'disc' }}>
            <li>No explicit representation of thermodynamic steam condensation physics or thermal breakthrough.</li>
            <li>Zero-production classifier threshold was tuned specifically to minimize false-positive shut-ins on proxy data.</li>
            <li>Baghewala field heavy crude (14,500 cP) differs from standard conventional medium-oil training sets.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
