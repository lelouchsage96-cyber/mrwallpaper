import { createFileRoute } from "@tanstack/react-router";
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
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
      <a href="/app" className="text-sm text-muted transition-colors hover:text-fg">
        Home
      </a>

      <section className="mt-8 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Contact</p>
        <h1 className="mt-3 font-display text-4xl text-fg sm:text-5xl">Contact Us</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted sm:text-base">
          For support, feedback, or website questions, send us a message on Instagram. Please include any relevant wallpaper or page URL so we can help faster.
        </p>

        <a
          href={brand.social.instagram}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg"
        >
          Message us on Instagram
        </a>

        <p className="mt-6 text-sm text-muted">
          For copyright complaints, please review our{" "}
          <a href={brand.legal.copyright} className="text-fg underline underline-offset-4">
            Copyright Complaint process
          </a>
          .
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
