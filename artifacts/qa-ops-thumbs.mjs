import { chromium } from "playwright";
const BASE = "http://127.0.0.1:8080";
const email = `ops-thumbs-${Date.now()}@example.com`;
const password = "password1";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(35000);
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

async function dismiss() {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("button, a, [role='button']")) {
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "continue" || t.includes("got it") || t.includes("dismiss")) el.click();
    }
  });
}

await page.goto(`${BASE}/login?next=/ops/wallpapers`, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Welcome back" }).waitFor();
await page.waitForTimeout(1200);
await dismiss();
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForTimeout(300);
await page.locator('input[name="email"]').fill(email);
await page.locator('input[name="password"]').fill(password);
await page.getByRole("button", { name: "Create account" }).click();
try {
  await page.waitForURL((u) => u.pathname.includes("/ops"), { timeout: 20000 });
} catch {
  console.log("after signup url", page.url());
  await page.screenshot({ path: "/workspace/screenshots/ops-thumbs-login-fail.png", fullPage: false });
}
await page.waitForTimeout(1000);
await dismiss();
const claim = page.getByRole("button", { name: /Claim admin access/i });
if (await claim.count()) {
  await claim.click();
  await page.waitForTimeout(1200);
}
await page.goto(`${BASE}/ops/wallpapers`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await dismiss();
console.log("url", page.url());
const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 240);
console.log("body", body);
const imgs = await page.evaluate(() => {
  return [...document.querySelectorAll("img")].slice(0, 14).map((img) => ({
    src: (img.currentSrc || img.src).replace("http://127.0.0.1:8080", ""),
    nw: img.naturalWidth,
    nh: img.naturalHeight,
    cw: img.clientWidth,
    ch: img.clientHeight,
  }));
});
console.log("imgs", JSON.stringify(imgs, null, 2));
console.log("failed", failed);
await page.screenshot({ path: "/workspace/screenshots/ops-thumbs-fixed.png", fullPage: false });
const thumbs = page.locator("main button[aria-label]");
console.log("thumb buttons", await thumbs.count());
if (await thumbs.count()) {
  await thumbs.first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "/workspace/screenshots/ops-thumbs-open.png", fullPage: false });
}
await browser.close();
