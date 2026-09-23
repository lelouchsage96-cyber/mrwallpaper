#!/usr/bin/env python3
"""Refresh MrWallpaper desktop/PWA icons without changing the approved artwork.

The approved icon has a large blue quiet zone that looks fine on iOS but makes the
logo appear tiny in Windows/Chromium PWA chrome. This keeps the same artwork and
blue background, crops only that excess quiet zone for desktop/browser icons, and
keeps a full-canvas copy for maskable/mobile-safe use.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageFile, ImageFilter

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "brand-icon-source.png"
ICON_VERSION = 16
SW_VERSION = 23


def desktop_crop(image: Image.Image) -> Image.Image:
    # Measured from the approved artwork: the visible mark sits roughly within
    # x=18.5..89.4% and y=22.8..77.2%. This crop leaves a deliberate blue margin
    # while making the logo/wordmark large enough to read at Windows titlebar size.
    w, h = image.size
    left = round(w * 0.15)
    top = round(h * 0.11)
    right = round(w * 0.93)
    bottom = round(h * 0.89)
    return image.crop((left, top, right, bottom))


def tiny_crop(image: Image.Image) -> Image.Image:
    # Slightly tighter only for 16/32/48px favicons.
    w, h = image.size
    return image.crop((round(w * 0.17), round(h * 0.13), round(w * 0.91), round(h * 0.87)))


def write_png(image: Image.Image, path: Path, size: int, sharpen: bool = False) -> None:
    out = image.resize((size, size), Image.Resampling.LANCZOS)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.65, percent=100, threshold=1))
    out.save(path, format="PNG", optimize=True)


def update_manifest() -> None:
    path = PUBLIC / "manifest.webmanifest"
    data = json.loads(path.read_text())
    data["icons"] = [
        {"src": f"/icon-192.png?v={ICON_VERSION}", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": f"/icon-512.png?v={ICON_VERSION}", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": f"/icon-maskable-192.png?v={ICON_VERSION}", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
        {"src": f"/icon-maskable-512.png?v={ICON_VERSION}", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ]
    path.write_text(json.dumps(data, indent=2) + "\n")


def update_root() -> None:
    path = ROOT / "src/routes/__root.tsx"
    text = path.read_text()
    text = re.sub(r'content: "/icon-192\.png\?v=\d+"', f'content: "/icon-192.png?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/favicon\.ico\?v=\d+"', f'href: "/favicon.ico?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/manifest\.webmanifest\?v=\d+"', f'href: "/manifest.webmanifest?v={ICON_VERSION}"', text)
    text = re.sub(r"navigator\.serviceWorker\.register\('/sw\.js\?v=\d+'", f"navigator.serviceWorker.register('/sw.js?v={SW_VERSION}'", text)

    # Give desktop browsers an explicit small PNG so they do not have to infer a
    # tiny titlebar glyph from the large PWA icon.
    png_line = f'        {{ rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v={ICON_VERSION}" }},'
    if "/favicon-32.png" not in text:
        marker = f'        {{ rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico?v={ICON_VERSION}" }},'
        text = text.replace(marker, marker + "\n" + png_line)

    path.write_text(text)


def update_service_worker() -> None:
    path = PUBLIC / "sw.js"
    text = path.read_text()
    text = re.sub(r'const VERSION = "mrwallpapers-v\d+";', f'const VERSION = "mrwallpapers-v{SW_VERSION}";', text)
    text = re.sub(r'/manifest\.webmanifest\?v=\d+', f'/manifest.webmanifest?v={ICON_VERSION}', text)
    text = re.sub(r'/favicon\.ico\?v=\d+', f'/favicon.ico?v={ICON_VERSION}', text)
    text = re.sub(r'/icon-192\.png\?v=\d+', f'/icon-192.png?v={ICON_VERSION}', text)
    text = re.sub(r'/icon-512\.png\?v=\d+', f'/icon-512.png?v={ICON_VERSION}', text)

    if f'"/favicon-32.png?v={ICON_VERSION}"' not in text:
        text = text.replace(
            f'"/favicon.ico?v={ICON_VERSION}",',
            f'"/favicon.ico?v={ICON_VERSION}", "/favicon-32.png?v={ICON_VERSION}",',
            1,
        )
    if f'"/icon-maskable-192.png?v={ICON_VERSION}"' not in text:
        text = text.replace(
            f'"/icon-512.png?v={ICON_VERSION}"',
            f'"/icon-512.png?v={ICON_VERSION}", "/icon-maskable-192.png?v={ICON_VERSION}", "/icon-maskable-512.png?v={ICON_VERSION}"',
            1,
        )

    old_fetch = 'url.pathname === "/favicon.ico" || url.pathname === "/apple-touch-icon.png" || url.pathname === "/icon-192.png" || url.pathname === "/icon-512.png" || url.pathname === "/manifest.webmanifest"'
    new_fetch = 'url.pathname === "/favicon.ico" || url.pathname === "/favicon-32.png" || url.pathname === "/apple-touch-icon.png" || url.pathname === "/icon-192.png" || url.pathname === "/icon-512.png" || url.pathname === "/icon-maskable-192.png" || url.pathname === "/icon-maskable-512.png" || url.pathname === "/manifest.webmanifest"'
    text = text.replace(old_fetch, new_fetch)
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
    # Preserve the currently approved art once, then always generate from it so
    # rerunning this script never crops an already-cropped icon.
    if not SOURCE.exists():
        shutil.copyfile(PUBLIC / "icon-512.png", SOURCE)

    with Image.open(SOURCE) as im:
        approved = im.convert("RGB")

    desktop = desktop_crop(approved)
    tiny = tiny_crop(approved)

    write_png(desktop, PUBLIC / "icon-512.png", 512)
    write_png(desktop, PUBLIC / "icon-192.png", 192, sharpen=True)

    # Full approved canvas is already generously padded, so it is naturally
    # mask-safe without shrinking the logo into another dark tile.
    write_png(approved, PUBLIC / "icon-maskable-512.png", 512)
    write_png(approved, PUBLIC / "icon-maskable-192.png", 192, sharpen=True)

    for size in (16, 32, 48):
        write_png(tiny, PUBLIC / f"favicon-{size}.png", size, sharpen=True)
    ico_base = tiny.resize((48, 48), Image.Resampling.LANCZOS).filter(
        ImageFilter.UnsharpMask(radius=0.65, percent=100, threshold=1)
    )
    ico_base.save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

    update_manifest()
    update_root()
    update_service_worker()
    update_browserconfig()


if __name__ == "__main__":
    main()
