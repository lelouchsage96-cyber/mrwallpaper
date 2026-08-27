/**
 * Supabase Storage is paused. This module is a no-op so the app never
 * initializes a client, never reads env keys, and never calls Storage.
 * Live implementation: `./supabase.active.ts` — re-export it to reconnect.
 */
export const SUPABASE_ACTIVE = false;

export const PUBLIC_BUCKET = "wallpaper-previews";
export const ORIGINAL_BUCKET = "wallpaper-originals";

export function configureSupabase(_opts: { url?: string; serviceKey?: string }) {
  /* paused */
}

export function supabaseProjectUrl(): string {
  return "";
}

export function supabaseProjectRef(): string {
  return "";
}

export function supabaseHasKey(): boolean {
  return false;
}

export function supabaseConfigured(): boolean {
  return false;
}

export async function hydrateSupabase(): Promise<void> {
  /* paused */
}

export function getSupabase(): null {
  return null;
}

export function supabasePublicUrl(_key: string): string {
  return "";
}

export async function pingSupabase(): Promise<{
  ok: boolean;
  buckets: string[];
  error?: string;
}> {
  return { ok: false, buckets: [], error: "paused" };
}

export async function ensureSupabaseBuckets(): Promise<boolean> {
  return false;
}
