import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ href: `/wallpapers/${params.slug}`, statusCode: 301 });
  },
});
