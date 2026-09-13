import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  LoaderCircle,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getExploreMeta, searchWallpapers } from "@/lib/server/api";
import type { Category, WallpaperCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECENT_SEARCH_KEY = "mrwallpaper.search.recent.v1";
const MAX_RECENT_SEARCHES = 6;
const FALLBACK_POPULAR = [
  "motivational",
  "bible verse",
  "amoled",
  "dark",
  "minimal",
  "nature",
];

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
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(values));
  } catch {
    // Search should still work when storage is unavailable.
  }
}

function rememberSearch(term: string): string[] {
  const clean = term.trim();
  if (!clean) return readRecentSearches();
  const next = [
    clean,
    ...readRecentSearches().filter((item) => item.toLocaleLowerCase() !== clean.toLocaleLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);
  writeRecentSearches(next);
  return next;
}

function editDistance(a: string, b: string) {
  const left = a.toLocaleLowerCase();
  const right = b.toLocaleLowerCase();
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }

  return row[right.length];
}

function useSearchDiscovery(active: boolean, query: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [results, setResults] = useState<WallpaperCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active || metaLoaded) return;
    let cancelled = false;

    void getExploreMeta()
      .then((meta) => {
        if (cancelled) return;
        setCategories(meta.categories);
        setPopular(meta.popular);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setMetaLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [active, metaLoaded]);

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
      void searchWallpapers({
        data: {
          q: term,
          sort: "trending",
          offset: 0,
          device: "all",
        },
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
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, query]);

  const popularTerms = popular.length > 0 ? popular : FALLBACK_POPULAR;
  const corrections = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (term.length < 2) return [];
    const candidates = [...popularTerms, ...categories.map((category) => category.name)];
    return [...new Set(candidates)]
      .filter((candidate) => candidate.toLocaleLowerCase() !== term)
      .map((candidate) => ({
        candidate,
        distance: editDistance(term, candidate),
        startsWith: candidate.toLocaleLowerCase().startsWith(term.slice(0, Math.min(3, term.length))),
      }))
      .filter(({ candidate, distance, startsWith }) =>
        startsWith || distance <= Math.max(2, Math.floor(candidate.length * 0.28)),
      )
      .sort((a, b) => Number(b.startsWith) - Number(a.startsWith) || a.distance - b.distance)
      .slice(0, 4)
      .map(({ candidate }) => candidate);
  }, [categories, popularTerms, query]);

  return { categories, popularTerms, results, loading, corrections };
}

function SearchResultRow({
  wallpaper,
  active,
  onSelect,
}: {
  wallpaper: WallpaperCard;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 ease-out",
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
        <span className="mt-0.5 block truncate text-xs text-muted">
          {wallpaper.categoryName} · {wallpaper.deviceType === "tablet" ? "Tablet" : "Phone"}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

function DiscoverySections({
  recent,
  popular,
  categories,
  onRecent,
  onRemoveRecent,
  onClearRecent,
  onPopular,
  onCategory,
  mobile = false,
}: {
  recent: string[];
  popular: string[];
  categories: Category[];
  onRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  onPopular: (term: string) => void;
  onCategory: (category: Category) => void;
  mobile?: boolean;
}) {
  return (
    <div className={cn("space-y-5", mobile && "space-y-7")}> 
      {recent.length > 0 ? (
        <section aria-labelledby={mobile ? "mobile-recent-searches" : "desktop-recent-searches"}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <h2
              id={mobile ? "mobile-recent-searches" : "desktop-recent-searches"}
              className="text-xs font-medium tracking-[0.14em] text-subtle uppercase"
            >
              Recent searches
            </h2>
            <button type="button" onClick={onClearRecent} className="text-xs text-muted hover:text-fg">
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {recent.map((term) => (
              <div key={term} className="flex min-h-11 items-center rounded-lg hover:bg-surface">
                <button
                  type="button"
                  onClick={() => onRecent(term)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left text-sm text-muted hover:text-fg"
                >
                  <Clock3 className="size-4 shrink-0 text-subtle" strokeWidth={1.7} aria-hidden="true" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveRecent(term)}
                  aria-label={`Remove ${term} from recent searches`}
                  className="grid size-10 shrink-0 place-items-center rounded-md text-subtle hover:text-fg"
                >
                  <X className="size-4" strokeWidth={1.7} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby={mobile ? "mobile-popular-searches" : "desktop-popular-searches"}>
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="size-4 text-subtle" strokeWidth={1.7} aria-hidden="true" />
          <h2
            id={mobile ? "mobile-popular-searches" : "desktop-popular-searches"}
            className="text-xs font-medium tracking-[0.14em] text-subtle uppercase"
          >
            Popular searches
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {popular.slice(0, mobile ? 8 : 6).map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onPopular(term)}
              className="min-h-10 rounded-full bg-surface px-3.5 text-sm text-muted transition-colors duration-150 ease-out hover:text-fg"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-labelledby={mobile ? "mobile-search-categories" : "desktop-search-categories"}>
          <h2
            id={mobile ? "mobile-search-categories" : "desktop-search-categories"}
            className="mb-2 text-xs font-medium tracking-[0.14em] text-subtle uppercase"
          >
            Explore categories
          </h2>
          <div className={cn(mobile ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2")}>
            {categories.slice(0, mobile ? 8 : 6).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategory(category)}
                className={cn(
                  "text-sm text-muted transition-colors duration-150 ease-out hover:text-fg",
                  mobile
                    ? "flex min-h-12 items-center justify-between rounded-lg bg-surface px-3 text-left"
                    : "min-h-10 rounded-full bg-surface px-3.5",
                )}
              >
                <span className="truncate">{category.name}</span>
                {mobile ? <ArrowRight className="size-4 shrink-0 text-subtle" strokeWidth={1.7} /> : null}
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
  const { categories, popularTerms, results, loading, corrections } = useSearchDiscovery(open, query);
  const term = query.trim();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setHighlighted(-1);
  }, [query]);

  function openSearch() {
    setRecent(readRecentSearches());
    setOpen(true);
  }

  function runSearch(value: string) {
    const clean = value.trim();
    if (!clean) return;
    setRecent(rememberSearch(clean));
    setOpen(false);
    void navigate({ to: "/app/explore", search: { q: clean } });
  }

  function openWallpaper(wallpaper: WallpaperCard) {
    if (term) setRecent(rememberSearch(term));
    setOpen(false);
    void navigate({
      to: "/wallpaper/$id",
      params: { id: wallpaper.slug || wallpaper.id },
    });
  }

  function openCategory(category: Category) {
    setOpen(false);
    void navigate({ to: "/app/explore", search: { category: category.slug } });
  }

  function removeRecent(value: string) {
    const next = recent.filter((item) => item !== value);
    setRecent(next);
    writeRecentSearches(next);
  }

  function clearRecent() {
    setRecent([]);
    writeRecentSearches([]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
      return;
    }
    if (term.length < 2 || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === "Enter" && highlighted >= 0) {
      event.preventDefault();
      openWallpaper(results[highlighted]);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(query);
        }}
        role="search"
        className={cn(
          "flex h-11 items-center rounded-xl bg-elevated shadow-[var(--shadow-border)] transition-shadow duration-150 ease-out",
          open && "ring-2 ring-ring",
        )}
      >
        <Search className="ml-3.5 size-4 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={openSearch}
          onClick={openSearch}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search wallpapers, styles, quotes..."
          aria-label="Search wallpapers"
          aria-expanded={open}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-fg outline-none placeholder:text-subtle"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="grid size-10 shrink-0 place-items-center text-subtle hover:text-fg"
          >
            <X className="size-4" strokeWidth={1.7} />
          </button>
        ) : null}
      </form>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,620px)] overflow-y-auto rounded-xl border border-border bg-elevated p-3 shadow-2xl">
          {term.length < 2 ? (
            <DiscoverySections
              recent={recent}
              popular={popularTerms}
              categories={categories}
              onRecent={runSearch}
              onRemoveRecent={removeRecent}
              onClearRecent={clearRecent}
              onPopular={runSearch}
              onCategory={openCategory}
            />
          ) : loading ? (
            <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted">
              <LoaderCircle className="size-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
              Finding wallpapers…
            </div>
          ) : results.length > 0 ? (
            <div>
              <p className="mb-2 px-2 text-xs font-medium tracking-[0.14em] text-subtle uppercase">
                Top matches
              </p>
              <div role="listbox" aria-label="Wallpaper search suggestions" className="space-y-1">
                {results.slice(0, 6).map((wallpaper, index) => (
                  <SearchResultRow
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    active={index === highlighted}
                    onSelect={() => openWallpaper(wallpaper)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => runSearch(term)}
                className="mt-2 flex min-h-11 w-full items-center justify-between rounded-lg border-t border-border px-2 pt-3 text-sm font-medium text-fg"
              >
                <span className="truncate">View all results for “{term}”</span>
                <ArrowRight className="size-4 shrink-0" strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <div className="px-2 py-4">
              <p className="font-medium text-fg">No wallpapers found for “{term}”</p>
              <p className="mt-1 text-sm text-muted">Try another phrase or one of these suggestions.</p>
              {corrections.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {corrections.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setQuery(value)}
                      className="min-h-10 rounded-full bg-surface px-3 text-sm text-muted hover:text-fg"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
  const { categories, popularTerms, results, loading, corrections } = useSearchDiscovery(open, query);
  const term = query.trim();

  useEffect(() => {
    if (!open) return;
    setRecent(readRecentSearches());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function runSearch(value: string) {
    const clean = value.trim();
    if (!clean) return;
    setRecent(rememberSearch(clean));
    onOpenChange(false);
    void navigate({ to: "/app/explore", search: { q: clean } });
  }

  function openWallpaper(wallpaper: WallpaperCard) {
    if (term) setRecent(rememberSearch(term));
    onOpenChange(false);
    void navigate({
      to: "/wallpaper/$id",
      params: { id: wallpaper.slug || wallpaper.id },
    });
  }

  function openCategory(category: Category) {
    onOpenChange(false);
    void navigate({ to: "/app/explore", search: { category: category.slug } });
  }

  function removeRecent(value: string) {
    const next = recent.filter((item) => item !== value);
    setRecent(next);
    writeRecentSearches(next);
  }

  function clearRecent() {
    setRecent([]);
    writeRecentSearches([]);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search wallpapers"
      className="fixed inset-0 z-50 flex flex-col bg-bg pt-[env(safe-area-inset-top)] lg:hidden"
    >
      <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-3 py-3 backdrop-blur-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
          role="search"
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close search"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-fg"
          >
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </button>
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl bg-elevated shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring">
            <Search className="ml-3.5 size-4 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search wallpapers..."
              aria-label="Search wallpapers"
              className="min-w-0 flex-1 bg-transparent px-3 text-base text-fg outline-none placeholder:text-subtle"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="grid size-11 shrink-0 place-items-center text-subtle"
              >
                <X className="size-4" strokeWidth={1.7} />
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
        {term.length < 2 ? (
          <DiscoverySections
            recent={recent}
            popular={popularTerms}
            categories={categories}
            onRecent={runSearch}
            onRemoveRecent={removeRecent}
            onClearRecent={clearRecent}
            onPopular={runSearch}
            onCategory={openCategory}
            mobile
          />
        ) : loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
            Finding wallpapers…
          </div>
        ) : results.length > 0 ? (
          <section aria-labelledby="mobile-search-results">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] text-subtle uppercase">Top matches</p>
                <h2 id="mobile-search-results" className="mt-1 font-display text-2xl text-fg">
                  “{term}”
                </h2>
              </div>
              <button
                type="button"
                onClick={() => runSearch(term)}
                className="min-h-11 shrink-0 text-sm font-medium text-fg"
              >
                See all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {results.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  type="button"
                  onClick={() => openWallpaper(wallpaper)}
                  className="min-w-0 overflow-hidden rounded-xl bg-elevated text-left shadow-[var(--shadow-border)]"
                >
                  <img
                    src={wallpaper.thumbnailUrl || `/wallpapers/${wallpaper.id}.jpg`}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/5] w-full bg-surface object-cover"
                  />
                  <span className="block p-3">
                    <span className="block truncate text-sm font-medium text-fg">{wallpaper.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{wallpaper.categoryName}</span>
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => runSearch(term)}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 text-sm font-medium text-bg"
            >
              View all results
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </button>
          </section>
        ) : (
          <div className="py-8 text-center">
            <p className="font-display text-2xl text-fg">No wallpapers found</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
              We couldn’t find “{term}”. Try another phrase or a related suggestion.
            </p>
            {corrections.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {corrections.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuery(value)}
                    className="min-h-11 rounded-full bg-elevated px-4 text-sm text-muted"
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
