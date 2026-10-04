import { createHash } from "node:crypto";

/** Pretty public names can point at a replacement asset; media IDs are versioned. */
export function mediaCacheHeaders(versioned = false): Record<string, string> {
  const browser = versioned ? "public, max-age=31536000, immutable" : "public, max-age=300";
  const edge = versioned ? "public, s-maxage=31536000" : "public, s-maxage=3600";
  return {
    "Cache-Control": browser,
    "CDN-Cache-Control": edge,
    "Vercel-CDN-Cache-Control": edge,
    "X-Content-Type-Options": "nosniff",
  };
}

export function mediaBytesResponse(
  request: Request,
  bytes: Uint8Array,
  headers: Record<string, string>,
) {
  const etag = `"${createHash("sha256").update(bytes).digest("hex")}"`;
  const responseHeaders = { ...headers, ETag: etag };
  const matches = request.headers
    .get("if-none-match")
    ?.split(",")
    .some((tag) => {
      const candidate = tag.trim().replace(/^W\//, "");
      return candidate === "*" || candidate === etag;
    });
  if (matches) return new Response(null, { status: 304, headers: responseHeaders });
  return new Response(request.method === "HEAD" ? null : new Uint8Array(bytes), {
    headers: { ...responseHeaders, "Content-Length": String(bytes.byteLength) },
  });
}
