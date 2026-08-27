import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { InfiniteSentinel } from "@/components/lazy";
import { noindexHead } from "@/lib/seo";
import { t } from "@/lib/i18n/en";
import { getAppConfig, getExploreMeta, searchWallpapers } from "@/lib/server/api";
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
  const busy = useRef(false);

  const access = search.access;
  const sort = search.sort ?? "trending";
  const categorySlug = search.category;
  const device: Device = search.device ?? "phone";

  useEffect(() => {
    void getExploreMeta()
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
    const id = window.setTimeout(() => setDebounced(q.trim()), 350);
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

  function load(reset: boolean) {
    if (!reset && busy.current) return;
    busy.current = true;
    if (reset && items.length === 0) setLoading(true);
    else setRefreshing(true);
    setError(false);
    const nextOffset = reset ? 0 : offset;
    void searchWallpapers({
      data: {
        q: debounced || undefined,
        access,
        sort,
        offset: nextOffset,
        categorySlug,
        device,
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
        setRefreshing(false);
      });
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
      device,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="px-4 pt-5">
      <h1 className="font-display text-3xl text-fg">{t.explore.title}</h1>
      <div className="mt-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.explore.placeholder}
          aria-label={t.explore.placeholder}
          type="search"
        />
      </div>

      {!debounced && popular.length > 0 ? (
        <div className="mt-4">
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
                  setSearch({ q: term, category: categorySlug, access, sort, device });
                }}
                className="h-9 rounded-full bg-elevated px-3 text-sm text-muted hover:text-fg"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {deviceChips.map((f) => (
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
              device === f.id ? "bg-fg text-bg" : "bg-elevated text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {categories.length > 0 ? (
        <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
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
                categorySlug === c.slug ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sortChips.map((f) => (
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
              "h-9 shrink-0 rounded-full px-4 text-sm",
              sort === f.id ? "bg-fg text-bg" : "bg-elevated text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={cn("mt-5 transition-opacity duration-200 ease-out", refreshing && items.length > 0 ? "opacity-55" : "opacity-100")}>
        {error ? (
          <ErrorState onRetry={() => load(true)} />
        ) : loading && items.length === 0 ? (
          <WallpaperGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <EmptyState title={t.explore.empty} />
        ) : (
          <>
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
              disabled={!hasMore || loading || refreshing}
              onLoad={() => load(false)}
            />
            {hasMore && (loading || refreshing) ? <div className="mt-4"><WallpaperGridSkeleton count={2} /></div> : null}
          </>
        )}
      </div>
    </div>
  );
}
