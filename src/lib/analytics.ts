import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

export type ClientAnalyticsEvent =
  | "page_view"
  | "campaign_visit"
  | "wallpaper_view"
  | "category_view"
  | "search"
  | "search_zero_results"
  | "download"
  | "favorite_add"
  | "favorite_remove"
  | "share"
  | "shop_click"
  | "open_app";

type EventData = {
  wallpaperId?: string;
  categorySlug?: string;
  searchQuery?: string;
  source?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type Attribution = {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

type Gtag = (...args: unknown[]) => void;

type VercelAnalytics = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    va?: VercelAnalytics;
  }
}

const VISITOR_KEY = "mrwallpapers.analytics.visitor.v1";
const SESSION_KEY = "mrwallpapers.analytics.session.v1";
const SOURCE_KEY = "mrwallpapers.analytics.source.v1";
const ATTRIBUTION_KEY = "mrwallpapers.analytics.attribution.v1";

const FIRST_PARTY_DB_EVENTS = new Set<ClientAnalyticsEvent>([
  "campaign_visit",
  "download",
  "favorite_add",
  "favorite_remove",
  "share",
  "search_zero_results",
]);

function randomId(prefix: string): string {
  try {
    return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
  } catch {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
}

function storageId(storage: Storage, key: string, prefix: string): string {
  try {
    const current = storage.getItem(key);
    if (current && /^[a-zA-Z0-9_-]{8,64}$/.test(current)) return current;
    const next = randomId(prefix).slice(0, 64);
    storage.setItem(key, next);
    return next;
  } catch {
    return randomId(prefix).slice(0, 64);
  }
}

function referrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    if (!host || host === window.location.hostname) return undefined;
    return host;
  } catch {
    return undefined;
  }
}

function sessionAttribution(): Attribution {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source")?.trim();
    if (utmSource) {
      const next: Attribution = {
        source: utmSource.slice(0, 80),
        medium: params.get("utm_medium")?.trim().slice(0, 80) || undefined,
        campaign: params.get("utm_campaign")?.trim().slice(0, 120) || undefined,
        content: params.get("utm_content")?.trim().slice(0, 120) || undefined,
      };
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
      sessionStorage.setItem(SOURCE_KEY, next.source);
      return next;
    }

    const existing = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as Partial<Attribution>;
      if (parsed.source) {
        return {
          source: String(parsed.source).slice(0, 80),
          medium: parsed.medium ? String(parsed.medium).slice(0, 80) : undefined,
          campaign: parsed.campaign ? String(parsed.campaign).slice(0, 120) : undefined,
          content: parsed.content ? String(parsed.content).slice(0, 120) : undefined,
        };
      }
    }

    const legacySource = sessionStorage.getItem(SOURCE_KEY)?.trim();
    const next: Attribution = {
      source: (legacySource || referrerHost() || "direct").slice(0, 80),
    };
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
    sessionStorage.setItem(SOURCE_KEY, next.source);
    return next;
  } catch {
    return { source: "direct" };
  }
}

function deviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  if (width <= 767) return "mobile";
  if (width <= 1180) return "tablet";
  return "desktop";
}

function trackingAllowed(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return navigator.doNotTrack !== "1";
}

export function trackEvent(eventName: ClientAnalyticsEvent, data: EventData = {}): void {
  if (!trackingAllowed()) return;

  const attribution = sessionAttribution();
  const metadata = {
    ...(attribution.medium ? { utm_medium: attribution.medium } : {}),
    ...(attribution.campaign ? { utm_campaign: attribution.campaign } : {}),
    ...(attribution.content ? { utm_content: attribution.content } : {}),
    ...data.metadata,
  };

  const payload = {
    eventName,
    visitorId: storageId(localStorage, VISITOR_KEY, "v"),
    sessionId: storageId(sessionStorage, SESSION_KEY, "s"),
    path: window.location.pathname,
    referrerHost: referrerHost(),
    source: data.source || attribution.source,
    wallpaperId: data.wallpaperId,
    categorySlug: data.categorySlug,
    searchQuery: data.searchQuery,
    deviceType: deviceType(),
    viewportWidth: window.innerWidth || undefined,
    metadata,
  };

  // GA4 handles high-volume navigation. Postgres stores only sparse, high-signal
  // actions so routine browsing does not keep Neon awake.
  if (FIRST_PARTY_DB_EVENTS.has(eventName)) {
    try {
      const body = JSON.stringify(payload);
      if (typeof navigator.sendBeacon === "function") {
        const sent = navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
        if (!sent) {
          void fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => undefined);
        }
      } else {
        void fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch {
      // Product actions should never fail because analytics failed.
    }
  }

  try {
    window.gtag?.("event", eventName, {
      page_path: `${window.location.pathname}${window.location.search}`,
      page_location: window.location.href,
      page_title: document.title,
      content_id: data.wallpaperId,
      content_group: data.categorySlug,
      search_term: data.searchQuery,
      source: data.source || attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      ...data.metadata,
    });
  } catch {
    // GA is optional.
  }

  if (eventName !== "page_view") {
    try {
      const vercelData: Record<string, string | number | boolean> = {};
      if (data.wallpaperId) vercelData.wallpaperId = data.wallpaperId;
      if (data.categorySlug) vercelData.category = data.categorySlug;
      if (data.searchQuery) vercelData.search = data.searchQuery.slice(0, 100);
      vercelData.source = data.source || attribution.source;
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          vercelData[key] = typeof value === "string" ? value.slice(0, 100) : value;
        }
      }
      window.va?.("event", { name: eventName, data: vercelData });
    } catch {
      // Vercel Analytics is optional.
    }
  }
}

export function AnalyticsRouteTracker() {
  const location = useRouterState({ select: (state) => state.location });
  const previous = useRef<string | null>(null);
  const previousSearch = useRef<string | null>(null);

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.startsWith("/ops") || pathname.startsWith("/api/")) return;
    const key = `${pathname}${location.searchStr || ""}`;
    if (previous.current === key) return;
    previous.current = key;

    trackEvent("page_view");

    const params = new URLSearchParams(location.searchStr || "");
    const campaignSource = params.get("utm_source")?.trim();
    if (campaignSource) {
      const campaign = params.get("utm_campaign")?.trim();
      const medium = params.get("utm_medium")?.trim();
      const content = params.get("utm_content")?.trim();
      trackEvent("campaign_visit", {
        source: campaignSource,
        metadata: {
          ...(medium ? { utm_medium: medium } : {}),
          ...(campaign ? { utm_campaign: campaign } : {}),
          ...(content ? { utm_content: content } : {}),
        },
      });
    }

    const category = /^\/wallpapers\/([^/?#]+)\/?$/.exec(pathname)?.[1];
    if (category) trackEvent("category_view", { categorySlug: decodeURIComponent(category) });

    const query = params.get("q")?.trim();
    if (query && (pathname === "/wallpapers" || pathname === "/app/explore")) {
      const searchKey = `${pathname}:${query.toLowerCase()}`;
      if (previousSearch.current !== searchKey) {
        previousSearch.current = searchKey;
        trackEvent("search", {
          searchQuery: query,
          categorySlug: params.get("category") || undefined,
        });
      }
    }

    if (pathname === "/app" || pathname === "/app/") trackEvent("open_app");
  }, [location.pathname, location.searchStr]);

  return null;
}
