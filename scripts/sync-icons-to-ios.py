#!/usr/bin/env python3
"""Make every MrWallpaper platform icon match the known-good iOS Home Screen icon.

The current iOS Apple touch icon is the visual source of truth. We do not crop,
reframe, recolor, redraw, sharpen, add padding, or alter the artwork. We only
resize the exact same composition for the dimensions required by each platform.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "apple-touch-icon.png"
ICON_VERSION = 20
SW_VERSION = 27

CANONICAL_192 = PUBLIC / f"mrwallpaper-icon-192-v{ICON_VERSION}.png"
CANONICAL_512 = PUBLIC / f"mrwallpaper-icon-512-v{ICON_VERSION}.png"
CANONICAL_ICO = PUBLIC / f"mrwallpaper-favicon-v{ICON_VERSION}.ico"


def resized(source: Image.Image, size: int) -> Image.Image:
    return source.resize((size, size), Image.Resampling.LANCZOS)


def write_assets(source: Image.Image) -> None:
    icon192 = resized(source, 192)
    icon512 = resized(source, 512)

    # Canonical, cache-busted cross-platform assets.
    icon192.save(CANONICAL_192, "PNG", optimize=True)
    icon512.save(CANONICAL_512, "PNG", optimize=True)

    # Compatibility paths use the exact same pixels/composition.
    icon192.save(PUBLIC / "icon-192.png", "PNG", optimize=True)
    icon512.save(PUBLIC / "icon-512.png", "PNG", optimize=True)

    ico_base = resized(source, 256)
    ico_base.save(
        CANONICAL_ICO,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    ico_base.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )


def update_manifest() -> None:
    path = PUBLIC / "manifest.webmanifest"
    data = json.loads(path.read_text())
    data["icons"] = [
        {
            "src": f"/mrwallpaper-icon-192-v{ICON_VERSION}.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any",
        },
        {
            "src": f"/mrwallpaper-icon-512-v{ICON_VERSION}.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any",
        },
    ]
    path.write_text(json.dumps(data, indent=2) + "\n")


def update_root() -> None:
    path = ROOT / "src/routes/__root.tsx"
    text = path.read_text()

    text = re.sub(
        r'content: "/(?:icon-192\.png\?v=\d+|mrwallpaper-icon-192-v\d+\.png)"',
        f'content: "/mrwallpaper-icon-192-v{ICON_VERSION}.png"',
        text,
    )

    # One canonical browser favicon declaration only.
    text = re.sub(
        r'\{ rel: "icon", type: "image/x-icon", href: "/[^"]+\.ico(?:\?v=\d+)?" \},',
        f'{{ rel: "icon", type: "image/x-icon", href: "/mrwallpaper-favicon-v{ICON_VERSION}.ico" }},',
        text,
    )
    text = re.sub(
        r'\n\s*\{ rel: "shortcut icon"[^\n]+\},',
        "",
        text,
    )

    text = re.sub(
        r'href: "/apple-touch-icon\.png\?v=\d+"',
        f'href: "/apple-touch-icon.png?v={ICON_VERSION}"',
        text,
    )
    text = re.sub(
        r'href: "/manifest\.webmanifest\?v=\d+"',
        f'href: "/manifest.webmanifest?v={ICON_VERSION}"',
        text,
    )
    text = re.sub(
        r"navigator\.serviceWorker\.register\('/sw\.js\?v=\d+'",
        f"navigator.serviceWorker.register('/sw.js?v={SW_VERSION}'",
        text,
    )
    path.write_text(text)


def update_browserconfig() -> None:
    (PUBLIC / "browserconfig.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<browserconfig>\n'
        '  <msapplication>\n'
        '    <tile>\n'
        f'      <square70x70logo src="/mrwallpaper-icon-192-v{ICON_VERSION}.png"/>\n'
        f'      <square150x150logo src="/mrwallpaper-icon-192-v{ICON_VERSION}.png"/>\n'
        f'      <square310x310logo src="/mrwallpaper-icon-512-v{ICON_VERSION}.png"/>\n'
        '      <TileColor>#0a0a0b</TileColor>\n'
        '    </tile>\n'
        '  </msapplication>\n'
        '</browserconfig>\n'
    )


def update_service_worker() -> None:
    path = PUBLIC / "sw.js"
    text = path.read_text()
    text = re.sub(
        r'const VERSION = "mrwallpapers-v\d+";',
        f'const VERSION = "mrwallpapers-v{SW_VERSION}";',
        text,
    )

    app_shell = (
        f'const APP_SHELL = ["/app", "/manifest.webmanifest?v={ICON_VERSION}", '
        f'"/mrwallpaper-favicon-v{ICON_VERSION}.ico", "/apple-touch-icon.png?v={ICON_VERSION}", '
        f'"/mrwallpaper-icon-192-v{ICON_VERSION}.png", "/mrwallpaper-icon-512-v{ICON_VERSION}.png"];'
    )
    text = re.sub(r'const APP_SHELL = \[[^\n]+\];', app_shell, text)

    text = re.sub(
        r'icon: "/(?:icon-192\.png\?v=\d+|mrwallpaper-icon-192-v\d+\.png)",',
        f'icon: "/mrwallpaper-icon-192-v{ICON_VERSION}.png",',
        text,
    )
    text = re.sub(
        r'badge: "/(?:icon-192\.png\?v=\d+|mrwallpaper-icon-192-v\d+\.png)",',
        f'badge: "/mrwallpaper-icon-192-v{ICON_VERSION}.png",',
        text,
    )

    # Cache the canonical icons while keeping legacy paths working if an older
    # installed PWA asks for them during the transition.
    old_condition = (
        'url.pathname === "/favicon.ico" || url.pathname === "/mrwallpaper-favicon-v19.ico" || '
        'url.pathname === "/apple-touch-icon.png" || url.pathname === "/icon-192.png" || '
        'url.pathname === "/icon-512.png" || url.pathname === "/manifest.webmanifest"'
    )
    new_condition = (
        'url.pathname === "/favicon.ico" || '
        f'url.pathname === "/mrwallpaper-favicon-v{ICON_VERSION}.ico" || '
        'url.pathname === "/apple-touch-icon.png" || url.pathname === "/icon-192.png" || '
        'url.pathname === "/icon-512.png" || '
        f'url.pathname === "/mrwallpaper-icon-192-v{ICON_VERSION}.png" || '
        f'url.pathname === "/mrwallpaper-icon-512-v{ICON_VERSION}.png" || '
        'url.pathname === "/manifest.webmanifest"'
    )
    text = text.replace(old_condition, new_condition)
    path.write_text(text)


def main() -> None:
    with Image.open(SOURCE) as im:
        im.load()
        approved = im.convert("RGBA")

    write_assets(approved)
    update_manifest()
    update_root()
    update_browserconfig()
    update_service_worker()


if __name__ == "__main__":
    main()
