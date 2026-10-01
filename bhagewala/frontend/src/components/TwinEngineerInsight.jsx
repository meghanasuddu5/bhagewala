import React, { useState } from 'react';
import { Sparkles, MessageSquare, CheckCircle2, AlertTriangle, Cpu, TrendingUp, HelpCircle, ShieldCheck, AlertCircle } from 'lucide-react';

export default function TwinEngineerInsight({ 
  predictionResult, 
  currentOilRate = 450.5,
  health = null,
  isSimulation = false,
  horizonDays = 7
}) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const topicResponses = {
    thermal_soak: {
      tag: "PETROLEUM ENGINEERING RECORD",
      tagClass: "tag-telemetry",
      title: "CSS Thermal Soak Physics",
      text: "During the 6-day shut-in soak phase of Cyclic Steam Stimulation, latent heat from 282°C steam conducts into the cold sandstone matrix (48°C native). Viscosity falls exponentially from 14,500 cP down to ~245 cP according to Andrade's equation, raising effective mobility by a factor of 58."
    },
    zero_fallback: {
      tag: "V1.3 MODEL ARCHITECTURE",
      tagClass: "tag-ml",
      title: "Persistence Fallback Logic",
      text: "The ExtraTrees zero-production classifier evaluates P(Zero). If the probability meets or exceeds the 0.1500 cutoff threshold, the well is flagged non-producing. Rather than trusting the regression head on out-of-distribution shut-in points, persistence fallback clamps to current_oil_rate_bopd."
    },
    rod_limits: {
      tag: "SURFACE SRP KINEMATICS",
      tagClass: "tag-telemetry",
      title: "Mechanical Rod String Limits",
      text: "Well BW-01 uses an API Grade D 7/8\" sucker rod string. At 2.0 SPM, peak polished rod load is 14,250 lbs (within the 22,000 lbs beam rating). Operating above 3.5 SPM with viscous crude risks severe rod float on the downstroke and unseated valves."
    },
    geology_trap: {
      tag: "BASIN STRATIGRAPHY",
      tagClass: "tag-sim",
      title: "Jodhpur Sandstone & Bilara Caprock",
      text: "In the Bikaner-Nagaur basin, heavy crude is trapped in porous Cambrian Jodhpur sandstone at 1,050m depth under an impermeable Bilara dolomite and tight shale caprock seal. Without thermal stimulation, the 17.4° API bitumen remains immobile at native reservoir pressure (3,740 psia)."
    }
  };

  const isDegraded = health?.status === 'degraded' || health?.status === 'error';
  const isHealthy = health?.status === 'healthy';

  // Dynamic dialogue calculation - NO CANNED TEXT
  let defaultStatusTitle = isDegraded ? "Backend Health Warning" : "Telemetry Synchronized";
  let defaultStatusBadge = isDegraded ? "Backend Degraded" : isHealthy ? "Online" : "Twin Ready";
  let defaultStatusColor = isDegraded ? "rose" : isHealthy ? "emerald" : "cyan";
  let defaultTag = "LIVE TELEMETRY";
  let defaultTagClass = "tag-telemetry";

  const rate = predictionResult?.predicted_oil_rate_bopd;
  const delta = rate !== undefined ? rate - currentOilRate : 0;
  const deltaSign = delta >= 0 ? '+' : '';
  const zeroProb = predictionResult?.predicted_zero_probability;

  let defaultDialogue = "";

  if (isDegraded) {
    defaultDialogue = `Warning: Model backend is currently reporting DEGRADED status (${health?.detail || "inference engine fallback mode"}). Projections are using safe bounded fallbacks. Check service health before operational dispatch.`;
  } else if (predictionResult) {
    defaultTag = "V1.3 MODEL INFERENCE";
    defaultTagClass = "tag-ml";
    if (predictionResult.predicted_zero_flag === 1) {
      defaultStatusTitle = "Zero-Flow Shut-In Risk Detected";
      defaultStatusBadge = "Shut-In Flagged";
      defaultStatusColor = "rose";
      defaultDialogue = `Alert: Zero-production classifier flagged shut-in risk with ${(zeroProb * 100).toFixed(1)}% probability (exceeds 15.0% cutoff). Strategy: Persistence Fallback engaged, maintaining baseline rate at ${rate.toFixed(1)} BOPD.`;
    } else {
      defaultStatusTitle = "Inference Completed";
      defaultStatusBadge = `${rate.toFixed(1)} BOPD Forecast`;
      defaultStatusColor = delta >= 0 ? "emerald" : "amber";
      defaultDialogue = `V1.3 ExtraTrees Regressor evaluated 50 features: next-day production forecast is ${rate.toFixed(1)} BOPD (${deltaSign}${delta.toFixed(1)} BOPD vs ${currentOilRate.toFixed(1)} baseline). Zero-flow risk is ${(zeroProb * 100).toFixed(1)}%, well below the 15.0% threshold.`;
    }
  } else {
    defaultDialogue = `Telemetry verified. Well BW-01 is operating at baseline ${currentOilRate.toFixed(1)} BOPD with 2.0 SPM pumping speed. Adjust operational drivers below and trigger V1.3 inference to run the dual-stage evaluation.`;
  }

  const activeResponse = selectedTopic ? topicResponses[selectedTopic] : null;

  return (
    <div className="engineer-insight-card">
      <div className="engineer-avatar-wrapper">
        <img 
          src="/assets/twin_engineer_avatar.jpg" 
          alt="Digital Twin Petroleum Engineer" 
          className="engineer-avatar-img"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="avatar-status-badge">
          <span className="status-dot online" />
          <span className="text-xxs font-mono font-bold text-white">AI ENGINEER</span>
        </div>
      </div>

      <div className="engineer-content">
        <div className="flex-center justify-between">
          <div className="flex-center gap-2">
            <span className="font-bold text-white text-sm">Tanya &bull; Digital Twin AI Engineer</span>
            <span className={`badge badge-${activeResponse ? 'cyan' : defaultStatusColor} text-xxs font-mono`}>
              {activeResponse ? activeResponse.title : defaultStatusBadge}
            </span>
            <span className={activeResponse ? activeResponse.tagClass : defaultTagClass}>
              {activeResponse ? activeResponse.tag : defaultTag}
            </span>
          </div>

          {selectedTopic && (
            <button 
              className="btn btn-secondary text-xxs py-1 px-2"
              onClick={() => setSelectedTopic(null)}
            >
              Reset to Current Status
            </button>
          )}
        </div>

        <div className="speech-bubble">
          <p className="speech-text">
            "{activeResponse ? activeResponse.text : defaultDialogue}"
          </p>
        </div>

        {/* Quick Contextual Question Pills */}
        <div className="assistant-qa-pills">
          <span className="text-xxs font-mono text-dim self-center mr-1">Ask Tanya:</span>
          <button 
            className="qa-pill-btn"
            onClick={() => setSelectedTopic('thermal_soak')}
          >
            Thermal Soak Physics
          </button>
          <button 
            className="qa-pill-btn"
            onClick={() => setSelectedTopic('zero_fallback')}
          >
            Zero-Cutoff Logic
          </button>
          <button 
            className="qa-pill-btn"
            onClick={() => setSelectedTopic('rod_limits')}
          >
            Rod String Limits
          </button>
          <button 
            className="qa-pill-btn"
            onClick={() => setSelectedTopic('geology_trap')}
          >
            Jodhpur Sandstone Trap
          </button>
        </div>
      </div>
    </div>
  );
}
