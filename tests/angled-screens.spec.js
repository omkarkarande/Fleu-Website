const { test, expect } = require("@playwright/test");

test("dark angled screens decode without cropping at every breakpoint", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const image of await page.locator(".screen-link img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      await expect(image).toHaveAttribute("src", /angled-dark-v2\.webp$/);
      await expect(image).toHaveCSS("object-fit", "contain");
      const metrics = await image.evaluate((img) => ({
        w: img.naturalWidth,
        h: img.naturalHeight,
        ratio: img.clientWidth / img.clientHeight,
      }));
      expect(metrics.w).toBe(784);
      expect(metrics.h).toBe(1498);
      expect(Math.abs(metrics.ratio - 784 / 1498)).toBeLessThan(0.003);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await expect(page.locator(".spread-note")).toContainText(
    "authored sample mood scores",
  );
});
