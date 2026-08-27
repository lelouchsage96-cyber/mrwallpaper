import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { LazyImage } from "@/components/lazy";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { listNotifications, markNotificationsRead, updateNotificationPref } from "@/lib/server/api";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [on, setOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const userId = user?.id ?? null;

  function load() {
    setError(false);
    void listNotifications()
      .then((r) => {
        setItems(r.items);
        setOn(r.notificationsOn);
      })
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

  const unread = items.some((n) => !n.read);
  const showSkeleton = (isPending || loading) && items.length === 0 && Boolean(userId);

  return (
    <div className="px-4 pt-5 pb-8">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl text-fg">{t.notifications.title}</h1>
        {user && unread ? (
          <button
            type="button"
            className="min-h-11 text-sm text-muted hover:text-fg"
            onClick={async () => {
              await markNotificationsRead({ data: {} });
              setItems((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
          >
            {t.notifications.markAll}
          </button>
        ) : null}
      </div>

      {showSkeleton ? (
        <div className="mt-6 h-40 rounded-xl bg-elevated" />
      ) : error && items.length === 0 ? (
        <div className="mt-6">
          <ErrorState onRetry={load} />
        </div>
      ) : !user && !isPending ? (
        <EmptyState
          title={t.notifications.signInTitle}
          body={t.notifications.signIn}
          action={{
            label: t.auth.signIn,
            onClick: () => void navigate({ to: "/login", search: { next: "/app/notifications" } }),
          }}
        />
      ) : !on ? (
        <EmptyState
          title={t.notifications.off}
          action={{
            label: t.notifications.turnOn,
            onClick: async () => {
              await updateNotificationPref({ data: { on: true } });
              setOn(true);
            },
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState title={t.notifications.empty} />
      ) : (
        <ul className="mt-5 divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left"
                onClick={() => {
                  if (!n.read) {
                    void markNotificationsRead({ data: { id: n.id } });
                    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                  }
                  if (n.href) router.history.push(n.href);
                }}
              >
                {n.thumbnailUrl ? (
                  <LazyImage
                    src={n.thumbnailUrl}
                    alt=""
                    width={32}
                    height={56}
                    fallback={n.wallpaperId ? `/wallpapers/${n.wallpaperId}.jpg` : undefined}
                    className="wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-8 shrink-0 place-items-center rounded-sm bg-surface text-[10px] tracking-wide text-muted uppercase">
                    MW
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm", n.read ? "text-fg" : "font-medium text-fg")}>
                    {n.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{n.body}</span>
                  <span className="mt-0.5 block text-xs text-subtle">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </span>
                {n.read ? null : <span className="size-2 shrink-0 rounded-full bg-fg" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
