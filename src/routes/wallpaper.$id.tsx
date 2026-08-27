import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Download, Flag, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DevicePreview, type PreviewMode } from "@/components/device-preview";
import { DownloadSheet } from "@/components/download-sheet";
import { EmptyState } from "@/components/empty-state";
import { FavoriteButton } from "@/components/favorite-button";
import { PairCard } from "@/components/pair-card";
import { Button } from "@/components/ui/button";
import { WallpaperGrid } from "@/components/wallpaper-grid";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { designedFor, downloadLabel, isLandscape, orientationOf } from "@/lib/device";
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
  const [shareMsg, setShareMsg] = useState<string | null>(null);
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

  async function share() {
    const url = `${window.location.origin}${wallpaperPath(wallpaper?.slug || id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: wallpaper?.title ?? brand.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg(t.shareCopied);
    } catch {
      setShareMsg(null);
    }
  }

  if (!wallpaper) return <EmptyState title={t.errors.notFound} />;

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <a
            href="/"
            aria-label="Back"
            className="grid size-11 place-items-center rounded-full bg-elevated text-fg"
          >
            <ChevronLeft className="size-5" />
          </a>
          <p className="text-xs tracking-[0.18em] text-muted uppercase">{t.preview.live}</p>
          <FavoriteButton
            wallpaperId={wallpaper.id}
            isFavorite={wallpaper.isFavorite}
            onChange={(next) => setWallpaper((w) => (w ? { ...w, isFavorite: next } : w))}
            className="bg-elevated backdrop-blur-none"
          />
        </div>
        <div className="mt-3">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: wallpaper.categoryName, href: categoryPath(wallpaper.categorySlug) },
              { name: wallpaper.title },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 px-4">
        <DevicePreview
          src={wallpaper.previewUrl}
          alt={wallpaper.altText || wallpaper.title}
          mode={mode}
          onModeChange={setMode}
          variant={wallpaper.deviceType === "tablet" ? "tablet" : "phone"}
          landscape={isLandscape(wallpaper.width, wallpaper.height)}
        />
      </div>

      <div className="px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-fg">{wallpaper.title}</h1>
            <p className="mt-1 text-sm text-fg">{designedFor(wallpaper.deviceType)}</p>
            <p className="mt-1 text-sm text-muted">
              {wallpaper.creatorSlug && wallpaper.creatorName ? (
                <a href={`/creator/${wallpaper.creatorSlug}`} className="hover:text-fg">
                  {wallpaper.creatorName}
                </a>
              ) : (
                t.wallpaper.byPlatform
              )}
              {" · "}
              <a href={categoryPath(wallpaper.categorySlug)} className="hover:text-fg">
                {wallpaper.categoryName}
              </a>
            </p>
          </div>
        </div>
        {wallpaper.description ? <p className="mt-3 text-sm text-muted">{wallpaper.description}</p> : null}
        {wallpaper.tags.length > 0 ? (
          <p className="mt-3 flex flex-wrap gap-2">
            {wallpaper.tags.map((tag) => (
              <a
                key={tag}
                href={`/wallpapers?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-elevated px-3 py-1 text-xs text-muted hover:text-fg"
              >
                {tag}
              </a>
            ))}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-subtle">
          {wallpaper.width}×{wallpaper.height} · {formatBytes(wallpaper.fileSizeBytes)} · {orientationOf(wallpaper.width, wallpaper.height)}
          {" · "}
          {formatCount(wallpaper.downloadCount)} {t.wallpaper.downloads}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => setDownloadOpen(true)}>
            <Download className="size-4" />
            {downloadLabel(wallpaper.deviceType)}
          </Button>
          <Button variant="secondary" onClick={() => void share()}>
            <Share2 className="size-4" />
            {t.wallpaper.share}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t.wallpaper.report}
            onClick={() => {
              if (!user) {
                void navigate({ to: "/login", search: { next: wallpaperPath(wallpaper.slug) } });
                return;
              }
              setReportOpen(true);
            }}
          >
            <Flag className="size-4" />
          </Button>
        </div>
        {shareMsg ? <p className="mt-2 text-sm text-muted">{shareMsg}</p> : null}

        {pair ? (
          <section className="mt-10">
            <h2 className="font-display text-xl text-fg">{t.pairs.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {pair.lock.id === wallpaper.id ? t.pairs.asLock : t.pairs.asHome}
            </p>
            <div className="mt-4 flex items-start gap-6">
              <PairCard pair={pair} />
              <a
                href={`/pair/${pair.slug}`}
                className="mt-2 inline-flex h-11 items-center text-sm text-muted hover:text-fg"
              >
                {t.pairs.viewCombo}
              </a>
            </div>
          </section>
        ) : null}

        {reportOpen ? (
          <div className="mt-4 rounded-[16px] bg-elevated p-4">
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
                    setShareMsg(t.report.thanks);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-xl text-fg">{t.wallpaper.related}</h2>
            <WallpaperGrid items={related} eager={2} />
          </section>
        ) : null}
      </div>

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
