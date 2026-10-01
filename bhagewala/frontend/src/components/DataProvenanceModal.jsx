import React from 'react';
import { X, Database, Layers, Cpu, Compass, Flame, Droplet, ArrowRight } from 'lucide-react';
import { PROVENANCE_CLASSES, QUANTITY_REGISTRY } from '../constants/dataSourceRegistry';
import { TWIN_CONSTANTS } from '../constants/twinConstants';

export default function DataProvenanceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const classes = [
    {
      ...PROVENANCE_CLASSES.PROXY,
      details: 'Historical proxy dataset ENR004 (15,699 daily production records across 48 heavy-oil analog wells). Used for ML feature lag training.',
      replacement: 'Will be replaced by historical Baghewala well test and workover records when operator data becomes accessible.'
    },
    {
      ...PROVENANCE_CLASSES.SIMULATED,
      details: 'Deterministic first-principles coupled thermal-lift engineering physics model (Marx-Langenheim heat balance, Andrade viscosity correlation, Vogel IPR, and modified API RP 11L beam pump dynamics).',
      replacement: 'Coupled engine parameters are calibrated using physical PVT and well geometry data; can be cross-benchmarked against CMG STARS / Eclipse thermal runs.'
    },
    {
      ...PROVENANCE_CLASSES.ML,
      details: 'ExtraTrees Regressor V1.3 pipeline (50 time-lagged operational features with zero-hurdle classification at 0.1500 threshold).',
      replacement: 'Retrained on local Baghewala field telemetry once continuous SCADA logging is active.'
    },
    {
      ...PROVENANCE_CLASSES.ASSUMED,
      details: 'Published geological constants for Baghewala Jodhpur Sandstone (1,050 m TVD, 28 m net pay, 1,520 psia initial pressure, 48.0 °C native temp, 14,500 cP dead crude) and operator scenario setpoints.',
      replacement: 'Will be replaced by direct well logging (PEX/CMR), core laboratory PVT analysis, and permanent downhole gauge (PDG) readouts.'
    },
    {
      ...PROVENANCE_CLASSES.MEASURED,
      details: 'Direct real-time sensor streams from wellhead RTU, Coriolis flowmeter, or acoustic echometer. (Currently 0% measured due to lack of live field SCADA hookup).',
      replacement: 'Architecture supports direct ingestion via WITSML 1.4 / OPC-UA / MQTT industrial protocols upon field telemetry integration.'
    }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div 
        className="card-light" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          maxWidth: '740px',
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border, #cbd5e1)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          background: 'var(--surface, #ffffff)',
          color: 'var(--ink, #0f172a)'
        }}
      >
        {/* Header */}
        <div className="flex-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--border, #e2e8f0)' }}>
          <div className="flex-center gap-2">
            <span className="icon-badge bg-cyan-100 text-cyan-700" style={{ padding: '6px', borderRadius: '6px', display: 'flex' }}>
              <Database size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold flex-center gap-2" style={{ margin: 0, color: 'var(--ink, #0f172a)' }}>
                Scientific Data Provenance & Method Disclosure
              </h3>
              <span className="text-xxs font-mono" style={{ color: 'var(--ink-muted, #64748b)' }}>
                Baghewala Well BW-01 &bull; SIH26120 &bull; Honest Provenance Architecture
              </span>
            </div>
          </div>
          <button className="icon-btn hover:text-black" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted, #64748b)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Executive Summary */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          background: 'var(--surface-2, #f8fafc)',
          border: '1px solid var(--border, #e2e8f0)',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          color: 'var(--ink, #334155)',
          marginBottom: '16px'
        }}>
          <strong>Scientific Integrity Disclosure:</strong> This digital twin couples a simplified first-principles engineering model with an ExtraTrees machine-learning forecaster. Because live telemetry from the Baghewala field is proprietary and currently unmetered in real time, all quantities are strictly categorized below. No unverified claims of "Audited" or "Calibrated" field telemetry are made.
        </div>

        {/* 5 Provenance Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {classes.map((c) => (
            <div 
              key={c.code}
              style={{
                borderLeft: `4px solid ${c.color}`,
                background: 'var(--surface-2, #f8fafc)',
                padding: '12px 14px',
                borderRadius: '0 6px 6px 0',
                borderTop: '1px solid var(--border, #f1f5f9)',
                borderRight: '1px solid var(--border, #f1f5f9)',
                borderBottom: '1px solid var(--border, #f1f5f9)',
              }}
            >
              <div className="flex-center justify-between mb-1">
                <span 
                  className="font-mono text-xxs font-bold px-2 py-0.5 rounded"
                  style={{ color: c.color, background: c.bg, border: `1px solid color-mix(in srgb, ${c.color} 25%, transparent)` }}
                >
                  {c.label.toUpperCase()}
                </span>
                <span className="text-xxs font-mono" style={{ color: 'var(--ink-muted, #64748b)' }}>
                  Classification Tier: {c.code}
                </span>
              </div>
              <p className="text-xs mb-1" style={{ color: 'var(--ink, #1e293b)', margin: '4px 0' }}>
                {c.details}
              </p>
              <div className="flex items-start gap-1.5 text-xxs font-mono" style={{ color: 'var(--ink-muted, #475569)', marginTop: '4px' }}>
                <ArrowRight size={11} style={{ flexShrink: 0, marginTop: '2px', color: c.color }} />
                <span><strong>Field Roadmap:</strong> {c.replacement}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="text-xxs font-mono" style={{ color: 'var(--ink-muted, #64748b)' }}>
            Compliant with SIH 2026 Grand Finale Technical Transparency Standards.
          </span>
          <button 
            className="btn btn-primary text-xs py-1.5 px-4" 
            onClick={onClose}
            style={{ borderRadius: '6px', cursor: 'pointer' }}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
