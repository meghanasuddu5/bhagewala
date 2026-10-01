// =============================================================================
// Baghewala Digital Twin — Calibrated Physical Calculations (Frontend)
// SINGLE CALIBRATED VISCOSITY & THERMAL PROPAGATION MODEL
// =============================================================================

import { TWIN_CONSTANTS } from '../constants/twinConstants';

const T_REF_C = TWIN_CONSTANTS.reservoir.native_temperature_c; // 48.0 °C
const MU_REF_CP = TWIN_CONSTANTS.reservoir.native_viscosity_cp; // 14500.0 cP
const T_STIM_C = 195.0;
const MU_STIM_CP = TWIN_CONSTANTS.reservoir.stimulated_viscosity_cp; // 245.0 cP

// b = -ln(MU_STIM / MU_REF) / (T_STIM - T_REF)
const ANDRADE_B = -Math.log(MU_STIM_CP / MU_REF_CP) / (T_STIM_C - T_REF_C); // ~0.02775916

/**
 * Calculates dynamic heavy oil viscosity (cP) strictly calibrated to:
 * 14,500.0 cP @ 48.0°C and 245.0 cP @ 195.0°C.
 */
export function calculateViscosity(tempC) {
  const t = Math.max(20.0, Math.min(300.0, parseFloat(tempC) || T_REF_C));
  const deltaT = t - T_REF_C;
  const v = MU_REF_CP * Math.exp(-ANDRADE_B * deltaT);
  return Math.round(Math.max(50.0, v) * 10) / 10;
}

/**
 * Calculates percentage viscosity reduction relative to native 14,500 cP tar.
 */
export function calculateViscosityReductionPct(tempC) {
  const mu = calculateViscosity(tempC);
  const drop = ((MU_REF_CP - mu) / MU_REF_CP) * 100.0;
  return Math.round(Math.max(0.0, drop) * 10) / 10;
}

/**
 * Returns physical state classification, 3D fluid color hex, and flow velocity multiplier.
 */
export function getFluidPhysicalState(tempC) {
  const mu = calculateViscosity(tempC);
  const mobilityFactor = Math.round((MU_REF_CP / mu) * 10) / 10;

  let stateLabel = "";
  let colorHex = "#181412";
  let threeColorHex = 0x181412;
  let particleSpeedFactor = 0.2;

  if (mu > 8000.0) {
    stateLabel = "Native Bituminous Tar (Immobile)";
    colorHex = "#181412";
    threeColorHex = 0x181412;
    particleSpeedFactor = 0.15;
  } else if (mu > 2500.0) {
    stateLabel = "Sluggish Bitumen (Low Inflow)";
    colorHex = "#451a03";
    threeColorHex = 0x451a03;
    particleSpeedFactor = 0.4;
  } else if (mu > 800.0) {
    stateLabel = "Thermal Transition Fluid";
    colorHex = "#92400e";
    threeColorHex = 0x92400e;
    particleSpeedFactor = 0.8;
  } else if (mu > 300.0) {
    stateLabel = "Free-Flowing Crude Oil";
    colorHex = "#d97706";
    threeColorHex = 0xd97706;
    particleSpeedFactor = 1.3;
  } else {
    stateLabel = "Superheated High-Mobility Liquid";
    colorHex = "#f59e0b";
    threeColorHex = 0xf59e0b;
    particleSpeedFactor = 2.0;
  }

  return {
    temperatureC: tempC,
    viscosityCp: mu,
    viscosityDropPct: calculateViscosityReductionPct(tempC),
    mobilityFactor,
    stateLabel,
    colorHex,
    threeColorHex,
    particleSpeedFactor,
  };
}

/**
 * Radial thermal front expansion model based on injected steam enthalpy and soak diffusion.
 * Yields ~18.5m radius for nominal 4,800 tonnes at 6 days soak.
 */
export function calculateSteamChamberRadius(cumulativeTonnes, soakDays = 6) {
  const vTonnes = Math.max(100.0, parseFloat(cumulativeTonnes) || 4800.0);
  const baseRadius = 0.267 * Math.sqrt(vTonnes);
  const soakDiffusion = 1.0 + (0.02 * Math.sqrt(Math.max(0, soakDays)));
  return Math.round(baseRadius * soakDiffusion * 10) / 10;
}

/**
 * Generates calibrated curve points for plotting viscosity vs temperature.
 */
export function getViscosityCurvePoints() {
  const points = [];
  for (let t = 40; t <= 240; t += 5) {
    points.push({
      tempC: t,
      viscosityCp: calculateViscosity(t),
    });
  }
  return points;
}
