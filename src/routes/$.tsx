import { createFileRoute, notFound } from "@tanstack/react-router";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  beforeLoad: () => {
    throw notFound();
  },
  head: () => noindexHead("Page not found | Mr Wallpapers"),
});
