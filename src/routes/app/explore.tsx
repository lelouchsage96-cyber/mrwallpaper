import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
type ExploreSearch = { q?: string; category?: string; access?: Access; sort?: Sort; device?: Device };

const SEARCH_FILLER = new Set(["wallpaper", "wallpapers", "background", "backgrounds", "download", "free", "4k", "hd"]);
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

const colorChips = [
  { query: "black", label: "Black", swatch: "#111111" },
  { query: "white", label: "White", swatch: "#f4f4f5" },
  { query: "blue", label: "Blue", swatch: "#3b82f6" },
  { query: "green", label: "Green", swatch: "#22c55e" },
  { query: "red", label: "Red", swatch: "#ef4444" },
  { query: "purple", label: "Purple", swatch: "#a855f7" },
  { query: "pink", label: "Pink", swatch: "#ec4899" },
  { query: "orange", label: "Orange", swatch: "#f97316" },
] as const;

function fallbackTerms(value: string): string[] {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").map((term) => term.trim()).filter((term) => term.length >= 2 && !SEARCH_FILLER.has(term)))]
    .sort((a, b) => b.length - a.length).slice(0, 3);
}

export const Route = createFileRoute("/app/explore")({
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    access: s.access === "free" || s.access === "premium" ? s.access : undefined,
    device: s.device === "tablet" || s.device === "all" || s.device === "phone" ? s.device : undefined,
    sort: s.sort === "latest" || s.sort === "trending" || s.sort === "downloads" || s.sort === "favorites" ? s.sort : undefined,
  }),
  head: () => noindexHead("Explore", "/app/explore"),
  component: ExplorePage,
});

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
  const [showingSuggestions, setShowingSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const busy = useRef(false);
  const zeroTracked = useRef<string | null>(null);
  const access = search.access;
  const sort = search.sort ?? "trending";
  const categorySlug = search.category;
  const device: Device = search.device ?? (search.q ? "all" : "phone");
  const selectedCategory = useMemo(() => categories.find((category) => category.slug === categorySlug), [categories, categorySlug]);
  const activeSummary = [deviceChips.find((item) => item.id === device)?.label, selectedCategory?.name, sortChips.find((item) => item.id === sort)?.label].filter(Boolean).join(" · ");
  const hasCustomFilters = Boolean(debounced || categorySlug || device !== "phone" || sort !== "trending" || access);
  const activeFilterCount = Number(Boolean(categorySlug)) + Number(device !== "phone") + Number(sort !== "trending") + Number(Boolean(access));

  useEffect(() => {
    void getSearchMetaV2().then((meta) => { setCategories(meta.categories); setPopular(meta.popular); }).catch(() => undefined);
    void getAppConfig().then((config) => {
      if (!config.featureFlags.premium_enabled && search.access) {
        void navigate({ to: "/app/explore", search: { q: search.q, category: search.category, sort: search.sort, device: search.device }, replace: true });
      }
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q.trim()), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => { setQ(search.q ?? ""); setDebounced(search.q ?? ""); }, [search.q]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [filtersOpen]);

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

  function clearFilters() {
    setQ("");
    setDebounced("");
    void navigate({ to: "/app/explore", search: {}, replace: true });
  }

  async function closestMatches(): Promise<WallpaperCard[]> {
    const terms = fallbackTerms(debounced);
    if (!terms.length) return [];
    const responses = await Promise.all(terms.map((term) => searchWallpapersV2({ data: { q: term, access, sort, offset: 0, categorySlug, device } }).catch(() => ({ items: [] as WallpaperCard[], offset: 0, hasMore: false }))));
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
    if (!reset && (busy.current || showingSuggestions)) return;
    busy.current = true;
    if (reset && items.length === 0) setLoading(true); else setRefreshing(true);
    setError(false);
    if (reset) setShowingSuggestions(false);
    const nextOffset = reset ? 0 : offset;
    void (async () => {
      try {
        const res = await searchWallpapersV2({ data: { q: debounced || undefined, access, sort, offset: nextOffset, categorySlug, device } });
        if (reset && debounced && res.items.length === 0) {
          const trackKey = [debounced.toLowerCase(), categorySlug ?? "", device, sort, access ?? ""].join("|");
          if (zeroTracked.current !== trackKey) {
            zeroTracked.current = trackKey;
            trackEvent("search_zero_results", { searchQuery: debounced, categorySlug, metadata: { device, sort, access: access ?? "all" } });
          }
          const suggestions = await closestMatches();
          if (suggestions.length > 0) {
            setItems(suggestions); setOffset(0); setHasMore(false); setShowingSuggestions(true); return;
          }
        }
        setItems((prev) => reset ? res.items : [...prev, ...res.items]);
        setOffset(res.offset); setHasMore(res.hasMore);
      } catch { setError(true); }
      finally { busy.current = false; setLoading(false); setRefreshing(false); }
    })();
  }

  useEffect(() => { load(true); }, [debounced, access, sort, categorySlug, device]);
  useEffect(() => {
    if (debounced === (search.q ?? "")) return;
    setSearch({ q: debounced || undefined, category: categorySlug, access, sort, device: debounced ? "all" : device });
  }, [debounced]);

  const deviceButtons = deviceChips.map((filter) => (
    <button
      key={filter.id}
      type="button"
      onClick={() => setSearch({ q: debounced || undefined, category: categorySlug, access, sort, device: filter.id })}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
        device === filter.id ? "bg-fg text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {filter.label}
    </button>
  ));

  const sortButtons = sortChips.map((filter) => (
    <button
      key={filter.id}
      type="button"
      onClick={() => setSearch({ q: debounced || undefined, category: categorySlug, access, sort: filter.id, device })}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
        sort === filter.id ? "bg-fg text-bg" : "bg-elevated text-muted hover:text-fg",
      )}
    >
      {filter.label}
    </button>
  ));

  return (
    <div className="px-4 pt-5 lg:px-6 lg:pt-5 xl:px-8">
      <h1 className="font-display text-3xl text-fg lg:hidden">{t.explore.title}</h1>

      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mt-4 border-y border-border/70 bg-bg/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t.explore.placeholder}
          aria-label={t.explore.placeholder}
          type="search"
          className="text-base sm:text-sm"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-elevated/65 px-4 text-sm font-medium text-fg transition-colors active:bg-surface"
          >
            <SlidersHorizontal className="size-4" strokeWidth={1.8} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-fg text-[11px] font-semibold text-bg">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <span className="min-w-0 truncate text-xs text-subtle">{activeSummary}</span>
        </div>
      </div>

      <div className="hidden lg:sticky lg:top-[4.5rem] lg:z-30 lg:block lg:rounded-2xl lg:border lg:border-border/70 lg:bg-bg/94 lg:p-2 lg:shadow-[0_8px_24px_rgba(0,0,0,0.12)] lg:backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-elevated/55 p-1">
            {deviceChips.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSearch({ q: debounced || undefined, category: categorySlug, access, sort, device: filter.id })}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                  device === filter.id ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <select
              aria-label="Wallpaper category"
              value={categorySlug ?? ""}
              onChange={(event) => setSearch({ q: debounced || undefined, category: event.target.value || undefined, access, sort, device })}
              className="h-10 min-w-44 appearance-none rounded-xl border border-border/70 bg-elevated/45 pl-3 pr-9 text-sm text-fg outline-none transition-colors hover:bg-elevated focus:border-fg/25"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>{category.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-1 rounded-xl bg-elevated/55 p-1">
            {sortChips.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSearch({ q: debounced || undefined, category: categorySlug, access, sort: filter.id, device })}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                  sort === filter.id ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {hasCustomFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted transition-colors hover:bg-elevated hover:text-fg"
              aria-label="Clear filters"
              title="Clear filters"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 lg:mt-5" aria-busy={loading || refreshing}>
        {error ? <ErrorState onRetry={() => load(true)} /> : loading && items.length === 0 ? <WallpaperGridSkeleton count={8} /> : items.length === 0 ? (
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
            {showingSuggestions && debounced ? <p className="mb-4 text-sm text-muted">No exact matches for “{debounced}”. Try these instead.</p> : null}
            <WallpaperGrid items={items} eager={4} onFavorite={(id, next) => setItems((prev) => prev.map((wallpaper) => wallpaper.id === id ? { ...wallpaper, isFavorite: next } : wallpaper))} />
            <InfiniteSentinel disabled={!hasMore || loading || refreshing || showingSuggestions} onLoad={() => load(false)} />
            {hasMore && !showingSuggestions && (loading || refreshing) ? <div className="mt-4"><WallpaperGridSkeleton count={2} /></div> : null}
          </>
        )}
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Explore filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <div className="mw-sheet absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[28px] border-t border-border bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-24px_60px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted/35" aria-hidden="true" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">Refine results</p>
                <h2 className="mt-1 font-display text-2xl text-fg">Filters</h2>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-elevated text-muted"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>

            <section className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">Device</p>
              <div className="flex flex-wrap gap-2">{deviceButtons}</div>
            </section>

            <section className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">Sort by</p>
              <div className="flex flex-wrap gap-2">{sortButtons}</div>
            </section>

            {categories.length > 0 ? (
              <section className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">Category</p>
                <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSearch({ q: debounced || undefined, category: undefined, access, sort, device })}
                    className={cn(
                      "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                      !categorySlug ? "bg-fg text-bg" : "bg-elevated text-muted",
                    )}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSearch({ q: debounced || undefined, category: category.slug === categorySlug ? undefined : category.slug, access, sort, device })}
                      className={cn(
                        "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                        categorySlug === category.slug ? "bg-fg text-bg" : "bg-elevated text-muted",
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">Browse by color</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {colorChips.map((color) => (
                  <button
                    key={color.query}
                    type="button"
                    onClick={() => {
                      setQ(color.query);
                      setDebounced(color.query);
                      setSearch({ q: color.query, category: categorySlug, access, sort, device: "all" });
                      setFiltersOpen(false);
                    }}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-elevated px-3 text-sm text-muted active:scale-[0.98]"
                  >
                    <span className="size-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color.swatch }} aria-hidden="true" />
                    {color.label}
                  </button>
                ))}
              </div>
            </section>

            {!debounced && popular.length > 0 ? (
              <section className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">{t.explore.popularSearches}</p>
                <div className="flex flex-wrap gap-2">
                  {popular.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setQ(term);
                        setDebounced(term);
                        setSearch({ q: term, category: categorySlug, access, sort, device: "all" });
                        setFiltersOpen(false);
                      }}
                      className="h-9 rounded-full bg-elevated px-3 text-sm text-muted"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="sticky bottom-0 mt-7 flex gap-2 border-t border-border bg-bg/95 py-3 backdrop-blur-xl">
              {hasCustomFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 flex-1 rounded-full border border-border text-sm font-medium text-muted"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-11 flex-1 rounded-full bg-fg text-sm font-medium text-bg"
              >
                Show wallpapers
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
