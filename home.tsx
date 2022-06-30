/** @jsx h */
import { h } from "~/deps.ts";
import utils from "~/utils.ts";
import { meta, paramList, siteMeta } from "~/constants.ts";

/**
 * Heading component (JSX)
 */
export const Heading = ({
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
  if (
    !Array.isArray(className) && (utils.toStringTag(className) === "Object")
  ) {
    className = Object.keys(className).filter((k) =>
      !!className[k] && className[k] != null
    );
  }
  className = [className].flat(Infinity).filter(Boolean).join(" ");
  return h(level, {
    id: utils.slugify(title),
    class: className,
    title: title,
    ariaLabel: title,
    ...props,
  }, children);
};

/**
 * Link component (JSX)
 */
export const Link = ({
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
export const ExampleImage = ({
  src = meta["og:image"],
  title = meta["og:title"],
  width = "640",
  height = "320",
  sizes = "50vw",
  ...props
}: Record<string, any>) => (
  <Link title={title} url={encodeURI(utils.decode(src))} plain="true">
    <img
      src={src}
      srcset={utils.createSrcSet(src)}
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
export const RouteSchema = ({
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

export default function Home() {
  const commentClsx =
    "text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm inline-block";
  const paramClsx =
    "font-semibold text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-400 dark:!underline-blue-gray-500 cursor-pointer";
  const valueClsx =
    "font-medium text-sm md:text-base underline underline-dashed text-black dark:!text-white underline-gray-300 dark:!underline-blue-gray-600 cursor-pointer";
  const commentBlockClsx =
    "text-gray-900 tracking-tight dark:!text-gray-50 text-xs md:text-sm block mb-1";
  return (
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
          <Link url="https://deno.com/deploy">Deno's Edge Network</Link>. Each
          unique image URL is then cached as an immutable asset in{" "}
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
          <Link url="https://icns.ml">icns</Link>, another Deno-powered project
          of mine. This means direct access to over{" "}
          <strong>100,000 icons</strong>, and millions of color combinations -
          only a parameter away.
        </p>

        <Heading title="Format: SVG or PNG (raster)">
          Format
        </Heading>
        <p class="my-1.5 md:my-2 text-sm md:text-base">
          Every image is first sculpted as an SVG (Scalable Vector Graphics). If
          you request a file ending in{" "}
          <code>.svg</code>, then this is what you get! If you request a{" "}
          <code>.png</code>, however, that SVG is rasterized with a Rust-based
          renderer called{" "}
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
          Since each image URL is unique, each image is treated as immutable. We
          take advantage of aggressive caching in Cloudflare's KV, allowing a
          response latency of <strong>~100ms on average</strong>.
        </p>
        <p class="my-1.5 md:my-2 text-sm md:text-base">
          The only lag you <em>might</em>{" "}
          encounter is the first time you request that image URL. Thankfully
          that is essentially never on a request from an end-user - they get a
          cache hit from the nearest edge datacenter in their region.
        </p>

        {/* Examples */}
        <Heading title="Examples">Examples</Heading>
        <p class="my-1.5 md:my-2 text-sm md:text-base">
          <ExampleImage src={siteMeta.coverImage} />
        </p>
        <pre class="text-sm bg-gray-50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800/75 dark:!border-gray-700 dark:!text-blue-gray-50 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
          <code class="whitespace-pre">
            {encodeURI(utils.decode(siteMeta.coverImage))}
          </code>
        </pre>

        <p class="my-1.5 md:my-2 text-sm md:text-base">
          <ExampleImage src={siteMeta.coverImageAlt} />
        </p>
        <pre class="text-sm bg-gray-50 border border-b-2 border-gray-200 dark:!bg-blue-gray-800 dark:!border-gray-700 dark:!text-blue-gray-100 p-4 rounded flex flex-col w-full my-2 overflow-x-scroll">
          <code class="whitespace-pre">
            {encodeURI(utils.decode(siteMeta.coverImageAlt))}
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
            url="https://github.com/nberlette/migo"
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
  );
}
