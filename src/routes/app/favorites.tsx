import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { InfiniteSentinel } from "@/components/lazy";
import { PfpGrid, PfpGridSkeleton } from "@/components/pfp-grid";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { listFavorites } from "@/lib/server/api";
import type { FavoriteItem } from "@/lib/types";

export const Route = createFileRoute("/app/favorites")({ component: FavoritesPage });

function FavoritesPage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  const userId = user?.id ?? null;
  const wallpaperItems = items.filter((item) => item.contentType === "wallpaper");
  const pfpItems = items.filter((item) => item.contentType === "pfp");

  function removeFavorite(id: string, next: boolean) {
    if (!next) setItems((current) => current.filter((item) => item.id !== id));
  }

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
      <div className="px-4 pt-5 lg:px-6 lg:pt-5 xl:px-8">
        <h1 className="font-display text-3xl text-fg lg:hidden">{t.favorites.title}</h1>
        <div className="mt-5 space-y-8 lg:mt-0">
          <WallpaperGridSkeleton />
          <PfpGridSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 pt-5 lg:px-6 lg:pt-5 xl:px-8">
        <h1 className="font-display text-3xl text-fg lg:hidden">{t.favorites.title}</h1>
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
    <div className="px-4 pt-5 lg:px-6 lg:pt-5 xl:px-8">
      <h1 className="font-display text-3xl text-fg lg:hidden">{t.favorites.title}</h1>
      <div className="mt-5 lg:mt-0">
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
            <div className="space-y-10">
              {wallpaperItems.length > 0 ? (
                <section aria-labelledby="favorite-wallpapers-heading">
                  {pfpItems.length > 0 ? (
                    <h2 id="favorite-wallpapers-heading" className="mb-4 font-display text-2xl text-fg">
                      Wallpapers
                    </h2>
                  ) : null}
                  <WallpaperGrid
                    items={wallpaperItems}
                    eager={4}
                    onFavorite={removeFavorite}
                  />
                </section>
              ) : null}

              {pfpItems.length > 0 ? (
                <section aria-labelledby="favorite-pfps-heading">
                  <h2 id="favorite-pfps-heading" className="mb-4 font-display text-2xl text-fg">
                    PFPs
                  </h2>
                  <PfpGrid
                    items={pfpItems}
                    eager={4}
                    onFavorite={removeFavorite}
                  />
                </section>
              ) : null}
            </div>
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
