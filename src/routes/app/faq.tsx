import { createFileRoute } from "@tanstack/react-router";
import { InfoPageHeader } from "@/components/info-page-header";
import { SiteFaq } from "@/components/site-faq";
import { noindexHead } from "@/lib/seo";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/app/faq")({
  head: () => noindexHead(`FAQ | ${brand.name}`, "/app/faq"),
  component: AppFaqPage,
});

function AppFaqPage() {
  return (
    <main className="mw-enter px-4 pb-2 pt-5 lg:px-6 lg:pt-7 xl:px-8">
      <InfoPageHeader
        eyebrow="Helpful answers"
        title="Frequently asked questions"
        description="Quick answers about downloads, devices, submissions and copyright on Mr Wallpapers."
        backHref="/app"
      />

      <div className="mt-7">
        <SiteFaq />
      </div>
    </main>
  );
}
