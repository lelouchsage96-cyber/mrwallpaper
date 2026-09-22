import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { MobileSearchOverlay } from "@/components/smart-search";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { LazyImage } from "@/components/lazy";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { buildHomeDisplay } from "@/lib/home-display";
import { getHomeFeed, saveTaste } from "@/lib/server/api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { readLocalTaste } from "@/lib/taste";
import type { HomePayload, WallpaperCard as Card } from "@/lib/types";
import { categoryPreview, categoryPreviewFallback } from "@/lib/media";
import { pageHead } from "@/lib/seo";
import { readRecentlyViewed } from "@/lib/recently-viewed";
import { cn } from "@/lib/utils";

const APP_HOME_TITLE = "Free HD & 4K Wallpapers for Phone & Tablet | Mr Wallpapers";
const APP_HOME_DESCRIPTION = "Download free HD and 4K wallpapers for iPhone, Android, iPad and tablets. Explore aesthetic, motivational, Bible verse, anime, dark and more wallpapers.";

async function loadHomeFeed(tasteIds?: string[]): Promise<HomePayload> {
  return getHomeFeed({ data: tasteIds ? { tasteIds } : {} });
}

export const Route = createFileRoute("/app/")({
  head: () => pageHead({ title: APP_HOME_TITLE, description: APP_HOME_DESCRIPTION, path: "/app" }),
  loader: () => loadHomeFeed(),
  staleTime: 15_000,
  component: HomePage,
});

function patchFav(list: Card[], id: string, next: boolean): Card[] {
  return list.map((w) => w.id === id ? { ...w, isFavorite: next, favoriteCount: w.favoriteCount + (next ? 1 : -1) } : w);
}

function HomePage() {
  const initial = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<HomePayload | null>(initial);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Card[]>([]);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    setRecentlyViewed(readRecentlyViewed());
  }, []);

  useEffect(() => {
    const updateHeader = () => setCompactHeaderVisible(window.scrollY > 120);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (isPending) return;
    const tasteIds = readLocalTaste();
    let cancelled = false;
    void loadHomeFeed(tasteIds)
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError(false);
        if (userId && !next.hasTaste && tasteIds.length >= 3) void saveTaste({ data: { categoryIds: tasteIds } }).catch(() => undefined);
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [userId, isPending, refreshKey]);

  const categoryThumbs = useMemo(() => {
    const thumbs = new Map<string, string>();
    if (!data) return thumbs;
    const pool = [...data.recommended, ...data.trending, ...data.fresh, ...(data.tablet ?? []), ...data.editors, ...data.recent, ...data.premium];
    if (data.wotd) pool.unshift(data.wotd);
    for (const wallpaper of pool) {
      if (!thumbs.has(wallpaper.categoryId) && wallpaper.thumbnailUrl) thumbs.set(wallpaper.categoryId, wallpaper.thumbnailUrl);
    }
    return thumbs;
  }, [data]);

  const homeDisplay = useMemo(() => data ? buildHomeDisplay(data) : { forYou: [], fresh: [], tablet: [] }, [data]);

  function onFavorite(id: string, next: boolean) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        wotd: prev.wotd?.id === id ? { ...prev.wotd, isFavorite: next, favoriteCount: prev.wotd.favoriteCount + (next ? 1 : -1) } : prev.wotd,
        trending: patchFav(prev.trending, id, next),
        fresh: patchFav(prev.fresh, id, next),
        recommended: patchFav(prev.recommended, id, next),
        editors: patchFav(prev.editors, id, next),
        tablet: patchFav(prev.tablet ?? [], id, next),
      };
    });
  }

  if (error && !data) return <ErrorState onRetry={() => setRefreshKey((n) => n + 1)} />;

  return (
    <div className="mw-enter px-4 pt-5 lg:px-6 lg:pt-6 xl:px-8">
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-bg/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-[transform,opacity] duration-200 lg:hidden",
          compactHeaderVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link to="/app" className="font-display text-xl text-fg">
            {brand.name}
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t.home.search}
              aria-expanded={searchOpen}
              className="grid size-10 place-items-center rounded-full text-fg transition-colors hover:bg-elevated"
            >
              <Search className="size-5" strokeWidth={1.75} />
            </button>
            <Link
              to="/app/notifications"
              aria-label={t.home.notifications}
              className="relative grid size-10 place-items-center rounded-full text-fg transition-colors hover:bg-elevated"
            >
              <Bell className="size-5" strokeWidth={1.75} />
              {data && data.unreadCount > 0 ? <span className="absolute right-2 top-2 size-2.5 rounded-full bg-fg ring-2 ring-bg" /> : null}
            </Link>
          </div>
        </div>
      </div>

      <header className="mb-7 flex items-center justify-between gap-3 lg:hidden">
        <div>
          <p className="text-xs tracking-[0.22em] text-muted uppercase">{brand.tagline}</p>
          <h1 className="font-display text-3xl text-fg">{brand.name}</h1>
          <p className="mt-1 max-w-sm text-sm text-muted">Find it. Preview it. Download it.</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label={t.home.search} aria-expanded={searchOpen} className="grid size-11 place-items-center rounded-[12px] text-fg">
            <Search className="size-5" strokeWidth={1.75} />
          </button>
          <Link to="/app/notifications" aria-label={t.home.notifications} className="relative grid size-11 place-items-center rounded-md text-fg">
            <Bell className="size-5" strokeWidth={1.75} />
            {data && data.unreadCount > 0 ? <span className="absolute top-2 right-2 size-2.5 rounded-full bg-fg ring-2 ring-bg" /> : null}
          </Link>
        </div>
      </header>

      <MobileSearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      {!data ? (
        <div className="space-y-8"><Skeleton className="aspect-[4/5] w-full rounded-[24px] lg:hidden" /><WallpaperGridSkeleton /></div>
      ) : (
        <div className="space-y-11 lg:space-y-14 xl:space-y-16">
          {homeDisplay.forYou.length > 0 ? (
            <section><SectionHeader title={t.home.forYou} /><WallpaperGrid items={homeDisplay.forYou} onFavorite={onFavorite} eager={4} mobileLimit={8} /></section>
          ) : null}

          <section>
            <SectionHeader title={t.home.fresh} to="/app/fresh" />
            <WallpaperGrid items={homeDisplay.fresh} onFavorite={onFavorite} eager={2} mobileLimit={8} feature={data.wotd ? { id: data.wotd.id, label: "Wallpaper of the Day" } : undefined} />
          </section>

          {recentlyViewed.length > 0 ? (
            <section>
              <SectionHeader title="Recently viewed" />
              <WallpaperGrid
                items={recentlyViewed}
                mobileLimit={6}
                onFavorite={(id, next) =>
                  setRecentlyViewed((current) => patchFav(current, id, next))
                }
              />
            </section>
          ) : null}

          {homeDisplay.tablet.length > 0 ? (
            <section><SectionHeader title="For iPad & Tablets" to="/app/tablet" /><WallpaperGrid items={homeDisplay.tablet} onFavorite={onFavorite} mobileLimit={4} /></section>
          ) : null}

          <section>
            <SectionHeader title={t.home.categories} />
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {data.categories.slice(0, 8).map((category) => {
                const preview = category.coverUrl || categoryThumbs.get(category.id) || categoryPreview(category.slug);
                return (
                  <Link key={category.id} to="/wallpapers/$slug" params={{ slug: category.slug }} className="group relative h-28 w-36 shrink-0 overflow-hidden rounded-[16px] bg-elevated lg:h-36 lg:w-auto lg:rounded-[20px]">
                    <LazyImage src={preview} alt={`${category.name} wallpaper preview`} fallback={categoryPreviewFallback(category.slug)} className="size-full object-cover transition-transform duration-300 lg:group-hover:scale-[1.03]" />
                    <span className="absolute inset-x-0 bottom-0 bg-bg/55 px-2.5 py-2 text-sm font-medium text-fg backdrop-blur-sm lg:px-4 lg:py-3 lg:text-base">{category.name}</span>
                  </Link>
                );
              })}
            </div>
            <Link to="/app/explore" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-fg lg:mt-5 lg:rounded-full lg:bg-elevated lg:px-4 lg:transition-colors lg:hover:bg-surface">Browse everything</Link>
          </section>
        </div>
      )}
    </div>
  );
}
