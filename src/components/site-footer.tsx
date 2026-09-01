import { Instagram } from "lucide-react";
import { brand } from "@/lib/brand";

function XIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2H21.5l-7.12 8.136L22.75 22h-6.555l-5.134-6.714L5.188 22H1.93l7.61-8.697L1.5 2h6.72l4.64 6.135L18.244 2Zm-1.143 17.91h1.804L7.24 3.98H5.304L17.1 19.91Z" />
    </svg>
  );
}

function TikTokIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14.5 2h3.15c.2 1.65 1.16 3.2 2.73 4.16.84.52 1.73.77 2.62.83v3.19a8.3 8.3 0 0 1-5.27-1.65v7.2A6.27 6.27 0 1 1 12.3 9.5v3.24a3.08 3.08 0 1 0 2.2 2.95V2Z" />
    </svg>
  );
}

function PinterestIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.64 19.31c-.08-1.58-.02-3.48.4-5.28l1.29-5.46s-.32-.65-.32-1.61c0-1.51.87-2.64 1.96-2.64.93 0 1.37.7 1.37 1.53 0 .94-.59 2.33-.9 3.62-.26 1.08.54 1.96 1.6 1.96 1.93 0 3.41-2.03 3.41-4.97 0-2.6-1.87-4.42-4.54-4.42-3.1 0-4.91 2.32-4.91 4.72 0 .94.36 1.94.81 2.49.09.11.1.2.08.31l-.3 1.21c-.05.2-.16.24-.36.15-1.35-.63-2.2-2.61-2.2-4.2 0-3.42 2.49-6.56 7.17-6.56 3.77 0 6.69 2.69 6.69 6.28 0 3.75-2.36 6.77-5.64 6.77-1.1 0-2.14-.57-2.49-1.25l-.68 2.58c-.25.95-.92 2.14-1.37 2.87.99.3 2.04.47 3.13.47A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

const socialClass =
  "grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-fg";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-7 text-sm text-muted">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-muted">© 2026 {brand.name}. All Rights Reserved.</p>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
          <a href={brand.legal.terms} className="transition-colors hover:text-fg">
            Terms & Conditions
          </a>
          <a href={brand.legal.privacy} className="transition-colors hover:text-fg">
            Privacy Policy
          </a>
          <a href="/about" className="transition-colors hover:text-fg">
            About
          </a>
          <a href="/contact" className="transition-colors hover:text-fg">
            Contact Us
          </a>
          <a href={brand.legal.copyright} className="transition-colors hover:text-fg">
            Copyright Complaint
          </a>
        </nav>

        <div className="flex items-center gap-1" aria-label="Social links">
          <a href={brand.social.x} target="_blank" rel="noreferrer" aria-label="X" className={socialClass}>
            <XIcon />
          </a>
          <a
            href="https://www.tiktok.com/@mrwallpaper__"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className={socialClass}
          >
            <TikTokIcon />
          </a>
          <a
            href={brand.social.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className={socialClass}
          >
            <Instagram className="size-5" />
          </a>
          <a
            href={brand.social.pinterest}
            target="_blank"
            rel="noreferrer"
            aria-label="Pinterest"
            className={socialClass}
          >
            <PinterestIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
