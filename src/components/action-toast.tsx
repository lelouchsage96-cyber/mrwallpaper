import { useEffect, useRef, useState } from "react";

const ACTION_TOAST_EVENT = "mrwallpaper:action-toast";

type ActionToastDetail = {
  message: string;
};

export function showActionToast(message: string) {
  if (typeof window === "undefined" || !message.trim()) return;
  window.dispatchEvent(
    new CustomEvent<ActionToastDetail>(ACTION_TOAST_EVENT, {
      detail: { message: message.trim() },
    }),
  );
}

export function ActionToastViewport() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ActionToastDetail>).detail;
      if (!detail?.message) return;

      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      setMessage(detail.message);
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, 2_200);
    };

    window.addEventListener(ACTION_TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(ACTION_TOAST_EVENT, onToast);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-4 lg:bottom-6"
    >
      <div className="max-w-sm rounded-full border border-border bg-surface/95 px-4 py-2 text-center text-sm font-medium text-fg shadow-[var(--shadow-border)] backdrop-blur-md">
        {message}
      </div>
    </div>
  );
}
