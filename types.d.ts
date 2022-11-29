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

type Maybe<T> = T | null | undefined;
type MaybeArray<T> = Maybe<T> | Maybe<T>[];

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

  type SVG = Partial<{
    xmlns: "http://www.w3.org/2000/svg";
    viewBox: ViewBox;
    width: number | `${number}`;
    height: number | `${number}`;
    pxRatio: number | `${number}`;
    borderRadius: number | `${number}`;
    bgColor: string;
    title: string;
    subtitle: string;
  }>;

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
  type Title = Partial<
    {
      [K in keyof Text as `title${Capitalize<K>}`]: Text[K];
    }
  >;

  // props for the subtitle component
  type Subtitle = Partial<
    {
      [K in keyof Title as `sub${K}`]: Title[K];
    }
  >;

  type StrokesNShadows = Extract<keyof Text, `${"stroke" | "shadow"}${string}`>;
  // deno-fmt-ignore
  type Icon = Partial<
    & { 
        [K in StrokesNShadows as `icon${Capitalize<K>}`]: Text[K];
      }
    & { [K in `icon${"W" | "H" | "X" | "Y"}`]: number | `${number}`; }
    & {
      icon: boolean | string;
      iconUrl: RemoteURL | DataURL;
      iconColor: string;
      viewBox: ViewBox;
    }
  >;
}

interface SVGProps extends Partial<Props.SVG> {
  /* inherit */
}
interface TitleProps extends Partial<Props.Title> {
  /* inherit */
}
interface SubtitleProps extends Partial<Props.Subtitle> {
  /* inherit */
}
interface IconProps extends Partial<Props.Icon> {
  /* inherit */
}
interface AllProps extends TitleProps, SubtitleProps, IconProps, SVGProps {
  [key: string]: unknown;
}

declare namespace Meta {
  type SEO = Partial<OpenGraph & Twitter & Generic & Layout>;
  type OpenGraph = {
    "og:image": string;
    "og:url": string;
    "og:type": string;
    "og:title": string;
    "og:description": string;
    "og:author": string;
    "og:image:width": string;
    "og:image:height": string;
    "og:image:alt": string;
    "og:image:src": string;
  };
  type Twitter = {
    "twitter:card": string;
    "twitter:creator": string;
    "twitter:image": string;
    "twitter:site": string;
    "twitter:summary": string;
    "twitter:title": string;
    "twitter:description": string;
  };
  type Generic = {
    title: string;
    author: string;
    description: string;
    keywords: string;
  };
  type Layout = {
    viewport: string;
    canonical: string;
    favicon: string;
    "mask-icon": string;
    "theme-color": string;
  };
}

interface Meta extends Meta.SEO {
  /* inherit */
}
