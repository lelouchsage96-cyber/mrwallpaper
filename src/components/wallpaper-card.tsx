import { FavoriteButton } from "@/components/favorite-button";
import { LazyImage } from "@/components/lazy";
import { deviceBadge, isLandscape } from "@/lib/device";
import { t } from "@/lib/i18n/en";
import { wallpaperAlt, wallpaperPath } from "@/lib/seo";
import type { WallpaperCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WallpaperCard({
  wallpaper,
  onFavorite,
  priority,
}: {
  wallpaper: Card;
  onFavorite?: (id: string, next: boolean) => void;
  priority?: boolean;
}) {
  const landscape = isLandscape(wallpaper.width, wallpaper.height);
  const badge = deviceBadge(wallpaper.deviceType);
  const href = wallpaperPath(wallpaper.slug || wallpaper.id);
  const alt = wallpaperAlt({
    title: wallpaper.title,
    categoryName: wallpaper.categoryName,
    deviceType: wallpaper.deviceType,
    altText: wallpaper.altText,
  });
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[16px] bg-elevated",
        landscape && "col-span-2",
      )}
    >
      <a href={href} className="block">
        <div
          className="overflow-hidden"
          style={{ aspectRatio: `${wallpaper.width} / ${wallpaper.height}` }}
        >
          <LazyImage
            src={wallpaper.thumbnailUrl}
            alt={alt}
            width={wallpaper.width}
            height={wallpaper.height}
            sizes={
              landscape
                ? "(min-width: 1024px) 50vw, (min-width: 640px) 66vw, 100vw"
                : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            }
            priority={priority}
            className="wallpaper-img size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] group-active:scale-[0.99]"
          />
        </div>
      </a>
      {badge ? (
        <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg backdrop-blur-sm">
          {badge}
        </span>
      ) : wallpaper.accessType === "premium" ? (
        <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg backdrop-blur-sm">
          {t.wallpaper.premiumBadge}
        </span>
      ) : null}
      <FavoriteButton
        wallpaperId={wallpaper.id}
        isFavorite={wallpaper.isFavorite}
        onChange={(next) => onFavorite?.(wallpaper.id, next)}
        className="absolute right-1.5 top-1.5 size-10"
      />
    </article>
  );
}

export function WallpaperCardSkeleton({
  className,
  landscape = false,
}: {
  className?: string;
  landscape?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] bg-elevated", landscape && "col-span-2", className)}>
      <div className={cn("animate-pulse bg-surface", landscape ? "aspect-[4/3]" : "aspect-[9/16]")} />
    </div>
  );
}
