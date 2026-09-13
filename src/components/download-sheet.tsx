import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { t } from "@/lib/i18n/en";
import { injectLiveJpeg, injectLiveMov, liveAssetId, zipStore } from "@/lib/live-photo";
import { createAdSession, requestDownload } from "@/lib/server/api";
import type { DeviceType } from "@/lib/device";
import type { AccessType } from "@/lib/types";

type DownloadFile = { data: Uint8Array; filename: string; mime: string };

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchBytes(url: string, attempts = 2): Promise<Uint8Array> {
  let lastError: unknown = new Error("fetch");

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch:${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await wait(350);
    }
  }

  throw lastError;
}

function toBrowserFile(item: DownloadFile): File {
  const copy = new Uint8Array(item.data);
  return new File([copy], item.filename, { type: item.mime });
}

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

function canShareFile(file: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  return typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] });
}

function shareWasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function saveFiles(files: DownloadFile[]): Promise<void> {
  for (const item of files) {
    const file = toBrowserFile(item);
    const objectUrl = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }
}

export function DownloadSheet({
  open,
  onClose,
  wallpaperId,
  accessType,
  isPremiumUser,
  isLive = false,
  deviceType = "phone",
}: {
  open: boolean;
  onClose: () => void;
  wallpaperId: string;
  accessType: AccessType;
  isPremiumUser: boolean;
  isLive?: boolean;
  deviceType?: DeviceType;
}) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "saving" | "ready" | "guide" | "error">("idle");
  const [adSessionId, setAdSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [readyFile, setReadyFile] = useState<DownloadFile | null>(null);
  const autoStartedRef = useRef(false);

  void accessType;
  void isPremiumUser;

  function recordDownload(delivery: "ios" | "mobile" | "browser", live = false, pack = false) {
    trackEvent("download", {
      wallpaperId,
      metadata: { device: deviceType, live, pack, delivery },
    });
  }

  async function deliverPreparedFile() {
    if (!readyFile) return;

    try {
      if (isIOSDevice()) {
        const file = toBrowserFile(readyFile);
        if (canShareFile(file)) {
          try {
            await navigator.share({ files: [file] });
            recordDownload("ios");
            onClose();
            return;
          } catch (error) {
            if (shareWasCancelled(error)) return;
          }
        }
      }

      await saveFiles([readyFile]);
      recordDownload(isMobileDevice() ? "mobile" : "browser");
      onClose();
    } catch {
      setPhase("error");
      setMessage(t.download.failed);
    }
  }

  async function finish(sessionId?: string, pack = false) {
    setPhase("saving");
    setMessage(null);

    try {
      const res = await requestDownload({
        data: {
          wallpaperId,
          source: "details",
          adSessionId: sessionId ?? adSessionId ?? undefined,
        },
      });

      if (res.status === "needs_auth") {
        void navigate({ to: "/login", search: { next: `/wallpaper/${wallpaperId}` } });
        return;
      }
      if (res.status === "needs_premium") {
        void navigate({ to: "/app" });
        return;
      }
      if (res.status === "needs_ad") {
        if (sessionId) {
          setPhase("error");
          setMessage(t.download.failed);
          return;
        }
        const session = await createAdSession({ data: { wallpaperId } });
        setAdSessionId(session.adSessionId);
        await finish(session.adSessionId, pack);
        return;
      }
      if (res.status === "rate_limited") {
        setPhase("error");
        setMessage(t.download.rateLimited);
        return;
      }
      if (res.status === "error") {
        setPhase("error");
        setMessage(res.message);
        return;
      }

      if (res.isLive && res.stillUrl && res.stillFilename) {
        const [video, still] = await Promise.all([
          fetchBytes(res.url, 2),
          fetchBytes(res.stillUrl, 2),
        ]);
        const id = liveAssetId();
        const mov = injectLiveMov(video, id);
        const jpg = injectLiveJpeg(still, id);

        if (pack) {
          const zip = zipStore([
            { name: res.stillFilename, data: jpg },
            { name: res.filename, data: mov },
          ]);
          const stem = res.filename.replace(/\.[^.]+$/, "");
          await saveFiles([
            { data: zip, filename: `${stem}-iphone-live.zip`, mime: "application/zip" },
          ]);
        } else {
          await saveFiles([
            { data: jpg, filename: res.stillFilename, mime: "image/jpeg" },
            { data: mov, filename: res.filename, mime: "video/quicktime" },
          ]);
        }

        recordDownload(isIOSDevice() ? "ios" : "browser", true, pack);
        setPhase("guide");
        return;
      }

      const bytes = await fetchBytes(res.url, 2);
      const file: DownloadFile = {
        data: bytes,
        filename: res.filename,
        mime: res.mime || "image/jpeg",
      };

      if (isMobileDevice()) {
        setReadyFile(file);
        setPhase("ready");
        return;
      }

      await saveFiles([file]);
      recordDownload("browser");
      onClose();
    } catch {
      setPhase("error");
      setMessage(t.download.failed);
    }
  }

  useEffect(() => {
    autoStartedRef.current = false;
  }, [wallpaperId]);

  useEffect(() => {
    if (!open) {
      autoStartedRef.current = false;
      setPhase("idle");
      setMessage(null);
      setAdSessionId(null);
      setReadyFile(null);
      return;
    }

    if (!isLive && !autoStartedRef.current) {
      autoStartedRef.current = true;
      void finish();
    }
  }, [open, isLive, wallpaperId]);

  if (!open) return null;

  const preparing = !isLive && (phase === "idle" || phase === "saving");
  const ios = isIOSDevice();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="mw-backdrop absolute inset-0 bg-bg/70"
        aria-label={t.close}
        onClick={() => {
          if (phase !== "saving") onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-title"
        className="mw-sheet relative z-10 w-full max-w-md rounded-t-[24px] bg-surface p-6 shadow-[var(--shadow-border)] sm:rounded-[24px]"
      >
        <h2 id="download-title" className="font-display text-2xl text-fg">
          {isLive ? t.download.liveTitle : t.download.title}
        </h2>

        {preparing ? (
          <div className="mt-4 py-4">
            <p className="text-sm text-muted">Preparing your wallpaper…</p>
            <p className="mt-1 text-xs text-subtle">Keep this open for a moment.</p>
          </div>
        ) : phase === "guide" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-fg">{t.download.saved}</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>{t.download.iphone1}</li>
              <li>{t.download.iphone2}</li>
              <li>{t.download.iphone3}</li>
              <li>{t.download.iphone4}</li>
            </ol>
            <Button className="w-full" onClick={onClose}>
              {t.done}
            </Button>
          </div>
        ) : phase === "ready" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              {ios
                ? "Ready. Tap below, then choose Save Image to put it in Photos."
                : "Ready. Tap below to save the wallpaper to your device."}
            </p>
            {message ? <p className="text-sm text-danger">{message}</p> : null}
            <Button className="w-full" onClick={() => void deliverPreparedFile()}>
              {ios ? "Save to Photos" : "Download wallpaper"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        ) : phase === "error" ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-danger">{message || t.download.failed}</p>
            <Button className="w-full" onClick={() => void finish()}>
              Try again
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">{t.download.liveDirect}</p>
            <Button
              className="w-full"
              disabled={phase === "saving"}
              onClick={() => void finish()}
            >
              {phase === "saving" ? t.download.saving : t.download.saveIphone}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={phase === "saving"}
              onClick={() => void finish(undefined, true)}
            >
              {t.download.savePack}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
