import { createFileRoute } from "@tanstack/react-router";
import { SiteFaq } from "@/components/site-faq";
import { noindexHead } from "@/lib/seo";
import { brand } from "@/lib/brand";

export const Route = createFileRoute("/app/faq")({
  head: () => noindexHead(`FAQ | ${brand.name}`, "/app/faq"),
  component: AppFaqPage,
});

function AppFaqPage() {
  return (
    <main className="mw-enter px-4 pt-5 lg:px-6 lg:pt-6 xl:px-8">
      <SiteFaq />
    </main>
  );
}
