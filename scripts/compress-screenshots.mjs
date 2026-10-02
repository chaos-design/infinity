#!/usr/bin/env node
import { readdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = join(rootDir, 'screenshots');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

async function compressPng(filePath) {
  const tempPath = `${filePath}.tmp`;
  const originalSize = statSync(filePath).size;

  await sharp(filePath)
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 80,
      effort: 10,
    })
    .toFile(tempPath);

  const newSize = statSync(tempPath).size;

  if (newSize >= originalSize) {
    unlinkSync(tempPath);
    return { originalSize, newSize: originalSize, skipped: true };
  }

  renameSync(tempPath, filePath);
  return { originalSize, newSize, skipped: false };
}

async function main() {
  const files = readdirSync(targetDir).filter((name) => extname(name).toLowerCase() === '.png');
  let totalBefore = 0;
  let totalAfter = 0;

  for (const name of files) {
    const filePath = join(targetDir, name);
    const { originalSize, newSize, skipped } = await compressPng(filePath);
    totalBefore += originalSize;
    totalAfter += newSize;
    const ratio = ((1 - newSize / originalSize) * 100).toFixed(1);
    const tag = skipped ? 'skip' : `-${ratio}%`;
    console.log(`${name.padEnd(40)} ${formatBytes(originalSize).padStart(10)} -> ${formatBytes(newSize).padStart(10)}  ${tag}`);
  }

  const totalRatio = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  console.log(`\nTotal: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)}  -${totalRatio}%`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
