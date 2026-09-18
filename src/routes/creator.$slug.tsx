import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/creator/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/submit" });
  },
});
