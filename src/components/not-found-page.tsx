import { MwMark } from "@/components/mw-mark";
import { brand } from "@/lib/brand";
import { noindexHead } from "@/lib/seo";

export function notFoundHead() {
  return noindexHead(`Page not found | ${brand.name}`);
}

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg place-content-center px-6 py-16 text-center">
      <title>{`Page not found | ${brand.name}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <MwMark className="mx-auto size-12" />
      <h1 className="mt-6 font-display text-4xl text-fg">This page is gone</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        That wallpaper or collection isn’t here. It may have been removed, or the link is out of date.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="/" className="grid h-11 place-items-center rounded-full bg-fg px-4 text-sm font-medium text-bg">
          Home
        </a>
        <a href="/wallpapers" className="grid h-11 place-items-center rounded-full bg-elevated px-4 text-sm text-fg">
          Browse wallpapers
        </a>
      </div>
    </main>
  );
}
