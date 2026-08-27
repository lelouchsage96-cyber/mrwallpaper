import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = "http://127.0.0.1:8080";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(25000);

const failedReqs = [];
page.on("response", async (res) => {
  const url = res.url();
  if (!/\.(jpg|jpeg|png|webp|svg|mp4)(\?|$)/i.test(url) && !url.includes("/api/media/")) return;
  const status = res.status();
  if (status >= 400) failedReqs.push({ status, url: url.replace(base, "") });
});

async function imgReport() {
  return page.evaluate(() => {
    return [...document.querySelectorAll("img")].map((img) => {
      const r = img.getBoundingClientRect();
      return {
        alt: img.alt,
        src: (img.currentSrc || img.src).replace(location.origin, ""),
        srcAttr: img.getAttribute("src"),
        srcset: img.getAttribute("srcset"),
        complete: img.complete,
        nw: img.naturalWidth,
        nh: img.naturalHeight,
        w: Math.round(r.width),
        h: Math.round(r.height),
        broken: img.complete && img.naturalWidth === 0 && r.width > 0,
      };
    });
  });
}

const out = { failedReqs: [], pages: {} };

await page.goto(base + "/app", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.screenshot({ path: "/workspace/screenshots/audit-home.png", fullPage: true });
out.pages.home = await imgReport();

await page.goto(base + "/app/explore", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
await page.screenshot({ path: "/workspace/screenshots/audit-explore.png", fullPage: true });
out.pages.explore = await imgReport();

await page.goto(base + "/app/explore?device=all", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
await page.screenshot({ path: "/workspace/screenshots/audit-explore-all.png", fullPage: true });
out.pages.exploreAll = await imgReport();

const ids = [
  "ridge-line",
  "true-black",
  "quiet-orbit",
  "paper-moon",
  "low-light",
  "charcoal-fold",
  "wide-ridge",
  "ink-horizon",
  "folio-orbit",
  "thin-cross",
  "harbour-hour",
  "ash-ring",
];
for (const id of ids) {
  await page.goto(base + "/wallpaper/" + id, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `/workspace/screenshots/audit-${id}.png` });
  out.pages[id] = await imgReport();
}

out.failedReqs = failedReqs;
const summary = {
  failedReqs,
  broken: Object.fromEntries(
    Object.entries(out.pages).map(([k, imgs]) => [
      k,
      imgs.filter((i) => i.broken || i.nw === 0),
    ]),
  ),
  counts: Object.fromEntries(
    Object.entries(out.pages).map(([k, imgs]) => [
      k,
      { total: imgs.length, broken: imgs.filter((i) => i.broken || i.nw === 0).length },
    ]),
  ),
};
console.log(JSON.stringify(summary, null, 2));
writeFileSync("/workspace/artifacts/qa-preview-audit.json", JSON.stringify(out, null, 2));
await browser.close();
