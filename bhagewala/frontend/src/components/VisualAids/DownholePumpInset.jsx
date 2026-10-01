import React, { useState, useEffect } from 'react';

/**
 * Visual Aid D4: Downhole Pump Inset
 * Animated cross-section of sucker-rod pump barrel at depth:
 * - Standing valve (casing seat) opening/closing
 * - Traveling valve (plunger seat) opening/closing
 * - Plunger up/down stroke synchronized to SPM
 * - Fluid slug entry and fillage level
 */
export default function DownholePumpInset({ spm = 2.0, fillagePct = 85.0, pumpActive = true }) {
  const [cycleTime, setCycleTime] = useState(0);

  useEffect(() => {
    if (!pumpActive || spm <= 0) return;
    let animId;
    let start = performance.now();
    const periodMs = (60.0 / spm) * 1000.0;

    const loop = (now) => {
      const elapsed = (now - start) % periodMs;
      setCycleTime(elapsed / periodMs);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [spm, pumpActive]);

  // Plunger position: 0 (bottom) to 1 (top)
  const isUpstroke = cycleTime < 0.5;
  const strokePhase = isUpstroke ? (cycleTime * 2.0) : (2.0 - cycleTime * 2.0); // 0 to 1
  const plungerY = 75 - strokePhase * 40; // Pixels in SVG

  // Valve states:
  // Upstroke: Traveling Valve CLOSED (holds column), Standing Valve OPEN (draws oil into barrel)
  // Downstroke: Traveling Valve OPEN (fluid transfers above), Standing Valve CLOSED (holds barrel)
  const standingValveOpen = pumpActive && isUpstroke;
  const travelingValveOpen = pumpActive && !isUpstroke;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            Downhole Pump Inset
          </span>
          <span className="badge badge-cyan font-mono text-xxs">1,020m Depth</span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {isUpstroke ? 'UPSTROKE' : 'DOWNSTROKE'} &bull; {spm} SPM
        </span>
      </div>

      <div style={{ width: '100%', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="220" height="150" viewBox="0 0 220 150">
          <defs>
            <linearGradient id="fluidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a13" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d95300" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b5bfc9" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#8492a0" />
            </linearGradient>
          </defs>

          {/* Surrounding Casing & Perforations */}
          <rect x="55" y="10" width="110" height="130" fill="#f0f3f6" stroke="#d5dbe1" strokeWidth="1" />
          <text x="60" y="24" fill="#8492a0" fontSize="7" fontFamily="var(--font-mono)">7" CASING</text>

          {/* Perforations slots */}
          {[-20, 0, 20, 40].map((yOff, i) => (
            <React.Fragment key={i}>
              <line x1="50" y1={100 + yOff} x2="55" y2={100 + yOff} stroke="#ff6a13" strokeWidth="2" />
              <line x1="165" y1={100 + yOff} x2="170" y2={100 + yOff} stroke="#ff6a13" strokeWidth="2" />
            </React.Fragment>
          ))}

          {/* Pump Barrel Cylinder (Outer Wall) */}
          <rect x="80" y="15" width="60" height="120" fill="#ffffff" stroke="#5b6773" strokeWidth="2" />
          <text x="85" y="30" fill="#5b6773" fontSize="7" fontFamily="var(--font-mono)">PUMP BARREL</text>

          {/* Fluid in Barrel */}
          <rect
            x="82"
            y={plungerY + 20}
            width="56"
            height={Math.max(0, 130 - (plungerY + 20))}
            fill="url(#fluidGrad)"
            opacity={fillagePct / 100}
          />

          {/* Standing Valve (Bottom Ball Valve) */}
          <circle cx="110" cy="128" r="6" fill="#e2e6eb" stroke="#1b2530" strokeWidth="1.5" />
          {/* Ball seat */}
          <ellipse cx="110" cy={standingValveOpen ? 124 : 128} r="4" rx="4" ry="4" fill="#2a9d8f" />
          <text x="110" y="142" fill="#5b6773" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle">
            SV: {standingValveOpen ? 'OPEN (Inflow)' : 'CLOSED'}
          </text>

          {/* Sucker Rod String moving from top */}
          <line x1="110" y1="5" x2="110" y2={plungerY} stroke="#1b2530" strokeWidth="3" />

          {/* Moving Plunger Assembly */}
          <g transform={`translate(0, ${plungerY})`}>
            {/* Plunger Body */}
            <rect x="83" y="0" width="54" height="22" fill="url(#metalGrad)" stroke="#1b2530" strokeWidth="1.5" rx="1" />
            {/* Traveling Valve (Ball inside plunger) */}
            <circle cx="110" cy="11" r="5" fill="#e2e6eb" stroke="#1b2530" strokeWidth="1" />
            <ellipse cx="110" cy={travelingValveOpen ? 7 : 11} r="3" rx="3" ry="3" fill="#ff6a13" />
            <text x="145" y="14" fill="#1b2530" fontSize="6.5" fontFamily="var(--font-mono)">
              TV: {travelingValveOpen ? 'OPEN' : 'CLOSED'}
            </text>
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
        <span>Plunger Stroke: <strong>{strokePhase > 0.5 ? 'Compressing' : 'Drawing'}</strong></span>
        <span>Barrel Fillage: <strong>{fillagePct}%</strong></span>
      </div>
    </div>
  );
}
