import { createFileRoute } from "@tanstack/react-router";
import { InfoPageHeader } from "@/components/info-page-header";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/lib/brand";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: `About | ${brand.name}`,
      description: `Learn about ${brand.name}, a free wallpaper website for phones and tablets.`,
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-8">
      <InfoPageHeader
        eyebrow="About"
        title={`About ${brand.name}`}
        description="A simple, wallpaper-first experience for discovering high-quality backgrounds across phones and tablets."
        backHref="/"
      />

      <section className="mt-8 max-w-2xl rounded-2xl border border-border/70 bg-elevated/45 p-5 sm:p-6">
        <div className="space-y-4 text-sm leading-relaxed text-muted sm:text-base">
          <p>
            {brand.name} is a free wallpaper website built to make it easy to discover and download high-quality wallpapers for phones and tablets.
          </p>
          <p>
            The collection includes motivational, Bible verse, minimalist, aesthetic, AMOLED, anime, nature and other wallpaper styles, with new additions added over time.
          </p>
          <p>
            Our goal is simple: keep browsing clean, keep downloads easy, and give people a better way to find wallpapers that fit their screen and style.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
