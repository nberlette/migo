/** @jsx h */
import { $, h, html, serve } from "~/deps.ts";
import {
  cacheTerm,
  links,
  meta,
  namespace,
  paramList,
  siteMeta,
  token,
  TTL_1Y,
} from "~/constants.ts";
import {
  adjustViewBox,
  colorHash,
  createSrcSet,
  dec,
  extractParamsObject,
  fmtkey,
  formatHex,
  parseColor,
  rasterizeSVG,
  slugify,
  toStringTag,
} from "~/utils.ts";

/**
 * Authenticate and configure DurableKV and KV
 * @see {@link https://gokv.io}
 */
$.config({ token });
const $kv = $.KV({ namespace });

/**
 * Heading component (JSX)
 */
const Heading = ({
  level = "h2",
  title,
  children,
  className =
    "text-2xl font-bold tracking-tight mt-8 mb-2 pb-2 border-b border-gray-200 dark:!border-blue-gray-700",
  ...props
}: {
  level?: HeadingLevel;
  title?: string;
  className?: any;
} & Record<string, any>) => {
  if (typeof className === "string") {
    className = className.split(" ");
  }
  if (!Array.isArray(className) && (toStringTag(className) === "Object")) {
    className = Object.keys(className).filter((k) =>
      !!className[k] && className[k] != null
    );
  }
  className = [className].flat(Infinity).filter(Boolean).join(" ");
  return h(level, {
    id: slugify(title),
    class: className,
    title: title,
    ariaLabel: title,
    ...props,
  }, children);
};

/**
 * Link component (JSX)
 */
const Link = ({
  url,
  title,
  children,
  ...props
}: Record<string, any>) => {
  try {
    url = new URL(url).toString();
  } catch {
    url = `${url}`;
  }
  const isExternal = /^http/i.test(url);
  const attr =
    (isExternal
      ? { ...props, target: "_blank", rel: "nofollow noreferrer" }
      : props);
  return (
    <a
      href={url}
      title={title}
      class={(props.weight ?? "font-semibold") +
        " underline underline-1 underline-dashed underline-offset-1"}
      {...attr}
    >
      {children}
    </a>
  );
};

/**
 * Example Images component
 */
const ExampleImage = ({
  src = meta["og:image"],
  title = meta["og:title"],
  width = "640",
  height = "320",
  sizes = "50vw",
  ...props
}: Record<string, any>) => (
  <Link title={title} url={encodeURI(dec(src))} plain="true">
    <img
      src={src}
      srcset={createSrcSet(src)}
      sizes={sizes}
      alt={title}
      class="rounded-lg border border-2 border-gray-100 shadow-sm dark:!border-gray-900 hover:shadow-md transition-all duration-500 my-2 max-w-full h-auto"
      width={width}
      height={height}
      {...props}
    />
  </Link>
);

/**
 * Route Schema component to display different routes with rich descriptions.
 */
const RouteSchema = ({
  prefix = "migo.deno.dev",
  params = ":params",
  title = ":title",
  subtitle = ":subtitle",
}: Record<string, any>) => {
  const Divider = ({ text = "/" }) => (
    <span class="text-sm text-gray-700 dark:!text-blue-gray-300 font-medium">
      {text}
    </span>
  );
  return (
    <pre class="text-sm bg-gray-50/50 border border-b-2 border-gray-300 dark:!bg-black dark:!border-blue-gray-700 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
      <code class="whitespace-pre">
        {prefix && (
          <span class="text-gray-900 dark:!text-gray-100 text-sm font-light">
            {prefix}
          </span>
        )}
        {params && <Divider />}
        {params && (
          <Link
            url="/#parameters"
            title="Use the numerous parameters available to have full control of your generated image. Click for more info."
          >
            {params ?? ":params"}
          </Link>
        )}
        <Divider />
        <Link
          url="/#title"
          title="Use the first argument for your title, the large text on the top line."
        >
          {title ?? ":title"}
        </Link>
        {subtitle && <Divider />}
        {subtitle && (
          <Link
            url="/#subtitle"
            title="Optionally add a subtitle or author name in a second segment."
            weight="font-regular text-sm"
          >
            {subtitle ?? ":subtitle"}
          </Link>
        )}
        <Divider text=".(" />
        <Link
          url="/#format"
          title="Use the extension .svg for the raw vector, or .png to return a rasterized copy of it"
          weight="text-sm font-semibold"
        >
          png|svg
        </Link>
        <Divider text=")" />
      </code>
    </pre>
  );
};

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
     * This allows params to be passed in *both* the query string (`.../img.png?param=value`),
     * as well as the pathname (`param=value;param2=val2`).
     */
    const searchParams = new URLSearchParams(
      // override path params with any overlapping query params
      Object.assign(
        {},
        extractParamsObject(params),
        extractParamsObject(url.searchParams.toString()),
      ),
    );

    const key: string = fmtkey(req.url, "asset::");
    let data: any = await $kv.get(key, { type: "arrayBuffer" });

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
      bgColor = "#ffffff",
      pxRatio = "2",
      titleFontSize = "48",
      titleFontFamily = "sans-serif",
      titleFontWeight = "bold",
      titleColor = "#112233",
      titleStroke = "none",
      titleStrokeWidth = "2",
      subtitleFontSize = "32",
      subtitleFontFamily = "monospace",
      subtitleFontWeight = "normal",
      subtitleColor = "#334455",
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
      iconY = (+iconH / 4),
      titleX = (+width / 2),
      titleY = ((+iconH) + (+iconY * 2) + +titleFontSize),
      subtitleX = (+width / 2),
      subtitleY = (+titleY + (+subtitleFontSize * 2)),
    }: Record<string, any> = Object.fromEntries([...searchParams.entries()]);

    let iconContents = "", iconType = "";

    if (icon != null) {
      icon = dec(icon ?? "deno");
      if (iconColor === "hash") {
        iconColor = new colorHash().hex(title);
      }
      iconUrl ??= searchParams.has("iconUrl")
        ? dec(searchParams.get("iconUrl"))
        : `https://icns.deno.dev/${icon}.svg?fill=currentColor&color=${
          iconColor ?? titleColor
        }`;

      iconContents = await fetch(iconUrl).then(async (res) =>
        res.ok && await res.text()
      );

      if (new URL(iconUrl).pathname.endsWith(".svg")) {
        iconType = "svg";
        iconContents = iconContents
          .replace(/^<svg/i, '<symbol id="icon"')
          .replace(/<\/svg>/i, "</symbol>");
        // adjust size of viewBox to account for stroke-width
        if (iconStroke !== "none") {
          iconContents = iconContents.replace(
            /(?<=viewBox=['"])([^'"]+)(?=['"])/i,
            (m) => adjustViewBox(+iconStrokeWidth)(m),
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
  <title>${dec(title)}</title>
  <rect fill="${
      formatHex(parseColor(bgColor))
    }" x="0" y="0" width="${width}" height="${height}" />
  ${iconType === "svg" ? `<defs>${iconContents}</defs>` : ""}
  <g stroke="none" fill="none" fill-rule="evenodd">
    ${
      (searchParams.has("noIcon") || icon === "false")
        ? ""
        : (iconType === "svg"
          ? `<use href="#icon" color="${
            formatHex(parseColor(iconColor))
          }" stroke="${formatHex(parseColor(iconStroke))}"
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
      fill="${formatHex(parseColor(titleColor))}"
      stroke="${formatHex(parseColor(titleStroke))}"
      stroke-width="${titleStrokeWidth}"
      x="${titleX}"
      y="${titleY}"
    ><tspan>${dec(title)}</tspan></text>
    ${
      subtitle
        ? `<text
      id="subtitle"
      text-anchor="middle"
      font-family="${subtitleFontFamily}"
      font-size="${subtitleFontSize}"
      font-weight="${subtitleFontWeight}"
      fill="${formatHex(parseColor(subtitleColor))}"
      stroke="${formatHex(parseColor(subtitleStroke))}"
      stroke-width="${subtitleStrokeWidth}"
      x="${subtitleX}"
      y="${subtitleY}"
    ><tspan>${dec(subtitle)}</tspan></text>`
        : ""
    }
  </g>
</svg>`;

    if (type === "png") {
      data = rasterizeSVG(data);
    }

    const headers = {
      "access-control-allow-origin": "*",
      "content-type": contentType,
      "content-length": data.length,
      "cache-control":
        cacheTerm[searchParams.has("no-cache") ? "none" : "long"],
    };

    return await $kv
      .put(key, data, {
        metadata: {
          url: url.toString(),
          conn: connInfo,
          date: new Date().toJSON(),
        },
        // set cacheTtl (unless no-cache is passed)
        // cacheTtl: searchParams.has('no-cache') ? 60 : TTL_1M,
        expirationTtl: TTL_1Y,
      })
      .then(() => new Response(data, { headers, status: 201 }))
      .catch((err: unknown) => (
        console.error(err), new Response(data, { headers, status: 200 })
      ));
  },
  home(req: Request, connInfo: ConnInfo, params: PathParams) {
    const commentClsx =
      "text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm inline-block";
    const paramClsx =
      "font-semibold text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-400 dark:!underline-blue-gray-500 cursor-pointer";
    const valueClsx =
      "font-medium text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-300 dark:!underline-blue-gray-600 cursor-pointer";
    const commentBlockClsx =
      "text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm block mb-1";
    // render jsx homepage
    return html({
      lang: "en",
      title: siteMeta.siteTitle,
      meta,
      links,
      styles: [],
      body: (
        <div class="max-w-2xl px-8 mx-auto h-screen">
          <div class="w-full py-10">
            {/* Header */}
            <h1 class="text-7xl font-light direction-rtl tracking-tighter text-center text-black dark:text-white py-2 my-4 border-b border-gray-200 dark:!border-gray-700">
              <span>migo</span>
            </h1>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              <ExampleImage src={siteMeta.coverImageDark} />
            </p>

            {/* What is this? */}
            <Heading title="What is this?">What is this?</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              This is a free microservice providing dynamic OpenGraph Images,
              featuring just-in-time rendering on a global edge network.
            </p>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Images are generated just-in-time and globally deployed on{" "}
              <Link url="https://deno.com/deploy">Deno's Edge Network</Link>.
              Each unique image URL is then cached as an immutable asset in{" "}
              <Link url="https://developers.cloudflare.com/workers/runtime-apis/kv">
                Cloudflare KV
              </Link>. This delivers a response in{" "}
              <strong class="font-semibold">
                <em>milliseconds</em>
              </strong>, to anyone in the whole world.
            </p>
            <p class="my-1.5 md:my-2 text-base md:text-lg text-center">
              <Link url="https://dash.deno.com/new?url=https%3a%2f%2fgithub.com%2fnberlette%2fmigo">
                Deploy your own with Deno!
              </Link>.
            </p>

            {/* Schema */}
            <Heading title="Schema">Schema</Heading>
            <RouteSchema prefix="." />
            <RouteSchema prefix="." subtitle />
            <RouteSchema prefix="." subtitle params="k1=value;k2=value2" />

            {/* Parameters */}
            <Heading title="Parameters">Parameters</Heading>
            <p class="my-2 text-sm">
              There are numerous parameters you can provide in the{" "}
              <Link url="https://mdn.io/URLSearchParams" target="_blank">
                image URL's query string
              </Link>{" "}
              to customize the look and feel of the generated image.
            </p>
            <pre
              class="text-sm bg-gray-50/50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800/75 dark:!border-gray-700 dark:!text-blue-gray-50 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll"
              style="white-space:pre;word-wrap:none;"
            >
              <code class="whitespace-pre cursor-default">
                {paramList.map((
                  [param, value, ...comments]: string[],
                  idx: number,
                ) => (
                  <span key={idx} class="block">
                    <span
                      class={value == null
                        ? (commentBlockClsx + (idx > 0 ? " mt-4" : ""))
                        : paramClsx}
                    >
                      {param}
                    </span>
                    <span class={value == null ? "hidden" : "inline-block"}>
                      <span class={commentClsx}>= &quot;</span>
                      <span class={valueClsx}>{value}</span>
                      <span class={commentClsx}>
                        &quot;, {comments.length > 0 && comments.join(" ")}
                      </span>
                    </span>
                  </span>
                ))}
              </code>
            </pre>

            {/* Features */}
            <Heading title="Icons: more than you'll ever need.">
              Icons
            </Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Icons are embedded from{" "}
              <Link url="https://icns.ml">icns</Link>, another Deno-powered
              project of mine. This means direct access to over{" "}
              <strong>100,000 icons</strong>, and millions of color combinations
              - only a parameter away.
            </p>

            <Heading title="Format: SVG or PNG (raster)">
              Format
            </Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Every image is first sculpted as an SVG (Scalable Vector
              Graphics). If you request a file ending in{" "}
              <code>.svg</code>, then this is what you get! If you request a
              {" "}
              <code>.png</code>, however, that SVG is rasterized with a
              Rust-based renderer called{" "}
              <Link url="https://deno.land/x/resvg_wasm">resvg</Link>.
            </p>

            <Heading title="Rendered on the bleeding edge.">
              Rendered on the bleeding edge.
            </Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Obviously, using the SVG format will always result in the fastest
              response times. However, most of the major social media platforms
              don't yet support OpenGraph images in SVG format.
            </p>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              Since each image URL is unique, each image is treated as
              immutable. We take advantage of aggressive caching in Cloudflare's
              KV, allowing a response latency of{" "}
              <strong>~100ms on average</strong>.
            </p>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              The only lag you <em>might</em>{" "}
              encounter is the first time you request that image URL. Thankfully
              that is essentially never on a request from an end-user - they get
              a cache hit from the nearest edge datacenter in their region.
            </p>

            {/* Examples */}
            <Heading title="Examples">Examples</Heading>
            <p class="my-1.5 md:my-2 text-sm md:text-base">
              <ExampleImage src={siteMeta.coverImage} />
            </p>
            <pre class="text-sm bg-gray-50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800/75 dark:!border-gray-700 dark:!text-blue-gray-50 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
              <code class="whitespace-pre">
                {encodeURI(dec(siteMeta.coverImage))}
              </code>
            </pre>

            <p class="my-1.5 md:my-2 text-sm md:text-base">
              <ExampleImage src={siteMeta.coverImageAlt} />
            </p>
            <pre class="text-sm bg-gray-50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800 dark:!border-gray-700 dark:!text-blue-gray-100 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
              <code class="whitespace-pre">
                {encodeURI(dec(siteMeta.coverImageAlt))}
              </code>
            </pre>

            {/* Footer */}
            <p class="text-sm text-center border-t border-gray-200 dark:border-blue-gray-700 pt-6 pb-2 my-4">
              Open Source Software by{" "}
              <Link
                url="https://github.com/nberlette"
                title="View Nicholas Berlette's GitHub Profile"
              >
                Nicholas Berlette
              </Link>
            </p>
            <footer class="prose text-center pt-2 border-t border-gray-200 dark:!border-blue-gray-700">
              <Link
                url="https://github.com/nberlette"
                title="View Nicholas Berlette's GitHub Profile"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/nberlette/static/brand/logo-green.svg"
                  width="32"
                  height="32"
                  class="inline-block w-8 h-8 mx-auto my-2"
                  alt="Nicholas Berlette's Logomark in a pretty shade of green"
                />
              </Link>
            </footer>
          </div>
        </div>
      ),
    });
  },
  async favicon(req: Request, connInfo: ConnInfo, params: PathParams) {
    const res = await fetch(
      "https://icns.deno.dev/mdi:alpha-m-circle-outline:dynamic.svg",
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
  // home plate
  "/": handle.home,
  // handle "static" assets first
  "/favicon.:ext(ico|svg)": handle.favicon,
  // do it for the seo fam
  "/robots.txt": handle.robotsTxt,
  // params, title, subtitle, and extension
  "/:params/:title/:subtitle([^]+?).:type(png|svg)": handle.image,
  // params, title, extension
  "/:params/:title([^]+?).:type(png|svg)": handle.image,
  // just a title and extension
  "/:title([^]+?).:type(png|svg)": handle.image,
  // redirect to .png if no extension
  "/:wheresmyextension([^]+?)": handle.image,
  404: handle.home,
} as Routes);
