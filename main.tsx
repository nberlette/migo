/// <reference no-default-lib="true" />
/** @jsx h */
import {
  type ConnInfo,
  decode,
  formatHex,
  GOKV,
  h,
  html,
  log,
  lowerCase,
  parseColor,
  presetWind,
  rasterizeSVG,
  type Routes,
  serve,
  UnoCSS,
} from "~/deps.ts";

import {
  defaultParams,
  FAVICON_URL,
  links,
  meta,
  styles,
  TTL_1Y,
} from "~/src/constants.ts";

import { Home } from "~/src/home.tsx";

import { formatKey, generateSVG, newResponse, Params } from "~/src/utils.ts";

import { shortcuts } from "src/constants.ts";

import { config as dotenv } from "std/dotenv/mod.ts";

await dotenv({/* dotenv options */}).catch(log.error);

/**
 * Authenticate and configure Cloudflare KV
 * @see {@link https://gokv.io}
 */
const namespace = Deno.env.get("GOKV_NAMESPACE") ?? "migo";
try {
  const token = Deno.env.get("GOKV_TOKEN") ?? null;
  GOKV.config({ token });
} catch (e) {
  throw new Error(`Failed to configure GOKV! ${e.toString()}`);
}

export const $kv = GOKV.KV({ namespace: `${namespace}-kv` });
export const $fs = GOKV.Uploader({
  acceptTypes: [
    "image/png",
    "image/jpeg",
    "image/avif",
    "image/webp",
    "image/svg+xml",
  ],
  limit: 1024 * 1024 * 10,
});

html.use(UnoCSS({
  presets: [presetWind()] as any,
  shortcuts,
}));

console.log(
  "\n%c%s\n",
  "font-weight:bold;color:#8dddff;",
  String.fromCodePoint(0x24dc, 0x20, 0x24d8, 0x20, 0x24d6, 0x20, 0x24de) + "  ",
);

const handle = {
  /** image request handler */
  async image(
    req: Request,
    connInfo: ConnInfo,
    pathParams: Record<string, string>,
  ) {
    const url = new URL(req.url);
    const { type } = pathParams;

    let contentType = "image/svg+xml;charset=utf-8";
    if (type === "png") {
      contentType = "image/png;charset=utf-8";
    }
    if (!["png", "svg"].includes(type)) {
      const newUrl = new URL(url);
      newUrl.pathname = newUrl.pathname + ".png";
      return Response.redirect(newUrl, 301);
    }

    // janky way to fix some routing issues
    if (pathParams.params == null) {
      if (
        pathParams.title != null && Params.pattern.params.test(pathParams.title)
      ) {
        pathParams.params = pathParams.title;
        if (pathParams.subtitle != null) {
          pathParams.title = pathParams.subtitle;
          delete pathParams.subtitle;
        } else {
          delete pathParams.title;
        }
      } else if (Params.pattern.params.test(pathParams.subtitle)) {
        pathParams.params = pathParams.subtitle;
        delete pathParams.subtitle;
      } else {
        pathParams.params = pathParams.title;
      }
    }
    /**
     * If path parameters have been provided, combine them with any existing query params,
     * for maximum compatibility and flexibility with different requests.
     */
    const pathParameters = new Params(decode(pathParams?.params));
    const searchParams = new Params(url.searchParams.toString());
    const mergedParams = {
      ...defaultParams,
      ...pathParams,
      ...pathParameters.toJSON(),
      ...searchParams.toJSON(),
    };

    const params = new Params(mergedParams);

    for (const key of Object.keys(mergedParams)) {
      const val = decode(mergedParams[key]);
      if (Params.pattern.params.test(val)) {
        Params.parse(val).forEach((v, k) => {
          v = decode(v)?.trim?.() ?? "";
          if (lowerCase(k).endsWith("color")) {
            params.set(k, formatHex(parseColor(decode(v))));
          } else {
            params.set(k, v);
          }
        });
      } else {
        if (lowerCase(key).endsWith("color")) {
          params.set(key, formatHex(parseColor(decode(val))));
        } else {
          params.set(key, val);
        }
      }
    }

    for (const key of url.searchParams.keys()) {
      const val = decode(url.searchParams.get(key));
      if (lowerCase(key).endsWith("color")) {
        params.set(key, formatHex(parseColor(decode(val))));
      } else {
        params.set(key, val);
      }
    }

    // params.distinct();

    url.search = "?" + params.toString();
    const key: string = await formatKey(params.toString(), "asset::");

    console.log(
      "[SHA-256 KEY]:\n  %s\n\n[REQUEST PARAMS]:\n  %s\n",
      key,
      params.toString(),
    );

    let data: any, status = 200;

    if ((data = await $kv.get(key, { type: "arrayBuffer" }))) {
      return await newResponse(data, { params, contentType, status });
    }
    status = 201;
    data = await generateSVG({ params, type });

    if (type === "png") {
      data = rasterizeSVG(data);
    }

    try {
      await $kv.put(key, data, {
        metadata: {
          url: url.toString(),
          conn: connInfo,
          date: new Date().toJSON(),
        },
        expirationTtl: TTL_1Y,
      });
      status = 201;
    } catch (err) {
      log.error(err);
    }
    return newResponse(data, { contentType, status });
  },
  /** home page request handler */
  home: () =>
    html({
      lang: "en",
      title: meta.title,
      meta: meta as any,
      links,
      styles,
      body: <Home />,
    }),
  favicon: async () =>
    newResponse(await fetch(FAVICON_URL).then((r) => r.arrayBuffer())),
  robotsTxt: () =>
    newResponse(`User-agent: *\nDisallow:\n`, {
      contentType: "text/plain",
    }),
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
