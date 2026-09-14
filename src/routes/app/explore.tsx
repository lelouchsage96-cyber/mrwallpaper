import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { InfiniteSentinel } from "@/components/lazy";
import { trackEvent } from "@/lib/analytics";
import { noindexHead } from "@/lib/seo";
import { t } from "@/lib/i18n/en";
import { getAppConfig } from "@/lib/server/api";
import { getSearchMetaV2, searchWallpapersV2 } from "@/lib/server/search-v2";
import type { Category, WallpaperCard } from "@/lib/types";
import { cn } from "@/lib/utils";

type Sort = "latest" | "trending" | "downloads" | "favorites";
type Access = "free" | "premium";
type Device = "all" | "phone" | "tablet";

type ExploreSearch = {
  q?: string;
  category?: string;
  access?: Access;
  sort?: Sort;
  device?: Device;
};

const SEARCH_FILLER = new Set(["wallpaper", "wallpapers", "background", "backgrounds", "download", "free", "4k", "hd"]);

function fallbackTerms(value: string): string[] {
  return [...new Set(
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .map((term) => term.trim())
      .filter((term) => term.length >= 2 && !SEARCH_FILLER.has(term)),
  )]
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
}

export const Route = createFileRoute("/app/explore")({
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    access: s.access === "free" || s.access === "premium" ? s.access : undefined,
    device: s.device === "tablet" || s.device === "all" || s.device === "phone" ? s.device : undefined,
    sort:
      s.sort === "latest" ||
      s.sort === "trending" ||
      s.sort === "downloads" ||
      s.sort === "favorites"
        ? s.sort
        : undefined,
  }),
  head: () => noindexHead("Explore", "/app/explore"),
  component: ExplorePage,
});

const deviceChips: { id: Device; label: string }[] = [
  { id: "phone", label: t.explore.device.phone },
  { id: "tablet", label: t.explore.device.tablet },
  { id: "all", label: t.explore.device.all },
];

const sortChips: { id: Sort; label: string }[] = [
  { id: "trending", label: t.explore.sort.trending },
  { id: "latest", label: t.explore.sort.latest },
  { id: "downloads", label: t.explore.sort.downloads },
  { id: "favorites", label: t.explore.sort.favorites },
];

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [debounced, setDebounced] = useState(search.q ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [items, setItems] = useState<WallpaperCard[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [premiumOn, setPremiumOn] = useState(false);
  const [showingSuggestions, setShowingSuggestions] = useState(false);
  const busy = useRef(false);
  const zeroTracked = useRef<string | null>(null);
  const categoryRailRef = useRef<HTMLDivElement | null>(null);

  const access = search.access;
  const sort = search.sort ?? "trending";
  const categorySlug = search.category;
  const device: Device = search.device ?? (search.q ? "all" : "phone");

  useEffect(() => {
    void getSearchMetaV2()
      .then((m) => {
        setCategories(m.categories);
        setPopular(m.popular);
      })
      .catch(() => undefined);
    void getAppConfig()
      .then((c) => {
        const on = c.featureFlags.premium_enabled;
        setPremiumOn(on);
        if (!on && search.access) {
          void navigate({
            to: "/app/explore",
            search: { q: search.q, category: search.category, sort: search.sort, device: search.device },
            replace: true,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    setQ(search.q ?? "");
    setDebounced(search.q ?? "");
  }, [search.q]);

  function setSearch(next: ExploreSearch) {
    void navigate({
      to: "/app/explore",
      search: {
        q: next.q || undefined,
        category: next.category,
        access: next.access,
        device: next.device && next.device !== "phone" ? next.device : undefined,
        sort: next.sort && next.sort !== "trending" ? next.sort : undefined,
      },
      replace: true,
    });
  }

  function scrollCategories(direction: -1 | 1) {
    categoryRailRef.current?.scrollBy({ left: direction * 440, behavior: "smooth" });
  }

  async function closestMatches(): Promise<WallpaperCard[]> {
    const terms = fallbackTerms(debounced);
    if (!terms.length) return [];

    const responses = await Promise.all(
      terms.map((term) =>
        searchWallpapersV2({
          data: {
            q: term,
            access,
            sort,
            offset: 0,
            categorySlug,
            device,
          },
        }).catch(() => ({ items: [] as WallpaperCard[], offset: 0, hasMore: false })),
      ),
    );

    const seen = new Set<string>();
    const merged: WallpaperCard[] = [];
    for (const response of responses) {
      for (const wallpaper of response.items) {
        if (seen.has(wallpaper.id)) continue;
        seen.add(wallpaper.id);
        merged.push(wallpaper);
        if (merged.length >= 24) return merged;
      }
    }
    return merged;
  }

  function load(reset: boolean) {
    if (!reset && busy.current) return;
    if (!reset && showingSuggestions) return;
    busy.current = true;
    if (reset && items.length === 0) setLoading(true);
    else setRefreshing(true);
    setError(false);
    if (reset) setShowingSuggestions(false);
    const nextOffset = reset ? 0 : offset;

    void (async () => {
      try {
        const res = await searchWallpapersV2({
          data: {
            q: debounced || undefined,
            access,
            sort,
            offset: nextOffset,
            categorySlug,
            device,
          },
        });

        if (reset && debounced && res.items.length === 0) {
          const trackKey = [debounced.toLocaleLowerCase(), categorySlug ?? "", device, sort, access ?? ""].join("|");
          if (zeroTracked.current !== trackKey) {
            zeroTracked.current = trackKey;
            trackEvent("search_zero_results", {
              searchQuery: debounced,
              categorySlug,
              metadata: { device, sort, access: access ?? "all" },
            });
          }

          const suggestions = await closestMatches();
          if (suggestions.length > 0) {
            setItems(suggestions);
            setOffset(0);
            setHasMore(false);
            setShowingSuggestions(true);
            return;
          }
        }

        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setOffset(res.offset);
        setHasMore(res.hasMore);
      } catch {
        setError(true);
      } finally {
        busy.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    })();
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, access, sort, categorySlug, device]);

  useEffect(() => {
    if (debounced === (search.q ?? "")) return;
    setSearch({
      q: debounced || undefined,
      category: categorySlug,
      access,
      sort,
      device: debounced ? "all" : device,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const deviceButtons = deviceChips.map((f) => (
    <button
      key={f.id}
      type="button"
      onClick={() =>
        setSearch({
          q: debounced || undefined,
          category: categorySlug,
          access,
          sort,
          device: f.id,
        })
      }
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-sm transition-colors duration-150 ease-out",
        device === f.id ? "bg-fg text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {f.label}
    </button>
  ));

  const categoryButtons = categories.map((c) => (
    <button
      key={c.id}
      type="button"
      onClick={() =>
        setSearch({
          q: debounced || undefined,
          category: c.slug === categorySlug ? undefined : c.slug,
          access,
          sort,
          device,
        })
      }
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-sm transition-colors duration-150 ease-out",
        categorySlug === c.slug ? "bg-fg text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {c.name}
    </button>
  ));

  const sortButtons = sortChips.map((f) => (
    <button
      key={f.id}
      type="button"
      onClick={() =>
        setSearch({
          q: debounced || undefined,
          category: categorySlug,
          access,
          sort: f.id,
          device,
        })
      }
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-sm transition-colors duration-150",
        sort === f.id ? "bg-fg text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {f.label}
    </button>
  ));

  return (
    <div className="px-4 pt-5 lg:px-6 lg:pt-6 xl:px-8">
      <h1 className="font-display text-3xl text-fg lg:text-4xl">{t.explore.title}</h1>

      <div className="mt-4 lg:hidden">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.explore.placeholder}
          aria-label={t.explore.placeholder}
          type="search"
          className="text-base sm:text-sm"
        />
      </div>

      {!debounced && popular.length > 0 ? (
        <div className="mt-4 lg:hidden">
          <p className="mb-2 text-xs tracking-[0.16em] text-subtle uppercase">
            {t.explore.popularSearches}
          </p>
          <div className="flex flex-wrap gap-2">
            {popular.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQ(term);
                  setDebounced(term);
                  setSearch({ q: term, category: categorySlug, access, sort, device: "all" });
                }}
                className="h-9 rounded-full bg-elevated px-3 text-sm text-muted hover:text-fg"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="lg:hidden">
        <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {deviceButtons}
        </div>

        {categories.length > 0 ? (
          <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryButtons}
          </div>
        ) : null}

        <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortButtons}
        </div>
      </div>

      <div className="mt-5 hidden lg:block">
        <div className="flex items-center justify-between gap-6">
          <div className="flex shrink-0 gap-2">{deviceButtons}</div>
          <div className="flex shrink-0 gap-2">{sortButtons}</div>
        </div>

        {categories.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border/80 bg-elevated/25 p-2">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              aria-label="Scroll categories left"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-elevated text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div
              ref={categoryRailRef}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {categoryButtons}
            </div>
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              aria-label="Scroll categories right"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-elevated text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className={cn("mt-5 transition-opacity duration-200 ease-out lg:mt-6", refreshing && items.length > 0 ? "opacity-55" : "opacity-100")}>
        {error ? (
          <ErrorState onRetry={() => load(true)} />
        ) : loading && items.length === 0 ? (
          <WallpaperGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <div>
            <EmptyState title={debounced ? `No wallpapers found for “${debounced}”` : t.explore.empty} />
            {debounced && popular.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {popular.slice(0, 6).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQ(term);
                      setDebounced(term);
                      setSearch({ q: term, category: undefined, access, sort, device: "all" });
                    }}
                    className="min-h-10 rounded-full bg-elevated px-3.5 text-sm text-muted hover:text-fg"
                  >
                    {term}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {showingSuggestions && debounced ? (
              <p className="mb-4 text-sm text-muted">
                No exact matches for “{debounced}”. Try these instead.
              </p>
            ) : null}
            <WallpaperGrid
              items={items}
              eager={4}
              onFavorite={(id, next) =>
                setItems((prev) =>
                  prev.map((w) => (w.id === id ? { ...w, isFavorite: next } : w)),
                )
              }
            />
            <InfiniteSentinel
              disabled={!hasMore || loading || refreshing || showingSuggestions}
              onLoad={() => load(false)}
            />
            {hasMore && !showingSuggestions && (loading || refreshing) ? <div className="mt-4"><WallpaperGridSkeleton count={2} /></div> : null}
          </>
        )}
      </div>
    </div>
  );
}
