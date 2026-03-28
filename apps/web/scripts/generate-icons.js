/**
 * Génère les PNG PWA depuis public/icons/icon.svg + un screenshot placeholder.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "icons", "icon.svg");
const screenshotsDir = path.join(root, "public", "screenshots");

async function main() {
  const sizes = [72, 96, 128, 192, 512];
  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(root, "public", "icons", `icon-${size}.png`));
    console.log(`Wrote icon-${size}.png`);
  }

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  await sharp({
    create: {
      width: 390,
      height: 844,
      channels: 3,
      background: { r: 253, g: 250, b: 245 },
    },
  })
    .png()
    .toFile(path.join(screenshotsDir, "home.png"));
  console.log("Wrote screenshots/home.png (placeholder)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
