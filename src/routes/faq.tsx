import { createFileRoute } from "@tanstack/react-router";
import { InfoPageHeader } from "@/components/info-page-header";
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
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-8">
      <InfoPageHeader
        eyebrow="Helpful answers"
        title="Frequently asked questions"
        description="Quick answers about downloads, devices, submissions and copyright on Mr Wallpapers."
        backHref="/"
      />

      <div className="mt-7">
        <SiteFaq />
      </div>

      <SiteFooter />
    </main>
  );
}
