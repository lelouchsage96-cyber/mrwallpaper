#!/usr/bin/env python3
"""Build every desktop/PWA icon from the approved MrWallpaper artwork without altering it.

No cropping, reframing, recoloring, added backgrounds, or logo changes are allowed.
The existing Apple touch icon is the known-good approved artwork, so desktop/PWA
assets are derived from that exact composition only by resizing.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "apple-touch-icon.png"
ICON_VERSION = 17
SW_VERSION = 24


def write_png(source: Image.Image, path: Path, size: int) -> None:
    out = source.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, format="PNG", optimize=True)


def update_manifest() -> None:
    path = PUBLIC / "manifest.webmanifest"
    data = json.loads(path.read_text())
    # Use only unmasked icons. This prevents Chromium/Windows from applying an
    # additional mask/crop that can make the approved artwork look wrong.
    data["icons"] = [
        {"src": f"/icon-192.png?v={ICON_VERSION}", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": f"/icon-512.png?v={ICON_VERSION}", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    ]
    path.write_text(json.dumps(data, indent=2) + "\n")


def update_root() -> None:
    path = ROOT / "src/routes/__root.tsx"
    text = path.read_text()
    text = re.sub(r'content: "/icon-192\.png\?v=\d+"', f'content: "/icon-192.png?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/favicon\.ico\?v=\d+"', f'href: "/favicon.ico?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/favicon-32\.png\?v=\d+"', f'href: "/favicon-32.png?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/manifest\.webmanifest\?v=\d+"', f'href: "/manifest.webmanifest?v={ICON_VERSION}"', text)
    text = re.sub(r"navigator\.serviceWorker\.register\('/sw\.js\?v=\d+'", f"navigator.serviceWorker.register('/sw.js?v={SW_VERSION}'", text)
    path.write_text(text)


def update_service_worker() -> None:
    path = PUBLIC / "sw.js"
    text = path.read_text()
    text = re.sub(r'const VERSION = "mrwallpapers-v\d+";', f'const VERSION = "mrwallpapers-v{SW_VERSION}";', text)
    text = re.sub(r'/manifest\.webmanifest\?v=\d+', f'/manifest.webmanifest?v={ICON_VERSION}', text)
    text = re.sub(r'/favicon\.ico\?v=\d+', f'/favicon.ico?v={ICON_VERSION}', text)
    text = re.sub(r'/favicon-32\.png\?v=\d+', f'/favicon-32.png?v={ICON_VERSION}', text)
    text = re.sub(r'/icon-192\.png\?v=\d+', f'/icon-192.png?v={ICON_VERSION}', text)
    text = re.sub(r'/icon-512\.png\?v=\d+', f'/icon-512.png?v={ICON_VERSION}', text)

    # Remove the experimental maskable icons from the precache and fetch list.
    text = re.sub(r',?\s*"/icon-maskable-192\.png\?v=\d+"', "", text)
    text = re.sub(r',?\s*"/icon-maskable-512\.png\?v=\d+"', "", text)
    text = text.replace(' || url.pathname === "/icon-maskable-192.png"', "")
    text = text.replace(' || url.pathname === "/icon-maskable-512.png"', "")
    path.write_text(text)


def update_browserconfig() -> None:
    path = PUBLIC / "browserconfig.xml"
    path.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<browserconfig>\n'
        '  <msapplication>\n'
        '    <tile>\n'
        f'      <square70x70logo src="/icon-192.png?v={ICON_VERSION}"/>\n'
        f'      <square150x150logo src="/icon-192.png?v={ICON_VERSION}"/>\n'
        f'      <square310x310logo src="/icon-512.png?v={ICON_VERSION}"/>\n'
        '      <TileColor>#0a0a0b</TileColor>\n'
        '    </tile>\n'
        '  </msapplication>\n'
        '</browserconfig>\n'
    )


def main() -> None:
    with Image.open(SOURCE) as im:
        im.load()
        approved = im.convert("RGBA")

    # Preserve the exact approved composition. Only pixel dimensions change.
    write_png(approved, PUBLIC / "icon-192.png", 192)
    write_png(approved, PUBLIC / "icon-512.png", 512)
    write_png(approved, PUBLIC / "favicon-16.png", 16)
    write_png(approved, PUBLIC / "favicon-32.png", 32)
    write_png(approved, PUBLIC / "favicon-48.png", 48)

    # ICO generated from the same unchanged composition.
    approved.resize((48, 48), Image.Resampling.LANCZOS).save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    # Retire maskable files so there is only one canonical artwork path.
    (PUBLIC / "icon-maskable-192.png").unlink(missing_ok=True)
    (PUBLIC / "icon-maskable-512.png").unlink(missing_ok=True)
    (PUBLIC / "brand-icon-source.png").unlink(missing_ok=True)

    update_manifest()
    update_root()
    update_service_worker()
    update_browserconfig()


if __name__ == "__main__":
    main()
