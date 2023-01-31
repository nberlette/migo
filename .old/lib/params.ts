import { MemoizableFn } from "https://deno.land/x/911@0.1.5/mod.ts";
import { decode, is } from "../deps.ts";
import { defaultParams } from "./constants.ts";
import { formatHex, lowerCase, parseColor } from "./utils.ts";

declare namespace Params {
  type Init =
    | string
    | string[][]
    | readonly (readonly [string, string])[]
    | Record<string, string | string[]>
    | URLSearchParams
    | Params
    | Iterable<[string, string]>
    | IterableIterator<[string, string]>
    | Map<string, string>
    | Set<[string, string]>
    | undefined;

  export type Primitive =
    | string
    | number
    | bigint
    | boolean
    | symbol
    | null
    | undefined;
  export type Printable = Exclude<Primitive, symbol>;

  interface Options {
    aliases?: {
      [originalKey: string]: Maybe<string> | Maybe<string>[];
    };
    exclude?: string[];
    collect?: boolean | string[];
  }

  interface Context {
    index: number;
    /** The Options object. */
    config: Options;
    /** The previous key/value pair. */
    prev: [string, string];
    /** The parsed parameters. */
    memo: Record<string, unknown | unknown[]>;
  }
}

export class Params extends URLSearchParams {
  #defaults: Record<string, string> = defaultParams;
  #aliases: Params.Options["aliases"] & {} = {};
  #list: [string, string][] = [];

  constructor(initial?: string);
  constructor(inherit: Params | URLSearchParams);
  constructor(
    entries:
      | readonly (readonly string[])[]
      | readonly (readonly [string, string])[]
      | Iterable<readonly [string, string]>,
  );
  constructor(initial: Record<string, string>);
  constructor(...params: Params.Init[]);
  constructor(...init: any[]) {
    super();
    if (init.length === 0) {
      this.list = [];
      return this;
    } else {
      for (const entry of init) {
        if (Params.validate(entry)) {
          this.list = [...this.list, ...Params.parse(entry)];
        }
      }
    }
    return this;
  }

  get list() {
    return this.#list;
  }

  set list(items: [string, string][]) {
    this.#list = []; // wipe all current keys
    this.clear();
    for (const [key, value] of items) {
      super.append(key, value);
    }
    this.#list = [...super.entries()];
  }

  /**
   * Verify if an arbitrary value is fit for initializing a Params instance.
   * @param value
   * @returns
   */
  static validate(value: unknown): value is Params.Init {
    // check if its a string that matches the accepted syntax
    if (is.string(value) && this.pattern.params.test(value)) {
      return true;
    }
    // check if its a valid set of entries
    if (
      is.entries<string, string>(value) && is.all((v) => (
        is.entry(v) && is.nonEmptyString(v[0]) && is.string(v[1])
      ), ...value)
    ) {
      return true;
    }
    // check if its an existing instance
    if (value instanceof Params || value instanceof URLSearchParams) {
      return true;
    }
    // noopdd
    return false;
  }

  static readonly pattern = {
    params: /(?:|[&;])([^&;#=]+)[=]([^&;#]*)/dg,
    groups: /(?<=[^&;#]*)[&;](?=[^&;#]*)/dgy,
    values: /(?<=[^&;#=]+)[=](?=[^&;#]*)/dgy,
  } as const;

  /**
   * Parse parameters from a string, array of entries, object literal, or
   * an existing Params / URLSearchParams instance. Allows parameters with
   * semicolon (`;`) delimiters, per the IETF RFC specification.
   * @param value raw value to be parsed
   * @returns
   */
  static parse(
    value: Params.Init,
    options?: Params.Options,
  ): [string, string][] {
    const init = new URLSearchParams();
    if (Params.validate(value)) {
      // stringified parameters
      if (
        is.nonEmptyStringAndNotWhitespace(value) &&
        this.pattern.params.test(value)
      ) {
        const params = value.split(this.pattern.groups) ?? [];
        for (const param of params) {
          const [key, val] = param.split(this.pattern.values);
          init.append(key, val);
        }
      }
      // entries
      // [ ...[['f1', 's'], ['f2': 't']]]
      if (is.array(value, is.entry<string, string>)) {
        for (const [key, val] of value) {
          init.append(key, val);
        }
      }
      if (
        is.nonEmptySet<[string, string]>(value) ||
        is.nonEmptyMap<string, string>(value) ||
        is.nonEmptyObject<string, string>(value)
      ) {
        const entries = Object.entries(value);
        for (const [key, val] of entries) {
          init.append(key, val);
        }
      }

      // url search params and params instances
      if (
        is.instanceOf(value, Params) ||
        is.instanceOf(value, URLSearchParams)
      ) {
        for (const [key, val] of value.entries()) {
          init.append(key, val);
        }
      }
    }
    return [...init] as [string, string][]; // pass all initialization entries
  }

  static format<T extends Params.Init>(
    ...params: T[]
  ): Params {
    const paramStringToEntries = (s: string): string[][] =>
      `${s ?? ""}`.split(/(?<=\w+)([;&])(?=\w+)/).map((p) => {
        const [k, v] = p?.split?.(/[=]/, 2).map((s) => decode(s.trim()));
        return [k, v];
      }).filter(([k, v]) =>
        Boolean(k) && Boolean(v) && (v != null && v != "" && k != "&")
      );

    const p = (params ?? []).reduce(
      (acc, cur) => {
        const entries: any = (typeof cur === "string")
          ? paramStringToEntries(cur)
          : (is.array(cur))
          ? [...cur].filter(Boolean)
          : (cur instanceof URLSearchParams || cur instanceof Params)
          ? [...cur.entries()].filter(Boolean)
          : [...Object.entries(cur ?? {})].filter(Boolean);
        return {
          ...acc,
          ...Object.fromEntries((entries ?? []).filter(Boolean)),
        };
      },
      {} as Record<string, string>,
    );

    return new Params(p).distinct();
  }

  clear(): Params {
    for (const key of this.keys()) {
      this.delete(key); // wipe all previous keys
    }
    return this;
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

  get size(): number {
    try {
      return [...this.keys()].length;
    } catch {
      return 0;
    }
  }

  toJSON() {
    return Object.fromEntries([...this]);
  }

  *[Symbol.iterator](): IterableIterator<[string, string]> {
    for (const [key, value] of this.entries()) {
      yield [key, value];
    }
  }
}

Reflect.defineProperty(Params, Symbol.toStringTag, {
  value: "ParamsConstructor",
});

Reflect.defineProperty(Params.prototype, Symbol.toStringTag, {
  value: "Params",
});

Reflect.defineProperty(Params.prototype, "length", {
  get() {
    return this.size ?? 0;
  },
  enumerable: false,
  configurable: false,
});

Reflect.defineProperty(Params.prototype, Symbol.for("Deno.customInspect"), {
  value(inspect: typeof Deno.inspect): string {
    const options: Deno.InspectOptions = {
      colors: true,
      compact: true,
      depth: 4,
      getters: true,
      showHidden: false,
      sorted: true,
      strAbbreviateSize: 128,
      iterableLimit: 50,
      trailingComma: true,
    };
    return `${this.constructor.name} ${
      inspect({
        ...this,
      }, options)
    }`;
  },
});

Reflect.defineProperty(Params.prototype, Symbol.toPrimitive, {
  value(hint: "number" | "string" | "default") {
    if (hint === "number") return this.size;
    if (hint === "string") return this.toString();
    return JSON.stringify(this);
  },
});

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
      Params.parse(val).forEach(([k, v]) => {
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
