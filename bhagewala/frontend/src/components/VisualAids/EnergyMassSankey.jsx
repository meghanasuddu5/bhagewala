import React from 'react';

/**
 * Visual Aid D8: Energy & Mass Flow Diagram (Sankey Style)
 * Visualizes:
 * - Steam thermal energy input (MW / GJ) -> Heat stored in formation + Overburden conduction loss
 * - Inflow fluid mass -> Produced Heavy Oil (BOPD) + Condensate/Formation Water (BWPD)
 * - Surface electrical power to SRP motor (kW)
 */
export default function EnergyMassSankey({
  enthalpyMw = 4.8,
  oilRateBopd = 450.5,
  waterRateBwpd = 12.5,
  motorKw = 48.0,
  heatedRadiusM = 18.5
}) {
  const width = 240;
  const height = 140;

  // Energy flows
  const totalHeatGJ = Math.round(enthalpyMw * 3.6 * 24); // GJ/day
  const storedPct = Math.min(85, Math.max(40, Math.round(55 + (heatedRadiusM / 30) * 20)));
  const lossPct = 100 - storedPct;

  // Mass fractions
  const totalFluid = oilRateBopd + waterRateBwpd;
  const oilPct = Math.round((oilRateBopd / Math.max(1, totalFluid)) * 100);
  const waterPct = 100 - oilPct;

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
            Energy & Mass Flow
          </span>
          <span className="badge badge-emerald font-mono text-xxs">Coupled Balance</span>
        </div>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          {enthalpyMw} MW &bull; {motorKw} kW
        </span>
      </div>

      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="heatFlowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0b7bc1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff6a13" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="oilFlowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff6a13" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d95300" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Steam Enthalpy Source (Left Box) */}
          <rect x="10" y="20" width="45" height="40" rx="3" fill="#ebf5fb" stroke="#0b7bc1" strokeWidth="1" />
          <text x="32" y="36" fill="#0b7bc1" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">STEAM</text>
          <text x="32" y="48" fill="#1b2530" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">{enthalpyMw} MW</text>

          {/* Heat branches to Stored Heat & Loss */}
          <path d="M 55 35 C 90 35, 90 25, 130 25" fill="none" stroke="#ff6a13" strokeWidth="6" opacity="0.75" />
          <path d="M 55 45 C 90 45, 90 55, 130 55" fill="none" stroke="#8492a0" strokeWidth="3" opacity="0.5" />

          {/* Stored in Pay Zone Box */}
          <rect x="130" y="15" width="95" height="20" rx="2" fill="#fff3ec" stroke="#ff6a13" strokeWidth="1" />
          <text x="177" y="28" fill="#d95300" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle">
            Pay Zone Heat ({storedPct}%)
          </text>

          {/* Conduction Loss Box */}
          <rect x="130" y="45" width="95" height="18" rx="2" fill="#f0f3f6" stroke="#b5bfc9" strokeWidth="1" />
          <text x="177" y="57" fill="#5b6773" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle">
            Overburden Loss ({lossPct}%)
          </text>

          {/* Divider */}
          <line x1="10" y1="75" x2="230" y2="75" stroke="var(--border-subtle)" strokeDasharray="3 3" />

          {/* Fluid Inflow Source */}
          <rect x="10" y="85" width="45" height="40" rx="3" fill="#fef9c3" stroke="#e27d11" strokeWidth="1" />
          <text x="32" y="101" fill="#b45309" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">FLUID</text>
          <text x="32" y="113" fill="#1b2530" fontSize="7" fontFamily="var(--font-mono)" textAnchor="middle">{Math.round(totalFluid)} BPD</text>

          {/* Branches to Produced Oil & Water */}
          <path d="M 55 100 C 90 100, 90 92, 130 92" fill="none" stroke="url(#oilFlowGrad)" strokeWidth="6" />
          <path d="M 55 110 C 90 110, 90 118, 130 118" fill="none" stroke="#0b7bc1" strokeWidth="2.5" />

          {/* Produced Oil Box */}
          <rect x="130" y="82" width="95" height="20" rx="2" fill="#fff3ec" stroke="#ff6a13" strokeWidth="1" />
          <text x="177" y="95" fill="#d95300" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="bold">
            Heavy Oil ({oilRateBopd} BOPD)
          </text>

          {/* Produced Water Box */}
          <rect x="130" y="108" width="95" height="18" rx="2" fill="#ebf5fb" stroke="#0b7bc1" strokeWidth="1" />
          <text x="177" y="120" fill="#0b7bc1" fontSize="6.5" fontFamily="var(--font-mono)" textAnchor="middle">
            Water Cut ({waterRateBwpd} BWPD)
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
        <span>Lift Power: <strong>{motorKw} kW</strong></span>
        <span>Thermal Enthalpy: <strong>{totalHeatGJ} GJ/d</strong></span>
      </div>
    </div>
  );
}
