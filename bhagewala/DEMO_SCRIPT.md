# Baghewala Digital Twin (SIH26120): 3-Minute Grand Finale Judge Walkthrough

## Rapid Navigation Cheat Sheet
- **URL**: `http://127.0.0.1:8000/dashboard/`
- **Flagship Landing View**: **Integrated Production Twin** (Default top-level screen)
- **Theme**: Light Industrial Control Room (#EEF1F4 concrete canvas, #FFFFFF cards, 1px #D5DBE1 borders)
- **Controls**: Interactive Left Sliders (Steam, Pump, Reservoir) | Center 3D Viewport (>70% screen) | Right Telemetry & Diagnostic Visual Aids

---

## 3-Minute Demonstration Script

### Minute 0:00 – 0:45: The Problem & The Continuous 3D Cyber-Physical World
1. **The Hook & Problem Statement**:
   > *"Good morning, esteemed jury. Baghewala in Rajasthan's Bikaner-Nagaur basin holds India's heaviest crude reserves: 17.4° API heavy oil that is practically immovable at 14,500 cP under native 48°C reservoir conditions. 
   > Previously, digital twin prototypes were disconnected dashboards: adjusting steam or pump speed changed nothing across the system. We solved this by engineering the **Integrated Production Twin**: ONE continuous 3D world with a coupled thermodynamic-lift simulation engine where steam and pump drivers dynamically alter reservoir, wellbore, and surface behavior in real time."*

2. **Touring the Continuous 3D World (>70% Viewport)**:
   - Notice the **Light Industrial Theme**: Designed like a modern Siemens/ABB control room rather than a dark-mode gaming dashboard.
   - Point out the **Surface Facility**:
     - **OTSG Steam Generator**: High-pressure once-through steam box with structural I-beams, burner, and live stack thermal plume.
     - **Insulated Steam Line**: Featuring `CatmullRomCurve3` expansion loops, support stanchions, and control valve.
     - **Christmas Tree Wellhead**: Master valves with visible operating mode indicator (Huff steam in vs Puff production lift).
     - **Sucker Rod Pump (SRP)**: Samson post with X-bracing, walking beam, horsehead, rotating counterweights, and pitman arms executing authentic 4-bar linkage kinematics driving the polished rod at nominal SPM.
     - **Surface Separation & Storage**: Horizontal 3-phase test separator V-101 and twin API 650 cone-roof oil tanks with fluid levels rising dynamically with cumulative production.
   - Point out the **Subsurface Cutaway Block**:
     - Sliced earth block exposing 5 strata: Overburden shale, limestone, Bilara dolomite caprock, Jodhpur sandstone pay zone at 1050m depth, and basal water table.
     - **Multi-shell volumetric heat chamber** (#3B6EA8 to #FFF6E5) with dynamic 100°C, 150°C, and 200°C isotherm rings expanding into the pay zone.
     - **Fluid particles**: Injected steam condensing during Huff; mobilized oil particles accelerating into perforations as viscosity drops.

---

### Minute 0:45 – 1:30: The Coupled Simulation Engine & Signature Impact Ribbon
1. **Triggering the Signature Cause-and-Effect Impact Ribbon (D1)**:
   - On the left Controls panel, drag the **Steam Rate** slider from **140 TPD up to 200 TPD**:
   - Immediately point to the top of the 3D viewport:
     > *"Watch the animated Cause-and-Effect Impact Ribbon light up sequentially across 6 physical steps:*  
     > *Steam +42.9% $\rightarrow$ Heated Chamber +3.4m $\rightarrow$ Res Temp +18°C $\rightarrow$ Viscosity -68% $\rightarrow$ Inflow Surge +58 BOPD $\rightarrow$ Surface Rate +22 BOPD."*
2. **Coupled Reservoir-to-Pump Bottleneck Physics**:
   - Now throttle the **Pumping Speed (SPM)** slider from 2.0 down to **1.0 SPM**:
   - Show how the operating status chip smoothly transitions to **"Producing (Pump Capacity Limited)"**.
   - Open the **Right Panel "Dynamics" tab**:
     - **IPR vs Pump Curve (D5)**: The moving operating dot shifts down the Vogel curve, clearly revealing that the pump is now throttling production below what the heated reservoir can deliver.
     - **Pump Dynamometer Card (D3)**: Redrawn per stroke, showing a full load card.
   - Now switch the pump to **Cold Native Lift** (preset **"Pump Only"**):
     - The reservoir inflow collapses because viscosity is at 14,500 cP.
     - Dynamometer card immediately shows severe fluid pound and pump fillage drops to $<20\%$.
     - The status chip changes to **"Gas Interference (Fluid Pound)"**.

---

### Minute 1:30 – 2:15: Deep Diagnostic Visual Aids (D1–D14)
1. **Downhole Pump Inset (D4)**:
   - Point to the picture-in-picture floating overlay in the bottom-right corner of the 3D canvas:
   - Show the downhole pump barrel cross-section at 1050m depth: standing and traveling ball valves open and close in exact mechanical synchrony with the surface walking beam.
2. **P&ID-Lite Schematic Overlay (D10)**:
   - Click the **"P&ID Schematic"** button in the viewport action bar:
   - An engineering process schematic overlays the screen showing live flow paths, stream pressures (68 bar steam, 185 psia wellhead), temperatures, and interactive valve toggles.
3. **Ghost Baseline Comparison (D2)**:
   - Toggle **"Ghost Baseline"**: A translucent wireframe of the baseline heat chamber and production line appears, allowing judges to visually measure the incremental heat volume at a glance.
4. **Thermal & Energy Analytics**:
   - Switch right panel to **"Thermal"**: View the Andrade Viscosity-Temperature Curve (D6), Radial Temperature Profile $T(r)$ (D7), and 2D Heat Mini-Map (D9).
   - Switch right panel to **"Sankey"**: View the full Energy and Mass Flow Sankey Diagram (D8) tracking thermal MW in, reservoir storage, oil lifted, and pump motor electric power.

---

### Minute 2:15 – 3:00: Transport Timeline, Preset Scenarios & Jury Interrogation Answers
1. **Interactive 8-Stage Timeline Scrubber**:
   - Scrub the bottom transport slider across the 8 stages:
     `Initial (Cold)` $\rightarrow$ `Steam In (Huff)` $\rightarrow$ `Heat Spreads` $\rightarrow$ `Viscosity Falls` $\rightarrow$ `Oil Mobilizes` $\rightarrow$ `Pump Lifts` $\rightarrow$ `Surface Flow` $\rightarrow$ `AI Forecast Horizon`.
   - Point out that scrubbing forward and backward is 100% deterministic and cache-backed.
2. **Scenario Comparison**:
   - Click **"Compare Scenarios"** in the bottom dock:
   - A multi-scenario matrix opens comparing Baseline, Combined Peak, Steam Only, and Cold Lift across Flow Rate, Cumulative Barrels, Delta %, SOR, and Electrical kW.

---

## The 3 Critical Jury Interrogation Defenses

### Question 1: "What data is this model trained on?"
> **Your Answer**:  
> *"Our AI production forecaster is the **Two-Stage ExtraTrees V1.3 Hybrid Model** trained on 50 operational and surface features from the **ENR004 heavy oil production dataset**, utilizing a 0.1500 zero-rate classification cutoff to govern persistence fallback.  
> We want to be completely scientifically honest: the ML model was trained on surface operational features, **not** on steam thermodynamic parameters. Therefore, we do **not** fake an ML sensitivity to steam by multiplying by arbitrary factors. Instead, our digital twin presents the **ML next-day forecast (ENR004-trained)** side-by-side with our **coupled simulation-derived estimate**, disclosing the exact variance between empirical data and thermodynamic physics."*

### Question 2: "What is simulated vs what is measured?"
> **Your Answer**:  
> *(Click the **"Data: Proxy (ENR004) + Simulation"** pill in the top header bar to display the disclosure modal)*  
> *"We maintain a strict 5-tier provenance taxonomy registered across every telemetry point:  
> 1. **MEASURED**: Physical field telemetry (pumping SPM, polished rod stroke, surface casing pressure, motor power).  
> 2. **PROXY**: Heavy-oil operational training features derived from the ENR004 analog dataset.  
> 3. **ML**: Two-Stage ExtraTrees V1.3 hybrid forecaster predictions.  
> 4. **SIMULATED**: Physics-coupled thermal-lift simulation outputs (Marx-Langenheim radial chamber expansion $r_h$, Vogel IPR inflow, fluid level balance, and API 11L kinematics).  
> 5. **ASSUMED**: Published geological baselines for Baghewala Jodhpur Sandstone (depth 1,050m, native viscosity 14,500 cP @ 48°C, stimulated viscosity 245 cP @ 195°C, initial pressure 3,740 psia).  
> Notice that we ban misleading buzzwords like 'Audited' or 'Metered'—our system provides genuine scientific transparency."*

### Question 3: "How would you validate this digital twin on real Baghewala field data?"
> **Your Answer**:  
> *"Validation follows a 3-step field calibration protocol:  
> 1. **Downhole Memory Gauge History Matching**: Run bottomhole pressure and temperature surveys during the 5–7 day soak period to calibrate the thermal diffusivity ($\alpha$) and heat-loss coefficient in the Marx-Langenheim equation against real thermocouple logs.  
> 2. **Dynamometer Card Matching**: Ingest real polished rod load-cell telemetry from the wellhead beam to tune our API 11L kinematic damping factors and fluid pound detection thresholds.  
> 3. **Transfer Learning / Fine-Tuning**: Retrain the ExtraTrees V1.3 regressor by replacing the ENR004 proxy features with actual Baghewala well BW-01 SCADA history (daily oil/water rates, casing pressures, and steam injection logs), maintaining the 0.1500 zero-classifier hurdle to guard against shut-in hallucinations."*
