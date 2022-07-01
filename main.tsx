/** @jsx h */
import { $, h, html, serve } from "~/deps.ts";
import {
  cacheTerm,
  links,
  meta,
  namespace,
  siteMeta,
  token,
  TTL_1Y,
} from "~/constants.ts";
import utils from "~/utils.ts";
import Home from "~/home.tsx";

const debug = true;

/**
 * Authenticate and configure Cloudflare KV
 * @see {@link https://gokv.io}
 */
$.config({ token });
const $kv = $.KV({ namespace });

/**
 * Route handlers
 */
const handle = {
  async image(req: Request, connInfo: ConnInfo, {
    title,
    subtitle,
    params,
    type,
  }: PathParams) {
    const url = new URL(req.url);
    let contentType = "image/svg+xml;charset=utf-8";

    if (!["png", "svg"].includes(type)) {
      const newUrl = new URL(url);
      newUrl.pathname = newUrl.pathname + ".png";
      return Response.redirect(newUrl, 301);
    }
    if (type === "png") {
      contentType = "image/png;charset=utf-8";
    }

    /**
     * If path parameters have been provided, combine them with any existing query params,
     * for maximum compatibility and flexibility with different requests.
     */
    const searchParams = new URLSearchParams(
      Object.assign(
        {},
        utils.extractParamsObject(params),
        utils.extractParamsObject(url.searchParams.toString()),
      ),
    );

    const key: string = await utils.formatKey(req.url, "asset::");
    let data: any = await $kv.get(key, { type: "arrayBuffer" });
    if (debug) console.log(key);

    if (data != null) {
      return new Response(data, {
        headers: {
          "access-control-allow-origin": "*",
          "content-type": contentType,
          "content-length": `${data.byteLength}`,
          "cache-control":
            cacheTerm[searchParams.has("no-cache") ? "none" : "long"],
        },
      });
    }

    let {
      width = "1280",
      height = (+width / 2),
      viewBox = `0 0 ${width} ${height}`,
      bgColor = "#fff",
      pxRatio = "2",
      titleFontSize = "48",
      titleFontFamily = "sans-serif",
      titleFontWeight = "bold",
      titleColor = "#123",
      titleStroke = "none",
      titleStrokeWidth = "2",
      subtitleFontSize = "32",
      subtitleFontFamily = "monospace",
      subtitleFontWeight = "normal",
      subtitleColor = "#345",
      subtitleStroke = "none",
      subtitleStrokeWidth = "2",
      icon = "deno",
      iconUrl = `https://icns.ml/${icon}.svg`,
      iconColor = null,
      iconStroke = "none",
      iconStrokeWidth = "2",
      iconW = "250",
      iconH = iconW,
      iconX = ((+width - +iconW) / 2),
      iconY = (+iconH / 3),
      titleX = (+width / 2),
      titleY = ((+iconH) + (+iconY * 2) + +titleFontSize),
      subtitleX = (+width / 2),
      subtitleY = (+titleY + (+subtitleFontSize * 2)),
    } = Object.fromEntries([...searchParams.entries()]);

    let iconContents = "", iconType = "";

    if (icon != null) {
      icon = utils.decode(icon ?? "deno");
      if (iconColor === "hash") {
        iconColor = new utils.colorHash().hex(title);
      }
      iconUrl ??= searchParams.has("iconUrl")
        ? utils.decode(searchParams.get("iconUrl"))
        : `https://icns.ml/${icon}.svg?fill=currentColor&color=${
          iconColor ?? titleColor
        }`;

      iconContents = await (await fetch(iconUrl)).text();

      if (new URL(iconUrl).pathname.endsWith(".svg")) {
        iconType = "svg";
        iconContents = iconContents
          .replace(/^<svg/i, '<symbol id="icon"')
          .replace(/<\/svg>/i, "</symbol>");
        // adjust size of viewBox to account for stroke-width
        if (iconStroke !== "none") {
          iconContents = iconContents.replace(
            /(?<=viewBox=['"])([^'"]+)(?=['"])/i,
            utils.adjustViewBox(+iconStrokeWidth),
          );
        }
      } else {
        iconType = "other";
      }
    }

    data = `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${(+width * +pxRatio)}"
  height="${(+height * +pxRatio)}"
  viewBox="${viewBox}"
  role="img"
>
  <title>${utils.decode(title)}</title>
  <rect fill="${
      utils.formatHex(utils.parseColor(bgColor))
    }" x="0" y="0" width="${width}" height="${height}" />
  ${iconType === "svg" ? `<defs>${iconContents}</defs>` : ""}
  <g stroke="none" fill="none" fill-rule="evenodd">
    ${
      (searchParams.has("noIcon") || icon === "false")
        ? ""
        : (iconType === "svg"
          ? `<use href="#icon" color="${
            utils.formatHex(utils.parseColor(iconColor))
          }" stroke="${utils.formatHex(utils.parseColor(iconStroke))}"
          stroke-width="${iconStrokeWidth ?? 0}"`
          : `<image href="${iconUrl}"`) +
          ` width="${iconW}" height="${iconH}" x="${iconX}" y="${iconY}" />`
    }
    <text
      id="title"
      text-anchor="middle"
      font-family="${titleFontFamily}"
      font-size="${titleFontSize}"
      font-weight="${titleFontWeight}"
      fill="${utils.formatHex(utils.parseColor(titleColor))}"
      stroke="${utils.formatHex(utils.parseColor(titleStroke))}"
      stroke-width="${titleStrokeWidth}"
      x="${titleX}"
      y="${titleY}"
    ><tspan>${utils.decode(title)}</tspan></text>
    ${
      subtitle
        ? `<text
      id="subtitle"
      text-anchor="middle"
      font-family="${subtitleFontFamily}"
      font-size="${subtitleFontSize}"
      font-weight="${subtitleFontWeight}"
      fill="${utils.formatHex(utils.parseColor(subtitleColor))}"
      stroke="${utils.formatHex(utils.parseColor(subtitleStroke))}"
      stroke-width="${subtitleStrokeWidth}"
      x="${subtitleX}"
      y="${subtitleY}"
    ><tspan>${utils.decode(subtitle)}</tspan></text>`
        : ""
    }
  </g>
</svg>`;

    if (type === "png") {
      data = utils.rasterizeSVG(data);
    }

    const headers = {
      "access-control-allow-origin": "*",
      "content-type": contentType,
      "content-length": data.length,
      "cache-control":
        cacheTerm[searchParams.has("no-cache") ? "none" : "long"],
    };

    let status = 200;

    try {
      await $kv
        .put(key, data, {
          metadata: {
            url: url.toString(),
            conn: connInfo,
            date: new Date().toJSON(),
          },
          // set cacheTtl (unless no-cache is passed)
          // cacheTtl: searchParams.has('no-cache') ? 60 : TTL_1M,
          expirationTtl: TTL_1Y,
        });
      status = 201;
    } catch (err) {
      console.error(err);
    }
    return new Response(data, { headers, status });
  },
  home(req: Request, connInfo: ConnInfo, params: PathParams) {
    // render jsx homepage
    return html({
      lang: "en",
      title: siteMeta.siteTitle,
      meta,
      links,
      styles: [],
      body: <Home />,
    });
  },
  /**
   * @param req Request
   * @param connInfo Connect Information
   * @param params URL Parameters
   * @returns Response
   */
  async favicon(req: Request, connInfo: ConnInfo, params: PathParams) {
    const res = await fetch(
      "https://icns.ml/mdi:alpha-m-circle-outline:dynamic.svg",
    );
    const favicon = await res.arrayBuffer();
    return new Response(favicon, {
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "image/svg+xml;charset=utf-8",
        "content-length": `${favicon.byteLength}`,
        "cache-control": cacheTerm.long,
      },
    } as ResponseInit);
  },
  robotsTxt(req: Request, connInfo: ConnInfo, params: PathParams) {
    return new Response(`User-agent: *\nDisallow:\n`, {
      headers: {
        "access-control-allow-origin": "*",
        "content-type": "text/plain;charset=utf-8",
      },
    });
  },
};

serve({
  "/": handle.home,
  "/favicon.:ext(ico|svg)": handle.favicon,
  "/robots.txt": handle.robotsTxt,
  "/:params/:title/:subtitle([^]+?).:type(png|svg)": handle.image,
  "/:params/:title([^]+?).:type(png|svg)": handle.image,
  "/:title([^]+?).:type(png|svg)": handle.image,
  "/:wheresmyextension([^]+?)": handle.image,
  404: handle.home,
} as Routes);
