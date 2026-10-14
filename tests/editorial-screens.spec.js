const { test, expect } = require("@playwright/test");

test("dark front-facing screens decode without cropping at every breakpoint", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
      "href",
      "styles.css?v=editorial-dark-v3",
    );
    for (const image of await page.locator(".screen-link img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      await expect(image).toHaveAttribute("src", /editorial-dark-v3\.webp$/);
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect(image).toHaveCSS("transform", "none");
      await expect(image.locator("..")).toHaveCSS("transform", "none");
      await expect(image).toHaveAttribute(
        "alt",
        /flat, front-facing dark phone/,
      );
      await expect(image).toHaveAttribute("width", "756");
      await expect(image).toHaveAttribute("height", "1623");
      const metrics = await image.evaluate((img) => ({
        w: img.naturalWidth,
        h: img.naturalHeight,
        ratio: img.clientWidth / img.clientHeight,
      }));
      expect(metrics.w).toBe(756);
      expect(metrics.h).toBe(1623);
      expect(Math.abs(metrics.ratio - 756 / 1623)).toBeLessThan(0.003);
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
