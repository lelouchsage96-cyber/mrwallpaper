import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock3, LoaderCircle, Search, TrendingUp, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { getSearchMetaV2, searchWallpapersV2 } from "@/lib/server/search-v2";
import type { Category, WallpaperCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECENT_SEARCH_KEY = "mrwallpaper.search.recent.v1";
const MAX_RECENT_SEARCHES = 6;
const FALLBACK_POPULAR = ["motivational", "bible verse", "amoled", "anime", "cars", "nature"];

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(values: string[]) {
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(values));
  } catch {
    // Search still works when local storage is unavailable.
  }
}

function rememberSearch(value: string) {
  const clean = value.trim();
  if (!clean) return readRecentSearches();
  const next = [
    clean,
    ...readRecentSearches().filter((item) => item.toLocaleLowerCase() !== clean.toLocaleLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);
  writeRecentSearches(next);
  return next;
}

function useDiscovery(active: boolean, query: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<string[]>(FALLBACK_POPULAR);
  const [results, setResults] = useState<WallpaperCard[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedMeta = useRef(false);

  useEffect(() => {
    if (!active || loadedMeta.current) return;
    loadedMeta.current = true;
    let cancelled = false;
    void getSearchMetaV2()
      .then((meta) => {
        if (cancelled) return;
        setCategories(meta.categories);
        if (meta.popular.length) setPopular(meta.popular);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    const term = query.trim();
    if (!active || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchWallpapersV2({
        data: { q: term, sort: "trending", offset: 0, device: "all" },
      })
        .then((response) => {
          if (!cancelled) setResults(response.items.slice(0, 8));
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, query]);

  return { categories, popular, results, loading };
}

function ResultRow({
  wallpaper,
  active = false,
  onSelect,
}: {
  wallpaper: WallpaperCard;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150",
        active ? "bg-surface" : "hover:bg-surface",
      )}
    >
      <img
        src={wallpaper.thumbnailUrl || `/wallpapers/${wallpaper.id}.jpg`}
        alt=""
        width={48}
        height={72}
        loading="lazy"
        className="h-16 w-11 shrink-0 rounded-md bg-surface object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{wallpaper.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{wallpaper.categoryName}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-subtle" strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}

function Discovery({
  recent,
  popular,
  categories,
  onSearch,
  onCategory,
  onRemoveRecent,
  onClearRecent,
}: {
  recent: string[];
  popular: string[];
  categories: Category[];
  onSearch: (term: string) => void;
  onCategory: (category: Category) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="space-y-6">
      {recent.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-xs font-medium tracking-[0.14em] text-subtle uppercase">Recent</p>
            <button type="button" onClick={onClearRecent} className="min-h-10 px-2 text-xs text-muted hover:text-fg">
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {recent.map((term) => (
              <div key={term} className="flex min-h-11 items-center rounded-lg hover:bg-surface">
                <button
                  type="button"
                  onClick={() => onSearch(term)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left text-sm text-muted hover:text-fg"
                >
                  <Clock3 className="size-4 shrink-0 text-subtle" strokeWidth={1.7} />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${term}`}
                  onClick={() => onRemoveRecent(term)}
                  className="grid size-10 place-items-center text-subtle hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="size-4 text-subtle" strokeWidth={1.7} />
          <p className="text-xs font-medium tracking-[0.14em] text-subtle uppercase">Popular</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {popular.slice(0, 8).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSearch(term)}
              className="min-h-10 rounded-full bg-surface px-3.5 text-sm text-muted hover:text-fg"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {categories.length > 0 ? (
        <section>
          <p className="mb-2 text-xs font-medium tracking-[0.14em] text-subtle uppercase">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategory(category)}
                className="min-h-10 rounded-full bg-surface px-3.5 text-sm text-muted hover:text-fg"
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function DesktopSearch() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState(-1);
  const { categories, popular, results, loading } = useDiscovery(open, query);
  const term = query.trim();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => setHighlighted(-1), [query]);

  function runSearch(value: string) {
    const clean = value.trim();
    if (!clean) return;
    setRecent(rememberSearch(clean));
    setOpen(false);
    void navigate({ to: "/app/explore", search: { q: clean, device: "all" } });
  }

  function openWallpaper(wallpaper: WallpaperCard) {
    if (term) setRecent(rememberSearch(term));
    setOpen(false);
    void navigate({ to: "/wallpaper/$id", params: { id: wallpaper.slug || wallpaper.id } });
  }

  function openCategory(category: Category) {
    setOpen(false);
    void navigate({ to: "/app/explore", search: { category: category.slug } });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((value) => (value + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((value) => (value <= 0 ? results.length - 1 : value - 1));
    } else if (event.key === "Enter" && highlighted >= 0) {
      event.preventDefault();
      openWallpaper(results[highlighted]);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(query);
        }}
        className={cn(
          "flex h-11 items-center rounded-xl bg-elevated shadow-[var(--shadow-border)] transition-shadow duration-150",
          open && "ring-2 ring-ring",
        )}
      >
        <Search className="ml-3.5 size-4 shrink-0 text-subtle" strokeWidth={1.75} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => {
            setRecent(readRecentSearches());
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search wallpapers, styles, quotes..."
          aria-label="Search wallpapers"
          aria-expanded={open}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-fg outline-none placeholder:text-subtle"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="grid size-10 place-items-center text-subtle hover:text-fg"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-elevated p-3 shadow-2xl">
          {term.length >= 2 ? (
            <div role="listbox" aria-label="Search results">
              {loading ? (
                <div className="flex min-h-24 items-center justify-center text-muted">
                  <LoaderCircle className="size-5 animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((wallpaper, index) => (
                    <ResultRow
                      key={wallpaper.id}
                      wallpaper={wallpaper}
                      active={index === highlighted}
                      onSelect={() => openWallpaper(wallpaper)}
                    />
                  ))}
                </div>
              ) : (
                <p className="px-2 py-5 text-sm text-muted">No close matches yet.</p>
              )}
              <button
                type="button"
                onClick={() => runSearch(query)}
                className="mt-2 flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-sm font-medium text-fg hover:bg-surface"
              >
                <span>See all results for “{term}”</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <Discovery
              recent={recent}
              popular={popular}
              categories={categories}
              onSearch={(value) => {
                setQuery(value);
                runSearch(value);
              }}
              onCategory={openCategory}
              onRemoveRecent={(value) => {
                const next = recent.filter((item) => item !== value);
                setRecent(next);
                writeRecentSearches(next);
              }}
              onClearRecent={() => {
                setRecent([]);
                writeRecentSearches([]);
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function MobileSearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const { categories, popular, results, loading } = useDiscovery(open, query);
  const term = query.trim();

  useEffect(() => {
    if (!open) return;
    setRecent(readRecentSearches());
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  if (!open) return null;

  function runSearch(value: string) {
    const clean = value.trim();
    if (!clean) return;
    setRecent(rememberSearch(clean));
    onOpenChange(false);
    void navigate({ to: "/app/explore", search: { q: clean, device: "all" } });
  }

  function openWallpaper(wallpaper: WallpaperCard) {
    if (term) setRecent(rememberSearch(term));
    onOpenChange(false);
    void navigate({ to: "/wallpaper/$id", params: { id: wallpaper.slug || wallpaper.id } });
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-bg px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => onOpenChange(false)}
            className="grid size-11 shrink-0 place-items-center rounded-full text-fg"
          >
            <ArrowLeft className="size-5" />
          </button>
          <form
            role="search"
            className="flex h-12 min-w-0 flex-1 items-center rounded-xl bg-elevated"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch(query);
            }}
          >
            <Search className="ml-3 size-5 shrink-0 text-subtle" strokeWidth={1.7} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search wallpapers..."
              aria-label="Search wallpapers"
              className="min-w-0 flex-1 bg-transparent px-3 text-base text-fg outline-none placeholder:text-subtle"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="grid size-11 place-items-center text-subtle"
              >
                <X className="size-5" />
              </button>
            ) : null}
          </form>
        </div>

        <div className="mt-5">
          {term.length >= 2 ? (
            <div>
              {loading ? (
                <div className="grid min-h-40 place-items-center text-muted">
                  <LoaderCircle className="size-6 animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <div role="listbox" aria-label="Search results" className="space-y-1">
                  {results.map((wallpaper) => (
                    <ResultRow key={wallpaper.id} wallpaper={wallpaper} onSelect={() => openWallpaper(wallpaper)} />
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted">No close matches yet.</p>
              )}
              <button
                type="button"
                onClick={() => runSearch(query)}
                className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl bg-elevated px-4 text-sm font-medium text-fg"
              >
                <span>See all results for “{term}”</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          ) : (
            <Discovery
              recent={recent}
              popular={popular}
              categories={categories}
              onSearch={(value) => {
                setQuery(value);
                runSearch(value);
              }}
              onCategory={(category) => {
                onOpenChange(false);
                void navigate({ to: "/app/explore", search: { category: category.slug } });
              }}
              onRemoveRecent={(value) => {
                const next = recent.filter((item) => item !== value);
                setRecent(next);
                writeRecentSearches(next);
              }}
              onClearRecent={() => {
                setRecent([]);
                writeRecentSearches([]);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
