import { Star } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { LazyImage } from "@/components/lazy";
import { deviceBadge, isLandscape } from "@/lib/device";
import { t } from "@/lib/i18n/en";
import { cardSource, highQualityPreview } from "@/lib/wallpaper-card-media";
import { wallpaperAlt, wallpaperPath } from "@/lib/seo";
import type { WallpaperCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WallpaperCard({ wallpaper, onFavorite, priority, featureLabel, className }: {
  wallpaper: Card;
  onFavorite?: (id: string, next: boolean) => void;
  priority?: boolean;
  featureLabel?: string;
  className?: string;
}) {
  const landscape = isLandscape(wallpaper.width, wallpaper.height);
  const badge = deviceBadge(wallpaper.deviceType);
  const href = wallpaperPath(wallpaper.slug || wallpaper.id);
  const alt = wallpaperAlt({ title: wallpaper.title, categoryName: wallpaper.categoryName, deviceType: wallpaper.deviceType, altText: wallpaper.altText });
  const previewRatio = landscape ? "aspect-[16/10]" : wallpaper.deviceType === "tablet" ? "aspect-[3/4]" : "aspect-[9/16]";
  const source = cardSource(wallpaper);
  const sharpWidth = landscape ? 1440 : 1080;
  const sharpPreview = highQualityPreview(wallpaper, source, sharpWidth);
  const adaptiveSrcSet = sharpPreview ? `${source} 480w, ${sharpPreview} ${sharpWidth}w` : undefined;

  return (
    <article className={cn("group relative self-start overflow-hidden rounded-[16px] bg-elevated", landscape && "col-span-2", className)}>
      <a href={href} className="block">
        <div className={cn("relative overflow-hidden", previewRatio)}>
          <LazyImage
            src={source}
            srcSet={adaptiveSrcSet}
            fallback={wallpaper.thumbnailUrl}
            alt={alt}
            width={wallpaper.width}
            height={wallpaper.height}
            sizes={landscape
              ? "(min-width: 1280px) 410px, (min-width: 1024px) 38vw, (min-width: 640px) 66vw, 100vw"
              : "(min-width: 1280px) 200px, (min-width: 1024px) 18vw, (min-width: 640px) 33vw, 50vw"}
            priority={priority}
            className="wallpaper-img size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] group-active:scale-[0.99]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-3 pt-12 opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:block">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{wallpaper.title}</p>
            {wallpaper.categoryName ? <p className="mt-1 truncate text-xs text-white/70">{wallpaper.categoryName}</p> : null}
          </div>
        </div>
      </a>
      {featureLabel ? (
        <span className="pointer-events-none absolute left-2 top-2 inline-flex max-w-[calc(100%-3.75rem)] items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-black shadow-sm sm:left-2.5 sm:top-2.5 sm:text-[11px]">
          <Star className="size-3 shrink-0" fill="currentColor" strokeWidth={1.7} />
          <span className="truncate">{featureLabel}</span>
        </span>
      ) : badge ? (
        <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg backdrop-blur-sm">{badge}</span>
      ) : wallpaper.accessType === "premium" ? (
        <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg backdrop-blur-sm">{t.wallpaper.premiumBadge}</span>
      ) : null}
      <FavoriteButton wallpaperId={wallpaper.id} isFavorite={wallpaper.isFavorite} onChange={(next) => onFavorite?.(wallpaper.id, next)} className="absolute right-1.5 top-1.5 size-10" />
    </article>
  );
}

export function WallpaperCardSkeleton({ className, landscape = false }: { className?: string; landscape?: boolean }) {
  return (
    <div className={cn("self-start overflow-hidden rounded-[16px] bg-elevated", landscape && "col-span-2", className)}>
      <div className={cn("animate-pulse bg-surface", landscape ? "aspect-[16/10]" : "aspect-[9/16]")} />
    </div>
  );
}
