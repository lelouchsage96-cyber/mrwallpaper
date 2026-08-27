import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DevicePreview } from "@/components/device-preview";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { resolveHero } from "@/lib/media";
import { breadcrumbJsonLd, itemListJsonLd, pageHead, wallpaperPath } from "@/lib/seo";
import { getPairPage } from "@/lib/server/api";

export const Route = createFileRoute("/pair/$slug")({
  loader: async ({ params }) => {
    const data = await getPairPage({ data: { slug: params.slug } });
    if (!data.pair) throw notFound();
    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData, params }) => {
    const pair = loaderData?.pair;
    return pageHead({
      title: pair ? `${pair.name} Lock & Home | ${brand.name}` : brand.name,
      description: pair
        ? `${pair.description || pair.name} — matching lock and home wallpapers from ${brand.name}.`
        : brand.positioning,
      path: `/pair/${params.slug}`,
      image: pair ? resolveHero(pair.lock.id, pair.lock.thumbnailUrl) : undefined,
      imageAlt: pair?.lock.title,
      jsonLd: pair
        ? [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Lock & Home", path: "/wallpapers" },
              { name: pair.name, path: `/pair/${params.slug}` },
            ]),
            itemListJsonLd({
              name: pair.name,
              path: `/pair/${params.slug}`,
              items: [
                { name: pair.lock.title, path: wallpaperPath(pair.lock.slug || pair.lock.id) },
                { name: pair.home.title, path: wallpaperPath(pair.home.slug || pair.home.id) },
              ],
            }),
          ]
        : [],
      noindex: !pair,
    });
  },
  component: PairPage,
});

function PairPage() {
  const data = Route.useLoaderData();
  const pair = data.pair;
  if (!pair) return null;
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
          { name: pair.name },
        ]}
      />
      <p className="mt-6 text-xs tracking-[0.2em] text-muted uppercase">{t.pairs.title}</p>
      <h1 className="mt-2 font-display text-3xl text-fg">{pair.name}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">{pair.description}</p>
      <div className="mt-8 grid gap-10 sm:grid-cols-2">
        <div>
          <p className="mb-3 text-center text-xs tracking-widest text-subtle uppercase">{t.pairs.lock}</p>
          <DevicePreview src={resolveHero(pair.lock.id, pair.lock.thumbnailUrl)} alt={pair.lock.title} mode="lock" hideToggle />
          <a
            href={wallpaperPath(pair.lock.slug || pair.lock.id)}
            className="mt-4 flex h-11 items-center justify-center rounded-full bg-elevated text-sm text-fg"
          >
            {t.pairs.openLock}
          </a>
        </div>
        <div>
          <p className="mb-3 text-center text-xs tracking-widest text-subtle uppercase">{t.pairs.home}</p>
          <DevicePreview src={resolveHero(pair.home.id, pair.home.thumbnailUrl)} alt={pair.home.title} mode="home" hideToggle />
          <a
            href={wallpaperPath(pair.home.slug || pair.home.id)}
            className="mt-4 flex h-11 items-center justify-center rounded-full bg-elevated text-sm text-fg"
          >
            {t.pairs.openHome}
          </a>
        </div>
      </div>
    </main>
  );
}