import { createHash, createHmac } from "node:crypto";
import { r2Config, r2Configured, r2PublicUrlFor } from "./r2";

export type R2ListedObject = {
  key: string;
  size: number;
  lastModified: string | null;
  etag: string | null;
  publicUrl: string | null;
};

export type R2ListResult = {
  items: R2ListedObject[];
  nextToken: string | null;
  truncated: boolean;
};

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function amzDate(d = new Date()): { amz: string; day: string } {
  const iso = d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return { amz: iso, day: iso.slice(0, 8) };
}

function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalQuery(entries: Array<[string, string]>): string {
  return entries
    .map(([k, v]) => [awsEncode(k), awsEncode(v)] as const)
    .sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || av.localeCompare(bv))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function xmlText(xml: string, tag: string): string | null {
  const hit = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return hit ? decodeXml(hit[1]) : null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function listR2Objects(opts: {
  prefix?: string;
  continuationToken?: string | null;
  maxKeys?: number;
} = {}): Promise<R2ListResult> {
  if (!(await r2Configured())) throw new Error("R2 is not configured");
  const cfg = await r2Config();
  const maxKeys = Math.max(1, Math.min(200, opts.maxKeys ?? 100));
  const query: Array<[string, string]> = [
    ["list-type", "2"],
    ["max-keys", String(maxKeys)],
  ];
  if (opts.prefix) query.push(["prefix", opts.prefix]);
  if (opts.continuationToken) query.push(["continuation-token", opts.continuationToken]);

  const q = canonicalQuery(query);
  const url = new URL(`https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}`);
  url.search = q;

  const { amz, day } = amzDate();
  const payloadHash = sha256Hex(Buffer.alloc(0));
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
  };
  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((n) => `${n}:${headers[n]}\n`).join("");
  const signedHeaders = signedHeaderNames.join(";");
  const canonical = ["GET", `/${cfg.bucket}`, q, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${day}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, scope, sha256Hex(canonical)].join("\n");
  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, day);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const res = await fetch(url, {
    headers: {
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amz,
      authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 list failed (${res.status}) ${text.slice(0, 200)}`);
  }

  const xml = await res.text();
  const blocks = [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/gi)].map((m) => m[1]);
  const items = blocks
    .map((block): R2ListedObject | null => {
      const key = xmlText(block, "Key");
      if (!key) return null;
      return {
        key,
        size: Number(xmlText(block, "Size") ?? 0) || 0,
        lastModified: xmlText(block, "LastModified"),
        etag: xmlText(block, "ETag")?.replace(/^\"|\"$/g, "") ?? null,
        publicUrl: r2PublicUrlFor(key, cfg),
      };
    })
    .filter((item): item is R2ListedObject => Boolean(item));

  return {
    items,
    nextToken: xmlText(xml, "NextContinuationToken"),
    truncated: (xmlText(xml, "IsTruncated") ?? "false").toLowerCase() === "true",
  };
}
