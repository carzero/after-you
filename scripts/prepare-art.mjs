import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root = new URL('../assets/source/art-v03/', import.meta.url);
const out = new URL('../assets/runtime/art-v03/', import.meta.url);
const manifest = JSON.parse(await fs.readFile(new URL('ASSET_MANIFEST.json', root)));
let total = 0;
for (const entry of manifest) {
  const source = new URL(entry.file, root), bytes = await fs.readFile(source);
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`Source hash mismatch: ${entry.file}`);
  if (entry.file.startsWith('assets/concept/') || entry.file.includes('box_revision')) continue;
  const target = new URL(entry.file.replace('assets/', '').replace('.png', '.webp'), out);
  await fs.mkdir(path.dirname(target.pathname), { recursive: true });
  // Only proportional resize/encoding. Original composition, colors and alpha are retained.
  const result = await sharp(bytes).resize({width: entry.file.includes('sky_') ? 768 : 512, withoutEnlargement: true}).webp({quality: 86, alphaQuality: 100}).toFile(target.pathname);
  total += result.size;
}
console.log(`Verified ${manifest.length} source hashes; runtime WebP total ${(total / 1024).toFixed(0)} KiB`);
