import { ChevronDown } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PfpSort = "trending" | "latest" | "downloads" | "favorites";

const sortOptions: { id: PfpSort; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "latest", label: "Latest" },
  { id: "downloads", label: "Most Downloaded" },
  { id: "favorites", label: "Most Favorited" },
];

function pfpHref(categorySlug: string | null, sort: PfpSort) {
  const base = categorySlug ? `/pfps/${categorySlug}` : "/pfps";
  return sort === "trending" ? base : `${base}?sort=${sort}`;
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
    <div className="hidden lg:sticky lg:top-[4.5rem] lg:z-30 lg:block lg:rounded-2xl lg:border lg:border-border/70 lg:bg-bg/94 lg:p-2 lg:shadow-[0_8px_24px_rgba(0,0,0,0.12)] lg:backdrop-blur-xl">
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
