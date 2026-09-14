import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

export function AppUpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      setShow(true);
    };

    const checkForUpdate = () => {
      void navigator.serviceWorker.ready
        .then((registration) => registration.update())
        .catch(() => undefined);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[85] flex justify-center px-4 lg:bottom-6">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-[var(--shadow-border)] backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">A newer version of Mr Wallpapers is ready.</p>
          <p className="mt-0.5 text-xs text-muted">Refresh to get the latest improvements.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-fg px-3 text-sm font-medium text-bg"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label="Dismiss update"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-elevated hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
