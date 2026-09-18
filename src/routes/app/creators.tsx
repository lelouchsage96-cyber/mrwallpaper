import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/creators")({
  beforeLoad: () => {
    throw redirect({ to: "/submit" });
  },
});
