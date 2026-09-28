import { Link } from "@tanstack/react-router";
import { LazyImage } from "@/components/lazy";
import { cardSource, highQualityPreview } from "@/lib/wallpaper-card-media";
import { pfpAlt } from "@/lib/seo";
import type { WallpaperCard } from "@/lib/types";

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export function PfpGrid({
  items,
  eager = 0,
}: {
  items: WallpaperCard[];
  eager?: number;
}) {
  return (
    <div className={GRID_CLASSES}>
      {items.map((pfp, index) => {
        const source = cardSource(pfp);
        const sharpPreview = highQualityPreview(pfp, source, 1080);
        const srcSet = sharpPreview ? `${source} 480w, ${sharpPreview} 1080w` : undefined;
        const alt = pfpAlt({
          title: pfp.title,
          categoryName: pfp.categoryName,
          altText: pfp.altText,
        });

        return (
          <article
            key={pfp.id}
            className="group overflow-hidden rounded-[18px] bg-elevated ring-1 ring-border/70 transition-[transform,box-shadow] duration-200 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_14px_32px_rgba(0,0,0,0.18)] lg:hover:ring-fg/20"
          >
            <Link to="/pfp/$id" params={{ id: pfp.slug || pfp.id }} className="block">
              <div className="relative aspect-square overflow-hidden">
                <LazyImage
                  src={source}
                  srcSet={srcSet}
                  fallback={pfp.thumbnailUrl}
                  alt={alt}
                  width={pfp.width}
                  height={pfp.height}
                  sizes="(min-width: 1280px) 220px, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw"
                  priority={index < eager}
                  className="size-full object-cover transition-transform duration-300 ease-out lg:group-hover:scale-[1.025]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 pb-3 pt-10 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{pfp.title}</p>
                  <p className="mt-1 truncate text-xs text-white/70">{pfp.categoryName}</p>
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
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
