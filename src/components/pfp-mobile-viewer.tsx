import { ChevronLeft, Download, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { showActionToast } from "@/components/action-toast";
import { cardSource, highQualityPreview } from "@/lib/wallpaper-card-media";
import { pfpAlt, pfpPath } from "@/lib/seo";
import type { WallpaperCard } from "@/lib/types";

export function PfpMobileViewer({
  open,
  items,
  initialIndex,
  onClose,
  onDownload,
  onFavoriteChange,
}: {
  open: boolean;
  items: WallpaperCard[];
  initialIndex: number;
  onClose: () => void;
  onDownload: (item: WallpaperCard) => void;
  onFavoriteChange: (id: string, next: boolean) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setActiveIndex(initialIndex);

    const frame = window.requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      scroller.scrollTo({
        top: initialIndex * scroller.clientHeight,
        behavior: "auto",
      });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [open, initialIndex, onClose]);

  if (!open || items.length === 0) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), items.length - 1);
  const active = items[safeIndex];

  async function shareActive() {
    const url = window.location.origin + pfpPath(active.slug || active.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: active.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showActionToast("Link copied");
    } catch {
      // Native share cancellation should stay quiet.
    }
  }

  function handleScroll() {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const scroller = scrollerRef.current;
      if (!scroller || scroller.clientHeight === 0) return;
      const next = Math.round(scroller.scrollTop / scroller.clientHeight);
      setActiveIndex(Math.min(Math.max(next, 0), items.length - 1));
    });
  }

  return (
    <div
      className="fixed inset-0 z-[45] bg-black text-white lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen PFP viewer"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/80 via-black/45 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to PFPs"
          className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md active:scale-[0.96]"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">{active.title}</p>
        <button
          type="button"
          onClick={() => void shareActive()}
          aria-label="Share PFP"
          className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md active:scale-[0.96]"
        >
          <Share2 className="size-5" strokeWidth={1.75} />
        </button>
        <div className="pointer-events-auto">
          <FavoriteButton
            wallpaperId={active.id}
            isFavorite={active.isFavorite}
            loginNext={pfpPath(active.slug || active.id)}
            onChange={(next) => onFavoriteChange(active.id, next)}
            className="bg-black/40 text-white"
          />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        {items.map((pfp) => {
          const source = cardSource(pfp);
          const preview = highQualityPreview(pfp, source, 1080) || source;
          const alt = pfpAlt({
            title: pfp.title,
            categoryName: pfp.categoryName,
            altText: pfp.altText,
          });

          return (
            <section
              key={pfp.id}
              className="flex h-full snap-start snap-always items-center justify-center px-4 pb-28 pt-20"
              aria-label={pfp.title}
            >
              <div className="w-full max-w-lg">
                <img
                  src={preview}
                  alt={alt}
                  width={pfp.width}
                  height={pfp.height}
                  className="aspect-square w-full select-none rounded-2xl object-cover"
                  draggable={false}
                  decoding="async"
                />
              </div>
            </section>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
        <p className="mb-3 text-center text-xs text-white/70">
          Swipe up or down to browse · {safeIndex + 1} of {items.length}
        </p>
        <button
          type="button"
          onClick={() => onDownload(active)}
          className="pointer-events-auto mx-auto flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black active:scale-[0.99]"
        >
          <Download className="size-4" />
          Download PFP
        </button>
      </div>
    </div>
  );
}
