import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:3000";
const viewport = { width: 390, height: 844 };
const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

async function scan(page, name) {
  const results = await new AxeBuilder({ page }).analyze();

  await page.screenshot({
    path: `test-artifacts/${name}.png`,
    fullPage: false,
  });

  return {
    name,
    violations: results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
  };
}

async function browserLaunchOptions() {
  const hasEdge = await fs
    .access(edgePath)
    .then(() => true)
    .catch(() => false);

  return hasEdge ? { headless: true, executablePath: edgePath } : { headless: true };
}

async function main() {
  await fs.mkdir("test-artifacts", { recursive: true });

  const browser = await chromium.launch(await browserLaunchOptions());
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const report = [];

  await page.goto(baseUrl, { waitUntil: "load" });
  report.push(await scan(page, "01-phone"));

  await page.locator("#phone").fill("999999999");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByText("Verifica tu número").waitFor();
  await page.locator("input").first().click();
  await page.keyboard.type("123456");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.locator("#name").waitFor();
  await page.locator("#name").fill("Victor");
  await page.locator("#lastName").fill("Mendez");
  await page.locator("#dni").fill("12345678");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Empezar" }).click();
  report.push(await scan(page, "02-home"));

  await page.getByRole("button", { name: "Reportar emergencia" }).click();
  report.push(await scan(page, "03-report"));

  await context.close();
  await browser.close();

  const hasViolations = report.some((screen) => screen.violations.length > 0);
  console.log(JSON.stringify(report, null, 2));

  if (hasViolations) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
