import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { PairCard } from "@/components/pair-card";
import { WallpaperGrid, WallpaperGridSkeleton } from "@/components/wallpaper-grid";
import { t } from "@/lib/i18n/en";
import { brand } from "@/lib/brand";
import { breadcrumbJsonLd, itemListJsonLd, pageHead, wallpaperPath } from "@/lib/seo";
import { getCreatorPage } from "@/lib/server/studio";
import type { WallpaperCard as Card } from "@/lib/types";

export const Route = createFileRoute("/creator/$slug")({
  loader: async ({ params }) => {
    const data = await getCreatorPage({ data: { slug: params.slug } });
    if (!data.creator) throw notFound();
    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData, params }) => {
    const name = loaderData?.creator?.displayName;
    const path = `/creator/${params.slug}`;
    return pageHead({
      title: name ? `${name} Wallpapers | ${brand.name}` : brand.name,
      description: name
        ? `HD wallpapers by ${name} on ${brand.name}. ${loaderData?.creator?.bio || "Original plates for phone and tablet."}`
        : brand.positioning,
      path,
      noindex: !name,
      jsonLd: name
        ? [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Creators", path: "/creators" },
              { name, path },
            ]),
            itemListJsonLd({
              name: `${name} wallpapers`,
              path,
              items: (loaderData?.creator?.items ?? []).map((w) => ({
                name: w.title,
                path: wallpaperPath(w.slug || w.id),
              })),
            }),
          ]
        : [],
    });
  },
  component: CreatorPageView,
});

function CreatorPageView() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const [creator, setCreator] = useState(initial.creator);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    void getCreatorPage({ data: { slug } })
      .then((r) => setCreator(r.creator))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setCreator(initial.creator);
    setLoading(false);
    setError(false);
  }, [slug, initial]);

  function onFavorite(id: string, next: boolean) {
    setCreator((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((w: Card) =>
          w.id === id
            ? { ...w, isFavorite: next, favoriteCount: w.favoriteCount + (next ? 1 : -1) }
            : w,
        ),
      };
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-4">
      <a href="/creators" className="mb-4 flex min-h-11 items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        {t.creators.title}
      </a>
      {error ? (
        <ErrorState onRetry={load} />
      ) : loading ? (
        <WallpaperGridSkeleton />
      ) : !creator ? (
        <EmptyState title={t.errors.notFound} />
      ) : (
        <>
          <Breadcrumbs
            items={[
              { name: "Home", href: "/app" },
              { name: "Creators", href: "/creators" },
              { name: creator.displayName },
            ]}
          />
          <p className="mt-6 text-xs tracking-[0.2em] text-muted uppercase">{t.home.creators}</p>
          <h1 className="mt-2 font-display text-4xl text-fg">{creator.displayName}</h1>
          {creator.bio ? <p className="mt-3 max-w-md text-sm text-muted">{creator.bio}</p> : null}
          <p className="mt-2 text-xs text-subtle">
            {t.creators.pieces.replace("{n}", String(creator.pieceCount))}
          </p>
          {creator.pairs?.length ? (
            <section className="mt-8">
              <h2 className="font-display text-xl text-fg">{t.pairs.suggested}</h2>
              <p className="mt-1 text-sm text-muted">{t.pairs.suggestedHint}</p>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {creator.pairs.map((pair) => (
                  <PairCard key={pair.id} pair={pair} />
                ))}
              </div>
            </section>
          ) : null}
          <div className="mt-8">
            <WallpaperGrid items={creator.items} onFavorite={onFavorite} eager={4} />
          </div>
        </>
      )}
    </div>
  );
}
