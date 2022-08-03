/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference types="../types.d.ts" />

/** @jsx h */
/** @jsxFrag Fragment */

import {
  colorHash,
  formatHex,
  h,
  Fragment,
  parseColor,
  renderToString,
  decode,
} from "~/deps.ts";
import { Params } from "~/src/utils.ts";
import { CDN_URL, defaultParams, FALLBACK_ICON_URL } from "~/src/constants.ts";
/**
 * Adjusts an SVG's `viewBox` value to allow a given stroke width (`s`)
 * without any clipping along the borders of the icon.
 * @internal
 * @example adjustViewBox(2)("0 0 24 24") // -> "-4 -4 32 32"
 * @param m the contents of the viewBox parameter
 * @param s the stroke width to use as an adjustment factor
 * @returns replacer function to formatted viewBox value using `str.replace`
 */
function adjustViewBoxValue(m: string, s: string | number) {
  const values = m.trim().split(/[\s ]+/g, 4);
  return values.map((v, i) =>
    +v + (i < 2 ? (-1 * Math.ceil(4 * +s)) : Math.ceil(8 * +s))
  ).join(" ");
}

function sanitizeIcon(iconContents: string): string {
  return iconContents
    .replace(/(?:[<][\?]xml(?:[^]+?)[\?][>])/ig, "")
    .replace(/(?:[<][!]--(?:[^]+?)--[>])/g, "")
    .replace(
      /[<](script|object|title|style|metadata)[^>]*[>]([^]+)[<][/]\1[>]/ig,
      "",
    )
    .replace(
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

export async function generateIcon(
  iconUrl: string,
  _props?: IconProps,
): Promise<any> {
  const {
    iconW: width = 240,
    iconH: height = width,
    iconColor: fill,
    iconStroke: stroke = "none",
    iconStrokeWidth: strokeWidth = "0",
    viewBox: _viewBox = "",
  } = _props ?? {} as IconProps;

  let iconContents: string;
  const res = await fetch(iconUrl);
  iconContents = res.ok
    ? (await res.text())
    : (await (await fetch(FALLBACK_ICON_URL)).text());

  const __html = sanitizeIcon(iconContents);

  if (stroke !== "none" || +strokeWidth > 0) {
    iconContents = iconContents.replace(
      /(?<=viewBox=['"])([^'"]+)(?=['"])/i,
      (m: string) => _viewBox || adjustViewBoxValue(m, +strokeWidth),
    );
  }

  return <defs dangerouslySetInnerHTML={{ __html }} />;
}

const createIconUrl = (icon: string) => (
  icon.startsWith("http")
    ? new URL(icon).href
    : new URL(`./${icon}.svg`, CDN_URL).href
);

const parseAndFormatHex = (c: string) =>
  [
      "currentColor",
      "transparent",
      "inherit",
      "none",
    ].includes(`${c}`)
    ? `${c}`
    : `${formatHex(parseColor(c))}`;

export async function generateSVG({
  params,
  type = "png",
}: {
  params?: Params;
  type?: string;
}): Promise<string> {
  let iconContents: any = "",
    iconType: string | null = "",
    icon: string | null = "twemoji:letter-m",
    iconColor = "currentColor";
  let iconUrl = createIconUrl(icon);

  [
    "bgColor",
    "titleColor",
    "subtitleColor",
    "iconColor",
    "titleStroke",
    "subtitleStroke",
    "iconStroke",
  ].forEach((c) => params.has(c) && formatHex(parseColor(params.get("c"))));

  const mergedParams: AllProps<string> = {
    ...defaultParams as any,
    ...params.toJSON(),
  };

  const {
    title,
    subtitle,
    width = "1280",
    height = (+width / 2),
    viewBox = `0 0 ${width} ${height}`,
    bgColor = "#fff",
    pxRatio = "2",
    iconW = "240",
    iconH = iconW,
    iconX = ((+width - +iconW) / 2),
    iconY = (+iconH / 3),
    iconStroke = "none",
    iconStrokeWidth = "0",
  } = mergedParams ?? {};

  const {
    titleFontSize = "48",
    titleFontFamily = "sans-serif",
    titleFontWeight = "bold",
    titleX = (+width / 2),
    titleY = ((+iconH) + (+iconY * 2) + (+titleFontSize * 1)),
    subtitleFontSize = "32",
    subtitleFontFamily = "monospace",
    subtitleFontWeight = "normal",
    subtitleX = (+width / 2),
    subtitleY = (+titleY + (+subtitleFontSize * 2)),
    titleColor = "#123",
    titleStroke = "none",
    titleStrokeWidth = "0",
    subtitleColor = "#345",
    subtitleStroke = "none",
    subtitleStrokeWidth = "0",
  } = mergedParams ?? {};

  if (params.has("iconUrl") || params.has("icon")) {
    if (params.has("icon")) {
      icon = decode(params.get("icon"));
    }
    iconUrl = createIconUrl(params.get("iconUrl") ?? icon);
    iconType = "other";

    if (icon != null) {
      iconColor = ((iconColor === "hash")
        ? (new colorHash().hex(`${title}`))
        : ((iconColor || null) ?? titleColor)) as string;
    } else {
      iconType = "none";
    }

    if (new URL(iconUrl).pathname.endsWith(".svg")) {
      iconType = "svg";
      iconContents = await generateIcon(iconUrl, {
        iconColor,
        iconStroke,
        iconStrokeWidth,
        iconW,
        iconH,
      } as any);
    }
  } else {
    iconType = "none";
    icon = null;
  }

  const svgProps = {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    viewBox,
    width: `${+width * +pxRatio}`,
    height: `${+height * +pxRatio}`,
  };
  const rectProps = { fill: bgColor, x: 0, y: 0, width, height };
  const iconProps = {
    x: iconX,
    y: iconY,
    width: iconW,
    height: iconH,
    ...(
      iconType === "svg"
        ? {
          href: "#icon",
          fill: iconColor ?? titleColor,
          stroke: iconStroke ?? "none",
          "stroke-width": +iconStrokeWidth,
        }
        : { href: iconUrl }
    ),
  };
  const titleProps = {
    id: "title",
    x: +titleX,
    y: +titleY,
    "font-size": titleFontSize,
    "font-family": decode(titleFontFamily),
    "font-weight": titleFontWeight,
    fill: titleColor,
    color: titleColor,
    stroke: titleStroke,
    "stroke-width": +titleStrokeWidth,
    "text-anchor": "middle",
    "dominantBaseline": "middle",
  };
  const subtitleProps = {
    id: "subtitle",
    x: +subtitleX,
    y: +subtitleY,
    "font-size": subtitleFontSize,
    "font-family": decode(subtitleFontFamily),
    "font-weight": subtitleFontWeight,
    fill: subtitleColor,
    color: subtitleColor,
    stroke: subtitleStroke,
    "stroke-width": +subtitleStrokeWidth,
    "text-anchor": "middle",
    "dominantBaseline": "middle",
  };
  const svg = (
    <svg {...svgProps}>
      <title>{decode(title)}</title>
      {iconType === "svg" && iconContents}
      <rect {...rectProps} />
      <g>
        {iconType === "svg"
          ? <use {...iconProps} />
          : (iconType !== "none" && <image {...iconProps} />)}
        <text {...titleProps}>
          <tspan>{decode(title)}</tspan>
        </text>
        <text {...subtitleProps}>
          <tspan>{decode(subtitle)}</tspan>
        </text>
      </g>
    </svg>
  );

  return renderToString(svg);
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
