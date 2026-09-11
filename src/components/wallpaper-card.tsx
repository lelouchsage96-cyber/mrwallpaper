import { FavoriteButton } from "@/components/favorite-button";
import { LazyImage } from "@/components/lazy";
import { deviceBadge, isLandscape } from "@/lib/device";
import { t } from "@/lib/i18n/en";
import { wallpaperAlt, wallpaperPath } from "@/lib/seo";
import type { WallpaperCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

function cardSource(wallpaper: Card): string {
  const url = wallpaper.thumbnailUrl;
  if (!url) return url;
  try {
    const parsed = new URL(url, "https://mrwallpaper.org");
    if (/\/originals\//i.test(parsed.pathname)) {
      return `/media/${wallpaper.slug || wallpaper.id}-thumb.jpg`;
    }
  } catch {
    // Relative paths continue unchanged.
  }
  return url;
}

function highQualityPreview(wallpaper: Card, source: string): string | null {
  if (!source) return null;

  let path = source;
  try {
    path = new URL(source, "https://mrwallpaper.org").pathname;
  } catch {
    // Relative paths are already usable below.
  }

  const publicMediaThumb = path.match(/\/media\/(.+)-thumb\.(?:jpe?g|png|webp)$/i);
  if (publicMediaThumb) return `/media/${publicMediaThumb[1]}-preview.jpg`;

  if (path.startsWith("/api/media/") && /-thumb(?:\.|$)/i.test(path)) {
    return path.replace(/-thumb(?=\.|$)/i, "-prev");
  }

  const r2Thumb = path.match(/\/thumbs\/(.+?)-[a-f0-9]{8,}\.(?:jpe?g|png|webp)$/i);
  if (r2Thumb) return `/media/${wallpaper.slug || wallpaper.id}-preview.jpg`;

  const bundledThumb = path.match(/\/wallpapers\/thumbs\/([^/.]+)\.(?:jpe?g|png|webp)$/i);
  if (bundledThumb) return `/wallpapers/${bundledThumb[1]}.jpg`;

  return null;
}

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
  const previewRatio = landscape
    ? "aspect-[16/10]"
    : wallpaper.deviceType === "tablet"
      ? "aspect-[3/4]"
      : "aspect-[9/16]";
  const source = cardSource(wallpaper);
  const sharpPreview = highQualityPreview(wallpaper, source);
  const sharpWidth = landscape ? 1440 : 1080;
  const adaptiveSrcSet = sharpPreview
    ? `${source} 480w, ${sharpPreview} ${sharpWidth}w`
    : undefined;

  return (
    <article
      className={cn(
        "group relative self-start overflow-hidden rounded-[16px] bg-elevated",
        landscape && "col-span-2",
      )}
    >
      <a href={href} className="block">
        <div className={cn("overflow-hidden", previewRatio)}>
          <LazyImage
            src={source}
            srcSet={adaptiveSrcSet}
            fallback={wallpaper.thumbnailUrl}
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
    <div
      className={cn(
        "self-start overflow-hidden rounded-[16px] bg-elevated",
        landscape && "col-span-2",
        className,
      )}
    >
      <div className={cn("animate-pulse bg-surface", landscape ? "aspect-[16/10]" : "aspect-[9/16]")} />
    </div>
  );
}