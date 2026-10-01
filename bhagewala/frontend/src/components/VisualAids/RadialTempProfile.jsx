import React from 'react';

/**
 * Visual Aid D7: Radial Temperature Profile
 * T vs distance from wellbore (0 to 60m), current vs baseline, with heated radius (r_h) clearly marked.
 */
export default function RadialTempProfile({
  tSteam = 282.0,
  tRes = 48.0,
  heatedRadiusM = 18.5,
  baselineRadiusM = 18.5
}) {
  const width = 240;
  const height = 140;

  const maxR = 50.0;
  const maxT = 300.0;

  const getX = (r) => 30 + (r / maxR) * 190;
  const getY = (t) => 120 - ((t - 20.0) / (maxT - 20.0)) * 100;

  // Compute Current T(r) curve
  const currentPoints = [];
  const baselinePoints = [];

  for (let r = 0; r <= maxR; r += 1.5) {
    // Current curve
    const decayCur = r / Math.max(0.1, heatedRadiusM);
    const tCur = tRes + (tSteam - tRes) * Math.exp(-2.2 * decayCur * decayCur);
    currentPoints.push({ r, t: Math.max(tRes, tCur) });

    // Baseline curve
    const decayBase = r / Math.max(0.1, baselineRadiusM);
    const tBase = 48.0 + (282.0 - 48.0) * Math.exp(-2.2 * decayBase * decayBase);
    baselinePoints.push({ r, t: Math.max(48.0, tBase) });
  }

  const curPath = currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.r).toFixed(1)} ${getY(p.t).toFixed(1)}`).join(' ');
  const basePath = baselinePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.r).toFixed(1)} ${getY(p.t).toFixed(1)}`).join(' ');

  const rhX = getX(heatedRadiusM);

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
            Radial Heat Profile
          </span>
          <span className="badge badge-cyan font-mono text-xxs">r_h = {heatedRadiusM}m</span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {tSteam}°C &rarr; {tRes}°C
        </span>
      </div>

      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          <line x1="30" y1="20" x2="225" y2="20" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="30" y1="70" x2="225" y2="70" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="30" y1="120" x2="225" y2="120" stroke="var(--border-subtle)" />
          <line x1="30" y1="20" x2="30" y2="120" stroke="var(--border-subtle)" />

          {/* Heated Radius Marker Line */}
          <line
            x1={rhX}
            y1="20"
            x2={rhX}
            y2="120"
            stroke="var(--accent-orange)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <text x={rhX + 3} y="32" fill="var(--accent-orange)" fontSize="7" fontFamily="var(--font-mono)" fontWeight="bold">
            r_h={heatedRadiusM}m
          </text>

          {/* Axes labels */}
          <text x="5" y="24" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">280°</text>
          <text x="5" y="74" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">150°</text>
          <text x="8" y="123" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">48°</text>
          <text x="30" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">0m</text>
          <text x="120" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">25m</text>
          <text x="210" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">50m</text>

          {/* Baseline Ghost Curve (Dashed Grey) */}
          <path d={basePath} fill="none" stroke="var(--border-metallic)" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* Current Profile Curve (Cyan/Process Blue) */}
          <path d={curPath} fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', background: 'var(--accent-blue)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-main)' }}>Current Profile</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', background: 'var(--border-metallic)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-dim)' }}>Baseline (18.5m)</span>
        </div>
      </div>
    </div>
  );
}
