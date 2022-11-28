/** @jsx h */
/** @jsxFrag Fragment */
import { createSrcSet, slugify } from "./utils.ts";
import { type ComponentChildren, decode, Fragment, h, is } from "../deps.ts";
import { meta, paramList } from "./constants.ts";

export const Footer = ({ ...props }) => (
  <footer
    class="prose text-center pt-4 mt-4 border-t border-gray-200 dark:!border-blue-gray-700 w-full flex flex-col gap-y-2"
    {...props}
  >
    <div>
      <Link
        href="https://github.com/nberlette/migo"
        title="View Nicholas Berlette's GitHub Profile"
      >
        <BerletteIcon alt="Nicholas Berlette is With Ukraine" />
      </Link>
    </div>
  </footer>
);

/**
 * Heading component (JSX)
 */
export const Heading = ({
  level = "h2",
  title,
  children,
  className =
    "text-2xl sm:text-3xl font-semibold tracking-tight mt-8 mb-2 pb-2 border-b border-gray-200 dark:!border-blue-gray-700",
  ...props
}: {
  level?: HeadingLevel;
  title?: string;
  className?: any | any[];
  [prop: string]: any;
}) => {
  className = is.string(className)
    ? className.split(" ").map((s) => s.trim())
    : is.arrayLike(className)
    ? Object.keys(className).filter((k) => Boolean(k))
    : is.array(className)
    ? [...className].filter(Boolean)
    : className;
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
export const Link = ({
  href,
  title,
  children,
  ...props
}: Record<string, any>) => {
  try {
    href = new URL(href).toString();
  } catch {
    href = `${href}`;
  }
  const isExternal = /^http/i.test(href);
  const attr =
    (isExternal
      ? { ...props, target: "_blank", rel: "nofollow noreferrer" }
      : props);
  return (
    <a
      href={href}
      title={title}
      class={(props.weight ?? "font-semibold") +
        " underline underline-1 underline-dashed underline-offset-1 relative " +
        (props.class ?? props.className ?? "")}
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
  <div
    class={`w-[calc(100%_+_3rem)] sm:!w-full block min-h-[${height}px] relative -left-6 -right-6 sm:!left-0 sm:!right-0`}
  >
    <Link
      title={title}
      href={encodeURI(decode(src))}
      plain="true"
      class="example-image-link"
    >
      <img
        src={src}
        srcset={createSrcSet(src)}
        sizes={sizes}
        alt={title}
        class="example-image"
        width={width}
        height={height}
        {...props}
      />
    </Link>
  </div>
);

/**
 * Route Schema component to display different routes with rich descriptions.
 */
export const RouteSchema = ({
  prefix = "migo.deno.dev",
  params,
  title = ":title",
  subtitle,
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
            href="/#parameters"
            title="Use the numerous parameters available to have full control of your generated image. Click for more info."
          >
            {params ?? ":params"}
          </Link>
        )}
        <Divider />
        <Link
          href="/#title"
          title="Use the first argument for your title, the large text on the top line."
        >
          {title ?? ":title"}
        </Link>
        {subtitle && <Divider />}
        {subtitle && (
          <Link
            href="/#subtitle"
            title="Optionally add a subtitle or author name in a second segment."
            weight="font-regular text-sm"
          >
            {subtitle ?? ":subtitle"}
          </Link>
        )}
        <Divider text=".(" />
        <Link
          href="/#format"
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

export const DenoIcon = ({ ...props }: Partial<Record<string, any>>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    role="img"
    {...props}
  >
    <path
      fill="currentColor"
      d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12S5.373 0 12 0Zm-.469 6.793c-3.49 0-6.204 2.196-6.204 4.928c0 2.58 2.498 4.228 6.37 4.145l.118-.003l.425-.012l-.109.279l.013.029c.031.072.06.145.084.22l.01.028l.015.045l.021.065l.014.045l.014.047l.015.049l.021.075l.022.079l.015.054l.023.084l.022.088l.023.091l.023.095l.015.065l.024.1l.023.103l.032.143l.017.074l.024.114l.024.117l.025.12l.035.174l.029.142l.037.195l.02.1l.028.155l.03.158l.039.217l.04.225l.04.231l.041.24l.042.246l.042.254l.042.26l.032.201l.055.344l.022.14l.055.36l.045.295l.034.227l.046.308l.023.156a10.758 10.758 0 0 0 6.529-3.412l.05-.055l-.238-.891l-.633-2.37l-.395-1.47l-.348-1.296l-.213-.787l-.136-.498l-.081-.297l-.073-.264l-.032-.11l-.018-.064l-.01-.034l-.008-.026a6.042 6.042 0 0 0-2.038-2.97c-1.134-.887-2.573-1.351-4.252-1.351ZM8.467 19.3a.586.586 0 0 0-.714.4l-.004.013l-.527 1.953c.328.163.665.309 1.008.437l.08.03l.57-2.114l.004-.015a.586.586 0 0 0-.417-.704Zm3.264-1.43a.586.586 0 0 0-.715.4l-.004.014l-.796 2.953l-.004.014a.586.586 0 0 0 1.131.305l.004-.014l.797-2.953l.003-.014a.585.585 0 0 0 .013-.067l.002-.022l-.019-.096l-.027-.138l-.018-.086a.584.584 0 0 0-.367-.295Zm-5.553-3.04a.59.59 0 0 0-.037.09l-.005.02l-.797 2.953l-.004.014a.586.586 0 0 0 1.131.306l.004-.014l.723-2.678a5.295 5.295 0 0 1-1.015-.692Zm-1.9-3.397a.586.586 0 0 0-.715.4l-.004.013l-.797 2.953l-.003.015a.586.586 0 0 0 1.13.305l.005-.014l.797-2.953l.003-.015a.586.586 0 0 0-.416-.704Zm17.868-.67a.586.586 0 0 0-.715.399l-.004.014l-.797 2.953l-.003.014a.586.586 0 0 0 1.13.305l.005-.014l.797-2.953l.003-.014a.586.586 0 0 0-.416-.704ZM2.542 6.82a10.707 10.707 0 0 0-1.251 3.926a.586.586 0 0 0 1.002-.22l.004-.014l.797-2.953l.003-.014a.586.586 0 0 0-.555-.725Zm17.585.02a.586.586 0 0 0-.714.4l-.004.014l-.797 2.953l-.004.014a.586.586 0 0 0 1.131.305l.004-.014l.797-2.953l.004-.014a.586.586 0 0 0-.417-.704Zm-7.846 1.926a.75.75 0 1 1 0 1.5a.75.75 0 0 1 0-1.5Zm-6.27-4.733a.586.586 0 0 0-.715.398l-.004.015l-.797 2.953l-.004.014a.586.586 0 0 0 1.132.305l.003-.014l.797-2.953l.004-.014a.586.586 0 0 0-.417-.704Zm10.238.558a.586.586 0 0 0-.714.399l-.004.014l-.536 1.984c.347.171.678.373.99.603l.051.038l.626-2.32l.004-.014a.586.586 0 0 0-.417-.704Zm-5.211-3.33a10.76 10.76 0 0 0-1.115.158l-.078.015l-.742 2.753l-.004.015a.586.586 0 0 0 1.131.305l.004-.014l.797-2.953l.004-.015a.583.583 0 0 0 .003-.264Zm7.332 2.04l-.156.58l-.004.015a.586.586 0 0 0 1.131.305l.004-.014l.017-.063a10.838 10.838 0 0 0-.923-.772l-.069-.051Zm-4.636-1.944l-.283 1.048l-.003.014a.586.586 0 0 0 1.13.305l.005-.014l.297-1.102c-.35-.097-.705-.176-1.063-.237l-.083-.014Z"
    >
    </path>
  </svg>
);

export const BerletteIcon = (
  { className = "inline-block w-8 h-8 mx-auto my-2", ...props },
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    role="img"
    class={className}
    {...props}
  >
    <linearGradient id="ukraine" x1="1" x2="1" y1="0" y2="1">
      <stop offset="0.5" stop-color="#044bbb" />
      <stop offset="0.5" stop-color="#fcc500" />
    </linearGradient>
    <path
      fill="url(#ukraine)"
      d="M9 7h2l2 5V7h2v10h-2l-2-5v5H9V7m3-5a10 10 0 0 1 10 10a10 10 0 0 1-10 10A10 10 0 0 1 2 12A10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8a8 8 0 0 0 8 8a8 8 0 0 0 8-8a8 8 0 0 0-8-8Z"
    >
    </path>
  </svg>
);

export const GitHubIcon = ({ ...props }: Partial<Record<string, any>>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    role="img"
    {...props}
  >
    <path
      fill="currentColor"
      d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    >
    </path>
  </svg>
);

export const DeployButton = (
  { children, Icon = DenoIcon, ...props }: Partial<{
    children: ComponentChildren;
    Icon: any;
    props: any[];
  }>,
) => (
  <Link
    href="https://dash.deno.com/new?url=https%3a%2f%2fgithub.com%2fnberlette%2fmigo"
    class="btn-large group"
  >
    {Icon && <Icon class="btn-icon" />}
    <span class="text-sm sm:text-base md:text-lg font-semibold">
      {children}
    </span>
  </Link>
);

export const GitHubButton = ({
  href = "https://github.com/nberlette/migo",
  icon = true,
  children,
  ...props
}: Partial<{
  href: string;
  children: ComponentChildren | null;
  icon: boolean;
  props: any[];
}>) => (
  <Link
    href={href}
    class="btn-large group"
    title={children ?? "View on GitHub"}
    {...props}
  >
    {icon && <GitHubIcon class="btn-icon" />}
    <span class="text-sm sm:text-base md:text-lg font-semibold">
      {children ?? "View on GitHub"}
    </span>
  </Link>
);

/**
 * Toggle between the light/dark side of the force.
 */
export function ColorSchemeButton({ ...props }: { [prop: string]: any } = {}) {
  return ( // @ts-ignore bad types
    <button
      class="btn-colorscheme"
      onclick="setColorScheme((localStorage.getItem('color-scheme')==='dark'?'light':'dark'))"
      {...props}
    >
      <SunIcon class="inline-block dark:!hidden w-8 h-8 text-yellow-400 dark:text-yellow-500" />
      <MoonIcon class="hidden dark:!inline-block w-8 h-8 text-slate-400 dark:text-slate-500" />
    </button>
  );
}

/**
 * For the night owls.
 */
export function MoonIcon({ ...props }: { [prop: string]: any } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      class="w-8 h-8"
      {...props}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17.715 15.15A6.5 6.5 0 0 1 9 6.035C6.106 6.922 4 9.645 4 12.867c0 3.94 3.153 7.136 7.042 7.136 3.101 0 5.734-2.032 6.673-4.853Z"
        class="fill-transparent"
      />
      <path
        d="m17.715 15.15.95.316a1 1 0 0 0-1.445-1.185l.495.869ZM9 6.035l.846.534a1 1 0 0 0-1.14-1.49L9 6.035Zm8.221 8.246a5.47 5.47 0 0 1-2.72.718v2a7.47 7.47 0 0 0 3.71-.98l-.99-1.738Zm-2.72.718A5.5 5.5 0 0 1 9 9.5H7a7.5 7.5 0 0 0 7.5 7.5v-2ZM9 9.5c0-1.079.31-2.082.845-2.93L8.153 5.5A7.47 7.47 0 0 0 7 9.5h2Zm-4 3.368C5 10.089 6.815 7.75 9.292 6.99L8.706 5.08C5.397 6.094 3 9.201 3 12.867h2Zm6.042 6.136C7.718 19.003 5 16.268 5 12.867H3c0 4.48 3.588 8.136 8.042 8.136v-2Zm5.725-4.17c-.81 2.433-3.074 4.17-5.725 4.17v2c3.552 0 6.553-2.327 7.622-5.537l-1.897-.632Z"
        class="fill-slate-400 dark:fill-slate-500"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17 3a1 1 0 0 1 1 1 2 2 0 0 0 2 2 1 1 0 1 1 0 2 2 2 0 0 0-2 2 1 1 0 1 1-2 0 2 2 0 0 0-2-2 1 1 0 1 1 0-2 2 2 0 0 0 2-2 1 1 0 0 1 1-1Z"
        class="fill-slate-400 dark:fill-slate-500"
      />
    </svg>
  );
}

/**
 * Brighten things up with a little light in your life.
 */
export function SunIcon({ ...props }: { [prop: string]: any } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      class="w-8 h-8"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0Z"
      />
    </svg>
  );
}

/**
 * The favicon SVG!
 */
export function Favicon({ ...props }: { [prop: string]: any } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <linearGradient id="ukraine" x1="1" x2="1" y1="0" y2="1">
        <stop offset="0.5" stop-color="#155ccc" />
        <stop offset="0.5" stop-color="#fcc500" />
      </linearGradient>
      <path
        fill="url(#ukraine)"
        d="M13 7h2v8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1h2v1h2V7m-1-5a10 10 0 0 1 10 10a10 10 0 0 1-10 10A10 10 0 0 1 2 12A10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8a8 8 0 0 0 8 8a8 8 0 0 0 8-8a8 8 0 0 0-8-8Z"
      />
    </svg>
  );
}

export const ParamList = () => {
  const Parameter = ({ data, idx, ...props }) => {
    const [param, value, ...comments]: string[] = data ?? [];
    const isNumeric = /^[0-9]+$/.test(value);
    const quotes = isNumeric ? "" : '"';
    const comma = idx < paramList.length - 1 ? ", " : " ";
    const comment = comments?.length > 0 ? comments?.join(" ") : null;
    return (
      <div class="group param-group" key={idx} {...props}>
        {value == null // render as a comment block if no value exists
          ? (
            <span class={"param-comment-block " + (idx > 0 ? "mt-4" : "")}>
              {param}
            </span>
          )
          : (
            <>
              <span class="param-name">{param}</span>
              <span class="param-other">{" = "}{quotes}</span>
              <span class="param-value">{value}</span>
              <span class="param-other">{quotes}{comma}</span>
              {comment && <span class="param-comment">{comment}</span>}
            </>
          )}
      </div>
    );
  };
  return (
    <pre class="param-list">
      <code class="whitespace-pre cursor-default">
        {paramList.map((data, key) => (
          <Parameter key={key} data={data} idx={key} />
        ))}
      </code>
    </pre>
  );
};
