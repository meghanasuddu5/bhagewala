import React from 'react';
import { Activity, Cpu, Database, RefreshCw, Layers, Sliders, TrendingUp, Radio, HelpCircle } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  health, 
  loading, 
  onRefresh,
  twinState 
}) {
  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';
  
  return (
    <header className="header-container">
      {/* Top Navbar */}
      <div className="header-top">
        <div className="brand-group">
          <div className="brand-icon-wrapper">
            <Radio className="brand-icon" size={24} />
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">BAGHEWALA WELL-TO-SURFACE</h1>
              <span className="badge badge-amber font-mono">DIGITAL TWIN v1.3</span>
            </div>
            <p className="brand-subtitle">
              Bikaner-Nagaur Basin (Rajasthan, India) &bull; Heavy Oil CSS Reservoir Asset
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="header-status-group">
          {/* Well Selection Pill */}
          <div className="status-pill">
            <span className="pill-label">Active Well:</span>
            <span className="pill-value font-mono">BW-01 (CSS/SRP)</span>
          </div>

          {/* Model Status Pill */}
          <div className="status-pill">
            <Cpu size={14} className="text-cyan" />
            <span className="pill-label">Model Engine:</span>
            <span className="pill-value font-mono">{health?.model_version || 'V1.3-Hybrid'}</span>
          </div>

          {/* Backend Health Pill */}
          <div className="status-pill">
            <span className={`status-dot ${isHealthy ? 'online' : isDegraded ? 'warning' : 'offline'}`} />
            <span className="pill-label">API Twin:</span>
            <span className="pill-value font-mono uppercase">
              {isHealthy ? 'Live Synchronized' : isDegraded ? 'Degraded' : 'Simulation Mode'}
            </span>
          </div>

          {/* Refresh Action */}
          <button 
            id="refresh-twin-btn"
            className="btn btn-secondary icon-btn" 
            onClick={onRefresh} 
            disabled={loading}
            title="Refresh Telemetry & Model State"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="header-tabs">
        <button
          id="tab-overview"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          <span>Overview & Synoptics</span>
        </button>

        <button
          id="tab-predictor"
          className={`tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictor')}
        >
          <Sliders size={16} />
          <span>V1.3 Production Predictor</span>
        </button>

        <button
          id="tab-simulator"
          className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <TrendingUp size={16} />
          <span>Operational Simulator</span>
        </button>

        <button
          id="tab-sync"
          className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          <Database size={16} />
          <span>Digital Twin Sync</span>
        </button>

        <button
          id="tab-specs"
          className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          <Layers size={16} />
          <span>Model Architecture & Metrics</span>
        </button>
      </nav>
    </header>
  );
}
