import { createFileRoute } from "@tanstack/react-router";
import { BottomNav, DesktopNav } from "@/components/bottom-nav";
import { PfpGrid } from "@/components/pfp-grid";
import { Input } from "@/components/ui/input";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  itemListJsonLd,
  pageHead,
  pfpCategoryPath,
  pfpPath,
} from "@/lib/seo";
import { getPfpIndex } from "@/lib/server/api";

type Search = { q?: string; page?: number };

const PFP_TITLE = "PFPs & Profile Pictures | MrWallpaper";
const PFP_DESCRIPTION =
  "Download free aesthetic, anime, dark, minimal, motivational and faith-inspired PFPs and profile pictures from MrWallpaper.";

export const Route = createFileRoute("/pfps/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim().slice(0, 80) : undefined,
    page: typeof search.page === "number" && search.page > 1 ? Math.floor(search.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page ?? 1 }),
  loader: ({ deps }) => getPfpIndex({ data: { q: deps.q, page: deps.page } }),
  staleTime: 30_000,
  head: ({ loaderData }) => {
    const q = loaderData?.q;
    const page = loaderData?.page ?? 1;
    const pageBit = page > 1 ? ` – Page ${page}` : "";
    const path = page > 1 ? `/pfps?page=${page}` : "/pfps";
    const items = (loaderData?.items ?? []).slice(0, 16).map((item) => ({
      name: item.title,
      path: pfpPath(item.slug || item.id),
    }));
    return pageHead({
      title: q ? `${q} PFPs | MrWallpaper${pageBit}` : `${PFP_TITLE}${pageBit}`,
      description: PFP_DESCRIPTION,
      path,
      noindex: Boolean(q),
      prev: !q && page > 1 ? (page === 2 ? "/pfps" : `/pfps?page=${page - 1}`) : undefined,
      next: !q && loaderData?.hasMore ? `/pfps?page=${page + 1}` : undefined,
      jsonLd: q
        ? [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "PFPs", path: "/pfps" },
            ]),
          ]
        : [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "PFPs", path },
            ]),
            collectionPageJsonLd({
              name: page > 1 ? `PFPs and profile pictures – Page ${page}` : "PFPs and profile pictures",
              description: PFP_DESCRIPTION,
              path,
            }),
            itemListJsonLd({
              name: page > 1 ? `PFP collection – Page ${page}` : "PFP collection",
              path,
              items,
            }),
          ],
    });
  },
  component: PfpIndexPage,
});

function PfpIndexPage() {
  const { categories, items, q, page, hasMore } = Route.useLoaderData();
  const prev = page > 1 ? page - 1 : null;
  const next = hasMore ? page + 1 : null;

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `/pfps?${query}` : "/pfps";
  }

  return (
    <>
      <DesktopNav />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:pb-20 lg:px-6 lg:pt-5 xl:px-8">
      <h1 className="font-display text-3xl text-fg lg:hidden">PFPs</h1>

      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mt-4 border-y border-border/70 bg-bg/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <form action="/pfps" method="get">
          <Input
            type="search"
            name="q"
            defaultValue={q || ""}
            placeholder="Search PFPs"
            aria-label="Search PFPs"
            className="text-base sm:text-sm"
          />
        </form>

        {categories.length > 0 ? (
          <nav className="mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="PFP categories">
            <div className="flex w-max gap-2">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={pfpCategoryPath(category.slug)}
                  className="grid h-9 shrink-0 place-items-center rounded-full bg-elevated px-4 text-sm font-medium text-muted transition-colors hover:text-fg"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <nav className="mt-2 hidden overflow-x-auto pb-1 lg:block [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="PFP categories">
          <div className="flex w-max gap-2">
            {categories.map((category) => (
              <a
                key={category.id}
                href={pfpCategoryPath(category.slug)}
                className="grid h-9 shrink-0 place-items-center rounded-full bg-elevated/70 px-4 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      <section className="mt-5 lg:mt-6" aria-labelledby="pfp-results-heading">
        <div className="mb-4">
          <h2 id="pfp-results-heading" className="font-display text-2xl text-fg">
            {q ? `${q} PFPs` : "Popular PFPs"}
          </h2>
        </div>
        {items.length > 0 ? (
          <PfpGrid items={items} eager={6} />
        ) : (
          <div className="rounded-2xl bg-elevated px-5 py-12 text-center">
            <p className="text-sm text-muted">
              {q ? "No PFPs matched that search yet." : "The PFP library is ready for its first uploads."}
            </p>
          </div>
        )}
      </section>

      {(prev || next) ? (
        <nav className="mt-10 flex items-center gap-4 text-sm" aria-label="Pagination">
          {prev ? (
            <a href={pageHref(prev)} className="text-muted hover:text-fg">Previous</a>
          ) : (
            <span className="text-subtle">Previous</span>
          )}
          <span className="text-muted">Page {page}</span>
          {next ? (
            <a href={pageHref(next)} className="text-muted hover:text-fg">Next</a>
          ) : (
            <span className="text-subtle">Next</span>
          )}
        </nav>
      ) : null}
      </main>
      <BottomNav />
    </>
  );
}
