import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Explicitly invoked by the local QA seed only; never part of a production build.
export async function ensureDesignQAMedia(root, destination) {
  if (process.env.NODE_ENV === 'production') throw new Error('Design QA is development only.');
  const sources = JSON.parse(await fs.readFile(path.join(root, 'tests/fixtures/design-qa/media-sources.json'), 'utf8'));
  await fs.mkdir(destination, { recursive: true });
  for (const { name, source } of sources) {
    if (!/^[a-z0-9-]+\.(png|jpg)$/.test(name)) throw new Error(`Invalid QA image name: ${name}`);
    const target = path.join(destination, name);
    try { await fs.access(target); continue; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    console.log(`Fetching local QA image: ${name}`);
    const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`QA image ${name}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const image = sharp(bytes).rotate().resize({ width: 1000, withoutEnlargement: true });
    const output = name.endsWith('.jpg') ? await image.jpeg({ quality: 85 }).toBuffer() : await image.png().toBuffer();
    await fs.writeFile(target, output);
  }
}
