import {
  camelCase,
  formatHex,
  kebabCase,
  lowerCase,
  parseColor,
  rasterizeSVG,
  snakeCase,
  titleCase,
  upperCase,
} from "~/deps.ts";

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

/**
 * Utilities and helpers
 */
export const uuid = () => crypto.randomUUID();

export default {
  camelCase,
  formatHex,
  lowerCase,
  kebabCase,
  parseColor,
  rasterizeSVG,
  snakeCase,
  titleCase,
  upperCase,
};

export {
  camelCase,
  formatHex,
  kebabCase,
  lowerCase,
  parseColor,
  rasterizeSVG,
  snakeCase,
  titleCase,
  upperCase,
};
