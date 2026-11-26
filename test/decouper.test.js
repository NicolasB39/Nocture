// Script de découpe des planches (skills/scenario-histoires/scripts/decouper.mjs), lancé comme en vrai sur de
// petites planches PNG fabriquées ici : détourage, mèches mêlées au fond vert, bouts du voisin entre deux
// silhouettes jointives, fond magenta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, deflateSync, inflateSync } from 'node:zlib';

const SCRIPT = process.env.DECOUPER || 'skills/scenario-histoires/scripts/decouper.mjs';
const GREEN = [4, 249, 15],
  MAGENTA = [255, 0, 255],
  SKIN = [230, 180, 150],
  HAIR = [180, 60, 20],
  BLUE = [40, 60, 200];

// PNG RGB 8 bits : f(x, y) donne la couleur de chaque pixel.
const png = (w, h, f) => {
  const chunk = (t, d) => {
    const l = Buffer.alloc(4),
      c = Buffer.alloc(4),
      td = Buffer.concat([Buffer.from(t, 'latin1'), d]);
    l.writeUInt32BE(d.length);
    c.writeUInt32BE(crc32(td));
    return Buffer.concat([l, td, c]);
  };
  const ih = Buffer.alloc(13),
    raw = Buffer.alloc((w * 3 + 1) * h);
  ih.writeUInt32BE(w, 0);
  ih.writeUInt32BE(h, 4);
  ih[8] = 8;
  ih[9] = 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.set(f(x, y), y * (w * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
};
// Lecture d'une image écrite par le script (RGBA, filtre 0 sur chaque ligne) : pixels [r, g, b, a].
const read = file => {
  const b = readFileSync(file);
  let i = 8,
    w,
    h;
  const idat = [];
  while (i < b.length) {
    const len = b.readUInt32BE(i),
      t = b.toString('latin1', i + 4, i + 8);
    if (t == 'IHDR') [w, h] = [b.readUInt32BE(i + 8), b.readUInt32BE(i + 12)];
    if (t == 'IDAT') idat.push(b.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)),
    px = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.push([...raw.subarray(y * (w * 4 + 1) + 1 + x * 4, y * (w * 4 + 1) + 5 + x * 4)]);
  return { w, h, px };
};
// Découpe une planche fabriquée en autant d'images que de noms.
const cut = (sheet, names) => {
  const d = mkdtempSync(join(tmpdir(), 'decouper-'));
  try {
    writeFileSync(join(d, 'planche.png'), sheet);
    execFileSync(process.execPath, [SCRIPT, join(d, 'planche.png'), join(d, 'out'), ...names], { stdio: 'pipe' });
    return names.map(n => read(join(d, 'out', n + '.png')));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
};
const inBox = (x, y, [x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const near = (p, c, t = 12) => c.every((v, k) => Math.abs(p[k] - v) <= t);
const seen = im => im.px.filter(p => p[3] > 24);

test('trois silhouettes sur fond vert : trois images 2:3, fond transparent, couleurs gardées', () => {
  const boxes = [
    [20, 60, 80, 199],
    [120, 60, 180, 199],
    [220, 60, 280, 199]
  ];
  const ims = cut(png(300, 200, (x, y) => (boxes.some(b => inBox(x, y, b)) ? SKIN : GREEN)), ['a', 'b', 'c']);
  for (const im of ims) {
    assert.ok(Math.abs(im.h / im.w - 1.5) < 0.02, 'format 2:3 : ' + im.w + '×' + im.h);
    assert.equal(im.px[0][3], 0, 'coin transparent');
    const op = seen(im);
    assert.ok(Math.abs(op.length - 61 * 140) < 61 * 140 * 0.05, 'surface du personnage : ' + op.length);
    assert.ok(op.every(p => near(p, SKIN)), 'peau intacte');
  }
});

// Une mèche fine qui mêle deux tiers de cheveux roux et un tiers de fond vert a autant de vert que de rouge :
// ramener le vert au niveau du rouge la laissait jaune olive. Elle doit reprendre la couleur des cheveux. Le
// script cherche la couleur des cheveux à 16 pixels au plus : les mèches du test s'arrêtent avant.
test('mèches mêlées au fond vert : couleur des cheveux, pas de liseré olive', () => {
  const mix = HAIR.map((v, k) => Math.round((2 * v + GREEN[k]) / 3));
  const strand = (x, y) => y < 60 && y >= 46 && (x - 100) % 6 == 0 && x >= 70 && x <= 130;
  const [im] = cut(
    png(200, 200, (x, y) => (inBox(x, y, [70, 60, 130, 199]) ? HAIR : strand(x, y) ? mix : GREEN)),
    ['a']
  );
  const olive = seen(im).filter(([r, g, b]) => g >= r - 10 && g - b > 40);
  assert.equal(olive.length, 0, olive.length + ' pixels olive');
  const mech = seen(im).filter(p => p[3] < 250);
  assert.ok(mech.length > 0, 'mèches gardées, en transparence partielle');
  assert.ok(mech.every(([r, g]) => r > g + 60), 'mèches rousses');
});

// Trois bustes reliés par le bas (un seul bloc occupé) : le script coupe là où il y a le moins de personnage.
// Le bord du chapeau de la deuxième silhouette dépasse dans la case de la première : il doit en disparaître.
test('silhouettes jointives : le bout du voisin resté dans la case est retiré', () => {
  const at = (x, y) =>
    y >= 198 && x >= 10 && x <= 290
      ? [50, 50, 50]
      : inBox(x, y, [20, 80, 97, 199]) || inBox(x, y, [205, 40, 280, 199])
        ? SKIN
        : inBox(x, y, [105, 40, 195, 199]) || inBox(x, y, [88, 50, 104, 60])
          ? BLUE
          : GREEN;
  const [a, b] = cut(png(300, 200, at), ['a', 'b', 'c']);
  assert.equal(seen(a).filter(p => near(p, BLUE, 30)).length, 0, 'aucun bout de chapeau bleu dans la première image');
  assert.ok(seen(b).filter(p => near(p, BLUE, 30)).length > 5000, 'la deuxième image garde son personnage bleu');
});

// Sur un fond magenta, deux canaux sont hauts (rouge et bleu) : ne retenir que le rouge effaçait toute peau et
// tous les cheveux roux, où le rouge domine.
test('fond magenta : la peau et les cheveux roux restent', () => {
  const [im] = cut(
    png(200, 200, (x, y) => (inBox(x, y, [60, 40, 140, 80]) ? HAIR : inBox(x, y, [60, 81, 140, 199]) ? SKIN : MAGENTA)),
    ['a']
  );
  const op = seen(im),
    area = 81 * 160;
  assert.ok(op.length > area * 0.95, 'personnage entier : ' + op.length + ' / ' + area);
  assert.ok(op.filter(p => near(p, HAIR)).length > 81 * 41 * 0.9, 'cheveux roux');
  assert.ok(op.filter(p => near(p, SKIN)).length > 81 * 119 * 0.9, 'peau');
  assert.equal(im.px[0][3], 0, 'fond magenta retiré');
});
