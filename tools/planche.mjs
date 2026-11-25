// D'une planche d'expressions aux images du personnage, en une commande :
//
//   node tools/planche.mjs planche.png "scenarios/<Nom>/personnages/<Perso>" perso_neutre perso_sourire perso_ferme
//
// 1. découpe et détoure la planche avec le script du skill (decouper.mjs) dans un dossier temporaire ;
// 2. écrit à côté de la planche un aperçu des expressions sur fond sombre (<planche>-apercu.png), à regarder :
//    un liseré ou un reste de fond s'y voit tout de suite ;
// 3. convertit chaque expression en WebP transparent (qualité 0,9, environ 50 Ko au lieu de 500) dans le dossier du
//    personnage, en remplaçant un PNG ou un WebP du même nom.
// La conversion passe par Chromium (Playwright, dépendance de développement) ; PW_CHANNEL=chrome prend le Chrome
// installé à la place.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch } from './chromium.mjs';

const [src, out, ...names] = process.argv.slice(2);
if (!src || !out || !names.length) {
  console.error('Usage : node tools/planche.mjs planche.png "scenarios/<Nom>/personnages/<Perso>" nom1 nom2 nom3');
  process.exit(1);
}
const tmp = mkdtempSync(join(tmpdir(), 'planche-'));
try {
  execFileSync(process.execPath, ['skills/scenario-histoires/scripts/decouper.mjs', src, tmp, ...names], { stdio: 'inherit' });
  const pngs = names.map(n => 'data:image/png;base64,' + readFileSync(join(tmp, n + '.png')).toString('base64'));
  const browser = await launch();
  const page = await browser.newPage();
  const { apercu, webps } = await page.evaluate(async urls => {
    const ims = await Promise.all(
      urls.map(async u => {
        const im = new Image();
        im.src = u;
        await im.decode();
        return im;
      })
    );
    const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
    // Aperçu : les expressions côte à côte, à la même hauteur, sur le fond sombre d'une scène de nuit.
    const H = 600,
      ws = ims.map(im => Math.round((im.naturalWidth * H) / im.naturalHeight)),
      a = canvas(ws.reduce((s, w) => s + w, 0), H),
      g = a.getContext('2d');
    g.fillStyle = '#1c1e2e';
    g.fillRect(0, 0, a.width, H);
    let x = 0;
    ims.forEach((im, i) => (g.drawImage(im, x, 0, ws[i], H), (x += ws[i])));
    return {
      apercu: a.toDataURL('image/png'),
      webps: ims.map(im => {
        const c = canvas(im.naturalWidth, im.naturalHeight);
        c.getContext('2d').drawImage(im, 0, 0);
        return c.toDataURL('image/webp', 0.9);
      })
    };
  }, pngs);
  await browser.close();
  const ap = src.replace(/\.png$/i, '') + '-apercu.png';
  writeFileSync(ap, Buffer.from(apercu.split(',')[1], 'base64'));
  mkdirSync(out, { recursive: true });
  names.forEach((n, i) => {
    const f = join(out, n + '.webp'),
      png = join(out, n + '.png');
    writeFileSync(f, Buffer.from(webps[i].split(',')[1], 'base64'));
    if (existsSync(png)) rmSync(png);
    console.log(`${f} : ${Math.round(readFileSync(f).length / 1024)} Ko`);
  });
  console.log(`Aperçu sur fond sombre : ${ap}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
