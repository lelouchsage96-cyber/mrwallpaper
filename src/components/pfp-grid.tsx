import { Link } from "@tanstack/react-router";
import { useMemo, useState, type MouseEvent } from "react";
import { DownloadSheet } from "@/components/download-sheet";
import { FavoriteButton } from "@/components/favorite-button";
import { LazyImage } from "@/components/lazy";
import { PfpMobileViewer } from "@/components/pfp-mobile-viewer";
import { cardSource, highQualityPreview } from "@/lib/wallpaper-card-media";
import { pfpAlt } from "@/lib/seo";
import type { WallpaperCard } from "@/lib/types";

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5";

export function PfpGrid({
  items,
  eager = 0,
  onFavorite,
}: {
  items: WallpaperCard[];
  eager?: number;
  onFavorite?: (id: string, next: boolean) => void;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [downloadItem, setDownloadItem] = useState<WallpaperCard | null>(null);
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});

  const displayItems = useMemo(
    () =>
      items.map((item) =>
        Object.prototype.hasOwnProperty.call(favoriteOverrides, item.id)
          ? { ...item, isFavorite: favoriteOverrides[item.id] }
          : item,
      ),
    [items, favoriteOverrides],
  );

  function setFavorite(id: string, next: boolean) {
    setFavoriteOverrides((current) => ({ ...current, [id]: next }));
    onFavorite?.(id, next);
  }

  function openMobileViewer(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      typeof window === "undefined" ||
      window.matchMedia("(min-width: 1024px)").matches
    ) {
      return;
    }

    event.preventDefault();
    setViewerIndex(index);
  }

  return (
    <>
      <div className={GRID_CLASSES}>
        {displayItems.map((pfp, index) => {
          const source = cardSource(pfp);
          const sharpPreview = highQualityPreview(pfp, source, 1080);
          const srcSet = sharpPreview ? source + " 480w, " + sharpPreview + " 1080w" : undefined;
          const alt = pfpAlt({
            title: pfp.title,
            categoryName: pfp.categoryName,
            altText: pfp.altText,
          });

          return (
            <article
              key={pfp.id}
              className="group relative overflow-hidden rounded-[18px] bg-elevated ring-1 ring-border/70 transition-[transform,box-shadow] duration-200 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_14px_32px_rgba(0,0,0,0.18)] lg:hover:ring-fg/20"
            >
              <Link
                to="/pfp/$id"
                params={{ id: pfp.slug || pfp.id }}
                className="block"
                onClick={(event) => openMobileViewer(event, index)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <LazyImage
                    src={source}
                    srcSet={srcSet}
                    fallback={pfp.thumbnailUrl}
                    alt={alt}
                    width={pfp.width}
                    height={pfp.height}
                    sizes="(min-width: 1280px) 250px, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw"
                    priority={index < eager}
                    className="size-full object-cover transition-transform duration-300 ease-out lg:group-hover:scale-[1.025]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 pb-3 pt-10 opacity-0 transition-opacity lg:block lg:group-hover:opacity-100">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{pfp.title}</p>
                    <p className="mt-1 truncate text-xs text-white/70">{pfp.categoryName}</p>
                  </div>
                </div>
              </Link>
              <FavoriteButton
                wallpaperId={pfp.id}
                isFavorite={pfp.isFavorite}
                loginNext={"/pfp/" + (pfp.slug || pfp.id)}
                onChange={(next) => setFavorite(pfp.id, next)}
                className="absolute right-1.5 top-1.5 size-10 bg-bg/70 lg:opacity-70 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
              />
            </article>
          );
        })}
      </div>

      <PfpMobileViewer
        open={viewerIndex !== null}
        items={displayItems}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        onDownload={(item) => setDownloadItem(item)}
        onFavoriteChange={setFavorite}
      />

      {downloadItem ? (
        <DownloadSheet
          open
          onClose={() => setDownloadItem(null)}
          wallpaperId={downloadItem.id}
          accessType={downloadItem.accessType}
          isPremiumUser={false}
          deviceType={downloadItem.deviceType}
        />
      ) : null}
    </>
  );
}

export function PfpGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="aspect-square animate-pulse rounded-[18px] bg-elevated" />
      ))}
    </div>
  );
}
