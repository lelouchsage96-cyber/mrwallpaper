import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { OpsThumb } from "@/components/ops/thumb";
import { Button } from "@/components/ui/button";
import { listOpsSubmissions, reviewOpsSubmission } from "@/lib/server/ops";
import type { OpsSubmissionRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/ops/creators")({ component: OpsSubmissionsPage });

function OpsSubmissionsPage() {
  const [items, setItems] = useState<OpsSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(false);
    void listOpsSubmissions()
      .then((result) => setItems(result.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      await reviewOpsSubmission({ data: { id, status } });
      setItems((current) => current.filter((item) => item.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-widest text-subtle uppercase">Community</p>
        <h1 className="mt-1 font-display text-4xl text-fg">Wallpaper submissions</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Review community uploads before they enter the catalog. Approval always publishes the
          wallpaper as a free download.
        </p>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-xl bg-elevated" />
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-elevated px-5 py-12 text-center">
          <CheckCircle2 className="mx-auto size-7 text-muted" />
          <p className="mt-3 text-sm font-medium text-fg">Submission inbox is clear</p>
          <p className="mt-1 text-xs text-muted">New community wallpapers will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <OpsThumb src={item.thumbnailUrl} alt={item.title} id={item.id} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.categoryName}
                  {item.primaryKeyword ? ` · ${item.primaryKeyword}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[11px] text-muted">
                    <UserRoundCheck className="size-3" />
                    {item.submitterName || item.submitterEmail || "Community member"}
                  </span>
                  {item.aiGenerated ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[11px] text-muted">
                      <Sparkles className="size-3" />
                      AI metadata
                    </span>
                  ) : null}
                  {item.rightsConfirmed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[11px] text-muted">
                      <CheckCircle2 className="size-3" />
                      Rights confirmed
                    </span>
                  ) : null}
                  <span className="rounded-full bg-surface px-2 py-1 text-[11px] text-muted">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyId === item.id}
                  onClick={() => void review(item.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
