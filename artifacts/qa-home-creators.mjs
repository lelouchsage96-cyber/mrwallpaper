import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(25000);
const failed = [];
page.on("response", (res) => {
  if (res.status() >= 400 && /\.(webp|jpe?g|png)|\/media\/|\/api\/media\//i.test(res.url())) {
    failed.push(`${res.status()} ${res.url()}`);
  }
});
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.addInitScript(() => {
  localStorage.setItem("mrwallpapers.onboarding.v1", "1");
  sessionStorage.setItem("mrwallpapers.splash.session", "1");
});
await page.goto("http://127.0.0.1:8080/app", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  for (const el of document.querySelectorAll("button, a, [role='button']")) {
    const t = (el.textContent || "").trim().toLowerCase();
    if (t === "continue" || t.includes("got it")) el.click();
  }
});
const creators = page.getByText("Creators", { exact: true }).first();
if (await creators.count()) {
  await creators.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
}
const imgs = await page.evaluate(() => {
  const h2 = [...document.querySelectorAll("h2, a, p")].find((el) => /creators/i.test(el.textContent || "") && el.closest("section"));
  const section = h2?.closest("section") || document.body;
  return [...section.querySelectorAll("img")].map((img) => ({
    src: (img.currentSrc || img.src).replace("http://127.0.0.1:8080", ""),
    nw: img.naturalWidth,
    nh: img.naturalHeight,
    cw: img.clientWidth,
    ch: img.clientHeight,
    alt: img.alt,
  }));
});
console.log("creator imgs", JSON.stringify(imgs, null, 2));
console.log("failed", failed);
await page.screenshot({ path: "/workspace/screenshots/home-creators-fixed.png", fullPage: false });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:8080/app", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const el = [...document.querySelectorAll("h2")].find((n) => /creator/i.test(n.textContent || ""));
  el?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/home-creators-mobile.png", fullPage: false });
await browser.close();
