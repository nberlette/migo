/// <reference types="gokv" />
/// <reference types="preact" />

declare enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}

declare type LogLevelName = Lowercase<`${keyof typeof LogLevel}`>;

type PathParams<T extends any = string> = Record<string, T>;

/**
 * Disclaimer: you are now about to enter... the Twilight Zone.
 * Some seriously wonky shit is going on around here 😵‍💫
 */

type HeadingLevel = Lowercase<`h${1 | 2 | 3 | 4 | 5 | 6}`>;

declare namespace Migo {
  namespace Props {
    type Base =
      | "fill"
      | "color"
      | `stroke${"" | "Width" | "Dasharray" | "Dashoffset" | "Opacity"}`;

    type Size = "x" | "y" | "w" | "h";

    type Text =
      | `font${Capitalize<"family" | "size" | "weight">}`
      | "textAnchor";

    type Prefixed<
      P extends string,
      U extends any = Text,
      V extends any = never,
    > = {
      [K in `${P}${Capitalize<U>}`]?: V extends never
        ? (U extends keyof Size ? number : string)
        : V;
    };

    type Composite<T extends string, E extends any = never> =
      & Prefixed<T, Size, number>
      & Prefixed<T, Base, string>
      & Partial<E>;

    type Title<P extends string = "title"> = Omit<
      Composite<P, Prefixed<P, Text, string>>,
      `${string}${"W" | "H"}`
    >;
    type Icon<U extends any = Record<never, never>> = Partial<
      Composite<"icon", U>
    >;
  }
}

type TitleProps = Migo.Props.Title<"title">;
type SubtitleProps = Migo.Props.Title<"subtitle">;
type IconProps = Migo.Props.Icon<{
  iconUrl?: string;
  icon: boolean | string;
  viewBox: string;
}>;

interface BaseProps {
  width: number;
  height: number;
  pxRatio: number;
  borderRadius: string | number;
  viewBox: string;
  xmlns: string;
  role: string;
  bgColor: string;
  title: string;
  subtitle: string;
}

type AllProps<T extends any = string> = Partial<
  Record<keyof (TitleProps & SubtitleProps & IconProps & BaseProps), T>
>;

interface Meta {
  viewport?: string;
  title?: string;
  author?: string;
  description?: string;
  keywords?: string;
  "theme-color"?: string;
  "og:title"?: string;
  "og:url"?: string;
  "og:type"?: string;
  "og:image"?: string;
  "og:image:alt"?: string;
  "og:description"?: string;
  "og:author"?: string;
  "twitter:card"?: "summary_large_image" | string;
  "twitter:title"?: string;
  "twitter:url"?: string;
  "twitter:image"?: string;
  "twitter:image:alt"?: string;
  "twitter:summary"?: string;
  "twitter:image:src"?: string;
  "twitter:creator"?: string;
}
