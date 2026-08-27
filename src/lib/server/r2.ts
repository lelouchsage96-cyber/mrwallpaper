import { createHash, createHmac } from "node:crypto";
import { getSql } from "@/lib/db";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

let cached: R2Config | null | undefined;
let hydrated = false;

function strip(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function envConfig(): Partial<R2Config> {
  return {
    accountId: strip(process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? ""),
    accessKeyId: strip(process.env.R2_ACCESS_KEY_ID ?? ""),
    secretAccessKey: strip(process.env.R2_SECRET_ACCESS_KEY ?? ""),
    bucket: strip(process.env.R2_BUCKET ?? "mrwallpaper"),
    publicUrl: strip(process.env.R2_PUBLIC_URL ?? ""),
  };
}

function parseSetting(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
      try {
        return String(JSON.parse(trimmed));
      } catch {
        return trimmed.slice(1, -1);
      }
    }
    return trimmed;
  }
  if (value == null) return "";
  return String(value).trim();
}

export function configureR2(next: Partial<R2Config>) {
  const cur = cached ?? emptyConfig();
  cached = {
    accountId: strip(next.accountId ?? cur.accountId),
    accessKeyId: strip(next.accessKeyId ?? cur.accessKeyId),
    secretAccessKey: strip(next.secretAccessKey ?? cur.secretAccessKey),
    bucket: strip(next.bucket ?? cur.bucket) || "mrwallpaper",
    publicUrl: strip(next.publicUrl ?? cur.publicUrl),
  };
}

function emptyConfig(): R2Config {
  return { accountId: "", accessKeyId: "", secretAccessKey: "", bucket: "mrwallpaper", publicUrl: "" };
}

export async function hydrateR2(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  const fromEnv = envConfig();
  if (fromEnv.accountId && fromEnv.accessKeyId && fromEnv.secretAccessKey) {
    configureR2({ ...emptyConfig(), ...fromEnv });
    return;
  }
  try {
    const sql = await getSql();
    const rows = await sql.query<{ key: string; value: unknown }>(
      `select key, value from app_settings
       where key in ('r2_account_id','r2_access_key_id','r2_secret_access_key','r2_bucket','r2_public_url')`,
    );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    configureR2({
      accountId: parseSetting(map.get("r2_account_id")) || fromEnv.accountId || "",
      accessKeyId: parseSetting(map.get("r2_access_key_id")) || fromEnv.accessKeyId || "",
      secretAccessKey: parseSetting(map.get("r2_secret_access_key")) || fromEnv.secretAccessKey || "",
      bucket: parseSetting(map.get("r2_bucket")) || fromEnv.bucket || "mrwallpaper",
      publicUrl: parseSetting(map.get("r2_public_url")) || fromEnv.publicUrl || "",
    });
  } catch {
    configureR2({ ...emptyConfig(), ...fromEnv });
  }
}

export async function r2Config(): Promise<R2Config> {
  await hydrateR2();
  return cached ?? emptyConfig();
}

export async function r2Configured(): Promise<boolean> {
  const c = await r2Config();
  return Boolean(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket);
}

export function r2PublicUrlFor(key: string, cfg: R2Config): string | null {
  if (!cfg.publicUrl) return null;
  return `${strip(cfg.publicUrl)}/${key.replace(/^\//, "")}`;
}

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`))
    .join("/");
}

function amzDate(d = new Date()): { amz: string; day: string } {
  const iso = d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return { amz: iso, day: iso.slice(0, 8) };
}

async function signedFetch(
  cfg: R2Config,
  method: string,
  key: string,
  body?: Buffer,
  contentType?: string,
): Promise<Response> {
  const url = new URL(`https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${key}`);
  const { amz, day } = amzDate();
  const payloadHash = sha256Hex(body ?? Buffer.alloc(0));
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amz,
  };
  if (contentType) headers["content-type"] = contentType;
  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((n) => `${n}:${headers[n]}\n`).join("");
  const signedHeaders = signedHeaderNames.join(";");
  const canonical = [
    method,
    encodePath(url.pathname),
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${day}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, scope, sha256Hex(canonical)].join("\n");
  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, day);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const { host: _host, ...rest } = headers;
  return fetch(url, {
    method,
    headers: rest,
    body: body && (method === "PUT" || method === "POST") ? new Uint8Array(body) : undefined,
  });
}

export async function r2Put(key: string, body: Buffer, mime: string): Promise<void> {
  const cfg = await r2Config();
  const res = await signedFetch(cfg, "PUT", key, body, mime || "application/octet-stream");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 put failed (${res.status}) ${text.slice(0, 180)}`);
  }
}

export async function r2Get(key: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const cfg = await r2Config();
  const res = await signedFetch(cfg, "GET", key);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 get failed (${res.status}) ${text.slice(0, 180)}`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  return { bytes, mime: res.headers.get("content-type") || "application/octet-stream" };
}

export async function r2Delete(key: string): Promise<void> {
  const cfg = await r2Config();
  const res = await signedFetch(cfg, "DELETE", key);
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 delete failed (${res.status}) ${text.slice(0, 180)}`);
  }
}

export async function pingR2(): Promise<{ ok: boolean; error?: string }> {
  if (!(await r2Configured())) return { ok: false, error: "missing credentials" };
  const key = `health/${crypto.randomUUID()}.txt`;
  const body = Buffer.from("ok", "utf8");
  try {
    await r2Put(key, body, "text/plain");
    const got = await r2Get(key);
    await r2Delete(key);
    if (!got || got.bytes.toString("utf8") !== "ok") return { ok: false, error: "round-trip mismatch" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "r2 error" };
  }
}