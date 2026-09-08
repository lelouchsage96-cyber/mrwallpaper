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
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Mr Wallpapers" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "msapplication-config", content: "/browserconfig.xml?v=11" },
      { name: "msapplication-TileColor", content: "#0a0a0b" },
      { name: "msapplication-TileImage", content: "/icon-192.png?v=11" },
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
        { rel: "icon", type: "image/x-icon", href: "/icons/v11/favicon.ico" },
        { rel: "shortcut icon", type: "image/x-icon", href: "/icons/v11/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/v11/icon-192.png" },
        { rel: "icon", type: "image/png", sizes: "512x512", href: "/icons/v11/icon-512.png" },
        { rel: "apple-touch-icon", href: "/icons/v11/apple-touch-icon.png" },
        { rel: "apple-touch-icon-precomposed", href: "/icons/v11/apple-touch-icon.png" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest?v=11" },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){});});}`,
          }}
        />
      </body>
    </html>
  );
}
