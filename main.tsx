/** @jsx h */
import {
  h,
  serve,
  type ConnInfo,
  type Routes,
  type PathParams,
} from "https://deno.land/x/sift@0.5.0/mod.ts";
import { formatHex, parse } from "https://esm.sh/culori?dts";
import colorHash from "https://deno.land/x/color_hash@v2.0.1/mod.ts";
import { html } from "https://deno.land/x/htm@0.0.8/mod.tsx";
import Slugger from "https://esm.sh/github-slugger?no-require&target=esnext&dts"
import { render as rasterizeSVG } from "https://deno.land/x/resvg_wasm@0.1.0/mod.ts";
import * as b64 from "https://deno.land/std@0.145.0/encoding/base64url.ts";
import $ from "https://deno.land/x/gokv@0.0.12/mod.ts";

/**
 * Authenticate and configure DurableKV and KV
 * @see {@link https://gokv.io}
 */
const namespace = "migo";
$.config({ token: Deno.env.get("GOKV_TOKEN") });

const $kv = $.KV({ namespace });
// const $db = $.DurableKV({ namespace }); // TODO: implement DurableKV logging
// const $fs = $.Uploader(); // TODO: implement image uploader

/**
 * safer shorthand for `encodeURIComponent`
 */
const enc = (v: string) => (/([%][a-f0-9]{2})/ig.test(v) ? v : encodeURIComponent(v));

/**
 * safer shorthand for `decodeURIComponent`
 */
const dec = (v: string) => decodeURIComponent(enc(v));

/**
 * format keys for storage in KV
 */
const fmtkey = (url: string | URL, prefix = 'item::') => (prefix + b64.encode(enc(new URL(url).toString())));

/**
 * Create slugs from titles
 * @TODO: fix this redudancy
 */
const slugger = new Slugger();
const slugify = (s: string) => slugger.slug(s);

/**
 * various cache TTL values, from 1 minute to 1 year
 */
const TTL_MN = 60; // ............1 minute
const TTL_1H = TTL_MN * 60; // ...1 hour
const TTL_1D = TTL_1H * 24; // ...1 day
const TTL_1W = TTL_1D * 7.125; // 1 week 
const TTL_1M = TTL_1W * 4; // ... 1 month
const TTL_1Y = TTL_1M * 12; // .. 1 year

/**
 * Cache-Control header values for long-term, short-term, and no-cache.
 */
const cacheTerm: Record<string, string> = {
  none: 'public, no-cache, no-store, s-maxage=0, max-age=0, must-revalidate',
  short: `public, s-maxage=300, max-age=300, stale-if-error=60, stale-while-revalidate=30`,
  long: `public, s-maxage=${TTL_1Y}, max-age=${TTL_1M}, stale-if-error=${TTL_1H}, stale-while-revalidate=${TTL_MN}`,
}

/**
 * Default Param values for the handle.image() function
 */
const defaultParams: Record<string, string> = {
  title: "Edge-rendered OpenGraph Images with Deno",
  subtitle: "migo.deno.dev",
}

/**
 * Extracts and parses parameters from search query or from the path.
 * Allows delimiters of `&` (standard), `;`, or `::`.
 * Trims and runs `decodeURIComponent` on all values.
 * @returns an array of param entries in `[key, value]` format
 */
const extractParamsEntries = (s: string) => `${s ?? ''}`.split(/([:]{2}|[;&])/).map(
  (p: string) => [(p.split('=')[0] ?? '').trim(), dec((p.split('=')[1] ?? '').trim())]
);
/**
 * Extracts params into entries and converts them into an Object.
 */
const extractParamsObject = (s: string) => Object.fromEntries(extractParamsEntries(s));

/**
 * Extracts params into entries and converts them into a new URLSearchParams instance.
 */
const extractParams = (s: string) => new URLSearchParams(extractParamsEntries(s));

/**
 * Metadata for SEO
 */
const siteMeta: Record<string, string> = {
  url: "https://migo.deno.dev",
  title: defaultParams.title,
  author: "Nicholas Berlette",
  siteTitle: `${defaultParams.title} · migo`,
  description: "Edge-generated OpenGraph images, globally distributed via the Deno Edge Network.",
  keywords: "deno deploy,migo,edge,api,serverless,opengraph,generator,dynamic,image generator,social media,social images,deno,cover+images,ogimage,twittercard api,cloudflare,workers,generator",
  coverImageAlt: `https://migo.deno.dev/icon=nuxtdotjs;bgColor=112233;iconColor=00DC82;iconStroke=00DC82;iconStrokeWidth=0.55;titleColor=00DC82;subtitleColor=e0e0e0;iconW=300;iconH=300;iconY=50/Nuxt%20ContentWind%20Starter/stackblitz.com%2fedit%2fcontent-wind.png`,
  coverImageDark: `https://migo.deno.dev/icon=deno&iconStrokeWidth=0.33&subtitleFontSize=48&iconColor=345&bgColor=234&iconStroke=fff&titleColor=fff&subtitleColor=papayawhip/${enc(defaultParams.title)}/${defaultParams.subtitle}.png`,
  coverImage: `https://migo.deno.dev/icon=mdi:alpha-o-circle:white&subtitleFontSize=48&iconColor=fff&iconW=300&iconH=300&bgColor=indianred&titleColor=white&titleFontFamily=monospace&titleFontSize=72&titleFontWeight=bold/${enc(defaultParams.subtitle)}.png`,
}

/**
 * Extract an Object's toStringTag value
 */
const toStringTag = (o: any) => Object.prototype.toString.call(o).replace(/(?<=^\[object )(.+)(?=\]$)/, "$1");

/**
 * Check if an Object's toStringTag is equal to a given value
 * @returns true if 
 */
const toStringTagIs = (obj: any, tag: string): boolean => (toStringTag(obj).toLowerCase() === tag.toLowerCase());

/**
 * Heading component (JSX)
 */
function Heading({
  level = 'h2',
  title,
  children,
  className = "text-2xl font-bold tracking-tight mt-8 mb-2 pb-2 border-b border-gray-200 dark:!border-blue-gray-700",
  ...props
}: {
  level?: Lowercase<`h${1 | 2 | 3 | 4 | 5 | 6}`>;
  title?: string;
  className?: any;
} & Record<string, any>) {
  if (typeof className === 'string') {
    className = className.split(' ');
  }
  if (!Array.isArray(className) && toStringTagIs(className, 'Object')) {
    className = Object.keys(className).filter(k => !!className[k] && className[k] != null);
  }
  className = [className].flat(Infinity).filter(Boolean).join(' ');
  return h(level, {
    id: slugify(title),
    class: className,
    title: title,
    ariaLabel: title,
    ...props,
  }, children)
}

/**
 * Link component (JSX)
 */
function Link({ url, title, children, ...props }: {
  url?: string | URL;
  title?: string;
  children?: any | any[];
} & Record<string, any>) {
  try {
    url = new URL(url).toString();
  } catch {
    url = `${url}`;
  }
  const isExternal = /^http/i.test(url);
  const attr = (isExternal ? { ...props, target: "_blank", rel: "nofollow noreferrer" } : props);
  return (
    <a
      href={url}
      title={title}
      class={(props.weight ?? "font-semibold") + " underline underline-1 underline-dashed underline-offset-1"}
      {...attr}
    >{children}</a>
  )
}

/**
 * Create a responsive source set for images
 */
function createSrcSet(url: string, sizes = [1280, 640, 480]): string {
  const originalWidth = 1280;
  // return `${url}?pxRatio=1 1280w, ${u}?pxRatio=0.5 640w, ${u}?pxRatio=${480 / 1280} 480w`
  return sizes.map(size => `${url}${(new URL(url).search === '') ? '?' : '&'}pxRatio=${size / originalWidth} ${size}w`).join(', ');
};

/**
 * Example Images component
 */
function ExampleImage({ src, title = "Example of an edge-rendered OpenGraph Image", ...props }: { src: string, title?: string } & Record<string, any>) {
  return (
    <Link title={title} url={encodeURI(dec(src))} plain="true">
      <img
        src={src}
        srcset={createSrcSet(src)}
        sizes="50vw"
        alt={title}
        class="rounded-lg border border-2 border-gray-100 shadow-sm dark:!border-gray-900 hover:shadow-md transition-all duration-500 my-2 max-w-full h-auto"
        width="640"
        height="320"
      />
    </Link>
  )
}

/**
 * Route Schema component to display different routes with rich descriptions.
 */
function RouteSchema({ prefix = 'migo.deno.dev', ...props }: Record<string, any>) {
  const Divider = ({ text = '/' }) => (<span class="text-sm text-gray-700 dark:!text-blue-gray-300 font-medium">{text}</span>);
  return (
    <pre class="text-sm bg-gray-50/50 border border-b-2 border-gray-300 dark:!bg-black dark:!border-blue-gray-700 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
      <code class="whitespace-pre">
        {prefix && <span class="text-gray-900 dark:!text-gray-100 text-sm font-light">{prefix}</span>}
        {props.params && <Divider />}
        {props.params && <Link url="/#parameters" title="Use the numerous parameters available to have full control of your generated image. Click for more info.">{props.params ?? ':params'}</Link>}
        <Divider />
        <Link url="/#title" title="Use the first argument for your title, the large text on the top line.">:title</Link>
        {props.subtitle && <Divider />}
        {props.subtitle && <Link url="/#subtitle" title="Optionally add a subtitle or author name in a second segment." weight="font-regular text-sm">:subtitle</Link>}
        <Divider text=".(" />
        <Link url="/#format-svg-or-png-raster" title="Use the extension .svg for the raw vector, or .png to return a rasterized copy of it" weight="text-sm font-semibold">png|svg</Link>
        <Divider text=")" />
      </code>
    </pre>
  )
}

/**
 * Route handlers
 */
const handle = {
  async home(req: Request, connInfo: ConnInfo, params: PathParams) {
    const url = new URL(req.url);
    const { searchParams } = url;
    if (searchParams.has('svg') && searchParams.has('title')) {
      return handle.image(req.clone(), connInfo, { ...params, title: searchParams.get('title'), })
    }
    const paramList = [
      ["// root", null],
      ["width", "1280"],
      ["height", "640"],
      ["viewBox", "0 0 {width} {height}"],
      ["pxRatio", "2", "// @2x for high-res screens"],
      ["// icon", null],
      ["icon", "deno", "// set to false to disable"],
      ["iconUrl", "https://icns.ml/{icon}.svg?hash={title}"],
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
      ["titleFontFamily", "sans-serif", "// \"Inter\""],
      ["titleFontWeight", "bold"],
      ["subtitleFontSize", "32"],
      ["subtitleFontFamily", "monospace", "// \"JetBrains Mono\""],
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
    const commentClsx = "text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm inline-block";
    const paramClsx = "font-semibold text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-400 dark:!underline-blue-gray-500 cursor-pointer";
    const valueClsx = "font-medium text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-300 dark:!underline-blue-gray-600 cursor-pointer";
    const commentBlockClsx = "text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm block mb-1";
    // render jsx homepage
    return html({
      lang: "en",
      title: siteMeta.siteTitle,
      meta: {
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
      },
      links: [
        // prefetches, preloads, and preconnects
        { rel: 'preconnect', href: 'https://unpkg.com' },
        { rel: 'prefetch-dns', href: 'https://unpkg.com' },
        { rel: 'prefetch', href: '/favicon.svg', type: 'image/svg+xml', as: 'image' },
        // actual links to resources
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "mask-icon", href: "/favicon.svg", type: "image/svg+xml", color: "#ffffff" },
      ],
      styles: [
        `@font-face{font-family:'Metropolis';font-style:normal;font-weight:600;font-display:block;src:local('Metropolis'),url(data:font/woff2;charset=utf-8;base64,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)format('woff2')}` +
        `@font-face{font-family:'Metropolis';font-style:normal;font-weight:300;font-display:block;src:local('Metropolis'),url(data:font/woff2;charset=utf-8;base64,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)format('woff2')}` +
        `:root{--sans-serif:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"} html,body{ font-family:'Metropolis', var(--sans-serif) !important} h1 {font-weight:300 !important} h2 {font-weight:600 !important} h3 {font-weight:600 !important}`
      ],
      body: (
        <div class="max-w-2xl px-8 mx-auto h-screen">
          <div class="w-full py-10">
            {/* Header */}
            <h1 class="text-7xl font-light direction-rtl tracking-tighter text-center text-black dark:text-white py-2 my-4 border-b border-gray-200 dark:!border-gray-700"><span>migo</span></h1>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              <ExampleImage src={siteMeta.coverImageDark} />
            </p>

            {/* What is this? */}
            <Heading title="What is this?">What is this?</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              This is a free microservice providing dynamic OpenGraph Images, featuring just-in-time rendering on a global edge network.
            </p>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Images are generated just-in-time and globally deployed on <Link url="https://deno.com/deploy">Deno's Edge Network</Link>.
              Each unique image URL is then cached as an immutable asset in <Link url="https://developers.cloudflare.com/workers/runtime-apis/kv">Cloudflare KV</Link>.
              This delivers a response in <strong class="font-semibold"><em>milliseconds</em></strong>, to anyone in the whole world.
            </p>
            <p class="my-1.5 md:my-2 text-base md:text-lg text-center">
              <Link url="https://dash.deno.com/new?url=https%3a%2f%2fgithub.com%2fnberlette%2fmigo.deno.dev">Deploy your own with Deno!</Link>.
            </p>

            {/* Schema */}
            <Heading title="Schema">Schema</Heading>
            <RouteSchema prefix="." />
            <RouteSchema prefix="." subtitle />
            <RouteSchema prefix="." subtitle params="k1=value;k2=value2" />

            {/* Parameters */}
            <Heading title="Parameters">Parameters</Heading>
            <p class="my-2 text-sm">
              There are numerous parameters you can provide in the <a href="https://mdn.io/URLSearchParams" target="_blank">image URL's query string</a> to customize the look and feel of the generated image.
            </p>
            <pre class="text-sm bg-gray-50/50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800/75 dark:!border-gray-700 dark:!text-blue-gray-50 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll" style="white-space:pre;word-wrap:none;">
              <code class="whitespace-pre cursor-default">
                {paramList.map(([param, value, ...comments]: string[], idx: number) => (
                  <span key={idx} class="block">
                    <span class={value == null ? (commentBlockClsx + (idx > 0 ? " mt-4" : "")) : paramClsx}>{param}</span>
                    <span class={value == null ? "hidden" : "inline-block"}>
                      <span class={commentClsx}> = "</span>
                      <span class={valueClsx}>{value}</span>
                      <span class={commentClsx}>", {comments.length > 0 && comments.join(" ")}</span>
                    </span>
                  </span>
                ))}
              </code>
            </pre>

            {/* Features */}
            <Heading title="Icons: more than you'll ever need.">Icons: more than you'll ever need.</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Icons are embedded from <Link url="https://icns.deno.dev">icns</Link>, another Deno-powered project of mine.
              This means direct access to over <strong>100,000 icons</strong>, and millions of color combinations - only a query parameter away.
            </p>

            <Heading title="Format: SVG or PNG (raster)">Format: SVG or PNG (raster)</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Every image is first sculpted as an SVG (Scalable Vector Graphics). If you request a file ending in <code>.svg</code>, then this is what you get! If you request a <code>.png</code>, however, that SVG is rasterized with a Rust-based renderer called <Link url="https://deno.land/x/resvg_wasm">resvg</Link>.
            </p>

            <Heading title="Rendered on the bleeding edge.">Rendered on the bleeding edge.</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Obviously, using the SVG format will always result in the fastest response times. However, most of the major social media platforms don't yet support OpenGraph images in SVG format.
            </p>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Since each image URL is unique, each image is treated as immutable. We take advantage of aggressive caching in Cloudflare's KV, allowing a response latency of <strong>~100ms on average</strong>.
            </p>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              The only lag you <em>might</em> encounter is the first time you request that image URL. Thankfully that is essentially never on a request from an end-user - they get a cache hit from the nearest edge datacenter in their region.
            </p>

            {/* Examples */}
            <Heading title="Examples">Examples</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              <ExampleImage src={siteMeta.coverImage} />
            </p>
            <pre class="text-sm bg-gray-50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800/75 dark:!border-gray-700 dark:!text-blue-gray-50 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
              <code class="whitespace-pre">{encodeURI(dec(siteMeta.coverImage))}</code>
            </pre>

            <p class="my-1.5 md:my-2 text-sm md:text-base">
              <ExampleImage src={siteMeta.coverImageAlt} />
            </p>
            <pre class="text-sm bg-gray-50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800 dark:!border-gray-700 dark:!text-blue-gray-100 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
              <code class="whitespace-pre">{encodeURI(dec(siteMeta.coverImageAlt))}</code>
            </pre>

            {/* Footer */}
            <p class="text-sm text-center border-t border-gray-200 dark:border-blue-gray-700 pt-6 pb-2 my-4">
              Open Source Software by <Link url="https://github.com/nberlette">Nicholas Berlette</Link>
            </p>
            <footer class="prose text-center pt-2 border-t border-gray-200 dark:!border-blue-gray-700">
              <a href="https://github.com/nberlette" class="no-underline" title="View Nicholas Berlette's GitHub Profile">
                <img src="https://cdn.jsdelivr.net/gh/nberlette/static/brand/logo-green.svg" width="32" height="32" class="inline-block w-8 h-8 mx-auto my-2" alt="Nicholas Berlette's Logomark in a pretty shade of green" />
              </a>
            </footer>
          </div>
        </div>
      ),
    })
  },
  async image(req: Request, connInfo: ConnInfo, {
    title,
    subtitle,
    params,
    type,
  }: PathParams) {
    const url = new URL(req.url);
    let contentType: string = 'image/svg+xml;charset=utf-8';

    if (!['png', 'svg'].includes(type)) {
      const newUrl = new URL(url)
      newUrl.pathname = newUrl.pathname + '.png';
      return Response.redirect(newUrl, 301)
    }
    if (type === 'png') {
      contentType = 'image/png;charset=utf-8';
    }

    /**
     * If path parameters have been provided, combine them with any existing query params,
     * for maximum compatibility and flexibility with different requests.
     * This allows params to be passed in *both* the query string (`.../img.png?param=value`),
     * as well as the pathname (`param=value;param2=val2`). 
     */
    const searchParams = new URLSearchParams(
      // override path params with any overlapping query params
      Object.assign({}, extractParamsObject(params), extractParamsObject(url.searchParams.toString()))
    );

    const key: string = fmtkey(req.url, 'asset::');
    let data: any = await $kv.get(key, { type: 'arrayBuffer' });

    if (data !== null) {
      return new Response(data, {
        headers: {
          'access-control-allow-origin': '*',
          'content-type': contentType,
          'content-length': `${data.byteLength}`,
          'cache-control': cacheTerm[(searchParams.has('no-cache') ? 'none' : 'long')],
        },
      })
    }

    let {
      width = '1280',
      height = (+width / 2),
      viewBox = `0 0 ${width} ${height}`,
      bgColor = '#ffffff',
      pxRatio = '2',
      titleFontSize = '48',
      titleFontFamily = 'sans-serif',
      titleFontWeight = 'bold',
      titleColor = '#112233',
      titleStroke = 'none',
      titleStrokeWidth = '2',
      subtitleFontSize = '32',
      subtitleFontFamily = 'monospace',
      subtitleFontWeight = 'normal',
      subtitleColor = '#334455',
      subtitleStroke = 'none',
      subtitleStrokeWidth = '2',
      icon = 'deno',
      iconUrl = `https://icns.deno.dev/${icon}.svg`,
      iconColor = null,
      iconStroke = 'none',
      iconStrokeWidth = '2',
      iconW = '250',
      iconH = iconW,
      iconX = ((+width - +iconW) / 2),
      iconY = (+iconH / 4),
      titleX = (+width / 2),
      titleY = ((+iconH) + (+iconY * 2) + +titleFontSize),
      subtitleX = (+width / 2),
      subtitleY = (+titleY + (+subtitleFontSize * 2)),
    }: Record<string, any> = Object.fromEntries([...searchParams.entries()]);

    let iconContents: string, iconType: string = '';

    if (icon != null) {
      icon = dec((icon ?? 'deno'));
      if (iconColor === 'hash')
        iconColor = new colorHash().hex(title);
      iconUrl ??= (searchParams.has('iconUrl')
        ? dec(searchParams.get('iconUrl'))
        : `https://icns.deno.dev/${icon}.svg?fill=currentColor&color=${iconColor ?? titleColor}`);

      iconContents = await fetch(iconUrl).then(async res => res.ok && await res.text())

      if (new URL(iconUrl).pathname.endsWith('.svg')) {
        iconType = 'svg';
        iconContents = iconContents.replace(/^<svg /i, '<symbol id="icon" ').replace(/\/svg>/i, '/symbol>')
      } else {
        iconType = 'other';
      }
    }

    data = (
      `<svg 
  xmlns="http://www.w3.org/2000/svg"
  width="${(+width * +pxRatio)}"
  height="${(+height * +pxRatio)}"
  viewBox="${viewBox}"
  role="img"
>
  <title>${dec(title)}</title>
  <rect fill="${formatHex(parse(bgColor))}" x="0" y="0" width="${width}" height="${height}" />
  ${!(searchParams.has('noIcon') || icon == null || icon == 0) && iconType === 'svg'
        ? `<defs>${(
          iconStroke === 'none'
            ? iconContents // do not mutate viewBox if no stroke is set
            : iconContents // adjust size of viewBox to account for stroke-width
              .replace(/(?<=viewBox=['"])([^'"]+)(?=['"])/i,
                (match: string) => {
                  // parse the 4 elements of the icon's existing viewBox
                  let [x, y, w, h]: number[] = match.split(/[\s ]+/ig, 4).map((v: string) => parseInt(v));
                  // determine the adjustment factor from strokeWidth
                  const s = +iconStrokeWidth * 2;
                  // return a new viewBox string to replace the previous one
                  return `${x - s} ${y - s} ${w + (s * 2)} ${h + (s * 2)}`;
                  // if the viewBox was 0 0 24 24, and the strokeWidth is 2,
                  // the result will be -4 -4 32 32
                  // this expands the width/height by 8 units, and then translates
                  // the icon 4 units "left" and 4 units "up", to adjust for the bigger size.
                })
        )}</defs>`
        : ''}
  <g stroke="none" fill="none" fill-rule="evenodd">
    ${!(searchParams.has('noIcon') || icon == false)
        ? `<${(iconType === 'svg'
          ? `use href="#icon" color="${formatHex(parse(iconColor))}" stroke="${formatHex(parse(iconStroke))}" stroke-width="${iconStrokeWidth ?? 0}"`
          : `image href="${iconUrl}"`)} width="${iconW}" height="${iconH}" x="${iconX}" y="${iconY}" />`
        : ''}
    <text
      id="title"
      text-anchor="middle"
      font-family="${titleFontFamily}"
      font-size="${titleFontSize}"
      font-weight="${titleFontWeight}"
      fill="${formatHex(parse(titleColor))}"
      stroke="${formatHex(parse(titleStroke))}"
      stroke-width="${titleStrokeWidth}"
      x="${titleX}"
      y="${titleY}"
    >
      <tspan>${dec(title)}</tspan>
    </text>
  ${subtitle ?
        `<text
      id="subtitle"
      text-anchor="middle"
      font-family="${subtitleFontFamily}"
      font-size="${subtitleFontSize}"
      font-weight="${subtitleFontWeight}"
      fill="${formatHex(parse(subtitleColor))}"
      stroke="${formatHex(parse(subtitleStroke))}"
      stroke-width="${subtitleStrokeWidth}"
      x="${subtitleX}"
      y="${subtitleY}"
    >
        <tspan>${dec(subtitle)}</tspan>
    </text>` : ''}
  </g>
</svg>`);

    if (type === 'png') {
      data = rasterizeSVG(data);
    }

    const headers = {
      'access-control-allow-origin': '*',
      'content-type': contentType,
      'content-length': data.length,
      'cache-control': cacheTerm[(searchParams.has('no-cache') ? 'none' : 'long')]
    };

    return await $kv
      .put(key, data, {
        metadata: {
          url: url.toString(),
          conn: connInfo,
          date: new Date().toJSON(),
        },
        // set cacheTtl (unless no-cache is passed)
        cacheTtl: searchParams.has('no-cache') ? 60 : TTL_1M,
        expirationTtl: TTL_1Y,
      })
      .then(() =>
        new Response(data, { headers, status: 201 })
      )
      .catch((err: unknown) => (
        console.error(err),
        new Response(data, { headers, status: 200 })
      ))
  },
}
serve({
  "/": handle.home,
  // handle "static" assets first
  "/favicon.:ext(ico|svg)": (req: Request, _connInfo: ConnInfo, _params: any) =>
    fetch('https://icns.deno.dev/mdi:alpha-o-circle-outline:dynamic.svg')
      .then(async res => res.ok && await res.arrayBuffer())
      .then(buf => new Response(buf, ({
        headers: {
          'access-control-allow-origin': '*',
          'content-type': 'image/svg+xml;charset=utf-8',
          'content-length': `${buf.byteLength}`,
          'cache-control': cacheTerm[
            (new URL(req.url).searchParams.has('no-cache') ? 'none' : 'long')
          ],
        }
      } as ResponseInit)
      )),
  "/robots.txt": (req: Request, _connInfo: ConnInfo, _params: any) =>
    new Response(`User-agent: *\nDisallow:\n`, {
      headers: {
        'access-control-allow-origin': '*',
        'content-type': 'text/plain;charset=utf-8'
      }
    }),
  // params, title, subtitle, and extension
  "/:params/:title/:subtitle([^]+?).:type(png|svg)": handle.image,
  // params, title, extension
  "/:params/:title([^]+?).:type(png|svg)": handle.image,
  // just a title and extension
  "/:title([^]+?).:type(png|svg)": handle.image,
  // handle extensionless requests, redirect to .png
  "/:wheresmyextension([^]+?)": handle.image,
  404: handle.home,
} as Routes);
