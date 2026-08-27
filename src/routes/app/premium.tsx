import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/premium")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
