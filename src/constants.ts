import { encode, portal } from "~/src/utils.ts";

export const DEBUG = (+Deno.env.get("DEBUG") === 1);

/**
 * Used as the base for all icon requests.
 * @default https://api.iconify.design
 * @example https://icns.deno.dev -> https://icns.deno.dev/twemoji:letter-m.svg
 */
export const CDN_URL = "https://icns.deno.dev" as const;
export const FAVICON_URL = `${CDN_URL}/twemoji:letter-m.svg` as const;
export const FALLBACK_ICON_URL =
  `${CDN_URL}/heroicons-solid:exclamation.svg` as const;

/**
 * various cache TTL values, from 1 minute to 1 year
 */
export const TTL_MN = portal(1, "minute");
export const TTL_1H = portal(1, "hour");
export const TTL_1D = portal(1, "day");
export const TTL_1W = portal(1, "week");
export const TTL_1M = portal(1, "month");
export const TTL_1Y = portal(1, "year");
/**
 * Cache-Control header values for long-term, short-term, and no-cache.
 */
export const cacheTerm: Record<string, string> = {
  none: "public, no-cache, no-store, s-maxage=0, max-age=0, must-revalidate",
  short: `public, s-maxage=${portal(0.5, "hour")}, max-age=${
    portal(0.5, "hour")
  }, stale-if-error=${portal(2, "min")}, stale-while-revalidate=60`,
  long:
    `public, s-maxage=${TTL_1Y}, max-age=${TTL_1Y}, stale-if-error=${TTL_1H}, immutable`,
} as const;

/**
 * Default Param values for the handle.image() function
 */
export const defaultParams = {
  title: "Edge-rendered OpenGraph Images with Deno",
  subtitle: "migo.deno.dev",
  width: "1280",
  height: "640",
  pxRatio: "2",
  icon: "twemoji:letter-m",
  iconW: "240",
  iconH: "240",
  bgColor: "papayawhip",
  titleColor: "#112233",
  titleFontSize: "48",
  subtitleFontSize: "36",
};

// function useParams({ width, height, ...params }) {

//   return {
//     ...defaultParams,
//     width,
//     height,
//     viewBox: `0 0 ${width} ${height}`,
//     bgColor: "ffffff",
//     pxRatio: 2,
//     icon: "deno",
//     iconUrl: null,
//     iconW: "240",
//     iconH: iconW,
//     iconX: ((+defaultParams.width - +defaultParams.iconW) / 2),
//     iconY: (+defaultParams.iconH / 3),
//     titleFontSize: "48",
//     titleFontFamily: "sans-serif",
//     titleFontWeight: "bold",
//     titleX: (+defaultParams.width / 2),
//     titleY: ((+defaultParams.iconH) + (+defaultParams.iconY * 2) + (+defaultParams.titleFontSize * 1)),
//     subtitleFontSize: 32,
//     subtitleFontFamily: "monospace",
//     subtitleFontWeight: "normal",
//     subtitleX: (+defaultParams.width / 2),
//     subtitleY: (+defaultParams.titleY + (+defaultParams.subtitleFontSize * 2)),
//     titleColor: "#123",
//     titleStroke: "none",
//     titleStrokeWidth: 0,
//     subtitleColor: "#345",
//     subtitleStroke: "none",
//     subtitleStrokeWidth: 0,
//     iconColor: defaultParams.titleColor,
//     iconStroke: "none",
//     iconStrokeWidth: 0,
//   }
// }

/**
 * Metadata for SEO
 */
export const site = {
  url: "https://migo.deno.dev",
  title: "Edge-rendered OpenGraph Images · migo",
  author: "Nicholas Berlette",
  description:
    "Edge-generated OpenGraph images, globally distributed via the Deno Edge Network.",
  keywords:
    "deno deploy,migo,edge,api,serverless,opengraph,generator,dynamic,image generator,social media,social images,deno,cover+images,ogimage,twittercard api,cloudflare,workers,generator",
  image:
    "/subtitleFontSize=48&bgColor=123&titleColor=fff&subtitleColor=papayawhip&icon=twemoji:letter-m/Edge-rendered%20OpenGraph%20Images/migo.deno.dev.png",
  repository: "https://github.com/nberlette/migo",
} as const;

export const styles = [
  `.param-list:hover .param-group:not(:hover) span:not(.param-comment){opacity:0.666 !important} .param-list:hover .param-group:hover span,.param-group:not(:hover) :is(.param-comment,.param-comment-block){opacity:1 !important}`,
];

/**
 * Document `<meta>` tags added in the page `<head>`
 */
export const meta: Meta = {
  viewport: "width=device-width, initial-scale=1.0",
  title: site.title,
  author: site.author,
  description: site.description,
  keywords: site.keywords,
  "og:url": site.url,
  "og:type": "website",
  "og:image": site.image,
  "twitter:image": site.image,
  "og:title": site.title,
  "og:description": site.description,
  "og:author": site.author,
  "twitter:title": site.title,
  "twitter:url": site.url,
  "twitter:card": "summary_large_image",
  "twitter:summary": site.description,
  "twitter:creator": site.author,
  "twitter:image:src": site.image,
  "theme-color": "#112233",
} as const;

/**
 * `<link />` elements added to the page `<head>`
 */
export const links = [
  { rel: "prefetch", href: "/favicon.svg", type: "image/svg+xml", as: "image" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  {
    rel: "mask-icon",
    href: "/favicon.svg",
    type: "image/svg+xml",
    color: "#ffffff",
  },
];

/**
 * List of parameters with default values and comments.
 * Used to render the Parameters section of the documentation site.
 * @see ParamList
 */
export const paramList = [
  ["// base props of the image"],
  ["width", "1280"],
  ["height", "640"],
  ["viewBox", "0 0 1280 640"],
  ["pxRatio", "2", "// set to 1 for low-res"],
  ["bgColor", "white"],
  ["// icon"],
  ["icon", "deno", "// set to false to disable"],
  ["iconUrl", "https://icns.ml/{icon}.svg"],
  ["iconW", "240"],
  ["iconH", "240", "// +iconW"],
  ["iconX", "520", "// ((width - iconW) / 2)"],
  ["iconY", "60", "// (iconH / 4)"],
  ["iconColor", "black", "// fill color"],
  ["iconStroke", "none", "// stroke color"],
  ["iconStrokeWidth", "0", "// stroke width"],
  ["// title (first line of text)"],
  ["titleX", "640", "// (width / 2)"],
  ["titleY", "450", "// (iconH + iconY + (titleFontSize * 2.5))"],
  ["titleFontSize", "48"],
  ["titleFontFamily", "sans-serif", '// "Inter"'],
  ["titleFontWeight", "bold"],
  ["titleColor", "#112233", "// text color"],
  ["titleStroke", "none", "// stroke color"],
  ["titleStrokeWidth", "0", "// stroke width"],
  ["// subtitle (second line of text)"],
  ["subtitleX", "640", "// (width / 2)"],
  ["subtitleY", "530", "// (titleY + (subtitleFontSize * 2.5))"],
  ["subtitleFontSize", "32"],
  ["subtitleFontFamily", "monospace", '// "JetBrains Mono"'],
  ["subtitleFontWeight", "normal"],
  ["subtitleColor", "#334455", "// text color"],
  ["subtitleStroke", "none", "// stroke color"],
  ["subtitleStrokeWidth", "0", "// stroke width"],
];

/**
 * Shortcuts for UnoCSS configuration
 * @see {@link https://uno.antfu.me}
 */
export const shortcuts = {
  "btn-large":
    "bg-black text-white inline-flex flex-row flex-nowrap gap-x-3 place-items-center py-1.5 sm:py-2 md:py-2.5 px-4 sm:px-5 md:px-6 mt-6 mb-5 sm:mt-7 sm:mb-6 md:mt-10 md:mb-9 rounded-full ring-2 ring-blue-gray-900 dark:ring-blue-gray-50 hover:!bg-white hover:!text-blue-gray-900 dark:hover:!ring-white shadow-sm hover:shadow-xl hover:animate-pulse-alt !animate-duration-2s transition-all duration-500 ease-in-out underline-black underline-opacity-0 hover:!underline-opacity-50 underline underline-offset-1 underline-1 underline-dashed tracking-tight",
  "example-image":
    "sm:rounded-lg md:rounded-xl lg:rounded-3xl border border-2 border-gray-100 shadow-sm dark:!border-gray-900 hover:shadow-md transition-all duration-500 my-2 w-full sm:h-full z-10 relative block",
  "example-image-link":
    "w-[calc(100%_+_3rem)] max-h-full h-auto sm:!w-full sm:!min-h-full absolute -left-6 -right-6 top-0 bottom-0 sm:!relative sm:!left-0 sm:!right-0",
  "param-list":
    "text-sm bg-gray-50/50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800/75 dark:!border-gray-700 dark:!text-blue-gray-50 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll whitespace-pre",
  "param-group": "block",
  "param-base":
    "text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-400 dark:!underline-blue-gray-500 transition-opacity duration-400 ease-out opacity-100",
  "param-comment":
    "!text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm xl:text-base inline-block transition-opacity duration-400 opacity-40",
  "param-comment-block": "param-comment !block mb-1 !opacity-100",
  "param-name": "param-base font-semibold cursor-pointer",
  "param-value": "param-base font-medium cursor-pointer",
  "param-other":
    "param-base font-light !underline-0 !no-underline !text-gray-900 dark:!text-gray-50",
};
