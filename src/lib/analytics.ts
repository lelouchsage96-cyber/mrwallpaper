import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

export type ClientAnalyticsEvent =
  | "page_view"
  | "wallpaper_view"
  | "category_view"
  | "search"
  | "search_zero_results"
  | "download"
  | "favorite_add"
  | "favorite_remove"
  | "share"
  | "open_app";

type EventData = {
  wallpaperId?: string;
  categorySlug?: string;
  searchQuery?: string;
  source?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

const VISITOR_KEY = "mrwallpapers.analytics.visitor.v1";
const SESSION_KEY = "mrwallpapers.analytics.session.v1";
const SOURCE_KEY = "mrwallpapers.analytics.source.v1";

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

function sessionSource(): string {
  try {
    const existing = sessionStorage.getItem(SOURCE_KEY);
    if (existing) return existing.slice(0, 80);
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source")?.trim();
    const source = (utm || referrerHost() || "direct").slice(0, 80);
    sessionStorage.setItem(SOURCE_KEY, source);
    return source;
  } catch {
    return "direct";
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

  const payload = {
    eventName,
    visitorId: storageId(localStorage, VISITOR_KEY, "v"),
    sessionId: storageId(sessionStorage, SESSION_KEY, "s"),
    path: window.location.pathname,
    referrerHost: referrerHost(),
    source: data.source || sessionSource(),
    wallpaperId: data.wallpaperId,
    categorySlug: data.categorySlug,
    searchQuery: data.searchQuery,
    deviceType: deviceType(),
    viewportWidth: window.innerWidth || undefined,
    metadata: data.metadata,
  };

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

  try {
    window.gtag?.("event", eventName, {
      page_path: window.location.pathname,
      content_id: data.wallpaperId,
      content_group: data.categorySlug,
      search_term: data.searchQuery,
      source: data.source || sessionSource(),
      ...data.metadata,
    });
  } catch {
    // GA is optional; first-party analytics remains the source of truth.
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

    const category = /^\/wallpapers\/([^/?#]+)\/?$/.exec(pathname)?.[1];
    if (category) trackEvent("category_view", { categorySlug: decodeURIComponent(category) });

    const params = new URLSearchParams(location.searchStr || "");
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
