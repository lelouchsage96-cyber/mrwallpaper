/**
 * Live Supabase Storage client. Not imported while integration is paused.
 * To reconnect: switch `src/lib/server/supabase.ts` back to this module.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_BUCKET = "wallpaper-previews";
const ORIGINAL_BUCKET = "wallpaper-originals";
const DEFAULT_URL = "https://sbxcunyimpiehxuasnno.supabase.co";

let overrideUrl = "";
let overrideKey = "";
let client: SupabaseClient | null = null;
let bucketsReady: Promise<void> | null = null;
let hydrated = false;

function strip(url: string): string {
  return url.trim().replace(/\/$/, "");
}

export function configureSupabase(opts: { url?: string; serviceKey?: string }) {
  if (opts.url) overrideUrl = strip(opts.url);
  if (opts.serviceKey !== undefined) {
    overrideKey = opts.serviceKey.trim();
    client = null;
    bucketsReady = null;
  }
}

function envUrl(): string {
  return strip(
    process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      overrideUrl ||
      DEFAULT_URL,
  );
}

function envKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    overrideKey
  ).trim();
}

export function supabaseProjectUrl(): string {
  return envUrl() || DEFAULT_URL;
}

export function supabaseProjectRef(): string {
  try {
    return new URL(supabaseProjectUrl()).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

export function supabaseHasKey(): boolean {
  return envKey().length > 20;
}

export function supabaseConfigured(): boolean {
  return supabaseProjectUrl().startsWith("https://") && supabaseHasKey();
}

export async function hydrateSupabase(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  if (supabaseHasKey()) return;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{ key: string; value: unknown }>(
      `select key, value from app_settings where key in ('supabase_url', 'supabase_service_role')`,
    );
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const url = parseSetting(map.get("supabase_url"));
    const key = parseSetting(map.get("supabase_service_role"));
    configureSupabase({ url: url || DEFAULT_URL, serviceKey: key });
  } catch (err) {
    console.error("[storage] hydrate", err);
  }
}

function parseSetting(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
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

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  client ??= createClient(envUrl(), envKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function supabasePublicUrl(key: string): string {
  return `${supabaseProjectUrl()}/storage/v1/object/public/${PUBLIC_BUCKET}/${key}`;
}

export { PUBLIC_BUCKET, ORIGINAL_BUCKET };

export async function pingSupabase(): Promise<{
  ok: boolean;
  buckets: string[];
  error?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { ok: false, buckets: [], error: "missing key" };
  const { data, error } = await sb.storage.listBuckets();
  if (error) return { ok: false, buckets: [], error: error.message };
  return { ok: true, buckets: (data ?? []).map((b) => b.name) };
}

export async function ensureSupabaseBuckets(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  bucketsReady ??= (async () => {
    await sb.storage.createBucket(PUBLIC_BUCKET, {
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    }).then(
      () => undefined,
      () => undefined,
    );
    await sb.storage.createBucket(ORIGINAL_BUCKET, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    }).then(
      () => undefined,
      () => undefined,
    );
  })();
  try {
    await bucketsReady;
    return true;
  } catch (err) {
    bucketsReady = null;
    console.error("[storage] supabase buckets", err);
    return false;
  }
}
