import { Check, Copy, Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPromptWindow = Window & {
  __mrWallpapersInstallPrompt?: InstallPromptEvent | null;
};

type PromptMode = "ios" | "inapp-ios" | "inapp-android" | "browser" | null;

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

function detectMode(): PromptMode {
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
  if (isAndroid) return "browser";
  return null;
}

export function InstallAppPrompt() {
  const [mode, setMode] = useState<PromptMode>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const capturedPrompt = getCapturedInstallPrompt();
    if (capturedPrompt && /Android/i.test(navigator.userAgent)) {
      setDeferredPrompt(capturedPrompt);
      setMode("browser");
      setVisible(true);
    }

    const detectedMode = detectMode();
    const timer = window.setTimeout(() => {
      if (!detectedMode) return;
      setMode(detectedMode);
      setVisible(true);
    }, 3500);

    const onBeforeInstallPrompt = (event: Event) => {
      // Only show our helper on Android. Desktop browsers keep their own native UI.
      if (!/Android/i.test(navigator.userAgent)) return;
      event.preventDefault();
      const promptEvent = event as InstallPromptEvent;
      setCapturedInstallPrompt(promptEvent);
      setDeferredPrompt(promptEvent);
      setMode("browser");
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      setCapturedInstallPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !mode) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    const installPrompt = deferredPrompt ?? getCapturedInstallPrompt();
    if (!installPrompt) {
      setShowSteps(true);
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setDeferredPrompt(null);
      setCapturedInstallPrompt(null);
      if (choice.outcome === "accepted") setVisible(false);
      else setShowSteps(true);
    } catch {
      setDeferredPrompt(null);
      setCapturedInstallPrompt(null);
      setShowSteps(true);
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
            <p>Open this page in <span className="font-medium text-fg">Chrome</span>, then choose Install app or Add to Home screen.</p>
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

        {mode === "browser" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {deferredPrompt
                ? "Install the web app for a full-screen experience and quicker access."
                : "Install from Chrome’s menu using Install app or Add to Home screen."}
            </p>
            <button
              type="button"
              onClick={install}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg"
            >
              <Download className="size-4" />
              {deferredPrompt ? "Install app" : "Install steps"}
            </button>
            {showSteps && (
              <p className="rounded-[12px] bg-bg px-3 py-2 text-xs leading-relaxed text-muted shadow-[var(--shadow-border)]">
                In Chrome, open the browser menu and choose <span className="font-medium text-fg">Install app</span> or <span className="font-medium text-fg">Add to Home screen</span>.
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
