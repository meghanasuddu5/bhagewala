import React from 'react';
import { 
  Flame, Droplet, ArrowRight, ShieldCheck, Thermometer, 
  MapPin, Wind, Sparkles, Layers, Activity
} from 'lucide-react';
import { TWIN_CONSTANTS } from '../constants/twinConstants';

export default function FieldStoryGuide() {
  return (
    <div className="field-story-container">
      {/* Visual Hero Banner with Photo and Thematic Overlay */}
      <div className="hero-banner-card card-light shadow-md">
        <div className="hero-banner-image-wrapper">
          <img 
            src="/assets/baghewala_hero.jpg" 
            alt="Baghewala Heavy Oil Field, Rajasthan" 
            className="hero-banner-img"
          />
          <div className="hero-image-overlay">
            <div className="hero-tag-group">
              <span className="badge badge-amber font-mono">
                <MapPin size={12} /> BIKANER-NAGAUR BASIN, RAJASTHAN
              </span>
              <span className="badge badge-blue font-mono">
                <Flame size={12} /> THERMAL CSS RECOVERY ASSET
              </span>
            </div>
            <h2 className="hero-banner-title">
              Baghewala Heavy Oil Digital Twin
            </h2>
            <p className="hero-banner-desc">
              Unlocking India's heaviest oil reserves through AI-synchronized Cyclic Steam Stimulation (CSS) and surface sucker rod pumping telemetry.
            </p>
          </div>
        </div>

        {/* 3 Quick Field Highlights Bar */}
        <div className="hero-highlights-strip">
          <div className="highlight-item">
            <span className="highlight-num text-amber-700">{TWIN_CONSTANTS.reservoir.native_viscosity_cp.toLocaleString()} cP</span>
            <span className="highlight-desc">Native Dead Oil Viscosity @ {TWIN_CONSTANTS.reservoir.native_temperature_c}&deg;C (Tar-like consistency)</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-num text-blue-700">{TWIN_CONSTANTS.steam.steam_temperature_c}&deg;C / {TWIN_CONSTANTS.steam.steam_pressure_bar} Bar</span>
            <span className="highlight-desc">Superheated Steam Injection for Thermal Viscosity Reduction</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-num text-emerald-700">{TWIN_CONSTANTS.reservoir.top_depth_m.toLocaleString()} m TVD</span>
            <span className="highlight-desc">Target Sandstone Formation with {TWIN_CONSTANTS.reservoir.net_pay_thickness_m}m Net Pay Thickness</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-num text-purple-700">V1.3-Hybrid</span>
            <span className="highlight-desc">50-Feature Two-Stage ExtraTrees ML Production Forecaster</span>
          </div>
        </div>
      </div>

      {/* 3D Cutaway Diagram & CSS Process Walkthrough */}
      <div className="css-walkthrough-grid">
        {/* Left: 3D Geological Cutaway Image */}
        <div className="diagram-card card-light shadow-md">
          <div className="diagram-card-header">
            <div className="flex-center gap-2">
              <span className="icon-badge bg-amber-100 text-amber-700">
                <Layers size={18} />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Cyclic Steam Stimulation (CSS) Architecture</h3>
                <p className="text-xs text-slate-500">Subsurface thermal chamber & wellbore fluid dynamics</p>
              </div>
            </div>
          </div>

          <div className="diagram-img-box">
            <img 
              src="/assets/css_thermal_diagram.jpg" 
              alt="Cyclic Steam Stimulation 3D Cutaway" 
              className="cutaway-img"
            />
          </div>

          <div className="diagram-caption">
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>How it works:</strong> The high-pressure steam boiler facility pumps 282&deg;C steam down into the 1,050m formation. The heat melts the highly viscous heavy crude, reducing viscosity by 98% and allowing the sucker rod pump to lift the fluid to surface processing separators.
            </p>
          </div>
        </div>

        {/* Right: The 3-Step Thermal Lifecycle */}
        <div className="cycle-steps-card card-light shadow-md">
          <div className="cycle-header">
            <div className="flex-center gap-2">
              <span className="icon-badge bg-rose-100 text-rose-700">
                <Thermometer size={18} />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-base">The 3-Phase Thermal Cycle</h3>
                <p className="text-xs text-slate-500">Huff-and-Puff operational sequence for Well BW-01</p>
              </div>
            </div>
          </div>

          <div className="cycle-steps-list">
            {/* Step 1 */}
            <div className="cycle-step-item">
              <div className="step-circle bg-blue-600 text-white">1</div>
              <div className="step-info">
                <div className="flex-center gap-2">
                  <h4 className="step-heading text-blue-900">Phase 1: Steam Injection ("Huff")</h4>
                  <span className="badge badge-blue">~14-21 Days</span>
                </div>
                <p className="step-text">
                  Steam injected at 140 TPD (tonnes/day) under 68 bar pressure. The thermal steam front penetrates radial sandstone pores, breaking the heavy hydrocarbon chains.
                </p>
                <div className="step-stats font-mono">
                  <span>Steam Quality: 81%</span> &bull; <span>Temp: 282&deg;C</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="cycle-step-item">
              <div className="step-circle bg-rose-600 text-white">2</div>
              <div className="step-info">
                <div className="flex-center gap-2">
                  <h4 className="step-heading text-rose-900">Phase 2: Thermal Soaking ("Soak")</h4>
                  <span className="badge badge-rose">~5-7 Days</span>
                </div>
                <p className="step-text">
                  Well is shut in. Heat conducts through the formation rock matrix. The oil viscosity plummets exponentially from 14,000 cP down to ~250 cP near the wellbore.
                </p>
                <div className="step-stats font-mono text-rose-700">
                  <span>Viscosity Drop: 98.2%</span> &bull; <span>Heat Front: ~18m Radius</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="cycle-step-item">
              <div className="step-circle bg-amber-600 text-white">3</div>
              <div className="step-info">
                <div className="flex-center gap-2">
                  <h4 className="step-heading text-amber-900">Phase 3: Production Flow ("Puff")</h4>
                  <span className="badge badge-amber">~60-120 Days</span>
                </div>
                <p className="step-text">
                  Sucker Rod Pump is activated at 2.0-3.0 SPM. Mobilized heavy oil surges into the perforated casing and is pumped to surface separators for dehydration.
                </p>
                <div className="step-stats font-mono text-amber-700">
                  <span>Initial Surge: ~780 BOPD</span> &bull; <span>Stabilized: ~450 BOPD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
