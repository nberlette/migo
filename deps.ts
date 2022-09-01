import { Logger } from "https://deno.land/x/911@0.1.5/mod.ts";

export { formatHex, parse as parseColor } from "culori";

export { default as GOKV } from "gokv";

export { html } from "htm";

export { UnoCSS } from "htm/plugins.ts";

export { default as presetWind } from "@unocss/preset-wind.ts";

export { type ConnInfo, type Routes, serve, Status, STATUS_TEXT } from "sift";

export { render as renderToString } from "preact/render";

export { default as colorHash } from "colorhash";

export { render as rasterizeSVG } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";

export { config as dotenv } from "https://deno.land/std@0.153.0/dotenv/mod.ts";

export { is } from "https://deno.land/x/dis@0.0.1/mod.ts";

export * from "preact";

export {
  camelCase,
  decode,
  encode,
  etag,
  groupBy,
  isArray,
  isObject,
  json,
  kebabCase,
  Logger,
  lowerCase,
  sha1,
  sha256,
  snakeCase,
  sortBy,
  titleCase,
  toHex,
  toStringTag,
  upperCase,
  utf8TextDecoder,
  utf8TextEncoder,
  default as _,
} from "https://deno.land/x/911@0.1.5/mod.ts";

export const log = new Logger({
  level: "debug",
  labels: {
    Log: "LOG",
    Debug: "DEBUG",
    Info: "INFO",
    Warn: "WARN",
    Error: "ERROR",
    Fatal: "FATAL",
  },
  colors: {
    Log:   ["dim", "bold"],
    Debug: ["brightCyan", "bold"],
    Info:  ["brightBlue", "bold"],
    Warn:  ["brightYellow", "bold"],
    Error: ["brightRed", "bold"],
    Fatal: ["bgBrightRed", "bold"],
  },
  newline: false,
  timestamp: true,
});
