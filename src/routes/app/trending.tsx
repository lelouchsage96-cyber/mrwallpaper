import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/trending")({
  beforeLoad: () => {
    throw redirect({ to: "/app/explore" });
  },
});
