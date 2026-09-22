import { createFileRoute } from "@tanstack/react-router";
import { SiteFaq } from "@/components/site-faq";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/lib/brand";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    pageHead({
      title: `FAQ | ${brand.name}`,
      description: `Frequently asked questions about downloads, supported devices, wallpaper submissions and copyright on ${brand.name}.`,
      path: "/faq",
    }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Home
      </a>

      <SiteFaq />
      <SiteFooter />
    </main>
  );
}
