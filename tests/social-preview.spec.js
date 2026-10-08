const { test, expect } = require("@playwright/test");

for (const route of ["index.html", "privacy.html", "support.html"]) {
  test(`${route}: dedicated static social preview`, async ({
    page,
    request,
  }) => {
    const response = await request.get(`/${route}`);
    const html = await response.text();
    expect(html).toContain(
      'content="https://fleu.app/assets/fleu-social-v1.png"',
    );
    await page.goto(`/${route}`);
    for (const selector of [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]) {
      await expect(page.locator(selector)).toHaveCount(1);
      await expect(page.locator(selector)).toHaveAttribute(
        "content",
        "https://fleu.app/assets/fleu-social-v1.png",
      );
    }
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    for (const [key, value] of Object.entries({
      width: "1200",
      height: "630",
      type: "image/png",
    })) {
      await expect(
        page.locator(`meta[property="og:image:${key}"]`),
      ).toHaveAttribute("content", value);
    }
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      /fleu.*terracotta/,
    );
    const imageResponse = await request.get("/assets/fleu-social-v1.png");
    expect(imageResponse.ok()).toBeTruthy();
    expect(imageResponse.headers()["content-type"]).toContain("image/png");
    const pixels = await page.evaluate(async () => {
      const image = new Image();
      image.src = "/assets/fleu-social-v1.png";
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, image.width, image.height);
      let left = image.width,
        right = 0,
        top = image.height,
        bottom = 0,
        white = 0,
        rust = 0;
      for (let y = 0; y < image.height; y++)
        for (let x = 0; x < image.width; x++) {
          const i = (y * image.width + x) * 4;
          if (data[i] || data[i + 1] || data[i + 2]) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
          if (data[i] === 243 && data[i + 1] === 240 && data[i + 2] === 231)
            white++;
          if (data[i] === 217 && data[i + 1] === 147 && data[i + 2] === 118)
            rust++;
        }
      return {
        width: image.width,
        height: image.height,
        left,
        right,
        top,
        bottom,
        white,
        rust,
        corner: Array.from(data.slice(0, 4)),
      };
    });
    expect([pixels.width, pixels.height]).toEqual([1200, 630]);
    expect(pixels.corner).toEqual([0, 0, 0, 255]);
    expect(Math.abs(pixels.left + pixels.right - 1199)).toBeLessThanOrEqual(2);
    expect(Math.abs(pixels.top + pixels.bottom - 629)).toBeLessThanOrEqual(2);
    expect(pixels.left).toBeGreaterThan(285);
    expect(pixels.white).toBeGreaterThan(1000);
    expect(pixels.rust).toBeGreaterThan(100);
  });
}
