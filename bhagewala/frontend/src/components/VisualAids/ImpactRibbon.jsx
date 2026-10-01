import React, { useState, useEffect } from 'react';
import { ArrowRight, Flame, Thermometer, Droplet, Gauge, Activity, TrendingUp } from 'lucide-react';

/**
 * Visual Aid D1: Cause-and-Effect Impact Ribbon
 * When any driver slider changes, displays a sequential animated chain:
 * "Steam +X% -> Heated radius +Ym -> Res T +Z°C -> Viscosity -W% -> Inflow +A BOPD -> Fillage B% -> Surface Rate +C BOPD"
 */
export default function ImpactRibbon({ impactData, visible = true, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!impactData) return;
    setActiveStep(0);
    const timers = [];
    for (let i = 1; i <= 6; i++) {
      timers.push(setTimeout(() => setActiveStep(i), i * 160));
    }
    return () => timers.forEach(clearTimeout);
  }, [impactData]);

  if (!visible || !impactData) return null;

  const steps = [
    {
      title: "Driver Adjustment",
      value: impactData.driverLabel || "Steam Rate",
      delta: impactData.driverDelta || "+20%",
      icon: Flame,
      color: "var(--accent-orange)",
    },
    {
      title: "Heated Chamber",
      value: `${impactData.radiusM || 18.5} m`,
      delta: impactData.radiusDelta || "+2.3 m",
      icon: Thermometer,
      color: "var(--accent-blue)",
    },
    {
      title: "Reservoir Temp",
      value: `${impactData.resTempC || 148}°C`,
      delta: impactData.resTempDelta || "+18°C",
      icon: Activity,
      color: "var(--accent-caution)",
    },
    {
      title: "Viscosity Drop",
      value: `${impactData.viscosityCp || 340} cP`,
      delta: impactData.viscosityDelta || "-68%",
      icon: Droplet,
      color: "var(--accent-teal)",
    },
    {
      title: "Reservoir Inflow",
      value: `${impactData.inflowBopd || 520} BOPD`,
      delta: impactData.inflowDelta || "+70 BOPD",
      icon: TrendingUp,
      color: "var(--accent-orange)",
    },
    {
      title: "Pump Fillage",
      value: `${impactData.fillagePct || 92}%`,
      delta: impactData.fillageDelta || "Nominal",
      icon: Gauge,
      color: "var(--accent-blue)",
    },
    {
      title: "Delivered Surface Rate",
      value: `${impactData.deliveredBopd || 512} BOPD`,
      delta: impactData.deliveredDelta || "+62 BOPD",
      icon: TrendingUp,
      color: "var(--accent-teal)",
    },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideDownFade 0.25s ease-out',
      maxWidth: '95vw',
      overflowX: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', borderRight: '1px solid var(--border-subtle)', paddingRight: '10px' }}>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-orange)', letterSpacing: '0.06em' }}>
          Physics Impact Chain
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {steps.map((st, i) => {
          const Icon = st.icon;
          const isLit = i <= activeStep;
          return (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                background: isLit ? 'var(--bg-subtle)' : 'transparent',
                border: isLit ? `1px solid ${st.color}` : '1px solid transparent',
                opacity: isLit ? 1.0 : 0.45,
                transition: 'all 0.2s ease',
              }}>
                <Icon size={13} style={{ color: st.color }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    {st.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {st.value}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: st.color }}>
                      {st.delta}
                    </span>
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight size={11} style={{ color: isLit ? 'var(--accent-orange)' : 'var(--border-metallic)', transition: 'color 0.2s' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '8px', color: 'var(--text-dim)', fontSize: '0.8rem' }}
          title="Dismiss ribbon"
        >
          &times;
        </button>
      )}
    </div>
  );
}
