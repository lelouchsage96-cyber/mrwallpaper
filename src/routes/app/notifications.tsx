import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { BellRing, Check, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { LazyImage } from "@/components/lazy";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { listNotifications, markNotificationsRead, updateNotificationPref } from "@/lib/server/api";
import {
  getPushConfig,
  removePushSubscription,
  savePushSubscription,
  sendPushTest,
} from "@/lib/server/web-push-api";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isIosDevice() {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & { maxTouchPoints?: number };
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (nav.maxTouchPoints ?? 0) > 1);
}

function isInstalledWebApp() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function NotificationsPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [on, setOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pushSupported, setPushSupported] = useState<boolean | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [needsIosInstall, setNeedsIosInstall] = useState(false);
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

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setPushSupported(supported);
    setNeedsIosInstall(isIosDevice() && !isInstalledWebApp());
    if (!supported) return;

    setPushPermission(Notification.permission);
    let cancelled = false;
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) setPushSubscribed(Boolean(subscription));
      })
      .catch(() => {
        if (!cancelled) setPushSubscribed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function enablePush() {
    if (!user || pushBusy) return;
    setPushMessage("");

    if (isIosDevice() && !isInstalledWebApp()) {
      setNeedsIosInstall(true);
      setPushMessage("On iPhone and iPad, add Mr Wallpapers to your Home Screen first, then open the installed app and enable notifications here.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushSupported(false);
      setPushMessage("This browser does not support Web Push.");
      return;
    }

    setPushBusy(true);
    try {
      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== "granted") {
        setPushMessage(
          permission === "denied"
            ? "Notifications are blocked in your browser or device settings."
            : "Notification permission was not granted.",
        );
        return;
      }

      const config = await getPushConfig();
      if (!config.enabled || !config.publicKey) {
        setPushMessage("Push notifications are temporarily unavailable.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(config.publicKey) as BufferSource,
        });
      }

      const serialized = subscription.toJSON();
      const endpoint = serialized.endpoint;
      const p256dh = serialized.keys?.p256dh;
      const auth = serialized.keys?.auth;
      if (!endpoint || !p256dh || !auth) throw new Error("Incomplete push subscription.");

      const saved = await savePushSubscription({
        data: {
          endpoint,
          p256dh,
          auth,
          userAgent: navigator.userAgent,
        },
      });
      if (!saved.ok) throw new Error("Could not save push subscription.");

      await updateNotificationPref({ data: { on: true } });
      setOn(true);
      setPushSubscribed(true);
      setPushMessage("Device notifications are enabled.");
    } catch (err) {
      console.error("[notifications] enable push", err);
      setPushMessage("Could not enable device notifications. Please try again.");
    } finally {
      setPushBusy(false);
    }
  }

  async function disablePush() {
    if (pushBusy || !("serviceWorker" in navigator)) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription({ data: { endpoint: subscription.endpoint } }).catch(() => undefined);
        await subscription.unsubscribe();
      }
      setPushSubscribed(false);
      setPushMessage("Device notifications are off on this device.");
    } catch (err) {
      console.error("[notifications] disable push", err);
      setPushMessage("Could not turn off device notifications. Please try again.");
    } finally {
      setPushBusy(false);
    }
  }

  async function sendTest() {
    if (pushBusy) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      const result = await sendPushTest();
      setPushMessage(
        result.ok
          ? "Test notification sent. It should appear in your device notifications."
          : "No active push subscription could receive the test.",
      );
    } catch {
      setPushMessage("Could not send the test notification.");
    } finally {
      setPushBusy(false);
    }
  }

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

      {user ? (
        <section className="mt-5 rounded-[20px] bg-elevated p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-fg">
              {pushSubscribed ? <Check className="size-5" /> : <BellRing className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg">Device notifications</p>
              <p className="mt-1 text-sm leading-5 text-muted">
                {pushSubscribed
                  ? "Enabled on this device. You can receive alerts even when Mr Wallpapers is closed."
                  : "Get Wallpaper of the Day, new collections, and new wallpapers from categories you follow."}
              </p>
            </div>
          </div>

          {needsIosInstall && !pushSubscribed ? (
            <div className="mt-4 rounded-[14px] bg-surface p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-fg">
                <Smartphone className="size-4" />
                iPhone / iPad
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Add Mr Wallpapers to your Home Screen, open the installed web app, then return here and tap Enable.
              </p>
            </div>
          ) : null}

          {pushSupported === false ? (
            <p className="mt-4 text-sm text-muted">This browser does not support Web Push notifications.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {pushSubscribed ? (
                <>
                  <Button size="sm" onClick={() => void sendTest()} disabled={pushBusy || !on}>
                    Send test
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void disablePush()} disabled={pushBusy}>
                    Turn off on this device
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => void enablePush()} disabled={pushBusy || pushPermission === "denied"}>
                  {pushBusy ? "Enabling…" : "Enable device notifications"}
                </Button>
              )}
            </div>
          )}

          {!on && pushSubscribed ? (
            <p className="mt-3 text-xs text-muted">
              Your notification preference is currently off, so pushes will stay paused until you turn notifications back on.
            </p>
          ) : null}
          {pushPermission === "denied" ? (
            <p className="mt-3 text-xs text-muted">
              Permission is blocked. Re-enable notifications for Mr Wallpapers in your browser or device settings.
            </p>
          ) : null}
          {pushMessage ? <p className="mt-3 text-xs text-muted">{pushMessage}</p> : null}
        </section>
      ) : null}

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
        <div className="mt-6">
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
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t.notifications.empty} />
        </div>
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
