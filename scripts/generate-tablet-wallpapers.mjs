#!/usr/bin/env node
/**
 * Quiet iPad / tablet plates — landscape 4:3 and portrait 3:4 —
 * matching the existing Mr Wallpapers grain + geometry language.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const ROOT = "/workspace";
const OUT = join(ROOT, "public/wallpapers");
const THUMBS = join(OUT, "thumbs");
mkdirSync(OUT, { recursive: true });
mkdirSync(THUMBS, { recursive: true });

const plates = [
  {
    id: "wide-ridge",
    title: "Wide Ridge",
    w: 2048,
    h: 1536,
    bg: "#1b2430",
    body: (w, h) => {
      const layers = [
        ["#3d4d5c", 0.42],
        ["#6b7c86", 0.58],
        ["#c5b8a5", 0.72],
        ["#e8dcc8", 0.86],
      ];
      return layers
        .map(([col, t], i) => {
          const y = h * t;
          const peak = 90 + i * 28;
          return `<path d="M0 ${y} C ${w * 0.18} ${y - peak}, ${w * 0.36} ${y + peak * 0.35}, ${w * 0.5} ${y - peak * 0.55} S ${w * 0.82} ${y + 36}, ${w} ${y - 18} L ${w} ${h} L 0 ${h} Z" fill="${col}"/>`;
        })
        .join("");
    },
  },
  {
    id: "harbour-span",
    title: "Harbour Span",
    w: 2048,
    h: 1536,
    bg: "#0c1420",
    body: (w, h) => {
      let windows = "";
      const cols = 28;
      const rows = 14;
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          if ((col * 13 + row * 7) % 5 === 0) continue;
          const x = w * 0.06 + col * ((w * 0.88) / cols);
          const y = h * 0.38 + row * ((h * 0.5) / rows);
          const on = (col + row) % 3 !== 0;
          windows += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="9" height="14" fill="#d8c4a0" opacity="${on ? 0.55 : 0.12}"/>`;
        }
      }
      return `<rect y="${h * 0.78}" width="${w}" height="${h * 0.22}" fill="#1c3048" opacity="0.7"/>${windows}`;
    },
  },
  {
    id: "pale-field",
    title: "Pale Field",
    w: 2048,
    h: 1536,
    bg: "#1a1714",
    body: (w, h) => `
      <rect y="${h * 0.28}" width="${w}" height="${h * 0.44}" fill="#c4a98a" opacity="0.28"/>
      <circle cx="${w * 0.72}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.16}" fill="#f0e6d4" opacity="0.92"/>
    `,
  },
  {
    id: "ink-horizon",
    title: "Ink Horizon",
    w: 2048,
    h: 1536,
    bg: "#111114",
    body: (w, h) => `<rect x="${w * 0.12}" y="${h * 0.5 - 5}" width="${w * 0.76}" height="10" rx="5" fill="#d9d4cc"/>`,
  },
  {
    id: "folio-orbit",
    title: "Folio Orbit",
    w: 1536,
    h: 2048,
    bg: "#0c0c0e",
    body: (w, h) => `
      <circle cx="${w * 0.5}" cy="${h * 0.46}" r="${Math.min(w, h) * 0.22}" fill="none" stroke="#e8e2d6" stroke-width="12"/>
      <circle cx="${w * 0.5}" cy="${h * 0.46}" r="12" fill="#e8e2d6"/>
    `,
  },
  {
    id: "folio-still",
    title: "Folio Still",
    w: 1536,
    h: 2048,
    bg: "#12110f",
    body: (w, h) => `
      <text x="${w * 0.5}" y="${h * 0.48}" text-anchor="middle" fill="#e8e0d2" font-family="Georgia, 'Times New Roman', serif" font-size="54" letter-spacing="-0.4">Be still.</text>
      <text x="${w * 0.5}" y="${h * 0.48 + 56}" text-anchor="middle" fill="#e8e0d2" opacity="0.55" font-family="Georgia, serif" font-size="20" letter-spacing="5">PSALM 46:10</text>
    `,
  },
];

function grain(id, opacity = 0.08) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
    <feBlend in="SourceGraphic" mode="overlay"/>
  </filter>`;
}

function svgFor(p) {
  const g = `g-${p.id}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}" preserveAspectRatio="xMidYMid slice">
  <defs>${grain(g, p.id.includes("pale") ? 0.16 : 0.07)}</defs>
  <rect width="${p.w}" height="${p.h}" fill="${p.bg}"/>
  <rect width="${p.w}" height="${p.h}" fill="${p.bg}" filter="url(#${g})"/>
  ${p.body(p.w, p.h)}
</svg>`;
}

function dataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function rasterize() {
  const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
  const sizes = [];
  for (const p of plates) {
    const svg = svgFor(p);
    writeFileSync(join(OUT, `${p.id}.svg`), svg);

    const page = await browser.newPage({
      viewport: { width: p.w, height: p.h },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<html><body style="margin:0;background:#000"><img src="${dataUrl(svg)}" width="${p.w}" height="${p.h}" style="display:block"></body></html>`,
      { waitUntil: "load" },
    );
    const jpg = await page.screenshot({ type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: p.w, height: p.h } });
    writeFileSync(join(OUT, `${p.id}.jpg`), jpg);

    const long = 400;
    const scale = long / Math.max(p.w, p.h);
    const tw = Math.max(1, Math.round(p.w * scale));
    const th = Math.max(1, Math.round(p.h * scale));
    const webpB64 = await page.evaluate(
      async ({ w, h, tw, th }) => {
        const img = document.querySelector("img");
        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h, 0, 0, tw, th);
        const url = canvas.toDataURL("image/webp", 0.72);
        return url.split(",")[1];
      },
      { w: p.w, h: p.h, tw, th },
    );
    const webp = Buffer.from(webpB64, "base64");
    writeFileSync(join(THUMBS, `${p.id}.webp`), webp);
    await page.close();
    sizes.push({ id: p.id, w: p.w, h: p.h, bytes: jpg.length, thumb: webp.length });
    console.log(`wrote ${p.id} ${p.w}x${p.h} jpg=${jpg.length} thumb=${webp.length}`);
  }
  await browser.close();
  writeFileSync(join(ROOT, "artifacts/tablet-sizes.json"), JSON.stringify(sizes, null, 2));
}

await rasterize();
