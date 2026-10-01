import React from 'react';
import { 
  Cpu, RefreshCw, Database, Sparkles, Sun, Moon
} from 'lucide-react';

export default function TopNav({ 
  health, 
  loading, 
  onRefresh, 
  selectedWell, 
  setSelectedWell,
  onStartDemo,
  onOpenProvenance,
  theme = 'light',
  onToggleTheme
}) {
  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';

  return (
    <header className="top-nav-bar card-light">
      <div className="top-nav-left flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="project-title font-bold text-sm tracking-tight whitespace-nowrap">
            Baghewala Well-to-Surface Digital Twin
          </span>
          <span className="badge badge-amber font-mono text-xxs px-1.5 py-0.5 rounded">
            SIH26120
          </span>
        </div>
      </div>

      <div className="top-nav-right flex items-center gap-2">
        {/* Data Provenance Pill Button */}
        <button
          id="data-provenance-btn"
          className="status-pill hover-highlight cursor-pointer"
          onClick={onOpenProvenance}
          title="Click to view scientific data provenance & disclosure"
          style={{ cursor: 'pointer', background: 'var(--surface-2, rgba(255,255,255,0.05))' }}
        >
          <Database size={13} className="text-cyan-600" />
          <span className="pill-label">Data:</span>
          <span className="pill-value font-mono text-cyan-600 font-semibold">
            Proxy (ENR004) + Simulation
          </span>
        </button>

        {/* Well Selector */}
        <div className="status-pill">
          <span className="pill-label">Well:</span>
          <select 
            className="top-well-select font-mono"
            value={selectedWell}
            onChange={(e) => setSelectedWell(e.target.value)}
          >
            <option value="BW-01">BW-01 (CSS-SRP)</option>
            <option value="BW-02">BW-02 (Soak)</option>
            <option value="BW-03">BW-03 (Rest)</option>
          </select>
        </div>

        {/* Model Status Pill */}
        <div className="status-pill hide-tablet">
          <Cpu size={13} className="text-cyan-600" />
          <span className="pill-label">Model:</span>
          <span className="pill-value font-mono text-xs">{health?.model_version || 'V1.3'}</span>
        </div>

        {/* Backend Connection Status */}
        <div className="status-pill">
          <span className={`status-dot ${isHealthy ? 'online' : isDegraded ? 'warning' : 'offline'}`} />
          <span className="pill-label">Backend:</span>
          <span className="pill-value font-mono text-xs uppercase">
            {isHealthy ? 'Connected' : isDegraded ? 'Degraded' : 'Simulated'}
          </span>
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          id="theme-toggle-btn"
          className="btn btn-secondary icon-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{ width: '32px', height: '32px', padding: 0 }}
        >
          {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-cyan-600" />}
        </button>

        {/* Guided Demo Button for Judges (Small Secondary Button) */}
        <button
          id="start-guided-demo-btn"
          className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
          onClick={onStartDemo}
          title="Start 60-90s Automated Judge Walkthrough"
          style={{ borderColor: 'var(--accent-amber, #f59e0b)', color: 'var(--accent-amber-text, #d97706)' }}
        >
          <Sparkles size={13} />
          <span className="font-semibold whitespace-nowrap">Guided Demo</span>
        </button>

        {/* Refresh Action */}
        <button 
          id="global-refresh-btn"
          className="btn btn-secondary icon-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Telemetry & Sync State"
          style={{ width: '32px', height: '32px', padding: 0 }}
        >
          <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
        </button>
      </div>
    </header>
  );
}
