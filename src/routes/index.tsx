import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { MwMark } from "@/components/mw-mark";
import { brand } from "@/lib/brand";
import { CATEGORY_EDITORIAL } from "@/lib/category-content";
import { t } from "@/lib/i18n/en";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  itemListJsonLd,
  organizationJsonLd,
  pageHead,
  wallpaperPath,
  websiteJsonLd,
} from "@/lib/seo";
import { getHomeFeed } from "@/lib/server/api";

const FEATURED_CATEGORY_SLUGS = [
  "motivational",
  "bible-verse",
  "aesthetic",
  "amoled",
  "minimal",
  "anime",
] as const;

export const Route = createFileRoute("/")({
  loader: () => getHomeFeed(),
  staleTime: 30_000,
  head: ({ loaderData }) =>
    pageHead({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      path: "/",
      jsonLd: [
        websiteJsonLd(),
        organizationJsonLd(),
        itemListJsonLd({
          name: "Trending wallpapers",
          path: "/",
          items: (loaderData?.trending ?? []).slice(0, 12).map((w) => ({
            name: w.title,
            path: wallpaperPath(w.slug || w.id),
          })),
        }),
      ],
    }),
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  const trending = (data.trending ?? []).slice(0, 8);
  const fresh = (data.fresh ?? []).slice(0, 8);
  const tablet = (data.tablet ?? []).slice(0, 4);
  const categories = data.categories ?? [];
  const collections = data.collections ?? [];
  const featuredCategories = FEATURED_CATEGORY_SLUGS.map((slug) =>
    categories.find((category) => category.slug === slug),
  ).filter((category): category is NonNullable<typeof category> => Boolean(category));

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      <header className="flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2">
          <MwMark className="size-9" />
          <span className="font-display text-xl text-fg">{brand.name}</span>
        </a>
        <a
          href="/app"
          className="grid h-11 place-items-center rounded-full bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Open app
        </a>
      </header>

      <section className="mt-12 max-w-3xl">
        <p className="text-xs font-medium tracking-[0.2em] text-subtle uppercase">{brand.tagline}</p>
        <h1 className="mt-3 font-display text-4xl text-fg sm:text-6xl">HD & 4K wallpapers for every screen</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{HOME_DESCRIPTION}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="/wallpapers"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            Explore wallpapers
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a
            href="/wallpapers/iphone"
            className="inline-flex h-11 items-center rounded-full bg-elevated px-5 text-sm text-fg transition-colors hover:bg-surface"
          >
            Browse iPhone wallpapers
          </a>
        </div>
      </section>

      {featuredCategories.length > 0 ? (
        <section className="mt-14" aria-labelledby="popular-collections-title">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Start here</p>
              <h2 id="popular-collections-title" className="mt-1 font-display text-3xl text-fg">
                Popular collections
              </h2>
            </div>
            <a href="/wallpapers" className="text-sm text-muted transition-colors hover:text-fg">
              View all
            </a>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCategories.map((category) => {
              const editorial = CATEGORY_EDITORIAL[category.slug];
              return (
                <a
                  key={category.id}
                  href={`/wallpapers/${category.slug}`}
                  className="group rounded-lg bg-elevated p-5 shadow-[var(--shadow-border)] transition-colors hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl text-fg">{category.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {editorial?.intro || category.description}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
                      aria-hidden="true"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <nav aria-label="All wallpaper collections" className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/wallpapers/${category.slug}`}
              className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface"
            >
              {category.name}
            </a>
          ))}
          <a href="/wallpapers/iphone" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface">
            iPhone
          </a>
          <a href="/wallpapers/android" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface">
            Android
          </a>
          <a href="/wallpapers/ipad" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface">
            iPad
          </a>
        </nav>
      ) : null}

      {trending.length > 0 ? (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Most downloaded</p>
              <h2 className="mt-1 font-display text-3xl text-fg">{t.home.trending}</h2>
            </div>
            <a href="/wallpapers" className="text-sm text-muted hover:text-fg">
              {t.explore.title}
            </a>
          </div>
          <WallpaperGrid items={trending} eager={2} />
        </section>
      ) : null}

      {fresh.length > 0 ? (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Fresh drops</p>
              <h2 className="mt-1 font-display text-3xl text-fg">New wallpapers</h2>
            </div>
            <a href="/wallpapers" className="text-sm text-muted hover:text-fg">
              Browse all
            </a>
          </div>
          <WallpaperGrid items={fresh} />
        </section>
      ) : null}

      {tablet.length > 0 ? (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Wider screens</p>
              <h2 className="mt-1 font-display text-3xl text-fg">For iPad & tablets</h2>
            </div>
            <a href="/wallpapers/ipad" className="text-sm text-muted hover:text-fg">
              Browse iPad
            </a>
          </div>
          <WallpaperGrid items={tablet} />
        </section>
      ) : null}

      {collections.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-3xl text-fg">{t.home.editors}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {collections.map((collection) => (
              <li key={collection.id}>
                <a
                  href={`/collection/${collection.slug}`}
                  className="block rounded-lg bg-elevated px-5 py-5 shadow-[var(--shadow-border)] transition-colors hover:bg-surface"
                >
                  <p className="font-medium text-fg">{collection.name}</p>
                  <p className="mt-1 text-sm text-muted">{collection.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SiteFooter />
    </main>
  );
}
