import utils from "~/utils.ts";
const enc = utils.encode;

export const namespace = Deno.env.get("GOKV_NAMESPACE") || "migo";
export const token = Deno.env.get("GOKV_TOKEN") || null;

/**
 * various cache TTL values, from 1 minute to 1 year
 */
export const TTL_MN = 60; // ............1 minute
export const TTL_1H = TTL_MN * 60; // ...1 hour
export const TTL_1D = TTL_1H * 24; // ...1 day
export const TTL_1W = TTL_1D * 7.125; // 1 week
export const TTL_1M = TTL_1W * 4; // ... 1 month
export const TTL_1Y = TTL_1M * 12; // .. 1 year

/**
 * Cache-Control header values for long-term, short-term, and no-cache.
 */
export const cacheTerm: Record<string, string> = {
  none: "public, no-cache, no-store, s-maxage=0, max-age=0, must-revalidate",
  short:
    `public, s-maxage=300, max-age=300, stale-if-error=60, stale-while-revalidate=30`,
  long:
    `public, s-maxage=${TTL_1Y}, max-age=${TTL_1M}, stale-if-error=${TTL_1H}, stale-while-revalidate=${TTL_MN}`,
} as const;

/**
 * Default Param values for the handle.image() function
 */
export const defaultParams: Record<string, string> = {
  title: "Edge-rendered OpenGraph Images with Deno",
  subtitle: "migo.deno.dev",
} as const;

/**
 * Metadata for SEO
 */
export const siteMeta: Record<string, string> = {
  url: "https://migo.deno.dev",
  title: defaultParams.title,
  author: "Nicholas Berlette",
  siteTitle: `${defaultParams.title} · migo`,
  description:
    "Edge-generated OpenGraph images, globally distributed via the Deno Edge Network.",
  keywords:
    "deno deploy,migo,edge,api,serverless,opengraph,generator,dynamic,image generator,social media,social images,deno,cover+images,ogimage,twittercard api,cloudflare,workers,generator",
  coverImageAlt:
    `https://migo.deno.dev/icon=nuxtdotjs;bgColor=112233;iconColor=00DC82;iconStroke=00DC82;iconStrokeWidth=0.55;titleColor=00DC82;subtitleColor=e0e0e0;iconW=300;iconH=300;iconY=50/Nuxt%20ContentWind%20Starter/stackblitz.com%2fedit%2fcontent-wind.png`,
  coverImageDark:
    `https://migo.deno.dev/icon=deno&iconStrokeWidth=0.33&subtitleFontSize=48&iconColor=345&bgColor=234&iconStroke=fff&titleColor=fff&subtitleColor=papayawhip/${
      enc(defaultParams.title)
    }/${defaultParams.subtitle}.png`,
  coverImage:
    `https://migo.deno.dev/icon=mdi:alpha-o-circle:white&subtitleFontSize=48&iconColor=fff&iconW=300&iconH=300&bgColor=indianred&titleColor=white&titleFontFamily=monospace&titleFontSize=72&titleFontWeight=bold/${
      enc(defaultParams.subtitle)
    }.png`,
} as const;

export const meta = {
  viewport: "width=device-width, initial-scale=1.0",
  title: siteMeta.siteTitle,
  description: siteMeta.description,
  keywords: siteMeta.keywords,
  author: siteMeta.author,
  "twitter:image": siteMeta.coverImageDark,
  "og:type": "website",
  "og:image": siteMeta.coverImageDark,
  "og:url": siteMeta.url,
  "og:title": siteMeta.title,
  "og:description": siteMeta.description,
  "og:author": siteMeta.author,
  "twitter:title": siteMeta.title,
  "twitter:url": siteMeta.url,
  "twitter:card": "summary_large_image",
  "twitter:summary": siteMeta.description,
  "twitter:creator": siteMeta.author,
  "twitter:image:src": siteMeta.coverImageDark,
  "theme-color": "#112233",
} as const;

export const links = [
  // prefetches, preloads, and preconnects
  { rel: "prefetch", href: "/favicon.svg", type: "image/svg+xml", as: "image" },
  // actual links to resources
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  {
    rel: "mask-icon",
    href: "/favicon.svg",
    type: "image/svg+xml",
    color: "#ffffff",
  },
];

export const paramList = [
  ["// root", null],
  ["width", "1280"],
  ["height", "640"],
  ["viewBox", "0 0 {width} {height}"],
  ["pxRatio", "2", "// @2x for high-res screens"],
  ["// icon", null],
  ["icon", "deno", "// set to false to disable"],
  ["iconUrl", "https://icns.ml/{icon}.svg"],
  ["// dimensions", null],
  ["iconW", "250"],
  ["iconH", "250", "// iconW"],
  ["iconX", "515", "// ((width - iconW) / 2)"],
  ["iconY", "80"],
  ["titleX", "640", "// (width / 2)"],
  ["titleY", "450", "// (iconH + iconY + (titleFontSize * 2.5))"],
  ["subtitleX", "640", "// (width / 2)"],
  ["subtitleY", "530", "// (titleY + (subtitleFontSize * 2.5))"],
  ["// typography", null],
  ["titleFontSize", "48"],
  ["titleFontFamily", "sans-serif", '// "Inter"'],
  ["titleFontWeight", "bold"],
  ["subtitleFontSize", "32"],
  ["subtitleFontFamily", "monospace", '// "JetBrains Mono"'],
  ["subtitleFontWeight", "normal"],
  ["// colors", null],
  ["bgColor", "white"],
  ["iconColor", "black"],
  ["titleColor", "#112233"],
  ["titleStroke", "none"],
  ["titleStrokeWidth", "2"],
  ["subtitleColor", "#334455"],
  ["subtitleStroke", "none"],
  ["subtitleStrokeWidth", "2"],
];
