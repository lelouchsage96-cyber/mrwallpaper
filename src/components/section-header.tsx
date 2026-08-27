import { Link } from "@tanstack/react-router";
import { t } from "@/lib/i18n/en";

type SeeAllTo =
  | "/app/explore"
  | "/app/premium"
  | "/app/downloads"
  | "/app/favorites"
  | "/app/taste"
  | "/app/creators"
  | "/creators";

type ExploreSearch = {
  q?: string;
  category?: string;
  access?: "free" | "premium";
  sort?: "latest" | "trending" | "downloads" | "favorites";
  device?: "all" | "phone" | "tablet";
};

export function SectionHeader({
  title,
  to,
  search,
}: {
  title: string;
  to?: SeeAllTo;
  search?: ExploreSearch;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-display text-xl text-fg md:text-2xl">{title}</h2>
      {to ? (
        <Link
          to={to}
          search={search}
          className="pb-0.5 text-sm text-muted transition-colors duration-150 hover:text-fg"
        >
          {t.home.seeAll}
        </Link>
      ) : null}
    </div>
  );
}
