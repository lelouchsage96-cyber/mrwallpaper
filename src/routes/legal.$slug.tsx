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
      "Submit only a wallpaper you created or an image you have permission to share and distribute. Do not submit stolen, infringing, malicious, deceptive, hateful, or unlawful content.",
      "Every community submission is private while pending and is reviewed manually by Mr Wallpapers before publication. Approval is not guaranteed.",
      "Approved community wallpapers are published as free downloads. Submission does not create a paid creator account, premium listing, revenue share, or right to compensation.",
      "OpenAI metadata generation is optional. Review the generated title, description, tags, alt text, primary keyword, and category before submitting because AI suggestions can be inaccurate.",
      "Metadata must accurately describe the wallpaper and must not be used for spam, impersonation, misleading search manipulation, or false claims of ownership.",
      "Mr Wallpapers may reject or remove submissions for duplication, low quality, inaccurate metadata, rights concerns, safety issues, or other reasonable catalog and service needs.",
      "Accounts that repeatedly violate these guidelines may lose submission access or be suspended.",
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
