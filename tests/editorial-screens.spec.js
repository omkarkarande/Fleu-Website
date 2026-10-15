const { test, expect } = require("@playwright/test");
const { createHash } = require("node:crypto");
const manifest = require("../assets/screen-crops-v5.json");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("website crops and full-screen originals match their provenance", async ({
  request,
}) => {
  for (const asset of manifest) {
    for (const [filename, hash] of [
      [asset.source, asset.source_sha256],
      [asset.crop, asset.crop_sha256],
    ]) {
      const response = await request.get(`/assets/${filename}`);
      expect(response.ok()).toBeTruthy();
      expect(sha256(await response.body())).toBe(hash);
    }
  }
});

test("website details are pixel-exact crops, not repainted UI", async ({
  page,
}) => {
  await page.goto("/");
  for (const asset of manifest) {
    const matches = await page.evaluate(async (asset) => {
      const load = async (filename) => {
        const image = new Image();
        image.src = `/assets/${filename}`;
        await image.decode();
        return image;
      };
      const [source, crop] = await Promise.all([
        load(asset.source),
        load(asset.crop),
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = asset.width;
      canvas.height = asset.height;
      const context = canvas.getContext("2d");
      context.drawImage(source, -asset.crop_box[0], -asset.crop_box[1]);
      const expected = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(crop, 0, 0);
      const actual = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      return expected.every((value, index) => value === actual[index]);
    }, asset);
    expect(matches, asset.name).toBeTruthy();
  }
});

test("unframed details retain their proportions across breakpoints", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
      "href",
      "styles.css?v=screen-details-v5",
    );
    const images = page.locator(".screen-link img");
    await expect(images).toHaveCount(manifest.length);
    for (const [index, asset] of manifest.entries()) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((img) => img.complete && img.naturalWidth > 0),
        )
        .toBeTruthy();
      await image.evaluate((img) => img.decode());
      await expect(image).toHaveAttribute("src", `assets/${asset.crop}`);
      await expect(image.locator("..")).toHaveAttribute(
        "href",
        `assets/${asset.source}`,
      );
      await expect(image).toHaveCSS("transform", "none");
      await expect(image.locator("..")).toHaveCSS("transform", "none");
      await expect(image).toHaveAttribute("alt", /^Detail of Fleu/);
      const dimensions = await image.evaluate((img) => ({
        width: img.naturalWidth,
        height: img.naturalHeight,
        left: img.getBoundingClientRect().left,
        right: img.getBoundingClientRect().right,
        ratio: img.clientWidth / img.clientHeight,
      }));
      expect(dimensions.width).toBe(asset.width);
      expect(dimensions.height).toBe(asset.height);
      expect(
        Math.abs(dimensions.ratio - asset.width / asset.height),
      ).toBeLessThan(0.01);
      expect(dimensions.left).toBeGreaterThanOrEqual(0);
      expect(dimensions.right).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await expect(page.locator(".spread-note")).toContainText(
    "Cropped app screens",
  );
  await expect(page.locator(".spread-note")).toContainText(
    "authored sample mood scores",
  );
});
