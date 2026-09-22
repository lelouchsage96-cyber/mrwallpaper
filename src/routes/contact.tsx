import { createFileRoute } from "@tanstack/react-router";
import { InfoPageHeader } from "@/components/info-page-header";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/lib/brand";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      title: `Contact | ${brand.name}`,
      description: `Contact ${brand.name} for support, feedback, or copyright questions.`,
      path: "/contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-8">
      <InfoPageHeader
        eyebrow="Contact"
        title="Contact Us"
        description="Questions, feedback or a wallpaper issue? The fastest way to reach Mr Wallpapers is through Instagram."
        backHref="/"
      />

      <section className="mt-8 max-w-2xl rounded-2xl border border-border/70 bg-elevated/45 p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          For support, feedback, or website questions, send us a message on Instagram. Please include any relevant wallpaper or page URL so we can help faster.
        </p>

        <a
          href={brand.social.instagram}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          Message us on Instagram
        </a>

        <p className="mt-6 border-t border-border/70 pt-5 text-sm text-muted">
          For copyright complaints, please review our{" "}
          <a href={brand.legal.copyright} className="font-medium text-fg underline underline-offset-4">
            Copyright Complaint process
          </a>
          .
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
