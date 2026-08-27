import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(25000);

await page.goto(base + "/app", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/verify-home.png", fullPage: true });

await page.goto(base + "/app/explore", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.screenshot({ path: "/workspace/screenshots/verify-explore.png", fullPage: true });

for (const id of [
  "true-black",
  "thin-cross",
  "low-light",
  "charcoal-fold",
  "quiet-orbit",
  "one-line",
  "ink-horizon",
  "folio-orbit",
  "lattice-soft",
  "kepler-dust",
]) {
  await page.goto(base + "/wallpaper/" + id, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/workspace/screenshots/verify-${id}.png` });
}

console.log("ok");
await browser.close();
