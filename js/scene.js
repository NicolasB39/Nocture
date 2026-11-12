import { app, ctx, S } from './state.js';
import { el, hue, nz } from './util.js';

export const lieuOf = st => (st || []).find(([k]) => /^(lieu|endroit|localisation|position)/.test(nz(k)))?.[1] || '';
// Jour (ou Date) du récit : pas « Jours restants » ni « Journal ».
export const jourOf = st => (st || []).find(([k]) => /^(jour|date)(\s|\(|$)/.test(nz(k).trim()))?.[1] || '';
// « Jour 2 » (ou « Jour 1/12 ») pour une valeur qui n'est qu'un nombre, sinon la valeur telle quelle (« 3 mai »).
export const jourLabel = v => (/^\d+(\s*\/\s*\d+)?$/.test((v = String(v || '').trim())) ? 'Jour ' + v : v);
// Moment de la journée d'un état (champ Moment, Heure ou Période) : aube, soir ou nuit teintent les décors
// (style.css, [data-mo]) ; le jour ou une valeur inconnue, aucune teinte. null : l'état ne dit rien du moment.
export const momentOf = st => {
  const v = (st || []).find(([k]) => /^(moment|heure|periode)/.test(nz(k)))?.[1];
  if (v == null) return null;
  const x = nz(v),
    h = x.match(/(\d{1,2}) ?h/);
  if (h) return +h[1] < 5 || +h[1] >= 21 ? 'nuit' : +h[1] < 8 ? 'aube' : +h[1] >= 18 ? 'soir' : '';
  return /tombee de la nuit|crepuscule|coucher|soir/.test(x)
    ? 'soir'
    : /nuit/.test(x)
      ? 'nuit'
      : /aube|aurore|point du jour|lever/.test(x)
        ? 'aube'
        : '';
};
// Moment connu à la fin de chaque message : le dernier qu'un état a donné.
export const momentsOf = ms => {
  let mo = '';
  return ms.map(m => (mo = momentOf(m.state) ?? mo));
};
// Moment présent : le dernier donné, en remontant depuis la fin.
export const momentNow = ms => momentsOf(ms).at(-1) || '';
// Scènes du récit, dans l'ordre : la première réponse en ouvre une, puis chaque réponse dont le lieu de l'état
// change. at : cette réponse (lettrine) ; from / to : les messages de la scène, la première partant du début ;
// lieu : le premier lieu connu de la scène (vide si l'état n'en donne pas).
export const scenesOf = ms => {
  const out = [];
  let cur = '';
  ms.forEach((m, i) => {
    if (m.role != 'assistant') return;
    const v = lieuOf(m.state),
      l = nz(v);
    if (!out.length || (l && cur && l != cur)) out.push({ at: i, from: out.length ? i : 0, lieu: v });
    else if (v && !out.at(-1).lieu) out.at(-1).lieu = v;
    if (l) cur = l;
  });
  out.forEach((s, k) => (s.to = k + 1 < out.length ? out[k + 1].from - 1 : ms.length - 1));
  return out;
};
// Sommaire par scènes : null si aucune scène n'a de lieu (le Sommaire garde alors la liste des lignes).
export const tocOf = ms => {
  const S = scenesOf(ms);
  if (!S.some(s => s.lieu)) return null;
  return S.map((s, k) => ({
    k,
    lieu: s.lieu,
    from: s.from,
    // Tours : les réponses du récit (une scène commence à la réponse qui change de lieu).
    turns: ms.slice(s.from, s.to + 1).filter(m => m.role == 'assistant').length,
    cur: k == S.length - 1
  }));
};

export const decorFor = (text, D = ctx.decors) => {
  const t = nz(text || '');
  let best = null,
    bl = 0;
  for (const d of D || [])
    for (const r of d.keys) {
      const m = t.match(r);
      if (m && m[0].length > bl) {
        best = d;
        bl = m[0].length;
      }
    }
  return best?.url || ctx.decorDef || '';
};

export const decorsOf = ms => {
  const out = [];
  let lieu = '';
  for (let i = 0; i < ms.length; i++) {
    lieu = lieuOf(ms[i].state) || lieu;
    out.push(
      ms[i].content.includes('{{img::') ? decorFor(lieu || (ms[i - 1]?.content || '') + '\n' + ms[i].content) : ''
    );
  }
  return out;
};

export const decorNow = ms => {
  for (let i = ms.length - 1; i >= 0; i--) {
    const l = lieuOf(ms[i].state);
    if (l) return decorFor(l);
  }
  return decorFor(ms.slice(-2).map(m => m.content).join('\n'));
};

export const SA = 16 / 9;
// Cadrage aux genoux, comme dans un roman visuel : le haut de la silhouette à 3 % du haut de la scène, et
// environ les trois quarts de sa hauteur visibles. Les pieds sortent de l'image, qui se fond par le bas.
export const KNEES = { fill: 1.3, top: 0.03 };
// Cadrage choisi dans les Réglages (Lecture) : en pied (full), ou aux genoux avec la classe kn qui fond le bas.
export const frame = (cls, full = {}) => (S.fullBody ? { ...full, cls } : { ...KNEES, cls: cls + ' kn' });
export const place = (a, { x = 2 / 3, fill = 0.9, top = null, sa = SA } = {}) => {
  const [bx0, bx1, by0, by1] = a.b,
    hp = fill / (by1 - by0),
    iw = hp * a.r,
    m = 0.02 * sa;
  let left = x * sa - ((bx0 + bx1) / 2) * iw;
  if ((bx1 - bx0) * iw > sa - 2 * m) left = sa / 2 - ((bx0 + bx1) / 2) * iw;
  else {
    if (left + bx1 * iw > sa - m) left = sa - m - bx1 * iw;
    if (left + bx0 * iw < m) left = m - bx0 * iw;
  }
  return {
    left: (left / sa) * 100,
    width: (iw / sa) * 100,
    ...(top == null ? { bottom: -(1 - by1) * hp * 100 } : { top: (top - by0 * hp) * 100 })
  };
};

const A = new Map();
const probe = im => {
  const w = Math.min(im.naturalWidth, 200),
    h = Math.max(1, Math.round((im.naturalHeight * w) / im.naturalWidth)),
    c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let edge = 0,
    clear = 0,
    x0 = w,
    x1 = -1,
    y0 = h,
    y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const a = d[(y * w + x) * 4 + 3];
      if (!x || !y || x == w - 1 || y == h - 1) {
        edge++;
        if (a < 16) clear++;
      }
      if (a > 32) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  return clear / edge > 0.5 && x1 >= x0
    ? { r: im.naturalWidth / im.naturalHeight, b: [x0 / w, (x1 + 1) / w, y0 / h, (y1 + 1) / h] }
    : null;
};

const backdrop = d => {
  if (d) return el('div', { class: 'dec' }, el('img', { src: d, alt: '', loading: 'lazy', decoding: 'async' }));
  const h = hue(app.cur?.name || '');
  return el('div', { class: 'dec art v' + (h % 4), style: '--h:' + h });
};

export const scene = (u, d, o = {}) => {
  const im = el('img', { class: 'chr', src: u, alt: '', loading: 'lazy', decoding: 'async' }),
    n = el(
      'div',
      { class: 'scn' + (o.cls ? ' ' + o.cls : ''), data: { u, d: d || '', x: o.x ?? 2 / 3 } },
      backdrop(d),
      im
    );
  const set = a => {
    if (!a) return n.classList.add('flat');
    const p = place(a, o);
    for (const k in p) im.style[k] = p[k] + '%';
    n.classList.add('cut');
  };
  if (A.has(u)) set(A.get(u));
  else {
    im.addEventListener(
      'load',
      () => {
        let a = null;
        try {
          a = probe(im);
        } catch (e) {}
        A.set(u, a);
        set(a);
      },
      { once: true }
    );
    im.addEventListener('error', () => set(null), { once: true });
  }
  return n;
};

export const zoomScene = n => {
  const b = scene(n.dataset.u, n.dataset.d, { x: +n.dataset.x, cls: 'big' }),
    dl = document.querySelector('#dpic');
  dl.querySelector('.scn')?.remove();
  dl.dataset.mo = n.closest('[data-mo]')?.dataset.mo || '';
  document.querySelector('#dpici').hidden = true;
  dl.prepend(b);
  dl.showModal();
};
