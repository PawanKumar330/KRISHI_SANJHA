/* Read-only dashboard verification: login as seeded farmer, dump visible text. */
import { chromium } from "playwright-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const logs = [];
page.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
page.on("pageerror", (e) => logs.push(String(e)));

try {
  await page.goto("http://localhost:5199/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/User ID|यूज़र/i).fill("ramesh.kisan");
  await page.getByLabel(/Password|पासवर्ड/i).fill("kisan@2026");
  await page.getByRole("button", { name: /Sign in|Login|लॉगिन|साइन/i }).click();
  await page.waitForURL(/dashboard|pending|verification/, { timeout: 20000 });
  await page.waitForTimeout(2500);

  console.log("URL:", page.url());

  // Profile card content
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("=== DASHBOARD TEXT (first 3500 chars) ===");
  console.log(bodyText.slice(0, 3500));

  // Which rows exist in the profile card
  for (const probe of ["Mobile number", "Father's name", "Aadhaar", "GPS coordinates",
    "Use my GPS", "Complete your profile", "My profile", "Equipment owners near you",
    "Set your location first", "My land plots", "Machinery available nearby",
    "Not provided", "Loading"]) {
    const re = new RegExp(probe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    console.log((re.test(bodyText) ? "PRESENT: " : "absent:  ") + probe);
  }

  // Sign out to leave a clean session
  const out = page.getByRole("button", { name: /Sign out|Log out|लॉग आउट/i });
  if (await out.count()) { await out.first().click(); await page.waitForTimeout(1000); }
} finally {
  console.log("=== CONSOLE ERRORS ===");
  console.log(logs.slice(0, 10).join("\n") || "(none)");
  await browser.close();
}
