import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  ExternalLink,
  Heart,
  MonitorSmartphone,
  MousePointerClick,
  SearchX,
  Share2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { getOpsAnalytics, type AnalyticsOverview } from "@/lib/server/ops-analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ops/analytics")({ component: OpsAnalyticsPage });

type Days = 7 | 30 | 90;
type ChartMetric = "campaignClicks" | "downloads";

function n(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
}) {
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
  const [chartMetric, setChartMetric] = useState<ChartMetric>("campaignClicks");
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

  const dailySeries = useMemo(() => {
    const values = new Map((data?.daily ?? []).map((row) => [row.day, row[chartMetric]]));
    const today = new Date();
    const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    return Array.from({ length: days }, (_, index) => {
      const timestamp = end - (days - 1 - index) * 86_400_000;
      const day = new Date(timestamp).toISOString().slice(0, 10);
      return { day, value: values.get(day) ?? 0 };
    });
  }, [data?.daily, days, chartMetric]);

  const maxDaily = useMemo(
    () => Math.max(1, ...dailySeries.map((row) => row.value)),
    [dailySeries],
  );

  return (
    <div className="space-y-8 mw-enter">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">Analytics</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Performance</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Track campaign clicks and the actions that matter most: downloads, favorites, shares, and failed searches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface"
          >
            Google Analytics
            <ExternalLink className="size-4" />
          </a>
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
      </div>

      <section className="rounded-xl border border-border bg-surface/40 px-4 py-3 text-sm text-muted">
        Full traffic, page views, engagement time, and acquisition reports stay in GA4. This admin view stores only
        high-signal actions so normal browsing does not create unnecessary database usage.
      </section>

      {error ? (
        <ErrorState onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-elevated" />)}
        </div>
      ) : data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Tracked link clicks"
              value={data.metrics.campaignClicks}
              hint={`${n(data.metrics.campaignVisitors)} unique people`}
              icon={<MousePointerClick className="size-4" />}
            />
            <MetricCard
              label="Downloads"
              value={data.metrics.downloads}
              hint="Successful download actions"
              icon={<Download className="size-4" />}
            />
            <MetricCard
              label="Favorites"
              value={data.metrics.favorites}
              hint="Added to favorites"
              icon={<Heart className="size-4" />}
            />
            <MetricCard
              label="Shares"
              value={data.metrics.shares}
              hint="Shared or copied links"
              icon={<Share2 className="size-4" />}
            />
            <MetricCard
              label="Search misses"
              value={data.metrics.searchMisses}
              hint="Searches that returned no results"
              icon={<SearchX className="size-4" />}
            />
            <MetricCard
              label="Campaign visitors"
              value={data.metrics.campaignVisitors}
              hint="Anonymous unique tracked visitors"
              icon={<Users className="size-4" />}
            />
          </section>

          <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-widest text-subtle uppercase">Activity trend</p>
                <h2 className="mt-1 font-display text-2xl text-fg">
                  {chartMetric === "campaignClicks" ? "Tracked link clicks" : "Downloads"}
                </h2>
              </div>
              <div className="flex gap-1 rounded-full bg-surface p-1">
                {([
                  ["campaignClicks", "Clicks"],
                  ["downloads", "Downloads"],
                ] as const).map(([metric, label]) => (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => setChartMetric(metric)}
                    className={cn(
                      "h-8 rounded-full px-3 text-xs transition-colors",
                      chartMetric === metric ? "bg-fg text-bg" : "text-muted hover:text-fg",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {dailySeries.some((row) => row.value > 0) ? (
              <div className="mt-6 flex h-40 items-end gap-1" aria-label="Analytics activity chart">
                {dailySeries.map((row) => (
                  <div
                    key={row.day}
                    className="group relative flex h-full min-w-0 flex-1 items-end"
                    title={`${row.day}: ${row.value} ${chartMetric === "campaignClicks" ? "clicks" : "downloads"}`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-colors",
                        row.value > 0 ? "bg-fg/70 group-hover:bg-fg" : "bg-border/70",
                      )}
                      style={{ height: row.value > 0 ? `${Math.max(4, (row.value / maxDaily) * 100)}%` : "2px" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Activity will appear here after tracked clicks or downloads.</p>
            )}
          </section>

          <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-widest text-subtle uppercase">Campaigns</p>
                <h2 className="mt-1 font-display text-2xl text-fg">Tracked link performance</h2>
              </div>
              <p className="text-xs text-muted">Use links such as mrwallpaper.org/wallio</p>
            </div>
            {data.campaigns.length ? (
              <div className="mt-4 divide-y divide-border">
                {data.campaigns.map((item) => {
                  const conversion = item.clicks ? (item.downloads / item.clicks) * 100 : 0;
                  return (
                    <div
                      key={`${item.source}:${item.medium}:${item.campaign}`}
                      className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(70px,auto))] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">{item.campaign}</p>
                        <p className="mt-0.5 truncate text-xs text-subtle">{item.source} · {item.medium}</p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle">Clicks</p>
                        <p className="mt-0.5 text-sm tabular-nums text-fg">{n(item.clicks)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle">People</p>
                        <p className="mt-0.5 text-sm tabular-nums text-fg">{n(item.visitors)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle">Downloads</p>
                        <p className="mt-0.5 text-sm tabular-nums text-fg">{n(item.downloads)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-subtle">Click → download</p>
                        <p className="mt-0.5 text-sm tabular-nums text-fg">{conversion.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No tracked campaign clicks yet.</p>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium tracking-widest text-subtle uppercase">Content</p>
              <h2 className="mt-1 font-display text-2xl text-fg">Top downloaded wallpapers</h2>
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
                      <span className="shrink-0 text-xs text-muted">
                        {n(item.downloads)} ↓ · {n(item.shares)} shares
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">No download activity yet.</p>
              )}
            </section>

            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs font-medium tracking-widest text-subtle uppercase">Search quality</p>
              <h2 className="mt-1 font-display text-2xl text-fg">Searches with no results</h2>
              <div className="mt-4 space-y-3">
                {data.topSearches.length ? data.topSearches.map((item) => (
                  <div key={item.query} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-fg">{item.query}</span>
                    <span className="shrink-0 text-muted">{n(item.searches)} misses</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted">No zero-result searches in this period.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)] lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium tracking-widest text-subtle uppercase">Acquisition</p>
                  <h2 className="mt-1 font-display text-2xl text-fg">Tracked sources</h2>
                  <div className="mt-4 space-y-3">
                    {data.sources.length ? data.sources.map((item) => (
                      <div key={item.source} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-fg">{item.source}</span>
                        <span className="shrink-0 text-muted">{n(item.visits)} clicks</span>
                      </div>
                    )) : (
                      <p className="text-sm text-muted">No tracked sources yet.</p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <MonitorSmartphone className="size-4 text-muted" />
                    <p className="text-xs font-medium tracking-widest text-subtle uppercase">Campaign devices</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.devices.length ? data.devices.map((item) => (
                      <span key={item.device} className="rounded-full bg-surface px-3 py-2 text-xs text-muted">
                        {item.device} · {n(item.visits)}
                      </span>
                    )) : (
                      <p className="text-sm text-muted">No device data yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <p className="text-xs leading-relaxed text-subtle">
            Tracking begins when visitors use tagged links. Raw IP addresses are not stored, and browsers with Do Not Track enabled are excluded.
          </p>
        </>
      ) : null}
    </div>
  );
}
