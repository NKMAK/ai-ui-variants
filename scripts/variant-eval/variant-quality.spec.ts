import fs from "node:fs/promises";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

type EvalCase = {
  name: string;
  targetText?: string | RegExp;
  targetSelector?: string;
  instruction: string;
};

const cases: EvalCase[] = [
  {
    name: "hero-headline-emphasis",
    targetText: "Get three AI rewrites.",
    instruction: "Make this headline feel more premium and decisive.",
  },
  {
    name: "feature-title-tone",
    targetText: "Code-backed variants",
    instruction: "Make this feature title feel more technical and trustworthy.",
  },
  {
    name: "footer-tag-direction",
    targetText: "Compare. Pick.",
    instruction: "Make this signoff feel more confident and memorable.",
  },
];

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await fs.rm(".ui-agent", { recursive: true, force: true });
});

for (const evalCase of cases) {
  test(evalCase.name, async ({ page }, testInfo) => {
    await page.goto("/");
    await enableInspector(page);
    await selectTarget(page, evalCase);
    await generateVariants(page, evalCase.instruction);

    const descriptions = await collectVariantDescriptions(page, testInfo);
    await fs.writeFile(
      testInfo.outputPath(`${evalCase.name}.json`),
      JSON.stringify({ case: evalCase, variants: descriptions }, null, 2),
    );

    await page.screenshot({
      path: testInfo.outputPath(`${evalCase.name}-variant-final.png`),
      fullPage: true,
    });

    await discardIfVisible(page);
  });
}

async function enableInspector(page: Page): Promise<void> {
  const offToggle = page.getByLabel("UI inspector off");

  if (await offToggle.isVisible()) {
    await offToggle.click();
  }

  await expect(page.getByLabel("UI inspector on")).toBeVisible();
}

async function selectTarget(page: Page, evalCase: EvalCase): Promise<void> {
  if (evalCase.targetSelector !== undefined) {
    await page.locator(evalCase.targetSelector).click();
  } else if (evalCase.targetText !== undefined) {
    await page.getByText(evalCase.targetText).first().click();
  }

  await expect(page.locator("textarea#ui-agent-instruction")).toBeEnabled();
}

async function generateVariants(page: Page, instruction: string): Promise<void> {
  await page.locator("textarea#ui-agent-instruction").fill(instruction);
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator("section.variant-viewer")).toBeVisible({
    timeout: 180_000,
  });
}

async function collectVariantDescriptions(
  page: Page,
  testInfo: TestInfo,
): Promise<string[]> {
  const descriptions: string[] = [];

  for (let index = 0; index < 3; index += 1) {
    const viewer = page.locator("section.variant-viewer");
    await expect(viewer).toContainText(`Variant ${index + 1} /`, {
      timeout: 30_000,
    });

    descriptions.push(await viewer.innerText());

    await page.screenshot({
      path: testInfo.outputPath(`variant-${index + 1}.png`),
      fullPage: true,
    });

    const next = page.getByRole("button", { name: "Next" });
    if (!(await next.isEnabled())) {
      break;
    }

    await next.click();
  }

  return descriptions;
}

async function discardIfVisible(page: Page): Promise<void> {
  const discard = page.getByRole("button", { name: "Discard" });

  if (await discard.isVisible()) {
    await discard.click();
  }
}
