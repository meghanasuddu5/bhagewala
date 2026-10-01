import React from 'react';
import { Flame, Sparkles, Droplet, TrendingUp } from 'lucide-react';

/**
 * Visual Aid D11: Cumulative Oil and SOR Tiles + CSS Cycle Progress Ring
 * Displays:
 * - Circular SVG ring showing current cycle breakdown (Huff 20d, Soak 6d, Puff production)
 * - Cumulative Oil tile with sparkline
 * - Steam-Oil Ratio (SOR) tile with efficiency badge
 */
export default function CycleProgressRing({
  stage = 6.0,
  elapsedDays = 26.0,
  cumOilBbl = 12614,
  sor = 2.15,
  isInjecting = false,
  isSoaking = false,
  isProducing = true
}) {
  const size = 110;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // 3 Phases in standard cycle:
  // Huff (Steam injection): 20 days (40%)
  // Soak: 6 days (12%)
  // Puff (Production): 24 days (48%)
  // Total cycle = 50 days
  const totalCycleDays = 50.0;
  const huffFrac = 20.0 / totalCycleDays;
  const soakFrac = 6.0 / totalCycleDays;
  const puffFrac = 24.0 / totalCycleDays;

  const currentFrac = Math.min(1.0, Math.max(0.0, elapsedDays / totalCycleDays));
  const progressOffset = circumference * (1 - currentFrac);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr 1fr',
      gap: '12px',
      alignItems: 'center',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* CSS Cycle Circular Progress Ring */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth={stroke}
          />
          {/* Progress Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isInjecting ? "var(--accent-blue)" : isSoaking ? "var(--accent-caution)" : "var(--accent-orange)"}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Day {Math.round(elapsedDays)}/50
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {isInjecting ? 'HUFF' : isSoaking ? 'SOAK' : 'PUFF'}
          </span>
          <span style={{ fontSize: '0.55rem', color: isInjecting ? 'var(--accent-blue)' : isSoaking ? 'var(--accent-caution)' : 'var(--accent-orange)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            Phase {isInjecting ? '1' : isSoaking ? '2' : '3'}
          </span>
        </div>
      </div>

      {/* Cumulative Oil Tile */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Cum Oil
          </span>
          <Droplet size={12} style={{ color: 'var(--accent-orange)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {cumOilBbl.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>bbl</span>
        </div>
        {/* Sparkline mini bar */}
        <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
          <div style={{ width: `${Math.min(100, (cumOilBbl / 25000) * 100)}%`, height: '100%', background: 'var(--accent-orange)' }} />
        </div>
      </div>

      {/* Steam-Oil Ratio Tile */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Steam-Oil Ratio
          </span>
          <Flame size={12} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {sor}
          </span>
          <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>m³/m³</span>
        </div>
        <span className={`badge ${sor <= 2.2 ? 'badge-emerald' : sor <= 3.5 ? 'badge-amber' : 'badge-rose'} font-mono text-xxs mt-1`}>
          {sor <= 2.2 ? 'High Thermal Eff' : 'Nominal Ratio'}
        </span>
      </div>
    </div>
  );
}
