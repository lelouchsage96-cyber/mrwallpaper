import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Download, Flag, Heart, Image } from "lucide-react";
import { useEffect, useState } from "react";
import { DownloadChart } from "@/components/ops/download-chart";
import { StatCard } from "@/components/ops/stat-card";
import { OpsThumb } from "@/components/ops/thumb";
import { ErrorState } from "@/components/empty-state";
import { t } from "@/lib/i18n/en";
import { getOpsOverview, listOpsFeatured, listOpsReports } from "@/lib/server/ops";
import type { OpsFeaturedRow, OpsOverview, OpsReportRow } from "@/lib/types";
import { formatCount, formatUsdMoney } from "@/lib/utils";
import { AD_NETWORK_META, type AdNetworkId } from "@/lib/ads";

export const Route = createFileRoute("/ops/")({ component: OpsOverviewPage });

function OpsOverviewPage() {
  const [data, setData] = useState<OpsOverview | null>(null);
  const [featured, setFeatured] = useState<OpsFeaturedRow[]>([]);
  const [reports, setReports] = useState<OpsReportRow[]>([]);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    void Promise.all([getOpsOverview(), listOpsFeatured(), listOpsReports()])
      .then(([o, f, r]) => {
        setData(o);
        setFeatured(f.items);
        setReports(r.items.filter((x) => x.status === "open").slice(0, 5));
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState onRetry={load} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-elevated" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-elevated" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-elevated" />
      </div>
    );
  }

  const slotLabel = (slot: string) =>
    slot === "wotd" ? t.ops.wotd : slot === "editors_choice" ? t.ops.editors : t.ops.spotlight;

  const mixMax = Math.max(...data.byType.map((x) => x.count), 1);
  const typeLabel = (type: string) =>
    type === "premium"
      ? t.history.types.premium
      : type === "rewarded"
        ? t.history.types.rewarded
        : t.history.types.free;

  return (
    <div className="space-y-8 mw-enter">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">{t.ops.studio}</p>
          <h1 className="mt-1 font-display text-4xl text-fg">{t.ops.overview}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{t.ops.previewNote}</p>
        </div>
        <p className="text-sm text-muted">{format(new Date(), "EEEE, d MMM")}</p>
      </div>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label={t.ops.stats.downloadsToday}
          value={data.downloadsToday}
          delta={data.downloadsToday - data.downloadsYesterday}
          icon={<Download className="size-4" />}
        />
        <StatCard
          label={t.ops.stats.reports}
          value={data.openReports}
          hint={t.ops.openQueue}
          to="/ops/reports"
          icon={<Flag className="size-4" />}
        />
        <StatCard
          label={t.ops.stats.approved}
          value={data.approved}
          hint={`${formatCount(data.wallpapers)} ${t.ops.stats.wallpapers.toLowerCase()}`}
          to="/ops/wallpapers"
          icon={<Image className="size-4" />}
        />
        <StatCard
          label={t.ops.stats.premiumSubs}
          value={data.premiumSubs}
          hint={`${formatCount(data.favorites)} ${t.ops.favorites.toLowerCase()}`}
          icon={<Heart className="size-4" />}
        />
      </section>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl bg-elevated px-4 py-3">
          <p className="text-xs tracking-widest text-subtle uppercase">{t.ops.adRevenue}</p>
          <p className="mt-1 font-display text-2xl tabular-nums text-fg">
            {formatUsdMoney(data.adRevenueTodayMicros / 1_000_000)}
          </p>
          <p className="mt-1 text-xs text-muted">{t.ops.adToday}</p>
        </div>
        <div className="rounded-xl bg-elevated px-4 py-3">
          <p className="text-xs tracking-widest text-subtle uppercase">{t.ops.adImpressions}</p>
          <p className="mt-1 font-display text-2xl tabular-nums text-fg">
            {formatCount(data.adImpressionsToday)}
          </p>
          <p className="mt-1 text-xs text-muted">{t.ops.adToday}</p>
        </div>
        <div className="rounded-xl bg-elevated px-4 py-3">
          <p className="text-xs tracking-widest text-subtle uppercase">{t.ops.adRevenue}</p>
          <p className="mt-1 font-display text-2xl tabular-nums text-fg">
            {formatUsdMoney(data.adRevenueAllMicros / 1_000_000)}
          </p>
          <p className="mt-1 text-xs text-muted">{t.ops.stats.downloads}</p>
        </div>
        <div className="rounded-xl bg-elevated px-4 py-3">
          <p className="text-xs tracking-widest text-subtle uppercase">CTR</p>
          <p className="mt-1 font-display text-2xl tabular-nums text-fg">
            {data.adImpressionsToday
              ? `${((data.adClicksToday / data.adImpressionsToday) * 100).toFixed(1)}%`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">{formatCount(data.adClicksToday)} clicks</p>
        </div>
      </section>

      {data.adByNetwork.length > 0 ? (
        <section className="rounded-xl bg-elevated p-5">
          <h2 className="font-display text-xl text-fg">{t.ops.byNetwork}</h2>
          <ul className="mt-4 space-y-3">
            {data.adByNetwork.map((row) => {
              const id = row.network as AdNetworkId;
              const label = AD_NETWORK_META[id]?.label ?? row.network;
              return (
                <li key={row.network} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted">{label}</span>
                  <span className="tabular-nums text-fg">
                    {formatCount(row.impressions)} · {formatUsdMoney(row.revenueMicros / 1_000_000)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: t.ops.stats.downloads, value: data.downloadsAll },
          { label: t.ops.stats.premium, value: data.premium },
          { label: t.ops.stats.pending, value: data.pending },
          { label: t.ops.stats.users, value: data.users },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-elevated px-4 py-3">
            <p className="text-xs tracking-widest text-subtle uppercase">{s.label}</p>
            <p className="mt-1 font-display text-2xl tabular-nums text-fg">{formatCount(s.value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div className="rounded-xl bg-elevated p-5">
          <h2 className="font-display text-xl text-fg">{t.ops.last14}</h2>
          <div className="mt-4">
            <DownloadChart series={data.series} />
          </div>
        </div>
        <div className="rounded-xl bg-elevated p-5">
          <h2 className="font-display text-xl text-fg">{t.ops.downloadMix}</h2>
          <ul className="mt-5 space-y-4">
            {data.byType.map((row) => (
              <li key={row.type}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-fg">{typeLabel(row.type)}</span>
                  <span className="tabular-nums text-muted">{formatCount(row.count)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-fg"
                    style={{ width: `${Math.round((row.count / mixMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-fg">{t.ops.topWallpapers}</h2>
            <Link to="/ops/wallpapers" className="text-sm text-muted hover:text-fg">
              {t.ops.seeCatalog}
            </Link>
          </div>
          <ol className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
            {data.topWallpapers.map((w, i) => (
              <li key={w.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                <span className="w-5 text-center text-xs tabular-nums text-subtle">{i + 1}</span>
                <OpsThumb src={w.thumbnailUrl} alt={w.title} id={w.id} size="sm" />
                <Link
                  to="/wallpaper/$id"
                  params={{ id: w.id }}
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate text-sm font-medium text-fg">{w.title}</span>
                  <span className="text-xs text-muted">
                    {formatCount(w.downloadCount)} {t.wallpaper.downloads}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-fg">{t.ops.openReports}</h2>
            <Link to="/ops/reports" className="text-sm text-muted hover:text-fg">
              {t.ops.seeReports}
            </Link>
          </div>
          {reports.length === 0 ? (
            <p className="rounded-xl bg-elevated px-4 py-8 text-center text-sm text-muted">
              {t.ops.noReports}
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
              {reports.map((r) => (
                <li key={r.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                  <OpsThumb src={r.thumbnailUrl} alt={r.title} id={r.wallpaperId} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{r.title}</span>
                  <span className="text-xs capitalize text-muted">{r.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl text-fg">{t.ops.featured}</h2>
          <Link to="/ops/wallpapers" className="text-sm text-muted hover:text-fg">
            {t.ops.seeCatalog}
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-xl bg-elevated px-4 py-8 text-center text-sm text-muted">
            {t.ops.emptyFeatured}
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-lg bg-elevated p-3">
                <OpsThumb src={f.thumbnailUrl} alt={f.title} id={f.wallpaperId} size="sm" />
                <Link
                  to="/wallpaper/$id"
                  params={{ id: f.wallpaperId }}
                  className="min-w-0 flex-1"
                >
                  <span className="block text-xs tracking-wide text-subtle uppercase">
                    {slotLabel(f.slot)}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-fg">{f.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
