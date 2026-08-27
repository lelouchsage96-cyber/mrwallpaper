#!/usr/bin/env node
/**
 * Generates local SVG wallpapers + SQL seed for Mr Wallpapers.
 * Portrait 1080×1920. Grids use the same file (SVG scales).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/workspace";
const OUT = join(ROOT, "public/wallpapers");
mkdirSync(OUT, { recursive: true });
mkdirSync(join(ROOT, "public/brand"), { recursive: true });

const W = 1080;
const H = 1920;

/** @typedef {{ id: string, title: string, description: string, category: string, access: 'free'|'premium', tags: string[], featured?: 'wotd'|'editors'|'premium_spotlight', collection?: string, downloads: number, favorites: number, style: string, palette: string[], text?: { line: string, sub?: string } }} Wallpaper */

/** @type {Wallpaper[]} */
const catalog = [
  { id: "quiet-orbit", title: "Quiet Orbit", description: "A single pale ring on warm ink.", category: "minimal", access: "free", tags: ["minimal", "circle", "calm"], downloads: 18420, favorites: 2104, style: "orbit", palette: ["#0c0c0e", "#e8e2d6", "#9a9388"] },
  { id: "one-line", title: "One Line", description: "A single horizon. Nothing else.", category: "minimal", access: "free", tags: ["minimal", "line"], downloads: 12110, favorites: 980, style: "line", palette: ["#111114", "#d9d4cc"] },
  { id: "paper-moon", title: "Paper Moon", description: "Soft disc on grainy cream.", category: "aesthetic", access: "free", tags: ["aesthetic", "moon", "film"], downloads: 22190, favorites: 3402, style: "halo", palette: ["#1a1714", "#f0e6d4", "#c4a98a"], featured: "editors_choice" },
  { id: "film-dust", title: "Film Dust", description: "Muted rose field with grain.", category: "aesthetic", access: "premium", tags: ["aesthetic", "grain", "rose"], downloads: 9800, favorites: 1502, style: "grain", palette: ["#2a1f22", "#c9a3a8", "#7a555c"] },
  { id: "ridge-line", title: "Ridge Line", description: "Layered dusk mountains.", category: "nature", access: "free", tags: ["nature", "mountains", "dusk"], downloads: 41200, favorites: 6201, style: "ridges", palette: ["#1b2430", "#3d4d5c", "#6b7c86", "#c5b8a5", "#e8dcc8"], featured: "wotd" },
  { id: "still-water", title: "Still Water", description: "A lake held between two tones.", category: "nature", access: "free", tags: ["nature", "water"], downloads: 19880, favorites: 2400, style: "split", palette: ["#0e1a1c", "#1c3a3e", "#8fbfb5"] },
  { id: "afterglow-run", title: "Afterglow Run", description: "A road and a dying sun.", category: "cars", access: "free", tags: ["cars", "road", "sunset"], downloads: 16770, favorites: 1890, style: "road", palette: ["#1a1010", "#c45c32", "#f0c38a", "#2a1814"] },
  { id: "night-circuit", title: "Night Circuit", description: "Taillight bokeh on asphalt.", category: "cars", access: "premium", tags: ["cars", "night", "bokeh"], downloads: 13440, favorites: 2201, style: "bokeh", palette: ["#0a0a0c", "#ff4d3a", "#ffd0a8", "#3a6cff"] },
  { id: "after-rain-sky", title: "After Rain Sky", description: "Anime-influenced dusk, no characters.", category: "anime", access: "free", tags: ["anime", "sky", "dusk"], downloads: 38820, favorites: 7102, style: "sky", palette: ["#1b1e3a", "#5b4a8a", "#e07a6a", "#f6d7b0"], featured: "editors_choice" },
  { id: "school-route", title: "School Route", description: "A quiet gradient evening.", category: "anime", access: "premium", tags: ["anime", "evening"], downloads: 15400, favorites: 2600, style: "sky", palette: ["#20243a", "#6e8cc4", "#f2c6b6", "#f7efe6"] },
  { id: "silent-satellite", title: "Silent Satellite", description: "A pale moon over deep space.", category: "space", access: "free", tags: ["space", "moon", "stars"], downloads: 27500, favorites: 4100, style: "night", palette: ["#07080f", "#cfd6e4", "#8b93a7"], featured: "editors_choice" },
  { id: "kepler-dust", title: "Kepler Dust", description: "A distant band of light.", category: "space", access: "premium", tags: ["space", "nebula"], downloads: 11200, favorites: 1904, style: "halo", palette: ["#08060e", "#3a2a55", "#d8c6e8"] },
  { id: "low-light", title: "Low Light", description: "Near-black with a faint seam.", category: "dark", access: "free", tags: ["dark", "black", "seam"], downloads: 30110, favorites: 4400, style: "line", palette: ["#050506", "#2a2a2e"] },
  { id: "charcoal-fold", title: "Charcoal Fold", description: "Soft planes of dark grey.", category: "dark", access: "free", tags: ["dark", "grey"], downloads: 9900, favorites: 870, style: "split", palette: ["#0b0b0d", "#1a1a1e", "#3a3a40"] },
  { id: "overlap-two", title: "Overlap Two", description: "Two translucent discs.", category: "abstract", access: "free", tags: ["abstract", "circle"], downloads: 17600, favorites: 2055, style: "orbit", palette: ["#12141a", "#d9dce3", "#8a90a0"], featured: "editors_choice" },
  { id: "lattice-soft", title: "Lattice Soft", description: "A quiet geometric grid.", category: "abstract", access: "premium", tags: ["abstract", "grid"], downloads: 6400, favorites: 720, style: "lattice", palette: ["#101114", "#c8ccd4"] },
  { id: "begin-again", title: "Begin Again", description: "A short line for a new morning.", category: "motivational", access: "free", tags: ["type", "calm"], downloads: 25400, favorites: 3800, style: "type", palette: ["#10100e", "#efe8dc"], text: { line: "Begin again.", sub: "Mr Wallpapers" } },
  { id: "make-room", title: "Make Room", description: "Space to think.", category: "motivational", access: "premium", tags: ["type"], downloads: 8100, favorites: 1400, style: "type", palette: ["#16140f", "#e4d7c3"], text: { line: "Make room.", sub: "Your Screen. Your Style." } },
  { id: "be-still", title: "Be Still", description: "Psalm 46:10, set quietly.", category: "bible-verses", access: "free", tags: ["verse", "psalm"], downloads: 19800, favorites: 2900, style: "type", palette: ["#12110f", "#e8e0d2"], text: { line: "Be still, and know.", sub: "Psalm 46:10" }, featured: "editors_choice" },
  { id: "let-there-be-light", title: "Let There Be Light", description: "Genesis 1:3.", category: "bible-verses", access: "free", tags: ["verse", "genesis"], downloads: 22100, favorites: 3104, style: "type", palette: ["#0e0e12", "#f2eadc"], text: { line: "Let there be light.", sub: "Genesis 1:3" } },
  { id: "two-points", title: "Two Points", description: "A pair of marks, close.", category: "love", access: "free", tags: ["love", "minimal"], downloads: 14300, favorites: 2600, style: "orbit", palette: ["#1a1214", "#e8d0d4", "#c48a92"] },
  { id: "held", title: "Held", description: "Warm dusk, two tones.", category: "love", access: "premium", tags: ["love", "dusk"], downloads: 7700, favorites: 1500, style: "halo", palette: ["#1c1216", "#e2b8b4", "#8a4a52"] },
  { id: "late-grid", title: "Late Grid", description: "A city as a set of windows.", category: "city", access: "free", tags: ["city", "night"], downloads: 26700, favorites: 3300, style: "city", palette: ["#0c1018", "#d8c4a0", "#3a4658"], featured: "editors_choice" },
  { id: "harbour-hour", title: "Harbour Hour", description: "Blue hour over a skyline.", category: "city", access: "premium", tags: ["city", "blue hour"], downloads: 10200, favorites: 1600, style: "ridges", palette: ["#0c1420", "#1c3048", "#4a6a88", "#c8b49a"] },
  { id: "crane-hour", title: "Crane Hour", description: "A single bird, a lot of sky.", category: "animals", access: "free", tags: ["animals", "bird"], downloads: 15900, favorites: 2100, style: "silhouette", palette: ["#1a2228", "#d8d2c4", "#8a9498"] },
  { id: "deep-hold", title: "Deep Hold", description: "A whale-scale curve.", category: "animals", access: "premium", tags: ["animals", "ocean"], downloads: 8800, favorites: 1700, style: "wave", palette: ["#0a1218", "#1a3040", "#8ab0c0"] },
  { id: "sepia-room", title: "Sepia Room", description: "Warm vintage field.", category: "vintage", access: "free", tags: ["vintage", "sepia"], downloads: 11400, favorites: 1200, style: "grain", palette: ["#1c1610", "#c4a070", "#8a6a40"] },
  { id: "old-letter", title: "Old Letter", description: "Paper, age, quiet type.", category: "vintage", access: "free", tags: ["vintage", "paper"], downloads: 7600, favorites: 900, style: "type", palette: ["#2a241c", "#e8dcc8"], text: { line: "Keep this.", sub: "MW · 2026" } },
  { id: "true-black", title: "True Black", description: "AMOLED. A single thin ring.", category: "amoled", access: "free", tags: ["amoled", "black"], downloads: 45200, favorites: 8100, style: "lines", palette: ["#000000", "#f4f1ea"], featured: "editors_choice" },
  { id: "thin-cross", title: "Thin Cross", description: "Two hairlines on true black.", category: "amoled", access: "premium", tags: ["amoled", "geometry"], downloads: 18900, favorites: 3400, style: "lines", palette: ["#000000", "#c8ccd4"], featured: "premium_spotlight" },
  { id: "soft-lock", title: "Soft Lock", description: "Made for a tall phone screen.", category: "iphone", access: "free", tags: ["iphone", "lockscreen"], downloads: 33100, favorites: 5200, style: "halo", palette: ["#101218", "#d8dde8", "#8a90a0"] },
  { id: "lock-dune", title: "Lock Dune", description: "A gentle dune for the home screen.", category: "iphone", access: "premium", tags: ["iphone", "dune"], downloads: 14100, favorites: 2300, style: "dune", palette: ["#16141c", "#e8dcc8", "#8a7a68"], featured: "premium_spotlight" },
];

const categories = [
  { id: "cat-minimal", slug: "minimal", name: "Minimal", description: "Quiet forms. Room to breathe.", cover: "quiet-orbit", order: 1, featured: true },
  { id: "cat-aesthetic", slug: "aesthetic", name: "Aesthetic", description: "Soft grain and still color.", cover: "paper-moon", order: 2, featured: true },
  { id: "cat-nature", slug: "nature", name: "Nature", description: "Ridges, water, dusk.", cover: "ridge-line", order: 3, featured: true },
  { id: "cat-cars", slug: "cars", name: "Cars", description: "Roads, glow, night runs.", cover: "afterglow-run", order: 4, featured: false },
  { id: "cat-anime", slug: "anime", name: "Anime", description: "Sky palettes, never characters.", cover: "after-rain-sky", order: 5, featured: true },
  { id: "cat-space", slug: "space", name: "Space", description: "Moons, dust, distance.", cover: "silent-satellite", order: 6, featured: true },
  { id: "cat-dark", slug: "dark", name: "Dark", description: "Low light. Deep grey.", cover: "low-light", order: 7, featured: false },
  { id: "cat-abstract", slug: "abstract", name: "Abstract", description: "Shape, overlap, grid.", cover: "overlap-two", order: 8, featured: false },
  { id: "cat-motivational", slug: "motivational", name: "Motivational", description: "Short lines. No noise.", cover: "begin-again", order: 9, featured: false },
  { id: "cat-bible-verses", slug: "bible-verses", name: "Bible Verses", description: "Quiet scripture, set with care.", cover: "be-still", order: 10, featured: true },
  { id: "cat-love", slug: "love", name: "Love", description: "Two marks. Warm dusk.", cover: "two-points", order: 11, featured: false },
  { id: "cat-city", slug: "city", name: "City", description: "Windows, harbours, blue hour.", cover: "late-grid", order: 12, featured: false },
  { id: "cat-animals", slug: "animals", name: "Animals", description: "Silhouette and scale.", cover: "crane-hour", order: 13, featured: false },
  { id: "cat-vintage", slug: "vintage", name: "Vintage", description: "Paper, sepia, age.", cover: "sepia-room", order: 14, featured: false },
  { id: "cat-amoled", slug: "amoled", name: "AMOLED", description: "True black. Hairline light.", cover: "true-black", order: 15, featured: true },
  { id: "cat-iphone", slug: "iphone", name: "iPhone", description: "Composed for a tall screen.", cover: "soft-lock", order: 16, featured: true },
];

const collections = [
  { id: "col-amoled", slug: "best-amoled", name: "Best AMOLED Wallpapers", description: "True black, built for OLED.", cover: "true-black", ids: ["true-black", "thin-cross", "low-light", "quiet-orbit"] },
  { id: "col-minimal-iphone", slug: "minimal-iphone", name: "Minimal iPhone Wallpapers", description: "Quiet compositions for a tall screen.", cover: "soft-lock", ids: ["soft-lock", "quiet-orbit", "one-line", "lock-dune"] },
  { id: "col-dark", slug: "dark-wallpapers", name: "Dark Wallpapers", description: "Low light, no glare.", cover: "low-light", ids: ["low-light", "charcoal-fold", "true-black", "silent-satellite"] },
];

function esc(s) {
  return s
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/"/g, "\u0026quot;");
}

function grain(id, opacity = 0.08) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer>
    <feBlend in="SourceGraphic" mode="overlay"/>
  </filter>`;
}

function svgWrap(inner, bg) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs>${inner.defs || ""}</defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${inner.body}
</svg>`;
}

function render(w) {
  const [bg, a, b, c, d] = [...w.palette, "#888", "#aaa", "#ccc"];
  const g = `g-${w.id}`;
  switch (w.style) {
    case "orbit":
      return svgWrap({
        defs: grain(g, 0.06),
        body: `<rect width="${W}" height="${H}" fill="${bg}" filter="url(#${g})"/>
          ${
            w.id === "two-points"
              ? `<circle cx="500" cy="820" r="14" fill="${a}"/><circle cx="580" cy="820" r="14" fill="${b || a}"/>`
              : w.id === "overlap-two"
                ? `<circle cx="470" cy="820" r="250" fill="none" stroke="${a}" stroke-width="8" opacity="0.88"/><circle cx="610" cy="820" r="250" fill="none" stroke="${b || a}" stroke-width="8" opacity="0.88"/>`
                : `<circle cx="540" cy="820" r="280" fill="none" stroke="${a}" stroke-width="9"/><circle cx="540" cy="820" r="10" fill="${a}"/>`
          }`,
      }, bg);
    case "line":
      return svgWrap({
        defs: grain(g, 0.05),
        body: `<rect width="${W}" height="${H}" fill="${bg}" filter="url(#${g})"/>
          <rect x="120" y="956" width="840" height="8" rx="4" fill="${w.id === "low-light" ? "#8a8a92" : a}"/>`,
      }, bg);
    case "halo":
      return svgWrap({
        defs: `${grain(g, 0.07)}<radialGradient id="r-${w.id}" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stop-color="${a}" stop-opacity="0.95"/>
          <stop offset="55%" stop-color="${b || a}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
        </radialGradient>`,
        body: `<g filter="url(#${g})"><circle cx="540" cy="780" r="520" fill="url(#r-${w.id})"/><circle cx="540" cy="760" r="160" fill="${a}" opacity="0.92"/></g>`,
      }, bg);
    case "grain":
      return svgWrap({
        defs: grain(g, 0.18),
        body: `<g filter="url(#${g})">
          <rect width="${W}" height="${H}" fill="${bg}"/>
          <rect y="640" width="${W}" height="640" fill="${a}" opacity="0.35"/>
        </g>`,
      }, bg);
    case "ridges": {
      const layers = w.palette.slice(1);
      const paths = layers.map((col, i) => {
        const y = 720 + i * 180;
        const peak = 80 + (i % 2) * 40;
        return `<path d="M0 ${y} C 180 ${y - peak}, 360 ${y + peak * 0.4}, 540 ${y - peak * 0.6} S 900 ${y + 40}, 1080 ${y - 20} L 1080 ${H} L 0 ${H} Z" fill="${col}"/>`;
      }).join("");
      return svgWrap({ defs: grain(g, 0.08), body: `<g filter="url(#${g})">${paths}</g>` }, bg);
    }
    case "split":
      return svgWrap({
        defs: grain(g, 0.06),
        body: `<rect width="${W}" height="${H}" fill="${bg}" filter="url(#${g})"/>
          <rect y="${H * 0.51}" width="${W}" height="${H * 0.49}" fill="${b || a}"/>
          <rect y="${H * 0.508}" width="${W}" height="6" fill="${c || a}"/>`,
      }, bg);
    case "road":
      return svgWrap({
        defs: `${grain(g, 0.08)}<linearGradient id="sky-${w.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg}"/><stop offset="55%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/>
        </linearGradient>`,
        body: `<g filter="url(#${g})">
          <rect width="${W}" height="${H}" fill="url(#sky-${w.id})"/>
          <circle cx="540" cy="820" r="90" fill="${b}" opacity="0.9"/>
          <path d="M 200 1920 L 500 1100 L 580 1100 L 880 1920 Z" fill="${w.palette[3] || bg}" opacity="0.85"/>
          <path d="M 530 1100 L 540 1920 L 550 1100 Z" fill="${a}" opacity="0.5"/>
        </g>`,
      }, bg);
    case "bokeh":
      return svgWrap({
        defs: grain(g, 0.1),
        body: `<g filter="url(#${g})">
          ${[[180, 1400, 40, a], [300, 1500, 18, a], [700, 1380, 28, b], [820, 1520, 14, a], [500, 1600, 22, c], [240, 1680, 10, b], [900, 1700, 16, a]].map(([x, y, r, col]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="0.7"/>`).join("")}
          <rect y="1750" width="${W}" height="4" fill="${a}" opacity="0.4"/>
        </g>`,
      }, bg);
    case "sky":
      return svgWrap({
        defs: `${grain(g, 0.06)}<linearGradient id="sky2-${w.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="40%" stop-color="${a}"/>
          <stop offset="72%" stop-color="${b}"/>
          <stop offset="100%" stop-color="${c}"/>
        </linearGradient>`,
        body: `<g filter="url(#${g})">
          <rect width="${W}" height="${H}" fill="url(#sky2-${w.id})"/>
          <circle cx="760" cy="520" r="70" fill="${c}" opacity="0.95"/>
          <path d="M0 1280 C 200 1200, 400 1320, 540 1260 S 900 1180, 1080 1240 L 1080 1920 L 0 1920 Z" fill="${bg}" opacity="0.45"/>
        </g>`,
      }, bg);
    case "night": {
      const stars = Array.from({ length: 80 }, (_, i) => {
        const x = (i * 137 + 40) % 1080;
        const y = (i * 97 + 60) % 1100;
        const r = (i % 5 === 0) ? 1.6 : 0.8;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${a}" opacity="${0.35 + (i % 5) * 0.12}"/>`;
      }).join("");
      return svgWrap({
        defs: grain(g, 0.05),
        body: `<g filter="url(#${g})">${stars}<circle cx="540" cy="860" r="140" fill="${a}" opacity="0.92"/><circle cx="500" cy="830" r="140" fill="${bg}"/></g>`,
      }, bg);
    }
    case "lattice": {
      let lines = "";
      for (let x = 90; x < W; x += 90) lines += `<line x1="${x}" y1="200" x2="${x}" y2="1720" stroke="${a}" stroke-width="2.5" opacity="0.55"/>`;
      for (let y = 200; y < 1720; y += 90) lines += `<line x1="90" y1="${y}" x2="990" y2="${y}" stroke="${a}" stroke-width="2.5" opacity="0.55"/>`;
      return svgWrap({
        defs: grain(g, 0.04),
        body: `<rect width="${W}" height="${H}" fill="${bg}" filter="url(#${g})"/>${lines}`,
      }, bg);
    }
    case "type": {
      const line = esc(w.text?.line || w.title);
      const sub = esc(w.text?.sub || "");
      return svgWrap({
        defs: grain(g, 0.05),
        body: `<g filter="url(#${g})">
          <text x="540" y="900" text-anchor="middle" fill="${a}" font-family="Georgia, 'Times New Roman', serif" font-size="56" letter-spacing="-0.5">${line}</text>
          ${sub ? `<text x="540" y="970" text-anchor="middle" fill="${a}" opacity="0.55" font-family="Georgia, serif" font-size="22" letter-spacing="4">${sub.toUpperCase()}</text>` : ""}
        </g>`,
      }, bg);
    }
    case "city": {
      let windows = "";
      for (let col = 0; col < 18; col++) {
        for (let row = 0; row < 22; row++) {
          if ((col * 13 + row * 7) % 5 === 0) continue;
          const x = 80 + col * 52;
          const y = 520 + row * 48;
          const on = (col + row) % 3 !== 0;
          windows += `<rect x="${x}" y="${y}" width="10" height="16" fill="${a}" opacity="${on ? 0.55 : 0.12}"/>`;
        }
      }
      return svgWrap({ defs: grain(g, 0.07), body: `<g filter="url(#${g})">${windows}</g>` }, bg);
    }
    case "silhouette":
      return svgWrap({
        defs: grain(g, 0.06),
        body: `<g filter="url(#${g})">
          <path d="M 700 980 C 680 900, 620 860, 560 880 C 520 760, 430 740, 400 820 C 300 800, 280 900, 340 940 C 300 1000, 360 1080, 480 1060 C 520 1120, 640 1100, 680 1020 C 720 1040, 740 1000, 700 980 Z" fill="${a}" opacity="0.9"/>
          <circle cx="720" cy="520" r="50" fill="${a}" opacity="0.35"/>
        </g>`,
      }, bg);
    case "wave":
      return svgWrap({
        defs: grain(g, 0.07),
        body: `<g filter="url(#${g})">
          <path d="M -40 1100 C 200 980, 400 1220, 640 1080 S 1000 980, 1120 1120 L 1120 1920 L -40 1920 Z" fill="${a}" opacity="0.55"/>
          <path d="M -40 1280 C 240 1180, 480 1400, 720 1260 S 1040 1200, 1120 1300 L 1120 1920 L -40 1920 Z" fill="${b}" opacity="0.5"/>
        </g>`,
      }, bg);
    case "lines":
      return svgWrap({
        body: w.id === "thin-cross"
          ? `<line x1="540" y1="220" x2="540" y2="1700" stroke="${a}" stroke-width="6" stroke-linecap="round"/>
             <line x1="160" y1="960" x2="920" y2="960" stroke="${a}" stroke-width="6" stroke-linecap="round"/>`
          : `<circle cx="540" cy="960" r="248" fill="none" stroke="${a}" stroke-width="10"/><circle cx="540" cy="960" r="5" fill="${a}"/>`,
      }, bg);
    case "dune":
      return svgWrap({
        defs: grain(g, 0.08),
        body: `<g filter="url(#${g})">
          <path d="M0 1200 C 260 1080, 520 1320, 780 1180 S 1080 1220, 1080 1220 L 1080 1920 L 0 1920 Z" fill="${a}" opacity="0.35"/>
          <path d="M0 1400 C 300 1280, 600 1500, 1080 1360 L 1080 1920 L 0 1920 Z" fill="${b}" opacity="0.4"/>
        </g>`,
      }, bg);
    default:
      return svgWrap({ body: "" }, bg);
  }
}

for (const w of catalog) {
  writeFileSync(join(OUT, `${w.id}.svg`), render(w));
}

const mwMark = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="2" y="2" width="60" height="60" rx="16" stroke="currentColor" stroke-width="2"/>
  <path d="M16 44 V22 L32 38 L48 22 V44" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
writeFileSync(join(ROOT, "public/brand/mw-mark.svg"), mwMark);

function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

const catSql = categories.map((c) =>
  `(${sqlStr(c.id)}, ${sqlStr(c.slug)}, ${sqlStr(c.name)}, ${sqlStr(c.description)}, ${sqlStr(`/wallpapers/${c.cover}.svg`)}, ${c.order}, true, ${c.featured})`
).join(",\n");

const tagSet = new Map();
for (const w of catalog) {
  for (const tag of w.tags) {
    if (!tagSet.has(tag)) tagSet.set(tag, `tag-${tag}`);
  }
}
const tagSql = [...tagSet.entries()].map(([name, id]) =>
  `(${sqlStr(id)}, ${sqlStr(name)}, ${sqlStr(name)})`
).join(",\n");

const wpSql = catalog.map((w) => {
  const cat = categories.find((c) => c.slug === w.category);
  const bytes = 48000 + (w.title.length * 120);
  return `(${sqlStr(w.id)}, ${sqlStr(w.title)}, ${sqlStr(w.description)}, ${sqlStr(cat.id)}, ${sqlStr(w.access)}, 'approved', 1080, 1920, ${bytes}, 'svg', '9:16', ${w.downloads}, ${w.favorites}, now() - interval '${(catalog.length - catalog.indexOf(w)) * 2} days')`;
}).join(",\n");

const assetSql = catalog.flatMap((w) => {
  const path = `/wallpapers/${w.id}.svg`;
  return [
    `(${sqlStr(w.id + "-thumb")}, ${sqlStr(w.id)}, 'thumbnail', 'public', ${sqlStr(path)}, 400, 711, 12000, 'image/svg+xml', true)`,
    `(${sqlStr(w.id + "-prev")}, ${sqlStr(w.id)}, 'preview', 'public', ${sqlStr(path)}, 1080, 1920, 48000, 'image/svg+xml', true)`,
    `(${sqlStr(w.id + "-orig")}, ${sqlStr(w.id)}, 'original', 'protected', ${sqlStr(path)}, 1080, 1920, 48000, 'image/svg+xml', false)`,
  ];
}).join(",\n");

const wtSql = catalog.flatMap((w) =>
  w.tags.map((tag) => `(${sqlStr(w.id)}, ${sqlStr(tagSet.get(tag))})`)
).join(",\n");

const featuredSql = catalog.filter((w) => w.featured).map((w, i) =>
  `(${sqlStr("feat-" + w.id)}, ${sqlStr(w.featured)}, ${sqlStr(w.id)}, now() - interval '1 day', now() + interval '365 days', ${10 - i})`
).join(",\n");

const colSql = collections.map((c) =>
  `(${sqlStr(c.id)}, ${sqlStr(c.slug)}, ${sqlStr(c.name)}, ${sqlStr(c.description)}, ${sqlStr(`/wallpapers/${c.cover}.svg`)}, true)`
).join(",\n");

const colWpSql = collections.flatMap((c) =>
  c.ids.map((id, i) => `(${sqlStr(c.id)}, ${sqlStr(id)}, ${i})`)
).join(",\n");

const seed = `-- Seed catalog (idempotent)
insert into categories (id, slug, name, description, cover_url, sort_order, is_visible, is_featured)
values
${catSql}
on conflict (id) do nothing;

insert into tags (id, slug, name)
values
${tagSql}
on conflict (id) do nothing;

insert into wallpapers (id, title, description, category_id, access_type, status, width, height, file_size_bytes, format, aspect_ratio, download_count, favorite_count, published_at)
values
${wpSql}
on conflict (id) do nothing;

insert into wallpaper_assets (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
values
${assetSql}
on conflict (id) do nothing;

insert into wallpaper_tags (wallpaper_id, tag_id)
values
${wtSql}
on conflict do nothing;

insert into featured_wallpapers (id, slot, wallpaper_id, starts_at, ends_at, priority)
values
${featuredSql}
on conflict (id) do nothing;

insert into collections (id, slug, name, description, cover_url, is_visible)
values
${colSql}
on conflict (id) do nothing;

insert into collection_wallpapers (collection_id, wallpaper_id, sort_order)
values
${colWpSql}
on conflict do nothing;
`;

writeFileSync(join(ROOT, "migrations/0003_seed.sql"), seed);
writeFileSync(join(ROOT, "src/lib/catalog-meta.json"), JSON.stringify({ count: catalog.length, categories: categories.length }, null, 2));
console.log(`Wrote ${catalog.length} wallpapers, ${categories.length} categories`);
