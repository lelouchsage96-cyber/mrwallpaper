import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { breadcrumbJsonLd, categoryMeta, categoryPath, itemListJsonLd, pageHead, wallpaperPath } from "@/lib/seo";
import { getCategoryPage, getSeoRedirect } from "@/lib/server/api";

type Search = { page?: number };

export const Route = createFileRoute("/wallpapers/$slug")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    page: typeof s.page === "number" && s.page > 1 ? Math.floor(s.page) : undefined,
  }),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ params, deps }) => {
    const alias = await getSeoRedirect({ data: { path: `/wallpapers/${params.slug}` } });
    if (alias?.to_path) {
      throw redirect({ href: alias.to_path, statusCode: alias.status || 301 });
    }
    const data = await getCategoryPage({ data: { slug: params.slug, page: deps.page } });
    if (!data.category && !data.hub) throw notFound();
    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData, params, match }) => {
    const page = (match.search as Search).page ?? 1;
    const name = loaderData?.category?.name ?? loaderData?.hub?.name ?? params.slug;
    const pageBit = page > 1 ? ` – Page ${page}` : "";
    const meta = loaderData?.hub
      ? { title: `${loaderData.hub.title}${pageBit}`, description: loaderData.hub.description }
      : categoryMeta({
          name,
          slug: params.slug,
          description: loaderData?.category?.intro || loaderData?.category?.description,
          seoTitle: loaderData?.category?.seoTitle,
          seoDescription: loaderData?.category?.seoDescription,
          page,
        });
    const path =
      page > 1
        ? `${categoryPath(params.slug)}?page=${page}`
        : loaderData?.category?.canonicalPath || categoryPath(params.slug);
    const hasMore = Boolean(loaderData?.hasMore);
    return pageHead({
      title: meta.title,
      description: meta.description,
      path,
      robots: loaderData?.category?.robots,
      prev: page > 1 ? (page === 2 ? categoryPath(params.slug) : `${categoryPath(params.slug)}?page=${page - 1}`) : undefined,
      next: hasMore ? `${categoryPath(params.slug)}?page=${page + 1}` : undefined,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Wallpapers", path: "/wallpapers" },
          { name, path: categoryPath(params.slug) },
        ]),
        itemListJsonLd({
          name: `${name} wallpapers`,
          path: categoryPath(params.slug),
          items: (loaderData?.items ?? []).map((w) => ({
            name: w.title,
            path: wallpaperPath(w.slug || w.id),
          })),
        }),
      ],
    });
  },
  component: HubPage,
});

function HubPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const page = search.page ?? 1;
  const name = data.category?.name ?? data.hub?.name ?? slug;
  const intro = data.category?.intro || data.category?.description || data.hub?.intro || "";
  const next = data.hasMore ? page + 1 : null;
  const prev = page > 1 ? page - 1 : null;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Wallpapers", href: "/wallpapers" },
          { name },
        ]}
      />
      <h1 className="mt-6 font-display text-4xl text-fg">{name} wallpapers</h1>
      {intro ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p> : null}

      {data.items.length === 0 ? (
        <p className="mt-10 text-sm text-muted">{t.errors.empty}</p>
      ) : (
        <div className="mt-8">
          <WallpaperGrid items={data.items} eager={4} />
        </div>
      )}

      <nav className="mt-10 flex items-center gap-4 text-sm" aria-label="Pagination">
        {prev ? (
          <a href={prev === 1 ? `/wallpapers/${slug}` : `/wallpapers/${slug}?page=${prev}`} className="text-muted hover:text-fg">
            Previous
          </a>
        ) : (
          <span className="text-subtle">Previous</span>
        )}
        <span className="text-muted">Page {page}</span>
        {next ? (
          <a href={`/wallpapers/${slug}?page=${next}`} className="text-muted hover:text-fg">
            Next
          </a>
        ) : (
          <span className="text-subtle">Next</span>
        )}
      </nav>
    </main>
  );
}
