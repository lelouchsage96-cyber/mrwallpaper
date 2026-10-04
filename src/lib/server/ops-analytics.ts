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
    downloads: number;
    favorites: number;
    favoriteRemoves: number;
    netFavorites: number;
    shares: number;
    searches: number;
    searchMisses: number;
    searchMissRate: number;
    campaignClicks: number;
    campaignVisitors: number;
  };
  daily: Array<{ day: string; downloads: number; campaignClicks: number }>;
  topWallpapers: Array<{ id: string; slug: string; title: string; downloads: number; favorites: number; shares: number }>;
  topSearches: Array<{ query: string; searches: number }>;
  missedSearches: Array<{ query: string; searches: number }>;
  topCategories: Array<{ category: string; actions: number; downloads: number; favorites: number; shares: number }>;
  sources: Array<{ source: string; visits: number }>;
  devices: Array<{ device: string; visits: number }>;
  campaigns: Array<{
    source: string;
    campaign: string;
    medium: string;
    clicks: number;
    visitors: number;
    downloads: number;
  }>;
};

export const getOpsAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional() }).optional())
  .handler(async ({ context, data }): Promise<AnalyticsOverview> => {
    const sql = await requireAdmin(context.userId);
    const days = data?.days ?? 30;
    const params = [days];
    const windowSql = `occurred_at >= now() - ($1::int * interval '1 day')`;

    const [metricRows, dailyRows, wallpaperRows, searchRows, missedSearchRows, categoryRows, sourceRows, deviceRows, campaignRows] = await Promise.all([
      sql.query<{
        downloads: number;
        favorites: number;
        favorite_removes: number;
        shares: number;
        searches: number;
        search_misses: number;
        campaign_clicks: number;
        campaign_visitors: number;
      }>(
        `select
           count(*) filter (where event_name = 'download')::int as downloads,
           count(*) filter (where event_name = 'favorite_add')::int as favorites,
           count(*) filter (where event_name = 'favorite_remove')::int as favorite_removes,
           count(*) filter (where event_name = 'share')::int as shares,
           count(*) filter (where event_name = 'search')::int as searches,
           count(*) filter (where event_name = 'search_zero_results')::int as search_misses,
           count(*) filter (where event_name = 'campaign_visit')::int as campaign_clicks,
           count(distinct visitor_id) filter (
             where event_name = 'campaign_visit' and visitor_id is not null
           )::int as campaign_visitors
         from analytics_events where ${windowSql}`,
        params,
      ),
      sql.query<{ day: string; downloads: number; campaign_clicks: number }>(
        `select to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') as day,
                count(*) filter (where event_name = 'download')::int as downloads,
                count(*) filter (where event_name = 'campaign_visit')::int as campaign_clicks
         from analytics_events
         where ${windowSql}
         group by 1 order by 1 asc`,
        params,
      ),
      sql.query<{ id: string; slug: string | null; title: string; downloads: number; favorites: number; shares: number }>(
        `select w.id, w.slug, w.title,
                count(*) filter (where e.event_name = 'download')::int as downloads,
                count(*) filter (where e.event_name = 'favorite_add')::int as favorites,
                count(*) filter (where e.event_name = 'share')::int as shares
         from analytics_events e
         join wallpapers w on w.id = e.wallpaper_id or w.slug = e.wallpaper_id
         where e.occurred_at >= now() - ($1::int * interval '1 day')
           and e.event_name in ('download','favorite_add','share')
         group by w.id, w.slug, w.title
         order by downloads desc, favorites desc, shares desc
         limit 10`,
        params,
      ),
      sql.query<{ query: string; searches: number }>(
        `select search_query as query, count(*)::int as searches
         from analytics_events
         where ${windowSql} and event_name = 'search' and search_query is not null
         group by search_query order by searches desc limit 10`,
        params,
      ),
      sql.query<{ query: string; searches: number }>(
        `select search_query as query, count(*)::int as searches
         from analytics_events
         where ${windowSql} and event_name = 'search_zero_results' and search_query is not null
         group by search_query order by searches desc limit 10`,
        params,
      ),
      sql.query<{ category: string; actions: number; downloads: number; favorites: number; shares: number }>(
        `select coalesce(nullif(category_slug, ''), 'uncategorized') as category,
                count(*)::int as actions,
                count(*) filter (where event_name = 'download')::int as downloads,
                count(*) filter (where event_name = 'favorite_add')::int as favorites,
                count(*) filter (where event_name = 'share')::int as shares
         from analytics_events
         where ${windowSql}
           and event_name in ('download','favorite_add','share')
           and category_slug is not null
         group by 1
         order by actions desc
         limit 10`,
        params,
      ),
      sql.query<{ source: string; visits: number }>(
        `select coalesce(nullif(source, ''), 'unknown') as source, count(*)::int as visits
         from analytics_events
         where ${windowSql} and event_name = 'campaign_visit'
         group by 1 order by visits desc limit 10`,
        params,
      ),
      sql.query<{ device: string; visits: number }>(
        `select coalesce(nullif(device_type, ''), 'unknown') as device, count(*)::int as visits
         from analytics_events
         where ${windowSql} and event_name = 'campaign_visit'
         group by 1 order by visits desc`,
        params,
      ),
      sql.query<{ source: string; campaign: string; medium: string; clicks: number; visitors: number; downloads: number }>(
        `select
           coalesce(nullif(source, ''), 'unknown') as source,
           coalesce(nullif(metadata->>'utm_campaign', ''), 'unassigned') as campaign,
           coalesce(nullif(metadata->>'utm_medium', ''), 'unknown') as medium,
           count(*) filter (where event_name = 'campaign_visit')::int as clicks,
           count(distinct visitor_id) filter (
             where event_name = 'campaign_visit' and visitor_id is not null
           )::int as visitors,
           count(*) filter (where event_name = 'download')::int as downloads
         from analytics_events
         where ${windowSql}
           and event_name in ('campaign_visit', 'download')
           and nullif(metadata->>'utm_campaign', '') is not null
         group by 1, 2, 3
         having count(*) filter (where event_name = 'campaign_visit') > 0
         order by clicks desc
         limit 20`,
        params,
      ),
    ]);

    const m = metricRows[0];
    return {
      days,
      metrics: {
        downloads: Number(m?.downloads) || 0,
        favorites: Number(m?.favorites) || 0,
        favoriteRemoves: Number(m?.favorite_removes) || 0,
        netFavorites: Math.max(0, (Number(m?.favorites) || 0) - (Number(m?.favorite_removes) || 0)),
        shares: Number(m?.shares) || 0,
        searches: Number(m?.searches) || 0,
        searchMisses: Number(m?.search_misses) || 0,
        searchMissRate: Number(m?.searches) > 0 ? ((Number(m?.search_misses) || 0) / Number(m?.searches)) * 100 : 0,
        campaignClicks: Number(m?.campaign_clicks) || 0,
        campaignVisitors: Number(m?.campaign_visitors) || 0,
      },
      daily: dailyRows.map((r) => ({
        day: r.day,
        downloads: Number(r.downloads) || 0,
        campaignClicks: Number(r.campaign_clicks) || 0,
      })),
      topWallpapers: wallpaperRows.map((r) => ({
        id: r.id,
        slug: r.slug || r.id,
        title: r.title,
        downloads: Number(r.downloads) || 0,
        favorites: Number(r.favorites) || 0,
        shares: Number(r.shares) || 0,
      })),
      topSearches: searchRows.map((r) => ({ query: r.query, searches: Number(r.searches) || 0 })),
      missedSearches: missedSearchRows.map((r) => ({ query: r.query, searches: Number(r.searches) || 0 })),
      topCategories: categoryRows.map((r) => ({
        category: r.category,
        actions: Number(r.actions) || 0,
        downloads: Number(r.downloads) || 0,
        favorites: Number(r.favorites) || 0,
        shares: Number(r.shares) || 0,
      })),
      sources: sourceRows.map((r) => ({ source: r.source, visits: Number(r.visits) || 0 })),
      devices: deviceRows.map((r) => ({ device: r.device, visits: Number(r.visits) || 0 })),
      campaigns: campaignRows.map((r) => ({
        source: r.source,
        campaign: r.campaign,
        medium: r.medium,
        clicks: Number(r.clicks) || 0,
        visitors: Number(r.visitors) || 0,
        downloads: Number(r.downloads) || 0,
      })),
    };
  });
