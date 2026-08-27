import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const email = `ops-catalog-${Date.now()}@example.com`;
const password = "password1";

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 400)}`);
});
await page.addInitScript(() => {
  localStorage.setItem("mrwallpapers.onboarding.v1", "1");
  sessionStorage.setItem("mrwallpapers.splash.session", "1");
});

async function dismissGrok() {
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("button, a, [role='button']")];
    for (const el of nodes) {
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "continue" || t.includes("got it") || t.includes("dismiss")) el.click();
    }
  });
}

async function shot(name, fullPage = true) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage });
  const body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 500);
  console.log("shot", name, page.url(), body.slice(0, 280));
}

try {
  await page.goto(`${BASE}/login?next=/ops/wallpapers`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Welcome back" }).waitFor();
  await page.waitForTimeout(800);
  await dismissGrok();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((u) => u.pathname.includes("/ops"), { timeout: 25000 });
  await page.waitForTimeout(1200);
  await dismissGrok();
  await shot("ops-catalog-after-signup");

  const claim = page.getByRole("button", { name: /Claim admin access/i });
  if (await claim.count()) {
    await claim.click();
    await page.waitForTimeout(1200);
  }
  if (!page.url().includes("/ops/wallpapers")) {
    await page.goto(`${BASE}/ops/wallpapers`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
  }
  await dismissGrok();
  await shot("ops-catalog-now");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/ops/wallpapers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await dismissGrok();
  await shot("ops-catalog-now-mobile");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/ops/wallpapers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const seo = page.locator("summary").first();
  if (await seo.count()) {
    await seo.click();
    await page.waitForTimeout(400);
    await shot("ops-catalog-seo-open");
  }
} catch (err) {
  console.log("FAIL", err.message);
  await shot("ops-catalog-fail");
}
console.log("email", email);
console.log("---ERRORS---");
for (const e of errors) console.log(e);
await browser.close();
