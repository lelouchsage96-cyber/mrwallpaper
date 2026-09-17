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
      if (ch === "'") return "\u0026apos;";
      return ch;
    })
    .join("");
}

function safeLastmod(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `<lastmod>${esc(date.toISOString())}</lastmod>`;
}

function urlNode(loc: string, extra = "") {
  return `<url><loc>${esc(absUrl(loc))}</loc>${extra}</url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getSitemapData();
        const primaryPages = [
          { path: "/", priority: "1.0" },
          { path: "/wallpapers", priority: "0.9" },
        ];
        const staticPages = [
          "/about",
          "/contact",
          "/legal/privacy",
          "/legal/terms",
          "/legal/copyright",
          "/legal/guidelines",
        ];
        const devicePages = Object.keys(DEVICE_HUBS).map((slug) => categoryPath(slug));
        const seen = new Set<string>();
        const add = (path: string, extra = "") => {
          const canonical = absUrl(path);
          if (seen.has(canonical)) return "";
          seen.add(canonical);
          return urlNode(path, extra);
        };
        const parts = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...primaryPages.map((p) =>
            add(p.path, `<changefreq>daily</changefreq><priority>${p.priority}</priority>`),
          ),
          ...staticPages.map((p) => add(p, "<changefreq>weekly</changefreq><priority>0.5</priority>")),
          ...devicePages.map((p) => add(p, "<changefreq>daily</changefreq><priority>0.8</priority>")),
          ...data.categories.map((c) =>
            add(categoryPath(c.slug), "<changefreq>daily</changefreq><priority>0.8</priority>"),
          ),
          ...data.collections.map((c) =>
            add(`/collection/${c.slug}`, "<changefreq>weekly</changefreq><priority>0.7</priority>"),
          ),
          ...(data.pairs ?? []).map((p) =>
            add(`/pair/${p.slug}`, "<changefreq>weekly</changefreq><priority>0.6</priority>"),
          ),
          ...data.wallpapers.map((w) => {
            const image = w.image
              ? `<image:image><image:loc>${esc(absUrl(w.image))}</image:loc></image:image>`
              : "";
            return add(
              wallpaperPath(w.slug),
              `${safeLastmod(w.updated)}<changefreq>weekly</changefreq><priority>0.8</priority>${image}`,
            );
          }),
          `</urlset>`,
        ];
        return new Response(parts.filter(Boolean).join(""), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
