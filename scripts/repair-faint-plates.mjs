#!/usr/bin/env node
/**
 * Hairline plates vanish at card (~174px) and lock-preview (~285px) size.
 * Thicken the marks, keep grain off the strokes, re-rasterize jpg + thumbs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const OUT = "/workspace/public/wallpapers";
const THUMBS = join(OUT, "thumbs");
mkdirSync(THUMBS, { recursive: true });

function grain(id, opacity = 0.06) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
    <feBlend in="SourceGraphic" mode="overlay"/>
  </filter>`;
}

function svg({ id, w, h, bg, defs = "", grainOpacity = 0, body }) {
  const g = grainOpacity > 0 ? grain(`g-${id}`, grainOpacity) : "";
  const overlay =
    grainOpacity > 0
      ? `<rect width="${w}" height="${h}" fill="${bg}" filter="url(#g-${id})"/>`
      : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
  <defs>${g}${defs}</defs>
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${overlay}
  ${body}
</svg>`;
}

const PHONE = { w: 1080, h: 1920 };
const plates = [
  {
    id: "true-black",
    ...PHONE,
    bg: "#000000",
    body: `<circle cx="540" cy="960" r="248" fill="none" stroke="#f4f1ea" stroke-width="16"/>
      <circle cx="540" cy="960" r="6" fill="#f4f1ea"/>`,
  },
  {
    id: "thin-cross",
    ...PHONE,
    bg: "#000000",
    body: `<line x1="540" y1="200" x2="540" y2="1720" stroke="#d8dce4" stroke-width="8" stroke-linecap="round"/>
      <line x1="140" y1="960" x2="940" y2="960" stroke="#d8dce4" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    id: "one-line",
    ...PHONE,
    bg: "#111114",
    body: `<rect x="100" y="954" width="880" height="12" rx="6" fill="#e8e4dc"/>`,
  },
  {
    id: "low-light",
    ...PHONE,
    bg: "#070708",
    body: `<rect x="100" y="954" width="880" height="12" rx="6" fill="#9a9aa4"/>`,
  },
  {
    id: "quiet-orbit",
    ...PHONE,
    bg: "#0c0c0e",
    body: `<circle cx="540" cy="820" r="280" fill="none" stroke="#eee8de" stroke-width="14"/>
      <circle cx="540" cy="820" r="12" fill="#eee8de"/>`,
  },
  {
    id: "overlap-two",
    ...PHONE,
    bg: "#12141a",
    body: `<circle cx="470" cy="820" r="250" fill="none" stroke="#e8ebf2" stroke-width="12" opacity="0.92"/>
      <circle cx="610" cy="820" r="250" fill="none" stroke="#a0a6b4" stroke-width="12" opacity="0.92"/>`,
  },
  {
    id: "two-points",
    ...PHONE,
    bg: "#1a1214",
    grainOpacity: 0.05,
    body: `<circle cx="498" cy="820" r="18" fill="#f0d8dc"/>
      <circle cx="582" cy="820" r="18" fill="#c48a92"/>`,
  },
  {
    id: "charcoal-fold",
    ...PHONE,
    bg: "#141416",
    body: `<rect y="960" width="1080" height="960" fill="#4a4a54"/>
      <rect y="954" width="1080" height="10" fill="#8a8a96"/>`,
  },
  {
    id: "lattice-soft",
    ...PHONE,
    bg: "#101114",
    body: (() => {
      let lines = "";
      for (let x = 90; x < 1080; x += 90)
        lines += `<line x1="${x}" y1="200" x2="${x}" y2="1720" stroke="#d0d4dc" stroke-width="3" opacity="0.7"/>`;
      for (let y = 200; y < 1720; y += 90)
        lines += `<line x1="90" y1="${y}" x2="990" y2="${y}" stroke="#d0d4dc" stroke-width="3" opacity="0.7"/>`;
      return lines;
    })(),
  },
  {
    id: "kepler-dust",
    ...PHONE,
    bg: "#08060e",
    grainOpacity: 0.07,
    defs: `<radialGradient id="r-kepler-dust" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="#d8c6e8" stop-opacity="0.7"/>
      <stop offset="42%" stop-color="#6a4a88" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#08060e" stop-opacity="0"/>
    </radialGradient>`,
    body: `<circle cx="540" cy="780" r="520" fill="url(#r-kepler-dust)"/>
      <circle cx="540" cy="760" r="170" fill="#e4d4f0" opacity="0.82"/>`,
  },
  {
    id: "deep-hold",
    ...PHONE,
    bg: "#0a1218",
    grainOpacity: 0.07,
    body: `<path d="M -40 1100 C 200 980, 400 1220, 640 1080 S 1000 980, 1120 1120 L 1120 1920 L -40 1920 Z" fill="#1a3040" opacity="0.9"/>
      <path d="M -40 1280 C 240 1180, 480 1400, 720 1260 S 1040 1200, 1120 1300 L 1120 1920 L -40 1920 Z" fill="#8ab0c0" opacity="0.72"/>`,
  },
  {
    id: "night-circuit",
    ...PHONE,
    bg: "#0a0a0c",
    grainOpacity: 0.1,
    body: `${[
      [180, 1400, 56, "#ff4d3a"],
      [300, 1500, 28, "#ff4d3a"],
      [700, 1380, 42, "#ffd0a8"],
      [820, 1520, 22, "#ff4d3a"],
      [500, 1600, 34, "#3a6cff"],
      [240, 1680, 18, "#ffd0a8"],
      [900, 1700, 26, "#ff4d3a"],
      [640, 1460, 20, "#3a6cff"],
    ]
      .map(
        ([x, y, r, col]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="0.88"/>`,
      )
      .join("")}
      <rect y="1748" width="1080" height="8" fill="#ff4d3a" opacity="0.55"/>`,
  },
  {
    id: "folio-orbit",
    w: 1536,
    h: 2048,
    bg: "#0c0c0e",
    body: `<circle cx="768" cy="942" r="340" fill="none" stroke="#eee8de" stroke-width="18"/>
      <circle cx="768" cy="942" r="14" fill="#eee8de"/>`,
  },
  {
    id: "ink-horizon",
    w: 2048,
    h: 1536,
    bg: "#111114",
    body: `<rect x="220" y="760" width="1608" height="16" rx="8" fill="#e8e4dc"/>`,
  },
];

function dataUrl(svgText) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const sizes = [];
for (const p of plates) {
  const svgText = svg(p);
  writeFileSync(join(OUT, `${p.id}.svg`), svgText);

  const page = await browser.newPage({
    viewport: { width: p.w, height: p.h },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><body style="margin:0;background:#000"><img src="${dataUrl(svgText)}" width="${p.w}" height="${p.h}" style="display:block"></body></html>`,
    { waitUntil: "load" },
  );
  const jpg = await page.screenshot({
    type: "jpeg",
    quality: 90,
    clip: { x: 0, y: 0, width: p.w, height: p.h },
  });
  writeFileSync(join(OUT, `${p.id}.jpg`), jpg);

  const long = 720;
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(img, 0, 0, w, h, 0, 0, tw, th);
      return canvas.toDataURL("image/webp", 0.95).split(",")[1];
    },
    { w: p.w, h: p.h, tw, th },
  );
  const webp = Buffer.from(webpB64, "base64");
  writeFileSync(join(THUMBS, `${p.id}.webp`), webp);
  await page.close();
  sizes.push({ id: p.id, w: p.w, h: p.h, jpg: jpg.length, thumb: webp.length, tw, th });
  console.log(`repaired ${p.id} jpg=${jpg.length} thumb=${webp.length} ${tw}x${th}`);
}

await browser.close();
writeFileSync("/workspace/artifacts/repaired-plates.json", JSON.stringify(sizes, null, 2));
