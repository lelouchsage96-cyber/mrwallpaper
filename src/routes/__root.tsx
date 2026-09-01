import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { NotFoundPage } from "@/components/not-found-page";
import { ThemeProvider } from "@/components/theme-provider";
import { BOOT_SCRIPT } from "@/lib/boot-script";
import { AppErrorComponent } from "@/lib/error-component";
import { getPublicSeo } from "@/lib/server/api";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  loader: () => getPublicSeo(),
  staleTime: 60_000,
  errorComponent: AppErrorComponent,
  notFoundComponent: NotFoundPage,
  head: ({ loaderData }) => {
    const seo = loaderData ?? { gaId: "", gscVerification: "", ogImage: "/og.jpg" };
    const meta = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a0b" },
      { name: "application-name", content: "Mr Wallpapers" },
      { name: "apple-mobile-web-app-title", content: "Mr Wallpapers" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ] as Array<Record<string, string>>;
    if (seo.gscVerification) {
      meta.push({ name: "google-site-verification", content: seo.gscVerification });
    }
    const scripts: Array<Record<string, string>> = [];
    if (seo.gaId) {
      scripts.push({
        async: "true",
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(seo.gaId)}`,
      });
      scripts.push({
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.gaId}',{anonymize_ip:true});`,
      });
    }
    return {
      meta,
      scripts,
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600&display=optional",
        },
      ],
    };
  },
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <AuthProvider>
          <ThemeProvider>
            <Outlet />
          </ThemeProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
