import { WallpaperCard, WallpaperCardSkeleton } from "@/components/wallpaper-card";
import type { WallpaperCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

const GRID_CLASSES = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6";

export function WallpaperGrid({
  items,
  onFavorite,
  eager = 0,
  feature,
}: {
  items: Card[];
  onFavorite?: (id: string, next: boolean) => void;
  eager?: number;
  feature?: { id: string; label: string };
}) {
  return (
    <div className={GRID_CLASSES}>
      {items.map((w, i) => (
        <WallpaperCard
          key={w.id}
          wallpaper={w}
          onFavorite={onFavorite}
          priority={i < eager}
          featureLabel={feature?.id === w.id ? feature.label : undefined}
        />
      ))}
    </div>
  );
}

export function WallpaperGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={cn(GRID_CLASSES)}>
      {Array.from({ length: count }, (_, i) => (
        <WallpaperCardSkeleton key={i} />
      ))}
    </div>
  );
}
