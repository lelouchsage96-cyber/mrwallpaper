import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(20000);

async function imgReport(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll("img")].map((img) => {
      const r = img.getBoundingClientRect();
      return {
        alt: img.alt,
        src: img.currentSrc || img.src,
        complete: img.complete,
        nw: img.naturalWidth,
        nh: img.naturalHeight,
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: getComputedStyle(img).display,
        pos: getComputedStyle(img).position,
      };
    });
  });
}

const out = {};
await page.goto(base + "/app", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/fix-previews-home.png", fullPage: true });
out.home = await imgReport(page);

await page.goto(base + "/app/explore", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/fix-previews-explore.png", fullPage: true });
out.explore = await imgReport(page);

for (const id of ["ridge-line", "wide-ridge", "folio-orbit", "true-black", "quiet-orbit", "ink-horizon", "paper-moon"]) {
  await page.goto(base + "/wallpaper/" + id, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/workspace/screenshots/fix-previews-${id}.png` });
  out[id] = await imgReport(page);
}

console.log(JSON.stringify(out, null, 2));
await browser.close();
