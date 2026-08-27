import { createFileRoute } from "@tanstack/react-router";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { pageHead } from "@/lib/seo";
import { listCreators } from "@/lib/server/studio";

export const Route = createFileRoute("/creators")({
  loader: () => listCreators(),
  staleTime: 30_000,
  head: () =>
    pageHead({
      title: `Wallpaper Creators | ${brand.name}`,
      description: `Original wallpaper artists on ${brand.name}. Browse creator studios and download HD plates for phone and tablet.`,
      path: "/creators",
    }),
  component: CreatorsPage,
});

function CreatorsPage() {
  const data = Route.useLoaderData();
  const items = data.items;
  const on = data.marketplaceOn;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      <h1 className="font-display text-4xl text-fg">{t.creators.title}</h1>
      {!on || items.length === 0 ? (
        <EmptyState title={t.creators.empty} />
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((c) => (
            <li key={c.slug} className="min-w-0">
              <CreatorCard creator={c} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
