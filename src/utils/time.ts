import log from "./log.ts";

/**
 * Maps human-readable time measurement names to their numeric values.
 * (in scientific notation)
 * @enum TimePortalUnits
 */
enum TimeUnits {
  /** 1 nanosecond */
  nanosecond = 1e-6,
  /** 1 millisecond */
  millisecond = 1e-3,
  /** 1 second */
  second = 1,
  /** 1 minute */
  minute = 60,
  /** 1 hour */
  hour = 3.6e3,
  /** 1 day */
  day = 8.64e4,
  /** 1 week */
  week = 6.048e5,
  /** 1 month */
  month = 2.628e6,
  /** 1 year */
  year = 3.1536e7,
  /** nanosecond */
  nanos = nanosecond,
  /** millisecond */
  millis = millisecond,
  /** second */
  sec = second,
  /** minute */
  min = minute,
  /** hour */
  hr = hour,
  /** week */
  wk = week,
  /** month */
  mo = month,
  /** year */
  yr = year,
  /** nanosecond */
  ns = nanosecond,
  /** millisecond */
  ms = millisecond,
  /** second */
  s = second,
  /** minute */
  m = minute,
  /** hour */
  h = hour,
  /** day */
  d = day,
  /** week */
  w = week,
  /** month */
  M = month,
  /** year */
  Y = year,
}

export { TimeUnits };

/**
 * Generates a relative timestamp (milliseconds since 1970-01-01) based on
 * a given number past (negative value) or future (positive value).
 * @example portal(-1); // unit defaults to `day`
 * // -86400000 - one day ago
 * portal(-1, "week");
 * // -604800000 - one week ago
 * portal(1, "week", true); // absolute = true
 * // 1659421983126 - one week from now
 * @example portal(180) // timestamp for 6 months from now
 * @param n number of units to travel in time (positive or negative)
 * @param unit describes the units of `n` (default = "day")
 * @returns
 */
export function portal(
  n: number,
  unit: keyof typeof TimeUnits = "day",
  scale: "second" | "millisecond" = "second",
): number {
  return n * (+TimeUnits[unit] / +TimeUnits[scale]);
}

export function portalAbs(
  n: number,
  unit: keyof typeof TimeUnits = "day",
  scale: "second" | "millisecond" = "second",
): number {
  return portal(n, unit, scale) + Date.now();
}

/**
 * @param value number to format to a relative string
 * @param unit relative units of time (e.g. `"days"`, `"hours"`, etc.)
 * @param options configure the behavior of the time formatting API
 * @returns
 */
export function relative(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  {
    style = "long",
    numeric = "auto",
    locales = "en",
    localeMatcher = "best fit",
  }: Intl.RelativeTimeFormatOptions & { locales?: string | string[] } = {},
): string {
  try {
    return new Intl.RelativeTimeFormat(locales, {
      style,
      numeric,
      localeMatcher,
    }).format(value, unit);
  } catch (e) {
    log.error(e);
    return "";
  }
}
