/**
 * Baghewala Well-to-Surface Digital Twin — Single Source Data Provenance Registry
 * 
 * Strict Classification (SIH26120 National Finale Grade):
 * - MEASURED: Real physical well telemetry from identified Baghewala sensor/SCADA (reserved for real field RTU).
 * - PROXY: Historical proxy benchmark dataset (ENR004 heavy oil analog, 48 wells).
 * - ML: ExtraTrees Regressor V1.3 inference pipeline.
 * - SIMULATED: First-principles coupled thermal-lift engineering physics model.
 * - ASSUMED: Published Jodhpur sandstone geological parameters or operator scenario assumptions.
 * 
 * BANNED WORDS: "Audited", "Calibrated", "Metered" (unless backed by physical primary field records).
 */

import React from 'react';

export const PROVENANCE_CLASSES = {
  MEASURED: {
    code: 'MEASURED',
    label: 'Measured',
    badgeClass: 'badge-emerald',
    description: 'Physical sensor telemetry from Baghewala wellhead/RTU (reserved for field RTU integration)',
    color: 'var(--accent-emerald, #10b981)',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  PROXY: {
    code: 'PROXY',
    label: 'Proxy (ENR004)',
    badgeClass: 'badge-purple',
    description: 'Derived from historical heavy oil benchmark dataset ENR004 (15,699 daily logs across 48 wells)',
    color: 'var(--accent-purple, #a855f7)',
    bg: 'rgba(168, 85, 247, 0.12)',
  },
  ML: {
    code: 'ML',
    label: 'ML Inference',
    badgeClass: 'badge-cyan',
    description: 'ExtraTrees Regressor V1.3 pipeline (50 feature lags, 0.1500 zero-cutoff hurdle model)',
    color: 'var(--accent-cyan, #06b6d4)',
    bg: 'rgba(6, 182, 212, 0.12)',
  },
  SIMULATED: {
    code: 'SIMULATED',
    label: 'Simulated',
    badgeClass: 'badge-blue',
    description: 'Coupled thermal-lift engineering physics model (Marx-Langenheim, Andrade, Vogel IPR, API RP 11L)',
    color: 'var(--accent-blue, #3b82f6)',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  ASSUMED: {
    code: 'ASSUMED',
    label: 'Assumed / Constant',
    badgeClass: 'badge-slate',
    description: 'Published Baghewala Jodhpur Sandstone literature constant or operator scenario input',
    color: 'var(--ink-muted, #64748b)',
    bg: 'rgba(100, 116, 139, 0.12)',
  },
};

export const QUANTITY_REGISTRY = {
  // Reservoir static
  top_depth_m: { class: 'ASSUMED', label: 'Top Depth', source: 'Published Jodhpur Sandstone geology (1,050 m)' },
  net_pay_m: { class: 'ASSUMED', label: 'Net Pay', source: 'Published stratigraphic logs (28 m)' },
  initial_pressure_psia: { class: 'ASSUMED', label: 'Reservoir Pressure', source: 'Basin hydrostatic discovery pressure (1,520 psia)' },
  native_temperature_c: { class: 'ASSUMED', label: 'Native Temp', source: 'Regional geothermal reference (48.0 °C)' },
  native_viscosity_cp: { class: 'ASSUMED', label: 'Native Viscosity', source: 'Dead crude PVT benchmark at 48 °C (14,500 cP)' },
  oil_api_gravity: { class: 'ASSUMED', label: 'API Gravity', source: 'Crude assay benchmark (17.0 °API)' },
  permeability_md: { class: 'ASSUMED', label: 'Permeability', source: 'Core plug correlation (420 mD)' },
  porosity_pct: { class: 'ASSUMED', label: 'Porosity', source: 'Density-neutron log estimate (24%)' },

  // Steam inputs & thermal evolution
  steam_rate_tpd: { class: 'ASSUMED', label: 'Steam Rate', source: 'Scenario injection setpoint' },
  steam_temp_c: { class: 'ASSUMED', label: 'Steam Temp', source: 'OTSG saturated steam spec (310 °C)' },
  steam_pressure_bar: { class: 'ASSUMED', label: 'Steam Pressure', source: 'Wellhead injection manifold (100 bar)' },
  steam_quality: { class: 'ASSUMED', label: 'Steam Quality', source: 'OTSG vapor dryness fraction (0.80)' },
  heated_radius_m: { class: 'SIMULATED', label: 'Heated Radius', source: 'Marx-Langenheim heat balance with diffusion & caprock losses' },
  thermal_enthalpy_gj: { class: 'SIMULATED', label: 'Thermal Enthalpy', source: 'Steam enthalpy integration (h_steam × mass)' },
  cum_steam_tonnes: { class: 'SIMULATED', label: 'Cum Steam', source: 'Integrated steam mass over injection duration' },
  sor: { class: 'SIMULATED', label: 'Steam-Oil Ratio', source: 'Cum steam mass / cum oil production volume' },

  // Flow & coupling
  effective_temperature_c: { class: 'SIMULATED', label: 'Reservoir Temp', source: 'Radial thermal equilibration solver' },
  effective_viscosity_cp: { class: 'SIMULATED', label: 'Heated Viscosity', source: 'Andrade temperature-viscosity correlation' },
  mobility_ratio: { class: 'SIMULATED', label: 'Mobility Factor', source: 'μ_native / μ_eff' },
  pwf_psia: { class: 'SIMULATED', label: 'Bottomhole Pressure', source: 'Wellbore fluid head + pump intake drawdown' },
  qmax_bopd: { class: 'SIMULATED', label: 'Vogel qMax', source: 'Vogel solution-gas inflow relationship' },
  inflow_rate_bopd: { class: 'SIMULATED', label: 'Reservoir Inflow', source: 'Coupled IPR fluid flow' },

  // Lift & Surface
  pumping_speed_spm: { class: 'ASSUMED', label: 'Pumping Speed', source: 'Beam unit VFD setpoint' },
  stroke_length_in: { class: 'ASSUMED', label: 'Stroke Length', source: 'API beam unit geometry (120 in)' },
  plunger_diameter_in: { class: 'ASSUMED', label: 'Plunger Diameter', source: 'Downhole pump spec (2.25 in)' },
  pump_depth_m: { class: 'ASSUMED', label: 'Pump Depth', source: 'Pump seating nipple depth (980 m)' },
  pump_displacement_bpd: { class: 'SIMULATED', label: 'Pump Displacement', source: 'Kinematic swept volume (0.1166 × D² × S × SPM)' },
  pump_fillage_pct: { class: 'SIMULATED', label: 'Pump Fillage', source: 'Ratio of inflow to displacement capacity' },
  surface_oil_rate_bopd: { class: 'SIMULATED', label: 'Surface Oil Rate', source: 'Coupled minimum of inflow and lift capacity' },
  gross_fluid_rate_bpd: { class: 'SIMULATED', label: 'Gross Liquid Rate', source: 'Total oil + water production' },
  fluid_level_m: { class: 'SIMULATED', label: 'Fluid Level', source: 'Hydrostatic column calculation from Pwf' },
  prl_peak_lbs: { class: 'SIMULATED', label: 'Peak Rod Load', source: 'Modified API RP 11L upstroke dynamic load' },
  prl_min_lbs: { class: 'SIMULATED', label: 'Min Rod Load', source: 'Modified API RP 11L downstroke buoyant weight' },
  motor_power_kw: { class: 'SIMULATED', label: 'Motor Power', source: 'Polished rod work and electromechanical losses' },

  // ML / Models
  predicted_oil_rate_bopd: { class: 'ML', label: 'ML 24h Forecast', source: 'ExtraTrees Regressor V1.3' },
  dataset_enr004: { class: 'PROXY', label: 'Dataset ENR004', source: '15,699 daily logs across 48 heavy oil analog wells' },
};

/**
 * Returns provenance metadata for a given quantity key.
 */
export function getProvenance(key, defaultClass = 'SIMULATED') {
  const item = QUANTITY_REGISTRY[key];
  const classKey = item ? item.class : defaultClass;
  const classMeta = PROVENANCE_CLASSES[classKey] || PROVENANCE_CLASSES.SIMULATED;
  return {
    ...classMeta,
    source: item?.source || 'Coupled engineering physics calculation',
    label: item?.label || key,
  };
}

/**
 * Reusable Provenance Badge Component.
 * Small, neutral, consistent calm styling with no alarm banners.
 */
export function ProvenanceBadge({ quantityKey, fallbackClass = 'SIMULATED', style = {} }) {
  const prov = getProvenance(quantityKey, fallbackClass);
  return (
    <span
      className={`provenance-badge font-mono text-xxs px-1.5 py-0.5 rounded border inline-flex items-center gap-1`}
      style={{
        fontSize: '9px',
        lineHeight: 1.2,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: prov.color,
        backgroundColor: prov.bg,
        borderColor: `color-mix(in srgb, ${prov.color} 25%, transparent)`,
        borderRadius: '4px',
        userSelect: 'none',
        ...style,
      }}
      title={`${prov.label}: ${prov.source}`}
    >
      {prov.label}
    </span>
  );
}

export default QUANTITY_REGISTRY;
