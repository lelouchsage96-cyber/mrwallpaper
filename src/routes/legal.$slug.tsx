import { createFileRoute, notFound } from "@tanstack/react-router";
import { InfoPageHeader } from "@/components/info-page-header";
import { SiteFooter } from "@/components/site-footer";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { copyrightPolicy, termsOfService } from "@/lib/legal-terms";
import { privacyPolicy } from "@/lib/legal-privacy";
import { pageHead } from "@/lib/seo";

const pages: Record<string, { title: string; body: string[]; eyebrow: string }> = {
  privacy: { title: t.profile.privacy, body: privacyPolicy, eyebrow: "Privacy" },
  terms: { title: t.profile.terms, body: termsOfService, eyebrow: "Terms" },
  copyright: { title: t.profile.copyright, body: copyrightPolicy, eyebrow: "Copyright" },
  guidelines: {
    title: t.profile.guidelines,
    eyebrow: "Guidelines",
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
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-8">
      <InfoPageHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={`Important information about ${page.title.toLowerCase()} on Mr Wallpapers.`}
        backHref="/"
      />

      <article className="mt-8 max-w-2xl rounded-2xl border border-border/70 bg-elevated/45 p-5 sm:p-6">
        <div className="space-y-4 text-sm leading-relaxed text-muted sm:text-base">
          {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
