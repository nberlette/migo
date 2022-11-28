export * from "./svg.tsx";
import { cacheTerm } from "./constants.ts";
import {
  decode,
  encode,
  etag,
  is,
  json,
  kebabCase,
  sha1,
  sha256,
} from "../deps.ts";

import { collectParams, formatParams, Params } from "./params.ts";

export { collectParams, formatParams, Params };

export interface ResponseProps {
  params?: URLSearchParams;
  contentType?: string;
}

export async function createResponse(
  data: string | ArrayBuffer | Uint8Array,
  {
    params = new URLSearchParams(),
    contentType = "image/svg+xml; charset=utf-8",
    status = 200,
    headers = {},
    ...init
  }: ResponseInit & ResponseProps = {},
): Promise<Response> {
  const contentLength = is.uint8Array(data) || is.arrayBuffer(data)
    ? data.byteLength
    : is.string(data)
    ? data.length
    : String(data).length;

  return new Response(data, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": contentType,
      "content-length": `${contentLength}`,
      "cache-control": cacheTerm[params.has("no-cache") ? "none" : "long"],
      "etag": etag.encode(data, false),
      ...headers,
    },
    ...(init ?? {}),
  });
}

export { createResponse as newResponse };

/**
 * Adjusts an SVG's `viewBox` value to allow a given stroke width (`s`)
 * without any clipping along the borders of the icon.
 * @internal
 * @example adjustViewBox(2)("0 0 24 24") // -> "-4 -4 32 32"
 * @param m the contents of the viewBox parameter
 * @param s the stroke width to use as an adjustment factor
 * @returns replacer function to formatted viewBox value using `str.replace`
 */
export function adjustViewBoxValue(m: string, s: string | number) {
  const values = m.trim().split(/[\s ]+/g, 4);
  return values.map((v, i) =>
    +v + (i < 2 ? (-1 * Math.ceil(4 * +s)) : Math.ceil(8 * +s))
  ).join(" ");
}

export function sanitizeIcon(iconContents: string): string {
  return iconContents
    .replace(/(?:[<][\?]xml(?:[^]+?)[\?][>])/ig, "")
    .replace(/(?:[<][!]--(?:[^]+?)--[>])/g, "")
    .replace(
      /[<](script|object|title|style|metadata)[^>]*[>]([^]+)[<][/]\1[>]/ig,
      "",
    ).replace(
      /.*[<]svg([^>]+)[>]([^]+?)[<][/]svg[>].*/i,
      (_m, attr, html) =>
        `<symbol id="icon" ${
          attr.replace(
            /(?:\b(.+?)[=]['"](.+?)['"])/g,
            (
              _m: string,
              a: string,
              v: string,
            ) => ([
                "viewBox",
                "stroke-width",
                "fill",
                "color",
                "stroke",
                "width",
                "height",
              ].includes(a)
              ? `${a}="${v}"`
              : ""),
          )
        }>${html}</symbol>`,
    )
    .replace(/(^[\r\n\t]+|[\n\t]+)/g, "")
    .replace(/[\s ]{2,}/g, " ")
    .replace(/(['"])([a-z0-9-]+)(?=[=]['"])/ig, "$1 $2")
    .trim();
}

/**
 * Create a responsive source set for images
 */
export function createSrcSet(url: string, sizes = [1280, 640, 480]): string {
  const originalWidth = 1280;
  return sizes.map((size) =>
    `${url}${url.includes("?") ? "&" : "?"}pxRatio=${
      size / originalWidth
    } ${size}w`
  ).join(", ");
}

export function prettyBytes(bytes: number) {
  const units = ["", "K", "M", "G", "T", "P", "E"];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes * 100 / Math.pow(1024, exp)) / 100}${units[exp]}B`;
}

/**
 * Normalizes a string's case and whitespace to be used in URLs as a "slug".
 * @param str the string to "slugify"
 * @returns normalized, lowercase string, only non-alphanumeric chars
 */
export function slugify(str: string): string {
  return kebabCase(str)
    .replace(/[^a-z0-9-]+|[-]+/ig, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

import { log } from "~/deps.ts";

export {
  dayOfYear,
  difference,
  type DifferenceFormat,
  type DifferenceOptions,
  format,
  isLeap,
  parse,
  toIMF,
  type Unit,
  weekOfYear,
} from "std/datetime/mod.ts";

/**
 * @param value number to format to a relative string
 * @param unit relative units of time (e.g. `"days"`, `"hours"`, etc.)
 * @param options configure the behavior of the time formatting API
 * @returns
 */
export function relativeTime(
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

/**
 * Maps human-readable time measurement names to their numeric values.
 * (in scientific notation)
 * @enum TimePortalUnits
 */
export enum TimeUnits {
  second = 1e3,
  millisecond = 1e-3 * second,
  microsecond = 1e-6 * second,
  nanosecond = 1e-9 * second,
  /**
   * set to 1 to scale everything down to seconds.
   * leave as 1e3 to scale everything as milliseconds.
   */
  minute = 60 * second,
  hour = 3.6e3 * second,
  day = 8.64e4 * second,
  week = 6.048e5 * second,
  month = 2.628e6 * second,
  year = 3.1536e7 * second,

  millis = millisecond,
  nanos = nanosecond,
  micros = microsecond,
  sec = second,
  min = minute,
  hr = hour,
  wk = week,
  mo = month,
  yr = year,
  ms = millisecond,
  ns = nanosecond,
  us = microsecond,
  s = second,
  m = minute,
  h = hour,
  d = day,
  w = week,
  M = month,
  Y = year,
}

/**
 * 1/1000th of a second is... 1 millisecond. 1e-3;
 */
export const MILLISECOND = TimeUnits.ms;

/**
 * 1 billionth of a second: 1 nanosecond. 1e-9;
 */
export const NANOSECOND = TimeUnits.ns;

/**
 * 1 millionth of a second: 1 microsecond. 1e-6;
 */
export const MICROSECOND = TimeUnits.us;

/**
 * 1 second
 */
export const SECOND = TimeUnits.second;

/**
 * 1 minute
 */
export const MINUTE = TimeUnits.minute;

/**
 * 1 hour
 */
export const HOUR = TimeUnits.hour;

/**
 * 1 day
 */
export const DAY = TimeUnits.day;

/**
 * 1 week
 */
export const WEEK = TimeUnits.week;

/**
 * 1 month; 1/12th of a year; just over 30 days.
 */
export const MONTH = TimeUnits.month;

/**
 * 1/4 of a year (3 months).
 */
export const QUARTER = TimeUnits.year / 4;

/**
 * 1 year of seconds (or milliseconds).
 */
export const YEAR = TimeUnits.year;

/**
 * 10 years in seconds.
 */
export const DECADE = TimeUnits.year * 10;

/**
 * 100 years in seconds.
 */
export const CENTURY = TimeUnits.year * 100;

// shorthand aliases
export {
  DAY as DY,
  HOUR as HR,
  MICROSECOND as US,
  MILLISECOND as MS,
  MINUTE as MIN,
  MONTH as MO,
  NANOSECOND as NS,
  QUARTER as QR,
  SECOND as SEC,
  WEEK as WK,
  YEAR as YR,
};

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

export { decode, encode, etag, json, kebabCase, sha1, sha256 };

export {
  camelCase,
  formatHex,
  groupBy,
  isObject,
  log,
  lowerCase,
  parseColor,
  rasterizeSVG,
  snakeCase,
  sortBy,
  titleCase,
  toHex,
  toStringTag,
  upperCase,
  utf8TextDecoder,
  utf8TextEncoder,
} from "../deps.ts";
