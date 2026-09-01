import { createFileRoute, redirect } from "@tanstack/react-router";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/studio")({
  head: () => noindexHead("Studio", "/studio"),
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
