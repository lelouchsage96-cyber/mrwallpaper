import { createFileRoute } from "@tanstack/react-router";
import {
  ANALYTICS_EVENTS,
  recordAnalyticsEvent,
  type AnalyticsEventName,
} from "@/lib/server/analytics";

const ALLOWED = new Set<string>(ANALYTICS_EVENTS);
const BOT = /bot|crawler|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pagespeed/i;

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ua = request.headers.get("user-agent") ?? "";
          if (BOT.test(ua)) return new Response(null, { status: 204 });

          const contentLength = Number(request.headers.get("content-length") ?? 0);
          if (contentLength > 16_384) return new Response(null, { status: 413 });

          const raw = (await request.json()) as Record<string, unknown>;
          const eventName = typeof raw.eventName === "string" ? raw.eventName : "";
          if (!ALLOWED.has(eventName)) return new Response(null, { status: 400 });

          const str = (key: string) => (typeof raw[key] === "string" ? String(raw[key]) : undefined);
          const metadata = raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
            ? (raw.metadata as Record<string, string | number | boolean | null>)
            : undefined;

          await recordAnalyticsEvent({
            eventName: eventName as AnalyticsEventName,
            visitorId: str("visitorId"),
            sessionId: str("sessionId"),
            path: str("path"),
            referrerHost: str("referrerHost"),
            source: str("source"),
            wallpaperId: str("wallpaperId"),
            categorySlug: str("categorySlug"),
            searchQuery: str("searchQuery"),
            deviceType: str("deviceType"),
            viewportWidth: typeof raw.viewportWidth === "number" ? raw.viewportWidth : undefined,
            metadata,
          });
          return new Response(null, {
            status: 204,
            headers: { "Cache-Control": "no-store" },
          });
        } catch {
          // Analytics must never block the product experience.
          return new Response(null, { status: 204 });
        }
      },
    },
  },
});
