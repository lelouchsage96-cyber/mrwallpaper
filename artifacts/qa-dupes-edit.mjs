import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(25000);
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("console error", msg.text());
});
page.on("pageerror", (err) => console.log("pageerror", err.message));
await page.addInitScript(() => {
  localStorage.setItem("mrwallpapers.onboarding.v1", "1");
  sessionStorage.setItem("mrwallpapers.splash.session", "1");
});

async function shot(name) {
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: true });
  console.log("shot", name, page.url());
}

async function dismissGrok() {
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("button, a, [role='button']")];
    for (const el of nodes) {
      const t = (el.textContent || "").trim().toLowerCase();
      if (t === "continue" || t.includes("got it") || t.includes("dismiss")) el.click();
    }
  });
}

async function uniqueJpeg() {
  const bytes = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 1280;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#12141a";
    ctx.fillRect(0, 0, 720, 1280);
    ctx.fillStyle = "#c8ccd4";
    ctx.beginPath();
    ctx.arc(360, 420, 90, 0, Math.PI * 2);
    ctx.fill();
    const img = ctx.getImageData(0, 0, 720, 1280);
    const seed = Date.now() % 100000;
    for (let i = 0; i < 4000; i += 1) {
      const p = ((i * 9973 + seed) % (720 * 1280)) * 4;
      img.data[p] = (img.data[p] + i) % 256;
      img.data[p + 1] = (img.data[p + 1] + seed) % 256;
      img.data[p + 2] = (img.data[p + 2] + i * 3) % 256;
    }
    ctx.putImageData(img, 0, 0);
    const blob = await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.9));
    const buf = new Uint8Array(await blob.arrayBuffer());
    return Array.from(buf);
  });
  return Buffer.from(bytes);
}

try {
  await page.goto(`${BASE}/login?next=/studio/submit`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Welcome back" }).waitFor();
  await page.waitForTimeout(1200);
  await dismissGrok();
  await page.locator('input[name="email"]').fill("studio-tags-1787723059773@example.com");
  await page.locator('input[name="password"]').fill("password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.includes("/studio"), { timeout: 20000 });
  if (!page.url().includes("/submit")) {
    await page.goto(`${BASE}/studio/submit`, { waitUntil: "domcontentloaded" });
  }
  await page.getByRole("heading", { name: "Submit a plate" }).waitFor({ timeout: 15000 });
  await dismissGrok();

  await page.locator('input[type="file"]').setInputFiles("/workspace/public/wallpapers/paper-moon.jpg");
  await page.getByText(/already in the catalog|already submitted/i).waitFor({ timeout: 25000 });
  const dupText = (await page.locator("body").innerText()).match(/already[^\n]+/i)?.[0];
  console.log("duplicate copy:", dupText);
  await shot("studio-duplicate");
  if (!/already/i.test(dupText || "")) throw new Error(`expected duplicate copy, got: ${dupText}`);

  const jpeg = await uniqueJpeg();
  await page.locator('input[type="file"]').setInputFiles({
    name: "north-edit-plate.jpg",
    mimeType: "image/jpeg",
    buffer: jpeg,
  });
  await page.getByText(/already in the catalog|already submitted|something went wrong/i).waitFor({ timeout: 4000 }).catch(() => null);
  const blocked = await page.getByText(/already in the catalog|already submitted|something went wrong/i).count();
  if (blocked) throw new Error("unique plate was blocked");

  const titleBox = page.locator("input").nth(1);
  await titleBox.waitFor({ timeout: 15000 });
  await titleBox.fill("Silver Ring Edit");
  const tagInput = page.getByPlaceholder("dusk, grain, calm");
  if (await tagInput.count()) {
    await tagInput.fill("grain");
    await tagInput.press("Enter");
  }
  await page.getByRole("button", { name: "Submit for review" }).waitFor({ state: "visible", timeout: 90000 });
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /submit for review/i.test(b.textContent || ""));
    return btn && !btn.disabled;
  }, { timeout: 90000 });
  await shot("studio-unique-ready");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.waitForURL((u) => u.pathname === "/studio" || u.pathname === "/studio/", { timeout: 30000 });
  await page.waitForTimeout(800);
  await shot("studio-dashboard-edit");

  const edit = page.getByRole("link", { name: "Edit" }).first();
  await edit.waitFor({ timeout: 15000 });
  await edit.click();
  await page.getByRole("heading", { name: "Edit plate" }).waitFor({ timeout: 15000 });
  const editTitle = page.locator("input").nth(1);
  const cur = await editTitle.inputValue();
  const nextTitle = `${cur} later`.slice(0, 60);
  await editTitle.fill(nextTitle);
  await shot("studio-edit-form");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL((u) => u.pathname === "/studio" || u.pathname === "/studio/", { timeout: 20000 });
  await page.waitForTimeout(800);
  await shot("studio-after-edit");
  const dash = await page.locator("body").innerText();
  console.log(dash.slice(0, 1000));
  if (!dash.toLowerCase().includes("edit")) throw new Error("edit link missing after save");
  if (!dash.includes("later") && !dash.includes(nextTitle)) {
    throw new Error("saved title missing on dashboard");
  }
  console.log("OK");
} catch (err) {
  console.error("url", page.url());
  console.error((await page.locator("body").innerText().catch(() => "")).slice(0, 1800));
  await shot("qa-dupes-edit-fail");
  console.error("FAIL", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
