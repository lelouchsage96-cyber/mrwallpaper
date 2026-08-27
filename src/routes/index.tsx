import { createFileRoute, Link } from "@tanstack/react-router";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { MwMark } from "@/components/mw-mark";
import { brand } from "@/lib/brand";
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
  const trending = data.trending ?? [];
  const categories = data.categories ?? [];
  const collections = data.collections ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      <header className="flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2">
          <MwMark className="size-9" />
          <span className="font-display text-xl text-fg">{brand.name}</span>
        </a>
        <a
          href="/app"
          className="grid h-11 place-items-center rounded-full bg-fg px-4 text-sm font-medium text-bg"
        >
          {t.nav.home}
        </a>
      </header>

      <section className="mt-10 max-w-2xl">
        <h1 className="font-display text-4xl text-fg sm:text-5xl">HD & 4K wallpapers for phone and tablet</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">{HOME_DESCRIPTION}</p>
      </section>

      {categories.length > 0 ? (
        <nav aria-label="Wallpaper collections" className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
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
        </nav>
      ) : null}

      {trending.length > 0 ? (
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl text-fg">{t.home.trending}</h2>
            <a href="/wallpapers" className="text-sm text-muted hover:text-fg">
              {t.explore.title}
            </a>
          </div>
          <WallpaperGrid items={trending} eager={4} />
        </section>
      ) : null}

      {collections.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-fg">{t.home.editors}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {collections.map((c) => (
              <li key={c.id}>
                <a href={`/collection/${c.slug}`} className="block rounded-[16px] bg-elevated px-4 py-4">
                  <p className="font-medium text-fg">{c.name}</p>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-16 flex flex-wrap gap-4 text-sm text-muted">
        <a href={brand.legal.privacy} className="hover:text-fg">
          {t.profile.privacy}
        </a>
        <a href={brand.legal.terms} className="hover:text-fg">
          {t.profile.terms}
        </a>
        <a href={brand.legal.copyright} className="hover:text-fg">
          {t.profile.copyright}
        </a>
      </footer>
    </main>
  );
}
