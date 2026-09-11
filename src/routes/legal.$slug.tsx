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
      `Last updated: September 11, 2026. ${brand.name} provides free wallpapers and account features through mrwallpaper.org. This Privacy Policy explains what information we collect, why we use it, and the choices available to you.`,
      "Account information. If you create an account, we may process your name, email address, authentication identifiers, and basic profile information. If you sign in with Google, we receive only the account information you authorize Google to share, such as your name, email address, and profile image. We do not receive your Google password.",
      "Usage and analytics information. We use first-party product analytics to understand how the service is used. This may include page and wallpaper views, category visits, searches, downloads, favorites, shares, app opens, device class and viewport size, traffic source or referring website hostname, and basic event timestamps. These analytics help us improve navigation, content quality, performance, and product decisions.",
      "Anonymous analytics identifiers. For visitors who are not signed in, Mr Wallpapers may create random visitor and session identifiers in browser storage so aggregate visits and sessions can be counted without requiring an account. These identifiers are not intended to reveal your real-world identity. Our first-party analytics event records do not store raw IP addresses.",
      "Analytics choices. Where the browser exposes a Do Not Track preference, our first-party client analytics does not send analytics events when that preference is enabled. You can also clear browser storage to reset the anonymous identifier stored on your device. If optional third-party analytics such as Google Analytics is enabled in the future, it may be subject to the provider's own privacy terms and controls.",
      "Password reset and email delivery. If you request a password reset, we use your email address to send a secure, time-limited reset link. Transactional email delivery may be handled by Resend or another email delivery provider we configure for the service.",
      "Service providers. We use third-party infrastructure providers to operate Mr Wallpapers. These may include Vercel for website hosting, content delivery and image optimization; Neon for database hosting; Cloudflare for DNS, security, content delivery and object storage; Google for optional Google sign-in and, if configured, analytics; and Resend for transactional email. These providers process data only as needed to provide their services to us and are subject to their own privacy terms.",
      "Cookies and local storage. Mr Wallpapers may use essential authentication cookies and browser storage to keep you signed in, remember interface preferences, maintain anonymous analytics visitor/session identifiers, support favorites, and provide other core functionality. We do not sell personal information.",
      "Data sharing. We do not sell or rent your personal information to advertisers. We may disclose information when required by law, to protect users or the service, to investigate abuse, or to service providers acting on our behalf.",
      "Data retention. We retain account, service, analytics, and security data only for as long as reasonably necessary for the purposes described in this policy, legal obligations, security, dispute resolution, and service operation. Retention periods can differ by data type and may change as our systems evolve.",
      "Your choices. You may stop using the service at any time. Where account deletion is available in the product, you may use that feature to request deletion of your account data. You may also contact us regarding privacy requests using the support contact shown on Mr Wallpapers.",
      "Children. Mr Wallpapers is not intended to knowingly collect personal information from children in violation of applicable law. If you believe a child has provided personal information improperly, contact us so we can review the matter.",
      "Security. We use reasonable technical and organizational measures designed to protect account data, including secure authentication flows and encrypted connections. No online service can guarantee absolute security.",
      "Changes to this policy. We may update this Privacy Policy when the service or our legal obligations change. The updated version will be posted on this page with a revised effective date.",
    ],
  },
  terms: {
    title: t.profile.terms,
    body: [
      `Last updated: September 1, 2026. These Terms of Service govern your use of ${brand.name} and mrwallpaper.org. By using the service, you agree to these terms. If you do not agree, do not use the service.`,
      "Service description. Mr Wallpapers provides access to wallpapers and related browsing, account, favorites, and download features. The current website is offered as a free service. We may add, remove, improve, or discontinue features over time.",
      "Accounts. You are responsible for the accuracy of information associated with your account and for keeping your credentials secure. You may use supported sign-in methods such as email/password or Google sign-in. You may not impersonate others or use the service for fraudulent or unlawful activity.",
      "Acceptable use. You may not interfere with the service, attempt unauthorized access, abuse automated systems, bypass security controls, scrape the service at unreasonable scale, upload malicious content, or use Mr Wallpapers in a way that violates applicable law or the rights of others.",
      "Wallpaper use and intellectual property. Wallpapers may be owned by Mr Wallpapers, contributing creators, licensors, or other rights holders. Unless a specific item states otherwise, downloading a wallpaper does not transfer ownership or give you permission to resell, redistribute, sublicense, falsely claim authorship of, or commercially exploit the wallpaper. You are responsible for ensuring your use of downloaded content complies with applicable rights and laws.",
      "Copyright complaints. If you believe content on Mr Wallpapers infringes your rights, use the available reporting process or contact us with enough information to identify the work, the allegedly infringing material, your contact information, and the basis of your claim. We may remove or restrict content while reviewing a complaint.",
      "Availability. We aim to keep Mr Wallpapers available and reliable, but we do not guarantee uninterrupted, error-free, or permanent access. Maintenance, provider outages, abuse prevention, technical issues, or other events may temporarily affect the service.",
      "Third-party services. Mr Wallpapers relies on third-party providers, including services for hosting, storage, authentication, databases, DNS/CDN, and email delivery. Your use of certain features may also be subject to those providers' applicable terms and policies.",
      "Suspension and termination. We may restrict or terminate access when reasonably necessary to protect the service or users, respond to legal requirements, address security risks, or stop abuse or violations of these terms.",
      "Disclaimers. Mr Wallpapers is provided on an 'as is' and 'as available' basis to the extent permitted by law. We do not guarantee that every wallpaper is suitable for every device, purpose, or jurisdiction, or that all metadata and content will always be complete or error-free.",
      "Limitation of liability. To the maximum extent permitted by applicable law, Mr Wallpapers and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of or inability to use the service. Nothing in these terms excludes liability that cannot legally be excluded.",
      "Changes to these terms. We may update these Terms of Service as the service changes. Continued use of Mr Wallpapers after updated terms are posted means you accept the revised terms to the extent permitted by law.",
    ],
  },
  copyright: {
    title: t.profile.copyright,
    body: [
      "Only content that may lawfully be distributed should be published on Mr Wallpapers.",
      "To report infringement, use Report on a wallpaper where available or contact us with the affected content URL and details supporting your claim. We will review valid notices and may remove or restrict content.",
      "Knowingly submitting false or misleading copyright claims may have legal consequences. This page provides general process information and is not legal advice.",
    ],
  },
  guidelines: {
    title: t.profile.guidelines,
    body: [
      "Do not submit stolen, infringing, hateful, malicious, deceptive, or unlawful content.",
      "Metadata should accurately describe the wallpaper and should not be used for spam or misleading search manipulation.",
      "Content or accounts that repeatedly violate these guidelines may be removed, restricted, or suspended.",
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
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
        {page.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </main>
  );
}