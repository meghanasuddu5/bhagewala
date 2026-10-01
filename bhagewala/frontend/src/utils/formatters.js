/**
 * Baghewala Well-to-Surface Digital Twin — Single Source Formatter Utility
 * Eliminates all 'NaN', 'undefined', 'null', and raw enum text leaks across the UI.
 */

/**
 * Formats any numeric or nullable value cleanly with units and precision guards.
 * @param {any} val - The input value (number, string, null, undefined)
 * @param {object} opts - Formatting options
 * @param {number} [opts.precision=1] - Decimal precision
 * @param {string} [opts.unit=''] - Unit suffix (e.g. 't/d', 'cP', 'BOPD')
 * @param {string} [opts.fallback='—'] - String to return if value is invalid/unavailable
 * @param {boolean} [opts.useGrouping=true] - Whether to use comma separators (e.g. 14,500)
 * @param {boolean} [opts.sign=false] - Whether to force a leading + for positive numbers
 * @returns {string} Formatted output string
 */
export function formatValue(val, opts = {}) {
  const {
    precision = 1,
    unit = '',
    fallback = '—',
    useGrouping = true,
    sign = false,
  } = opts;

  if (val === null || val === undefined || val === '') {
    return fallback;
  }

  const num = typeof val === 'number' ? val : parseFloat(val);

  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }

  let formattedNum;
  if (precision === 0) {
    const rounded = Math.round(num);
    formattedNum = useGrouping ? rounded.toLocaleString('en-US') : rounded.toString();
  } else {
    const fixed = num.toFixed(precision);
    if (useGrouping) {
      const parts = fixed.split('.');
      parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
      formattedNum = parts.join('.');
    } else {
      formattedNum = fixed;
    }
  }

  const prefix = (sign && num > 0) ? '+' : '';
  const unitStr = unit ? ` ${unit}` : '';
  return `${prefix}${formattedNum}${unitStr}`;
}

/**
 * Formats a cycle operational phase into calm, professional industrial language.
 * @param {string} phase - Raw phase enum (e.g. 'HUFF_INJECTION', 'PUFF_PRODUCTION')
 * @returns {string}
 */
export function formatPhase(phase) {
  if (!phase) return 'Idle / Standby';
  const p = String(phase).toUpperCase();
  if (p.includes('HUFF') || p.includes('INJECT')) return 'Huff - Steam Injection';
  if (p.includes('SOAK')) return 'Soak - Thermal Equilibration';
  if (p.includes('PUFF') || p.includes('PROD')) return 'Puff - Production';
  return 'Standby / Idle';
}

/**
 * Formats stage number into human-readable sequence string: "stage X of Y"
 * @param {number|string} stage
 * @param {number} [total=8]
 * @returns {string}
 */
export function formatStage(stage, total = 8) {
  const s = Math.max(1, Math.min(total, Math.round(Number(stage) || 1)));
  return `stage ${s} of ${total}`;
}

/**
 * Formats percentage with sign option.
 */
export function formatPercent(val, precision = 1, sign = false) {
  return formatValue(val, { precision, unit: '%', sign });
}

/**
 * Formats rate in BOPD.
 */
export function formatBOPD(val, precision = 1) {
  return formatValue(val, { precision, unit: 'BOPD' });
}

/**
 * Formats viscosity in cP.
 */
export function formatViscosity(val, precision = 1) {
  return formatValue(val, { precision, unit: 'cP' });
}

/**
 * Formats temperature in °C.
 */
export function formatTemp(val, precision = 1) {
  return formatValue(val, { precision, unit: '°C' });
}

/**
 * Formats pressure in psia or bar.
 */
export function formatPressure(val, unit = 'psia', precision = 1) {
  return formatValue(val, { precision, unit });
}
