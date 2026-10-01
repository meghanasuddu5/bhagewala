import React from 'react';

/**
 * Visual Aid D5: IPR vs Pump Capacity Curve
 * Displays Vogel Inflow Performance Relationship (IPR) alongside Sucker Rod Pump capacity line.
 * Features moving operating point dot (Pwf, q) showing whether the well or the pump is the bottleneck.
 */
export default function IprPumpCurve({ 
  resPressurePsia = 3740.0, 
  flowingPwfPsia = 1120.0, 
  flowingRateBopd = 450.5, 
  qMaxBopd = 620.0, 
  pumpCapacityBopd = 450.5, 
  bottleneck = "PUMP_CAPACITY_LIMITED" 
}) {
  const width = 240;
  const height = 140;

  // IPR Vogel Curve: Pwf on Y-axis (0 to Pr), q on X-axis (0 to qMax)
  // q / qMax = 1 - 0.2*(Pwf/Pr) - 0.8*(Pwf/Pr)^2
  const maxQ = Math.max(qMaxBopd * 1.15, pumpCapacityBopd * 1.15, 700.0);
  const maxP = resPressurePsia * 1.05;

  const getX = (q) => 30 + (q / maxQ) * 190;
  const getY = (p) => 120 - (p / maxP) * 100;

  // Compute Vogel curve points
  const vogelPoints = [];
  for (let step = 0; step <= 20; step++) {
    const p = (step / 20.0) * resPressurePsia;
    const ratio = p / resPressurePsia;
    const q = qMaxBopd * (1.0 - 0.2 * ratio - 0.8 * ratio * ratio);
    vogelPoints.push({ q, p });
  }
  // Sort by Q increasing (P decreasing from Pr to 0)
  vogelPoints.sort((a, b) => a.q - b.q);
  const iprPathD = vogelPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.q).toFixed(1)} ${getY(pt.p).toFixed(1)}`).join(' ');

  // Pump capacity line (vertical or near-vertical line at pumpCapacityBopd)
  const pumpX = getX(pumpCapacityBopd);

  // Current operating point
  const opX = getX(flowingRateBopd);
  const opY = getY(flowingPwfPsia);

  const isPumpLimited = bottleneck === "PUMP_CAPACITY_LIMITED";

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            IPR vs Pump Curve
          </span>
          <span className={`badge ${isPumpLimited ? 'badge-cyan' : 'badge-amber'} font-mono text-xxs`}>
            {isPumpLimited ? 'Pump Limited' : 'Inflow Limited'}
          </span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {flowingRateBopd} BOPD @ {flowingPwfPsia} psia
        </span>
      </div>

      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          <line x1="30" y1="20" x2="225" y2="20" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="30" y1="70" x2="225" y2="70" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="30" y1="120" x2="225" y2="120" stroke="var(--border-subtle)" />
          <line x1="30" y1="20" x2="30" y2="120" stroke="var(--border-subtle)" />

          {/* Axes labels */}
          <text x="5" y="24" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">{Math.round(resPressurePsia)}p</text>
          <text x="5" y="74" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">Pwf</text>
          <text x="15" y="123" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">0</text>
          <text x="210" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">{Math.round(maxQ)}</text>

          {/* Vogel IPR Curve (Process Blue) */}
          <path d={iprPathD} fill="none" stroke="var(--accent-blue)" strokeWidth="2.0" />

          {/* Sucker Rod Pump Capacity Line (Dashed Orange) */}
          <line
            x1={pumpX}
            y1="20"
            x2={pumpX}
            y2="120"
            stroke="var(--accent-orange)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Operating Point Moving Dot */}
          <circle cx={opX} cy={opY} r="5" fill="#2a9d8f" stroke="#ffffff" strokeWidth="1.5" />
          {/* Pulsing ring */}
          <circle cx={opX} cy={opY} r="9" fill="none" stroke="#2a9d8f" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', background: 'var(--accent-blue)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-dim)' }}>Vogel IPR (q_max: {Math.round(qMaxBopd)})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', background: 'var(--accent-orange)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-dim)' }}>Pump Cap ({Math.round(pumpCapacityBopd)})</span>
        </div>
      </div>
    </div>
  );
}
