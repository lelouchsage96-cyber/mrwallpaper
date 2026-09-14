import { Check, Copy, Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPromptWindow = Window & {
  __mrWallpapersInstallPrompt?: InstallPromptEvent | null;
};

type BraveNavigator = Navigator & {
  brave?: { isBrave?: () => Promise<boolean> };
};

type PromptMode = "ios" | "inapp-ios" | "inapp-android" | "native" | "brave-manual" | null;

const DISMISS_KEY = "mrwallpapers.install-prompt.dismissed-at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isInstalled() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function getCapturedInstallPrompt() {
  return (window as InstallPromptWindow).__mrWallpapersInstallPrompt ?? null;
}

function setCapturedInstallPrompt(prompt: InstallPromptEvent | null) {
  (window as InstallPromptWindow).__mrWallpapersInstallPrompt = prompt;
}

async function isBraveBrowser() {
  try {
    return Boolean(await (navigator as BraveNavigator).brave?.isBrave?.());
  } catch {
    return false;
  }
}

function detectGuidanceMode(): PromptMode {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & { maxTouchPoints?: number };
  const isiOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && (nav.maxTouchPoints ?? 0) > 1);
  const isAndroid = /Android/i.test(ua);
  const inApp = /Instagram|FBAN|FBAV|TikTok|musical_ly|Bytedance|Telegram|Line|Twitter/i.test(ua);

  if (isiOS && inApp) return "inapp-ios";
  if (isiOS) return "ios";
  if (isAndroid && inApp) return "inapp-android";
  return null;
}

export function InstallAppPrompt() {
  const [mode, setMode] = useState<PromptMode>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInstalled()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const guidanceMode = detectGuidanceMode();
    if (guidanceMode) {
      const timer = window.setTimeout(() => {
        setMode(guidanceMode);
        setVisible(true);
      }, 3500);
      return () => window.clearTimeout(timer);
    }

    let sawInstallPrompt = false;

    const showNativePrompt = (promptEvent: InstallPromptEvent) => {
      sawInstallPrompt = true;
      setCapturedInstallPrompt(promptEvent);
      setDeferredPrompt(promptEvent);
      setMode("native");
      setVisible(true);
    };

    const capturedPrompt = getCapturedInstallPrompt();
    if (capturedPrompt) showNativePrompt(capturedPrompt);

    const onBeforeInstallPrompt = (event: Event) => {
      // Intentionally do NOT call preventDefault(). That leaves Chrome/Edge free
      // to show their own native address-bar/menu install affordance as well.
      showNativePrompt(event as InstallPromptEvent);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      setCapturedInstallPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const fallbackTimer = window.setTimeout(() => {
      if (sawInstallPrompt || isInstalled()) return;
      void isBraveBrowser().then((brave) => {
        if (!brave || isInstalled()) return;
        setMode("brave-manual");
        setVisible(true);
      });
    }, 4000);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !mode) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const installNativeApp = async () => {
    const installPrompt = deferredPrompt ?? getCapturedInstallPrompt();
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setDeferredPrompt(null);
      setCapturedInstallPrompt(null);
      setVisible(false);
      if (choice.outcome === "dismissed") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    } catch {
      setDeferredPrompt(null);
      setCapturedInstallPrompt(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (mode === "native") {
    return (
      <aside
        aria-label="Install Mr Wallpapers"
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-1.25rem)] max-w-sm -translate-x-1/2 rounded-[24px] border border-border bg-elevated/98 px-4 py-3 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:translate-x-0"
      >
        <div className="flex items-center gap-3">
          <img
            src="/icon-192.png"
            alt="Mr Wallpapers app icon"
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-[14px] bg-bg object-cover shadow-[var(--shadow-border)]"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-medium leading-tight text-fg">Install Mr Wallpapers</p>
            <p className="mt-1 text-sm text-muted">Open it like an app from your device.</p>
          </div>
          <button
            type="button"
            onClick={installNativeApp}
            className="shrink-0 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg active:scale-[0.98]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
      </aside>
    );
  }

  if (mode === "brave-manual") {
    return (
      <aside
        aria-label="Install Mr Wallpapers"
        className="fixed bottom-6 right-6 z-50 w-[calc(100%-2rem)] max-w-sm rounded-[20px] border border-border bg-elevated/98 p-4 shadow-2xl backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg"
        >
          <X className="size-4" />
        </button>
        <div className="pr-9">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-bg text-fg shadow-[var(--shadow-border)]">
              <Download className="size-5" />
            </div>
            <div>
              <p className="font-medium text-fg">Install Mr Wallpapers</p>
              <p className="text-xs text-muted">Brave can install this site as an app.</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted">
            In Brave, open <span className="font-medium text-fg">Menu</span> → <span className="font-medium text-fg">Save and Share</span> → <span className="font-medium text-fg">Install page as app</span>.
          </p>
        </div>
      </aside>
    );
  }

  const isIOS = mode === "ios";
  const isInAppIOS = mode === "inapp-ios";
  const isInAppAndroid = mode === "inapp-android";

  return (
    <aside
      aria-label="Install Mr Wallpapers"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[20px] border border-border bg-elevated/95 p-4 shadow-2xl backdrop-blur-xl md:bottom-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg"
      >
        <X className="size-4" />
      </button>

      <div className="pr-9">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-bg text-fg shadow-[var(--shadow-border)]">
            {isIOS || isInAppIOS ? <Share2 className="size-5" /> : <Download className="size-5" />}
          </div>
          <div>
            <p className="font-medium text-fg">Install Mr Wallpapers</p>
            <p className="text-xs text-muted">Faster access from your Home Screen.</p>
          </div>
        </div>

        {isIOS && (
          <div className="space-y-2 text-sm text-muted">
            <p>In Safari, tap <span className="font-medium text-fg">Share</span>, then <span className="font-medium text-fg">Add to Home Screen</span>.</p>
            <p className="text-xs text-subtle">Keep “Open as Web App” turned on, then tap Add.</p>
          </div>
        )}

        {isInAppIOS && (
          <div className="space-y-3 text-sm text-muted">
            <p>Open this page in <span className="font-medium text-fg">Safari</span> first, then use Share → Add to Home Screen.</p>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}

        {isInAppAndroid && (
          <div className="space-y-3 text-sm text-muted">
            <p>Open this page in <span className="font-medium text-fg">Chrome</span> first so Android can show its native Install app option.</p>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
