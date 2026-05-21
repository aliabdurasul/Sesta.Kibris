import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "favicon.png");

const sizes = [
  { size: 192, out: path.join(root, "public", "icons", "icon-192.png") },
  { size: 512, out: path.join(root, "public", "icons", "icon-512.png") },
  { size: 180, out: path.join(root, "public", "apple-touch-icon.png") },
];

for (const { size, out } of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(out);
  console.log(`Wrote ${out} (${size}x${size})`);
}
