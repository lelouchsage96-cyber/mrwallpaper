import { createFileRoute } from "@tanstack/react-router";
import { WallpaperFeedPage } from "@/components/wallpaper-feed-page";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/app/tablet")({
  head: () => noindexHead("iPad & Tablet Wallpapers", "/app/tablet"),
  component: TabletPage,
});

function TabletPage() {
  return (
    <WallpaperFeedPage
      title="For iPad & Tablets"
      description="Fresh wallpapers made for iPad and Android tablets, including portrait and landscape layouts."
      sort="latest"
      device="tablet"
    />
  );
}
