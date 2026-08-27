import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(25000);
await page.addInitScript(() => {
  localStorage.setItem("mrwallpapers.onboarding.v1", "1");
  sessionStorage.setItem("mrwallpapers.splash.session", "1");
});
for (const id of ["after-rain-sky", "kepler-dust", "low-light", "folio-orbit"]) {
  await page.goto(`http://127.0.0.1:8080/wallpaper/${id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href*='/pair/']")].map((a) => a.getAttribute("href")),
  );
  const hint = await page.evaluate(() => {
    const h2 = [...document.querySelectorAll("h2")].find((n) => /lock & home/i.test(n.textContent || ""));
    return h2 ? (h2.parentElement?.innerText || "").slice(0, 220) : "NO SECTION";
  });
  console.log(JSON.stringify({ id, hrefs, hint: hint.replace(/\s+/g, " ") }));
}
await page.goto("http://127.0.0.1:8080/wallpaper/after-rain-sky", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const el = [...document.querySelectorAll("h2")].find((n) => /lock/i.test(n.textContent || ""));
  el?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/duo-auto.png", fullPage: false });
await browser.close();
