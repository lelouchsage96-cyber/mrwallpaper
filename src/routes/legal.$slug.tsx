import { createFileRoute, notFound } from "@tanstack/react-router";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { copyrightPolicy, termsOfService } from "@/lib/legal-terms";
import { privacyPolicy } from "@/lib/legal-privacy";
import { pageHead } from "@/lib/seo";

const pages: Record<string, { title: string; body: string[] }> = {
  privacy: { title: t.profile.privacy, body: privacyPolicy },
  terms: { title: t.profile.terms, body: termsOfService },
  copyright: { title: t.profile.copyright, body: copyrightPolicy },
  guidelines: {
    title: t.profile.guidelines,
    body: [
      "Do not submit stolen, infringing, hateful, malicious, deceptive, or unlawful content.",
      "Metadata should accurately describe the wallpaper and should not be used for spam or misleading search manipulation.",
      "Content or accounts that repeatedly violate these guidelines may be removed, restricted, or suspended.",
    ],
  },
};

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    if (!pages[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const page = pages[params.slug];
    if (!page) return pageHead({ title: `Page not found | ${brand.name}`, description: brand.positioning, path: `/legal/${params.slug}`, noindex: true });
    return pageHead({ title: `${page.title} | ${brand.name}`, description: page.body[0]?.slice(0, 160) || brand.positioning, path: `/legal/${params.slug}` });
  },
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useParams();
  const page = pages[slug];
  if (!page) return null;
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/" className="text-sm text-muted hover:text-fg">Home</a>
      <h1 className="mt-4 font-display text-4xl text-fg">{page.title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
        {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </main>
  );
}
