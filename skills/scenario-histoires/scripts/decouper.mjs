// Découpe une planche d'expressions (le même personnage répété côte à côte, de gauche à droite) en une image
// par expression, au format que l'application attend : PNG vertical 2:3, personnage centré.
//
//   node scripts/decouper.mjs planche.png "scenarios/Nom/personnages/Maren" neutre sourire ferme
//
// Les noms suivent l'ordre des silhouettes, de gauche à droite. La planche doit être un PNG 8 bits (RGB ou RGBA).
// Sur un fond uni (le gris clair des prompts), elle est détourée ici ; déjà détourée, sa transparence est gardée.
// --garder-fond découpe sans détourer. Sans dépendance : Node seul.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';

const [src, out, ...names] = process.argv.slice(2);
if (!src || !out || !names.length) {
  console.error('usage : node decouper.mjs planche.png "dossier/du/personnage" neutre sourire ferme …');
  process.exit(2);
}
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// --- Lecture PNG : 8 bits, gris, gris + alpha, RGB ou RGBA, sans entrelacement ---
const readPng = buf => {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('la planche doit être un PNG (réexportez-la en PNG)');
  let i = 8,
    w,
    h,
    depth,
    type,
    inter;
  const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i),
      t = buf.toString('latin1', i + 4, i + 8),
      d = buf.subarray(i + 8, i + 8 + len);
    if (t === 'IHDR') [w, h, depth, type, inter] = [d.readUInt32BE(0), d.readUInt32BE(4), d[8], d[9], d[12]];
    else if (t === 'IDAT') idat.push(d);
    else if (t === 'IEND') break;
    i += 12 + len;
  }
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (depth !== 8 || inter || !ch) throw new Error('PNG non pris en charge : réexportez-le en PNG 8 bits RGB ou RGBA');
  const stride = w * ch,
    raw = inflateSync(Buffer.concat(idat)),
    px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride),
    p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++],
      line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? line[x - ch] : 0,
        b = prev[x],
        c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pa = Math.abs(b - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * ch,
        o = (y * w + x) * 4;
      if (ch >= 3) [px[o], px[o + 1], px[o + 2], px[o + 3]] = [line[s], line[s + 1], line[s + 2], ch === 4 ? line[s + 3] : 255];
      else [px[o], px[o + 1], px[o + 2], px[o + 3]] = [line[s], line[s], line[s], ch === 2 ? line[s + 1] : 255];
    }
    prev = line;
  }
  return { w, h, px, alpha: ch === 2 || ch === 4 };
};

// --- Écriture PNG : RGBA, ou RGB pour une image opaque (le vérificateur y verra l’absence de transparence) ---
const T = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc = b => {
  let c = ~0;
  for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};
const chunk = (t, d) => {
  const td = Buffer.concat([Buffer.from(t, 'latin1'), d]),
    l = Buffer.alloc(4),
    c = Buffer.alloc(4);
  l.writeUInt32BE(d.length);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([l, td, c]);
};
const writePng = (w, h, px, rgba = true) => {
  const n = rgba ? 4 : 3,
    ih = Buffer.alloc(13),
    raw = Buffer.alloc((w * n + 1) * h);
  ih.writeUInt32BE(w, 0);
  ih.writeUInt32BE(h, 4);
  ih[8] = 8;
  ih[9] = rgba ? 6 : 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) px.copy(raw, y * (w * n + 1) + 1 + x * n, (y * w + x) * 4, (y * w + x) * 4 + n);
  return Buffer.concat([SIG, chunk('IHDR', ih), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
};

// --- Détourage d'un fond uni ---
// 1. Fond : médiane des pixels du bord ; remplissage depuis les bords sur les pixels proches de cette couleur.
// 2. Trous : zones de fond enfermées (entre un bras et le corps, entre deux mèches), reconnues à leur uniformité ;
//    un objet clair (trousse, col) a de la texture et reste.
// 3. Bord : chaque pixel à 2 pixels au plus du fond est un mélange du fond et du personnage ; sa transparence est
//    sa part de personnage, mesurée par rapport au pixel voisin le plus éloigné du gris (une mèche noire), et il
//    prend la couleur de ce pixel. Un pixel qui n'est pas un tel mélange (bord de peau claire) reste opaque.
// Rend la part de l'image retirée.
const detour = (w, h, px, t1 = 16) => {
  const N = w * h,
    orig = Buffer.from(px),
    border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  const bg = [0, 1, 2].map(k => {
    const v = border.map(i => orig[i * 4 + k]).sort((a, b) => a - b);
    return v[v.length >> 1];
  });
  const diff = i => Math.max(...[0, 1, 2].map(k => Math.abs(orig[i * 4 + k] - bg[k])));
  const nb = i => {
    const x = i % w;
    return [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w].filter(j => j >= 0 && j < N);
  };
  const out = new Uint8Array(N),
    st = border.filter(i => diff(i) <= t1);
  for (const i of st) out[i] = 1;
  while (st.length) for (const j of nb(st.pop())) if (!out[j] && diff(j) <= t1) (out[j] = 1), st.push(j);
  const seen = new Uint8Array(N);
  for (let s = 0; s < N; s++) {
    if (out[s] || seen[s] || diff(s) > t1) continue;
    const comp = [s],
      q = [s];
    seen[s] = 1;
    while (q.length) for (const j of nb(q.pop())) if (!seen[j] && !out[j] && diff(j) <= t1) (seen[j] = 1), q.push(j), comp.push(j);
    if (comp.length >= 12 && comp.reduce((m, i) => m + diff(i), 0) / comp.length <= 11) for (const i of comp) out[i] = 1;
  }
  const dist = new Uint8Array(N).fill(255);
  let front = [];
  for (let i = 0; i < N; i++) if (out[i]) (dist[i] = 0), front.push(i);
  for (let r = 1; r <= 2; r++) {
    const next = [];
    for (const i of front) for (const j of nb(i)) if (dist[j] === 255) (dist[j] = r), next.push(j);
    front = next;
  }
  let n = 0;
  for (let i = 0; i < N; i++) {
    if (out[i]) {
      px[i * 4 + 3] = 0;
      n++;
      continue;
    }
    if (dist[i] > 2) continue;
    const x = i % w,
      y = (i / w) | 0;
    let F = -1,
      best = -1;
    for (let yy = Math.max(0, y - 4); yy <= Math.min(h - 1, y + 4); yy++)
      for (let xx = Math.max(0, x - 4); xx <= Math.min(w - 1, x + 4); xx++) {
        const j = yy * w + xx;
        if (!out[j] && diff(j) > best) (best = diff(j)), (F = j);
      }
    let num = 0,
      den = 0,
      res = 0;
    for (let k = 0; k < 3; k++) {
      const c = orig[i * 4 + k] - bg[k],
        f = orig[F * 4 + k] - bg[k];
      num += c * f;
      den += f * f;
    }
    let a = den ? Math.max(0, Math.min(1, num / den)) : 1;
    for (let k = 0; k < 3; k++) res = Math.max(res, Math.abs(orig[i * 4 + k] - bg[k] - a * (orig[F * 4 + k] - bg[k])));
    if (res > 18) a = 1;
    if (a < 1) for (let k = 0; k < 3; k++) px[i * 4 + k] = orig[F * 4 + k];
    px[i * 4 + 3] = a < 0.05 ? 0 : Math.round(a * 255);
  }
  return n / N;
};

// --- Silhouettes ---
// --garder-fond : découpe sans détourer (fond qui n'est pas uni, ou détourage fait ailleurs).
const keep = names.indexOf('--garder-fond');
if (keep >= 0) names.splice(keep, 1);
const { w, h, px, alpha: ach } = readPng(readFileSync(src));
// Fond : transparent s'il l'est vraiment aux quatre coins (un canal alpha tout opaque ne compte pas). Sinon, la
// planche est détourée ici, sauf --garder-fond.
const corners = [0, w - 1, (h - 1) * w, h * w - 1];
let alpha = ach && corners.every(i => px[i * 4 + 3] < 24);
const bg = [0, 1, 2].map(k => corners.reduce((s, i) => s + px[i * 4 + k], 0) / 4);
if (!alpha && keep < 0) {
  const part = detour(w, h, px);
  alpha = true;
  console.log(`Fond retiré : ${Math.round(part * 100)} % de la planche.`);
  if (part < 0.3)
    console.warn('Peu de fond retiré : le fond n’est sans doute pas uni. Vérifiez les images, ou relancez avec --garder-fond.');
}
const fig = i =>
  alpha ? px[i * 4 + 3] > 24 : Math.max(...[0, 1, 2].map(k => Math.abs(px[i * 4 + k] - bg[k]))) > 32;
const col = Array.from({ length: w }, (_, x) => {
  let n = 0;
  for (let y = 0; y < h; y++) n += fig(y * w + x);
  return n > h * 0.004;
});
// Bandes verticales occupées ; un petit vide (bras écarté) ne coupe pas une silhouette, une bande trop
// étroite (poussière, liseré) est ignorée.
let runs = [];
for (let x = 0; x < w; x++) {
  if (!col[x]) continue;
  const last = runs.at(-1);
  if (last && x - last[1] <= w * 0.012) last[1] = x;
  else runs.push([x, x]);
}
runs = runs.filter(([a, b]) => b - a >= w * 0.02);
if (runs.length !== names.length) {
  console.warn(
    `${runs.length} silhouette(s) trouvée(s) pour ${names.length} nom(s) : découpe en ${names.length} parts égales. ` +
      'Vérifiez le résultat, ou régénérez la planche avec plus d’espace entre les silhouettes.'
  );
  runs = names.map((_, i) => [Math.round((i * w) / names.length), Math.round(((i + 1) * w) / names.length) - 1]);
}
// Limites de chaque case : le milieu des vides entre silhouettes.
const cuts = runs.map(([a, b], i) => [
  i ? Math.ceil((runs[i - 1][1] + a) / 2) : 0,
  i < runs.length - 1 ? Math.floor((b + runs[i + 1][0]) / 2) : w - 1
]);
mkdirSync(out, { recursive: true });
cuts.forEach(([l, r], i) => {
  let x0 = r,
    x1 = l,
    y0 = h,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = l; x <= r; x++)
      if (fig(y * w + x)) [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
  if (y1 < 0) return console.warn(`${names[i]} : case vide, rien écrit`);
  // Marge de 4 % de la hauteur, puis cadre vertical 2:3, silhouette centrée.
  const m = Math.round((y1 - y0) * 0.04),
    cw = x1 - x0 + 1 + 2 * m,
    chh = y1 - y0 + 1 + 2 * m,
    H = Math.max(chh, Math.ceil((cw * 3) / 2)),
    W = Math.round((H * 2) / 3),
    ox = Math.round((W - (x1 - x0 + 1)) / 2),
    oy = Math.round((H - (y1 - y0 + 1)) / 2),
    o = Buffer.alloc(W * H * 4);
  if (!alpha) for (let k = 0; k < W * H; k++) o.set([...bg.map(Math.round), 255], k * 4);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const s = (y * w + x) * 4,
        d = ((y - y0 + oy) * W + (x - x0 + ox)) * 4;
      // Hors de la case (la silhouette voisine), rien n'est recopié.
      if (x >= l && x <= r) px.copy(o, d, s, s + 4);
    }
  const f = join(out, names[i] + '.png');
  writeFileSync(f, writePng(W, H, o, alpha));
  console.log(`${f} : ${W}×${H}`);
});
if (!alpha)
  console.warn('Planche sans transparence : les images gardent le fond. Détourez-les (ou la planche) avant de les publier.');
