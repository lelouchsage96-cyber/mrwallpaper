import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { InfiniteSentinel } from "@/components/lazy";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { listFavorites } from "@/lib/server/api";
import type { WallpaperCard } from "@/lib/types";

export const Route = createFileRoute("/app/favorites")({ component: FavoritesPage });

function FavoritesPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [items, setItems] = useState<WallpaperCard[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  const userId = user?.id ?? null;

  function load(reset: boolean) {
    if (!reset && busy.current) return;
    busy.current = true;
    if (reset && items.length === 0) setLoading(true);
    setError(false);
    const nextOffset = reset ? 0 : offset;
    void listFavorites({ data: { offset: nextOffset } })
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
    if (isPending || !userId) {
      if (!isPending && !userId) setLoading(false);
      return;
    }
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isPending]);

  if (isPending) {
    return (
      <div className="px-4 pt-5">
        <h1 className="font-display text-3xl text-fg">{t.favorites.title}</h1>
        <div className="mt-5">
          <WallpaperGridSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 pt-5">
        <h1 className="font-display text-3xl text-fg">{t.favorites.title}</h1>
        <EmptyState
          title={t.favorites.signIn}
          action={{
            label: t.auth.signIn,
            onClick: () => {
              void navigate({ to: "/login", search: { next: "/app/favorites" } });
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-3xl text-fg">{t.favorites.title}</h1>
      <div className="mt-5">
        {error ? (
          <ErrorState onRetry={() => load(true)} />
        ) : loading && items.length === 0 ? (
          <WallpaperGridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            title={t.favorites.empty}
            action={{
              label: t.nav.explore,
              onClick: () => {
                void navigate({ to: "/app/explore" });
              },
            }}
          />
        ) : (
          <>
            <WallpaperGrid
              items={items}
              eager={4}
              onFavorite={(id, next) => {
                if (!next) setItems((prev) => prev.filter((w) => w.id !== id));
              }}
            />
            <InfiniteSentinel disabled={!hasMore || loading} onLoad={() => load(false)} />
            {hasMore && loading ? <div className="mt-4"><WallpaperGridSkeleton count={2} /></div> : null}
          </>
        )}
      </div>
    </div>
  );
}
