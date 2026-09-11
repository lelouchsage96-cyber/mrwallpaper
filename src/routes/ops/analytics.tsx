import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppWindow,
  Download,
  Eye,
  Heart,
  Search,
  Share2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { getOpsAnalytics, type AnalyticsOverview } from "@/lib/server/ops-analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ops/analytics")({ component: OpsAnalyticsPage });

type Days = 7 | 30 | 90;

function n(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function MetricCard({ label, value, hint, icon }: { label: string; value: number | string; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-elevated p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-3 text-muted">
        <p className="text-xs font-medium tracking-wide uppercase">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-surface text-fg">{icon}</span>
      </div>
      <p className="mt-4 font-display text-3xl text-fg">{typeof value === "number" ? n(value) : value}</p>
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

function OpsAnalyticsPage() {
  const [days, setDays] = useState<Days>(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void getOpsAnalytics({ data: { days } })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, reloadKey]);

  const conversion = data?.metrics.wallpaperViews
    ? (data.metrics.downloads / data.metrics.wallpaperViews) * 100
    : 0;

  const dailySeries = useMemo(() => {
    const values = new Map((data?.daily ?? []).map((row) => [row.day, row.pageViews]));
    const today = new Date();
    const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    return Array.from({ length: days }, (_, index) => {
      const timestamp = end - (days - 1 - index) * 86_400_000;
      const day = new Date(timestamp).toISOString().slice(0, 10);
      return { day, pageViews: values.get(day) ?? 0 };
    });
  }, [data?.daily, days]);

  const maxDaily = useMemo(
    () => Math.max(1, ...dailySeries.map((row) => row.pageViews)),
    [dailySeries],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">First-party analytics</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Performance</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            See what brings people in, what they browse, and which wallpapers turn attention into downloads.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-elevated p-1">
          {([7, 30, 90] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={cn(
                "h-9 rounded-full px-4 text-sm transition-colors",
                days === value ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {value}d
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-elevated" />)}
        </div>
      ) : data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Page views" value={data.metrics.pageViews} hint={`${n(data.metrics.sessions)} sessions`} icon={<Eye className="size-4" />} />
            <MetricCard label="Visitors" value={data.metrics.visitors} hint="Anonymous unique visitors" icon={<Users className="size-4" />} />
            <MetricCard label="Wallpaper views" value={data.metrics.wallpaperViews} hint={`${conversion.toFixed(1)}% view-to-download rate`} icon={<AppWindow className="size-4" />} />
            <MetricCard label="Downloads" value={data.metrics.downloads} hint="Successful download requests" icon={<Download className="size-4" />} />
            <MetricCard label="Favorites" value={data.metrics.favorites} hint="Added to favorites" icon={<Heart className="size-4" />} />
            <MetricCard label="Shares" value={data.metrics.shares} hint="Share sheet or copied link" icon={<Share2 className="size-4" />} />
            <MetricCard label="Searches" value={data.metrics.searches} hint="Searches with a query" icon={<Search className="size-4" />} />
            <MetricCard label="App opens" value={data.metrics.appOpens} hint="Visits to the installable app surface" icon={<AppWindow className="size-4" />} />
          </section>

          <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-widest text-subtle uppercase">Traffic trend</p>
                <h2 className="mt-1 font-display text-2xl text-fg">Daily page views</h2>
              </div>
              <p className="text-xs text-muted">Last {days} days</p>
            </div>
            {data.daily.length ? (
              <div className="mt-6 flex h-36 items-end gap-1" aria-label="Daily page views chart">
                {dailySeries.map((row) => (
                  <div
                    key={row.day}
                    className="group relative flex h-full min-w-0 flex-1 items-end"
                    title={`${row.day}: ${row.pageViews} page views`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-colors",
                        row.pageViews > 0 ? "bg-fg/70 group-hover:bg-fg" : "bg-border/70",
                      )}
                      style={{
                        height: row.pageViews > 0
                          ? `${Math.max(4, (row.pageViews / maxDaily) * 100)}%`
                          : "2px",
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Analytics will appear here as visitors use the site.</p>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium tracking-widest text-subtle uppercase">Content</p>
              <h2 className="mt-1 font-display text-2xl text-fg">Top wallpapers</h2>
              {data.topWallpapers.length ? (
                <div className="mt-4 divide-y divide-border">
                  {data.topWallpapers.map((item, index) => (
                    <Link
                      key={item.id}
                      to="/wallpaper/$id"
                      params={{ id: item.slug }}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="w-6 text-xs text-subtle">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">{item.title}</span>
                      <span className="shrink-0 text-xs text-muted">{n(item.views)} views · {n(item.downloads)} ↓</span>
                    </Link>
                  ))}
                </div>
              ) : <p className="mt-4 text-sm text-muted">No wallpaper events yet.</p>}
            </section>

            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium tracking-widest text-subtle uppercase">Discovery</p>
              <h2 className="mt-1 font-display text-2xl text-fg">Top categories</h2>
              <div className="mt-4 space-y-3">
                {data.topCategories.length ? data.topCategories.map((item) => (
                  <a key={item.slug} href={`/wallpapers/${item.slug}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="capitalize text-fg">{item.slug.replaceAll("-", " ")}</span>
                    <span className="text-muted">{n(item.views)} visits</span>
                  </a>
                )) : <p className="text-sm text-muted">No category events yet.</p>}
              </div>
            </section>

            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium tracking-widest text-subtle uppercase">Intent</p>
              <h2 className="mt-1 font-display text-2xl text-fg">Top searches</h2>
              <div className="mt-4 space-y-3">
                {data.topSearches.length ? data.topSearches.map((item) => (
                  <div key={item.query} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-fg">{item.query}</span>
                    <span className="shrink-0 text-muted">{n(item.searches)}</span>
                  </div>
                )) : <p className="text-sm text-muted">No searches yet.</p>}
              </div>
            </section>

            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium tracking-widest text-subtle uppercase">Acquisition</p>
              <h2 className="mt-1 font-display text-2xl text-fg">Traffic sources</h2>
              <div className="mt-4 space-y-3">
                {data.sources.length ? data.sources.map((item) => (
                  <div key={item.source} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-fg">{item.source}</span>
                    <span className="shrink-0 text-muted">{n(item.visits)} views</span>
                  </div>
                )) : <p className="text-sm text-muted">No source data yet.</p>}
              </div>
              {data.devices.length ? (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs font-medium tracking-widest text-subtle uppercase">Devices</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.devices.map((item) => (
                      <span key={item.device} className="rounded-full bg-surface px-3 py-2 text-xs text-muted">
                        {item.device} · {n(item.visits)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <p className="text-xs leading-relaxed text-subtle">
            First-party analytics begins collecting after this deployment. Raw IP addresses are not stored, and browsers with Do Not Track enabled are excluded.
          </p>
        </>
      ) : null}
    </div>
  );
}
