import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

const BODY = `User-agent: *
Allow: /
Disallow: /ops
Disallow: /ops/
Disallow: /studio
Disallow: /studio/
Disallow: /login
Disallow: /onboarding
Disallow: /api/
Disallow: /auth/

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=86400",
          },
        }),
    },
  },
});
