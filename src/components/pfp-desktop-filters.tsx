import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PfpSort = "trending" | "latest" | "downloads" | "favorites";

const sortOptions: { id: PfpSort; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "latest", label: "Latest" },
  { id: "downloads", label: "Most Downloaded" },
  { id: "favorites", label: "Most Favorited" },
];

function pfpHref(categorySlug: string | null, sort: PfpSort, q?: string) {
  const base = categorySlug ? `/pfps/${categorySlug}` : "/pfps";
  const params = new URLSearchParams();
  if (!categorySlug && q?.trim()) params.set("q", q.trim());
  if (sort !== "trending") params.set("sort", sort);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function PfpDesktopFilters({
  categories,
  categorySlug = null,
  sort = "trending",
}: {
  categories: Category[];
  categorySlug?: string | null;
  sort?: PfpSort;
}) {
  return (
    <div className="mw-glass hidden lg:sticky lg:top-[4.5rem] lg:z-30 lg:mt-5 lg:block lg:rounded-2xl lg:p-2">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <select
            aria-label="PFP category"
            value={categorySlug || ""}
            onChange={(event) => {
              const next = event.target.value || null;
              window.location.assign(pfpHref(next, sort));
            }}
            className="h-10 min-w-48 appearance-none rounded-xl border border-border/70 bg-elevated/45 pl-3 pr-9 text-sm text-fg outline-none transition-colors hover:bg-elevated focus:border-fg/25"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-1 rounded-xl bg-elevated/55 p-1">
          {sortOptions.map((option) => (
            <a
              key={option.id}
              href={pfpHref(categorySlug, option.id)}
              aria-current={sort === option.id ? "page" : undefined}
              className={cn(
                "grid h-8 place-items-center rounded-lg px-3 text-xs font-medium transition-colors",
                sort === option.id ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}


export function PfpMobileFilters({
  categories,
  categorySlug = null,
  sort = "trending",
  q,
}: {
  categories: Category[];
  categorySlug?: string | null;
  sort?: PfpSort;
  q?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug),
    [categories, categorySlug],
  );
  const sortLabel = sortOptions.find((option) => option.id === sort)?.label ?? "Trending";
  const activeFilterCount = Number(Boolean(categorySlug)) + Number(sort !== "trending");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mw-glass-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-fg transition-colors active:scale-[0.98]"
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.8} />
          Filters
          {activeFilterCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-fg text-[11px] font-semibold text-bg">
              {activeFilterCount}
            </span>
          ) : null}
        </button>

        <span className="min-w-0 truncate text-xs text-subtle">
          {selectedCategory?.name ?? "All categories"} · {sortLabel}
        </span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="PFP filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <div className="mw-sheet mw-glass mw-glass-panel absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[28px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted/35" aria-hidden="true" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">Refine results</p>
                <h2 className="mt-1 font-display text-2xl text-fg">Filters</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mw-glass-button grid size-10 place-items-center rounded-full text-muted"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>

            <section className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">Sort by</p>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => (
                  <a
                    key={option.id}
                    href={pfpHref(categorySlug, option.id, q)}
                    className={cn(
                      "grid h-9 place-items-center rounded-full px-4 text-sm font-medium transition-colors",
                      sort === option.id ? "bg-fg text-bg" : "bg-elevated text-muted",
                    )}
                  >
                    {option.label}
                  </a>
                ))}
              </div>
            </section>

            {categories.length > 0 ? (
              <section className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">Category</p>
                <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                  <a
                    href={pfpHref(null, sort, q)}
                    className={cn(
                      "grid h-9 place-items-center rounded-full px-4 text-sm font-medium transition-colors",
                      !categorySlug ? "bg-fg text-bg" : "bg-elevated text-muted",
                    )}
                  >
                    All
                  </a>
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={pfpHref(category.slug, sort)}
                      className={cn(
                        "grid h-9 place-items-center rounded-full px-4 text-sm font-medium transition-colors",
                        categorySlug === category.slug ? "bg-fg text-bg" : "bg-elevated text-muted",
                      )}
                    >
                      {category.name}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {activeFilterCount > 0 || q ? (
              <div className="mt-7 border-t border-border pt-4">
                <a
                  href="/pfps"
                  className="grid h-11 w-full place-items-center rounded-full bg-elevated text-sm font-medium text-fg"
                >
                  Clear filters
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
