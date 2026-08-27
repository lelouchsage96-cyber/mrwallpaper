import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 400)}`);
});
const routes = [
  "/",
  "/app",
  "/app/explore",
  "/wallpapers",
  "/wallpapers/all",
  "/wallpapers/minimal",
  "/wallpaper/ridge-line",
  "/pair/dusk-pair",
  "/creator/atelier-north",
  "/collection/minimal-phone",
  "/app/notifications",
  "/app/taste",
];
for (const path of routes) {
  const start = Date.now();
  let status = "nav";
  try {
    const res = await page.goto(`http://127.0.0.1:8080${path}`, { waitUntil: "networkidle" });
    status = String(res?.status() ?? "?");
  } catch (e) {
    status = `FAIL ${e.message.slice(0, 80)}`;
  }
  await page.waitForTimeout(500);
  const body = (await page.locator("body").innerText().catch(() => "")).slice(0, 220).replace(/\s+/g, " ");
  const has500 = /Something went wrong|does not exist|Internal Server Error|sort_order|500/i.test(body);
  const name = path.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "root";
  await page.screenshot({ path: `/workspace/screenshots/fix500-${name}.png`, fullPage: false });
  console.log(JSON.stringify({ path, status, ms: Date.now() - start, has500, body, errN: errors.length }));
}
console.log("---ERRORS---");
for (const e of errors) console.log(e);
await browser.close();
