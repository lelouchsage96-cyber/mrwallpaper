import { chromium } from "playwright";
const BASE = "http://127.0.0.1:8080";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);
await page.addInitScript(() => {
  localStorage.setItem("mrwallpapers.onboarding.v1", "1");
  sessionStorage.setItem("mrwallpapers.splash.session", "1");
});
await page.goto(`${BASE}/login?next=/ops/wallpapers`, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Welcome back" }).waitFor();
await page.waitForTimeout(600);
await page.evaluate(() => {
  const nodes = [...document.querySelectorAll("button, a, [role='button']")];
  for (const el of nodes) {
    const t = (el.textContent || "").trim().toLowerCase();
    if (t === "continue" || t.includes("got it")) el.click();
  }
});
await page.locator('input[name="email"]').fill("ops-catalog-1787819173582@example.com");
await page.locator('input[name="password"]').fill("password1");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL((u) => u.pathname.includes("/ops"), { timeout: 25000 });
await page.waitForTimeout(1000);
const metrics = await page.evaluate(() => ({
  innerWidth: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  bodyText: document.body.innerText.slice(0, 200),
}));
console.log(JSON.stringify(metrics, null, 2));
await page.screenshot({ path: "/workspace/screenshots/ops-catalog-mobile-fixed.png", fullPage: false });
await browser.close();
