import { createFileRoute } from "@tanstack/react-router";
import { WallpaperFeedPage } from "@/components/wallpaper-feed-page";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/app/trending")({
  head: () => noindexHead("Trending Wallpapers", "/app/trending"),
  component: TrendingPage,
});

function TrendingPage() {
  return (
    <WallpaperFeedPage
      title="Trending Wallpapers"
      description="The phone wallpapers people are viewing, saving and downloading most right now."
      sort="trending"
      device="phone"
    />
  );
}
