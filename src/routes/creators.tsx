import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/creators")({
  beforeLoad: () => {
    throw redirect({ to: "/submit" });
  },
});
