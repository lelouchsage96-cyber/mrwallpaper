import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { Download, Share2 } from "lucide-react";
import { useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BottomNav } from "@/components/bottom-nav";
import { DownloadSheet } from "@/components/download-sheet";
import { PfpGrid } from "@/components/pfp-grid";
import { showActionToast } from "@/components/action-toast";
import { brand } from "@/lib/brand";
import {
  breadcrumbJsonLd,
  imageObjectJsonLd,
  pageHead,
  pfpAlt,
  pfpCategoryPath,
  pfpMeta,
  pfpPath,
} from "@/lib/seo";
import { getPfp, getSeoRedirect } from "@/lib/server/api";
import { formatBytes } from "@/lib/utils";

export const Route = createFileRoute("/pfp/$id")({
  loader: async ({ params }) => {
    const requestedId = params.id.trim();
    if (!requestedId || requestedId === "null" || requestedId === "undefined") {
      throw redirect({ to: "/pfps", replace: true, statusCode: 302 });
    }

    const alias = await getSeoRedirect({ data: { path: `/pfp/${requestedId}` } });
    if (alias?.to_path && alias.to_path !== `/pfp/${requestedId}`) {
      throw redirect({ href: alias.to_path, statusCode: alias.status || 301 });
    }

    const data = await getPfp({ data: { id: requestedId } });
    if (data.status === "gone") {
      throw new Response("Gone", {
        status: 410,
        statusText: "Gone",
        headers: { "X-Robots-Tag": "noindex, nofollow" },
      });
    }
    if (!data.pfp) throw notFound();

    if (data.canonicalSlug && data.canonicalSlug !== requestedId) {
      throw redirect({
        to: "/pfp/$id",
        params: { id: data.canonicalSlug },
        replace: true,
        statusCode: 301,
      });
    }

    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData }) => {
    const pfp = loaderData?.pfp;
    if (!pfp) {
      return pageHead({
        title: brand.name,
        description: brand.positioning,
        path: "/pfps",
        noindex: true,
      });
    }

    const meta = pfpMeta({
      title: pfp.title,
      categoryName: pfp.categoryName,
      description: pfp.description,
      seoTitle: pfp.seoTitle,
      seoDescription: pfp.seoDescription,
      primaryKeyword: pfp.primaryKeyword,
    });
    const fallbackPath = pfpPath(pfp.slug || pfp.id);
    const path = pfp.canonicalPath?.startsWith("/pfp/") ? pfp.canonicalPath : fallbackPath;
    const imageAlt = pfpAlt({
      title: pfp.title,
      categoryName: pfp.categoryName,
      altText: pfp.altText,
    });

    return pageHead({
      title: meta.title,
      description: meta.description,
      path,
      image: pfp.previewUrl,
      imageAlt,
      robots: pfp.robots,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "PFPs", path: "/pfps" },
          { name: pfp.categoryName, path: pfpCategoryPath(pfp.categorySlug) },
          { name: pfp.title, path },
        ]),
        imageObjectJsonLd({
          title: pfp.title,
          description: meta.description,
          image: pfp.previewUrl,
          path,
          width: pfp.previewWidth,
          height: pfp.previewHeight,
        }),
      ],
    });
  },
  component: PfpDetailPage,
});

function PfpDetailPage() {
  const { pfp, related } = Route.useLoaderData();
  const [downloadOpen, setDownloadOpen] = useState(false);

  if (!pfp) return null;

  async function share() {
    const url = `${window.location.origin}${pfpPath(pfp.slug || pfp.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: pfp.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showActionToast("Link copied");
    } catch {
      // Native share cancellation should stay quiet.
    }
  }

  const alt = pfpAlt({
    title: pfp.title,
    categoryName: pfp.categoryName,
    altText: pfp.altText,
  });

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:pb-20">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/app" },
          { name: "PFPs", href: "/pfps" },
          { name: pfp.categoryName, href: pfpCategoryPath(pfp.categorySlug) },
          { name: pfp.title },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
        <section>
          <div className="mx-auto max-w-2xl overflow-hidden rounded-[24px] bg-elevated ring-1 ring-border">
            <img
              src={pfp.previewUrl}
              alt={alt}
              width={pfp.previewWidth}
              height={pfp.previewHeight}
              className="aspect-square w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        <aside className="lg:sticky lg:top-6">
          <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Profile picture</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-fg">{pfp.title}</h1>
          <a
            href={pfpCategoryPath(pfp.categorySlug)}
            className="mt-2 inline-flex text-sm text-muted hover:text-fg"
          >
            {pfp.categoryName} PFPs
          </a>

          <div className="mt-6 rounded-2xl bg-elevated p-5 ring-1 ring-border/70">
            <p className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">Profile preview</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="size-24 shrink-0 overflow-hidden rounded-full bg-surface ring-2 ring-border">
                <img src={pfp.previewUrl} alt="" className="size-full object-cover" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg">Circular crop preview</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  See how the square image reads when a profile app displays it as a circle.
                </p>
              </div>
            </div>
          </div>

          {pfp.description ? (
            <p className="mt-5 text-sm leading-relaxed text-muted">{pfp.description}</p>
          ) : null}

          <p className="mt-4 text-xs text-subtle">
            {pfp.width}×{pfp.height} · {formatBytes(pfp.fileSizeBytes)}
          </p>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setDownloadOpen(true)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              <Download className="size-4" />
              Download PFP
            </button>
            <button
              type="button"
              onClick={() => void share()}
              aria-label="Share PFP"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-elevated text-fg ring-1 ring-border/70 hover:bg-surface"
            >
              <Share2 className="size-4" />
            </button>
          </div>

          {pfp.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {pfp.tags.map((tag) => (
                <a
                  key={tag}
                  href={`/pfps?q=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-elevated px-3 py-1.5 text-xs text-muted hover:text-fg"
                >
                  {tag}
                </a>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-border pt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">More like this</p>
              <h2 className="mt-1 font-display text-3xl text-fg">Related PFPs</h2>
            </div>
            <a href={pfpCategoryPath(pfp.categorySlug)} className="text-sm text-muted hover:text-fg">
              View category
            </a>
          </div>
          <PfpGrid items={related} eager={2} />
        </section>
      ) : null}

      <DownloadSheet
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        wallpaperId={pfp.id}
        accessType={pfp.accessType}
        isPremiumUser={false}
        deviceType={pfp.deviceType}
      />
      </main>
      <BottomNav />
    </>
  );
}
