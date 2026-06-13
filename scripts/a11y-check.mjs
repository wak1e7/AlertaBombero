import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = process.env.APP_URL || "http://127.0.0.1:3000";
const viewport = { width: 390, height: 844 };

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

async function main() {
  await fs.mkdir("test-artifacts", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const report = [];

  await page.goto(baseUrl, { waitUntil: "load" });
  report.push(await scan(page, "01-phone"));

  await page.getByLabel("Número de teléfono").fill("999999999");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Código de verificación").fill("123456");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByLabel("Nombre").fill("Victor");
  await page.getByLabel("Apellido").fill("Méndez");
  await page.getByLabel("DNI").fill("12345678");
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
