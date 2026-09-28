import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, Coffee, Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BottomNav } from "@/components/bottom-nav";
import { DownloadSheet } from "@/components/download-sheet";
import { FavoriteButton } from "@/components/favorite-button";
import { PfpGrid } from "@/components/pfp-grid";
import { Button } from "@/components/ui/button";
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
import { formatBytes, formatCount } from "@/lib/utils";

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
  const navigate = useNavigate();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean(pfp?.isFavorite));

  useEffect(() => {
    setIsFavorite(Boolean(pfp?.isFavorite));
  }, [pfp?.id, pfp?.isFavorite]);

  if (!pfp) return null;

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({ to: "/pfps" });
  }

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
      <main className="mx-auto max-w-7xl pb-28 pt-[env(safe-area-inset-top)] lg:pb-16">
        <div className="px-4 pt-3 lg:px-6 lg:pt-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="grid size-11 place-items-center rounded-full bg-elevated text-fg"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void share()}
                aria-label="Share PFP"
                className="grid size-11 place-items-center rounded-full bg-elevated text-fg"
              >
                <Share2 className="size-5" strokeWidth={1.75} />
              </button>
              <FavoriteButton
                wallpaperId={pfp.id}
                isFavorite={isFavorite}
                loginNext={pfpPath(pfp.slug || pfp.id)}
                onChange={setIsFavorite}
                className="bg-elevated backdrop-blur-none"
              />
            </div>
          </div>

          <div className="mt-3 hidden lg:block">
            <Breadcrumbs
              items={[
                { name: "Home", href: "/app" },
                { name: "PFPs", href: "/pfps" },
                { name: pfp.categoryName, href: pfpCategoryPath(pfp.categorySlug) },
                { name: pfp.title },
              ]}
            />
          </div>
        </div>

      <div className="mt-4 grid gap-8 px-4 lg:mt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start lg:gap-12 lg:px-6 xl:gap-20">
        <section className="min-w-0">
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
          <h1 className="mt-2 font-display text-3xl leading-tight text-fg lg:text-4xl">{pfp.title}</h1>
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
                  Preview how this square image looks when an app displays your profile photo as a circle.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button className="min-w-0 flex-1 sm:flex-none sm:min-w-52" onClick={() => setDownloadOpen(true)}>
              <Download className="size-4" />
              Download PFP
            </Button>
            <a
              href={brand.support.kofi}
              target="_blank"
              rel="noreferrer"
              aria-label="Support MrWallpaper on Ko-fi"
              className="mw-support-button group relative inline-flex h-11 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-semibold text-fg transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              <Coffee className="mw-support-cup relative z-10 size-4" />
              <span className="relative z-10">Support</span>
            </a>
          </div>

          <details className="group mt-6 border-t border-border pt-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
              <span>PFP details</span>
              <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180" />
            </summary>
            <div className="pb-2 pt-2">
              {pfp.description ? (
                <p className="max-w-xl text-sm leading-relaxed text-muted lg:text-base">{pfp.description}</p>
              ) : null}

              <p className="mt-3 text-xs text-subtle">
                {pfp.width}×{pfp.height} · {formatBytes(pfp.fileSizeBytes)} · {formatCount(pfp.downloadCount)} downloads
              </p>

              {pfp.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
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
            </div>
          </details>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-border px-4 pt-8 lg:px-6">
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
