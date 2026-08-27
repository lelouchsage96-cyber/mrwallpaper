import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DownloadHistoryList } from "@/components/download-history";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { listDownloads } from "@/lib/server/api";
import type { DownloadHistoryItem } from "@/lib/types";

export const Route = createFileRoute("/app/downloads")({ component: DownloadsPage });

function DownloadsPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [items, setItems] = useState<DownloadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const userId = user?.id ?? null;

  function load() {
    setError(false);
    void listDownloads()
      .then((r) => setItems(r.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isPending) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    load();
  }, [userId, isPending]);

  return (
    <div className="px-4 pt-5 pb-8">
      <h1 className="font-display text-3xl text-fg">{t.history.title}</h1>
      {isPending ? (
        <div className="mt-5 h-40 animate-pulse rounded-[20px] bg-elevated" />
      ) : !user ? (
        <EmptyState
          title={t.history.signIn}
          action={{
            label: t.auth.signIn,
            onClick: () => {
              void navigate({ to: "/login", search: { next: "/app/downloads" } });
            },
          }}
        />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : loading ? (
        <div className="mt-5 h-40 animate-pulse rounded-[20px] bg-elevated" />
      ) : items.length === 0 ? (
        <EmptyState
          title={t.history.empty}
          action={{
            label: t.nav.explore,
            onClick: () => {
              void navigate({ to: "/app/explore" });
            },
          }}
        />
      ) : (
        <div className="mt-5">
          <DownloadHistoryList items={items} />
        </div>
      )}
    </div>
  );
}
