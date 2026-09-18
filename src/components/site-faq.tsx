import { ChevronDown } from "lucide-react";
import { brand } from "@/lib/brand";

const itemClass =
  "group rounded-2xl bg-elevated px-4 py-1 shadow-[var(--shadow-border)] sm:px-5";

const summaryClass =
  "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-sm font-medium text-fg marker:hidden [&::-webkit-details-marker]:hidden";

export function SiteFaq() {
  return (
    <section id="faq" className="mt-14 scroll-mt-20" aria-labelledby="faq-title">
      <div className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Helpful answers</p>
        <h2 id="faq-title" className="mt-1 font-display text-3xl text-fg sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
          Quick answers about downloads, devices, submissions and copyright on Mr Wallpapers.
        </p>
      </div>

      <div className="mt-5 grid gap-2 lg:grid-cols-2 lg:items-start">
        <details className={itemClass}>
          <summary className={summaryClass}>
            Are wallpapers on Mr Wallpapers free?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            Yes. Published wallpapers on Mr Wallpapers are free to browse and download. There is no premium wallpaper tier.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            Do I need an account to download wallpapers?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            No. You can browse and download published wallpapers without signing in. An account is required for community features such as submitting a wallpaper.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            Which devices are supported?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            The catalog includes wallpapers for iPhone, Android phones, iPad and other tablets. Check the wallpaper dimensions and preview to choose the best fit for your screen.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            Are all wallpapers available in 4K?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            No. The library includes both HD and 4K wallpapers, depending on the source image. We do not label a wallpaper as 4K unless its resolution supports it.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            How do I submit a wallpaper?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            Sign in and use the{" "}
            <a href="/submit" className="font-medium text-fg underline underline-offset-4">
              Submit a wallpaper
            </a>{" "}
            page. You can add the details manually or use the optional OpenAI metadata tool before sending it for review.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            Are submitted wallpapers published automatically?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            No. Every community submission stays private until it is manually reviewed and approved by Mr Wallpapers.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            What can I submit?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            Submit only images you created or have permission to share and distribute. Do not upload copyrighted material you do not have the right to provide.
          </p>
        </details>

        <details className={itemClass}>
          <summary className={summaryClass}>
            How can I report a copyright issue?
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="pb-4 text-sm leading-6 text-muted">
            Use our{" "}
            <a href={brand.legal.copyright} className="font-medium text-fg underline underline-offset-4">
              Copyright Complaint
            </a>{" "}
            page and include the relevant wallpaper or page URL so the report can be reviewed.
          </p>
        </details>
      </div>
    </section>
  );
}
