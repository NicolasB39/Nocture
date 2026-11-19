// Convertit en WebP les images PNG d'un dossier (récursivement) ou des fichiers donnés, et retire les PNG.
//
//   npm run webp                      (tout scenarios/)
//   node tools/webp.mjs "scenarios/Le Dernier Rang/decors"
//
// Les codes d'images ne changent pas : l'application identifie une image par son nom, sans l'extension. La
// transparence des personnages détourés est gardée. Le plus grand côté est ramené à 1920 px au plus (une scène
// sur un téléphone n'en affiche pas davantage). Conversion par Chromium (Playwright, dépendance de développement) ;
// PW_CHANNEL=chrome prend le Chrome installé.
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const MAX = 1920,
  Q = 0.88;
const list = p => (statSync(p).isDirectory() ? readdirSync(p).flatMap(f => list(join(p, f))) : /\.png$/i.test(p) ? [p] : []);
const files = (process.argv.length > 2 ? process.argv.slice(2) : ['scenarios']).flatMap(list);
if (!files.length) {
  console.log('Aucune image PNG.');
  process.exit(0);
}
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}).catch(() => chromium.launch({ channel: 'chrome' }));
const page = await browser.newPage();
let before = 0,
  after = 0;
for (const f of files) {
  const src = readFileSync(f),
    out = f.replace(/\.png$/i, '.webp');
  const data = await page.evaluate(
    async ({ u, MAX, Q }) => {
      const im = new Image();
      im.src = u;
      await im.decode();
      const k = Math.min(1, MAX / Math.max(im.naturalWidth, im.naturalHeight)),
        c = Object.assign(document.createElement('canvas'), {
          width: Math.round(im.naturalWidth * k),
          height: Math.round(im.naturalHeight * k)
        }),
        g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', Q);
    },
    { u: 'data:image/png;base64,' + src.toString('base64'), MAX, Q }
  );
  const webp = Buffer.from(data.split(',')[1], 'base64');
  writeFileSync(out, webp);
  rmSync(f);
  before += src.length;
  after += webp.length;
  console.log(`${out} : ${Math.round(src.length / 1024)} → ${Math.round(webp.length / 1024)} Ko`);
}
await browser.close();
console.log(`${files.length} image(s) : ${(before / 1048576).toFixed(1)} → ${(after / 1048576).toFixed(1)} Mo`);
