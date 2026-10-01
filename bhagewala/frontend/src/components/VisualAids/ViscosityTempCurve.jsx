import React from 'react';
import { calculateViscosity } from '../../utils/coupledEngine';

/**
 * Visual Aid D6: Viscosity-Temperature Curve
 * Strict Andrade logarithmic/power form calibrated to 14,500 cP @ 48°C and 245 cP @ 195°C.
 * Features:
 * - Color-banded regions: Pitch-black tar (>8,000 cP), Semimobile bitumen (800-8,000 cP), Free-flowing crude (<800 cP)
 * - Dynamic moving marker for current wellbore/reservoir temperature
 */
export default function ViscosityTempCurve({ currentTempC = 195.0, currentViscosityCp = 245.0 }) {
  const width = 240;
  const height = 140;

  // Temperature domain: 40°C to 260°C
  // Viscosity range: 50 cP to 16,000 cP on log scale
  const minT = 40.0;
  const maxT = 260.0;
  const minLogMu = Math.log10(50.0);
  const maxLogMu = Math.log10(20000.0);

  const getX = (t) => 30 + ((t - minT) / (maxT - minT)) * 195;
  const getY = (mu) => {
    const logMu = Math.log10(Math.max(50.0, mu));
    return 120 - ((logMu - minLogMu) / (maxLogMu - minLogMu)) * 100;
  };

  // Generate curve points
  const points = [];
  for (let t = minT; t <= maxT; t += 5) {
    const mu = calculateViscosity(t);
    points.push({ t, mu });
  }
  const curvePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.t).toFixed(1)} ${getY(pt.mu).toFixed(1)}`).join(' ');

  // Current marker point
  const curX = getX(currentTempC);
  const curY = getY(currentViscosityCp);

  // Region boundaries Y
  const yTar = getY(8000.0);
  const yMobile = getY(800.0);

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
            Viscosity &ndash; Temp Curve
          </span>
          <span className="badge badge-amber font-mono text-xxs">Andrade Form</span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {currentViscosityCp.toLocaleString()} cP @ {currentTempC}°C
        </span>
      </div>

      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="viscZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#181412" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#d97706" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ff6a13" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Color-banded zones */}
          {/* Tar Zone (> 8000 cP) */}
          <rect x="30" y="20" width="195" height={Math.max(0, yTar - 20)} fill="#fbebeb" opacity="0.6" />
          {/* Transition Zone (800 - 8000 cP) */}
          <rect x="30" y={yTar} width="195" height={Math.max(0, yMobile - yTar)} fill="#fef9c3" opacity="0.6" />
          {/* Free-Flowing Zone (< 800 cP) */}
          <rect x="30" y={yMobile} width="195" height={Math.max(0, 120 - yMobile)} fill="#e8f7f5" opacity="0.6" />

          {/* Grid lines */}
          <line x1="30" y1="20" x2="225" y2="20" stroke="var(--border-subtle)" strokeDasharray="2 2" />
          <line x1="30" y1="120" x2="225" y2="120" stroke="var(--border-subtle)" />
          <line x1="30" y1="20" x2="30" y2="120" stroke="var(--border-subtle)" />

          {/* Axis Labels */}
          <text x="5" y="26" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">14k</text>
          <text x="8" y={yTar + 3} fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">8k</text>
          <text x="8" y={yMobile + 3} fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">800</text>
          <text x="8" y="123" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">50</text>

          <text x="30" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">48°C</text>
          <text x="145" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">195°C</text>
          <text x="210" y="132" fill="var(--text-dim)" fontSize="7" fontFamily="var(--font-mono)">260°C</text>

          {/* Calibrated Andrade Curve */}
          <path d={curvePath} fill="none" stroke="var(--accent-orange)" strokeWidth="2.5" />

          {/* Moving Marker */}
          <circle cx={curX} cy={curY} r="5" fill="#2a9d8f" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx={curX} cy={curY} r="8" fill="none" stroke="#2a9d8f" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
        <span style={{ color: '#b82c2c' }}>&bull; Tar (&gt;8k cP)</span>
        <span style={{ color: '#b45309' }}>&bull; Semi-Mobile</span>
        <span style={{ color: '#217f73' }}>&bull; Free-Flowing (&lt;800 cP)</span>
      </div>
    </div>
  );
}
