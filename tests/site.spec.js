const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs/promises");
const pages = ["index.html", "privacy.html", "support.html"];

for (const route of pages) {
  test(`${route}: content, assets, local links, accessibility`, async ({
    page,
    request,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/${route}`);
    expect(response.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toBeVisible();
    const urls = await page
      .locator("a[href],link[href],script[src],img[src]")
      .evaluateAll((elements) =>
        elements.map((el) => el.href || el.src).filter(Boolean),
      );
    for (const value of new Set(urls)) {
      const url = new URL(value);
      if (url.origin !== "http://127.0.0.1:4173") continue;
      expect((await request.get(url.href)).ok(), url.href).toBeTruthy();
      if (url.hash) {
        const html = await (await request.get(url.pathname)).text();
        expect(html, url.href).toContain(
          `id="${decodeURIComponent(url.hash.slice(1))}"`,
        );
      }
    }
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(a11y.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
  test(`${route}: responsive layout`, async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${route}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow at ${width}`,
      ).toBeTruthy();
      await expect(page.locator("h1")).toBeVisible();
    }
  });
}

test("screenshot dialog: keyboard, trapping, escape and restoration", async ({
  page,
}) => {
  await page.goto("/");
  const open = page.locator("[data-zoom]").first();
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  // Native modal keeps focus within the dialog; browser focus can temporarily be on body.
  expect(
    await page.evaluate(
      () =>
        document.activeElement === document.body ||
        document.querySelector("dialog").contains(document.activeElement),
    ),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(open).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass("dialog-open");
  for (const trigger of await page.locator("[data-zoom]").all()) {
    await trigger.click();
    await expect(page.locator("#dialog-image")).toHaveAttribute(
      "src",
      /assets\/[123]\.png$/,
    );
    await page.getByRole("button", { name: "Close" }).click();
    await expect(trigger).toBeFocused();
  }
});

test("no-JS navigation, screenshot fallback and FAQ", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.locator("h1")).toContainText("kept.");
  await page.locator("[data-zoom]").first().click();
  await expect(page).toHaveURL(/assets\/1.png$/);
  await page.goto("http://127.0.0.1:4173/support.html");
  await page.getByText("How do I delete my data?", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText(
    "Uninstalling does not erase all iCloud data",
  );
  await context.close();
});

test("no third-party runtime requests or fake App Store CTA", async ({
  page,
}) => {
  const external = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173"))
      external.push(request.url());
  });
  for (const route of pages) await page.goto(`/${route}`);
  expect(external).toEqual([]);
  await page.goto("/");
  await expect(page.locator('a[href*="apps.apple.com"]')).toHaveCount(0);
  await expect(
    page.locator('a[href="https://testflight.apple.com/join/DFhQ72wR"]'),
  ).toHaveCount(2);
});

test("privacy and compatibility regressions", async ({ page }) => {
  await page.goto("/privacy.html");
  await expect(page.locator("#deletion")).toContainText(
    "Deleting the app is not a complete deletion",
  );
  await expect(page.locator("#profile")).toContainText("birthday");
  await expect(page.locator("#icloud")).toContainText(
    "Signing out does not delete these caches",
  );
  await expect(page.locator("#website")).toContainText(
    "technical request information",
  );
  await page.goto("/");
  await expect(page.locator("#requirements")).toContainText("iOS 26");
  await expect(page.locator("#requirements")).toContainText(
    "requires successful mood analysis",
  );
});

test("capture review images", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Single set of visual review artifacts",
  );
  await fs.mkdir("artifacts", { recursive: true });
  for (const [name, width, height] of [
    ["desktop", 1440, 1050],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of pages) {
      await page.goto(`/${route}`);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({
        path: `artifacts/${route.replace(".html", "")}-${name}.png`,
        fullPage: true,
      });
    }
  }
});
