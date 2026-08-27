import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const dir = dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch({
  args: ["--font-render-hinting=none", "--disable-lcd-text"],
});

async function shot(pagePath, outPath, { width, height, scale = 1 }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  await page.goto(pathToFileURL(pagePath).href, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(120);
  await page.screenshot({ path: outPath, type: "png", omitBackground: false });
  await page.close();
}

await shot(join(dir, "og-card.html"), join(dir, "og-raw.png"), {
  width: 1200,
  height: 630,
  scale: 2,
});

await shot(join(dir, "x-banner.html"), join(dir, "x-banner-raw.png"), {
  width: 1200,
  height: 264,
  scale: 2,
});

await shot(join(dir, "icon.html"), join(dir, "icon-512-raw.png"), {
  width: 512,
  height: 512,
  scale: 1,
});

await shot(join(dir, "icon.html"), join(dir, "icon-192-raw.png"), {
  width: 192,
  height: 192,
  scale: 1,
});

writeFileSync(
  join(dir, "favicon-preview.html"),
  `<!DOCTYPE html><html><body style="margin:0;font-family:sans-serif">
    <div style="display:flex;gap:16px;padding:12px;background:#ddd">
      <div style="background:#fff;padding:8px"><img src="favicon.svg" width="16" height="16" style="display:block"></div>
      <div style="background:#333;padding:8px"><img src="favicon.svg" width="16" height="16" style="display:block"></div>
      <div style="background:#fff;padding:8px"><img src="favicon.svg" width="32" height="32" style="display:block"></div>
      <div style="background:#0A0A0B;padding:8px"><img src="favicon.svg" width="32" height="32" style="display:block"></div>
      <div style="background:#fff;padding:8px"><img src="favicon.svg" width="64" height="64" style="display:block"></div>
    </div>
  </body></html>`,
);
await shot(join(dir, "favicon-preview.html"), join(dir, "favicon-preview.png"), {
  width: 420,
  height: 96,
  scale: 4,
});

await browser.close();
console.log("rendered");
