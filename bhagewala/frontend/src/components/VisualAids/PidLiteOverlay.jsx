import React from 'react';
import { X, Flame, Droplet, Gauge, ArrowRight } from 'lucide-react';

/**
 * Visual Aid D10: P&ID-Lite Overlay
 * Industrial Piping and Instrumentation Diagram (P&ID) schematic:
 * OTSG Steam Generator -> Steam Header -> Wellhead (Valve V-1) -> Reservoir -> Downhole Pump -> Flowline -> Separator V-101 -> API 650 Tank
 * With live flow arrows, valve states, and pressure/temperature tags.
 */
export default function PidLiteOverlay({
  isOpen = false,
  onClose,
  state,
  isInjecting = false,
  isProducing = true
}) {
  if (!isOpen) return null;

  const steamT = state?.steam?.temperature_c || 282.0;
  const steamP = state?.steam?.pressure_bar || 68.0;
  const oilRate = state?.well_and_pump?.delivered_oil_rate_bopd || 450.5;
  const waterRate = state?.well_and_pump?.water_rate_bwpd || 12.5;
  const gasRate = 620.0;
  const pwf = state?.reservoir?.flowing_bottomhole_pressure_psia || 1120.0;
  const spm = state?.well_and_pump?.spm || 2.0;
  const tankLvl = state?.surface?.tank_level_pct || 65.0;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(238, 241, 244, 0.94)',
      backdropFilter: 'blur(8px)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-amber font-mono text-xs">P&ID SCHEMATIC</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Well BW-01 Process Flow Diagram & Instrumentation Loop
          </h3>
          <span className="badge badge-emerald font-mono text-xxs">Live Telemetry Synchronized</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}
        >
          <X size={14} /> Close Schematic
        </button>
      </div>

      {/* Main SVG Flow Diagram */}
      <div style={{ flex: 1, minHeight: '380px', background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '20px', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
        <svg width="100%" height="100%" viewBox="0 0 950 360" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#0b7bc1" />
            </marker>
            <marker id="oilArrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#ff6a13" />
            </marker>
          </defs>

          {/* Unit 1: OTSG Steam Generator */}
          <rect x="30" y="50" width="130" height="90" fill="#f8fafc" stroke="#0b7bc1" strokeWidth="2" rx="4" />
          <text x="95" y="75" fill="#0b7bc1" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">OTSG-50 BOILER</text>
          <text x="95" y="95" fill="#1b2530" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">50 MMBTU/hr</text>
          <text x="95" y="115" fill="#5b6773" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">
            {isInjecting ? 'STATUS: FIRING' : 'STATUS: STANDBY'}
          </text>
          {/* Boiler Stack */}
          <rect x="75" y="15" width="20" height="35" fill="#e2e6eb" stroke="#5b6773" />
          <circle cx="85" cy="10" r="4" fill="#0b7bc1" opacity={isInjecting ? "0.6" : "0.1"} />

          {/* Steam Header Pipe with Expansion Loop */}
          <path
            d="M 160 95 L 210 95 L 210 65 L 240 65 L 240 95 L 320 95"
            fill="none"
            stroke="#0b7bc1"
            strokeWidth="3.5"
            markerEnd="url(#arrowHead)"
          />
          {/* Tag: TI-101 (Temperature Indicator) & PI-101 (Pressure Indicator) */}
          <circle cx="275" cy="75" r="14" fill="#ffffff" stroke="#0b7bc1" strokeWidth="1.5" />
          <text x="275" y="73" fill="#0b7bc1" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">TI/PI</text>
          <text x="275" y="82" fill="#1b2530" fontSize="6" fontFamily="var(--font-mono)" textAnchor="middle">{steamT}°C</text>

          {/* Steam Injection Control Valve (V-101) */}
          <polygon points="320,88 335,95 320,102" fill={isInjecting ? "#2a9d8f" : "#d64545"} stroke="#1b2530" />
          <polygon points="350,88 335,95 350,102" fill={isInjecting ? "#2a9d8f" : "#d64545"} stroke="#1b2530" />
          <text x="335" y="82" fill="#5b6773" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">
            XV-01: {isInjecting ? 'OPEN' : 'CLOSED'}
          </text>

          {/* Connection into Wellhead Christmas Tree */}
          <path d="M 350 95 L 400 95 L 400 120" fill="none" stroke="#0b7bc1" strokeWidth="3" />

          {/* Unit 2: Wellhead Christmas Tree & Surface Pump */}
          <rect x="370" y="120" width="60" height="90" fill="#ffffff" stroke="#1b2530" strokeWidth="2" rx="3" />
          <text x="400" y="145" fill="#1b2530" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">WELLHEAD</text>
          <text x="400" y="160" fill="#5b6773" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="middle">BW-01 (CSS)</text>
          <text x="400" y="180" fill="var(--accent-orange)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
            {spm} SPM
          </text>
          <text x="400" y="195" fill="#2a9d8f" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">
            {isProducing ? 'SRP RUNNING' : 'PUMP STOP'}
          </text>

          {/* Underground Wellbore & Reservoir Box */}
          <path d="M 400 210 L 400 280" fill="none" stroke="#5b6773" strokeWidth="4" />
          <rect x="330" y="280" width="140" height="60" fill="#fff3ec" stroke="#ff6a13" strokeWidth="2" rx="4" />
          <text x="400" y="300" fill="#d95300" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">JODHPUR SST</text>
          <text x="400" y="315" fill="#1b2530" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="middle">1,050m TVD &bull; 18m Pay</text>
          <text x="400" y="330" fill="#5b6773" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">
            Pwf: {pwf} psia &bull; Inflow: {oilRate} BOPD
          </text>

          {/* Upward Production Flowline from Wellhead */}
          <path
            d="M 430 165 L 560 165"
            fill="none"
            stroke="#ff6a13"
            strokeWidth="3.5"
            markerEnd="url(#oilArrowHead)"
          />
          {/* Production Choke / Header Tag */}
          <circle cx="495" cy="148" r="14" fill="#ffffff" stroke="#ff6a13" strokeWidth="1.5" />
          <text x="495" y="146" fill="#ff6a13" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">FI-201</text>
          <text x="495" y="155" fill="#1b2530" fontSize="6" fontFamily="var(--font-mono)" textAnchor="middle">{oilRate} BPD</text>

          {/* Production Valve (V-201) */}
          <polygon points="520,158 535,165 520,172" fill={isProducing ? "#2a9d8f" : "#d64545"} stroke="#1b2530" />
          <polygon points="550,158 535,165 550,172" fill={isProducing ? "#2a9d8f" : "#d64545"} stroke="#1b2530" />
          <text x="535" y="152" fill="#5b6773" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">
            V-02: {isProducing ? 'OPEN' : 'CLOSED'}
          </text>

          {/* Unit 3: 3-Phase Test Separator V-101 */}
          <rect x="560" y="125" width="130" height="80" rx="20" fill="#f8fafc" stroke="#1b2530" strokeWidth="2" />
          <text x="625" y="150" fill="#1b2530" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">SEPARATOR V-101</text>
          <text x="625" y="165" fill="#5b6773" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="middle">Horizontal 3-Phase</text>
          <text x="625" y="180" fill="#5b6773" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">P = 65 psia</text>

          {/* Separator Gas Outlet (Top) */}
          <path d="M 625 125 L 625 90 L 710 90" fill="none" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#arrowHead)" />
          <text x="715" y="93" fill="#7c3aed" fontSize="7.5" fontFamily="var(--font-mono)">GAS ({gasRate} MCFD)</text>

          {/* Separator Water Outlet (Bottom) */}
          <path d="M 625 205 L 625 240 L 710 240" fill="none" stroke="#0b7bc1" strokeWidth="2" markerEnd="url(#arrowHead)" />
          <text x="715" y="243" fill="#0b7bc1" fontSize="7.5" fontFamily="var(--font-mono)">WATER ({waterRate} BWPD)</text>

          {/* Separator Clean Heavy Oil Outlet (Center right to storage tanks) */}
          <path d="M 690 165 L 780 165" fill="none" stroke="#ff6a13" strokeWidth="3.5" markerEnd="url(#oilArrowHead)" />

          {/* Unit 4: Storage Tanks API 650 (TK-101 & TK-102) */}
          <rect x="780" y="115" width="110" height="110" fill="#ffffff" stroke="#1b2530" strokeWidth="2" rx="3" />
          {/* Cone roof */}
          <polygon points="780,115 835,95 890,115" fill="#f0f3f6" stroke="#1b2530" strokeWidth="1.5" />
          {/* Oil level in tank */}
          <rect x="782" y={223 - (tankLvl / 100) * 105} width="106" height={(tankLvl / 100) * 105} fill="#ff6a13" opacity="0.45" />
          <text x="835" y="145" fill="#1b2530" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">API 650 TANKS</text>
          <text x="835" y="165" fill="#d95300" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
            LEVEL: {tankLvl}%
          </text>
          <text x="835" y="185" fill="#5b6773" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">
            Cum: {state?.surface?.cumulative_oil_bbl?.toLocaleString() || 12600} bbl
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', marginTop: '10px', color: 'var(--text-dim)' }}>
        <span>P&ID Loop 100 (Thermal Steam Injection) &bull; Loop 200 (Artificial SRP Rod Lift) &bull; Loop 300 (3-Phase Separation)</span>
        <span style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>Single Coupled State Synchronized</span>
      </div>
    </div>
  );
}
