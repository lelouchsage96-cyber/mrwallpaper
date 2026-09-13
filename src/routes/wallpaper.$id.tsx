import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, Download, Flag, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { showActionToast } from "@/components/action-toast";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DevicePreview, type PreviewMode } from "@/components/device-preview";
import { DownloadSheet } from "@/components/download-sheet";
import { EmptyState } from "@/components/empty-state";
import { FavoriteButton } from "@/components/favorite-button";
import { PairCard } from "@/components/pair-card";
import { Button } from "@/components/ui/button";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { designedFor, isLandscape, orientationOf } from "@/lib/device";
import { t } from "@/lib/i18n/en";
import { brand } from "@/lib/brand";
import {
  breadcrumbJsonLd,
  categoryPath,
  imageObjectJsonLd,
  pageHead,
  wallpaperMeta,
  wallpaperPath,
} from "@/lib/seo";
import { getPremiumStatus, getSeoRedirect, getWallpaper, submitReport } from "@/lib/server/api";
import { formatBytes, formatCount } from "@/lib/utils";

export const Route = createFileRoute("/wallpaper/$id")({
  loader: async ({ params }) => {
    const alias = await getSeoRedirect({ data: { path: `/wallpaper/${params.id}` } });
    if (alias?.to_path && alias.to_path !== `/wallpaper/${params.id}`) {
      throw redirect({ href: alias.to_path, statusCode: alias.status || 301 });
    }
    const data = await getWallpaper({ data: { id: params.id } });
    if (data.status === "gone") {
      throw new Response("Gone", {
        status: 410,
        statusText: "Gone",
        headers: { "X-Robots-Tag": "noindex, nofollow" },
      });
    }
    if (!data.wallpaper) throw notFound();
    if (data.canonicalSlug && data.canonicalSlug !== params.id) {
      throw redirect({
        to: "/wallpaper/$id",
        params: { id: data.canonicalSlug },
        replace: true,
        statusCode: 301,
      });
    }
    return data;
  },
  staleTime: 30_000,
  head: ({ loaderData }) => {
    const w = loaderData?.wallpaper;
    if (!w) return pageHead({ title: brand.name, description: brand.positioning, path: "/", noindex: true });
    const meta = wallpaperMeta({
      title: w.title,
      categoryName: w.categoryName,
      deviceType: w.deviceType,
      description: w.description,
      seoTitle: w.seoTitle,
      seoDescription: w.seoDescription,
    });
    const path = w.canonicalPath || wallpaperPath(w.slug);
    return pageHead({
      title: meta.title,
      description: meta.description,
      path,
      image: w.previewUrl,
      imageAlt: w.altText,
      robots: w.robots,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: w.categoryName, path: categoryPath(w.categorySlug) },
          { name: w.title, path },
        ]),
        imageObjectJsonLd({
          title: w.title,
          description: meta.description,
          image: w.previewUrl,
          path,
          width: w.width,
          height: w.height,
        }),
      ],
    });
  },
  component: DetailsPage,
});

function DetailsPage() {
  const { id } = Route.useParams();
  const initial = Route.useLoaderData();
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const [wallpaper, setWallpaper] = useState(initial.wallpaper);
  const [related, setRelated] = useState(initial.related);
  const [pair, setPair] = useState(initial.pair);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [mode, setMode] = useState<PreviewMode>(
    initial.pair && initial.wallpaper && initial.pair.home.id === initial.wallpaper.id ? "home" : "lock",
  );

  useEffect(() => {
    setWallpaper(initial.wallpaper);
    setRelated(initial.related);
    setPair(initial.pair);
    setMode(
      initial.pair && initial.wallpaper && initial.pair.home.id === initial.wallpaper.id ? "home" : "lock",
    );
    void getPremiumStatus().then((s) => setIsPremium(s.isPremium));
  }, [id, initial]);

  useEffect(() => {
    if (!initial.wallpaper) return;
    trackEvent("wallpaper_view", {
      wallpaperId: initial.wallpaper.id,
      categorySlug: initial.wallpaper.categorySlug,
    });
  }, [initial.wallpaper?.id]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({ to: "/app" });
  }

  async function share() {
    const url = `${window.location.origin}${wallpaperPath(wallpaper?.slug || id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: wallpaper?.title ?? brand.name, url });
        trackEvent("share", {
          wallpaperId: wallpaper?.id,
          categorySlug: wallpaper?.categorySlug,
          metadata: { method: "native" },
        });
        showActionToast("Shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      trackEvent("share", {
        wallpaperId: wallpaper?.id,
        categorySlug: wallpaper?.categorySlug,
        metadata: { method: "clipboard" },
      });
      showActionToast("Link copied");
    } catch {
      // Native share cancellation should stay quiet.
    }
  }

  if (!wallpaper) return <EmptyState title={t.errors.notFound} />;

  return (
    <div className="mx-auto max-w-7xl pb-16 pt-[env(safe-area-inset-top)]">
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
              aria-label={t.wallpaper.share}
              className="grid size-11 place-items-center rounded-full bg-elevated text-fg"
            >
              <Share2 className="size-5" strokeWidth={1.75} />
            </button>
            <FavoriteButton
              wallpaperId={wallpaper.id}
              isFavorite={wallpaper.isFavorite}
              onChange={(next) => setWallpaper((w) => (w ? { ...w, isFavorite: next } : w))}
              className="bg-elevated backdrop-blur-none"
            />
          </div>
        </div>
        <div className="mt-3 hidden lg:block">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/app" },
              { name: wallpaper.categoryName, href: categoryPath(wallpaper.categorySlug) },
              { name: wallpaper.title },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 px-4 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-start lg:gap-12 lg:px-6 xl:gap-20">
        <div className="min-w-0">
          <DevicePreview
            src={wallpaper.previewUrl}
            alt={wallpaper.altText || wallpaper.title}
            mode={mode}
            onModeChange={setMode}
            variant={wallpaper.deviceType === "tablet" ? "tablet" : "phone"}
            landscape={isLandscape(wallpaper.width, wallpaper.height)}
          />
        </div>

        <div className="pt-6 lg:pt-4">
          <h1 className="font-display text-3xl text-fg lg:text-4xl">{wallpaper.title}</h1>
          <p className="mt-1 text-sm text-muted">
            <a href={categoryPath(wallpaper.categorySlug)} className="hover:text-fg">
              {wallpaper.categoryName}
            </a>
            {wallpaper.creatorSlug && wallpaper.creatorName ? (
              <>
                {" · "}
                <a href={`/creator/${wallpaper.creatorSlug}`} className="hover:text-fg">
                  {wallpaper.creatorName}
                </a>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-subtle">{designedFor(wallpaper.deviceType)}</p>

          <Button className="mt-5 w-full sm:w-auto sm:min-w-52" onClick={() => setDownloadOpen(true)}>
            <Download className="size-4" />
            Download wallpaper
          </Button>

          <details className="group mt-6 border-t border-border pt-2">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
              <span>Wallpaper details</span>
              <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180" />
            </summary>
            <div className="pb-2 pt-2">
              {wallpaper.description ? (
                <p className="max-w-xl text-sm leading-relaxed text-muted lg:text-base">
                  {wallpaper.description}
                </p>
              ) : null}

              <p className="mt-3 text-xs text-subtle">
                {wallpaper.width}×{wallpaper.height} · {formatBytes(wallpaper.fileSizeBytes)} · {orientationOf(wallpaper.width, wallpaper.height)}
                {" · "}
                {formatCount(wallpaper.downloadCount)} {t.wallpaper.downloads}
              </p>

              {wallpaper.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {wallpaper.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`/wallpapers?q=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-elevated px-3 py-1.5 text-xs text-muted hover:text-fg"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-subtle hover:text-fg"
                onClick={() => {
                  if (!user) {
                    void navigate({ to: "/login", search: { next: wallpaperPath(wallpaper.slug) } });
                    return;
                  }
                  setReportOpen((open) => !open);
                }}
              >
                <Flag className="size-4" />
                {t.wallpaper.report}
              </button>

              {reportOpen ? (
                <div className="mt-2 rounded-[16px] bg-elevated p-4">
                  <p className="text-sm font-medium text-fg">{t.report.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(t.report.reasons).map(([key, label]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await submitReport({
                            data: {
                              wallpaperId: wallpaper.id,
                              reason: key as
                                | "copyright"
                                | "offensive"
                                | "spam"
                                | "duplicate"
                                | "misleading"
                                | "other",
                            },
                          });
                          setReportOpen(false);
                          showActionToast(t.report.thanks);
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>

          {pair ? (
            <section className="mt-6 border-t border-border pt-6">
              <h2 className="font-display text-xl text-fg">Matching set</h2>
              <p className="mt-1 text-sm text-muted">
                {pair.lock.id === wallpaper.id ? t.pairs.asLock : t.pairs.asHome}
              </p>
              <div className="mt-4 flex items-start gap-5">
                <PairCard pair={pair} />
                <a
                  href={`/pair/${pair.slug}`}
                  className="mt-2 inline-flex min-h-11 items-center text-sm text-muted hover:text-fg"
                >
                  {t.pairs.viewCombo}
                </a>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-10 px-4 lg:mt-16 lg:px-6">
          <div className="mb-4 flex items-end justify-between gap-3 border-t border-border pt-8">
            <h2 className="font-display text-xl text-fg lg:text-2xl">More like this</h2>
            <a href={categoryPath(wallpaper.categorySlug)} className="text-sm text-muted hover:text-fg">
              View category
            </a>
          </div>
          <WallpaperGrid items={related} eager={2} />
        </section>
      ) : null}

      <DownloadSheet
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        wallpaperId={wallpaper.id}
        accessType={wallpaper.accessType}
        isPremiumUser={isPremium}
        deviceType={wallpaper.deviceType}
      />
    </div>
  );
}
