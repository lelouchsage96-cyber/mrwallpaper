import { createFileRoute } from "@tanstack/react-router";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { t } from "@/lib/i18n/en";
import { listCreators } from "@/lib/server/studio";

export const Route = createFileRoute("/app/creators")({
  loader: () => listCreators(),
  staleTime: 30_000,
  component: CreatorsPage,
});

function CreatorsPage() {
  const data = Route.useLoaderData();
  const items = data.items;
  const on = data.marketplaceOn;

  return (
    <div className="px-4 pt-5 pb-8">
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
    </div>
  );
}