import { IMG, app, ctx, playerName } from './state.js';
import { KNEES, decorFor, scene } from './scene.js';
import { el, ikey } from './util.js';

export const CHX = /<choix>[\s\S]*?(?:<\/choix>|$)/gi;
export const ETX = /<etat>[\s\S]*?(?:<\/etat>|$)/gi;
// Annonce du lieu en tête de réponse (protocol.js) : lue pendant l'affichage progressif, jamais affichée ni
// gardée. La suppression s'arrête à la fin de la ligne : une balise mal fermée n'emporte pas la narration.
export const LIX = /<lieu>[^\n]*?(?:<\/lieu>|(?=\n)|$)/gi;
export const lieuTag = t => t.match(/<lieu>([^<\n]{1,80})<\/lieu>/i)?.[1].trim() || '';
// Texte de la réponse en cours, sans l'annonce du lieu ni, tant qu'elle s'écrit, sa balise encore incomplète
// tout au début (« <li »). Sur la réponse entière seulement : body() reçoit aussi des morceaux, et doit les
// rendre comme le rendu complet.
export const liveText = v => v.replace(LIX, '').replace(/^\s*<[a-z]{0,4}$/i, '');
export const parseEtat = t => {
  const m = t.match(/<etat>([\s\S]*?)<\/etat>/i);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(l => {
      const x = l.replace(/^[\s\-*•]+/, '').replace(/\*\*/g, ''),
        i = x.indexOf(':');
      return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : null;
    })
    .filter(e => e && e[0] && e[1])
    .slice(0, 12);
};
export const choicesOf = t => {
  const m = t.match(/<choix>([\s\S]*?)<\/choix>/i);
  return m
    ? m[1]
        .split('\n')
        .map(x => x.replace(/^\s*(\d+[.)]|[-*])\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
};
export const split = raw => {
  const o = { content: raw.replace(CHX, '').replace(ETX, '').replace(LIX, '').trim() },
    c = choicesOf(raw),
    s = parseEtat(raw);
  if (c.length) o.choices = c;
  if (s.length) o.state = s;
  return o;
};
export const raw = m =>
  m.content +
  (m.state?.length ? '\n\n<etat>\n' + m.state.map(([k, v]) => k + ': ' + v).join('\n') + '\n</etat>' : '') +
  (m.choices?.length
    ? '\n\n<choix>\n' + m.choices.map((c, i) => i + 1 + '. ' + c).join('\n') + '\n</choix>'
    : '');
// Introduction d'un scénario (intro.md, ou champ du scénario local) : le texte d'accroche, et jusqu'à trois
// débuts proposés, un par ligne commençant par « - » ou « 1. ».
export const parseIntro = t => {
  const starts = [],
    rest = [];
  for (const l of String(t || '').split('\n')) {
    const m = l.match(/^\s*(?:[-•]|\d+[.)])\s+(.+)$/);
    if (m && starts.length < 3) starts.push(m[1].trim());
    else if (!m) rest.push(l);
  }
  return { pitch: rest.join('\n').trim(), starts };
};
// Dernier état donné par le narrateur avant le message before (par défaut : sur tout l'historique).
export const lastEtat = (ms, before = ms.length) => {
  for (let i = before - 1; i >= 0; i--)
    if (ms[i].role == 'assistant' && ms[i].state?.length) return ms[i].state;
  return null;
};
// Remplace le texte, les choix et l'état d'un message par ceux de p (split, ou une variante).
export const setBody = (m, p) => {
  m.content = p.content;
  delete m.choices;
  delete m.state;
  if (p.choices) m.choices = p.choices;
  if (p.state) m.state = p.state;
};
const imgFor = c => {
  c = c.trim();
  const k = ikey(c);
  if (IMG[c.toLowerCase()] || IMG[k]) return IMG[c.toLowerCase()] || IMG[k];
  const m = ctx.images.filter(i => ikey(i.code).endsWith('_' + k));
  return m.length == 1 ? m[0].url : '';
};
// Cadrage des personnages détourés : aux genoux par défaut, en pied si le scénario le demande.
const imgNode = (c, d) => {
  const u = imgFor(c);
  return u
    ? scene(u, d ?? decorFor(''), app.cur?.fullBody ? { cls: 'pic' } : { cls: 'pic kn', ...KNEES })
    : el('span', { class: 'miss', text: 'image introuvable : ' + c.trim() });
};
// Typographie française, à l'affichage seulement (le texte enregistré et envoyé ne change pas) : apostrophes
// courbes, guillemets « », tirets de dialogue, points de suspension, espaces insécables avant ; ! ? : et dans
// les guillemets. Chaque règle ne regarde que les caractères voisins : un paragraphe s'affiche pareil pendant
// le streaming et une fois complet.
const NB = '\u00a0',
  FN = '\u202f';
export const fr = s =>
  s
    .replace(/(\p{L})'(?=\p{L})/gu, '$1’')
    .replace(/(^|[\s(\[—–*])"[ \t]*/gmu, '$1«' + NB)
    .replace(/[ \t]*"/g, NB + '»')
    .replace(/«[ \t]+/g, '«' + NB)
    .replace(/[ \t]+»/g, NB + '»')
    .replace(/^(\s*)--? (?=\S)/gm, '$1— ')
    .replace(/ -- /g, ' — ')
    .replace(/\.\.\./g, '…')
    .replace(/([^\s;!?(«\u00a0\u202f])[ \t]?([;!?]+)(?=[\s»)\]*_.,:…’'"]|$)/gu, '$1' + FN + '$2')
    .replace(/([^\s\d:\/(«\u00a0\u202f])[ \t]?:(?=\s|$)/gu, '$1' + NB + ':');
const INL = /\*\*([^*]+?)\*\*|\*([^*]+?)\*|(^|[\s(])_([^_\n]+?)_(?=$|[\s.,;:!?)])/g;
const inline = (s, out) => {
  let i = 0,
    m;
  INL.lastIndex = 0;
  while ((m = INL.exec(s))) {
    if (m.index > i) out.push(s.slice(i, m.index));
    if (m[1] != null) out.push(el('b', { text: m[1] }));
    else if (m[2] != null) out.push(el('span', { class: 'act', text: m[2] }));
    else {
      if (m[3]) out.push(m[3]);
      out.push(el('span', { class: 'act', text: m[4] }));
    }
    i = INL.lastIndex;
  }
  if (i < s.length) out.push(s.slice(i));
};
const blocks = (s, out) => {
  let buf = [],
    q = false;
  const flush = () => {
    const t = buf.join('\n'),
      k = q;
    buf = [];
    q = false;
    if (!t.trim()) return;
    const c = [];
    inline(fr(t), c);
    out.push(el('p', k ? { class: 'q' } : null, c));
  };
  for (const ln of s.split('\n')) {
    if (/^-{3,}$/.test(ln)) {
      flush();
      out.push(el('hr'));
    } else if (/^> ?/.test(ln)) {
      if (!q) flush();
      q = true;
      buf.push(ln.replace(/^> ?/, ''));
    } else if (!ln.trim()) {
      flush();
    } else {
      if (q) flush();
      buf.push(ln);
    }
  }
  flush();
};
export const line = t => {
  const out = [];
  inline(fr(t), out);
  return out;
};
export const settled = (v, from = 0) => {
  const j = v.lastIndexOf('\n\n');
  if (j <= from) return from;
  const p = v.slice(from, j);
  return /<(choix|etat)/i.test(p) || p.split('{{').length !== p.split('}}').length ? from : j;
};
export const keepImgs = (from, to) => {
  const pool = {};
  for (const i of from.querySelectorAll('img.chr, .dec img')) (pool[i.src] ??= []).push(i);
  for (const i of to.querySelectorAll('img.chr, .dec img')) {
    const o = pool[i.src]?.shift();
    if (o) i.replaceWith(o);
  }
};
export const paintLive = (b, v, z, ph, d) => {
  if (!v || v.slice(0, z.fl) !== z.ft) Object.assign(z, { fl: 0, fn: 0, ft: '' });
  const old = el('div', null, [...b.childNodes].slice(z.fn));
  if (v) {
    const k = settled(v, z.fl);
    if (k > z.fl) {
      const fz = el('div', null, body(v.slice(z.fl, k), d));
      keepImgs(old, fz);
      b.append(...fz.childNodes);
      Object.assign(z, { fl: k, fn: b.childNodes.length, ft: v.slice(0, k) });
    }
  }
  const box = el('div', null, v ? body(v.slice(z.fl), d) : ph);
  keepImgs(old, box);
  b.append(...box.childNodes);
};
export const body = (t, d) => {
  const out = [];
  t.replace(CHX, '')
    .replace(ETX, '')
    .replace(LIX, '')
    .replace(/\{\{user\}\}/gi, playerName(app.cur) || 'Joueur')
    .replace(/\s*\{\{[^}]*$/, '')
    .split(/\{\{img::([^}]*)\}\}/g)
    .forEach((x, i) => (i % 2 ? out.push(imgNode(x, d)) : blocks(x.replace(/^\n+|\n+$/g, ''), out)));
  return out;
};
