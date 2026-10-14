const { test, expect } = require("@playwright/test");
const { createHash } = require("node:crypto");

// Hashes of the approved transparent, text-free web derivatives (not store posters).
const assets = {
  "01-today":
    "cbc0e9dccf61999e99813a64622ac7690ce2fa0661585843848af43bf7828533",
  "02-history":
    "30e01ca70436f8b1c4083d4a2d9bd0d9fae4c6abc0f8046bd1853693ad37b856",
  "03-stats":
    "c5d664889ed15c05ac28cf96d3e095971bfe338d2bcaad780bbb89f8b9457f67",
};

test("approved text-free tilted web assets retain their exact bytes", async ({
  request,
}) => {
  for (const [name, hash] of Object.entries(assets)) {
    const response = await request.get(
      `/assets/${name}-editorial-lean-v4.webp`,
    );
    expect(response.ok()).toBeTruthy();
    expect(
      createHash("sha256")
        .update(await response.body())
        .digest("hex"),
    ).toBe(hash);
  }
});

test("dark clockwise-tilted screens decode without cropping at every breakpoint", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
      "href",
      "styles.css?v=editorial-lean-v4",
    );
    await expect(page.locator(".screen-link img")).toHaveCount(3);
    for (const image of await page.locator(".screen-link img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      await expect(image).toHaveAttribute("src", /editorial-lean-v4\.webp$/);
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect(image).toHaveCSS("transform", "none");
      await expect(image.locator("..")).toHaveCSS("transform", "none");
      await expect(image).toHaveAttribute("alt", /clockwise-tilted dark phone/);
      await expect(image).toHaveAttribute("width", "900");
      await expect(image).toHaveAttribute("height", "1575");
      const metrics = await image.evaluate((img) => {
        const rect = img.getBoundingClientRect();
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return {
          w: img.naturalWidth,
          h: img.naturalHeight,
          ratio: rect.width / rect.height,
          left: rect.left,
          right: rect.right,
          corners: [
            [0, 0],
            [899, 0],
            [0, 1574],
            [899, 1574],
          ].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]),
        };
      });
      expect(metrics.w).toBe(900);
      expect(metrics.h).toBe(1575);
      expect(Math.abs(metrics.ratio - 900 / 1575)).toBeLessThan(0.003);
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(width);
      expect(metrics.corners).toEqual([0, 0, 0, 0]);
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
