import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 96, 128];
const inputImage = path.join(__dirname, 'public', 'chaos.png');
const outputDir = path.join(__dirname, 'public', 'icon');
const publicDir = path.join(__dirname, 'public');

async function generateIcons() {
  if (!fs.existsSync(inputImage)) {
    console.error(`Error: 找不到源文件 ${inputImage}`);
    console.error('请手动将图片保存到项目根目录，并命名为 icon.png');
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate resized icons
  for (const size of sizes) {
    await sharp(inputImage)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `${size}.png`));
    console.log(`Generated ${size}x${size} icon`);
  }

  // Replace wxt.svg with the new icon (as png)
  const svgPath = path.join(publicDir, 'wxt.svg');
  if (fs.existsSync(svgPath)) {
    fs.unlinkSync(svgPath);
    console.log('Removed old wxt.svg');
  }

  fs.copyFileSync(inputImage, path.join(publicDir, 'wxt.png'));
  console.log('Copied icon.png to public/wxt.png');

  console.log('All icons replaced successfully!');
}

generateIcons().catch(console.error);
