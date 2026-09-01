import { createFileRoute } from "@tanstack/react-router";
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
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      <a href="/app" className="text-sm text-muted transition-colors hover:text-fg">
        Home
      </a>

      <section className="mt-8 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">About</p>
        <h1 className="mt-3 font-display text-4xl text-fg sm:text-5xl">About {brand.name}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
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
