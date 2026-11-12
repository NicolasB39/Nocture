import { IMG, S, app, ctx, playerName } from './state.js';
import { rollParts, signed } from './dice.js';
import { decorFor, frame, lieuOf, scene } from './scene.js';
import { el, ic, ikey, JET, nz } from './util.js';

export const CHX = /<choix>[\s\S]*?(?:<\/choix>|$)/gi;
// Bloc d'état jamais fermé : il s'arrête au bloc suivant (<choix>, <jet>) au lieu d'emporter la fin de la réponse.
export const ETX = /<etat>[\s\S]*?(?:<\/etat>|(?=<choix>|<jet>)|$)/gi;
// Annonce du lieu en tête de réponse (protocol.js) : lue pendant l'affichage progressif, jamais affichée ni
// gardée. La suppression s'arrête à la fin de la ligne : une balise mal fermée n'emporte pas la narration.
export const LIX = /<lieu>[^\n]*?(?:<\/lieu>|(?=\n)|$)/gi;
export const lieuTag = t => t.match(/<lieu>([^<\n]{1,80})<\/lieu>/i)?.[1].trim() || '';
// Lieu de l'écran de passage (passage.js) : annoncé en tout début de réponse, donc pendant l'attente du texte
// (une balise plus loin tomberait sur le texte en cours de lecture), et différent du lieu de l'état d'avant
// (prev) comme de celui de la réponse qu'on régénère (old). '' sinon.
export const passageLieu = (t, prev, old) => {
  const l = /^\s*<lieu>/i.test(t) && lieuTag(t);
  return l && nz(l) != nz(lieuOf(prev)) && nz(l) != nz(lieuOf(old)) ? l : '';
};
// Texte de la réponse en cours, sans l'annonce du lieu ni, tant qu'elle s'écrit, sa balise encore incomplète
// tout au début (« <li »). Sur la réponse entière seulement : body() reçoit aussi des morceaux, et doit les
// rendre comme le rendu complet.
export const liveText = v => v.replace(LIX, '').replace(/^\s*<[a-z]{0,4}$/i, '');
export const parseEtat = t => {
  const m = t.match(/<etat>([\s\S]*?)(?:<\/etat>|(?=<choix>|<jet>)|$)/i);
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
        .filter(x => x && !/<\/?jet/i.test(x))
        .slice(0, 3)
    : [];
};
// Choix écrits sans leur balise <choix> (un oubli du modèle, surtout Haiku) : deux ou trois lignes « 1. »,
// « 2. »… tout à la fin du récit, après une ligne vide, chacune commençant comme une action du joueur (geste en
// italique, réplique, « Je »). Rend le récit sans la liste et les choix, ou null : une liste du récit (lettre,
// inventaire) ne ressemble pas à cela.
export const looseChoices = t => {
  const ls = t.trimEnd().split('\n'),
    n = [],
    c = [];
  for (let i = ls.length - 1; i >= 0; i--) {
    const m = ls[i].match(/^\s*([1-3])[.)]\s+(\S.*)$/);
    if (!m) break;
    n.unshift(+m[1]);
    c.unshift(m[2].trim());
  }
  if (c.length < 2 || c.length > 3 || n.some((x, k) => x != k + 1) || c.some(x => !/^(\*|«|"|je\b|j['’])/i.test(x)))
    return null;
  const before = ls.slice(0, ls.length - c.length);
  if (before.length && before.at(-1).trim()) return null;
  return { content: before.join('\n').trim(), choices: c };
};
// Choix recopiés en fin de récit alors que le bloc <choix> les donne aussi : la liste numérotée qui les répète est
// retirée du texte, avec sa ligne d'annonce (« Vos options : »), pour ne pas les afficher deux fois. Une ligne de la
// liste compte si elle reprend le début d'un choix, ou si elle a la forme d'une action du joueur (« Je », « J' »,
// guillemets) ; il en faut au moins deux, pas plus que de choix plus un, et au moins une qui reprend un choix ou
// commence par « Je » : une liste d'inscriptions entre guillemets (« 1. « Ne pas entrer » ») reste.
const ck = t => nz(t).replace(/[^a-z0-9]+/g, '').slice(0, 16);
export const dropDup = (t, choices) => {
  const ls = t.trimEnd().split('\n'),
    K = choices.map(ck);
  let i = ls.length,
    n = 0,
    h = 0;
  while (i > 0) {
    const l = ls[i - 1];
    if (!l.trim()) {
      i--;
      continue;
    }
    const m = l.match(/^\s*[-*]?\s*\**\d[.)]\**\s+(\S.*)$/),
      hit = m && K.includes(ck(m[1]));
    if (!m || !(hit || /^[*_]*(«|"|je\b|j['’])/i.test(m[1]))) break;
    n++;
    h += hit || /^[*_]*(je|j['’])/i.test(m[1]) ? 1 : 0;
    i--;
  }
  if (n < 2 || !h || n > choices.length + 1) return t;
  if (i > 0 && /:\s*[*_]*$/.test(ls[i - 1]) && ls[i - 1].trim().length < 60) i--;
  return ls.slice(0, i).join('\n').trim();
};
// Marque du journal des appels : ce que la réponse du narrateur a fait de ses choix (bloc <choix> seul, recopiés
// aussi dans le récit, écrits sans balise puis rattrapés, ou absents).
export const choiceMark = raw => {
  const c = choicesOf(raw),
    b = raw.replace(CHX, '').replace(ETX, '').replace(LIX, '').trim();
  return c.length ? (dropDup(b, c) != b ? 'recopiés' : 'présents') : looseChoices(b) ? 'rattrapés' : 'absents';
};
// loose : rattraper les choix écrits sans balise (looseChoices), seulement dans une histoire à choix.
export const split = (raw, loose = true) => {
  // Demande de jet écrite dans le bloc <choix> : remise en fin de récit, où elle a son bouton.
  const inner = (raw.match(CHX) || []).join('').match(JET) || [],
    o = { content: [raw.replace(CHX, '').replace(ETX, '').replace(LIX, '').trim(), ...inner].join('\n\n').trim() },
    c = choicesOf(raw),
    s = parseEtat(raw);
  if (c.length) Object.assign(o, { choices: c, content: dropDup(o.content, c) });
  else if (loose) Object.assign(o, looseChoices(o.content));
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
// Cadrage des personnages détourés : aux genoux par défaut, en pied si les Réglages le demandent (Lecture).
const imgNode = (c, d) => {
  const u = imgFor(c);
  return u
    ? scene(u, d ?? decorFor(''), frame('pic'))
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
  return /<(choix|etat|jet)/i.test(p) || p.split('{{').length !== p.split('}}').length ? from : j;
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
// Carte d'un jet (dice.js) dans le message du joueur : le d20 et son bonus en pastille, puis l'issue et le total
// face au seuil (« Réussite · 18 / 13 »). Une demande de jet du narrateur n'affiche rien ici : le bouton
// « Lancer » est sous la conversation.
const rollCard = x => {
  const p = rollParts(x);
  if (!p) return null;
  return el(
    'div',
    { class: 'roll' + (p.ko ? ' ko' : '') + (p.crit ? ' crit' : '') },
    el(
      'span',
      { class: 'rd', 'aria-hidden': 'true' },
      ic('d20', 44),
      el('b', { text: String(p.n) }),
      p.b ? el('i', { class: 'rb', text: signed(p.b) }) : null
    ),
    el(
      'span',
      { class: 'rt' },
      el('span', { class: 'sr', text: 'Dé ' + p.n + ', bonus ' + signed(p.b) + '. ' }),
      el('span', null, el('b', { text: p.r[0].toUpperCase() + p.r.slice(1) }), ' · ' + p.tot + ' / ' + p.dc),
      el('small', { text: p.what })
    )
  );
};
// user : message du joueur, le seul où un résultat de jet devient une carte (un résultat écrit par le
// narrateur est ignoré). Pendant l'écriture, une balise <jet> pas encore fermée (« <jet>Adresse</je ») ou
// son début (« <je ») disparaît jusqu'au morceau suivant.
export const body = (t, d, user) => {
  const out = [];
  t.replace(CHX, '')
    .replace(ETX, '')
    .replace(LIX, '')
    .replace(/<jet>[^<]*(?:<\/?j?e?t?)?$/i, '')
    .replace(/<j?e?t?$/i, '')
    .split(JET)
    .forEach((s, j) =>
      j % 2
        ? user && out.push(rollCard(s))
        : s
            .replace(/\{\{user\}\}/gi, playerName(app.cur) || 'Joueur')
            .replace(/\s*\{\{[^}]*$/, '')
            .split(/\{\{img::([^}]*)\}\}/g)
            .forEach((x, i) => (i % 2 ? out.push(imgNode(x, d)) : blocks(x.replace(/^\n+|\n+$/g, ''), out)))
    );
  return out.filter(Boolean);
};
