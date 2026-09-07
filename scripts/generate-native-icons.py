#!/usr/bin/env python3
"""Generate static platform icons from the approved 1024px PNG (requires Pillow).

Usage: python scripts/generate-native-icons.py /path/to/approved-icon.png
Run the normal build afterwards to regenerate TanStack's route tree.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    source_bytes = args.source.read_bytes()
    with Image.open(args.source) as image:
        if image.format != "PNG" or image.size != (1024, 1024):
            parser.error("Supply the approved 1024×1024 PNG; other designs/sizes are not substituted.")
        image.load()
        rgba = image.convert("RGBA")
    # Opaque assets avoid unpredictable Apple backgrounds; retain all source art.
    source = Image.new("RGBA", rgba.size, "#05070b")
    source.alpha_composite(rgba)
    source = source.convert("RGB")
    public = ROOT / "public"
    icons = public / "icons" / "v4"
    icons.mkdir(parents=True, exist_ok=True)
    (icons / "source-1024.png").write_bytes(source_bytes)
    records = []

    def write(name, size, maskable=False):
        if maskable:
            # Fit the entire square artwork within the central 80% safe circle.
            side = int(size * 0.56)
            output = Image.new("RGB", (size, size), "#05070b")
            output.paste(source.resize((side, side), Image.Resampling.LANCZOS),
                         ((size - side) // 2, (size - side) // 2))
        else:
            output = source.resize((size, size), Image.Resampling.LANCZOS)
        path = icons / name
        output.save(path, format="PNG", optimize=True)
        with Image.open(path) as check:
            check.load()
            assert check.format == "PNG" and check.size == (size, size)
        records.append({"url": f"/icons/v4/{name}", "size": size})
        return path

    for size in (16, 32, 48):
        write(f"favicon-{size}.png", size)
    for size in (120, 152, 167, 180):
        write(f"apple-touch-icon-{size}.png", size)
    for size in (192, 512):
        write(f"icon-{size}.png", size)
        write(f"icon-maskable-{size}.png", size, maskable=True)
    for size in (70, 144, 150, 310):
        write(f"mstile-{size}.png", size)
    source.save(public / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    aliases = {
        "apple-touch-icon.png": "apple-touch-icon-180.png",
        "apple-touch-icon-precomposed.png": "apple-touch-icon-180.png",
        "apple-touch-icon-v3.png": "apple-touch-icon-180.png",
        "icon-192.png": "icon-192.png", "icon-512.png": "icon-512.png",
        "icon-v3-192.png": "icon-192.png", "icon-v3-512.png": "icon-512.png",
        "favicon-v3.png": "favicon-32.png", "app-icon.png": "source-1024.png",
    }
    for alias, target in aliases.items():
        shutil.copyfile(icons / target, public / alias)

    manifest_path = public / "manifest.webmanifest"
    manifest = json.loads(manifest_path.read_text())
    manifest["icons"] = [
        {"src": f"/icons/v4/icon-{prefix}{size}.png", "sizes": f"{size}x{size}",
         "type": "image/png", "purpose": purpose}
        for prefix, purpose in (("", "any"), ("maskable-", "maskable"))
        for size in (192, 512)
    ]
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    (public / "browserconfig.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<browserconfig><msapplication><tile>\n'
        '<square70x70logo src="/icons/v4/mstile-70.png"/>\n'
        '<square150x150logo src="/icons/v4/mstile-150.png"/>\n'
        '<square310x310logo src="/icons/v4/mstile-310.png"/>\n'
        '<TileColor>#0a0a0b</TileColor>\n</tile></msapplication></browserconfig>\n')
    root_path = ROOT / "src/routes/__root.tsx"
    root = root_path.read_text()
    root = root.replace('content: "/icon-v3-192.png"', 'content: "/icons/v4/mstile-144.png"')
    if 'name: "msapplication-config"' not in root:
        root = root.replace('      { name: "msapplication-TileColor",',
                            '      { name: "msapplication-config", content: "/browserconfig.xml" },\n'
                            '      { name: "msapplication-TileColor",')
    start = root.index('        { rel: "icon",')
    end = root.index('        { rel: "stylesheet", href: appCss }', start)
    links = ['        { rel: "icon", type: "image/x-icon", sizes: "16x16 32x32 48x48", href: "/favicon.ico?v=4" },']
    for size in (16, 32, 48):
        links.append(f'        {{ rel: "icon", type: "image/png", sizes: "{size}x{size}", href: "/icons/v4/favicon-{size}.png" }},')
    for size in (120, 152, 167, 180):
        links.append(f'        {{ rel: "apple-touch-icon", sizes: "{size}x{size}", href: "/icons/v4/apple-touch-icon-{size}.png" }},')
    root_path.write_text(root[:start] + "\n".join(links) + "\n" + root[end:])
    routes = ROOT / "src/routes"
    for name in ("app-icon[.]png.ts", "apple-touch-icon[.]png.ts", "apple-touch-icon-v3[.]png.ts",
                 "favicon-v3[.]png.ts", "icon-v3-192[.]png.ts", "icon-v3-512[.]png.ts",
                 "icon-v3[.]svg.ts", "icon-v3-maskable[.]svg.ts"):
        (routes / name).unlink(missing_ok=True)
    runtime = ROOT / "src/lib/app-icon"
    if runtime.exists():
        shutil.rmtree(runtime)
    (public / "favicon.svg").unlink(missing_ok=True)
    print(json.dumps({"source_sha256": hashlib.sha256(source_bytes).hexdigest(),
                      "icons": records, "aliases": list(aliases), "ico": "/favicon.ico"}, indent=2))


if __name__ == "__main__":
    main()
