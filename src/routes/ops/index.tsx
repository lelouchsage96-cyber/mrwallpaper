import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CloudDownload, Download, Flag, Image, Upload, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { DownloadChart } from "@/components/ops/download-chart";
import { StatCard } from "@/components/ops/stat-card";
import { OpsThumb } from "@/components/ops/thumb";
import { ErrorState } from "@/components/empty-state";
import { getOpsOverview } from "@/lib/server/ops";
import type { OpsOverview } from "@/lib/types";
import { formatCount } from "@/lib/utils";

export const Route = createFileRoute("/ops/")({ component: OpsOverviewPage });

function OpsOverviewPage() {
  const [data, setData] = useState<OpsOverview | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    void getOpsOverview().then(setData).catch(() => setError(true));
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState onRetry={load} />;
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-elevated" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-elevated" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-elevated" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mw-enter">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">Mr Wallpapers Admin</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Add new wallpapers, import existing Cloudflare R2 files, and manage the free catalog.
          </p>
        </div>
        <p className="text-sm text-muted">{format(new Date(), "EEEE, d MMM")}</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/ops/upload"
          className="group flex min-h-28 items-center gap-4 rounded-xl bg-elevated p-5 transition hover:bg-surface"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-fg text-bg">
            <Upload className="size-5" />
          </span>
          <span>
            <span className="block font-display text-2xl text-fg">Add wallpaper</span>
            <span className="mt-1 block text-sm text-muted">Upload a new image and publish it free.</span>
          </span>
        </Link>
        <Link
          to="/ops/import-r2"
          className="group flex min-h-28 items-center gap-4 rounded-xl bg-elevated p-5 transition hover:bg-surface"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-fg text-bg">
            <CloudDownload className="size-5" />
          </span>
          <span>
            <span className="block font-display text-2xl text-fg">Import from R2</span>
            <span className="mt-1 block text-sm text-muted">Publish files already stored in Cloudflare without re-uploading.</span>
          </span>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Wallpapers"
          value={data.wallpapers}
          hint={`${formatCount(data.approved)} published`}
          to="/ops/wallpapers"
          icon={<Image className="size-4" />}
        />
        <StatCard
          label="Downloads today"
          value={data.downloadsToday}
          delta={data.downloadsToday - data.downloadsYesterday}
          icon={<Download className="size-4" />}
        />
        <StatCard
          label="Users"
          value={data.users}
          to="/ops/users"
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Open reports"
          value={data.openReports}
          to="/ops/reports"
          icon={<Flag className="size-4" />}
        />
      </section>

      <section className="rounded-xl bg-elevated p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-fg">Downloads</h2>
            <p className="mt-1 text-sm text-muted">Last 14 days</p>
          </div>
          <p className="text-sm tabular-nums text-muted">{formatCount(data.downloadsAll)} total</p>
        </div>
        <div className="mt-4">
          <DownloadChart series={data.series} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl text-fg">Top wallpapers</h2>
            <p className="mt-1 text-sm text-muted">Your most-downloaded wallpapers.</p>
          </div>
          <Link to="/ops/wallpapers" className="text-sm text-muted hover:text-fg">
            Manage catalog
          </Link>
        </div>
        {data.topWallpapers.length === 0 ? (
          <p className="rounded-xl bg-elevated px-4 py-8 text-center text-sm text-muted">
            No wallpaper activity yet.
          </p>
        ) : (
          <ol className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
            {data.topWallpapers.slice(0, 8).map((w, i) => (
              <li key={w.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                <span className="w-5 text-center text-xs tabular-nums text-subtle">{i + 1}</span>
                <OpsThumb src={w.thumbnailUrl} alt={w.title} id={w.id} size="sm" />
                <Link to="/wallpaper/$id" params={{ id: w.id }} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{w.title}</span>
                  <span className="text-xs text-muted">{formatCount(w.downloadCount)} downloads</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
