interface Strings extends Required<Base & Record<never, never>> {}

type Union<T extends Base, Base extends Primitive = string> = T | Strings;

declare enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}

type LogLevelName = Lowercase<`${keyof typeof LogLevel}`>;

type PathParams<T = unknown> = Record<string, T>;

type HeadingLevel = Lowercase<`h${1 | 2 | 3 | 4 | 5 | 6}`>;

// deno-fmt-ignore
type Id<U, Optional = true> = 
  | Optional extends true ? Partial<Id<U, false>> 
  : U extends infer T extends Record<string, any>
    ? { -readonly [K in keyof T]: Id<T[K], Optional> }
  : U;

declare namespace Props {
  type ViewBox = `${number} ${number} ${number} ${number}`;
  type RemoteURL = `http${"s" | ""}://${string}`;
  type DataURL = `data:${string}`;
  type LocalURL = `file:${string}`;
  type Url = RemoteURL | DataURL | LocalURL;
  type FontFamily = "sans-serif" | "serif" | "monospace";
  type FontWeight = "normal" | "bold";
  type TextAnchor = "left" | "middle" | "right";
  type StrokeLinecap = "butt" | "round" | "square";
  type StrokeLinejoin = "miter" | "round" | "bevel";

  type SVG = {
    xmlns: Union<"http://www.w3.org/2000/svg">;
    viewBox: ViewBox;
    width: number | `${number}`;
    height: number | `${number}`;
    pxRatio: number | `${number}`;
    borderRadius: number | `${number}`;
    role: Union<"img">;
    ariaLabel: string;
    bgColor: string;
    title: string;
    subtitle: string;
  };

  type Text = {
    x: number | `${number}`;
    y: number | `${number}`;
    color: string;
    fontSize: number | `${number}`;
    fontFamily: FontFamily | "default";
    fontWeight: FontWeight | "default";
    textAnchor: TextAnchor | "default";
    dominantBaseline: string;
    shadow: string;
    shadowColor: string;
    shadowOpacity: number | `${number}`;
    stroke: string;
    strokeWidth: number | `${number}`;
    strokeOpacity: number | `${number}`;
    strokeLinecap: StrokeLinecap;
    strokeLinejoin: StrokeLinejoin;
    strokeDasharray: string;
    strokeDashoffset: number | `${number}`;
  };

  // love these mappable types from TS 4.x 😍
  // props for the subtitle component
  type Title = Id<{ [K in keyof Text as `title${Capitalize<K>}`]: Text[K] }>;

  // props for the subtitle component
  type Subtitle = Id<{ [K in keyof Title as `sub${K}`]: Title[K] }>;

  // deno-fmt-ignore
  type Icon = Id<
    & { 
        [K in Extract<keyof Text, `${"stroke" | "shadow"}${string}`> as `icon${
          Capitalize<K>
        }`]: Text[K];
      }
    & { [K in "w" | "h" | "x" | "y" as `icon${K}`]: number | `${number}`; }
    & {
      icon: boolean | string;
      iconUrl: RemoteURL | DataURL;
      iconColor: string;
      iconStroke: string;
      viewBox: ViewBox;
    }
  >;
}

interface TitleProps extends Props.Title {
  /* inherit */
}
interface SubtitleProps extends Props.Subtitle {
  /* inherit */
}
interface IconProps extends Props.Icon {
  /* inherit */
}
interface SVGProps extends Props.SVG {
  /* inherit */
}
interface AllProps extends TitleProps, SubtitleProps, IconProps, SVGProps {
  [key: string]: unknown;
}

declare namespace Meta {
  type SEO = Id<OpenGraph & Twitter & Generic>;
  type OpenGraph = {
    "og:image"?: string;
    "og:url"?: string;
    "og:type"?: string;
    "og:title"?: string;
    "og:description"?: string;
    "og:author"?: string;
    "og:image:width"?: string;
    "og:image:height"?: string;
    "og:image:alt"?: string;
    "og:image:src"?: string;
  };
  type Twitter = {
    "twitter:card"?: string;
    "twitter:creator"?: string;
    "twitter:image"?: string;
    "twitter:site"?: string;
    "twitter:summary"?: string;
    "twitter:title"?: string;
    "twitter:description"?: string;
  };
  type Generic = {
    title?: string;
    author?: string;
    description?: string;
    keywords?: string;
  };
  type Layout = {
    viewport?: string;
    canonical?: string;
    favicon?: string;
    "mask-icon"?: string;
    "theme-color"?: string;
  };
}

interface Meta extends Meta.Layout, Meta.SEO {}
