import React from 'react';

/**
 * Visual Aid D9: Heat-Front Mini-Map
 * Small 2D top-down reservoir section with matching color ramp:
 * #3B6EA8 -> #7FB3C9 -> #F6E08A -> #F59E42 -> #E4572E -> #FFF6E5
 * Shows concentric isotherm rings (200°C, 150°C, 100°C, 48°C) around the central wellbore BW-01.
 */
export default function HeatFrontMiniMap({
  heatedRadiusM = 18.5,
  wellboreTempC = 195.0,
  nativeTempC = 48.0,
  showPattern = false
}) {
  const size = 140;
  const center = size / 2;
  const maxScaleR = 50.0; // 50m radius mapped to 60px

  const rPx = (heatedRadiusM / maxScaleR) * 55;
  const r200 = rPx * 0.45;
  const r150 = rPx * 0.75;
  const r100 = rPx * 1.05;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '10px 12px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            Heat-Front Mini-Map
          </span>
          <span className="badge badge-amber font-mono text-xxs">2D Section</span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          r_h: {heatedRadiusM}m
        </span>
      </div>

      <div style={{ width: '100%', height: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <radialGradient id="heatRampGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff6e5" />
              <stop offset="25%" stopColor="#e4572e" />
              <stop offset="50%" stopColor="#f59e42" />
              <stop offset="75%" stopColor="#f6e08a" />
              <stop offset="90%" stopColor="#7fb3c9" />
              <stop offset="100%" stopColor="#3b6ea8" />
            </radialGradient>
          </defs>

          {/* Cold Reservoir Background */}
          <rect x="0" y="0" width={size} height={size} fill="#eef1f4" rx="6" />

          {/* Grid Circles (10m, 20m, 30m, 40m) */}
          {[10, 20, 30, 40].map((rVal, idx) => {
            const rad = (rVal / maxScaleR) * 55;
            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={rad}
                fill="none"
                stroke="var(--border-subtle)"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Volumetric Heated Radial Front */}
          <circle
            cx={center}
            cy={center}
            r={Math.max(4, rPx)}
            fill="url(#heatRampGrad)"
            opacity="0.85"
          />

          {/* Isotherm Contour Rings */}
          {wellboreTempC >= 200 && (
            <circle cx={center} cy={center} r={Math.max(2, r200)} fill="none" stroke="#ffffff" strokeWidth="1" />
          )}
          {wellboreTempC >= 150 && (
            <circle cx={center} cy={center} r={Math.max(4, r150)} fill="none" stroke="#e4572e" strokeWidth="1" strokeDasharray="3 1" />
          )}
          <circle cx={center} cy={center} r={Math.max(6, r100)} fill="none" stroke="#7fb3c9" strokeWidth="1" strokeDasharray="2 2" />

          {/* Central Wellbore BW-01 */}
          <circle cx={center} cy={center} r="4" fill="#1b2530" stroke="#ffffff" strokeWidth="1.5" />
          <text x={center + 6} y={center - 4} fill="#1b2530" fontSize="7" fontFamily="var(--font-mono)" fontWeight="bold">BW-01</text>

          {/* Optional Illustrative 2nd Producer if Pattern View Enabled */}
          {showPattern && (
            <g transform="translate(100, 30)">
              <circle cx="0" cy="0" r="3.5" fill="#5b6773" stroke="#ffffff" strokeWidth="1" />
              <text x="5" y="-2" fill="#5b6773" fontSize="6.5" fontFamily="var(--font-mono)">BW-02 (Illustrative)</text>
            </g>
          )}

          {/* Scale indicator */}
          <line x1="10" y1={size - 12} x2="32" y2={size - 12} stroke="#1b2530" strokeWidth="1.5" />
          <text x="10" y={size - 4} fill="var(--text-dim)" fontSize="6.5" fontFamily="var(--font-mono)">20m</text>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
        <span style={{ color: '#e4572e' }}>200°C Isotherm</span>
        <span style={{ color: '#f59e42' }}>150°C</span>
        <span style={{ color: '#3b6ea8' }}>48°C Native</span>
      </div>
    </div>
  );
}
