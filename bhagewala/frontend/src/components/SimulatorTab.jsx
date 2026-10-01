import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Play, AlertTriangle, Calendar, Layers, 
  CheckCircle2, Clock, ShieldAlert, Sparkles, HelpCircle,
  Flame, Droplet, Thermometer, Eye, RefreshCw
} from 'lucide-react';
import { runSimulation, fetchScenarios } from '../api';
import SimulationStageVisualizer from './SimulationStageVisualizer';
import TwinEngineerInsight from './TwinEngineerInsight';

export default function SimulatorTab({ twinState }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('scenario-baseline-prod');
  const [horizonDays, setHorizonDays] = useState(7);
  const [currentRate, setCurrentRate] = useState(450.5);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadScenarios() {
      const data = await fetchScenarios();
      if (data && data.scenarios) {
        setScenarios(data.scenarios);
      }
    }
    loadScenarios();
  }, []);

  const handleScenarioChange = (e) => {
    const id = e.target.value;
    setSelectedScenarioId(id);
    const sc = scenarios.find(s => s.scenario_id === id);
    if (sc && sc.parameters && sc.parameters.current_oil_rate_bopd !== undefined) {
      setCurrentRate(sc.parameters.current_oil_rate_bopd);
    }
  };

  const handleExecuteSimulation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        scenario_id: selectedScenarioId,
        horizon_days: parseInt(horizonDays),
        current_oil_rate_bopd: parseFloat(currentRate) || 450.5,
      };
      const res = await runSimulation(payload);
      setSimulationResult(res);
      setHoveredDay(res.daily_projections?.[0] || null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to execute multi-day operational simulation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!simulationResult) {
      handleExecuteSimulation();
    }
  }, []);

  // SVG Chart Calculation
  const projections = simulationResult?.daily_projections || [];
  const maxRate = Math.max(100, ...projections.map(p => p.predicted_oil_rate_bopd * 1.25));
  const minRate = 0;
  const chartWidth = 740;
  const chartHeight = 240;
  const paddingX = 50;
  const paddingY = 30;

  const getCoordinates = (day, rate) => {
    const totalDays = projections.length || 7;
    const x = paddingX + ((day - 1) / Math.max(1, totalDays - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (rate / (maxRate || 1)) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  let linePath = "";
  let areaPath = "";
  if (projections.length > 0) {
    const points = projections.map(p => getCoordinates(p.day, p.predicted_oil_rate_bopd));
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  return (
    <div className="simulator-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 6-Stage Process Sequence */}
      <SimulationStageVisualizer currentOilRate={currentRate} />

      {/* AI Engineer Character Insight */}
      <TwinEngineerInsight 
        isSimulation={true} 
        horizonDays={horizonDays} 
        currentOilRate={currentRate}
      />

      {/* Simulator Control Toolbar */}
      <div className="card-dark" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label className="text-xxs font-mono uppercase text-dim block mb-1">Operational Scenario</label>
            <select 
              id="scenario-select"
              className="control-input font-mono text-xs" 
              value={selectedScenarioId} 
              onChange={handleScenarioChange}
              style={{ minWidth: '240px' }}
            >
              {scenarios.map(s => (
                <option key={s.scenario_id} value={s.scenario_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xxs font-mono uppercase text-dim block mb-1">Forecast Horizon</label>
            <div className="flex-center gap-1">
              {[7, 14, 21, 30].map(h => (
                <button
                  key={h}
                  className={`btn-pill ${horizonDays === h ? 'active' : ''}`}
                  onClick={() => setHorizonDays(h)}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xxs font-mono uppercase text-dim block mb-1">Baseline Oil Rate (BOPD)</label>
            <input
              id="input-sim-baseline-rate"
              type="number"
              className="control-input font-mono text-xs"
              value={currentRate}
              onChange={(e) => setCurrentRate(parseFloat(e.target.value) || 0)}
              style={{ width: '120px' }}
            />
          </div>
        </div>

        <button 
          id="run-simulation-btn"
          className="btn btn-primary"
          onClick={handleExecuteSimulation}
          disabled={loading}
          style={{ minWidth: '160px' }}
        >
          {loading ? <RefreshCw size={14} className="spin-icon" /> : <Play size={14} />}
          <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Interactive Decline Curve Chart */}
      <div className="card-dark" style={{ padding: '20px' }}>
        <div className="flex-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="text-sm font-bold text-white flex-center gap-2">
              <TrendingUp size={16} className="text-cyan" />
              Production Forecast & Multi-Day Operational Decline Curve
            </h3>
            <span className="text-dim text-xs font-mono">
              Horizon: {horizonDays} Days &bull; Simulation ID: {simulationResult?.simulation_id || 'sim-init'}
            </span>
          </div>

          <div className="flex-center gap-3 text-xs font-mono">
            <div className="flex-center gap-1.5">
              <span className="status-dot" style={{ background: 'var(--accent-amber)' }} />
              <span className="text-white">Day 1: Verified V1.3 ML Inference</span>
            </div>
            <div className="flex-center gap-1.5">
              <span className="status-dot" style={{ background: 'var(--accent-cyan)' }} />
              <span className="text-dim">Days 2+: Illustrative Operational Proxy</span>
            </div>
          </div>
        </div>

        {/* SVG Chart Display */}
        <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <svg style={{ width: '100%', minWidth: '600px', height: '240px' }} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="areaGradientDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
              const y = chartHeight - paddingY - frac * (chartHeight - paddingY * 2);
              const labelVal = Math.round(minRate + frac * (maxRate - minRate));
              return (
                <g key={i}>
                  <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#1e2d4a" strokeDasharray="3 3" />
                  <text x={paddingX - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#areaGradientDark)" />}

            {/* Line Path */}
            {linePath && <path d={linePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />}

            {/* Data Points */}
            {projections.map((p) => {
              const { x, y } = getCoordinates(p.day, p.predicted_oil_rate_bopd);
              const isDay1 = p.day === 1;
              const isHovered = hoveredDay?.day === p.day;
              return (
                <g 
                  key={p.day}
                  onMouseEnter={() => setHoveredDay(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isHovered ? 7 : (isDay1 ? 6 : 4)} 
                    fill={isDay1 ? "#f59e0b" : "#06b6d4"} 
                    stroke="#080d1a" 
                    strokeWidth="2" 
                  />
                  {/* Day Label on X Axis */}
                  <text x={x} y={chartHeight - 8} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">
                    D{p.day}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hovered Day Inspector Detail Card */}
        {hoveredDay && (
          <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="flex-center gap-2 mb-1">
                <span className="text-xs font-bold text-white">Day {hoveredDay.day} Projected Rate:</span>
                <span className="font-mono font-bold text-amber text-base">{hoveredDay.predicted_oil_rate_bopd.toFixed(1)} BOPD</span>
                <span className={`badge ${hoveredDay.is_ml_derived ? 'badge-amber' : 'badge-blue'} font-mono text-xxs`}>
                  {hoveredDay.is_ml_derived ? 'V1.3 Two-Stage ML' : 'Illustrative Decline Proxy'}
                </span>
              </div>
              <span className="text-xs text-dim">{hoveredDay.notes}</span>
            </div>
            <span className="text-xs font-mono text-dim">Date: {hoveredDay.date}</span>
          </div>
        )}

        {/* Scientific Limitations & Provenance Disclosure */}
        <div className="integrity-alert-banner mt-3">
          <ShieldAlert size={16} className="text-amber flex-shrink-0" />
          <div className="integrity-alert-text">
            <strong>Simulation Architecture Safeguard:</strong> Day 1 is generated by the ML pipeline. Projections for Days 2 to {horizonDays} use simplified operational decline trend proxies. Thermal breakthrough, reservoir depletion, and multiphase Darcy dynamics are NOT solved numerically by this model.
          </div>
        </div>
      </div>
    </div>
  );
}
