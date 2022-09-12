/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference types="../types.d.ts" />

/** @jsx h */
/** @jsxFrag Fragment */

import {
  colorHash,
  decode,
  formatHex,
  Fragment,
  h,
  parseColor,
  renderToString,
} from "../deps.ts";

import { adjustViewBoxValue, Params, sanitizeIcon } from "./utils.ts";

import { CDN_URL, defaultParams, FALLBACK_ICON_URL } from "./constants.ts";

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

export async function generateSVG({
  params,
  type = "png",
}: {
  params?: Params;
  type?: string;
}): Promise<string> {
  const createIconUrl = (icon: string) => (
    icon.startsWith("http")
      ? new URL(icon).href
      : new URL(`./${icon}.svg`, CDN_URL).href
  );

  let iconContents: any = "",
    iconType: string | null = "",
    icon: string | null = "twemoji:letter-m",
    iconColor = params.has("iconColor")
      ? params.get("iconColor")
      : "currentColor";
  let iconUrl = createIconUrl(icon);

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
    borderRadius = "0",
    iconW = "240",
    iconH = iconW,
    iconX = ((+width - +iconW) / 2),
    iconY = (+iconH / 3),
    iconStroke = "none",
    iconStrokeWidth = "0",
    titleFontSize = "48",
    titleFontFamily = "serif",
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
    titleTextAnchor = "middle",
    subtitleColor = "#345",
    subtitleStroke = "none",
    subtitleStrokeWidth = "0",
    subtitleTextAnchor = "middle",
  } = mergedParams ?? {};

  params = new Params(mergedParams);

  [
    "bgColor",
    "titleColor",
    "subtitleColor",
    "iconColor",
    "titleStroke",
    "subtitleStroke",
    "iconStroke",
  ].forEach((c) => params.has(c) && formatHex(parseColor(params.get(c))));

  if (params.has("iconUrl") || params.has("icon")) {
    if (params.has("icon")) {
      icon = decode(params.get("icon"));
    }
    iconUrl = createIconUrl(params.get("iconUrl") ?? icon);
    iconType = "other";

    if (icon != null) {
      iconColor = ((iconColor === "hash")
        ? (new colorHash().hex(`${title}`))
        : (iconColor ?? titleColor)) as string;
    } else {
      iconType = "none";
    }

    if (/(\.svg|^data[:]image\/svg+xml)/ig.test(new URL(iconUrl).href)) {
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
  const rectProps = { fill: bgColor, x: 0, y: 0, width, height, rx: borderRadius };
  const iconProps = {
    x: iconX,
    y: iconY,
    width: iconW,
    height: iconH,
    href: iconUrl,
  };
  if (iconType === "svg") {
    Object.assign(iconProps, {
      href: "#icon",
      color: iconColor || titleColor,
      fill: "currentColor",
      stroke: iconStroke ?? "none",
      "stroke-width": +iconStrokeWidth || 0,
    });
  }
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
    "text-anchor": titleTextAnchor,
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
    "text-anchor": subtitleTextAnchor,
    "dominantBaseline": "middle",
  };
  const svg = (
    <svg {...svgProps}>
      <title>{decode(title)}</title>
      {iconType === "svg" && iconContents}
      <rect {...rectProps} />
      <g>
        {iconType === "svg"
          ? <use color={iconColor ?? titleColor} {...iconProps} />
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
