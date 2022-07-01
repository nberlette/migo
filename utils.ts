import { Slugger } from "~/deps.ts";
import { colorHash, formatHex, parseColor, rasterizeSVG } from "~/deps.ts";

export default {
  utf8TextEncoder: new TextEncoder(),
  utf8TextDecoder: new TextDecoder(),
  colorHash,
  formatHex,
  parseColor,
  rasterizeSVG,
  isInt(a: unknown): a is number {
    return typeof a === "number" && !Number.isNaN(a) && Number.isInteger(a);
  },
  isUint(a: unknown): a is number {
    return this.isInt(a) && a >= 0;
  },
  isFilledString(a: unknown): a is string {
    return typeof a === "string" && a.length > 0;
  },
  isFilledArray(a: unknown): a is Array<unknown> {
    return Array.isArray(a) && a.length > 0;
  },
  isPlainObject<T = Record<string, unknown>>(a: unknown): a is T {
    return a !== null && typeof a === "object" &&
      Object.getPrototypeOf(a) === Object.prototype;
  },
  isLikelyHttpURL(s: string): boolean {
    const p = s.slice(0, 8).toLowerCase();
    return p === "https://" || p.slice(0, 7) === "http://";
  },
  toHex(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  },
  async hmacSign(data: string, secret: string, hash = "SHA-256") {
    const key = await crypto.subtle.importKey(
      "raw",
      this.utf8TextEncoder.encode(secret),
      { name: "HMAC", hash: { name: hash } },
      false,
      ["sign", "verify"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      this.utf8TextEncoder.encode(data),
    );
    return this.toHex(signature);
  },
  async computeHash(
    algorithm: AlgorithmIdentifier,
    data: string | Uint8Array,
  ): Promise<string> {
    return await crypto.subtle.digest(
      algorithm,
      typeof data === "string" ? this.utf8TextEncoder.encode(data) : data,
    ).then((sum) => this.toHex(sum));
  },
  async sha256(data: string | Uint8Array): Promise<string> {
    return await this.computeHash({ name: "SHA-256" }, data);
  },
  async sha512(data: string | Uint8Array): Promise<string> {
    return await this.computeHash({ name: "SHA-512" }, data);
  },
  prettyBytes(bytes: number) {
    const units = ["", "K", "M", "G", "T", "P", "E"];
    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes * 100 / Math.pow(1024, exp)) / 100}${
      units[exp]
    }B`;
  },
  encode(
    v: string,
  ) {
    return (/([%][a-f0-9]{2})/ig.test(v) ? v : encodeURIComponent(v));
  },
  decode(v: string) {
    return decodeURIComponent(this.encode(v));
  },
  formatKey(
    url: string | URL,
    prefix = "item::",
  ) {
    return (prefix + this.sha256(this.encode(new URL(url).toString())));
  },
  slugify(s: string): string {
    return Slugger.slug(s);
  },
  toStringTag(o: unknown): string {
    return Object.prototype.toString.call(o).replace(
      /(?<=^\[object )(.+)(?=\]$)/,
      "$1",
    );
  },
  /**
   * Check if an Object's toStringTag is equal to a given value
   * @returns true if
   */
  toStringTagIs(
    obj: any,
    tag: string,
  ): boolean {
    return (this.toStringTag(obj).toLowerCase() === tag.toLowerCase());
  },
  /**
   * Extracts and parses parameters from search query or from the path.
   * Allows delimiters of `&` (standard), `;`, or `::`.
   * Trims and runs `decodeURIComponent` on all values.
   * @returns an array of param entries in `[key, value]` format
   */
  extractParamsEntries(s: string) {
    return `${s ?? ""}`.split(/([:]{2}|[;&])/).map(
      (
        p: string,
      ) => [
        (p.split("=")[0] ?? "").trim(),
        this.decode((p.split("=")[1] ?? "").trim()),
      ],
    );
  },
  /**
   * Extracts params into entries and converts them into an Object.
   */
  extractParamsObject(s: string) {
    return Object.fromEntries(this.extractParamsEntries(s));
  },
  /**
   * Extracts params into entries and converts them into a new URLSearchParams instance.
   */
  extractParams(s: string) {
    return new URLSearchParams(this.extractParamsEntries(s));
  },
  /**
   * Adjusts an SVG's `viewBox` value to allow a given stroke width (`s`)
   * without any clipping along the borders of the icon.
   * @example adjustViewBox(2)("0 0 24 24") // -> "-4 -4 32 32"
   * @param s the stroke width to use as an adjustment factor
   * @returns replacer function to formatted viewBox value using `str.replace`
   */
  adjustViewBox(s: number | string) {
    return (m: string) =>
      m.split(/[\s ]+/g, 4).map((v, i) =>
        i < 2 ? (+v - (+s * 2)) : (+v + (+s * 4))
      ).join(" ");
  },
  /**
   * Create a responsive source set for images
   */
  createSrcSet(url: string, sizes = [1280, 640, 480]): string {
    const originalWidth = 1280;
    return sizes.map((size) =>
      `${url}${url.includes("?") ? "&" : "?"}pxRatio=${
        size / originalWidth
      } ${size}w`
    ).join(", ");
  },
};
