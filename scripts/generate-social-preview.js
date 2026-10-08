// Run on macOS with Georgia installed: node scripts/generate-social-preview.js
// Ships a static PNG; no fonts or rendering scripts are needed by share crawlers.
const { chromium } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname, "..");
  await fs.access("/System/Library/Fonts/Supplemental/Georgia Italic.ttf");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<style>${await fs.readFile(path.join(root, "styles.css"), "utf8")}</style><a class="wordmark">fleu<span>.</span></a>`,
    );
    const png = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      const mark = document.querySelector(".wordmark");
      const style = getComputedStyle(mark);
      const size = 260;
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${size}px ${style.fontFamily}`;
      ctx.letterSpacing = `${(parseFloat(style.letterSpacing) / parseFloat(style.fontSize)) * size}px`;
      ctx.fillStyle = style.color;
      ctx.fillText("fleu", 300, 400);
      ctx.fillStyle = getComputedStyle(mark.querySelector("span")).color;
      ctx.fillText(".", 300 + ctx.measureText("fleu").width, 400);
      const data = ctx.getImageData(0, 0, 1200, 630);
      let left = 1200,
        right = 0,
        top = 630,
        bottom = 0;
      for (let y = 0; y < 630; y++)
        for (let x = 0; x < 1200; x++) {
          if (data.data[(y * 1200 + x) * 4 + 3]) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      const output = document.createElement("canvas");
      output.width = 1200;
      output.height = 630;
      const out = output.getContext("2d");
      out.fillStyle = "#000";
      out.fillRect(0, 0, 1200, 630);
      // Centre visible glyph bounds, not the font's asymmetric line box.
      out.drawImage(
        canvas,
        Math.round((1199 - left - right) / 2),
        Math.round((629 - top - bottom) / 2),
      );
      return output.toDataURL("image/png").split(",")[1];
    });
    const destination = path.join(root, "assets/fleu-social-v1.png");
    await fs.writeFile(destination, Buffer.from(png, "base64"));
    console.log(`Generated ${destination}: 1200 × 630`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
