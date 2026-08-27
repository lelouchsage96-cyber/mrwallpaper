import { createFileRoute, notFound } from "@tanstack/react-router";
import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n/en";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    if (!pages[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const page = pages[params.slug];
    if (!page) {
      return pageHead({
        title: `Page not found | ${brand.name}`,
        description: brand.positioning,
        path: `/legal/${params.slug}`,
        noindex: true,
      });
    }
    return pageHead({
      title: `${page.title} | ${brand.name}`,
      description: page.body[0]?.slice(0, 160) || brand.positioning,
      path: `/legal/${params.slug}`,
    });
  },
  component: LegalPage,
});

const pages: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: t.profile.privacy,
    body: [
      `${brand.name} collects the account information you provide at sign-in, plus wallpaper views, favorites, downloads, and search queries needed to run the product.`,
      "We do not sell personal information. Analytics events avoid unnecessary personal data.",
      "You can delete your Mr Wallpapers data from Profile. Some financial or security records may be retained where the law requires it.",
    ],
  },
  terms: {
    title: t.profile.terms,
    body: [
      `By using ${brand.name} you agree to use the service lawfully and not to scrape, redistribute, or claim ownership of wallpapers you do not have rights to.`,
      "Premium is billed by the app stores in the native apps. This web preview uses a local entitlement for demonstration only.",
      "We may suspend accounts that abuse downloads, ads, or reporting.",
    ],
  },
  copyright: {
    title: t.profile.copyright,
    body: [
      "Creators must confirm they own or have rights to distribute content before upload.",
      "To report infringement, use Report on a wallpaper and choose Copyright. We will review and may remove content.",
      "This page is a process outline, not legal advice.",
    ],
  },
  guidelines: {
    title: t.profile.guidelines,
    body: [
      "No stolen work, hate, spam, or misleading metadata.",
      "Uploads must meet resolution and format rules configured by admins.",
      "Repeat violations can lead to suspension.",
    ],
  },
};

function LegalPage() {
  const { slug } = Route.useParams();
  const page = pages[slug];
  if (!page) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <a href="/" className="text-sm text-muted hover:text-fg">
        Home
      </a>
      <h1 className="mt-4 font-display text-4xl text-fg">{page.title}</h1>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-subtle">{t.legal.draft}</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
        {page.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </main>
  );
}
