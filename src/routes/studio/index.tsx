import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { StatusBadge } from "@/components/ops/status-badge";
import { OpsThumb } from "@/components/ops/thumb";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/en";
import { getStudioDashboard } from "@/lib/server/studio";
import type { StudioDashboard } from "@/lib/types";
import { formatCount, formatUsd } from "@/lib/utils";

export const Route = createFileRoute("/studio/")({ component: StudioHome });

function StudioHome() {
  const navigate = useNavigate();
  const [data, setData] = useState<StudioDashboard | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    void getStudioDashboard()
      .then(setData)
      .catch(() => setError(true));
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState onRetry={load} />;
  if (!data) return <div className="h-48 animate-pulse rounded-xl bg-elevated" />;
  if (!data.marketplaceOn) return <EmptyState title={t.studio.off} />;

  if (data.status === "none" || data.status === "rejected") {
    return (
      <div className="mx-auto max-w-lg">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.studio.brand}</p>
        <h1 className="mt-2 font-display text-4xl text-fg">
          {data.status === "rejected" ? t.studio.rejectedTitle : t.studio.applyTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {data.status === "rejected" ? t.studio.rejectedBody : t.studio.applyBody}
        </p>
        <Button className="mt-6" onClick={() => void navigate({ to: "/studio/apply" })}>
          {t.studio.apply}
        </Button>
      </div>
    );
  }

  if (data.status === "pending") {
    return (
      <div className="mx-auto max-w-lg">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.studio.brand}</p>
        <h1 className="mt-2 font-display text-4xl text-fg">{t.studio.pendingTitle}</h1>
        <p className="mt-3 text-sm text-muted">{t.studio.pendingBody}</p>
      </div>
    );
  }

  if (data.status === "suspended") {
    return <EmptyState title={t.studio.suspendedTitle} />;
  }

  const note = t.studio.shareNote
    .replace("{share}", String(data.creatorSharePercent))
    .replace("{min}", formatUsd(data.minPayout));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.studio.dashboard}</p>
          <h1 className="mt-1 font-display text-4xl text-fg">{data.displayName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.slug ? (
            <Link
              to="/creator/$slug"
              params={{ slug: data.slug }}
              className="inline-flex h-11 items-center rounded-full bg-elevated px-4 text-sm text-fg"
            >
              {t.studio.publicPage}
            </Link>
          ) : null}
          <Button onClick={() => void navigate({ to: "/studio/submit" })}>{t.studio.submitCta}</Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: t.studio.live, value: String(data.liveCount) },
          { label: t.studio.pending, value: String(data.pendingCount) },
          { label: t.studio.downloads, value: formatCount(data.downloads) },
          { label: t.studio.share, value: formatUsd(data.estimatedShare) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-elevated px-4 py-4">
            <p className="text-xs tracking-wide text-muted uppercase">{s.label}</p>
            <p className="mt-2 font-display text-3xl tabular-nums text-fg">{s.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 max-w-xl text-xs text-subtle">{note}</p>

      <h2 className="mt-10 font-display text-xl text-fg">{t.studio.submit}</h2>
      {data.pieces.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t.studio.emptyPieces}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {data.pieces.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-3">
              <OpsThumb src={p.thumbnailUrl} alt={p.title} id={p.id} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{p.title}</span>
                <span className="text-xs text-muted">
                  {formatCount(p.downloadCount)} · {p.accessType === "premium" ? t.ops.access.premium : t.ops.access.free}
                </span>
              </span>
              <StatusBadge status={p.status} />
              {p.status !== "removed" ? (
                <Link
                  to="/studio/submit"
                  search={{ piece: p.id }}
                  className="inline-flex h-11 shrink-0 items-center px-3 text-sm text-muted hover:text-fg"
                >
                  {t.studio.edit}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
