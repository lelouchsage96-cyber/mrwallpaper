import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };
type PwaWindow = Window & { __mrPwaInstallPrompt?: BeforeInstallPromptEvent | null };

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const nav = navigator as NavigatorWithStandalone;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const ios =
      /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    const pwaWindow = window as PwaWindow;
    const syncSavedPrompt = () => {
      setInstallEvent(pwaWindow.__mrPwaInstallPrompt ?? null);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      pwaWindow.__mrPwaInstallPrompt = promptEvent;
      setInstallEvent(promptEvent);
    };

    const onInstalled = () => {
      pwaWindow.__mrPwaInstallPrompt = null;
      setIsInstalled(true);
      setInstallEvent(null);
    };

    syncSavedPrompt();
    window.addEventListener("mr-pwa-install-ready", syncSavedPrompt);
    window.addEventListener("mr-pwa-installed", onInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then(syncSavedPrompt).catch(() => undefined);
    }

    return () => {
      window.removeEventListener("mr-pwa-install-ready", syncSavedPrompt);
      window.removeEventListener("mr-pwa-installed", onInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isInstalled || dismissed) return null;

  if (isIos) {
    return (
      <aside className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md rounded-[18px] border border-border bg-bg/95 p-4 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          aria-label="Dismiss install instructions"
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-muted"
        >
          <X className="size-4" />
        </button>
        <div className="flex gap-3 pr-8">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-elevated text-fg">
            <Share2 className="size-5" />
          </span>
          <div>
            <p className="font-medium text-fg">Add Mr Wallpapers to iPhone</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              In Safari: tap Share → Add to Home Screen → turn on Open as Web App → tap Add.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md rounded-[18px] border border-border bg-bg/95 p-4 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        aria-label="Dismiss install prompt"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-muted"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-center gap-3 pr-8">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-elevated text-fg">
          <Download className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-fg">Install Mr Wallpapers</p>
          <p className="mt-0.5 text-sm text-muted">Use it like an app from your device.</p>
        </div>
      </div>
      <button
        type="button"
        className="mt-3 h-11 w-full rounded-full bg-fg px-4 text-sm font-medium text-bg"
        onClick={async () => {
          const pwaWindow = window as PwaWindow;
          const event = installEvent ?? pwaWindow.__mrPwaInstallPrompt ?? null;

          if (!event) {
            setShowFallback(true);
            return;
          }

          pwaWindow.__mrPwaInstallPrompt = null;
          setInstallEvent(null);
          await event.prompt();
          const choice = await event.userChoice;
          if (choice.outcome === "accepted") setIsInstalled(true);
        }}
      >
        Install app
      </button>
      {showFallback ? (
        <p className="mt-3 text-xs leading-5 text-muted">
          Chrome or Edge has not released the native install prompt yet. On Windows, open the ⋮ menu → Cast, save, and share → Install page as app. On Android, open the ⋮ menu → Add to Home screen / Install app.
        </p>
      ) : null}
    </aside>
  );
}
