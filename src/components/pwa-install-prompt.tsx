import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
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
            <p className="font-medium text-fg">Install Mr Wallpapers</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              Open this site in Safari, tap Share, then choose Add to Home Screen. Keep Open as Web App enabled if shown.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  if (!installEvent) return null;

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
          const event = installEvent;
          setInstallEvent(null);
          await event.prompt();
          const choice = await event.userChoice;
          if (choice.outcome === "accepted") setIsInstalled(true);
        }}
      >
        Install app
      </button>
    </aside>
  );
}
