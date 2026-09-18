import { ChevronLeft, ChevronRight, Download, Share2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { FavoriteButton } from "@/components/favorite-button";

export function MobileWallpaperViewer({
  open,
  src,
  alt,
  title,
  wallpaperId,
  isFavorite,
  hasNext,
  hasPrevious,
  onClose,
  onNext,
  onPrevious,
  onDownload,
  onShare,
  onFavoriteChange,
}: {
  open: boolean;
  src: string;
  alt: string;
  title: string;
  wallpaperId: string;
  isFavorite: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onDownload: () => void;
  onShare: () => void;
  onFavoriteChange: (next: boolean) => void;
}) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrevious) onPrevious();
      if (event.key === "ArrowRight" && hasNext) onNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, hasNext, hasPrevious, onClose, onNext, onPrevious]);

  if (!open) return null;

  function finishSwipe(clientX: number) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const delta = clientX - start;
    if (Math.abs(delta) < 64) return;
    if (delta < 0 && hasNext) onNext();
    if (delta > 0 && hasPrevious) onPrevious();
  }

  return (
    <div
      className="fixed inset-0 z-[45] bg-black text-white lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen wallpaper viewer"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        finishSwipe(event.changedTouches[0]?.clientX ?? 0);
      }}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/75 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full-screen preview"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md active:scale-[0.96]"
        >
          <X className="size-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">{title}</p>
        <button
          type="button"
          onClick={onShare}
          aria-label="Share wallpaper"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md active:scale-[0.96]"
        >
          <Share2 className="size-5" strokeWidth={1.75} />
        </button>
        <FavoriteButton
          wallpaperId={wallpaperId}
          isFavorite={isFavorite}
          onChange={onFavoriteChange}
          className="shrink-0 bg-black/35 text-white"
        />
      </div>

      <div className="flex h-full items-center justify-center px-2 pb-28 pt-20">
        <img
          key={wallpaperId}
          src={src}
          alt={alt}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
        <p className="mb-3 text-center text-xs text-white/65">
          Swipe to browse similar wallpapers
        </p>
        <div className="mx-auto flex max-w-md items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Previous wallpaper"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30 active:scale-[0.96]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black active:scale-[0.99]"
          >
            <Download className="size-4" />
            Download 4K
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next wallpaper"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30 active:scale-[0.96]"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
