import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, FastForward, Sliders, Activity, 
  Layers, Eye, Compass, Flame, Droplet, Gauge, Zap, TrendingUp,
  AlertTriangle, CheckCircle2, Info, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, Share2, HelpCircle, Shield, Sparkles, X, GitCompare
} from 'lucide-react';

import IntegratedTwin3D from '../components/IntegratedTwin3D';
import ImpactRibbon from '../components/VisualAids/ImpactRibbon';
import DynamometerCard from '../components/VisualAids/DynamometerCard';
import DownholePumpInset from '../components/VisualAids/DownholePumpInset';
import IprPumpCurve from '../components/VisualAids/IprPumpCurve';
import ViscosityTempCurve from '../components/VisualAids/ViscosityTempCurve';
import RadialTempProfile from '../components/VisualAids/RadialTempProfile';
import EnergyMassSankey from '../components/VisualAids/EnergyMassSankey';
import HeatFrontMiniMap from '../components/VisualAids/HeatFrontMiniMap';
import PidLiteOverlay from '../components/VisualAids/PidLiteOverlay';
import CycleProgressRing from '../components/VisualAids/CycleProgressRing';

import { 
  DEFAULT_COUPLED_INPUTS, 
  solveCoupledState, 
  calculateViscosity,
  computeHeatedRadius 
} from '../utils/coupledEngine';
import { TWIN_CONSTANTS } from '../constants/twinConstants';
import { 
  fetchTwinCoupledState, 
  updateTwinScenario, 
  stepTwinSimulation, 
  resetTwinSimulation,
  compareTwinScenarios 
} from '../api';
import { 
  formatValue, 
  formatPhase, 
  formatStage, 
  formatPercent, 
  formatBOPD, 
  formatTemp, 
  formatPressure, 
  formatViscosity 
} from '../utils/formatters';
import { ProvenanceBadge } from '../constants/dataSourceRegistry';

const SCENARIO_PRESETS = [
  {
    id: 'baseline',
    label: 'Baseline',
    desc: 'Baseline state: 140 TPD steam, 2.0 SPM, 6-day soak, stimulated inflow',
    inputs: { ...DEFAULT_COUPLED_INPUTS }
  },
  {
    id: 'steam-only',
    label: 'Steam Only',
    desc: 'Huff phase injection: 180 TPD superheated steam, pump stopped',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: 180.0,
      steam_temp_c: 295.0,
      pump_active: false,
      spm: 0.0,
      scrub_stage: 2.0,
      elapsed_days: 15.0
    }
  },
  {
    id: 'pump-only',
    label: 'Pump Only',
    desc: 'Native cold lift: zero steam, 14,500 cP native viscosity, pump-limited',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: 0.0,
      injection_days: 0.0,
      soak_days: 0.0,
      pump_active: true,
      spm: 2.0,
      scrub_stage: 5.0,
      elapsed_days: 26.0
    }
  },
  {
    id: 'combined-peak',
    label: 'Combined',
    desc: 'Optimal thermal stimulation: 160 TPD steam coupled with 2.5 SPM lift',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: 160.0,
      steam_temp_c: 288.0,
      pump_active: true,
      spm: 2.5,
      scrub_stage: 6.0,
      elapsed_days: 28.0
    }
  },
  {
    id: 'increased-steam',
    label: 'Increased Steam',
    desc: 'High-enthalpy surge: 200 TPD @ 300°C expanding chamber radius to >22m',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: 200.0,
      steam_temp_c: 300.0,
      injection_press_bar: 74.0,
      pump_active: true,
      spm: 2.6,
      scrub_stage: 6.0,
      elapsed_days: 28.0
    }
  },
  {
    id: 'reduced-spm',
    label: 'Reduced SPM',
    desc: 'Throttled pump speed: 1.0 SPM testing high intake head and fluid conservation',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      pump_active: true,
      spm: 1.0,
      scrub_stage: 6.0,
      elapsed_days: 26.0
    }
  },
  {
    id: 'steam-shutoff',
    label: 'Steam Shutoff',
    desc: 'Thermal decay: zero steam injection with natural reservoir cooling',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: 0.0,
      injection_days: 0.0,
      pump_active: true,
      spm: 1.5,
      elapsed_days: 90.0,
      scrub_stage: 6.0
    }
  },
  {
    id: 'pump-shutdown',
    label: 'Pump Shutdown',
    desc: 'Well workover / maintenance: pump tripped, zero surface lift',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      pump_active: false,
      spm: 0.0,
      scrub_stage: 5.0,
      elapsed_days: 26.0
    }
  },
  {
    id: 'recovery-shutdown',
    label: 'Recovery',
    desc: 'Post-maintenance restart: re-initiating 2.2 SPM with residual heat chamber',
    inputs: {
      ...DEFAULT_COUPLED_INPUTS,
      steam_rate_tpd: 150.0,
      pump_active: true,
      spm: 2.2,
      scrub_stage: 6.0,
      elapsed_days: 30.0
    }
  }
];

const STAGE_STEPS = [
  { id: 1, label: '1. Initial', sub: 'Cold Native' },
  { id: 2, label: '2. Steam In', sub: 'Huff Phase' },
  { id: 3, label: '3. Heat Spreads', sub: 'Chamber Grow' },
  { id: 4, label: '4. Viscosity Falls', sub: 'Thermal Soak' },
  { id: 5, label: '5. Oil Mobilizes', sub: 'Inflow Surge' },
  { id: 6, label: '6. Pump Lifts', sub: 'SRP Drawdown' },
  { id: 7, label: '7. Surface Flow', sub: 'Separation' },
  { id: 8, label: '8. AI Forecast', sub: 'V1.3 Horizon' },
];

export default function IntegratedTwinPage({ onNavigateDetail }) {
  // 1. Coupled Simulation Inputs & State
  const [inputs, setInputs] = useState({ ...DEFAULT_COUPLED_INPUTS });
  const [activePreset, setActivePreset] = useState('baseline');
  const baselineState = useMemo(() => solveCoupledState(DEFAULT_COUPLED_INPUTS), []);
  const currentState = useMemo(() => solveCoupledState(inputs), [inputs]);

  // 2. Playback / Transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [timelineStage, setTimelineStage] = useState(inputs.scrub_stage);
  const [cycleMode, setCycleMode] = useState('1-cycle'); // '1-cycle' | 'continuous'
  const [isCycleCompleted, setIsCycleCompleted] = useState(false);

  // 3. UI Layout & View Controls (Panels collapsed by default for full-bleed 3D simulation)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [rightActiveTab, setRightActiveTab] = useState('telemetry'); // telemetry, dynamics, thermal, energy
  const [cameraPreset, setCameraPreset] = useState('full-field');
  const [is3DFullscreen, setIs3DFullscreen] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [xraySurface, setXraySurface] = useState(0.0);
  const [showPidOverlay, setShowPidOverlay] = useState(false);
  const [showPumpInsetPiP, setShowPumpInsetPiP] = useState(false);
  const [showLegends, setShowLegends] = useState(false);
  const [pipPos, setPipPos] = useState(() => {
    try {
      const saved = localStorage.getItem('twin_pip_pos');
      return saved ? JSON.parse(saved) : { x: 20, y: 70 };
    } catch (e) {
      return { x: 20, y: 70 };
    }
  });
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [compareData, setCompareData] = useState(null);

  // Layer toggles
  const [layers, setLayers] = useState({
    strata: true,
    heatField: true,
    isotherms: true,
    streamlines: true,
    labels: true,
  });

  // Cause-and-Effect Impact Ribbon state
  const [impactData, setImpactData] = useState(null);
  const [showImpactRibbon, setShowImpactRibbon] = useState(false);

  // Guided Tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Toggle full screen 3D mode
  const toggle3DFullscreen = () => {
    setIs3DFullscreen((prev) => {
      const next = !prev;
      if (next) {
        setLeftPanelCollapsed(true);
        setRightPanelCollapsed(true);
      } else {
        setLeftPanelCollapsed(false);
        setRightPanelCollapsed(false);
      }
      return next;
    });
  };

  // Keyboard navigation & Escape for fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && is3DFullscreen) {
        setIs3DFullscreen(false);
        setLeftPanelCollapsed(false);
        setRightPanelCollapsed(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [is3DFullscreen]);

  // Sync timeline stage
  useEffect(() => {
    setTimelineStage(inputs.scrub_stage);
  }, [inputs.scrub_stage]);

  // Toggle or start prescribed simulation run
  const toggleSimulationRun = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If cycle is already finished (at stage 8.0 or marked complete), re-run fresh from Stage 1.0
      if (inputs.scrub_stage >= 8.0 || isCycleCompleted) {
        setInputs((prev) => ({
          ...prev,
          scrub_stage: 1.0,
          elapsed_days: 0.0,
        }));
        setTimelineStage(1.0);
        setIsCycleCompleted(false);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, inputs.scrub_stage, isCycleCompleted]);

  // Automated timeline playback for prescribed cycle
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setInputs((prev) => {
        const step = 0.05 * playbackSpeed;
        const nextStage = prev.scrub_stage + step;
        const nextElapsed = prev.elapsed_days + 0.25 * playbackSpeed;

        if (nextStage >= 8.0) {
          // If in 1-cycle prescribed mode, stop the simulation cleanly!
          if (cycleMode === '1-cycle') {
            setTimeout(() => {
              setIsPlaying(false);
              setIsCycleCompleted(true);
            }, 0);
            return {
              ...prev,
              scrub_stage: 8.0,
              elapsed_days: 35.0,
            };
          } else {
            // Continuous loop mode
            return {
              ...prev,
              scrub_stage: 1.0,
              elapsed_days: 0.0,
            };
          }
        }

        return {
          ...prev,
          scrub_stage: Number(nextStage.toFixed(2)),
          elapsed_days: Number(Math.min(35.0, nextElapsed).toFixed(1)),
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, cycleMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleSimulationRun();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        scrubToStage(Math.min(8.0, Number((inputs.scrub_stage + 1.0).toFixed(1))));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        scrubToStage(Math.max(1.0, Number((inputs.scrub_stage - 1.0).toFixed(1))));
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        const presets = ['full-field', 'steam-facility', 'wellbore-pump', 'reservoir-cutaway', 'surface-production'];
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        if (presets[idx]) setCameraPreset(presets[idx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputs.scrub_stage, toggleSimulationRun]);

  // Trigger Cause-and-Effect Impact Ribbon on driver adjustments
  const triggerImpact = (driverKey, label, prevVal, newVal, unit = '') => {
    const prevInputs = { ...inputs, [driverKey]: prevVal };
    const newInputs = { ...inputs, [driverKey]: newVal };
    const prevState = solveCoupledState(prevInputs);
    const newState = solveCoupledState(newInputs);

    const deltaPct = prevVal !== 0 ? (((newVal - prevVal) / Math.abs(prevVal)) * 100).toFixed(1) : '+100';
    const deltaSign = Number(deltaPct) >= 0 ? '+' : '';

    const radiusDelta = (newState.reservoir.heated_radius_m - prevState.reservoir.heated_radius_m).toFixed(1);
    const tempDelta = (newState.reservoir.avg_temperature_c - prevState.reservoir.avg_temperature_c).toFixed(1);
    const viscPct = prevState.reservoir.wellbore_viscosity_cp !== 0 
      ? (((newState.reservoir.wellbore_viscosity_cp - prevState.reservoir.wellbore_viscosity_cp) / prevState.reservoir.wellbore_viscosity_cp) * 100).toFixed(1)
      : '0';
    const inflowDelta = (newState.reservoir.actual_inflow_bopd - prevState.reservoir.actual_inflow_bopd).toFixed(1);
    const fillageDelta = (newState.well_and_pump.pump_fillage_pct - prevState.well_and_pump.pump_fillage_pct).toFixed(1);
    const rateDelta = (newState.well_and_pump.delivered_oil_rate_bopd - prevState.well_and_pump.delivered_oil_rate_bopd).toFixed(1);

    setImpactData({
      driverLabel: label,
      driverDelta: `${deltaSign}${deltaPct}% (${newVal} ${unit})`,
      radiusM: newState.reservoir.heated_radius_m,
      radiusDelta: `${Number(radiusDelta) >= 0 ? '+' : ''}${radiusDelta} m`,
      resTempC: newState.reservoir.avg_temperature_c,
      resTempDelta: `${Number(tempDelta) >= 0 ? '+' : ''}${tempDelta} °C`,
      viscosityCp: newState.reservoir.wellbore_viscosity_cp,
      viscosityDelta: `${Number(viscPct) >= 0 ? '+' : ''}${viscPct}%`,
      inflowBopd: newState.reservoir.actual_inflow_bopd,
      inflowDelta: `${Number(inflowDelta) >= 0 ? '+' : ''}${inflowDelta} BOPD`,
      fillagePct: newState.well_and_pump.pump_fillage_pct,
      fillageDelta: `${Number(fillageDelta) >= 0 ? '+' : ''}${fillageDelta}%`,
      surfaceRateBopd: newState.well_and_pump.delivered_oil_rate_bopd,
      surfaceRateDelta: `${Number(rateDelta) >= 0 ? '+' : ''}${rateDelta} BOPD`,
    });
    setShowImpactRibbon(true);
  };

  const handleInputChange = (key, value, label, unit = '') => {
    const prev = inputs[key];
    const num = Number(value);
    setInputs((prevInputs) => ({ ...prevInputs, [key]: num }));
    setActivePreset('custom');
    triggerImpact(key, label, prev, num, unit);
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setInputs({ ...preset.inputs });
    triggerImpact('steam_rate_tpd', `${preset.label} Preset`, inputs.steam_rate_tpd, preset.inputs.steam_rate_tpd, 'TPD');
  };

  const scrubToStage = (stage) => {
    const s = Number(stage);
    setTimelineStage(s);
    if (s < 8.0) {
      setIsCycleCompleted(false);
    } else {
      setIsCycleCompleted(true);
    }
    setInputs((prev) => ({
      ...prev,
      scrub_stage: s,
      elapsed_days: s <= 2 ? s * 10 : s <= 4 ? 20 + (s - 2) * 3 : Math.min(35.0, 26 + (s - 4) * 2.25),
    }));
  };

  const resetAllToBaseline = () => {
    setInputs({ ...DEFAULT_COUPLED_INPUTS });
    setActivePreset('baseline');
    setShowImpactRibbon(false);
  };

  // Compare scenarios helper
  const handleOpenCompare = async () => {
    setShowCompareModal(true);
    const data = await compareTwinScenarios("baseline,combined-peak,steam-only,pump-only");
    if (data && data.comparison) {
      setCompareData(data.comparison);
    } else {
      // Local fallback
      const baseState = solveCoupledState(DEFAULT_COUPLED_INPUTS);
      const combinedState = solveCoupledState(SCENARIO_PRESETS[3].inputs);
      const pumpOnlyState = solveCoupledState(SCENARIO_PRESETS[2].inputs);
      setCompareData([
        {
          scenario_id: 'baseline',
          name: 'Baseline (SSOT)',
          rate_bopd: baseState.reservoir.actual_inflow_bopd,
          cum_oil_bbl: baseState.surface.cumulative_oil_bbl,
          steam_oil_ratio: baseState.surface.steam_oil_ratio,
          total_power_kw: baseState.surface.total_power_kw,
          delta_cum_bbl: 0,
          delta_pct: 0,
        },
        {
          scenario_id: 'combined-peak',
          name: 'Combined Thermal Lift',
          rate_bopd: combinedState.reservoir.actual_inflow_bopd,
          cum_oil_bbl: combinedState.surface.cumulative_oil_bbl,
          steam_oil_ratio: combinedState.surface.steam_oil_ratio,
          total_power_kw: combinedState.surface.total_power_kw,
          delta_cum_bbl: combinedState.surface.cumulative_oil_bbl - baseState.surface.cumulative_oil_bbl,
          delta_pct: Number((((combinedState.surface.cumulative_oil_bbl - baseState.surface.cumulative_oil_bbl) / baseState.surface.cumulative_oil_bbl) * 100).toFixed(1)),
        },
        {
          scenario_id: 'pump-only',
          name: 'Native Cold Lift',
          rate_bopd: pumpOnlyState.reservoir.actual_inflow_bopd,
          cum_oil_bbl: pumpOnlyState.surface.cumulative_oil_bbl,
          steam_oil_ratio: 0,
          total_power_kw: pumpOnlyState.surface.total_power_kw,
          delta_cum_bbl: pumpOnlyState.surface.cumulative_oil_bbl - baseState.surface.cumulative_oil_bbl,
          delta_pct: Number((((pumpOnlyState.surface.cumulative_oil_bbl - baseState.surface.cumulative_oil_bbl) / baseState.surface.cumulative_oil_bbl) * 100).toFixed(1)),
        }
      ]);
    }
  };

  // Guided Tour Steps
  const TOUR_STOPS = [
    {
      title: "1. OTSG Steam Generation Facility",
      desc: "High-pressure Once-Through Steam Generator converts feedwater into 282°C, 81% quality saturated steam at 68 bar. Notice the structural I-beam box, radiant burner, and live stack thermal plume.",
      camera: "steam-facility",
      stage: 2.0,
      inputs: { steam_rate_tpd: 160.0 }
    },
    {
      title: "2. Insulated Flowline & Christmas Tree",
      desc: "Superheated steam travels via CatmullRomCurve3 expansion loops to the wellhead. During Huff, the wellhead valve opens for steam injection down the casing annulus.",
      camera: "wellbore-pump",
      stage: 2.0,
      inputs: { steam_rate_tpd: 160.0 }
    },
    {
      title: "3. Sliced Geological Block & Heat Chamber",
      desc: "Underground cutaway reveals 5 geological formations down to Jodhpur sandstone at 1050m. The volumetric heat field (#3B6EA8 to #FFF6E5) grows radially with injected enthalpy, lowering native oil viscosity from 14,500 cP down to 245 cP.",
      camera: "reservoir-cutaway",
      stage: 4.0,
      inputs: { elapsed_days: 22.0 }
    },
    {
      title: "4. Sucker-Rod Pump (Puff Production)",
      desc: "With oil mobilized into the wellbore perforations, the surface nodding donkey engages via true 4-bar linkage kinematics (2.0 SPM, 100 in stroke). Downhole standing & traveling valves lift heavy crude to surface.",
      camera: "wellbore-pump",
      stage: 6.0,
      inputs: { pump_active: true, spm: 2.0 }
    },
    {
      title: "5. Surface Separation & Dual Storage Tanks",
      desc: "Produced fluids enter horizontal 3-phase test separator V-101. Degassed oil routes to twin API 650 cone-roof storage tanks where fluid levels rise in real time with cumulative production.",
      camera: "surface-production",
      stage: 7.0,
      inputs: { elapsed_days: 28.0 }
    }
  ];

  const handleNextTourStep = () => {
    if (tourStep < TOUR_STOPS.length - 1) {
      const nextIdx = tourStep + 1;
      setTourStep(nextIdx);
      const stop = TOUR_STOPS[nextIdx];
      setCameraPreset(stop.camera);
      scrubToStage(stop.stage);
    } else {
      setIsTourActive(false);
      setTourStep(0);
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 0) {
      const prevIdx = tourStep - 1;
      setTourStep(prevIdx);
      const stop = TOUR_STOPS[prevIdx];
      setCameraPreset(stop.camera);
      scrubToStage(stop.stage);
    }
  };

  const startTour = () => {
    setIsTourActive(true);
    setTourStep(0);
    const stop = TOUR_STOPS[0];
    setCameraPreset(stop.camera);
    scrubToStage(stop.stage);
  };

  const statusChip = currentState.operating_status_chip;

  return (
    <div className="integrated-twin-workspace">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR: Industrial Rig Telemetry, Wellhead Specs & Provenance */}
      {/* ========================================================================= */}
      <header className="twin-top-header">
        <div className="header-left-cluster">
          <div className="well-id-badge">
            <span className="dot-live pulse"></span>
            <span className="well-label font-mono font-bold">WELL BW-01</span>
            <span className="basin-label">BAGHEWALA &bull; RAJASTHAN</span>
          </div>

          <div className="stage-pill">
            <span className="stage-indicator-badge font-mono">{formatPhase(currentState.phase)}</span>
            <span className="text-secondary font-medium text-xs">{formatStage(currentState.scrub_stage, 8)}</span>
          </div>

          <div className={`status-chip-industrial chip-${statusChip.tone}`}>
            {statusChip.tone === 'danger' && <AlertTriangle size={14} className="mr-1" />}
            {statusChip.tone === 'healthy' && <CheckCircle2 size={14} className="mr-1" />}
            {statusChip.tone === 'process' && <Flame size={14} className="mr-1" />}
            <span>{statusChip.text}</span>
          </div>
        </div>

        {/* Settled View Presets Bar in Header */}
        <div className="view-presets-header font-mono">
          <span className="text-xxs font-bold text-secondary mr-1">VIEWS:</span>
          <button 
            className={`btn-header-view ${cameraPreset === 'full-field' ? 'active' : ''}`}
            onClick={() => setCameraPreset('full-field')}
            title="Full Field Overview [Key 1]"
          >
            🌐 Full Field
          </button>
          <button 
            className={`btn-header-view ${cameraPreset === 'steam-facility' ? 'active' : ''}`}
            onClick={() => setCameraPreset('steam-facility')}
            title="Steam Boiler Facility [Key 2]"
          >
            🏭 Steam Plant
          </button>
          <button 
            className={`btn-header-view ${cameraPreset === 'wellbore-pump' ? 'active' : ''}`}
            onClick={() => setCameraPreset('wellbore-pump')}
            title="Wellhead & Sucker Rod Pump [Key 3]"
          >
            🛢️ Well & Pump
          </button>
          <button 
            className={`btn-header-view ${cameraPreset === 'reservoir-cutaway' ? 'active' : ''}`}
            onClick={() => setCameraPreset('reservoir-cutaway')}
            title="Underground Reservoir Cutaway [Key 4]"
          >
            🔥 Reservoir
          </button>
          <button 
            className={`btn-header-view ${cameraPreset === 'surface-production' ? 'active' : ''}`}
            onClick={() => setCameraPreset('surface-production')}
            title="Separator & Storage Tanks [Key 5]"
          >
            🧪 Tanks
          </button>
          <button 
            className={`btn-header-view ${cameraPreset === 'top-down' ? 'active' : ''}`}
            onClick={() => setCameraPreset('top-down')}
            title="Top-Down Plan View"
          >
            📐 Top-Down
          </button>
        </div>

        <div className="header-right-cluster">
          {/* Main Direct Simulation Action Button with Prescribed Cycle handling */}
          <button 
            className={`btn-sim-run ${isPlaying ? 'simulating' : (isCycleCompleted || inputs.scrub_stage >= 8.0) ? 'cycle-complete' : ''}`}
            onClick={toggleSimulationRun}
            title={
              isPlaying 
                ? "Pause automated CSS simulation" 
                : (isCycleCompleted || inputs.scrub_stage >= 8.0) 
                  ? "Prescribed cycle completed. Click to re-run from Stage 1.0" 
                  : inputs.scrub_stage > 1.0 
                    ? "Resume prescribed CSS cycle" 
                    : "Run prescribed CSS cycle across all 8 stages"
            }
            style={{ padding: '6px 16px', fontSize: '0.8rem', fontWeight: 800 }}
          >
            {isPlaying ? (
              <Pause size={14} />
            ) : (isCycleCompleted || inputs.scrub_stage >= 8.0) ? (
              <RotateCcw size={14} />
            ) : (
              <Play size={14} />
            )}
            <span>
              {isPlaying 
                ? 'PAUSE SIMULATION' 
                : (isCycleCompleted || inputs.scrub_stage >= 8.0) 
                  ? '↺ RE-RUN PRESCRIBED CYCLE' 
                  : inputs.scrub_stage > 1.0 
                    ? '▶ RESUME SIMULATION' 
                    : '▶ RUN PRESCRIBED CYCLE'}
            </span>
          </button>

          {/* Fullscreen 3D Toggle */}
          <button 
            className="btn-header-action"
            onClick={toggle3DFullscreen}
            title={is3DFullscreen ? "Exit Fullscreen" : "Maximize 3D view to full screen"}
          >
            {is3DFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{is3DFullscreen ? 'Exit Full' : '⛶ Fullscreen'}</span>
          </button>

          {/* Scientific Model Badge */}
          <div className="model-chip" title="Coupled Marx-Langenheim + Vogel IPR + ExtraTrees V1.3 Hybrid">
            <Zap size={13} className="text-amber mr-1" />
            <span className="text-xs font-mono text-secondary">ExtraTrees V1.3</span>
          </div>

          {/* Diagnostics & Curves Trigger */}
          <button 
            className="btn-header-action btn-analytics-trigger"
            onClick={() => setShowAnalyticsModal(true)}
            title="Open Dynamometer Cards, IPR Curves, and Energy Sankey"
          >
            <Activity size={14} className="text-teal" />
            <span>Diagnostics & Curves</span>
          </button>

          {/* Data Provenance Popover Pill */}
          <button 
            className="btn-provenance-pill"
            onClick={() => setShowProvenanceModal(true)}
            title="Inspect Data Provenance & Calibration Disclosure"
          >
            <Shield size={14} className="text-teal" />
            <span>Provenance</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 3D WORKSPACE: Full Panoramic Digital Twin Stage                  */}
      {/* ========================================================================= */}
      <div className={`twin-middle-body ${is3DFullscreen ? 'fullscreen-stage' : ''}`}>
        <div className="threejs-canvas-wrapper">
          <IntegratedTwin3D 
            twinState={currentState}
            ghostMode={ghostMode}
            xraySurface={xraySurface}
            layerToggles={layers}
            activeCameraPreset={cameraPreset}
            onCameraChange={(p) => setCameraPreset(p)}
            onSelectComponent={(comp) => {
              if (comp.id === 'steam-generator' && onNavigateDetail) onNavigateDetail('steam');
              if (comp.id === 'wellhead-pump' && onNavigateDetail) onNavigateDetail('well');
              if (comp.id === 'reservoir-formation' && onNavigateDetail) onNavigateDetail('reservoir');
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTLED DIGITAL TWIN COCKPIT: Inputs | Coupled Timeline | Live Outcomes */}
      {/* ========================================================================= */}
      <footer className="twin-settled-cockpit">
        {/* COLUMN 1: DRIVERS / PARAMETERS THAT ARE CHANGED */}
        <div className="cockpit-column cockpit-inputs">
          <div className="cockpit-col-header">
            <div className="flex-center gap-1">
              <Sliders size={14} className="text-orange" />
              <span className="col-title font-mono">SIMULATION DRIVERS (INPUTS)</span>
            </div>
            <button 
              className="btn-text-subtle font-mono" 
              onClick={resetAllToBaseline}
              title="Reset parameters to SSOT Baseline"
            >
              <RotateCcw size={12} className="inline mr-1" />
              Reset
            </button>
          </div>

          <div className="cockpit-sliders-grid">
            {/* Steam Rate Slider */}
            <div className="cockpit-slider-card">
              <div className="slider-meta">
                <span className="param-label">Steam Rate</span>
                <span className="param-badge font-mono text-cyan">{inputs.steam_rate_tpd} t/d</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="280" 
                step="5"
                value={inputs.steam_rate_tpd} 
                onChange={(e) => handleInputChange('steam_rate_tpd', e.target.value, 'Steam Rate', 't/d')}
                className="cockpit-range slider-blue"
              />
            </div>

            {/* Steam Temp Slider */}
            <div className="cockpit-slider-card">
              <div className="slider-meta">
                <span className="param-label">Steam Temp</span>
                <span className="param-badge font-mono text-orange">{inputs.steam_temp_c} °C</span>
              </div>
              <input 
                type="range" 
                min="150" 
                max="350" 
                step="1"
                value={inputs.steam_temp_c} 
                onChange={(e) => handleInputChange('steam_temp_c', e.target.value, 'Steam Temp', '°C')}
                className="cockpit-range slider-orange"
              />
            </div>

            {/* Pumping SPM Slider */}
            <div className="cockpit-slider-card">
              <div className="slider-meta">
                <span className="param-label">Pumping Speed</span>
                <span className="param-badge font-mono text-teal">{inputs.spm} SPM</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="5.0" 
                step="0.1"
                value={inputs.spm} 
                onChange={(e) => handleInputChange('spm', e.target.value, 'Pumping Speed', 'SPM')}
                className="cockpit-range slider-teal"
              />
            </div>

            {/* Injection Days Slider */}
            <div className="cockpit-slider-card">
              <div className="slider-meta">
                <span className="param-label">Injection Days</span>
                <span className="param-badge font-mono text-primary">{inputs.injection_days} days</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="45" 
                step="1"
                value={inputs.injection_days} 
                onChange={(e) => handleInputChange('injection_days', e.target.value, 'Injection Days', 'days')}
                className="cockpit-range"
              />
            </div>
          </div>

          {/* Quick Scenario Chips */}
          <div className="cockpit-scenarios-row font-mono">
            <span className="text-xxs text-secondary">PRESETS:</span>
            {SCENARIO_PRESETS.slice(0, 5).map((sc) => (
              <button
                key={sc.id}
                className={`btn-chip-compact ${activePreset === sc.id ? 'active' : ''}`}
                onClick={() => applyPreset(sc)}
                title={sc.desc}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMN 2: 8-STAGE COUPLED TIMELINE & PROGRESS */}
        <div className="cockpit-column cockpit-timeline">
          <div className="cockpit-col-header">
            <div className="flex-center gap-1">
              <Flame size={14} className="text-rose" />
              <span className="col-title font-mono">COUPLED CYCLE TIMELINE (STAGE {Math.round(timelineStage)}/8)</span>
            </div>
            <div className="flex-center gap-1 font-mono">
              <button 
                className={`btn-cockpit-sim-toggle ${isPlaying ? 'simulating' : (isCycleCompleted || inputs.scrub_stage >= 8.0) ? 'cycle-complete' : ''}`}
                onClick={toggleSimulationRun}
                title={isPlaying ? "Pause simulation" : (inputs.scrub_stage >= 8.0 ? "Re-run prescribed cycle" : "Run prescribed cycle")}
              >
                {isPlaying ? <Pause size={11} /> : (inputs.scrub_stage >= 8.0 || isCycleCompleted) ? <RotateCcw size={11} /> : <Play size={11} />}
                <span>{isPlaying ? 'Pause' : (inputs.scrub_stage >= 8.0 || isCycleCompleted) ? 'Re-run' : 'Run'}</span>
              </button>
              <div className="cycle-mode-selector">
                <button 
                  className={`btn-cycle-mode ${cycleMode === '1-cycle' ? 'active' : ''}`}
                  onClick={() => setCycleMode('1-cycle')}
                  title="Run 1 prescribed cycle (Stage 1 to 8) and stop automatically"
                >
                  1 Cycle
                </button>
                <button 
                  className={`btn-cycle-mode ${cycleMode === 'continuous' ? 'active' : ''}`}
                  onClick={() => setCycleMode('continuous')}
                  title="Run continuously in a loop"
                >
                  Loop ∞
                </button>
              </div>
              <span className="text-xxs text-secondary ml-1">SPD:</span>
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  className={`btn-spd-pill ${playbackSpeed === spd ? 'active' : ''}`}
                  onClick={() => setPlaybackSpeed(spd)}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Scrubber bar */}
          <div className="cockpit-scrubber-bar">
            <input 
              type="range"
              min="1.0"
              max="8.0"
              step="0.05"
              value={timelineStage}
              onChange={(e) => scrubToStage(parseFloat(e.target.value))}
              className="scrubber-range-slider"
            />
            <div 
              className="scrubber-fill-bar" 
              style={{ width: `${((timelineStage - 1.0) / 7.0) * 100}%` }}
            ></div>
          </div>

          {/* 8 Stage Markers */}
          <div className="cockpit-stages-strip font-mono">
            {STAGE_STEPS.map((stg) => {
              const isActive = Math.round(timelineStage) === stg.id;
              const isPassed = timelineStage >= stg.id;
              return (
                <button 
                  key={stg.id}
                  className={`stage-pill-node ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                  onClick={() => scrubToStage(stg.id)}
                  title={`${stg.label} - ${stg.sub}`}
                >
                  <span className="node-num">{stg.id}</span>
                  <span className="node-label">{stg.label.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Status readout with Prescribed Cycle completion state */}
          <div className="cockpit-cycle-status font-mono">
            {(isCycleCompleted || inputs.scrub_stage >= 8.0) ? (
              <span className="cycle-badge-complete">
                <CheckCircle2 size={12} className="inline mr-1 text-emerald" />
                PRESCRIBED CYCLE COMPLETE (35.0 DAYS · 8 STAGES)
              </span>
            ) : isPlaying ? (
              <span className="cycle-badge-running">
                <span className="pulse-dot"></span>
                RUNNING PRESCRIBED CYCLE · STAGE {Math.round(timelineStage)}/8 ({inputs.elapsed_days.toFixed(1)}d)
              </span>
            ) : (
              <span className="text-secondary text-xxs">
                ELAPSED: {inputs.elapsed_days.toFixed(1)} DAYS · STAGE {timelineStage.toFixed(1)}/8
              </span>
            )}
            <div className="flex-center gap-2">
              <button 
                className="btn-link-action" 
                onClick={() => {
                  setInputs(prev => ({ ...prev, scrub_stage: 1.0, elapsed_days: 0.0 }));
                  setTimelineStage(1.0);
                  setIsCycleCompleted(false);
                }}
                title="Reset simulation to Stage 1.0 Baseline"
              >
                <RotateCcw size={11} className="inline mr-1" />
                Reset Stage 1
              </button>
              <button className="btn-link-action" onClick={handleOpenCompare}>
                <GitCompare size={12} className="inline mr-1" />
                Compare Scenarios
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 3: DIGITAL TWIN OUTCOMES & PHYSICAL RESPONSE */}
        <div className="cockpit-column cockpit-outcomes">
          <div className="cockpit-col-header">
            <div className="flex-center gap-1">
              <Activity size={14} className="text-teal" />
              <span className="col-title font-mono">LIVE DIGITAL TWIN OUTCOMES</span>
            </div>
            <button 
              className="btn-text-subtle font-mono text-teal" 
              onClick={() => setShowAnalyticsModal(true)}
              title="Open full diagnostic graphs, dynamometer card, and energy Sankey"
            >
              Curves & Diagnostics →
            </button>
          </div>

          <div className="cockpit-kpi-grid">
            {/* Effective Viscosity Tile */}
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Effective Viscosity</span>
              <div className="flex-center gap-1">
                <span className="kpi-mini-val font-mono text-teal">
                  {formatValue(currentState.reservoir.wellbore_viscosity_cp, { precision: 1, unit: 'cP' })}
                </span>
                <span className="kpi-badge-pill badge-emerald font-mono">
                  -{formatValue(currentState.reservoir.viscosity_reduction_pct, { precision: 0 })}%
                </span>
              </div>
              <span className="kpi-mini-sub font-mono">Native: 14,500 cP</span>
            </div>

            {/* Wellbore Temp Tile */}
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Wellbore Temp</span>
              <span className="kpi-mini-val font-mono text-rose">
                {formatTemp(currentState.reservoir.wellbore_temperature_c, 1)}
              </span>
              <span className="kpi-mini-sub font-mono">Native: 48°C</span>
            </div>

            {/* Inflow BOPD Tile */}
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Inflow (Vogel IPR)</span>
              <span className="kpi-mini-val font-mono text-primary">
                {formatBOPD(currentState.reservoir.max_theoretical_inflow_bopd, 1)}
              </span>
              <span className="kpi-mini-sub font-mono">qMax Potential</span>
            </div>

            {/* Heated Chamber Radius */}
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Heated Radius (rh)</span>
              <span className="kpi-mini-val font-mono text-amber">
                {formatValue(currentState.reservoir.heated_radius_m, { precision: 1, unit: 'm' })}
              </span>
              <span className="kpi-mini-sub font-mono">Steam Front</span>
            </div>

            {/* Flowing Pwf Tile */}
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Flowing Pwf</span>
              <span className="kpi-mini-val font-mono text-secondary">
                {formatPressure(currentState.reservoir.flowing_bottomhole_pressure_psia, 'psia', 1)}
              </span>
              <span className="kpi-mini-sub font-mono">Bottomhole</span>
            </div>

            {/* Pump Fillage Tile */}
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Pump Fillage</span>
              <span className={`kpi-mini-val font-mono ${currentState.well_and_pump.pump_fillage_pct < 60 ? 'text-rose' : 'text-emerald'}`}>
                {formatPercent(currentState.well_and_pump.pump_fillage_pct, 1)}
              </span>
              <span className="kpi-mini-sub font-mono">SRP Balance</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. MODALS & POPUPS: P&ID-Lite Overlay, Data Provenance, Scenario Compare   */}
      {/* ========================================================================= */}
      
      {/* P&ID-Lite Industrial Schematic Overlay (D10) */}
      <PidLiteOverlay 
        visible={showPidOverlay} 
        onClose={() => setShowPidOverlay(false)} 
        state={currentState}
        onToggleValve={(valveId) => {
          if (valveId === 'V-101') {
            setInputs(p => ({ ...p, steam_rate_tpd: p.steam_rate_tpd > 0 ? 0 : 140 }));
          }
        }}
        onEmergencyTrip={() => {
          setInputs(p => ({ ...p, steam_rate_tpd: 0, pump_active: false, spm: 0 }));
        }}
      />

      {/* Data Provenance Modal */}
      {showProvenanceModal && (
        <div className="modal-backdrop-blur" onClick={() => setShowProvenanceModal(false)}>
          <div className="modal-industrial-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="flex-center gap-2">
                <Shield size={18} className="text-teal" />
                <h3 className="modal-title font-bold">DATA PROVENANCE & CALIBRATION DISCLOSURE</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowProvenanceModal(false)}>&times;</button>
            </div>
            <div className="modal-body-content">
              <p className="disclosure-lead">
                Baghewala Heavy Oil Field (Well BW-01) digital twin combines field operational constraints, empirical thermodynamic equations, and machine-learning regressors:
              </p>
              
              <div className="provenance-sections-grid">
                <div className="prov-card prov-measured">
                  <div className="prov-badge">MEASURED SENSORS</div>
                  <ul>
                    <li>Wellhead Pumping Speed (2.0 SPM)</li>
                    <li>Stroke Length (100 in, Mark II geometry)</li>
                    <li>Surface Electric Motor Draw (48.0 kW)</li>
                    <li>Wellhead Flowing Pressure (185 psia)</li>
                    <li>Water Cut (BSW 2.7%)</li>
                  </ul>
                </div>

                <div className="prov-card prov-calibrated">
                  <div className="prov-badge">ASSUMED CONSTANTS</div>
                  <ul>
                    <li>Pay Zone Depth (1050 m MD, Jodhpur sandstone)</li>
                    <li>Initial Reservoir Pressure (1520 psia)</li>
                    <li>Native Reservoir Temperature (48°C)</li>
                    <li>Native Crude Viscosity (14,500 cP @ 48°C)</li>
                    <li>Net Pay Thickness (28.0 m)</li>
                  </ul>
                </div>

                <div className="prov-card prov-simulated">
                  <div className="prov-badge">SIMULATED MODELS</div>
                  <ul>
                    <li>Marx-Langenheim Radial Heat Front Growth</li>
                    <li>Conductive Soak & Decay Temperature Profile</li>
                    <li>Andrade Dynamic Viscosity Correlation</li>
                    <li>Vogel Inflow Performance Relationship (IPR)</li>
                    <li>API 11L Pump Kinematics & Fillage Balance</li>
                  </ul>
                </div>

                <div className="prov-card prov-ml">
                  <div className="prov-badge">ML FORECASTER</div>
                  <ul>
                    <li>V1.3 Two-Stage ExtraTrees Hybrid Forecaster</li>
                    <li>50 surface operational features input schema</li>
                    <li>Zero-rate classifier hurdle cutoff: 0.1500</li>
                    <li>ENR004 proxy training basis (Field unvalidated)</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <span className="text-xs font-mono text-secondary">Baghewala Well BW-01 &bull; SIH26120 Technical Entry</span>
              <button className="btn-confirm-modal" onClick={() => setShowProvenanceModal(false)}>Acknowledge</button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Compare Modal */}
      {showCompareModal && compareData && (
        <div className="modal-backdrop-blur" onClick={() => setShowCompareModal(false)}>
          <div className="modal-industrial-card compare-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="flex-center gap-2">
                <GitCompare size={18} className="text-orange" />
                <h3 className="modal-title font-bold">SCENARIO COMPARATIVE EVALUATION</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowCompareModal(false)}>&times;</button>
            </div>
            <div className="modal-body-content">
              <p className="disclosure-lead">
                Side-by-side performance contrast evaluated using the coupled thermodynamic-lift engine:
              </p>
              <div className="table-responsive">
                <table className="compare-table font-mono">
                  <thead>
                    <tr>
                      <th className="text-left">Scenario</th>
                      <th>Flow Rate (BOPD)</th>
                      <th>Cum Oil (BBL)</th>
                      <th>Delta vs Base</th>
                      <th>SOR (m³/m³)</th>
                      <th>Power (kW)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map((sc) => (
                      <tr key={sc.scenario_id}>
                        <td className="font-bold text-left">{sc.name || sc.scenario_id}</td>
                        <td className="text-cyan">{sc.rate_bopd.toFixed(1)}</td>
                        <td className="text-primary">{sc.cum_oil_bbl.toLocaleString()}</td>
                        <td className={sc.delta_cum_bbl >= 0 ? 'text-emerald' : 'text-rose'}>
                          {sc.delta_cum_bbl >= 0 ? `+${sc.delta_cum_bbl.toLocaleString()}` : sc.delta_cum_bbl.toLocaleString()} ({sc.delta_pct}%)
                        </td>
                        <td className="text-purple">{sc.steam_oil_ratio.toFixed(2)}</td>
                        <td className="text-amber">{sc.total_power_kw.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-confirm-modal" onClick={() => setShowCompareModal(false)}>Close Comparison</button>
            </div>
          </div>
        </div>
      )}

    
      {/* Diagnostics & Curves Modal */}
      {showAnalyticsModal && (
        <div className="modal-backdrop-blur" onClick={() => setShowAnalyticsModal(false)}>
          <div className="modal-industrial-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="flex-center gap-2">
                <Activity size={18} className="text-teal" />
                <h3 className="modal-title font-bold">DIGITAL TWIN DIAGNOSTIC CURVES & ANALYTICS</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAnalyticsModal(false)}>&times;</button>
            </div>
            <div className="modal-body-content" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="dynamics-modal-grid">
                <DynamometerCard 
                  fillagePct={currentState.well_and_pump.pump_fillage_pct}
                  spm={currentState.well_and_pump.spm}
                  strokeIn={inputs.stroke_length_in}
                  rodStressPct={Number(((currentState.well_and_pump.rod_load_lbs / 22000.0) * 100).toFixed(1))}
                  gasInterference={currentState.well_and_pump.gas_interference}
                />
                <IprPumpCurve 
                  currentRate={currentState.well_and_pump.delivered_oil_rate_bopd}
                  qMax={currentState.reservoir.max_theoretical_inflow_bopd}
                  pumpCapacity={currentState.well_and_pump.nominal_capacity_bopd}
                  pwf={currentState.reservoir.flowing_bottomhole_pressure_psia}
                  pr={inputs.res_pressure_psia}
                />
                <ViscosityTempCurve 
                  currentTemp={currentState.reservoir.wellbore_temperature_c}
                  currentViscosity={currentState.reservoir.wellbore_viscosity_cp}
                  coldViscosity={TWIN_CONSTANTS.reservoir.native_viscosity_cp}
                />
                <RadialTempProfile 
                  heatedRadius={currentState.reservoir.heated_radius_m}
                  wellboreTemp={currentState.reservoir.wellbore_temperature_c}
                  nativeTemp={TWIN_CONSTANTS.reservoir.native_temperature_c}
                />
              </div>
            </div>
            <div className="modal-footer">
              <span className="text-xs font-mono text-secondary">Coupled Physics Engine &bull; Well BW-01 Analytical Suite</span>
              <button className="btn-confirm-modal" onClick={() => setShowAnalyticsModal(false)}>Close Diagnostics</button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
