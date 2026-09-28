import { createFileRoute, notFound } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BottomNav, DesktopNav } from "@/components/bottom-nav";
import { PfpDesktopFilters, type PfpSort } from "@/components/pfp-desktop-filters";
import { PfpGrid } from "@/components/pfp-grid";
import { SiteFooter } from "@/components/site-footer";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  itemListJsonLd,
  pageHead,
  pfpCategoryPath,
  pfpPath,
} from "@/lib/seo";
import { getPfpCategoryPage } from "@/lib/server/api";

type Search = { sort?: PfpSort; page?: number };

export const Route = createFileRoute("/pfps/$slug")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    sort:
      search.sort === "latest" || search.sort === "downloads" || search.sort === "favorites"
        ? search.sort
        : undefined,
    page: typeof search.page === "number" && search.page > 1 ? Math.floor(search.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ sort: search.sort ?? "trending", page: search.page ?? 1 }),
  loader: async ({ params, deps }) => {
    const data = await getPfpCategoryPage({
      data: { slug: params.slug, sort: deps.sort, page: deps.page },
    });
    if (!data.category) throw notFound();
    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData, params, match }) => {
    const search = match.search as Search;
    const sort = search.sort ?? "trending";
    const page = search.page ?? 1;
    const category = loaderData?.category;
    const name = category?.name ?? params.slug;
    const pageBit = page > 1 ? ` – Page ${page}` : "";
    const path = page > 1
      ? `${pfpCategoryPath(params.slug)}?page=${page}`
      : pfpCategoryPath(params.slug);
    const description =
      `Download free ${name.toLowerCase()} PFPs and profile pictures from MrWallpaper, with square images ready for social and messaging profiles.`;

    return pageHead({
      title: `${name} PFPs & Profile Pictures${pageBit} | MrWallpaper`,
      description,
      path,
      noindex: sort !== "trending",
      prev:
        sort === "trending" && page > 1
          ? page === 2
            ? pfpCategoryPath(params.slug)
            : `${pfpCategoryPath(params.slug)}?page=${page - 1}`
          : undefined,
      next:
        sort === "trending" && loaderData?.hasMore
          ? `${pfpCategoryPath(params.slug)}?page=${page + 1}`
          : undefined,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "PFPs", path: "/pfps" },
          { name, path },
        ]),
        collectionPageJsonLd({
          name: `${name} PFPs${pageBit}`,
          description,
          path,
        }),
        itemListJsonLd({
          name: `${name} PFPs${pageBit}`,
          path,
          items: (loaderData?.items ?? []).map((item) => ({
            name: item.title,
            path: pfpPath(item.slug || item.id),
          })),
        }),
      ],
    });
  },
  component: PfpCategoryPage,
});

function PfpCategoryPage() {
  const { slug } = Route.useParams();
  const { category, categories, items, sort, page, hasMore } = Route.useLoaderData();
  const prev = page > 1 ? page - 1 : null;
  const next = hasMore ? page + 1 : null;

  return (
    <>
      <DesktopNav />
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 lg:pb-20">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/app" },
          { name: "PFPs", href: "/pfps" },
          { name: category.name },
        ]}
      />

      <div className="mt-6 max-w-3xl">
        <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">PFP collection</p>
        <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">{category.name} PFPs</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Free {category.name.toLowerCase()} profile pictures in square format, ready to use across your profiles.
        </p>
      </div>

      <div className="mt-6">
        <PfpDesktopFilters categories={categories} categorySlug={category.slug} sort={sort} />
      </div>

      <section className="mt-8 lg:mt-5">
        {items.length > 0 ? (
          <PfpGrid items={items} eager={6} />
        ) : (
          <div className="rounded-2xl bg-elevated px-5 py-12 text-center text-sm text-muted">
            No {category.name.toLowerCase()} PFPs are published yet.
          </div>
        )}
      </section>

      {(prev || next) ? (
        <nav className="mt-10 flex items-center gap-4 text-sm" aria-label="Pagination">
          {prev ? (
            <a
              href={
                prev === 1
                  ? sort === "trending"
                    ? `/pfps/${slug}`
                    : `/pfps/${slug}?sort=${sort}`
                  : `/pfps/${slug}?page=${prev}${sort === "trending" ? "" : `&sort=${sort}`}`
              }
              className="text-muted hover:text-fg"
            >
              Previous
            </a>
          ) : (
            <span className="text-subtle">Previous</span>
          )}
          <span className="text-muted">Page {page}</span>
          {next ? (
            <a
              href={`/pfps/${slug}?page=${next}${sort === "trending" ? "" : `&sort=${sort}`}`}
              className="text-muted hover:text-fg"
            >
              Next
            </a>
          ) : (
            <span className="text-subtle">Next</span>
          )}
        </nav>
      ) : null}

      <SiteFooter faqHref="/app/faq" />
      </main>
      <BottomNav />
    </>
  );
}
