import { createFileRoute } from "@tanstack/react-router";
import { absUrl, categoryPath, DEVICE_HUBS, wallpaperPath } from "@/lib/seo";
import { getSitemapData } from "@/lib/server/api";

function esc(value: string) {
  return [...value]
    .map((ch) => {
      if (ch === "&") return "\u0026amp;";
      if (ch === "<") return "\u0026lt;";
      if (ch === ">") return "\u0026gt;";
      if (ch === '"') return "\u0026quot;";
      return ch;
    })
    .join("");
}

function urlNode(loc: string, extra = "") {
  return `<url><loc>${esc(absUrl(loc))}</loc>${extra}</url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getSitemapData();
        const staticPages = ["/", "/wallpapers", "/legal/privacy", "/legal/terms", "/legal/copyright", "/legal/guidelines"];
        const devicePages = Object.keys(DEVICE_HUBS).map((slug) => categoryPath(slug));
        const parts = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...staticPages.map((p) => urlNode(p, "<changefreq>daily</changefreq><priority>0.8</priority>")),
          ...devicePages.map((p) => urlNode(p, "<changefreq>daily</changefreq><priority>0.7</priority>")),
          ...data.categories.map((c) => urlNode(categoryPath(c.slug), "<changefreq>daily</changefreq><priority>0.7</priority>")),
          ...data.collections.map((c) => urlNode(`/collection/${c.slug}`, "<changefreq>weekly</changefreq>")),
          ...(data.pairs ?? []).map((p) => urlNode(`/pair/${p.slug}`, "<changefreq>weekly</changefreq>")),
          ...data.wallpapers.map((w) =>
            urlNode(
              wallpaperPath(w.slug),
              `<lastmod>${esc(new Date(w.updated).toISOString())}</lastmod><image:image><image:loc>${esc(absUrl(w.image))}</image:loc><image:title>${esc(w.title)}</image:title></image:image>`,
            ),
          ),
          `</urlset>`,
        ];
        return new Response(parts.join(""), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
