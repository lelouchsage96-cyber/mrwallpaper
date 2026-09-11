import { getSql } from "@/lib/db";

export const ANALYTICS_EVENTS = [
  "page_view",
  "wallpaper_view",
  "category_view",
  "search",
  "download",
  "favorite_add",
  "favorite_remove",
  "share",
  "open_app",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const EVENT_SET = new Set<string>(ANALYTICS_EVENTS);

export type AnalyticsEventInput = {
  eventName: AnalyticsEventName;
  visitorId?: string | null;
  sessionId?: string | null;
  path?: string | null;
  referrerHost?: string | null;
  source?: string | null;
  wallpaperId?: string | null;
  categorySlug?: string | null;
  searchQuery?: string | null;
  deviceType?: string | null;
  viewportWidth?: number | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

function clean(value: string | null | undefined, max: number): string | null {
  const v = value?.replace(/\s+/g, " ").trim();
  if (!v) return null;
  return v.slice(0, max);
}

function cleanId(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v || v.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(v)) return null;
  return v;
}

function cleanMetadata(input: AnalyticsEventInput["metadata"]): Record<string, string | number | boolean | null> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input).slice(0, 12)) {
    if (!/^[a-zA-Z0-9_]{1,40}$/.test(key)) continue;
    if (typeof value === "string") out[key] = value.slice(0, 120);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean" || value === null) out[key] = value;
  }
  return out;
}

export async function recordAnalyticsEvent(input: AnalyticsEventInput): Promise<void> {
  if (!EVENT_SET.has(input.eventName)) return;
  const sql = await getSql();
  await sql.query(
    `insert into analytics_events
       (id, event_name, visitor_id, session_id, path, referrer_host, source,
        wallpaper_id, category_slug, search_query, device_type, viewport_width, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
    [
      crypto.randomUUID(),
      input.eventName,
      cleanId(input.visitorId),
      cleanId(input.sessionId),
      clean(input.path, 512),
      clean(input.referrerHost, 255),
      clean(input.source, 80),
      clean(input.wallpaperId, 80),
      clean(input.categorySlug, 100),
      clean(input.searchQuery, 120),
      clean(input.deviceType, 24),
      Number.isFinite(input.viewportWidth) ? Math.max(0, Math.min(10000, Math.round(input.viewportWidth ?? 0))) : null,
      JSON.stringify(cleanMetadata(input.metadata)),
    ],
  );
}
