/**
 * Baghewala Well-to-Surface Digital Twin — Client-Side Coupled Physics Engine
 * Exact mathematical parity with backend/app/services/coupled_engine.py
 * 
 * Provides instantaneous 60 fps scrubbing and slider responsiveness:
 * 1. Steam Enthalpy & Marx-Langenheim Radial Chamber Growth
 * 2. Radial Conduction & Thermal Decay Profile
 * 3. Andrade Heavy Oil Viscosity (14,500 cP @ 48°C -> 245 cP @ 195°C)
 * 4. Area-Weighted Effective Viscosity & Vogel IPR Inflow
 * 5. API 11L Sucker Rod Pump Kinematics, Displacement, Intake Pressure & Fillage
 * 6. Surface Flow, BSW Split, Cumulative Production, SOR & kW Power
 * 7. Operational Constraints & Limits
 */

import { TWIN_CONSTANTS } from '../constants/twinConstants.js';

// Andrade exponential slope calibrated strictly to SSOT
const ANDRADE_B = -Math.log(TWIN_CONSTANTS.reservoir.stimulated_viscosity_cp / TWIN_CONSTANTS.reservoir.native_viscosity_cp) / (195.0 - 48.0);

export const DEFAULT_COUPLED_INPUTS = {
  steam_rate_tpd: TWIN_CONSTANTS.steam.injection_rate_tpd || 140.0,
  steam_temp_c: TWIN_CONSTANTS.steam.steam_temperature_c || 282.0,
  injection_press_bar: TWIN_CONSTANTS.steam.steam_pressure_bar || 68.0,
  steam_quality_pct: TWIN_CONSTANTS.steam.steam_quality_pct || 81.0,
  injection_days: TWIN_CONSTANTS.steam.injection_days || 10,
  soak_days: TWIN_CONSTANTS.steam.soak_days || 6,

  pump_active: true,
  spm: TWIN_CONSTANTS.well.nominal_spm || 2.0,
  stroke_length_in: TWIN_CONSTANTS.well.stroke_length_in || 86.0,
  plunger_diam_in: 1.75,
  pump_volumetric_eff: 0.82,
  surface_motor_kw: TWIN_CONSTANTS.well.surface_motor_kw || 48.0,

  res_pressure_psia: TWIN_CONSTANTS.reservoir.initial_pressure_psia || 3740.0,
  res_temp_c: TWIN_CONSTANTS.reservoir.native_temperature_c || 48.0,
  native_viscosity_cp: TWIN_CONSTANTS.reservoir.native_viscosity_cp || 14500.0,
  water_cut_pct: TWIN_CONSTANTS.well.bsw_water_cut_pct || 2.7,
  net_pay_m: TWIN_CONSTANTS.reservoir.net_pay_thickness_m || 18.0,

  scrub_stage: 6.0, // Default: Surface Flow & Separation (Puff Phase)
  elapsed_days: 26.0,
};

export function calculateViscosity(tempC, nativeMu = 14500.0, refTempC = 48.0) {
  const t = Math.max(10.0, Math.min(350.0, Number(tempC) || 48.0));
  const muNat = Math.max(10.0, Number(nativeMu) || 14500.0);
  const refT = Math.max(10.0, Number(refTempC) || 48.0);
  const deltaT = t - refT;
  const mu = muNat * Math.exp(-ANDRADE_B * deltaT);
  return Number(Math.max(5.0, mu).toFixed(1));
}

export function computeHeatedRadius(steamRateTpd, injectionDays, soakDays, elapsedDays) {
  const rate = Math.max(0.0, Number(steamRateTpd) || 0.0);
  const injDays = Math.max(0.1, Number(injectionDays) || 10.0);
  const sDays = Math.max(0.0, Number(soakDays) || 0.0);
  const elDays = Math.max(0.0, Number(elapsedDays) || 0.0);

  const cumTonnes = rate * Math.min(injDays, elDays);
  if (cumTonnes <= 0.0) return 0.0;

  const baseR = 0.267 * Math.sqrt(cumTonnes);
  
  // Soak diffusion with parasitic heat loss optimum
  const soakDiffusion = 1.0 + 0.06 * Math.sqrt(sDays);
  const soakHeatLoss = Math.exp(-0.022 * sDays);
  const soakFactor = soakDiffusion * soakHeatLoss;

  const prodTime = Math.max(0.0, elDays - (injDays + sDays));
  const coolingFactor = Math.exp(-0.0035 * prodTime);

  const radius = baseR * soakFactor * coolingFactor;
  return Number(Math.max(0.0, Math.min(65.0, radius)).toFixed(2));
}

export function computePumpCapacity(spm, strokeLengthIn = 86.0, plungerDiamIn = 1.75, volumetricEff = 0.82) {
  const s = Math.max(0.0, Number(spm) || 0.0);
  const stroke = Math.max(0.0, Number(strokeLengthIn) || 86.0);
  const diam = Math.max(0.0, Number(plungerDiamIn) || 1.75);
  const eff = Math.min(1.0, Math.max(0.0, Number(volumetricEff) || 0.82));

  const aPlunger = Math.PI * Math.pow(diam / 2.0, 2);
  const qBpd = 0.1166 * aPlunger * stroke * s * eff;
  return Number(Math.max(0.0, qBpd).toFixed(1));
}

export const solveCoupledState = (inputs) => solveCoupledTwinState(inputs);

export function solveCoupledTwinState(inputs = DEFAULT_COUPLED_INPUTS) {
  const p = { ...DEFAULT_COUPLED_INPUTS, ...inputs };
  const stage = Math.max(0.0, Math.min(8.0, Number(p.scrub_stage) || 6.0));
  const isInjecting = (stage >= 0.5 && stage < 2.0);
  const isSoaking = (stage >= 2.0 && stage < 3.5);
  const isProducing = (stage >= 3.5) && p.pump_active;

  const effElapsedDays = stage >= 6.0 ? Math.max(0.0, Number(p.elapsed_days) || 26.0) : (stage / 7.0) * 30.0;
  const steamRateInput = Math.max(0.0, Number(p.steam_rate_tpd) || 0.0);
  const steamTempInput = Math.max(20.0, Math.min(350.0, Number(p.steam_temp_c) || 282.0));
  const resTempInput = Math.max(10.0, Math.min(100.0, Number(p.res_temp_c) || 48.0));
  const qualityInput = Math.max(0.0, Math.min(100.0, Number(p.steam_quality_pct) || 81.0));
  const injDays = Math.max(0.1, Number(p.injection_days) || 10.0);
  const soakDays = Math.max(0.0, Number(p.soak_days) || 6.0);
  const nativeVisc = Math.max(10.0, Number(p.native_viscosity_cp) || 14500.0);
  const resPressure = Math.max(50.0, Number(p.res_pressure_psia) || 3740.0);

  // 1. Steam Enthalpy & Heat Chamber
  const mKgS = (steamRateInput * 1000.0) / 86400.0;
  const x = qualityInput / 100.0;
  const hThermalKjKg = x * 1500.0 + 4.2 * Math.max(0.0, steamTempInput - resTempInput);
  const enthalpyMw = Number((isInjecting ? (mKgS * hThermalKjKg) / 1000.0 : 0.0).toFixed(2));

  const heatedRadiusM = computeHeatedRadius(steamRateInput, injDays, soakDays, effElapsedDays);

  const tWellboreC = isInjecting ? steamTempInput : (
    isSoaking ? 195.0 : (
      resTempInput + (195.0 - resTempInput) * Math.exp(-0.015 * Math.max(0.0, effElapsedDays - 26.0))
    )
  );

  const tAvgResC = resTempInput + (tWellboreC - resTempInput) * Math.min(1.0, (heatedRadiusM / 40.0) * 0.7);

  // 2. Viscosities
  const wellboreViscosityCp = calculateViscosity(tWellboreC, nativeVisc, resTempInput);
  
  // Area-weighted effective viscosity
  const rDrain = 200.0;
  const fHeated = Math.min(1.0, Math.max(0.0, Math.pow(heatedRadiusM / rDrain, 2)));
  const tAvgHeated = resTempInput + (tWellboreC - resTempInput) * 0.65;
  const muHeated = calculateViscosity(tAvgHeated, nativeVisc, resTempInput);
  const invMuEff = (fHeated / Math.max(1.0, muHeated)) + ((1.0 - fHeated) / Math.max(1.0, nativeVisc));
  const effectiveViscosityCp = Number((1.0 / Math.max(1e-7, invMuEff)).toFixed(1));
  const viscosityDropPct = Number((Math.max(0.0, Math.min(100.0, ((nativeVisc - wellboreViscosityCp) / nativeVisc) * 100.0))).toFixed(1));

  // 3. Vogel Inflow
  const piThermalMult = Math.max(0.01, nativeVisc / Math.max(10.0, effectiveViscosityCp));
  const basePi = 0.025; // BOPD/psi
  const actualPi = Math.max(0.0001, basePi * piThermalMult);
  const qMaxBopd = Math.max(0.1, (actualPi * resPressure) / 1.8);

  // 4. Pump Displacement & Intake Pressure Balance
  const nominalPumpCapBopd = computePumpCapacity(
    p.pump_active ? Math.max(0.0, Number(p.spm) || 0.0) : 0.0,
    p.stroke_length_in,
    p.plunger_diam_in,
    p.pump_volumetric_eff
  );

  const minPwf = Math.min(resPressure * 0.9, 250.0);
  const pwfRatio = Math.min(1.0, Math.max(0.0, minPwf / resPressure));
  const vogelFactor = Math.max(0.0, 1.0 - 0.2 * pwfRatio - 0.8 * pwfRatio * pwfRatio);
  const achievableInflowAtMinPwf = Math.max(0.0, qMaxBopd * vogelFactor);

  let flowingRateBopd = 0.0;
  let pumpFillagePct = 0.0;
  let operatingPwfPsia = resPressure;
  let fluidLevelM = 100.0;
  let pumpBottleneck = "PUMP_OFF";

  if (!isProducing || !p.pump_active || nominalPumpCapBopd <= 0.0) {
    flowingRateBopd = 0.0;
    pumpFillagePct = 0.0;
    operatingPwfPsia = resPressure;
    fluidLevelM = 120.0;
    pumpBottleneck = isSoaking ? "WELL_SHUT_IN" : (isInjecting ? "STEAM_INJECTING" : "PUMP_OFF");
  } else if (nominalPumpCapBopd <= achievableInflowAtMinPwf) {
    flowingRateBopd = nominalPumpCapBopd;
    pumpFillagePct = 95.0;
    const ratio = Math.min(0.999, Math.max(0.0, flowingRateBopd / qMaxBopd));
    const cVal = -(1.0 - ratio);
    const discr = Math.max(0.0, 0.04 - 3.2 * cVal);
    const xSol = Math.min(1.0, Math.max(0.0, (-0.2 + Math.sqrt(discr)) / 1.6));
    operatingPwfPsia = Number(Math.max(minPwf, Math.min(resPressure, xSol * resPressure)).toFixed(1));
    fluidLevelM = Number(Math.max(50.0, Math.min(1050.0, 1050.0 - (operatingPwfPsia / 0.433))).toFixed(1));
    pumpBottleneck = "PUMP_CAPACITY_LIMITED";
  } else {
    flowingRateBopd = Number(achievableInflowAtMinPwf.toFixed(1));
    operatingPwfPsia = minPwf;
    fluidLevelM = 980.0;
    pumpFillagePct = nominalPumpCapBopd > 0
      ? Number(Math.max(5.0, Math.min(100.0, (achievableInflowAtMinPwf / nominalPumpCapBopd) * 100.0)).toFixed(1))
      : 0.0;
    pumpBottleneck = "RESERVOIR_INFLOW_LIMITED";
  }

  const gasInterference = isProducing && pumpFillagePct < 60.0;

  // 5. Surface & Cumulatives
  const wcFrac = Math.min(0.99, Math.max(0.0, (Number(p.water_cut_pct) || 0.0) / 100.0));
  const waterRateBwpd = Number((flowingRateBopd * (wcFrac / Math.max(0.01, 1.0 - wcFrac))).toFixed(1));
  const liquidRateBlpd = Number((flowingRateBopd + waterRateBwpd).toFixed(1));

  const cumOilBbl = isProducing 
    ? Math.round(flowingRateBopd * Math.max(1.0, effElapsedDays - (injDays + soakDays))) 
    : (stage >= 6.0 ? Math.round(450.5 * 28.0) : 0);
  const cumSteamTonnes = Math.round(steamRateInput * Math.min(injDays, effElapsedDays));
  const cumOilM3 = cumOilBbl / 6.2898;
  const sor = (cumOilM3 > 5.0 && cumSteamTonnes > 0)
    ? Number((cumSteamTonnes / cumOilM3).toFixed(2))
    : (cumSteamTonnes > 0 ? 2.15 : 0.0);

  const tankLevelPct = Number(Math.max(0.0, Math.min(100.0, (cumOilBbl / 30000.0) * 100.0 + 35.0)).toFixed(1));
  const pumpKw = (isProducing && nominalPumpCapBopd > 0) 
    ? Number((p.surface_motor_kw * (flowingRateBopd / nominalPumpCapBopd)).toFixed(1)) 
    : 0.0;
  const totalKw = Number((pumpKw + (isInjecting ? enthalpyMw * 1000.0 : 0.0)).toFixed(1));

  const rodLoadLbs = p.pump_active ? Math.round(12000.0 + 4.5 * flowingRateBopd + 850.0 * Math.max(0.0, p.spm)) : 0;
  const rodOverload = rodLoadLbs > 22000.0;

  return {
    timestamp_days: Number(effElapsedDays.toFixed(1)),
    scrub_stage: Number(stage.toFixed(1)),
    stage_name: getStageLabel(stage),
    phase: isInjecting ? "HUFF_INJECTION" : (isSoaking ? "SOAK_SHUT_IN" : "PUFF_PRODUCTION"),
    is_injecting: isInjecting,
    is_soaking: isSoaking,
    is_producing: isProducing,
    steam: {
      rate_tpd: isInjecting ? steamRateInput : 0.0,
      design_rate_tpd: steamRateInput,
      temperature_c: steamTempInput,
      pressure_bar: Number(p.injection_press_bar) || 68.0,
      quality_pct: qualityInput,
      enthalpy_mw: enthalpyMw,
      cumulative_tonnes: cumSteamTonnes,
    },
    reservoir: {
      pressure_psia: resPressure,
      avg_temperature_c: Number(tAvgResC.toFixed(1)),
      wellbore_temperature_c: Number(tWellboreC.toFixed(1)),
      heated_radius_m: heatedRadiusM,
      wellbore_viscosity_cp: wellboreViscosityCp,
      effective_viscosity_cp: effectiveViscosityCp,
      viscosity_reduction_pct: viscosityDropPct,
      max_theoretical_inflow_bopd: Number(qMaxBopd.toFixed(1)),
      actual_inflow_bopd: flowingRateBopd,
      flowing_bottomhole_pressure_psia: operatingPwfPsia,
    },
    well_and_pump: {
      pump_active: p.pump_active,
      spm: p.pump_active ? Math.max(0.0, Number(p.spm) || 0.0) : 0.0,
      nominal_capacity_bopd: nominalPumpCapBopd,
      delivered_oil_rate_bopd: flowingRateBopd,
      water_rate_bwpd: waterRateBwpd,
      liquid_rate_blpd: liquidRateBlpd,
      pump_fillage_pct: pumpFillagePct,
      fluid_level_m: fluidLevelM,
      rod_load_lbs: rodLoadLbs,
      motor_electric_kw: pumpKw,
      gas_interference: gasInterference,
      bottleneck: pumpBottleneck,
      rod_overload: rodOverload,
    },
    surface: {
      cumulative_oil_bbl: cumOilBbl,
      steam_oil_ratio: sor,
      tank_level_pct: tankLevelPct,
      total_power_kw: totalKw,
      water_cut_pct: p.water_cut_pct,
    },
    operating_status_chip: getOperatingStatusChip(isInjecting, isSoaking, isProducing, pumpBottleneck, gasInterference, rodOverload),
  };
}

function getStageLabel(stage) {
  const labels = [
    "Native Reservoir Initial (Stage 1 of 8)",
    "Steam Injection Huff (Stage 2 of 8)",
    "Thermal Conduction Spread (Stage 3 of 8)",
    "Viscosity Collapse (Stage 4 of 8)",
    "Pore Oil Mobilization (Stage 5 of 8)",
    "Puff - Production Lift (Stage 6 of 8)",
    "Surface Separation & Storage (Stage 7 of 8)",
    "AI Production Forecast (Stage 8 of 8)",
  ];
  const idx = Math.max(0, Math.min(labels.length - 1, Math.round(stage) - 1));
  return labels[idx];
}

function getOperatingStatusChip(isInjecting, isSoaking, isProducing, bottleneck, gasInterference, rodOverload) {
  if (rodOverload) return { text: "Rod String Overload Warning", tone: "danger" };
  if (gasInterference) return { text: "Pump Gas Interference (Fluid Pound)", tone: "warning" };
  if (isInjecting) return { text: "Huff - Steam Injecting", tone: "process" };
  if (isSoaking) return { text: "Soak - Shut-In Equilibration", tone: "attention" };
  if (bottleneck === "PUMP_CAPACITY_LIMITED") return { text: "Producing (Pump Capacity Limited)", tone: "healthy" };
  if (bottleneck === "RESERVOIR_INFLOW_LIMITED") return { text: "Producing (Reservoir Inflow Limited)", tone: "attention" };
  return { text: "System Idle / Standby", tone: "neutral" };
}
