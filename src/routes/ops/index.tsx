import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  BarChart3,
  CheckCircle2,
  CloudDownload,
  Download,
  Flag,
  Heart,
  Image,
  Images,
  Inbox,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DownloadChart } from "@/components/ops/download-chart";
import { StatCard } from "@/components/ops/stat-card";
import { OpsThumb } from "@/components/ops/thumb";
import { ErrorState } from "@/components/empty-state";
import { getOpsOverview } from "@/lib/server/ops";
import type { OpsOverview } from "@/lib/types";
import { formatCount } from "@/lib/utils";

export const Route = createFileRoute("/ops/")({ component: OpsOverviewPage });

function QuickAction({
  to,
  title,
  description,
  icon,
}: {
  to: "/ops/upload" | "/ops/bulk-upload" | "/ops/analytics" | "/ops/import-r2";
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-28 items-center gap-4 rounded-xl bg-elevated p-5 transition-colors hover:bg-surface"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-fg text-bg">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-xl text-fg">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{description}</span>
      </span>
    </Link>
  );
}

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

  const needsAttention = data.pendingSubmissions + data.pending + data.openReports;

  return (
    <div className="space-y-8 mw-enter">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">Mr Wallpapers Admin</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Content, submissions, performance, and site operations in one place.
          </p>
        </div>
        <p className="text-sm text-muted">{format(new Date(), "EEEE, d MMM")}</p>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest text-subtle uppercase">Quick actions</p>
            <h2 className="mt-1 font-display text-2xl text-fg">Work faster</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            to="/ops/upload"
            title="Add wallpaper"
            description="Upload and publish a single wallpaper."
            icon={<Upload className="size-5" />}
          />
          <QuickAction
            to="/ops/bulk-upload"
            title="Bulk upload"
            description="Add a batch and generate metadata together."
            icon={<Images className="size-5" />}
          />
          <QuickAction
            to="/ops/analytics"
            title="Analytics"
            description="Check TikTok clicks, downloads, and campaigns."
            icon={<BarChart3 className="size-5" />}
          />
          <QuickAction
            to="/ops/import-r2"
            title="Import from R2"
            description="Publish files already stored in Cloudflare."
            icon={<CloudDownload className="size-5" />}
          />
        </div>
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
          label="Favorites"
          value={data.favorites}
          icon={<Heart className="size-4" />}
        />
      </section>

      <section className="rounded-xl bg-elevated p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest text-subtle uppercase">Inbox</p>
            <h2 className="mt-1 font-display text-2xl text-fg">Needs attention</h2>
          </div>
          {needsAttention === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs text-muted">
              <CheckCircle2 className="size-3.5" />
              All clear
            </span>
          ) : (
            <span className="rounded-full bg-surface px-3 py-2 text-xs tabular-nums text-muted">
              {needsAttention} items
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Link to="/ops/creators" className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-bg">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-fg">
              <Inbox className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">Submissions</span>
              <span className="text-xs text-muted">{formatCount(data.pendingSubmissions)} waiting</span>
            </span>
          </Link>
          <Link to="/ops/wallpapers" className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-bg">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-fg">
              <Image className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">Drafts & pending</span>
              <span className="text-xs text-muted">{formatCount(data.pending)} wallpapers</span>
            </span>
          </Link>
          <Link to="/ops/reports" className="flex items-center gap-3 rounded-lg bg-surface p-4 transition-colors hover:bg-bg">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-elevated text-fg">
              <Flag className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">Reports</span>
              <span className="text-xs text-muted">{formatCount(data.openReports)} open</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="rounded-xl bg-elevated p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-fg">Downloads</h2>
            <p className="mt-1 text-sm text-muted">Last 14 days</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm tabular-nums text-muted">{formatCount(data.downloadsAll)} total</p>
            <Link to="/ops/analytics" className="text-sm text-fg hover:text-muted">
              Analytics
            </Link>
          </div>
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
