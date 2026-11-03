import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const galleryDir = path.resolve('public', 'gallery');

async function convertAllToWebp() {
  const files = fs.readdirSync(galleryDir);
  console.log(`Found ${files.length} files in ${galleryDir}`);

  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      const inputPath = path.join(galleryDir, file);
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const outputPath = path.join(galleryDir, `${base}.webp`);

      const statBefore = fs.statSync(inputPath);
      await sharp(inputPath)
        .webp({ quality: 82, effort: 4 })
        .toFile(outputPath);

      const statAfter = fs.statSync(outputPath);
      const savings = (((statBefore.size - statAfter.size) / statBefore.size) * 100).toFixed(1);
      console.log(`Converted ${file} (${(statBefore.size / 1024).toFixed(0)}KB) -> ${base}.webp (${(statAfter.size / 1024).toFixed(0)}KB, -${savings}%)`);
    }
  }
}

convertAllToWebp().catch(console.error);
