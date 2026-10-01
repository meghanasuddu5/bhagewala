import React, { useState, useEffect } from 'react';
import { 
  Flame, Droplet, Sparkles, ArrowRight, Play, Pause, 
  RotateCcw, Thermometer, Gauge, Activity, ShieldCheck, CheckCircle2,
  Layers, Zap, Box, Warehouse
} from 'lucide-react';

export default function SimulationStageVisualizer({ 
  currentOilRate = 450.5,
  activeStage = 0,
  onStageSelect = null 
}) {
  const [stageIndex, setStageIndex] = useState(activeStage);
  const [autoPlay, setAutoPlay] = useState(true);

  // Synchronize when prop changes
  useEffect(() => {
    setStageIndex(activeStage);
  }, [activeStage]);

  const stages = [
    {
      id: "steam",
      name: "1. Steam Injection (Huff)",
      phaseTag: "THERMAL INJECTION",
      icon: Flame,
      color: "cyan",
      headline: "Superheated 282°C Steam Injection into Sandstone Perforations",
      desc: "High-pressure boiler plant forces 140 TPD steam down through the wellbore into Jodhpur sandstone perforations at 1,050m depth, initiating thermal chamber expansion.",
      metrics: [
        { label: "Steam Pressure", val: "68.0 bar", badge: "High Pressure" },
        { label: "Injection Temp", val: "282.0 °C", badge: "Superheated" },
        { label: "Steam Quality", val: "81 % (Dry)", badge: "Dry Steam" },
        { label: "Chamber Radius", val: "18.5 meters", badge: "Expanding" },
      ],
      viscosityDisplay: {
        val: "14,500 cP",
        state: "Solid / Pitch-Black Bitumen",
        temp: "48°C (Native Reservoir)",
        progress: 100,
      },
      nextStagePreview: "Heat conductively propagates through rock matrix during shut-in.",
    },
    {
      id: "soak",
      name: "2. Thermal Soaking & Viscosity Reduction",
      phaseTag: "HEAT CONDUCTION & VISCOSITY COLLAPSE",
      icon: Sparkles,
      color: "rose",
      headline: "Exponential 98.3% Viscosity Collapse Across Rock Matrix",
      desc: "Well is shut in for a 6-day soaking cycle. Latent heat conducts through dolomite and porous sandstone grains, melting tar into free-flowing golden crude.",
      metrics: [
        { label: "Matrix Temperature", val: "195.0 °C", badge: "Soaked Zone" },
        { label: "Viscosity Drop", val: "-98.3 %", badge: "Dramatic Collapse" },
        { label: "Soak Duration", val: "6 Days", badge: "Equilibrated" },
        { label: "Effective Fluid Mobility", val: "58.4 mD/cP", badge: "High Flow" },
      ],
      viscosityDisplay: {
        val: "245 cP",
        state: "Liquid Mobilized Fluid",
        temp: "195°C (Stimulated)",
        progress: 16,
      },
      nextStagePreview: "Pressure differential drives hot liquid crude into the wellbore.",
    },
    {
      id: "mobilize",
      name: "3. Reservoir Mobilization & Oil Inflow",
      phaseTag: "SUB-SURFACE RADIAL INFLOW",
      icon: Droplet,
      color: "amber",
      headline: "Radial Crude Inflow Through Sandstone Permeable Pores",
      desc: "Near-wellbore drawdown (1,430 psia) pulls mobilized crude radially through 1,200 mD sandstone pores into the slotted casing perforations.",
      metrics: [
        { label: "Drawdown Delta", val: "1,430 psia", badge: "Driving Head" },
        { label: "Inflow Velocity", val: "2.8 cm/s", badge: "Pore Velocity" },
        { label: "Bottomhole Pressure", val: "2,310 psia", badge: "Flowing BHP" },
        { label: "BSW Water Cut", val: "2.7 %", badge: "Initial Low Cut" },
      ],
      viscosityDisplay: {
        val: "260 cP",
        state: "Free Flowing Liquid",
        temp: "165°C (Inflow)",
        progress: 20,
      },
      nextStagePreview: "Downhole Sucker Rod Pump barrel fills on the upstroke.",
    },
    {
      id: "lift",
      name: "4. Wellbore Production & Artificial Lift",
      phaseTag: "MECHANICAL BEAM PUMPING",
      icon: Zap,
      color: "purple",
      headline: "Reciprocating SRP Pumping Oil up 1,050m Production Tubing",
      desc: "Surface nodding donkey drives the polished rod and downhole pump barrel at 2.0–3.0 SPM, lifting a steady column of 450+ BOPD heavy crude to the wellhead.",
      metrics: [
        { label: "Pumping Speed", val: "2.0 SPM", badge: "Harmonic Cycle" },
        { label: "Pump Fillage", val: "82.0 %", badge: "Good Fill" },
        { label: "Tubing Lift Head", val: "1,050 meters", badge: "Total Column" },
        { label: "Gross Liquid Rate", val: `${(currentOilRate * 1.03).toFixed(1)} BLPD`, badge: "Simulated" },
      ],
      viscosityDisplay: {
        val: "320 cP",
        state: "Ascending Tubing Column",
        temp: "115°C (Wellbore)",
        progress: 26,
      },
      nextStagePreview: "Pressurized fluid enters the wellhead Christmas tree and surface manifold.",
    },
    {
      id: "separation",
      name: "5. Surface Manifold & Fluid Separation",
      phaseTag: "SURFACE GATHERING & 3-PHASE DEGASSING",
      icon: Gauge,
      color: "cyan",
      headline: "Horizontal 3-Phase Separator Splitting Oil, Gas & Water",
      desc: "Crude mixture passes through the wellhead wing choke into horizontal separator V-101. Flashed solution gas is collected and water is knocked out.",
      metrics: [
        { label: "Vessel Pressure", val: "140 psia", badge: "Controlled" },
        { label: "Flashed Solution Gas", val: "620 MCFD", badge: "Gas Rate" },
        { label: "Produced Water", val: "12.5 BWPD", badge: "Knockout" },
        { label: "Residence Time", val: "45 minutes", badge: "De-emulsifying" },
      ],
      viscosityDisplay: {
        val: "410 cP",
        state: "Separated Surface Crude",
        temp: "68°C (Manifold)",
        progress: 35,
      },
      nextStagePreview: "Clean heavy crude flows into insulated field storage tanks.",
    },
    {
      id: "storage",
      name: "6. Production Delivery & Storage Battery",
      phaseTag: "STORAGE BATTERY & DISPATCH",
      icon: Warehouse,
      color: "emerald",
      headline: "Net Production Delivery to Heated API 650 Storage Tanks",
      desc: "Clean dry heavy crude at 17.4° API is transferred into the storage tank battery with thermal insulation coils ready for regional pipeline/tanker dispatch.",
      metrics: [
        { label: "Net Oil Delivered", val: `${currentOilRate.toFixed(1)} BOPD`, badge: "Export Stream" },
        { label: "Storage Level", val: "68.4 % (3,420 bbl)", badge: "Accumulating" },
        { label: "Heated Tank Temp", val: "54.0 °C", badge: "Maintain Fluidity" },
        { label: "Export Specification", val: "< 1.0% BS&W", badge: "Sales Spec Met" },
      ],
      viscosityDisplay: {
        val: "580 cP",
        state: "Heated Storage Crude",
        temp: "54°C (Storage Tank)",
        progress: 44,
      },
      nextStagePreview: "Ready for thermal replenishment or ongoing continuous cyclic pumping.",
    },
  ];

  // Auto-play cycling through 6 stages
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % stages.length;
        if (onStageSelect) onStageSelect(next);
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [autoPlay, stages.length, onStageSelect]);

  const cur = stages[stageIndex];
  const Icon = cur.icon;

  const handleSelect = (idx) => {
    setStageIndex(idx);
    if (onStageSelect) onStageSelect(idx);
  };

  return (
    <div className="simulation-stages-panel">
      {/* Header Row */}
      <div className="flex-center justify-between mb-2">
        <div className="flex-center gap-2">
          <span className="icon-badge bg-amber-100 text-amber-700">
            <Activity size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-main flex-center gap-2">
              Well-to-Surface 6-Stage Process Sequence
              <span className="badge badge-amber font-mono text-xxs">CSS Thermal Lifecycle</span>
            </h3>
            <span className="text-xs text-dim">
              Integrated flow sequence from 282°C steam injection downhole to API 650 surface storage
            </span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex-center gap-2">
          <button 
            className="btn btn-secondary text-xs"
            onClick={() => setAutoPlay(!autoPlay)}
          >
            {autoPlay ? <Pause size={13} /> : <Play size={13} />}
            <span>{autoPlay ? 'Pause Sequence' : 'Auto Sequence'}</span>
          </button>
        </div>
      </div>

      {/* 6 Stage Track Buttons */}
      <div className="stages-track-container">
        {stages.map((st, idx) => {
          const SIcon = st.icon;
          const isActive = idx === stageIndex;
          return (
            <button
              key={st.id}
              className={`stage-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(idx)}
            >
              <div className="flex-center justify-between w-full mb-1">
                <span className="stage-num-badge">STAGE {idx + 1}</span>
                <SIcon size={14} className={isActive ? 'text-amber' : 'text-dim'} />
              </div>
              <span className="stage-tab-title">{st.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detail Hero Card */}
      <div className="active-stage-detail-card">
        {/* Left: Headline & Operational Metrics */}
        <div>
          <div className="flex-center gap-2 mb-1">
            <span className={`badge badge-${cur.color} font-mono text-xxs`}>{cur.phaseTag}</span>
            <span className="text-dim text-xs font-mono">Stage {stageIndex + 1} of 6</span>
          </div>
          <h4 className="stage-detail-headline">{cur.headline}</h4>
          <p className="stage-detail-desc">{cur.desc}</p>

          {/* 4 Technical Parameter Boxes */}
          <div className="stage-metrics-row">
            {cur.metrics.map((m, i) => (
              <div key={i} className="stage-metric-box">
                <span className="stage-metric-label">{m.label}</span>
                <span className="stage-metric-val">{m.val}</span>
                <span className="badge badge-gray font-mono text-xxs mt-1">{m.badge}</span>
              </div>
            ))}
          </div>

          <div className="flex-center gap-2 mt-3 text-xs text-dim font-mono">
            <span className="text-amber">Next Step:</span>
            <span>{cur.nextStagePreview}</span>
          </div>
        </div>

        {/* Right: Dynamic Viscosity & Mobility Gauge */}
        <div className="viscosity-meter-panel">
          <div className="flex-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex-center gap-1">
              <Thermometer size={14} className="text-rose" />
              Heavy Crude Viscosity
            </span>
            <span className="badge badge-amber font-mono text-xxs">{cur.viscosityDisplay.temp}</span>
          </div>

          <div className="viscosity-val-readout my-1">
            {cur.viscosityDisplay.val}
          </div>

          <span className="text-xs text-dim font-medium mb-2">
            State: <strong className="text-main">{cur.viscosityDisplay.state}</strong>
          </span>

          {/* Progress bar representing resistance to flow */}
          <div className="viscosity-bar-track">
            <div 
              className="viscosity-bar-fill" 
              style={{ width: `${cur.viscosityDisplay.progress}%` }} 
            />
          </div>

          <div className="flex-center justify-between text-xxs text-light font-mono">
            <span>200 cP (Free Flow)</span>
            <span>14,500 cP (Native Tar)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
