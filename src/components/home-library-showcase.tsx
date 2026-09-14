import { ArrowRight } from "lucide-react";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import type { WallpaperCard } from "@/lib/types";

export function HomeLibraryShowcase({
  items,
  categoryCount,
}: {
  items: WallpaperCard[];
  categoryCount: number;
}) {
  if (!items.length) return null;

  return (
    <section className="mt-12" aria-labelledby="homepage-library-title">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Explore the library</p>
          <h2 id="homepage-library-title" className="mt-1 font-display text-3xl text-fg sm:text-4xl">
            A growing wallpaper library
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Browse wallpapers across {categoryCount || "many"} styles, with new phone and tablet backgrounds added regularly.
          </p>
        </div>
        <a href="/wallpapers" className="inline-flex items-center gap-2 text-sm font-medium text-fg hover:opacity-75">
          Browse full library
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>

      <WallpaperGrid items={items} eager={4} />

      <div className="mt-6 flex justify-center">
        <a
          href="/wallpapers"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          See all wallpapers
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
