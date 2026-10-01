"""
Baghewala Well-to-Surface Digital Twin — Coupled Simulation Engine
SIMPLIFIED COUPLED THERMAL-LIFT ENGINEERING MODEL (AUTHORITATIVE PYTHON ENGINE)

Integrates:
1. Steam Enthalpy & Marx-Langenheim Heated Zone Growth
2. Radial Temperature Profile & Conductive Decay
3. Calibrated Andrade Viscosity
4. Volume-Weighted Effective Viscosity & Vogel Inflow Performance Relationship (IPR)
5. Sucker Rod Pump Kinematics, Capacity, Intake Pressure, and Fillage
6. Surface Separation, Produced Water Cut, Cumulative Oil, Steam-Oil Ratio (SOR), and Energy (kW)
7. Operating Constraints & Limits (Rod Load, Injection Pressure, Cavitation)

Deterministic and time-parameterized for forward and backward scrubbing.
"""

import math
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from backend.app.core.twin_constants import RESERVOIR, STEAM, WELL, get_all_twin_constants


@dataclass
class SimulationInputs:
    # Steam injection parameters
    steam_rate_tpd: float = STEAM.injection_rate_tpd  # 140.0 t/d
    steam_temp_c: float = STEAM.steam_temperature_c  # 282.0 °C
    injection_press_bar: float = STEAM.steam_pressure_bar  # 68.0 bar
    steam_quality_pct: float = STEAM.steam_quality_pct  # 81.0 %
    injection_days: float = STEAM.injection_days  # 20.0 days
    soak_days: float = STEAM.soak_days  # 6.0 days

    # Pump parameters
    pump_active: bool = True
    spm: float = WELL.nominal_spm  # 2.0 spm
    stroke_length_in: float = WELL.stroke_length_in  # 100.0 in
    plunger_diam_in: float = 1.75  # in
    pump_volumetric_eff: float = 0.82  # 82%
    surface_motor_kw: float = WELL.surface_motor_kw  # 48.0 kW

    # Reservoir parameters
    res_pressure_psia: float = RESERVOIR.initial_pressure_psia  # 3740.0 psia
    res_temp_c: float = RESERVOIR.native_temperature_c  # 48.0 °C
    native_viscosity_cp: float = RESERVOIR.native_viscosity_cp  # 14500.0 cP
    water_cut_pct: float = WELL.bsw_water_cut_pct  # 2.7 %
    net_pay_m: float = RESERVOIR.net_pay_thickness_m  # 18.0 m
    drainage_radius_m: float = 200.0  # m
    wellbore_radius_m: float = 0.108  # m (7" casing)
    permeability_d: float = 1.85  # Darcy (Jodhpur sandstone benchmark)
    skin_factor: float = 1.2

    # Timeline scrubber parameter (0.0 to 8.0 corresponding to the 8 stages, or days)
    scrub_stage: float = 6.0  # Default to Stage 6 (Surface Flow / Active Production)
    elapsed_days: float = 26.0  # Cumulative timeline days


# Calibrated Andrade Constants
ANDRADE_B: float = -math.log(RESERVOIR.stimulated_viscosity_cp / RESERVOIR.native_viscosity_cp) / (195.0 - 48.0)


def calculate_viscosity(temp_c: float, native_mu: float = 14500.0, ref_temp_c: float = 48.0) -> float:
    """Calibrated Andrade viscosity equation: strictly monotonic decreasing."""
    t = max(20.0, min(350.0, float(temp_c)))
    delta_t = t - ref_temp_c
    mu = native_mu * math.exp(-ANDRADE_B * delta_t)
    return round(max(35.0, mu), 1)


def calculate_steam_enthalpy_mw(steam_rate_tpd: float, steam_temp_c: float, res_temp_c: float, quality_pct: float) -> float:
    """
    Computes thermal enthalpy input rate (MW):
    Q = m * (x * L_v + c_p * (T_s - T_res))
    """
    m_kg_s = (steam_rate_tpd * 1000.0) / 86400.0  # kg/s
    x = quality_pct / 100.0
    l_v = 1500.0  # kJ/kg latent heat at 68 bar
    c_p = 4.2  # kJ/kg/C liquid water heat capacity
    h_thermal_kj_kg = x * l_v + c_p * max(0.0, steam_temp_c - res_temp_c)
    q_kw = m_kg_s * h_thermal_kj_kg
    return round(q_kw / 1000.0, 2)  # MW


def compute_heated_radius(steam_rate_tpd: float, injection_days: float, soak_days: float, elapsed_t: float) -> float:
    """
    Marx-Langenheim radial heat front expansion with soak diffusion, 
    heat-loss optimum, and post-soak conductive cooling.
    Guaranteed finite and non-negative for all inputs.
    """
    rate = max(0.0, float(steam_rate_tpd))
    inj_d = max(0.1, float(injection_days))
    soak_d = max(0.0, float(soak_days))
    el_t = max(0.0, float(elapsed_t))

    cum_tonnes = rate * min(inj_d, el_t)
    if cum_tonnes <= 0.0:
        return 0.0

    base_r = 0.267 * math.sqrt(cum_tonnes)
    
    # Soak diffusion with parasitic conductive heat loss (optimal at 5-7 days)
    soak_diffusion = 1.0 + 0.06 * math.sqrt(soak_d)
    soak_heat_loss = math.exp(-0.022 * soak_d)
    soak_factor = soak_diffusion * soak_heat_loss

    # Post-soak conductive cooling decay if elapsed_t > injection_days + soak_days
    prod_time = max(0.0, el_t - (inj_d + soak_d))
    cooling_factor = math.exp(-0.0035 * prod_time)

    radius = base_r * soak_factor * cooling_factor
    return round(max(0.0, min(65.0, radius)), 2)


def compute_temperature_profile(r: float, r_h: float, t_steam: float, t_res: float) -> float:
    """
    Computes local temperature at radius r (m) from wellbore.
    Guaranteed finite and clamped within [t_res, t_steam].
    """
    r_val = max(0.0, float(r))
    rh_val = max(0.0, float(r_h))
    ts_val = max(20.0, min(350.0, float(t_steam)))
    tr_val = max(10.0, min(100.0, float(t_res)))

    if rh_val <= 0.05 or r_val >= rh_val * 1.5:
        return tr_val
    if r_val <= 0.15:
        return ts_val
    
    decay_ratio = r_val / max(0.1, rh_val)
    temp = tr_val + (ts_val - tr_val) * math.exp(-2.2 * decay_ratio * decay_ratio)
    return round(max(tr_val, min(ts_val, temp)), 1)


def compute_effective_viscosity(r_h: float, t_steam: float, t_res: float, native_mu: float) -> float:
    """
    Computes volume/radius-weighted effective viscosity mu_eff across drainage area.
    Guaranteed finite and bounded in [mu_heated, native_mu].
    """
    rh_val = max(0.0, float(r_h))
    mu_nat = max(10.0, float(native_mu))
    tr_val = max(10.0, min(100.0, float(t_res)))
    ts_val = max(tr_val, min(350.0, float(t_steam)))

    if rh_val <= 0.5:
        return mu_nat

    r_drain = 200.0
    f_heated = min(1.0, max(0.0, (rh_val / r_drain) ** 2))
    t_avg_heated = tr_val + (ts_val - tr_val) * 0.65
    mu_heated = calculate_viscosity(t_avg_heated, mu_nat, tr_val)

    inv_mu_eff = (f_heated / max(1.0, mu_heated)) + ((1.0 - f_heated) / max(1.0, mu_nat))
    mu_eff = 1.0 / max(1e-7, inv_mu_eff)
    return round(max(mu_heated, min(mu_nat, mu_eff)), 1)


def compute_pump_capacity_bopd(spm: float, stroke_length_in: float, plunger_diam_in: float, volumetric_eff: float) -> float:
    """
    Standard API 11L sucker-rod pump displacement capacity:
    q_pump(bbl/d) = 0.1166 * A_p(in2) * S(in) * N(spm) * E_v
    """
    a_plunger_sq_in = math.pi * ((plunger_diam_in / 2.0) ** 2)
    q_bpd = 0.1166 * a_plunger_sq_in * stroke_length_in * spm * volumetric_eff
    return round(max(0.0, q_bpd), 1)


def solve_coupled_state(inputs: SimulationInputs) -> Dict[str, Any]:
    """
    Authoritative state evaluation: executes the complete physical model chain
    and returns all telemetry, reservoir, wellbore, pump, surface, and constraint flags.
    """
    # 1. Timeline & Operational Phase Determination
    # Stage 0: Initial/Cold
    # Stage 1: Steam Huff (Injecting)
    # Stage 2: Thermal Soak (Shut-in)
    # Stage 3-7: Puff (Pumping/Production)
    stage = inputs.scrub_stage
    is_injecting = (0.5 <= stage < 2.0)
    is_soaking = (2.0 <= stage < 3.5)
    is_producing = (stage >= 3.5) and inputs.pump_active

    # Adjust elapsed days if driven by scrubber stage
    eff_elapsed_days = inputs.elapsed_days if stage >= 6.0 else (stage / 7.0) * 30.0

    # 2. Steam Enthalpy & Heat Front Expansion
    steam_enthalpy_mw = calculate_steam_enthalpy_mw(
        inputs.steam_rate_tpd if is_injecting else 0.0,
        inputs.steam_temp_c,
        inputs.res_temp_c,
        inputs.steam_quality_pct,
    )
    heated_radius_m = compute_heated_radius(
        inputs.steam_rate_tpd,
        inputs.injection_days,
        inputs.soak_days,
        eff_elapsed_days,
    )

    # Near-wellbore and average reservoir temperature
    t_wellbore_c = inputs.steam_temp_c if is_injecting else (
        195.0 if is_soaking else (
            inputs.res_temp_c + (195.0 - inputs.res_temp_c) * math.exp(-0.015 * max(0.0, eff_elapsed_days - 26.0))
        )
    )
    t_avg_res_c = inputs.res_temp_c + (t_wellbore_c - inputs.res_temp_c) * min(1.0, (heated_radius_m / 40.0) * 0.7)

    # 3. Dynamic Viscosity Calculation
    wellbore_viscosity_cp = calculate_viscosity(t_wellbore_c, inputs.native_viscosity_cp, inputs.res_temp_c)
    effective_viscosity_cp = compute_effective_viscosity(heated_radius_m, t_wellbore_c, inputs.res_temp_c, inputs.native_viscosity_cp)
    viscosity_reduction_pct = round(((inputs.native_viscosity_cp - wellbore_viscosity_cp) / inputs.native_viscosity_cp) * 100.0, 1)

    # 4. Reservoir Productivity & Vogel IPR
    # Baseline PI with cold tar is ~0.01 BOPD/psi. With thermal stimulation, PI scales inversely with mu_eff
    pi_thermal_mult = max(0.01, inputs.native_viscosity_cp / max(10.0, effective_viscosity_cp))
    base_pi = 0.025  # BOPD/psi
    actual_pi = max(0.0001, base_pi * pi_thermal_mult)
    pr = max(50.0, float(inputs.res_pressure_psia))

    # Vogel Maximum Theoretical Inflow q_max (Guaranteed positive and finite)
    q_max_bopd = max(0.1, (actual_pi * pr) / 1.8)

    # 5. Sucker Rod Pump Capacity & Inflow Balance
    nominal_pump_cap_bopd = compute_pump_capacity_bopd(
        inputs.spm if inputs.pump_active else 0.0,
        inputs.stroke_length_in,
        inputs.plunger_diam_in,
        inputs.pump_volumetric_eff,
    )

    # Determine Achievable Flowing Bottomhole Pressure (Pwf)
    # If pumping, pump draws down Pwf until inflow matches pump capacity or reaches min_pwf limit (250 psia)
    min_pwf_limit = min(pr * 0.9, 250.0)  # psia
    pwf_ratio = min(1.0, max(0.0, min_pwf_limit / pr))
    vogel_factor = max(0.0, 1.0 - 0.2 * pwf_ratio - 0.8 * (pwf_ratio ** 2))
    achievable_inflow_at_min_pwf = max(0.0, q_max_bopd * vogel_factor)

    if not is_producing or not inputs.pump_active or nominal_pump_cap_bopd <= 0.0:
        # Well shut-in, injecting, or pump off: no surface production
        flowing_rate_bopd = 0.0
        pump_fillage_pct = 0.0
        operating_pwf_psia = pr
        fluid_level_from_surface_m = 100.0
        pump_bottleneck = "WELL_SHUT_IN" if is_soaking else ("STEAM_INJECTING" if is_injecting else "PUMP_OFF")
    else:
        if nominal_pump_cap_bopd <= achievable_inflow_at_min_pwf:
            # Pump limited: pump cannot lift all fluid reservoir can deliver
            flowing_rate_bopd = nominal_pump_cap_bopd
            pump_fillage_pct = 95.0
            # Solve Vogel for Pwf corresponding to flowing_rate_bopd
            # q / q_max = 1 - 0.2*(Pwf/Pr) - 0.8*(Pwf/Pr)^2
            ratio = min(0.999, max(0.0, flowing_rate_bopd / q_max_bopd))
            c_val = -(1.0 - ratio)
            discr = max(0.0, 0.04 - 3.2 * c_val)
            x_sol = min(1.0, max(0.0, (-0.2 + math.sqrt(discr)) / 1.6))
            operating_pwf_psia = round(max(min_pwf_limit, min(pr, x_sol * pr)), 1)
            fluid_level_from_surface_m = round(max(50.0, min(1050.0, 1050.0 - (operating_pwf_psia / 0.433))), 1)
            pump_bottleneck = "PUMP_CAPACITY_LIMITED"
        else:
            # Inflow limited: pump capacity exceeds inflow; fluid level drops to pump intake
            flowing_rate_bopd = round(achievable_inflow_at_min_pwf, 1)
            operating_pwf_psia = min_pwf_limit
            fluid_level_from_surface_m = 980.0  # Just above pump at 1000m
            pump_fillage_pct = round(max(5.0, min(100.0, (achievable_inflow_at_min_pwf / nominal_pump_cap_bopd) * 100.0)), 1) if nominal_pump_cap_bopd > 0 else 0.0
            pump_bottleneck = "RESERVOIR_INFLOW_LIMITED"

    # Gas interference flag when fillage drops below 60%
    gas_interference_flag = (is_producing and pump_fillage_pct < 60.0)

    # 6. Surface Separation, Produced Fluids, Cumulatives & Energetics
    wc_frac = min(0.99, max(0.0, float(inputs.water_cut_pct) / 100.0))
    produced_water_bwpd = round(flowing_rate_bopd * (wc_frac / max(0.01, 1.0 - wc_frac)), 1)
    total_liquid_rate_blpd = round(flowing_rate_bopd + produced_water_bwpd, 1)

    # Cumulative oil & tank level
    cum_oil_bbl = round(flowing_rate_bopd * max(1.0, eff_elapsed_days - (inputs.injection_days + inputs.soak_days)), 0) if is_producing else (
        450.5 * 28.0 if stage >= 6.0 else 0.0
    )
    cum_steam_injected_tonnes = round(max(0.0, float(inputs.steam_rate_tpd)) * min(max(0.1, float(inputs.injection_days)), eff_elapsed_days), 0)
    
    # Steam-Oil Ratio (SOR, m3 cold water equiv per m3 oil)
    cum_oil_m3 = cum_oil_bbl / 6.2898
    sor = round(cum_steam_injected_tonnes / max(1.0, cum_oil_m3), 2) if (cum_oil_m3 > 5.0 and cum_steam_injected_tonnes > 0) else (2.15 if cum_steam_injected_tonnes > 0 else 0.0)

    # Storage tank level (dual 15,000 bbl API 650 tanks)
    tank_capacity_bbl = 30000.0
    tank_level_pct = round(max(0.0, min(100.0, (cum_oil_bbl / tank_capacity_bbl) * 100.0 + 35.0)), 1)

    # Electrical & Thermal Energy
    pump_electric_kw = round(inputs.surface_motor_kw * (flowing_rate_bopd / max(1.0, nominal_pump_cap_bopd)), 1) if (is_producing and nominal_pump_cap_bopd > 0) else 0.0
    total_kw = round(pump_electric_kw + (steam_enthalpy_mw * 1000.0 if is_injecting else 0.0), 1)

    # Mechanical Constraints & Warnings
    rod_load_lbs = round(12000.0 + 4.5 * flowing_rate_bopd + 850.0 * inputs.spm, 0) if inputs.pump_active else 0.0
    max_rod_load_rating_lbs = 22000.0
    rod_overload_flag = (rod_load_lbs > max_rod_load_rating_lbs)
    injection_overpressure_flag = (inputs.injection_press_bar > 85.0)

    # Constraints list
    constraints = []
    if rod_overload_flag:
        constraints.append({"type": "WARNING", "msg": f"Rod String Overload: {rod_load_lbs:.0f} lbs > {max_rod_load_rating_lbs:.0f} lbs beam limit."})
    if injection_overpressure_flag:
        constraints.append({"type": "ALERT", "msg": f"Injection Overpressure: {inputs.injection_press_bar:.1f} bar exceeds caprock fracture limit."})
    if gas_interference_flag:
        constraints.append({"type": "CAUTION", "msg": f"Pump Gas Interference: Fillage collapsed to {pump_fillage_pct:.1f}% due to low intake pressure."})
    if pump_bottleneck == "PUMP_CAPACITY_LIMITED":
        constraints.append({"type": "STATUS", "msg": "Pump Capacity Limited: Reservoir can deliver additional inflow if SPM is raised."})
    elif pump_bottleneck == "RESERVOIR_INFLOW_LIMITED":
        constraints.append({"type": "STATUS", "msg": "Inflow Limited: Pump displacing faster than reservoir pore drainage."})

    # Return full state bundle
    return {
        "timestamp_days": round(eff_elapsed_days, 1),
        "scrub_stage": round(stage, 1),
        "stage_name": get_stage_name(stage),
        "phase": "HUFF_INJECTION" if is_injecting else ("SOAK_SHUT_IN" if is_soaking else "PUFF_PRODUCTION"),
        "is_injecting": is_injecting,
        "is_soaking": is_soaking,
        "is_producing": is_producing,
        "steam": {
            "rate_tpd": inputs.steam_rate_tpd if is_injecting else 0.0,
            "temperature_c": inputs.steam_temp_c,
            "pressure_bar": inputs.injection_press_bar,
            "quality_pct": inputs.steam_quality_pct,
            "enthalpy_mw": steam_enthalpy_mw,
            "cumulative_tonnes": cum_steam_injected_tonnes,
        },
        "reservoir": {
            "pressure_psia": inputs.res_pressure_psia,
            "avg_temperature_c": round(t_avg_res_c, 1),
            "wellbore_temperature_c": round(t_wellbore_c, 1),
            "heated_radius_m": heated_radius_m,
            "wellbore_viscosity_cp": wellbore_viscosity_cp,
            "effective_viscosity_cp": effective_viscosity_cp,
            "viscosity_reduction_pct": viscosity_reduction_pct,
            "max_theoretical_inflow_bopd": round(q_max_bopd, 1),
            "actual_inflow_bopd": flowing_rate_bopd,
            "flowing_bottomhole_pressure_psia": operating_pwf_psia,
        },
        "well_and_pump": {
            "pump_active": inputs.pump_active,
            "spm": inputs.spm if inputs.pump_active else 0.0,
            "nominal_capacity_bopd": nominal_pump_cap_bopd,
            "delivered_oil_rate_bopd": flowing_rate_bopd,
            "water_rate_bwpd": produced_water_bwpd,
            "liquid_rate_blpd": total_liquid_rate_blpd,
            "pump_fillage_pct": pump_fillage_pct,
            "fluid_level_m": fluid_level_from_surface_m,
            "rod_load_lbs": rod_load_lbs,
            "motor_electric_kw": pump_electric_kw,
            "gas_interference": gas_interference_flag,
            "bottleneck": pump_bottleneck,
        },
        "surface": {
            "cumulative_oil_bbl": cum_oil_bbl,
            "steam_oil_ratio": sor,
            "tank_level_pct": tank_level_pct,
            "total_power_kw": total_kw,
            "water_cut_pct": inputs.water_cut_pct,
        },
        "constraints": constraints,
    }


def get_stage_name(stage: float) -> str:
    names = [
        "1. Native Reservoir Initial",
        "2. Steam Injection (Huff)",
        "3. Thermal Conduction Spread",
        "4. Viscosity Collapse",
        "5. Pore Oil Mobilization",
        "6. Rod Pump Lift",
        "7. Surface Separation & Storage",
        "8. AI Production Forecast",
    ]
    idx = max(0, min(len(names) - 1, int(round(stage))))
    return names[idx]
