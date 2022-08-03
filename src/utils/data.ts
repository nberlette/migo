import { cacheTerm } from "~/src/constants.ts";

export {
  computeHash,
  etag,
  groupBy,
  json,
  sha1,
  sha256,
  sortBy,
  toHex,
  utf8TextDecoder,
  utf8TextEncoder,
} from "~/deps.ts";

export interface ResponseProps {
  params?: URLSearchParams;
  contentType?: string;
}

export async function newResponse(
  data: string | ArrayBuffer,
  {
    params = new URLSearchParams(),
    contentType = "image/svg+xml; charset=utf-8",
    status = 200,
    headers = {},
    ...init
  }: ResponseInit & ResponseProps = {},
): Promise<Response> {
  return new Response(data, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": contentType,
      "content-length":
        `${(data instanceof ArrayBuffer ? data.byteLength : data.length)}`,
      "cache-control": cacheTerm[params.has("no-cache") ? "none" : "long"],
      "etag": await etag(data),
      ...headers,
    },
    ...(init ?? {}),
  });
}
