import { WallpaperCard, WallpaperCardSkeleton } from "@/components/wallpaper-card";
import type { WallpaperCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WallpaperGrid({
  items,
  onFavorite,
  eager = 0,
}: {
  items: Card[];
  onFavorite?: (id: string, next: boolean) => void;
  eager?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((w, i) => (
        <WallpaperCard
          key={w.id}
          wallpaper={w}
          onFavorite={onFavorite}
          priority={i < eager}
        />
      ))}
    </div>
  );
}

export function WallpaperGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4")}>
      {Array.from({ length: count }, (_, i) => (
        <WallpaperCardSkeleton key={i} />
      ))}
    </div>
  );
}
