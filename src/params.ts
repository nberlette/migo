import { assert, decode, is } from "../deps.ts";
import { defaultParams } from "./constants.ts";
import { camelCase, formatHex, lowerCase, parseColor } from "./utils.ts";

declare namespace Params {
  type Init =
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | Params;
}

export class Params extends URLSearchParams implements Params {
  private static readonly paramsPattern = /(?:|[&;])([^&;#=]+)[=]([^&;#]*)/g;
  private static readonly groupsPattern = /(?<=[^&;#]*)[&;](?=[^&;#]*)/g;
  private static readonly valuesPattern = /(?<=[^&;#=]+)[=](?=[^&;#]*)/g;

  constructor(init?: Params.Init) {
    if (init) {
      init = (Params.validate(init) && Params.parse(init)) ||
        new URLSearchParams();
      return super(init), this;
    }
    return super(), this;
  }

  /**
   * Verify if an arbitrary value is fit for initializing a Params instance.
   * @param value
   * @returns
   */
  static validate(value: unknown): value is Params.Init {
    return (
      (typeof value === "string" && Params.pattern.params.test(value)) ||
      (Array.isArray(value) && Array.isArray(value[1])) ||
      (value instanceof Params || value instanceof URLSearchParams) ||
      (Object.prototype.toString.call(value) === "[object Object]" && (
        Object.keys(value as Record<string, unknown>).length === 0 ||
        Object.keys(value as Record<string, unknown>)
          .every((v) => typeof v === "string")
      ))
    );
  }

  static get pattern(): {
    [K in "params" | "groups" | "values"]: RegExp;
  } {
    return {
      params: Params.paramsPattern,
      groups: Params.groupsPattern,
      values: Params.valuesPattern,
    };
  }

  /**
   * Parse parameters from a string, array of entries, object literal, or
   * an existing Params / URLSearchParams instance. Allows parameters with
   * semicolon (`;`) delimiters, per the IETF RFC specification.
   * @param value raw value to be parsed
   * @returns
   */
  static parse<T extends Params.Init>(value: T) {
    const init = new URLSearchParams();
    if (Params.validate(value)) {
      if (
        (Array.isArray(value) && Array.isArray(value[0])) ||
        (typeof value === "object" &&
          !(value instanceof URLSearchParams || value instanceof Params))
      ) {
        value = new URLSearchParams(value) as T;
      }
      return `${value.toString()}`
        .split(Params.pattern.groups)
        .map((p) => p.split(Params.pattern.values))
        .reduce((params, [key, val]) => (
          (key = decode(key.trim())),
            params.append(key, decode(val?.trim?.() ?? "")),
            params.sort(),
            params
        ), init);
    }
    return init;
  }

  /**
   * Sorts all parameters, flattens any keys with multiple values (using
   * the last value encountered as each key's final value), and then sorts
   * them once again.
   *
   * @example const params = new Params("key=val1&key2=val2&key=val3");
   * params.distinct().toString();
   * // key=val3&key2=val2
   */
  distinct(): Params {
    for (const key of new Set(this.keys())) {
      const val = this.get(key);
      this.set(key, [...this.getAll(key)].pop()! ?? val);
    }
    return this;
  }

  static get [Symbol.toStringTag](): "Params" {
    return "Params" as const;
  }

  get [Symbol.species]() {
    return Params;
  }

  static get [Symbol.unscopables]() {
    return {
      toJSON: false,
    };
  }

  [Symbol.toPrimitive](hint: "number" | "string" | "default") {
    if (hint === "number") {
      return this.size;
    }
    if (hint === "string") {
      return this.toString();
    }
    return JSON.stringify(this);
  }

  get size(): number {
    try {
      return [...this.keys()].length;
    } catch {
      return 0;
    }
  }

  get length(): number {
    return this.size;
  }

  toJSON() {
    return Object.fromEntries([...this.entries()!]);
  }
}

export declare type URLSearchParamsInit =
  | string
  | string[][]
  | Record<string, string>
  | URLSearchParams;

/**
 * Normalizes an arbitrary number of parameter sets, from various different
 * types, into a single `URLSearchParams` instance. Each argument provided is
 * treated as a separate set of parameters. Allowed types are `string`,
 * `string[][]`, `Record<string, string>`, and `URLSearchParams`. They are
 * first converted into `[key,value]` pairs (entries), then merged into a
 * literal object, and finally initialized as a `URLSearchParams` instance.
 * @param p parameters to parse, normalize, and merge. (rest param)
 * @returns a new, normalized URLSearchParams object
 */
export function formatParams<P extends URLSearchParamsInit>(
  ...p: P[]
): URLSearchParams {
  const paramStringToEntries = (s: string): string[][] =>
    `${s ?? ""}`.split(/([:]{2}|[;&])/).map((p) => {
      const [k, v] = p?.split?.(/[=]/, 2).map((s) => decode(s.trim()));
      return [k, v];
    }).filter(([k, v]) =>
      Boolean(k) && Boolean(v) && (v != null && v != "" && k != "&")
    );

  const parameters = (p ?? []).reduce(
    (acc, cur) => {
      const entries: any = (typeof cur === "string")
        ? paramStringToEntries(cur)
        : (Array.isArray(cur))
        ? [...cur].filter(Boolean)
        : (cur instanceof URLSearchParams)
        ? [...cur.entries()].filter(Boolean)
        : [...Object.entries(cur ?? {})].filter(Boolean);
      return {
        ...acc,
        ...Object.fromEntries((entries ?? []).filter(Boolean)),
      };
    },
    {} as Record<string, string>,
  );

  const keys = [...new Set(Object.keys(parameters))].sort();
  return new URLSearchParams(
    keys.filter(Boolean).map((k) => [k, parameters[k]]),
  );
}

export function collectParams<
  T extends (string | URL | Record<string, unknown>)[],
>(...sources: T): Params {
  const pathParams = sources.find(is.plainObject);
  const url: URL = new URL(sources.find(is.url) ?? "");

  is.assert.plainObject<string>(pathParams);
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
   * If path parameters have been provided, combine them with any existing
   * query params,
   * for maximum compatibility and flexibility with different requests.
   */
  const pathParameters = new Params(decode(pathParams?.params));
  const mergedParams = {
    ...defaultParams,
    ...pathParams,
    ...Object.fromEntries(pathParameters),
    ...Object.fromEntries(url.searchParams),
  };

  const params = new Params(mergedParams);

  for (const key of url.searchParams.keys()) {
    const val = decode(url.searchParams.get(key)!);
    if (lowerCase(key).endsWith("color")) {
      params.set(key, formatHex(parseColor(decode(val)))!);
    } else {
      params.set(key, val);
    }
  }

  for (const key in mergedParams) {
    const val = decode(mergedParams[key as keyof typeof mergedParams]);
    if (Params.pattern.params.test(val)) {
      Params.parse(val).forEach((v, k) => {
        v = decode(v)?.trim?.() ?? "";
        if (lowerCase(k).endsWith("color")) {
          params.set(k, formatHex(parseColor(decode(v)))!);
        } else {
          params.set(k, v);
        }
      });
    } else {
      if (lowerCase(key).endsWith("color")) {
        params.set(key, formatHex(parseColor(decode(val)))!);
      } else {
        params.set(key, val);
      }
    }
  }

  return params;
}
