import { WallpaperCard, WallpaperCardSkeleton } from "@/components/wallpaper-card";
import type { WallpaperCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

const GRID_CLASSES = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6";

export function WallpaperGrid({
  items,
  onFavorite,
  eager = 0,
  feature,
  features,
  mobileLimit,
}: {
  items: Card[];
  onFavorite?: (id: string, next: boolean) => void;
  eager?: number;
  feature?: { id: string; label: string };
  features?: Array<{ id: string; label: string }>;
  mobileLimit?: number;
}) {
  const featureLabels = new Map((features ?? []).map((item) => [item.id, item.label]));
  if (feature) featureLabels.set(feature.id, feature.label);

  return (
    <div className={GRID_CLASSES}>
      {items.map((w, i) => (
        <WallpaperCard
          key={w.id}
          wallpaper={w}
          onFavorite={onFavorite}
          priority={i < eager}
          featureLabel={featureLabels.get(w.id)}
          className={mobileLimit !== undefined && i >= mobileLimit ? "hidden lg:block" : undefined}
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
