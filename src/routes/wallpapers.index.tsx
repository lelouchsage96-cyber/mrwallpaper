import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { brand } from "@/lib/brand";
import { itemListJsonLd, pageHead, PAGE_SIZE, wallpaperPath } from "@/lib/seo";
import { getExploreMeta, searchWallpapers } from "@/lib/server/api";

type Search = { q?: string; page?: number };

export const Route = createFileRoute("/wallpapers/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q.trim().slice(0, 80) : undefined,
    page: typeof s.page === "number" && s.page > 1 ? Math.floor(s.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page ?? 1 }),
  loader: async ({ deps }) => {
    const page = deps.page ?? 1;
    const [meta, catalog] = await Promise.all([
      getExploreMeta(),
      searchWallpapers({
        data: { sort: "trending", q: deps.q, offset: (page - 1) * PAGE_SIZE, device: "all" },
      }),
    ]);
    return { meta, items: catalog.items, q: deps.q, page, hasMore: catalog.hasMore };
  },
  staleTime: 15_000,
  head: ({ loaderData }) => {
    const q = loaderData?.q;
    const page = loaderData?.page ?? 1;
    const pageBit = page > 1 ? ` – Page ${page}` : "";
    return pageHead({
      title: q
        ? `${q} wallpapers | ${brand.name}${pageBit}`
        : `All Wallpaper Collections | ${brand.name}${pageBit}`,
      description: `Browse every ${brand.name} collection — motivational, Bible verse, minimal, nature, iPhone, Android, iPad and tablet wallpapers.`,
      path: page > 1 ? `/wallpapers?page=${page}` : "/wallpapers",
      noindex: Boolean(q),
      prev: !q && page > 1 ? (page === 2 ? "/wallpapers" : `/wallpapers?page=${page - 1}`) : undefined,
      next: !q && loaderData?.hasMore ? `/wallpapers?page=${page + 1}` : undefined,
      jsonLd: [
        itemListJsonLd({
          name: "Wallpaper collections",
          path: "/wallpapers",
          items: (loaderData?.items ?? []).slice(0, 16).map((w) => ({
            name: w.title,
            path: wallpaperPath(w.slug || w.id),
          })),
        }),
      ],
    });
  },
  component: WallpapersIndex,
});

function WallpapersIndex() {
  const { meta, items, q, page, hasMore } = Route.useLoaderData();
  const prev = page > 1 ? page - 1 : null;
  const next = hasMore ? page + 1 : null;
  const qs = q ? `q=${encodeURIComponent(q)}` : "";
  function href(p: number) {
    const bits = [qs, p > 1 ? `page=${p}` : ""].filter(Boolean);
    return bits.length ? `/wallpapers?${bits.join("&")}` : "/wallpapers";
  }
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
      <Breadcrumbs items={[{ name: "Home", href: "/app" }, { name: "Wallpapers" }]} />
      <h1 className="mt-6 font-display text-4xl text-fg">
        {q ? `${q} wallpapers` : "Wallpaper collections"}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        HD and 4K plates for iPhone, Android, iPad and tablets. Pick a collection, then download the original file.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Collections">
        {(meta.categories ?? []).map((c) => (
          <a
            key={c.id}
            href={`/wallpapers/${c.slug}`}
            className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg"
          >
            {c.name}
          </a>
        ))}
        <a href="/wallpapers/iphone" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg">
          iPhone
        </a>
        <a href="/wallpapers/android" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg">
          Android
        </a>
        <a href="/wallpapers/ipad" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg">
          iPad
        </a>
        <a href="/wallpapers/tablet" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg">
          Tablet
        </a>
      </nav>
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl text-fg">{q ? "Results" : "Trending"}</h2>
        <WallpaperGrid items={items} eager={4} />
      </section>
      <nav className="mt-10 flex items-center gap-4 text-sm" aria-label="Pagination">
        {prev ? (
          <a href={href(prev)} className="text-muted hover:text-fg">
            Previous
          </a>
        ) : (
          <span className="text-subtle">Previous</span>
        )}
        <span className="text-muted">Page {page}</span>
        {next ? (
          <a href={href(next)} className="text-muted hover:text-fg">
            Next
          </a>
        ) : (
          <span className="text-subtle">Next</span>
        )}
      </nav>
    </main>
  );
}
