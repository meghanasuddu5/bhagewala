import React from 'react';

/**
 * Visual Aid D3: Pump Dynamometer Card
 * Surface + downhole load-vs-position loop, redrawn dynamically.
 * Features fluid pound / gas interference shape when pump fillage drops below 80%.
 */
export default function DynamometerCard({ 
  fillagePct = 85.0, 
  spm = 2.0, 
  rodLoadLbs = 14250, 
  strokeLengthIn = 100.0,
  gasInterference = false 
}) {
  const width = 240;
  const height = 140;
  const padding = 24;

  // Generate downhole pump card loop based on fillage
  // Normal card: rectangular parallelogram (intake, compression, discharge, expansion)
  // Fluid pound / incomplete fillage: top-left corner dips down abruptly during downstroke
  const f = Math.max(0.15, Math.min(1.0, fillagePct / 100.0));
  
  // Surface Dyno Card (elongated loop with rod stretch dynamics)
  const surfacePoints = [
    { x: 30, y: 110 },
    { x: 35, y: 35 },
    { x: 190, y: 25 },
    { x: 215, y: 40 },
    { x: 210, y: 100 },
    { x: 120 + (1 - f) * 60, y: 108 },
    { x: 50, y: 112 },
    { x: 30, y: 110 },
  ];

  // Downhole Pump Card (idealized displacement cycle with fluid pound notch)
  const xLeft = 40;
  const xRight = 205;
  const yTop = 45;
  const yBottom = 105;
  const xPound = xRight - (1.0 - f) * (xRight - xLeft);

  let downholePath = `M ${xLeft} ${yBottom} L ${xLeft} ${yTop} L ${xRight} ${yTop} `;
  if (f < 0.85 || gasInterference) {
    // Fluid pound / gas interference profile: delayed fluid load transfer
    downholePath += `L ${xRight} ${yTop + 15} L ${xPound} ${yBottom - 10} L ${xPound - 10} ${yBottom} L ${xLeft} ${yBottom} Z`;
  } else {
    // Full fillage rectangular pump card
    downholePath += `L ${xRight} ${yBottom} L ${xLeft} ${yBottom} Z`;
  }

  const surfacePathD = surfacePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

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
            Dynamometer Card
          </span>
          <span className={`badge ${f < 0.65 ? 'badge-rose' : f < 0.85 ? 'badge-amber' : 'badge-emerald'} font-mono text-xxs`}>
            {f < 0.65 ? 'Gas Interference' : f < 0.85 ? 'Fluid Pound' : 'Full Fillage'}
          </span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {strokeLengthIn}" Stroke &bull; {spm} SPM
        </span>
      </div>

      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1="25" y1="35" x2="225" y2="35" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="25" y1="72" x2="225" y2="72" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="25" y1="110" x2="225" y2="110" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="125" y1="20" x2="125" y2="120" stroke="var(--border-subtle)" strokeDasharray="2 2" />

          {/* Axes labels */}
          <text x="5" y="38" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-mono)">20k</text>
          <text x="5" y="75" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-mono)">10k</text>
          <text x="5" y="113" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-mono)">0 lb</text>
          <text x="30" y="132" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-mono)">0"</text>
          <text x="200" y="132" fill="var(--text-dim)" fontSize="8" fontFamily="var(--font-mono)">100"</text>

          {/* Downhole Card (Dashed Cyan/Teal) */}
          <path
            d={downholePath}
            fill="rgba(42, 157, 143, 0.08)"
            stroke="var(--accent-teal)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />

          {/* Surface Dyno Card (Solid Safety Orange / Amber) */}
          <path
            d={surfacePathD}
            fill="rgba(255, 106, 19, 0.08)"
            stroke="var(--accent-orange)"
            strokeWidth="2.0"
          />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', background: 'var(--accent-orange)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Surface Dyno ({rodLoadLbs.toLocaleString()} lbs)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '2px', background: 'var(--accent-teal)', display: 'inline-block' }} />
          <span style={{ color: 'var(--text-dim)' }}>Downhole ({fillagePct}%)</span>
        </div>
      </div>
    </div>
  );
}
