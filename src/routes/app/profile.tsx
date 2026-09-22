import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { authClient, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { MwMark } from "@/components/mw-mark";
import { useTheme, type Theme } from "@/components/theme-provider";
import { t } from "@/lib/i18n/en";
import { brand } from "@/lib/brand";
import { listDownloads, listNotifications, updateNotificationPref } from "@/lib/server/api";
import { getOpsSession } from "@/lib/server/ops";
import type { DownloadHistoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DownloadHistoryList } from "@/components/download-history";
import { showActionToast } from "@/components/action-toast";
import { removePushSubscription } from "@/lib/server/web-push-api";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, isPending } = useCurrentUserState();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showOps, setShowOps] = useState(false);
  const [downloads, setDownloads] = useState<DownloadHistoryItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notifyOn, setNotifyOn] = useState(true);

  const userId = user?.id ?? null;

  async function clearDevicePush() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager?.getSubscription();
      if (!subscription) return;
      await removePushSubscription({ data: { endpoint: subscription.endpoint } }).catch(() => undefined);
      await subscription.unsubscribe().catch(() => undefined);
    } catch {
      // Signing out should still succeed if push cleanup is unavailable.
    }
  }

  useEffect(() => {
    if (isPending || !userId) return;
    void getOpsSession()
      .then((s) => setShowOps(s.canModerate || s.canClaim))
      .catch(() => undefined);
    void listDownloads()
      .then((r) => setDownloads(r.items))
      .catch(() => undefined);
    void listNotifications()
      .then((r) => setNotifyOn(r.notificationsOn))
      .catch(() => undefined);
  }, [userId, isPending]);

  const themes: { id: Theme; label: string }[] = [
    { id: "system", label: t.profile.themeSystem },
    { id: "dark", label: t.profile.themeDark },
    { id: "light", label: t.profile.themeLight },
  ];

  const legalRows = [
    { to: "/legal/privacy", label: t.profile.privacy },
    { to: "/legal/terms", label: t.profile.terms },
    { to: "/legal/copyright", label: t.profile.copyright },
    { to: "/legal/guidelines", label: t.profile.guidelines },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-5 lg:px-0 lg:pt-6">
      <h1 className="font-display text-3xl text-fg lg:hidden">{t.profile.title}</h1>

      <section className="mt-6 rounded-[20px] bg-elevated p-5 lg:mt-0">
        {isPending ? (
          <div className="h-16 animate-pulse rounded-[12px] bg-surface" />
        ) : user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-sm font-medium">
                {(user.displayName ?? user.primaryEmail ?? "M").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-fg">{user.displayName ?? t.profile.guest}</p>
                <p className="truncate text-sm text-muted">{user.primaryEmail}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-medium text-fg">{t.profile.guest}</p>
            <p className="mt-1 text-sm text-muted">{t.profile.guestHint}</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/login", search: { next: "/app/profile" } })}>
              {t.auth.signIn}
            </Button>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-fg">{t.profile.appearance}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {themes.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={cn(
                "h-11 rounded-[12px] text-sm",
                theme === opt.id ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {user ? (
        <section className="mt-8 space-y-2">
          <h2 className="font-display text-xl text-fg">{t.profile.settings}</h2>
          <Link
            to="/studio/submit"
            className="flex items-center justify-between rounded-xl bg-elevated px-4 py-4"
          >
            <span>
              <span className="block text-sm font-medium text-fg">Submit a wallpaper</span>
              <span className="text-xs text-muted">Share a wallpaper for manual review and free publication.</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-subtle" />
          </Link>
          <Link
            to="/app/taste"
            className="flex items-center justify-between rounded-xl bg-elevated px-4 py-4"
          >
            <span>
              <span className="block text-sm font-medium text-fg">{t.profile.taste}</span>
              <span className="text-xs text-muted">{t.profile.tasteHint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-subtle" />
          </Link>
          <button
            type="button"
            onClick={async () => {
              const next = !notifyOn;
              setNotifyOn(next);
              await updateNotificationPref({ data: { on: next } });
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-xl bg-elevated px-4 text-left"
          >
            <span className="text-sm text-fg">{t.profile.notificationsOn}</span>
            <span
              className={cn(
                "grid h-7 w-12 place-items-center rounded-full text-xs font-medium",
                notifyOn ? "bg-fg text-bg" : "bg-surface text-muted",
              )}
            >
              {notifyOn ? t.ops.on : t.ops.off}
            </span>
          </button>
        </section>
      ) : null}

      {user && showOps ? (
        <section className="mt-8">
          <Link
            to="/ops"
            className="flex items-center gap-3 rounded-xl bg-elevated p-4"
          >
            <MwMark className="size-10 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-fg">{t.profile.ops}</span>
              <span className="text-xs text-muted">{t.profile.opsHint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-subtle" />
          </Link>
        </section>
      ) : null}

      {user ? (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-fg">{t.profile.downloads}</h2>
            <Link to="/app/downloads" className="text-sm text-muted hover:text-fg">
              {t.profile.seeHistory}
            </Link>
          </div>
          {downloads.length === 0 ? (
            <p className="text-sm text-muted">{t.profile.emptyDownloads}</p>
          ) : (
            <DownloadHistoryList items={downloads.slice(0, 4)} />
          )}
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="hidden font-display text-xl text-fg lg:block">{t.profile.legal}</h2>

        <details className="group overflow-hidden rounded-[16px] bg-elevated lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-fg [&::-webkit-details-marker]:hidden">
            <span>Legal & policies</span>
            <ChevronRight className="size-4 text-subtle transition-transform duration-150 group-open:rotate-90" />
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {legalRows.map((row) => (
              <li key={row.to}>
                <Link to={row.to} className="flex min-h-12 items-center px-4 text-sm text-fg">
                  {row.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>

        <ul className="mt-3 hidden divide-y divide-border rounded-[16px] bg-elevated lg:block">
          {legalRows.map((row) => (
            <li key={row.to}>
              <Link to={row.to} className="flex min-h-12 items-center px-4 text-sm text-fg">
                {row.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {user ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-display text-xl text-fg">Account</h2>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void (async () => {
              await clearDevicePush();
              await signOut().catch(() => undefined);
            })()}
          >
            {t.auth.signOut}
          </Button>
          {confirmDelete ? (
            <div className="rounded-[16px] border border-danger/25 bg-elevated p-4">
              <p className="text-sm font-medium text-fg">{t.profile.deleteConfirm}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{t.profile.deleteHint}</p>
              {deleteError ? <p className="mt-2 text-xs text-danger">{deleteError}</p> : null}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={deleteBusy}
                  onClick={async () => {
                    if (deleteBusy) return;
                    setDeleteBusy(true);
                    setDeleteError("");
                    try {
                      await clearDevicePush();
                      const { error } = await authClient.deleteUser({ callbackURL: "/app" });
                      if (error) throw new Error(error.message || "Could not start account deletion.");
                      setConfirmDelete(false);
                      showActionToast("Check your email to confirm account deletion.");
                    } catch (error) {
                      setDeleteError(error instanceof Error ? error.message : "Could not start account deletion. Please try again.");
                    } finally {
                      setDeleteBusy(false);
                    }
                  }}
                >
                  {deleteBusy ? "Please wait…" : t.profile.delete}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={deleteBusy}
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteError("");
                  }}
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-danger"
              onClick={() => {
                setDeleteError("");
                setConfirmDelete(true);
              }}
            >
              {t.profile.delete}
            </Button>
          )}
        </section>
      ) : null}

      <p className="mt-10 text-center text-xs text-subtle">
        {brand.name} · {brand.tagline}
      </p>
    </div>
  );
}
