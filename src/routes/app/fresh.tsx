import { createFileRoute } from "@tanstack/react-router";
import { WallpaperFeedPage } from "@/components/wallpaper-feed-page";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/app/fresh")({
  head: () => noindexHead("Fresh Wallpapers", "/app/fresh"),
  component: FreshPage,
});

function FreshPage() {
  return (
    <WallpaperFeedPage
      title="Fresh Wallpapers"
      description="The newest phone wallpapers added to Mr Wallpapers, with the latest uploads shown first."
      sort="latest"
      device="phone"
    />
  );
}
