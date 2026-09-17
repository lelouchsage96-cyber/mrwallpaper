import { createFileRoute } from "@tanstack/react-router";
import { CreatorCard } from "@/components/creator-card";
import { EmptyState } from "@/components/empty-state";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { breadcrumbJsonLd, collectionPageJsonLd, pageHead } from "@/lib/seo";
import { listCreators } from "@/lib/server/studio";

const DESCRIPTION = `Original wallpaper artists on ${brand.name}. Browse creator studios and download HD plates for phone and tablet.`;

export const Route = createFileRoute("/creators")({
  loader: () => listCreators(),
  staleTime: 30_000,
  head: ({ loaderData }) => {
    const indexable = Boolean(loaderData?.marketplaceOn && loaderData.items.length > 0);
    return pageHead({
      title: `Wallpaper Creators | ${brand.name}`,
      description: DESCRIPTION,
      path: "/creators",
      noindex: !indexable,
      jsonLd: indexable
        ? [
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Creators", path: "/creators" },
            ]),
            collectionPageJsonLd({ name: "Wallpaper creators", description: DESCRIPTION, path: "/creators" }),
          ]
        : [],
    });
  },
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
