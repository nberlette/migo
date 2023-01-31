/** @jsx h */

import { Home } from "./pages/home.tsx";
import { collectParams, createResponse, generateSVG } from "./helpers/utils.ts";

import {
  ColorScheme,
  type ConnInfo,
  h,
  html,
  is,
  presetWind,
  rasterizeSVG,
  type Routes,
  serve,
  UnoCSS,
} from "./deps.ts";

import {
  cacheName,
  DEBUG,
  FAVICON_URL,
  links,
  meta,
  shortcuts,
  styles,
} from "./lib/constants.ts";

if (DEBUG) {
  console.info(
    "%c%s\n",
    "font-weight:bold;color:#8dddff;",
    String.fromCodePoint(0x24dc, 0x20, 0x24d8, 0x20, 0x24d6, 0x20, 0x24de) +
      "  ",
  );
}

const handle = {
  /** the workhorse of the whole application: the image handler  */
  async image(
    req: Request,
    _ci: ConnInfo,
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

      let cache: Cache | undefined;
      try {
        cache = await caches?.open?.(cacheName || "default");
        // making use of Deno's new Cache API
        const cached = await cache?.match?.(cacheKey);
        if (is.response(cached)) {
          return cached;
        }
      } catch { /* ignore */ }

      let status = 200;

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
        is.assert.uint8Array(body);
      }

      try {
        const responseToCache = await createResponse(body, {
          headers,
          status: 200,
          contentType,
        });

        cache?.put?.(cacheKey, responseToCache);
      } catch { /* ignore */ }

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
    html.use(UnoCSS({ presets: [presetWind()] as any, shortcuts }));
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
  // favicon.{ico,png,svg}
  async favicon(_req: Request, _: any, { type = "svg" }: PathParams) {
    let body: Uint8Array | string = await (await fetch(FAVICON_URL)).text();
    let contentType = "image/svg+xml; charset=utf-8";
    if ((type === "png" || type === "ico") && is.nonEmptyString(body)) {
      body = await rasterizeSVG(body);
      contentType = "image/png; charset=utf-8";
    }
    return createResponse(body, { contentType });
  },
  // robots.txt file
  robotsTxt() {
    const body = `User-agent: *\nDisallow: *.png,*.svg\n`;
    return createResponse(body, { contentType: "text/plain; charset=utf-8" });
  },
};

serve({
  "/": handle.home,
  "/favicon.:type(ico|svg|png)": handle.favicon,
  "/robots.txt": handle.robotsTxt,
  "/:title.:type(png|svg)": handle.image,
  "/:title/:subtitle.:type(png|svg)": handle.image,
  "/:params/:title/:subtitle([^]+?).:type(png|svg)": handle.image,
  "/:fallback([^]+?)": handle.image,
  404: handle.home,
} as Routes);
