const { test, expect } = require("@playwright/test");

for (const route of ["index.html", "privacy.html", "support.html"]) {
  test(`${route}: current brand favicon and home-screen icon`, async ({
    page,
    request,
  }) => {
    await page.goto(`/${route}`);
    for (const [rel, href, size] of [
      ["icon", "assets/fleu-favicon-v2.png", 64],
      ["apple-touch-icon", "assets/fleu-apple-touch-v2.png", 180],
    ]) {
      const link = page.locator(`link[rel="${rel}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("sizes", `${size}x${size}`);
      const response = await request.get(`/${href}`);
      expect(response.ok()).toBeTruthy();
      const image = await page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return {
          size: [img.width, img.height],
          corner: [...ctx.getImageData(0, 0, 1, 1).data],
        };
      }, `/${href}`);
      expect(image.size).toEqual([size, size]);
      expect(image.corner).toEqual([0, 0, 0, 255]);
    }
    const fallback = await request.get("/favicon.ico");
    expect(fallback.ok()).toBeTruthy();
    expect(await page.content()).not.toContain("logo_light_background.PNG");
  });
}
