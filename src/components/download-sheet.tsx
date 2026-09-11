import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { t } from "@/lib/i18n/en";
import { injectLiveJpeg, injectLiveMov, liveAssetId, zipStore } from "@/lib/live-photo";
import { createAdSession, requestDownload } from "@/lib/server/api";
import { downloadLabel, type DeviceType } from "@/lib/device";
import type { AccessType } from "@/lib/types";

type DownloadFile = { data: Uint8Array; filename: string; mime: string };

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch");
  return new Uint8Array(await res.arrayBuffer());
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

function canShareFile(file: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  return typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] });
}

function shareWasCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function hasActiveUserGesture(): boolean {
  if (typeof navigator === "undefined") return false;
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  return activation?.isActive ?? true;
}

async function tryIOSImageShare(item: DownloadFile): Promise<"shared" | "cancelled" | "ready" | "unsupported"> {
  if (!isIOSDevice() || !item.mime.startsWith("image/")) return "unsupported";

  const file = toBrowserFile(item);
  if (!canShareFile(file)) return "unsupported";

  if (!hasActiveUserGesture()) return "ready";

  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (error) {
    if (shareWasCancelled(error)) return "cancelled";
    return "ready";
  }
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
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
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
  const [iosReadyFile, setIosReadyFile] = useState<DownloadFile | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setMessage(null);
      setAdSessionId(null);
      setIosReadyFile(null);
    }
  }, [open]);

  if (!open) return null;

  async function sharePreparedIOSFile() {
    if (!iosReadyFile) return;

    const file = toBrowserFile(iosReadyFile);
    if (!canShareFile(file)) {
      try {
        await saveFiles([iosReadyFile]);
        onClose();
      } catch {
        setPhase("error");
        setMessage(t.download.failed);
      }
      return;
    }

    try {
      await navigator.share({ files: [file] });
      onClose();
    } catch (error) {
      if (shareWasCancelled(error)) return;
      try {
        await saveFiles([iosReadyFile]);
        onClose();
      } catch {
        setPhase("error");
        setMessage(t.download.failed);
      }
    }
  }

  async function finish(sessionId?: string, pack = false) {
    setPhase("saving");
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

      trackEvent("download", {
        wallpaperId,
        metadata: {
          device: deviceType,
          live: res.isLive,
          pack,
          delivery: isIOSDevice() ? "ios" : "browser",
        },
      });

      if (res.isLive && res.stillUrl && res.stillFilename) {
        const [video, still] = await Promise.all([fetchBytes(res.url), fetchBytes(res.stillUrl)]);
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
        setPhase("guide");
        return;
      }

      const bytes = await fetchBytes(res.url);
      const downloadFile: DownloadFile = {
        data: bytes,
        filename: res.filename,
        mime: res.mime || "image/jpeg",
      };

      const iosShare = await tryIOSImageShare(downloadFile);
      if (iosShare === "shared") {
        onClose();
        return;
      }
      if (iosShare === "cancelled") {
        setPhase("idle");
        return;
      }
      if (iosShare === "ready") {
        setIosReadyFile(downloadFile);
        setPhase("ready");
        return;
      }

      await saveFiles([downloadFile]);
      onClose();
    } catch {
      setPhase("error");
      setMessage(t.download.failed);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="mw-backdrop absolute inset-0 bg-bg/70"
        aria-label={t.close}
        onClick={onClose}
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

        {phase === "guide" ? (
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
              Your wallpaper is ready. Tap below to open the iOS share sheet, then choose Save Image.
            </p>
            {message ? <p className="text-sm text-danger">{message}</p> : null}
            <Button className="w-full" onClick={() => void sharePreparedIOSFile()}>
              Save to Photos
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              {isLive ? t.download.liveDirect : t.download.freeDirect}
            </p>
            {message ? <p className="text-sm text-danger">{message}</p> : null}
            <Button
              className="w-full"
              disabled={phase === "saving"}
              onClick={() => void finish()}
            >
              {phase === "saving"
                ? t.download.saving
                : isLive
                  ? t.download.saveIphone
                  : downloadLabel(deviceType)}
            </Button>
            {isLive ? (
              <Button
                variant="secondary"
                className="w-full"
                disabled={phase === "saving"}
                onClick={() => void finish(undefined, true)}
              >
                {t.download.savePack}
              </Button>
            ) : null}
            <Button variant="ghost" className="w-full" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}