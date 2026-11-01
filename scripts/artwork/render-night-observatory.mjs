// Renders the two night-observatory layers together in Edge, the way the
// homepage stacks them, for inspection crops and the admin thumbnail.
//   node scripts/artwork/render-night-observatory.mjs [x,y,w,h,scale ...]
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, '.design-qa/night');
const assets = path.join(root, 'public/images/home');
const layer = async (name) => `data:image/svg+xml;base64,${(await fs.readFile(path.join(assets, `night-observatory-${name}.svg`))).toString('base64')}`;

await fs.mkdir(out, { recursive: true });
const [sky, land] = await Promise.all([layer('sky'), layer('land')]);
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.setContent(`<style>body{margin:0;background:#080e1b}img{position:absolute;inset:0;width:1920px;height:1080px}</style>
  <img src="${sky}"><img src="${land}">`);
await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode())));
const full = await page.screenshot({ clip: { x: 0, y: 0, width: 1920, height: 1080 } });
await sharp(full).resize(1920).png().toFile(path.join(out, 'full.png'));
await sharp(full).resize(600).webp({ quality: 86 }).toFile(path.join(assets, 'thumbs/night-observatory.webp'));
// Matched-scale crops: dome, observer, core, ridge, Summer Triangle.
const crops = process.argv.slice(2).length ? process.argv.slice(2) : [
  '700,690,260,170,dome', '1300,690,220,150,observer', '860,560,420,260,core',
  '0,560,700,360,ridge-left', '1450,560,470,380,ridge-right', '440,160,420,460,triangle'
];
for (const spec of crops) {
  const [x, y, w, h, name] = spec.split(',');
  await sharp(full).extract({ left: +x * 2, top: +y * 2, width: +w * 2, height: +h * 2 })
    .png().toFile(path.join(out, `crop-${name}.png`));
}
await browser.close();
console.log('rendered', out);
