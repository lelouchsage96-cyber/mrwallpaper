import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { InfiniteSentinel } from "@/components/lazy";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { searchWallpapers } from "@/lib/server/api";
import type { WallpaperCard } from "@/lib/types";

type FeedSort = "latest" | "trending";
type FeedDevice = "phone" | "tablet" | "all";

export function WallpaperFeedPage({
  title,
  description,
  sort,
  device,
}: {
  title: string;
  description?: string;
  sort: FeedSort;
  device: FeedDevice;
}) {
  const [items, setItems] = useState<WallpaperCard[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  function load(reset: boolean) {
    if (busy.current) return;
    busy.current = true;
    if (reset) setLoading(true);
    setError(false);
    const nextOffset = reset ? 0 : offset;

    void searchWallpapers({
      data: {
        sort,
        device,
        offset: nextOffset,
      },
    })
      .then((res) => {
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setOffset(res.offset);
        setHasMore(res.hasMore);
      })
      .catch(() => setError(true))
      .finally(() => {
        busy.current = false;
        setLoading(false);
      });
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, device]);

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-3xl text-fg">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p> : null}

      <div className="mt-5">
        {error ? (
          <ErrorState onRetry={() => load(true)} />
        ) : loading && items.length === 0 ? (
          <WallpaperGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <EmptyState title="No wallpapers found yet." />
        ) : (
          <>
            <WallpaperGrid
              items={items}
              eager={4}
              onFavorite={(id, next) =>
                setItems((prev) => prev.map((w) => (w.id === id ? { ...w, isFavorite: next } : w)))
              }
            />
            <InfiniteSentinel disabled={!hasMore || loading} onLoad={() => load(false)} />
            {hasMore && loading ? (
              <div className="mt-4">
                <WallpaperGridSkeleton count={2} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
