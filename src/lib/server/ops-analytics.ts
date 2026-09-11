import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query<{ role: string; status: string }>(
    `select role, status from profiles where user_id = $1 limit 1`,
    [userId],
  );
  const row = rows[0];
  if (!row || row.status !== "active" || row.role !== "admin") throw new ForbiddenError();
  return sql;
}

export type AnalyticsOverview = {
  days: number;
  metrics: {
    pageViews: number;
    visitors: number;
    sessions: number;
    wallpaperViews: number;
    downloads: number;
    favorites: number;
    shares: number;
    searches: number;
    appOpens: number;
  };
  daily: Array<{ day: string; pageViews: number; wallpaperViews: number; downloads: number }>;
  topWallpapers: Array<{ id: string; slug: string; title: string; views: number; downloads: number; shares: number }>;
  topCategories: Array<{ slug: string; views: number }>;
  topSearches: Array<{ query: string; searches: number }>;
  sources: Array<{ source: string; visits: number }>;
  devices: Array<{ device: string; visits: number }>;
};

export const getOpsAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional() }).optional())
  .handler(async ({ context, data }): Promise<AnalyticsOverview> => {
    const sql = await requireAdmin(context.userId);
    const days = data?.days ?? 30;
    const params = [days];
    const windowSql = `occurred_at >= now() - ($1::int * interval '1 day')`;

    const [metricRows, dailyRows, wallpaperRows, categoryRows, searchRows, sourceRows, deviceRows] = await Promise.all([
      sql.query<{
        page_views: number;
        visitors: number;
        sessions: number;
        wallpaper_views: number;
        downloads: number;
        favorites: number;
        shares: number;
        searches: number;
        app_opens: number;
      }>(
        `select
           count(*) filter (where event_name = 'page_view')::int as page_views,
           count(distinct visitor_id) filter (where event_name = 'page_view' and visitor_id is not null)::int as visitors,
           count(distinct session_id) filter (where event_name = 'page_view' and session_id is not null)::int as sessions,
           count(*) filter (where event_name = 'wallpaper_view')::int as wallpaper_views,
           count(*) filter (where event_name = 'download')::int as downloads,
           count(*) filter (where event_name = 'favorite_add')::int as favorites,
           count(*) filter (where event_name = 'share')::int as shares,
           count(*) filter (where event_name = 'search')::int as searches,
           count(*) filter (where event_name = 'open_app')::int as app_opens
         from analytics_events where ${windowSql}`,
        params,
      ),
      sql.query<{ day: string; page_views: number; wallpaper_views: number; downloads: number }>(
        `select to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') as day,
                count(*) filter (where event_name = 'page_view')::int as page_views,
                count(*) filter (where event_name = 'wallpaper_view')::int as wallpaper_views,
                count(*) filter (where event_name = 'download')::int as downloads
         from analytics_events
         where ${windowSql}
         group by 1 order by 1 asc`,
        params,
      ),
      sql.query<{ id: string; slug: string | null; title: string; views: number; downloads: number; shares: number }>(
        `select w.id, w.slug, w.title,
                count(*) filter (where e.event_name = 'wallpaper_view')::int as views,
                count(*) filter (where e.event_name = 'download')::int as downloads,
                count(*) filter (where e.event_name = 'share')::int as shares
         from analytics_events e
         join wallpapers w on w.id = e.wallpaper_id
         where e.${windowSql} and e.event_name in ('wallpaper_view','download','share')
         group by w.id, w.slug, w.title
         order by views desc, downloads desc, shares desc
         limit 10`,
        params,
      ),
      sql.query<{ slug: string; views: number }>(
        `select category_slug as slug, count(*)::int as views
         from analytics_events
         where ${windowSql} and event_name = 'category_view' and category_slug is not null
         group by category_slug order by views desc limit 10`,
        params,
      ),
      sql.query<{ query: string; searches: number }>(
        `select search_query as query, count(*)::int as searches
         from analytics_events
         where ${windowSql} and event_name = 'search' and search_query is not null
         group by search_query order by searches desc limit 10`,
        params,
      ),
      sql.query<{ source: string; visits: number }>(
        `select coalesce(nullif(source, ''), 'direct') as source, count(*)::int as visits
         from analytics_events
         where ${windowSql} and event_name = 'page_view'
         group by 1 order by visits desc limit 10`,
        params,
      ),
      sql.query<{ device: string; visits: number }>(
        `select coalesce(nullif(device_type, ''), 'unknown') as device, count(*)::int as visits
         from analytics_events
         where ${windowSql} and event_name = 'page_view'
         group by 1 order by visits desc`,
        params,
      ),
    ]);

    const m = metricRows[0];
    return {
      days,
      metrics: {
        pageViews: Number(m?.page_views) || 0,
        visitors: Number(m?.visitors) || 0,
        sessions: Number(m?.sessions) || 0,
        wallpaperViews: Number(m?.wallpaper_views) || 0,
        downloads: Number(m?.downloads) || 0,
        favorites: Number(m?.favorites) || 0,
        shares: Number(m?.shares) || 0,
        searches: Number(m?.searches) || 0,
        appOpens: Number(m?.app_opens) || 0,
      },
      daily: dailyRows.map((r) => ({
        day: r.day,
        pageViews: Number(r.page_views) || 0,
        wallpaperViews: Number(r.wallpaper_views) || 0,
        downloads: Number(r.downloads) || 0,
      })),
      topWallpapers: wallpaperRows.map((r) => ({
        id: r.id,
        slug: r.slug || r.id,
        title: r.title,
        views: Number(r.views) || 0,
        downloads: Number(r.downloads) || 0,
        shares: Number(r.shares) || 0,
      })),
      topCategories: categoryRows.map((r) => ({ slug: r.slug, views: Number(r.views) || 0 })),
      topSearches: searchRows.map((r) => ({ query: r.query, searches: Number(r.searches) || 0 })),
      sources: sourceRows.map((r) => ({ source: r.source, visits: Number(r.visits) || 0 })),
      devices: deviceRows.map((r) => ({ device: r.device, visits: Number(r.visits) || 0 })),
    };
  });
