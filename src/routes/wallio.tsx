import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/wallio")({
  beforeLoad: () => {
    throw redirect({
      href: "/app?utm_source=tiktok&utm_medium=bio&utm_campaign=wallio",
      replace: true,
    });
  },
});
