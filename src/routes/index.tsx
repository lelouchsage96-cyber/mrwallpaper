import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { MwMark } from "@/components/mw-mark";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { categoryPreview } from "@/lib/media";
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

function isLegacyOriginal(url: string): boolean {
  try {
    return /\/originals\//i.test(new URL(url, "https://mrwallpaper.org").pathname);
  } catch {
    return false;
  }
}

function displayImage(url: string | null | undefined, width = 720, quality = 75): string {
  if (!url) return "";
  if (isLegacyOriginal(url)) {
    return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
  }
  return url;
}

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

  const heroCandidates = [
    fresh[0],
    trending.find((wallpaper) => wallpaper.categorySlug === "bible-verse"),
    trending.find((wallpaper) => wallpaper.categorySlug === "aesthetic"),
    trending[0],
    fresh[1],
  ].filter((wallpaper): wallpaper is NonNullable<typeof wallpaper> => Boolean(wallpaper));
  const heroWallpapers = heroCandidates
    .filter((wallpaper, index, items) => items.findIndex((item) => item.id === wallpaper.id) === index)
    .slice(0, 3);

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

      <section className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="max-w-3xl">
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
        </div>

        {heroWallpapers.length > 0 ? (
          <div className="mx-auto grid w-full max-w-lg grid-cols-3 items-center gap-2" aria-label="Featured wallpapers">
            {heroWallpapers.map((wallpaper, index) => (
              <a
                key={wallpaper.id}
                href={wallpaperPath(wallpaper.slug || wallpaper.id)}
                className={`group relative overflow-hidden rounded-xl bg-elevated ring-1 ring-border ${
                  index === 0 ? "mt-10" : index === 2 ? "mt-6" : ""
                }`}
              >
                <div className="aspect-[9/16] overflow-hidden">
                  <img
                    src={displayImage(wallpaper.thumbnailUrl, 480, 75)}
                    alt={wallpaper.altText || wallpaper.title}
                    width={wallpaper.width}
                    height={wallpaper.height}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "low"}
                    decoding="async"
                    className="wallpaper-img size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                </div>
              </a>
            ))}
          </div>
        ) : null}
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
              const cover = displayImage(category.coverUrl || categoryPreview(category.slug), 720, 85);
              return (
                <a
                  key={category.id}
                  href={`/wallpapers/${category.slug}`}
                  className="group relative overflow-hidden rounded-lg bg-elevated ring-1 ring-border"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={cover}
                      alt={`${category.name} wallpaper collection`}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                    <div>
                      <span className="sr-only">{category.description}</span>
                      <h3 className="font-display text-2xl text-on-photo">{category.name}</h3>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bg/70 text-on-photo backdrop-blur-sm transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <nav aria-label="All wallpaper collections" className="-mx-4 mt-6 overflow-x-auto px-4 pb-2">
          <div className="flex w-max gap-2">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/wallpapers/${category.slug}`}
                className="grid h-11 shrink-0 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface"
              >
                {category.name}
              </a>
            ))}
            <a href="/wallpapers/iphone" className="grid h-11 shrink-0 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface">
              iPhone
            </a>
            <a href="/wallpapers/android" className="grid h-11 shrink-0 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface">
              Android
            </a>
            <a href="/wallpapers/ipad" className="grid h-11 shrink-0 place-items-center rounded-full bg-elevated px-4 text-sm text-fg transition-colors hover:bg-surface">
              iPad
            </a>
          </div>
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
