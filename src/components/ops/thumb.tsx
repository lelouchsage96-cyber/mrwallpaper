import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LazyImage } from "@/components/lazy";
import { plateFallback, wallpaperFile } from "@/lib/media";
import { cn } from "@/lib/utils";

function opsHero(src: string, id?: string) {
  const fromPlate = plateFallback(src);
  if (fromPlate) return fromPlate;
  if (src.includes("/api/media/")) {
    return src.replace("-thumb", "-prev").replace("-orig", "-prev");
  }
  if (id) return wallpaperFile(id);
  return src;
}

export function OpsThumb({
  src,
  alt,
  id,
  size = "md",
}: {
  src: string;
  alt: string;
  id?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const hero = opsHero(src, id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={alt}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "wallpaper-img shrink-0 overflow-hidden rounded-sm bg-surface",
          size === "sm" ? "h-16 w-9" : "h-28 w-16",
        )}
      >
        <LazyImage
          src={src}
          fallback={hero}
          alt=""
          width={size === "sm" ? 36 : 64}
          height={size === "sm" ? 64 : 112}
          className="size-full object-cover"
        />
      </button>
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-6"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={() => setOpen(false)}
            >
              <img
                src={hero}
                alt={alt}
                className="wallpaper-img max-h-[82dvh] w-auto max-w-[min(100%,420px)] rounded-lg object-contain"
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
