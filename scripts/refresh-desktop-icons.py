#!/usr/bin/env python3
"""Generate the canonical MrWallpaper icon set from the approved artwork.

No crop, redraw, recolor, padding change, or alternate logo is applied. Platform
files are only resized from the same validated master image.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = ROOT / "scripts" / "assets" / "brand-icon-master.png"
ICON_VERSION = 17
SW_VERSION = 24


def load_master() -> Image.Image:
    # verify() catches truncated/corrupt source files instead of silently
    # generating broken icons from them.
    with Image.open(SOURCE) as check:
        check.verify()
    with Image.open(SOURCE) as image:
        image.load()
        if image.format != "PNG" or image.size != (512, 512):
            raise RuntimeError("brand-icon-master.png must be a valid 512x512 PNG")
        return image.convert("RGB")


def render(image: Image.Image, size: int, sharpen: bool = False) -> Image.Image:
    out = image.resize((size, size), Image.Resampling.LANCZOS)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.45, percent=70, threshold=1))
    return out


def write_png(image: Image.Image, path: Path, size: int, sharpen: bool = False) -> None:
    render(image, size, sharpen=sharpen).save(path, format="PNG", optimize=True)
    with Image.open(path) as check:
        check.verify()
    with Image.open(path) as check:
        check.load()
        if check.size != (size, size):
            raise RuntimeError(f"{path.name} generated at the wrong size")


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
    text = re.sub(r'href: "/favicon-32\.png\?v=\d+"', f'href: "/favicon-32.png?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/apple-touch-icon\.png\?v=\d+"', f'href: "/apple-touch-icon.png?v={ICON_VERSION}"', text)
    text = re.sub(r'href: "/manifest\.webmanifest\?v=\d+"', f'href: "/manifest.webmanifest?v={ICON_VERSION}"', text)
    text = re.sub(
        r"navigator\.serviceWorker\.register\('/sw\.js\?v=\d+'",
        f"navigator.serviceWorker.register('/sw.js?v={SW_VERSION}'",
        text,
    )
    path.write_text(text)


def update_service_worker() -> None:
    path = PUBLIC / "sw.js"
    text = path.read_text()
    text = re.sub(r'const VERSION = "mrwallpapers-v\d+";', f'const VERSION = "mrwallpapers-v{SW_VERSION}";', text)
    for name in ("manifest.webmanifest", "favicon.ico", "favicon-32.png", "apple-touch-icon.png",
                 "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"):
        text = re.sub(rf'/{re.escape(name)}\?v=\d+', f'/{name}?v={ICON_VERSION}', text)
    path.write_text(text)


def update_browserconfig() -> None:
    (PUBLIC / "browserconfig.xml").write_text(
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
    master = load_master()

    # Every platform gets the same complete artwork and framing.
    write_png(master, PUBLIC / "icon-512.png", 512)
    write_png(master, PUBLIC / "icon-192.png", 192, sharpen=True)
    write_png(master, PUBLIC / "icon-maskable-512.png", 512)
    write_png(master, PUBLIC / "icon-maskable-192.png", 192, sharpen=True)
    write_png(master, PUBLIC / "apple-touch-icon.png", 180, sharpen=True)

    for size in (16, 32, 48):
        write_png(master, PUBLIC / f"favicon-{size}.png", size, sharpen=True)

    # ICO contains native small sizes; it is not a scaled copy of a broken large icon.
    render(master, 48, sharpen=True).save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    update_manifest()
    update_root()
    update_service_worker()
    update_browserconfig()


if __name__ == "__main__":
    main()
