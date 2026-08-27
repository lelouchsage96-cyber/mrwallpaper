import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { StatusBadge } from "@/components/ops/status-badge";
import { OpsThumb } from "@/components/ops/thumb";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/en";
import { listOpsCreators, listOpsSubmissions, reviewOpsCreator, reviewOpsSubmission } from "@/lib/server/ops";
import type { OpsCreatorRow, OpsSubmissionRow } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/ops/creators")({ component: OpsCreatorsPage });

function OpsCreatorsPage() {
  const [creators, setCreators] = useState<OpsCreatorRow[]>([]);
  const [subs, setSubs] = useState<OpsSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    void Promise.all([listOpsCreators(), listOpsSubmissions()])
      .then(([c, s]) => {
        setCreators(c.items);
        setSubs(s.items);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState onRetry={load} />;

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.ops.studio}</p>
      <h1 className="mt-1 font-display text-3xl text-fg">{t.ops.creators}</h1>
      <p className="mt-2 text-sm text-muted">{t.ops.creatorsHint}</p>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-elevated" />
      ) : (
        <>
          <h2 className="mt-8 font-display text-xl text-fg">{t.ops.submissions}</h2>
          {subs.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t.ops.noSubmissions}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl bg-elevated">
              {subs.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <OpsThumb src={s.thumbnailUrl} alt={s.title} id={s.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{s.title}</span>
                    <span className="text-xs text-muted">
                      {s.creatorName} · {s.accessType === "premium" ? t.ops.access.premium : t.ops.access.free}
                    </span>
                  </span>
                  <StatusBadge status={s.status} />
                  <Button
                    size="sm"
                    onClick={async () => {
                      await reviewOpsSubmission({ data: { id: s.id, status: "approved" } });
                      load();
                    }}
                  >
                    {t.ops.approve}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await reviewOpsSubmission({ data: { id: s.id, status: "rejected" } });
                      load();
                    }}
                  >
                    {t.ops.reject}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-xl text-fg">{t.ops.applications}</h2>
          {creators.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t.ops.noCreators}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl bg-elevated">
              {creators.map((c) => (
                <li key={c.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{c.displayName}</span>
                    <span className="block truncate text-xs text-muted">
                      {c.slug} · {formatDate(c.appliedAt)} · {c.pieceCount}
                    </span>
                  </span>
                  <StatusBadge status={c.status} />
                  {c.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await reviewOpsCreator({ data: { userId: c.userId, status: "approved" } });
                          load();
                        }}
                      >
                        {t.ops.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await reviewOpsCreator({ data: { userId: c.userId, status: "rejected" } });
                          load();
                        }}
                      >
                        {t.ops.reject}
                      </Button>
                    </>
                  ) : c.status === "approved" ? (
                    <Link
                      to="/creator/$slug"
                      params={{ slug: c.slug }}
                      className="text-sm text-muted hover:text-fg"
                    >
                      {t.studio.publicPage}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
