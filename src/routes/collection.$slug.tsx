import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { breadcrumbJsonLd, itemListJsonLd, pageHead, wallpaperPath } from "@/lib/seo";
import { getCollectionPage } from "@/lib/server/api";

export const Route = createFileRoute("/collection/$slug")({
  loader: async ({ params }) => {
    const data = await getCollectionPage({ data: { slug: params.slug } });
    if (!data.collection) throw notFound();
    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData, params }) => {
    const name = loaderData?.collection?.name;
    const path = `/collection/${params.slug}`;
    return pageHead({
      title: name ? `${name} Wallpaper Collection | ${brand.name}` : brand.name,
      description: name
        ? `${loaderData?.collection?.description || name} — HD wallpapers from ${brand.name} for iPhone, Android, and iPad.`
        : brand.positioning,
      path,
      noindex: !name,
      jsonLd: name
        ? [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Wallpapers", path: "/wallpapers" },
              { name, path },
            ]),
            itemListJsonLd({
              name: `${name} collection`,
              path,
              items: (loaderData?.items ?? []).map((w) => ({
                name: w.title,
                path: wallpaperPath(w.slug || w.id),
              })),
            }),
          ]
        : [],
    });
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { collection, items } = Route.useLoaderData();
  if (!collection) return null;
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-4">
      <a href="/" className="mb-4 flex min-h-11 items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        {t.nav.home}
      </a>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Wallpapers", href: "/wallpapers" },
          { name: collection.name },
        ]}
      />
      <h1 className="mt-6 font-display text-3xl text-fg">{collection.name}</h1>
      {collection.description ? <p className="mt-2 text-sm text-muted">{collection.description}</p> : null}
      <p className="mt-1 text-xs text-subtle">
        {t.home.wallpaperCount.replace("{n}", String(collection.wallpaperCount))}
      </p>
      <div className="mt-8">
        <WallpaperGrid items={items} eager={4} />
      </div>
    </main>
  );
}
