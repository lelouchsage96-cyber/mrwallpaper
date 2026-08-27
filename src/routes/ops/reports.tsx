import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ops/status-badge";
import { OpsThumb } from "@/components/ops/thumb";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/en";
import { listOpsReports, updateReportOps } from "@/lib/server/ops";
import type { OpsReportRow } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/ops/reports")({ component: OpsReportsPage });

type Filter = "open" | "resolved" | "dismissed" | "all";

function OpsReportsPage() {
  const [items, setItems] = useState<OpsReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");

  function load() {
    setLoading(true);
    setError(false);
    void listOpsReports()
      .then((r) => setItems(r.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: "resolved" | "dismissed") {
    await updateReportOps({ data: { id, status } });
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const openCount = items.filter((r) => r.status === "open").length;
  const visible = items.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <div>
      <h1 className="font-display text-4xl text-fg">{t.ops.reports}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">{t.ops.reportsHint}</p>

      {error ? (
        <div className="mt-5">
          <ErrorState onRetry={load} />
        </div>
      ) : loading ? (
        <div className="mt-5 h-40 animate-pulse rounded-xl bg-elevated" />
      ) : items.length === 0 ? (
        <EmptyState title={t.ops.noReports} />
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["open", `${t.ops.openReports} · ${openCount}`],
                ["resolved", t.ops.tabResolved],
                ["dismissed", t.ops.tabDismissed],
                ["all", t.ops.allStatuses],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-sm",
                  filter === id ? "bg-fg text-bg" : "bg-elevated text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="rounded-xl bg-elevated px-4 py-10 text-center text-sm text-muted">
              {t.ops.noReports}
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
              {visible.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <OpsThumb src={r.thumbnailUrl} alt={r.title} id={r.wallpaperId} />
                    <Link
                      to="/wallpaper/$id"
                      params={{ id: r.wallpaperId }}
                      className="min-w-0 flex-1"
                    >
                      <span className="block truncate text-sm font-medium text-fg">{r.title}</span>
                      <span className="text-xs capitalize text-muted">
                        {r.reason}
                        {" · "}
                        {formatDate(r.createdAt)}
                      </span>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.status === "open" ? (
                      <>
                        <Button size="sm" onClick={() => setStatus(r.id, "resolved")}>
                          {t.ops.resolve}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "dismissed")}>
                          {t.ops.dismiss}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
