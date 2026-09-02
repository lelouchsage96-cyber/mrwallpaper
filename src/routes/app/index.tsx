import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { PairCard } from "@/components/pair-card";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { LazyImage, LazyMount } from "@/components/lazy";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { getHomeFeed, saveTaste } from "@/lib/server/api";
import { getSelectedWallpaperOfDay } from "@/lib/server/wotd";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { readLocalTaste } from "@/lib/taste";
import { shuffleTrendingByViews, trendingSlot } from "@/lib/trending";
import type { HomePayload, WallpaperCard as Card } from "@/lib/types";
import { resolveHero, plateFallback } from "@/lib/media";
import { pageHead } from "@/lib/seo";

const APP_HOME_TITLE = "Free HD & 4K Wallpapers for Phone & Tablet | Mr Wallpapers";
const APP_HOME_DESCRIPTION =
  "Download free HD and 4K wallpapers for iPhone, Android, iPad and tablets. Explore aesthetic, motivational, Bible verse, anime, dark and more wallpapers.";

async function loadHomeFeed(tasteIds?: string[]): Promise<HomePayload> {
  const [feed, selectedWotd] = await Promise.all([
    getHomeFeed({ data: tasteIds ? { tasteIds } : {} }),
    getSelectedWallpaperOfDay(),
  ]);
  return selectedWotd ? { ...feed, wotd: selectedWotd } : feed;
}

export const Route = createFileRoute("/app/")({
  head: () =>
    pageHead({
      title: APP_HOME_TITLE,
      description: APP_HOME_DESCRIPTION,
      path: "/app",
    }),
  loader: () => loadHomeFeed(),
  staleTime: 15_000,
  component: HomePage,
});

function patchFav(list: Card[], id: string, next: boolean): Card[] {
  return list.map((w) =>
    w.id === id
      ? { ...w, isFavorite: next, favoriteCount: w.favoriteCount + (next ? 1 : -1) }
      : w,
  );
}

function HomePage() {
  const initial = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<HomePayload | null>(initial);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [slot, setSlot] = useState<number | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    setSlot(trendingSlot());
    const id = window.setInterval(() => setSlot(trendingSlot()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (isPending) return;
    const tasteIds = readLocalTaste();
    let cancelled = false;
    void loadHomeFeed(tasteIds)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(false);
        if (userId && !d.hasTaste && tasteIds.length >= 3) {
          void saveTaste({ data: { categoryIds: tasteIds } }).catch(() => undefined);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isPending, tick]);

  const trending = useMemo(() => {
    const list = data?.trending ?? [];
    if (slot == null) return list.slice(0, 8);
    return shuffleTrendingByViews(list, slot, 8);
  }, [data?.trending, slot]);

  const categoryThumbs = useMemo(() => {
    const thumbs = new Map<string, string>();
    if (!data) return thumbs;
    const pool = [
      ...data.recommended,
      ...data.trending,
      ...data.fresh,
      ...(data.tablet ?? []),
      ...data.editors,
      ...data.recent,
      ...data.premium,
    ];
    if (data.wotd) pool.unshift(data.wotd);
    for (const wallpaper of pool) {
      if (!thumbs.has(wallpaper.categoryId) && wallpaper.thumbnailUrl) {
        thumbs.set(wallpaper.categoryId, wallpaper.thumbnailUrl);
      }
    }
    return thumbs;
  }, [data]);

  const wotdHero = data?.wotd ? resolveHero(data.wotd.id, data.wotd.thumbnailUrl) : null;

  function onFavorite(id: string, next: boolean) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        wotd: prev.wotd && prev.wotd.id === id
          ? { ...prev.wotd, isFavorite: next }
          : prev.wotd,
        trending: patchFav(prev.trending, id, next),
        fresh: patchFav(prev.fresh, id, next),
        recommended: patchFav(prev.recommended, id, next),
        editors: patchFav(prev.editors, id, next),
        premium: patchFav(prev.premium, id, next),
        recent: patchFav(prev.recent, id, next),
        tablet: patchFav(prev.tablet ?? [], id, next),
      };
    });
  }

  if (error && !data) return <ErrorState onRetry={() => setTick((n) => n + 1)} />;

  return (
    <div className="mw-enter px-4 pt-5">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.22em] text-muted uppercase">{brand.tagline}</p>
          <h1 className="font-display text-3xl text-fg">{brand.name}</h1>
          <p className="mt-1 max-w-sm text-sm text-muted">{brand.positioning}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/app/explore"
            aria-label={t.home.search}
            className="grid size-11 place-items-center rounded-[12px] text-fg"
          >
            <Search className="size-5" strokeWidth={1.75} />
          </Link>
          <Link
            to="/app/notifications"
            aria-label={t.home.notifications}
            className="relative grid size-11 place-items-center rounded-md text-fg"
          >
            <Bell className="size-5" strokeWidth={1.75} />
            {data && data.unreadCount > 0 ? (
              <span className="absolute top-2 right-2 size-2.5 rounded-full bg-fg ring-2 ring-bg" />
            ) : null}
          </Link>
        </div>
      </header>

      {!data ? (
        <div className="space-y-8">
          <Skeleton className="aspect-[4/5] w-full rounded-[24px]" />
          <WallpaperGridSkeleton />
        </div>
      ) : (
        <div className="space-y-10">
          {!data.hasTaste && readLocalTaste().length < 3 ? (
            <Link
              to="/app/taste"
              className="block rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]"
            >
              <p className="text-xs tracking-[0.18em] text-subtle uppercase">{t.preview.live}</p>
              <p className="mt-1 font-display text-2xl text-fg">{t.taste.bannerTitle}</p>
              <p className="mt-1 text-sm text-muted">{t.taste.bannerBody}</p>
              <span className="mt-3 inline-flex h-11 items-center rounded-full bg-fg px-4 text-sm text-bg">
                {t.taste.cta}
              </span>
            </Link>
          ) : null}

          {data.wotd ? (
            <section>
              <SectionHeader title={t.home.wotd} />
              <Link
                to="/wallpaper/$id"
                params={{ id: data.wotd.id }}
                className="relative block overflow-hidden rounded-[24px] bg-elevated"
              >
                <div className="aspect-[4/5] sm:aspect-[16/10]">
                  <LazyImage
                    src={wotdHero ?? `/wallpapers/${data.wotd.id}.jpg`}
                    srcSet={`${wotdHero ?? `/wallpapers/${data.wotd.id}.jpg`} 1080w`}
                    sizes="(min-width: 1024px) 1024px, 100vw"
                    alt={data.wotd.title}
                    width={1080}
                    height={1920}
                    priority
                    fallback={`/wallpapers/${data.wotd.id}.jpg`}
                    className="wallpaper-img size-full object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/80 to-transparent p-5">
                  <p className="text-xs tracking-[0.18em] text-fg/70 uppercase">{t.home.wotd}</p>
                  <p className="mt-1 font-display text-2xl text-fg">{data.wotd.title}</p>
                </div>
              </Link>
            </section>
          ) : null}

          {data.recommended.length > 0 ? (
            <section>
              <SectionHeader title={t.home.forYou} />
              <WallpaperGrid items={data.recommended} onFavorite={onFavorite} eager={4} />
            </section>
          ) : null}

          <section>
            <SectionHeader title={t.home.trending} to="/app/explore" search={{ device: "phone" }} />
            <WallpaperGrid items={trending} onFavorite={onFavorite} eager={4} />
          </section>

          <section>
            <SectionHeader title={t.home.fresh} to="/app/explore" search={{ device: "phone" }} />
            <WallpaperGrid items={data.fresh} onFavorite={onFavorite} eager={2} />
          </section>

          {(data.tablet ?? []).length > 0 ? (
            <section>
              <SectionHeader title={t.home.tablet} to="/app/explore" search={{ device: "tablet" }} />
              <WallpaperGrid items={data.tablet ?? []} onFavorite={onFavorite} eager={2} />
            </section>
          ) : null}

          <section>
            <SectionHeader title={t.home.categories} />
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {data.categories.map((c) => {
                const preview = c.coverUrl || categoryThumbs.get(c.id) || null;
                return (
                  <Link
                    key={c.id}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    className="relative h-28 w-36 shrink-0 overflow-hidden rounded-[16px] bg-elevated"
                  >
                    {preview ? (
                      <LazyImage
                        src={preview}
                        alt={`${c.name} wallpaper preview`}
                        fallback={plateFallback(preview)}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full bg-elevated" aria-hidden />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-bg/55 px-2.5 py-2 text-sm font-medium text-fg backdrop-blur-sm">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {data.collections.length > 0 ? (
            <section>
              <SectionHeader title={t.home.collections} />
              <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {data.collections.map((col) => (
                  <Link
                    key={col.id}
                    to="/collection/$slug"
                    params={{ slug: col.slug }}
                    className="relative h-40 w-52 shrink-0 overflow-hidden rounded-[20px] bg-elevated"
                  >
                    {col.coverUrl ? (
                      <LazyImage
                        src={col.coverUrl}
                        alt=""
                        fallback={plateFallback(col.coverUrl)}
                        className="size-full object-cover"
                      />
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/85 to-transparent px-3 pb-2.5 pt-8">
                      <span className="block text-sm font-medium text-fg">{col.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-fg/70">
                        {t.home.wallpaperCount.replace("{n}", String(col.wallpaperCount))}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {(data.pairs ?? []).length > 0 ? (
            <LazyMount minHeight={280} eager>
              <section>
                <SectionHeader title={t.home.pairs} />
                <p className="mb-3 text-sm text-muted">{t.pairs.homeHint}</p>
                <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {data.pairs.map((pair) => (
                    <PairCard key={pair.id} pair={pair} />
                  ))}
                </div>
              </section>
            </LazyMount>
          ) : null}

          {data.editors.length > 0 ? (
            <section>
              <SectionHeader title={t.home.editors} />
              <WallpaperGrid items={data.editors} onFavorite={onFavorite} eager={2} />
            </section>
          ) : null}

          {data.recent.length > 0 ? (
            <section>
              <SectionHeader title={t.home.recent} />
              <WallpaperGrid items={data.recent} onFavorite={onFavorite} />
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
