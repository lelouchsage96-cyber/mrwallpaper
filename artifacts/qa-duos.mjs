import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(25000);
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.addInitScript(() => {
  localStorage.setItem("mrwallpapers.onboarding.v1", "1");
  sessionStorage.setItem("mrwallpapers.splash.session", "1");
});
async function dismiss() {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("button, a, [role='button']")) {
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "continue" || t.includes("got it")) el.click();
    }
  });
}
await page.goto("http://127.0.0.1:8080/wallpaper/ridge-line", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await dismiss();
await page.evaluate(() => {
  const el = [...document.querySelectorAll("h2")].find((n) => /lock/i.test(n.textContent || ""));
  el?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(400);
const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
const combo = body.match(/Lock & Home[\s\S]{0,180}/)?.[0];
console.log("combo", combo);
const hrefs = await page.evaluate(() =>
  [...document.querySelectorAll("a[href*='/pair/']")].map((a) => a.getAttribute("href")),
);
console.log("pair links", hrefs);
await page.screenshot({ path: "/workspace/screenshots/duo-detail.png", fullPage: false });
if (hrefs[0]) {
  await page.goto("http://127.0.0.1:8080" + hrefs[0], { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await dismiss();
  console.log("pair page", page.url(), (await page.locator("h1").innerText().catch(() => "")).slice(0, 80));
  await page.screenshot({ path: "/workspace/screenshots/duo-pair.png", fullPage: false });
}
await page.goto("http://127.0.0.1:8080/app", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await dismiss();
await page.evaluate(() => {
  const el = [...document.querySelectorAll("h2")].find((n) => /lock|home/i.test(n.textContent || ""));
  el?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/duo-home.png", fullPage: false });
await browser.close();
