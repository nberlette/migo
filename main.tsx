/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.extras" />

/** @jsx h */
import {
  ColorScheme,
  type ConnInfo,
  etag,
  h,
  html,
  presetWind,
  rasterizeSVG,
  type Routes,
  serve,
  UnoCSS,
} from "./deps.ts";

import { assert, is } from "is";

import {
  cacheName,
  CACHING,
  DEBUG,
  FAVICON_URL,
  links,
  meta,
  shortcuts,
  styles,
} from "./src/constants.ts";

import { Home } from "./src/home.tsx";
import {
  collectParams,
  createResponse,
  generateSVG,
  Params,
} from "./src/utils.ts";

const cache = await caches.open(cacheName || "default");

if (DEBUG) {
  console.info(
    "%c%s\n",
    "font-weight:bold;color:#8dddff;",
    String.fromCodePoint(0x24dc, 0x20, 0x24d8, 0x20, 0x24d6, 0x20, 0x24de) +
      "  ",
  );
}

const handle = {
  /** image request handler */
  async image(
    req: Request,
    connInfo: ConnInfo,
    pathParams: Record<string, string>,
  ) {
    try {
      const url = new URL(req.url);
      const type = (pathParams?.type ?? "png");

      // ensure the type is only svg or png. default to png otherwise
      if (!["png", "svg"].includes(type)) {
        const newUrl = new URL(url);
        newUrl.pathname = newUrl.pathname.replace(
          /(?<=\.)([a-z0-9]{1,5})$/i,
          "png",
        );
        return Response.redirect(newUrl, 301);
      }

      // use a normalized set of parameters for more aggressive caching
      const params = collectParams(url, pathParams);
      const cacheKey = new URL(url);
      cacheKey.search = "?" + params.toString();

      // making use of Deno's new Cache API
      const cached = await cache?.match?.(cacheKey);
      if (is.response(cached)) {
        return cached;
      }

      let status = 201;
      const headers = new Headers();
      headers.set("Last-Modified", new Date().toISOString());
      headers.set("Age", "0");

      const contentType = (
        `image/${type === "png" ? "png" : "svg+xml"}; charset=utf-8`
      );

      // generate the svg graphic
      let body: Uint8Array | string = await generateSVG({ params, type });

      // rasterize it as a png, if needed
      if (type === "png") {
        body = await rasterizeSVG(body);
      }

      const responseToCache = await createResponse(body, {
        headers,
        status: 200,
        contentType,
      });

      cache?.put?.(cacheKey, responseToCache);

      return createResponse(body, {
        headers,
        status,
        params,
        contentType,
      });
    } catch (err) {
      console.error(err);
      return createResponse(DEBUG ? err : null, { status: 500 });
    }
  },
  /** home page request handler */
  home() {
    html.use(UnoCSS({
      presets: [presetWind()] as any,
      shortcuts,
    }));
    html.use(ColorScheme("auto"));
    return html({
      lang: "en",
      title: meta.title,
      meta: meta as any,
      links: links as { [key: string]: string; href: string; rel: string }[],
      styles,
      body: <Home />,
    });
  },

  async favicon() {
    const body = await fetch(FAVICON_URL).then((r) => r.arrayBuffer());

    const headers = new Headers();
    headers.set("Cache-Control", CACHING.long);
    headers.set("Content-Length", String(body.byteLength));
    headers.set("ETag", etag.encode(body, true));
    headers.set("Content-Type", "image/svg+xml; charset=utf-8");

    return new Response(body, { headers });
  },
  robotsTxt() {
    const body = `User-agent: *\nDisallow: *.png,*.svg\n`;
    const headers = new Headers();
    headers.set("Content-Type", "text/plain; charset=utf-8");
    headers.set("Cache-Control", CACHING.long);
    headers.set("Content-Length", String(body.length));
    headers.set("ETag", etag.encode(body, false));
    return new Response(body, { headers });
  },
};

serve({
  "/": handle.home,
  "/favicon.:ext(ico|svg)": handle.favicon,
  "/robots.txt": handle.robotsTxt,
  "/:title.:type(png|svg)": handle.image,
  "/:title/:subtitle.:type(png|svg)": handle.image,
  "/:params/:title/:subtitle([^]+?).:type(png|svg)": handle.image,
  "/:fallback([^]+?)": handle.image,
  404: handle.home,
} as Routes);
