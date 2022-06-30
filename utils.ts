import { b64, Slugger } from "~/deps.ts";
export { colorHash, formatHex, parseColor, rasterizeSVG } from "~/deps.ts";

/**
 * safer shorthand for `encodeURIComponent`
 */
export const enc = (
  v: string,
) => (/([%][a-f0-9]{2})/ig.test(v) ? v : encodeURIComponent(v));

/**
 * safer shorthand for `decodeURIComponent`
 */
export const dec = (v: string) => decodeURIComponent(enc(v));

/**
 * format keys for storage in KV
 */
export const fmtkey = (
  url: string | URL,
  prefix = "item::",
) => (prefix + b64.encode(enc(new URL(url).toString())));

/**
 * Create slugs from titles
 * @TODO: fix this redudancy
 */
const slugger = new Slugger();
export const slugify = (s: string) => slugger.slug(s);

/**
 * Extracts and parses parameters from search query or from the path.
 * Allows delimiters of `&` (standard), `;`, or `::`.
 * Trims and runs `decodeURIComponent` on all values.
 * @returns an array of param entries in `[key, value]` format
 */
export const extractParamsEntries = (s: string) =>
  `${s ?? ""}`.split(/([:]{2}|[;&])/).map(
    (
      p: string,
    ) => [(p.split("=")[0] ?? "").trim(), dec((p.split("=")[1] ?? "").trim())],
  );
/**
 * Extracts params into entries and converts them into an Object.
 */
export const extractParamsObject = (s: string) =>
  Object.fromEntries(extractParamsEntries(s));

/**
 * Extracts params into entries and converts them into a new URLSearchParams instance.
 */
export const extractParams = (s: string) =>
  new URLSearchParams(extractParamsEntries(s));

/**
 * Extract an Object's toStringTag value
 */
export const toStringTag = (o: any) =>
  Object.prototype.toString.call(o).replace(/(?<=^\[object )(.+)(?=\]$)/, "$1");

/**
 * Check if an Object's toStringTag is equal to a given value
 * @returns true if
 */
export const toStringTagIs = (
  obj: any,
  tag: string,
): boolean => (toStringTag(obj).toLowerCase() === tag.toLowerCase());

/**
 * Create a responsive source set for images
 */
export function createSrcSet(url: string, sizes = [1280, 640, 480]): string {
  const originalWidth = 1280;
  // return `${url}?pxRatio=1 1280w, ${u}?pxRatio=0.5 640w, ${u}?pxRatio=${480 / 1280} 480w`
  return sizes.map((size) =>
    `${url}${(new URL(url).search === "") ? "?" : "&"}pxRatio=${
      size / originalWidth
    } ${size}w`
  ).join(", ");
}

/**
 * Adjusts an SVG's `viewBox` value to allow a given stroke width (`s`)
 * without any clipping along the borders of the icon.
 * @example adjustViewBox(2)("0 0 24 24") // -> "-4 -4 32 32"
 * @param s the stroke width to use as an adjustment factor
 * @returns formatted viewBox value with new dimensions
 */
export const adjustViewBox = (s: number) =>
  (match: string) => {
    // parse the 4 elements of the icon's existing viewBox
    const [x, y, w, h] = match.split(/[\s ]+/ig, 4).map((v) => +v);
    return `${x - (s * 2)} ${y - (s * 2)} ${w + (s * 4)} ${h + (s * 4)}`;
  };
