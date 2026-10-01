// =============================================================================
// Baghewala Digital Twin — Unified Physical Constants & Field Baselines
// FRONTEND SINGLE SOURCE OF TRUTH (SSOT)
// =============================================================================

export const TWIN_CONSTANTS = {
  reservoir: {
    formation_name: "Jodhpur Sandstone (Lower Cambrian)",
    caprock_name: "Bilara Dolomite & Impermeable Shales",
    top_depth_m: 1050.0,
    net_pay_thickness_m: 18.0,
    initial_pressure_psia: 3740.0,
    native_temperature_c: 48.0,
    native_viscosity_cp: 14500.0,      // Exact baseline at 48°C
    stimulated_viscosity_cp: 245.0,    // Exact baseline at 195°C
    oil_saturation_pct: 66.0,
    porosity_pct: 24.5,
    permeability_md: 1200.0,
    oil_api_gravity: 17.4,
  },
  steam: {
    boiler_model: "OTS-50 Superheated Once-Through Steam Generator",
    injection_rate_tpd: 140.0,          // tonnes per day
    steam_injection_rate_tpd: 140.0,    // alias for backwards compatibility
    steam_pressure_bar: 68.0,
    steam_temperature_c: 282.0,
    steam_quality_pct: 81.0,           // Dry steam fraction
    cumulative_injected_tonnes: 4800.0,
    injection_days: 10,
    soak_days: 6,
    production_days: 60,
    default_cycle_stage: "Production",
  },
  well: {
    well_id: "0cacd33e-874a-408f-44e0-67c262ca762e",
    well_name: "BW-01",
    field_id: "acc35770-82ba-4b5f-65e5-17c372a7539a",
    field_name: "Baghewala Heavy Oil Field",
    basin: "Bikaner-Nagaur Basin, Rajasthan",
    pump_type: "Sucker Rod Pump (SRP)",
    pump_api_spec: "API C-228D-200-86",
    nominal_spm: 2.0,
    stroke_length_in: 86.0,
    stroke_length_m: 2.18,
    barrel_fillage_pct: 82.0,
    current_oil_rate_bopd: 450.5,
    water_rate_bwpd: 12.5,
    gas_rate_mcfd: 620.0,
    bsw_water_cut_pct: 2.7,
    gor_scf_per_bbl: 1376.0,
    flowing_wellhead_pressure_psia: 610.0,
    flowing_bottomhole_pressure_psia: 2310.0,
    casing_pressure_psia: 185.0,
    drawdown_psia: 1430.0,             // 3740 - 2310
    rod_peak_load_lbs: 14250.0,
    rod_rating_lbs: 22000.0,
    surface_motor_kw: 48.0,
    daily_energy_kwh: 1150.0,
  },
  surface: {
    separator_model: "V-101 Horizontal 3-Phase Heavy Oil Degasser",
    separator_pressure_psia: 140.0,
    separator_retention_min: 45.0,
    storage_tank_spec: "API 650 Heated Cylindrical Tank (TK-01/02)",
    tank_capacity_bbl: 5000.0,
    tank_current_level_pct: 68.4,
    tank_storage_temp_c: 54.0,
  },
  model: {
    version: "V1.3-Hybrid",
    zero_threshold: 0.1500,
    features_count: 50,
    dataset_name: "Dataset ENR004",
    dataset_records: 15699,
    dataset_wells: 48,
    holdout_r2_positive: 0.9887,
    holdout_r2_overall: 0.9507,
    holdout_mae_bopd: 89.80,
    holdout_rmse_bopd: 266.44,
    baseline_mae_bopd: 100.74,
  }
};

// Make available globally on window if in browser environment
if (typeof window !== 'undefined') {
  window.TWIN = TWIN_CONSTANTS;
}

export default TWIN_CONSTANTS;
