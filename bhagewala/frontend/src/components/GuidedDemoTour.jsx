import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, X, Sparkles, Compass, Flame, Droplet, Cpu, Scale } from 'lucide-react';

export default function GuidedDemoTour({ 
  isActive, 
  onClose, 
  onNavigate,
  onStageChange 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const steps = [
    {
      title: "1. Subsurface Reservoir & Geological Dome",
      page: "overview",
      stage: 0,
      icon: Compass,
      color: "emerald",
      narration: "Welcome to the Baghewala Well-to-Surface Digital Twin. In the Bikaner-Nagaur basin, heavy crude is trapped in the Cambrian Jodhpur Sandstone at 1,050m depth beneath an impermeable Bilara dolomite caprock seal. At native 48°C, the 17.4° API bitumen is essentially solid tar at 14,500 cP.",
    },
    {
      title: "2. Cyclic Steam Stimulation (Huff Phase)",
      page: "overview",
      stage: 0,
      icon: Flame,
      color: "cyan",
      narration: "During the Huff phase, the OTS-50 surface boiler unit injects 140 TPD of superheated steam at 282°C and 68 bar down the wellbore annulus directly into the slotted casing perforations.",
    },
    {
      title: "3. Heat Soaking & Viscosity Collapse",
      page: "overview",
      stage: 1,
      icon: Sparkles,
      color: "rose",
      narration: "During the 6-day shut-in soak, conductive heat transfer equilibrates the rock matrix to ~195°C. According to the Andrade physics equation, viscosity plummets by 98.3% from 14,500 cP down to 245 cP, transforming immobile tar into free-flowing crude.",
    },
    {
      title: "4. Wellbore Production & Surface Facilities (Puff Phase)",
      page: "overview",
      stage: 3,
      icon: Droplet,
      color: "amber",
      narration: "The surface SRP nodding donkey operates at 2.0 SPM, lifting mobilized oil up the 1,050m tubing. Fluid passes through the wellhead Christmas tree into horizontal separator V-101 (degassing 620 MCFD solution gas) and into heated API 650 storage tanks.",
    },
    {
      title: "5. AI Production Forecasting (V1.3 Two-Stage ML)",
      page: "forecast",
      stage: 3,
      icon: Cpu,
      color: "amber",
      narration: "The V1.3 Hybrid Model ingests 50 operational features. An ExtraTrees classifier checks zero-production risk against a 0.1500 cutoff. If risk is low, the ExtraTrees regressor projects 453.9 BOPD; if shut-in risk is detected, persistence fallback is applied.",
    },
    {
      title: "6. Scenario Lab & Operational Trade-Offs",
      page: "scenarios",
      stage: 3,
      icon: Scale,
      color: "purple",
      narration: "Operators can compare Baseline Continuous Pumping against CSS Thermal Surges (780 BOPD) or high water-cut conditions, analyzing energy intensity (kWh/bbl) and mechanical rod load limits in real time.",
    },
  ];

  // Auto-advance step every 12 seconds when not paused
  useEffect(() => {
    if (!isActive || isPaused) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          return prev;
        }
        const next = prev + 1;
        executeStepAction(next);
        return next;
      });
    }, 12000);
    return () => clearInterval(timer);
  }, [isActive, isPaused, steps.length]);

  const executeStepAction = (stepIdx) => {
    const s = steps[stepIdx];
    if (onNavigate && s.page) onNavigate(s.page);
    if (onStageChange && s.stage !== undefined) onStageChange(s.stage);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      executeStepAction(next);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      executeStepAction(prev);
    }
  };

  if (!isActive) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '820px',
      zIndex: 1000,
      background: 'rgba(11, 17, 32, 0.96)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-metallic)',
      borderLeft: '4px solid var(--accent-amber)',
      borderRadius: 'var(--radius-xl)',
      padding: '18px 24px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(245, 158, 11, 0.25)',
      animation: 'slideUpFade 0.25s ease-out',
    }}>
      {/* Header Row */}
      <div className="flex-center justify-between mb-2 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex-center gap-2">
          <span className={`icon-badge bg-${step.color}-100 text-${step.color}-700`}>
            <StepIcon size={16} />
          </span>
          <div>
            <h4 className="text-sm font-bold text-white flex-center gap-2">
              {step.title}
              <span className="badge badge-amber font-mono text-xxs">SIH26120 Tour</span>
            </h4>
            <span className="text-xxs font-mono text-dim">
              Step {currentStep + 1} of {steps.length} &bull; Guided Judge Walkthrough
            </span>
          </div>
        </div>

        <div className="flex-center gap-2">
          <button 
            className="btn btn-secondary text-xxs py-1 px-2"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button 
            className="icon-btn text-dim hover:text-white"
            onClick={onClose}
            title="Exit Tour"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Narration Body */}
      <p className="text-xs text-slate-200 leading-relaxed mb-3">
        "{step.narration}"
      </p>

      {/* Progress Dots & Navigation Controls */}
      <div className="flex-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {/* Step dots */}
        <div className="flex-center gap-1.5">
          {steps.map((_, i) => (
            <span 
              key={i} 
              style={{
                width: i === currentStep ? '20px' : '7px',
                height: '7px',
                borderRadius: '4px',
                background: i === currentStep ? 'var(--accent-amber)' : 'var(--border-card)',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex-center gap-2">
          <button 
            className="btn btn-secondary text-xs py-1 px-3"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>
          <button 
            className="btn btn-primary text-xs py-1 px-3"
            onClick={handleNext}
          >
            <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
