import { SUM_PLAY, summing } from './ai.js';
import { SUM_KEEP } from './memory.js';
import { invOf, invOn, invText, linkText, linksOf, linksOn } from './modes.js';
import { on } from './bus.js';
import { face } from './cast.js';
import { money } from './cost.js';
import { askOf, chance, checkOf, rerollOf, rulesOf, sheetOf, signed } from './dice.js';
import { body, fr, lastEtat, line, parseIntro } from './format.js';
import { buildInfo, inScene, statOn } from './prompt.js';
import { recapCheck } from './recap.js';
import { coverOf } from './scenarios.js';
import {
  dayKey,
  decorFor,
  decorsOf,
  head,
  heureOf,
  isGoal,
  isWorse,
  isHeure,
  isJour,
  isLieu,
  dayLabel,
  lieuOf,
  momentsOf,
  scenesOf
} from './scene.js';
import { app, ctx, playerName, S } from './state.js';
import { $, el, ic, LS, msgEl, nfr, smooth } from './util.js';

// Affichage de la conversation : messages, panneau d'état, scènes, compteurs, en-tête, navigation.
let IO = null,
  IK = '',
  IV = null;
export const infoOf = () => {
  const s = app.cur,
    m = s.mem,
    l = s.messages.at(-1),
    k = [
      s.updated,
      s.messages.length,
      l?.role,
      l?.content.length,
      m.upto,
      m.summary.length,
      m.memories.length,
      m.chapters?.length,
      m.lines?.length,
      Object.keys(m.relations || {}).length,
      S.pre?.length,
      S.pname,
      (ctx.chars || []).length,
      (ctx.lore || []).length
    ].join('|');
  if (IO !== s || IK !== k) {
    IO = s;
    IK = k;
    IV = buildInfo(s);
  }
  return IV;
};
// Compteurs sous la conversation. Masqués, le prompt n'est pas reconstruit (recherche des passages anciens
// comprise).
export function tk() {
  const e = $('#tk');
  if (!app.cur || !S.counters) {
    e.textContent = '';
    e.hidden = true;
    return;
  }
  const r = infoOf(),
    n = app.cur.messages.length,
    sentN = Math.max(0, n - r.win),
    k = x => (x < 1000 ? nfr(x) : (x / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' k');
  e.className = e.classList.contains('open') ? 'open' : '';
  // Pastille courte (tokens et coût du dernier tour) ; le détail s'ouvre en la touchant.
  // Compteurs réels du dernier envoi : seulement s'il venait de cette histoire.
  const t = app.turn?.id == app.cur.id ? app.turn : null,
    c = t?.cost ?? null,
    [pt = 0, , , , cr = 0, w5 = 0, w1 = 0] = t?.e || [],
    long =
      '≈ ' +
      nfr(r.used) +
      ' tokens envoyés' +
      (pt ? ' (réel : ' + nfr(pt) + ')' : '') +
      (cr ? ' · ' + nfr(cr) + ' lus en cache' : '') +
      (w5 + w1 ? ' · ' + nfr(w5 + w1) + ' mis en cache' : '') +
      (n ? ' · ' + sentN + (sentN > 1 ? ' messages envoyés' : ' message envoyé') + ' sur ' + n : '');
  e.replaceChildren(
    el(
      'button',
      { class: 'tks', 'aria-expanded': String(e.classList.contains('open')) },
      '≈ ' + k(pt || r.used) + ' tokens' + (c != null ? ' · ' + money(c, S.fx) + ' ce tour' : '')
    ),
    el('button', { class: 'tkl', 'aria-expanded': String(e.classList.contains('open')), text: long })
  );
  e.hidden = false;
}
const act = (i, m, last) => {
  const r = el('div', { class: 'a' });
  if (last && m.alts?.length > 1)
    r.append(
      el('button', { data: { a: 'p' }, 'aria-label': 'Variante précédente' }, ic('chevl', 18)),
      el('span', { class: 'n', text: m.ai + 1 + '/' + m.alts.length }),
      el('button', { data: { a: 'n' }, 'aria-label': 'Variante suivante' }, ic('chevr', 18))
    );
  const b = (a, lbl, icon) =>
    el('button', { data: { a, i }, 'aria-label': lbl }, ic(icon, 17));
  if (last) {
    const rg = b('r', 'Régénérer', 'refresh');
    rg.title = 'Régénérer · appui long ou clic droit : avec une indication';
    r.append(rg);
    if (m.role == 'assistant') r.append(b('k', 'Continuer', 'chevsr'));
  }
  r.append(b('m', 'Autres actions', 'more'));
  return r;
};
// Nombre en tête d'une valeur (« 1 200 or » : 1200) et ce qui le suit (u) : une variation n'est montrée qu'entre
// deux valeurs de même suite (« 9h » et « 14h30 » ne se comparent pas).
const numOf = v => {
  const m = String(v)
    .replace(/(\d)[\s\u00a0\u202f](?=\d{3}(?!\d))/g, '$1')
    .match(/^(-?\d+(?:[.,]\d+)?)(.*)$/);
  return m ? { n: +m[1].replace(',', '.'), u: m[2].trim() } : null;
};
const sig = st => (st || []).map(x => x[0] + '=' + x[1]).join('|');
// Valeurs de l'état du message i, avec leur variation depuis l'état précédent. c : valeur nouvelle ou changée
// (rien au premier état) ; p : remplissage de la jauge (valeur « 40/100 », maximum non nul), p0 : le même avant
// le changement.
const pctOf = v => {
  const r = String(v).match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/),
    max = r && +r[2].replace(',', '.');
  return max ? Math.max(0, Math.min(100, (+r[1].replace(',', '.') / max) * 100)) : null;
};
const stRows = (i, m) => {
  const pm = new Map(lastEtat(app.cur.messages, i) || []);
  return m.state.map(([k, v]) => {
    const a = numOf(v),
      b = pm.has(k) ? numOf(pm.get(k)) : null,
      d = a && b && a.u == b.u && a.n !== b.n ? a.n - b.n : null;
    const p = pctOf(v),
      w = isWorse(k);
    return { k, v, d, c: pm.size > 0 && pm.get(k) !== v, p, p0: pctOf(pm.get(k)), w, lo: p != null && (w ? p > 100 - LOW : p < LOW) };
  });
};
// Une variation est mauvaise quand la valeur baisse, ou monte pour une valeur comme Stress ou Faim (isWorse).
const bad = r => (r.w ? r.d > 0 : r.d < 0);
// Attributs d'une valeur changée : sa variation, qui s'envole quand la réponse arrive (render, app.fresh), en
// rouge si elle est mauvaise.
const chg = (r, cls) => ({
  class: cls + (r.c ? ' nv' + (bad(r) ? ' dn' : '') : ''),
  data: r.d != null ? { d: signed((Math.sign(r.d) * Math.round(Math.abs(r.d) * 100)) / 100) } : null
});
// Variation affichée : la flèche suit le sens, la couleur dit si c'est une bonne ou une mauvaise nouvelle.
const dl = (r, short) =>
  r.d != null &&
  el('em', {
    class: 'dl ' + (bad(r) ? 'dn' : 'up'),
    text: (r.d > 0 ? (short ? '▲' : '▲ +') : short ? '▼' : '▼ ') + Math.round(Math.abs(r.d) * 100) / 100
  });
// Grille détaillée : une case par valeur, une tuile à jauge (stTile) pour les valeurs « 40/100 ».
const stGrid = rows =>
  el(
    'div',
    { class: 'stg' },
    rows.map(r =>
      r.p != null ? stTile(r) : el('div', chg(r, 'kv'), el('span', { text: r.k }), el('b', null, r.v, dl(r)))
    )
  );
// Ligne « Clé : valeur » (carte dépliée).
const cxLine = r => el('p', chg(r, 'cxl'), el('b', { text: r.k + ' :' }), ' ' + r.v, dl(r));
// Carte sous la réponse, jamais avec ce que l'en-tête montre déjà (lieu, jour, heure). Repliée : les jauges
// (« 40/100 » : vie, mana, énergie…) toujours, le reste seulement s'il a changé depuis l'état précédent (tout, au
// premier état), en pastilles sur deux colonnes (un texte, sur toute la largeur) ; puis les objets gagnés ou perdus
// et les liens changés par la réponse ; puis les objectifs (Objectif, Quête, Mission, But), un encart doré chacun,
// sur deux lignes au plus. Dépliée : tout l'état (jauges en tuiles, valeurs en lignes, objectifs en entier) ;
// l'inventaire complet est dans sa feuille (inv.js). Le choix plié / déplié vaut pour toute l'appli (chat.js). Une
// jauge sous LOW % passe au rouge (« Bas ») ; une jauge où monter est mauvais (Stress, Faim…), au-dessus de
// 100 − LOW % (« Haut »).
const LOW = 30;
const gauge = (r, p, cls) =>
  el('i', { class: 'bar ' + cls }, el('u', { style: 'width:' + p + '%;--p0:' + (r.p0 ?? p) + '%' }));
const stPill = r =>
  el(
    'span',
    chg(r, 'stp' + (r.p != null ? (r.lo ? ' low' : '') : numOf(r.v) ? '' : ' wide')),
    el('span', { class: 'stk', text: r.k }),
    el('b', { text: r.p != null ? String(r.v).split('/')[0].trim() : r.v }),
    r.p != null && gauge(r, r.p, 'mini'),
    dl(r, true)
  );
const stTile = r => {
  const [n, max] = String(r.v).split('/');
  return el(
    'div',
    chg(r, 'stt' + (r.lo ? ' low' : '')),
    el('span', { class: 'stk' }, r.k, r.lo && el('em', { class: 'stw', text: r.w ? 'Haut' : 'Bas' })),
    el('b', null, n.trim(), el('small', { text: '/' + max.trim() }), dl(r)),
    gauge(r, r.p, '')
  );
};
// Encart d'un objectif : sa valeur telle quelle, sur deux lignes au plus (replié) ou en entier (déplié).
const stGoal = (r, open) => el('span', chg(r, 'sgo'), ic('target', 14), el('span', { class: open ? 'sgt' : 'sgl', text: r.v }));
// Changements d'inventaire et de liens de chaque réponse (modes.js), en un passage par rendu (sceneStarts) : ic et
// lc, ceux que l'application a appliqués (pas une dépense impossible ni un nom sans fiche). MK : ce dont dépend la
// carte hors du message lui-même (ces changements et l'état précédent), dans la clé de chaque message (keyOf) pour
// qu'un changement plus haut reconstruise la suite.
let MODES = [],
  MK = [];
const modesAll = ms => {
  const R = ms.map(() => ({ ic: [], lc: [] }));
  if (invOn(app.cur)) for (const c of invOf(ms).log) R[c.i].ic.push(c);
  if (linksOn(app.cur)) for (const c of linksOf(ms).log) R[c.i].lc.push(c);
  return R;
};
const modesOf = i => MODES[i] || { ic: [], lc: [] };
const stChip = (c, n) =>
  el('span', { class: 'stq' }, ic(n, 12), el('span', { text: n == 'bag' ? invText([[c.k, c.d]]) : linkText([[c.k, c.d]]) }));
const stCard = (i, m) => {
  if (!m.state?.length || !statOn(app.cur)) return null;
  const hid = shownOf(m.state),
    first = !lastEtat(app.cur.messages, i),
    // Un objectif sans lettre ni chiffre (« — », « ; ») n'a rien à montrer.
    all = stRows(i, m).filter(r => !hid.has(r.k) && (!isGoal(r.k) || /[\p{L}\p{N}]/u.test(r.v))),
    allGoals = all.filter(r => isGoal(r.k)),
    allVals = all.filter(r => !isGoal(r.k)),
    gs = allVals.filter(r => r.p != null),
    // Repliée : les jauges toujours, le reste s'il a changé (tout au premier état).
    seen = r => first || r.c || r.p != null,
    goals = allGoals.filter(seen),
    vals = allVals.filter(seen),
    { ic: icg, lc } = modesOf(i),
    chips = [...icg.map(c => stChip(c, 'bag')), ...lc.map(c => stChip(c, 'heart'))],
    open = LS.get('stOpen') == '1';
  if (!vals.length && !goals.length && !chips.length) return null;
  return el(
    'div',
    { class: 'st' + (open ? ' open' : '') },
    el(
      'button',
      { class: 'stc', 'aria-expanded': String(open) },
      vals.length > 0 && el('span', { class: 'sts' }, vals.map(stPill)),
      chips.length > 0 && el('span', { class: 'sgc' }, chips),
      goals.map(r => stGoal(r, false)),
      ic('chevd', 14)
    ),
    el(
      'div',
      { class: 'stx' },
      el('button', { class: 'stl', 'aria-expanded': String(open) }, 'État', ic('chevd', 14)),
      gs.length > 0 && stGrid(gs),
      allVals.filter(r => r.p == null).map(cxLine),
      allGoals.map(r => stGoal(r, true))
    )
  );
};
// Débuts de scène (scenesOf, scene.js), ornés d'une lettrine et d'un intertitre.
let LT = new Set(),
  MOM = [],
  SC = [];
const sceneStarts = ms => {
  SC = scenesOf(ms);
  MOM = momentsOf(ms);
  MODES = modesAll(ms);
  let ps = '';
  MK = MODES.map((x, i) => {
    const k = (x.ic.length || x.lc.length ? JSON.stringify(x) : '') + '|' + ps;
    if (ms[i].role == 'assistant' && ms[i].state?.length) ps = sig(ms[i].state);
    return k;
  });
  return new Set(SC.map(s => s.at));
};
// Intertitres de lieu : avant la réponse qui change de lieu ; la première scène s'annonce en tête du récit.
// ST : premier message affiché. live : l'indice de la réponse en cours, tenue par #live.
let ST = 0;
const titles = (sc, live = -1) => {
  const w = $('#msgs');
  for (const e of w.querySelectorAll(':scope > .scene')) e.remove();
  for (const s of sc) {
    if (s.from < ST || !s.lieu) continue;
    const i = s.from ? s.at : 0;
    (i == live ? $('#live') : msgEl(i))?.before(
      el('div', { class: 'scene', text: fr(s.lieu) })
    );
  }
};
// Lieu annoncé en tête de la réponse en cours (<lieu>, protocol.js) : intertitre, lettrine et en-tête prennent
// tout de suite la place que leur donnera le rendu final. Rend le décor du lieu, pour les images de la réponse.
// LIVE le retient pour qu'un render() pendant l'écriture (messages précédents, saut, réglages) le remette ;
// liveEnd() l'oublie avant le rendu final.
let LIVE = null;
export function liveScene(lieu) {
  LIVE = { id: app.cur.id, lieu };
  return liveApply(true);
}
export const liveEnd = () => (LIVE = null);
const liveApply = fade => {
  const ms = app.cur.messages,
    n = ms.length,
    sc = scenesOf([...ms, { role: 'assistant', content: '', state: [['Lieu', LIVE.lieu]] }]);
  titles(sc, n);
  const lv = $('#live');
  lv?.classList.toggle('lt', sc.some(s => s.at == n));
  const t = lv?.previousElementSibling;
  if (fade && t?.matches('.scene')) t.classList.add('in');
  return decorFor(LIVE.lieu);
};
// Chance de réussite d'un jet avec la fiche de l'histoire ouverte (dice.js).
const pct = k => chance(k, sheetOf(app.cur));
// Bouton au dé sous le dernier message (lancer, relancer, fiche) : son libellé et une précision en petit.
const rla = (cls, data, label, small) =>
  el('button', { class: cls, data }, ic('dice', 18), el('span', null, label, el('small', { text: ' ' + small })));
// Pour un lecteur d'écran, le bouton d'un choix dit aussi la chance de réussite.
const chAria = (c, R) => {
  const k = checkOf(c, R);
  return k ? ', ' + pct(k) + ' % de réussite' : '';
};
// Texte d'un choix : sa marque de jet « (Adresse, difficile) » devient une étiquette, avec la chance de réussite
// (en rouge sous 35 %).
const chText = (c, R) => {
  const k = checkOf(c, R),
    p = k && pct(k);
  return k ? [line(k.text), el('span', { class: 'jt' + (p < 35 ? ' ko' : '') }, ic('dice', 13), k.k + ' · ' + k.d + ' · ' + p + ' %')] : line(c);
};
// Sans carte d'état (panneau d'état éteint, ou réponse sans état) : les changements d'inventaire et de liens en
// une ligne discrète.
const modeLine = i => {
  const { ic: a, lc: b } = modesOf(i),
    t = [a.length && 'Inventaire : ' + invText(a.map(c => [c.k, c.d])), b.length && 'Liens : ' + linkText(b.map(c => [c.k, c.d]))]
      .filter(Boolean)
      .join(' · ');
  return t ? el('p', { class: 'chg' }, t) : null;
};
const msgNode = (i, m, last, d = '') => {
  const t = LT.has(i),
    b = el('div', { class: 'b' }, body(m.content, d, m.role == 'user'));
  const n = el(
    'div',
    // mo : moment de la journée, qui teinte les décors du message (style.css, [data-mo]).
    { class: 'm ' + m.role + (last ? ' last' : '') + (t ? ' lt' : ''), data: { i, mo: MOM[i] || '' } },
    el('span', { class: 'sr', text: (m.role == 'user' ? 'Joueur' : 'Récit') + ' :' }),
    b,
    stCard(i, m) || modeLine(i),
    act(i, m, last)
  );
  n._k = keyOf(m, last, d, t, MOM[i], MK[i]);
  return n;
};
// Tout ce dont dépend le rendu d'un message : panneau d'état affiché ou non, index des images (ctx.iv,
// changé par « Recharger l'index ») pour qu'une image ajoutée remplace son repère « image introuvable », et
// nom du joueur (qui remplace {{user}}).
const keyOf = (m, l, d, t, mo, mk) => ({
  mo,
  mk,
  c: m.content,
  a: m.ai,
  l,
  n: m.alts?.length || 0,
  s: sig(m.state),
  v: JSON.stringify([m.inv, m.links]),
  d,
  t,
  o: statOn(app.cur),
  g: ctx.iv,
  u: playerName(app.cur)
});
// Toutes les valeurs de keyOf, sans liste à tenir à jour : une clé ajoutée est comparée d'office.
const same = (a, b) => a && Object.keys(b).every(k => a[k] === b[k]);
const dayOf = t => new Date(t).toDateString();
const cut6h = (t, p) => dayOf(t) !== dayOf(p) || t - p > 216e5;
const dayLab = (t, p) => {
  const d = new Date(t);
  if (dayOf(t) === dayOf(p))
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (dayOf(t) === dayOf(Date.now())) return "aujourd'hui";
  if (dayOf(t) === dayOf(Date.now() - 864e5)) return 'hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
export function jump(i) {
  if (!app.cur) return;
  while (app.cur.messages.length - app.LIM > i) app.LIM += 50;
  render();
  const e = msgEl(i);
  if (!e) return;
  // Le début du message en haut : une réponse est souvent plus haute que l'écran.
  e.scrollIntoView({ block: 'start', behavior: smooth() });
  e.classList.add('flash');
  setTimeout(() => e.classList.remove('flash'), 1600);
}
export function render(sc) {
  const w = $('#msgs'),
    head = $('#mhead'),
    foot = $('#mfoot'),
    ms = app.cur.messages,
    n = ms.length,
    st = Math.max(0, n - app.LIM);
  const D = decorsOf(ms);
  LT = sceneStarts(ms);
  const cv = !st && coverOf(app.cur);
  head.replaceChildren(
    ...[
      cv && el('img', { class: 'cover', src: cv, alt: '', loading: 'lazy', decoding: 'async' }),
      st && el('button', { class: 'more', text: 'Afficher les messages précédents' })
    ].filter(Boolean)
  );
  let cur = [...w.querySelectorAll(':scope > .m[data-i]')];
  for (const e of cur) {
    const i = +e.dataset.i;
    if (i < st || i >= n) e.remove();
  }
  cur = [...w.querySelectorAll(':scope > .m[data-i]')];
  if (cur.length && +cur[0].dataset.i > st) {
    const f = document.createDocumentFragment();
    for (let i = st; i < +cur[0].dataset.i; i++) f.append(msgNode(i, ms[i], false, D[i]));
    cur[0].before(f);
  }
  cur = [...w.querySelectorAll(':scope > .m[data-i]')];
  const fresh = [];
  for (const e of cur) {
    const i = +e.dataset.i,
      k = keyOf(ms[i], i == n - 1, D[i], LT.has(i), MOM[i], MK[i]);
    if (!same(e._k, k)) {
      const x = msgNode(i, ms[i], k.l, D[i]);
      e.replaceWith(x);
      fresh.push(x);
    }
  }
  const from = cur.length ? +cur.at(-1).dataset.i + 1 : st;
  const f = document.createDocumentFragment();
  for (let i = from; i < n; i++) {
    const x = msgNode(i, ms[i], i == n - 1, D[i]);
    fresh.push(x);
    f.append(x);
  }
  foot.before(f);
  // Les trois derniers messages sont ceux qu'on voit en ouvrant l'histoire : leurs images (décor, personnage) se
  // chargent tout de suite, les plus anciennes à l'approche de l'écran.
  for (const x of [...w.querySelectorAll(':scope > .m[data-i]')].slice(-3))
    for (const img of x.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
  for (const e of w.querySelectorAll(':scope > .day')) e.remove();
  let pt = 0;
  for (let i = st; i < n; i++) {
    const t = ms[i].t;
    if (!t) continue;
    if (pt && cut6h(t, pt))
      msgEl(i)?.before(
        el('div', { class: 'day', text: dayLab(t, pt) })
      );
    pt = t;
  }
  ST = st;
  titles(SC);
  const lm = ms.at(-1),
    cs = lm?.role == 'assistant' && !app.cur.noChoices ? lm.choices || [] : [];
  if (LIVE?.id == app.cur.id && $('#live')) liveApply();
  const R = rulesOf(app.cur),
    rq = lm?.role == 'assistant' && askOf(lm.content, R),
    // Jet raté du dernier tour, relançable une fois par jour de fiction (chat.js, reroll). Pas pendant une réponse.
    rr = R.length && !LIVE && rerollOf(ms, dayKey);
  const pr = inScene(ms.slice(-6));
  castView(pr);
  sideView(pr);
  ctxView();
  const chList = list =>
    el(
      'div',
      { class: 'ch' },
      list.map((c, k) =>
        el(
          'div',
          { class: 'chr' },
          el(
            'button',
            { class: 'cht', data: { t: c }, 'aria-label': 'Envoyer : ' + c.replace(/\*/g, '') + chAria(c, R) },
            el('span', { class: 'chn', 'aria-hidden': 'true', text: k + 1 }),
            el('span', { class: 'chx' }, chText(c, R))
          ),
          el(
            'button',
            { class: 'che', 'aria-label': 'Modifier avant d’envoyer : ' + c.replace(/\*/g, '') },
            ic('edit', 17)
          )
        )
      )
    );
  // Histoire vide : titre, accroche et débuts proposés de l'introduction, sous la couverture.
  const it = !n && parseIntro(app.cur.remote ? ctx.intro : app.cur.intro);
  foot.replaceChildren(
    ...[
      rr && rla('rla rr', null, 'Relancer le dé', rr.k + ' · ' + rr.d + ' · une fois par jour'),
      cs.length && chList(cs),
      rq && rla('rla', { k: rq.k, d: rq.d }, 'Lancer le dé', rq.k + ' · ' + rq.d + ' · ' + pct(rq) + ' %'),
      it &&
        el(
          'div',
          { class: 'intro' },
          el('h2', { class: 'ith', text: app.cur.name }),
          it.pitch && el('div', { class: 'itp b' }, body(it.pitch)),
          // Mode jeu de rôle : la fiche, à remplir avant le premier tour.
          R.length && rla('rla shb', null, 'Fiche du personnage', 'Répartissez vos points avant de commencer'),
          it.starts.length && chList(it.starts),
          el('p', {
            class: 'hint',
            text: it.starts.length
              ? 'Choisissez un début, ou écrivez le vôtre.'
              : "Écrivez votre premier tour pour lancer l'histoire."
          })
        )
    ].filter(Boolean)
  );
  if (sc) {
    w.scrollTop = w.scrollHeight;
    for (const x of fresh)
      for (const img of x.querySelectorAll('img'))
        if (!img.complete)
          img.addEventListener(
            'load',
            () => {
              if (w.scrollHeight - w.scrollTop - w.clientHeight < 600) w.scrollTop = w.scrollHeight;
            },
            { once: true }
          );
  }
  recapCheck(app.cur);
  // Jet qui vient de partir (send.js, chat.js : { i, at }) : le dé est lancé une fois, jamais à la relecture. Le
  // message est souvent reconstruit pendant le lancer (il cesse d'être le dernier quand la réponse arrive) :
  // l'animation reprend alors là où elle en était.
  if (app.thrown) {
    const { i, at } = app.thrown,
      dt = Date.now() - at,
      r = msgEl(i)?.querySelector('.roll');
    if (dt >= THROW) app.thrown = null;
    else if (r && !r.classList.contains('thrown')) throwDie(r, dt);
  }
  // État de la réponse qui vient d'arriver (send.js : { i, at }) : ses valeurs changées s'animent une fois
  // (style.css, .fresh), sous le message et dans la colonne de droite ; reprises là où elles en étaient si le
  // message est reconstruit.
  if (app.fresh) {
    const { id, i, at } = app.fresh,
      dt = Date.now() - at;
    if (dt >= FRESH) app.fresh = null;
    else if (id == app.cur.id)
      for (const s of document.querySelectorAll('#msgs > .m[data-i="' + i + '"] .st, #side .stg'))
        if (!s.classList.contains('fresh')) {
          s.style.setProperty('--dt', -dt + 'ms');
          s.classList.add('fresh');
          // Retirée ensuite : déplier le panneau plus tard rejouerait l'animation.
          setTimeout(() => s.classList.remove('fresh'), FRESH - dt);
        }
  }
  tk();
  memRing();
  navView();
}
// Le d20 arrive en roulant depuis la droite, rebondit et se pose, ses chiffres défilant ; l'issue et le bonus
// apparaissent ensuite (classe thrown). dt : temps déjà écoulé du lancer. Rien si les animations sont réduites.
const THROW = 950,
  FRESH = 1600;
const throwDie = (c, dt) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const d = c.querySelector('.rd'),
    b = d.querySelector('b'),
    n = b.textContent,
    iv = setInterval(() => (b.textContent = String(1 + Math.floor(Math.random() * 20))), 90);
  c.classList.add('thrown');
  const a = d.animate(
    [
      { transform: 'translate(120px, -50px) rotate(-300deg) scale(0.6)', opacity: 0 },
      { transform: 'translate(30px, 6px) rotate(-120deg) scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'translate(8px, -10px) rotate(-30deg)', offset: 0.6 },
      { transform: 'translate(-2px, 2px) rotate(8deg)', offset: 0.82 },
      { transform: 'none' }
    ],
    { duration: THROW, easing: 'ease-out' }
  );
  a.currentTime = dt;
  a.onfinish = () => {
    clearInterval(iv);
    b.textContent = n;
    c.classList.remove('thrown');
  };
};
// Jauge de la mémoire autour du bouton Envoyer : vide juste après une mise à jour (SUM_KEEP messages gardés mot
// pour mot), pleine à SUM_PLAY, qui la déclenche. Les cinq derniers tours (un tour : deux messages) affichent
// leur compte à rebours ; elle pulse pendant la mise à jour.
export function memRing() {
  const s = app.cur;
  if (!s) return;
  const b = $('#send'),
    n = s.messages.length - s.mem.upto,
    run = summing(s.id),
    left = Math.max(0, Math.ceil((SUM_PLAY - n) / 2));
  b.style.setProperty('--mp', run ? 1 : Math.min(1, Math.max(0, (n - SUM_KEEP) / (SUM_PLAY - SUM_KEEP))));
  b.classList.toggle('mnear', run || left <= 5);
  b.classList.toggle('mrun', run);
  b.dataset.left = !run && left && left <= 5 ? left : '';
  b.setAttribute(
    'aria-label',
    'Envoyer · mémoire : ' +
      (run ? 'mise à jour en cours' : left ? left + (left > 1 ? ' tours' : ' tour') + ' avant la mise à jour' : 'mise à jour au prochain tour')
  );
}
on('mem', memRing);
// En-tête : les personnages en scène (trois avatars au plus, puis « +N ») à la place de l'icône Personnages.
// Reconstruit seulement quand la distribution change, pour ne pas recharger les images à chaque rendu.
function castView(pr) {
  const pe = $('#pe'),
    k = app.cur.id + ':' + pr.map(c => c.name).join('|');
  if (pe.dataset.k === k) return;
  pe.dataset.k = k;
  pe.classList.toggle('pea', !!pr.length);
  pe.setAttribute(
    'aria-label',
    pr.length ? 'Personnages en scène : ' + pr.map(c => c.name).join(', ') : 'Personnages'
  );
  pe.replaceChildren(
    ...(pr.length
      ? [
          ...pr.slice(0, 3).map(face),
          pr.length > 3 && el('span', { class: 'pav pam', 'aria-hidden': 'true', text: '+' + (pr.length - 3) })
        ].filter(Boolean)
      : [ic('users')])
  );
}
// Message dont l'état est le dernier montré (-1 : aucun), pour l'en-tête et la colonne du grand écran.
const stIdx = () => (statOn(app.cur) ? app.cur.messages.findLastIndex(m => m.role == 'assistant' && m.state?.length) : -1);
// En-tête : avec un lieu dans l'état, un surtitre « Chapitre I · Scène 4 » (#cov), le lieu en titre (#ct) et le
// jour et l'heure dessous (#cx) ; sans lieu, le titre de l'histoire. Le reste de l'état est dans la carte sous la
// réponse. Une autre histoire rouvre l'en-tête complet.
let CXID = '',
  CTX = false;
// Ouverture d'une histoire, même celle qu'on vient de quitter (chat.js) : le prochain rendu rouvre l'en-tête.
export const hdReset = () => (CXID = '');
// Champs que l'en-tête montre déjà en entier : le lieu, l'heure, et le jour s'il n'est rien de plus que ce que
// l'en-tête en garde (une Date « J+3, 14h, pluie » reste dans la carte).
const shownOf = st => {
  const f = t => st.find(([k]) => t(k)),
    J = f(isJour);
  return new Set([f(isLieu), f(isHeure), J && head(J[1]) == String(J[1]).trim() && J].filter(Boolean).map(r => r[0]));
};
const ROM = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = n => ROM.reduce((s, [v, r]) => {
  for (; n >= v; n -= v) s += r;
  return s;
}, '');
// Chapitre en cours (les chapitres de la mémoire sont les terminés) et rang de la scène en cours dans ce chapitre,
// comme dans le Sommaire : une scène commencée avant le chapitre compte pour sa première.
const chapScene = ms => {
  const C = app.cur.mem.chapters || [],
    start = C.at(-1)?.upto || 0;
  return 'Chapitre ' + roman(C.length + 1) + ' · Scène ' + scenesOf(ms).filter(s => s.to >= start).length;
};
function ctxView() {
  const ms = app.cur.messages,
    i = stIdx(),
    st = i >= 0 ? ms[i].state : null,
    lieu = st ? lieuOf(st) : '',
    ov = lieu ? chapScene(ms) : '',
    title = lieu || app.cur.name,
    t = st ? [dayLabel(st), heureOf(st)].filter(Boolean).join(' · ') : '';
  if (CXID != app.cur.id) {
    CXID = app.cur.id;
    sy = 0;
    fold(false);
  }
  $('#cov').hidden = !ov;
  if ($('#cov').textContent != ov) $('#cov').textContent = ov;
  if ($('#ct').textContent != title) $('#ct').textContent = title;
  $('#cx').hidden = !t;
  if ($('#cx').textContent != t) $('#cx').textContent = t;
  // Plus de lieu ni de jour (réponse supprimée ou régénérée) : l'en-tête replié n'aurait que le nom de l'histoire.
  CTX = !!(t || ov);
  if (!CTX) fold(false);
}
// Replié, un toucher sur le lieu ou la ligne rouvre l'en-tête (retour, menu).
$('#ctw').addEventListener('click', e => {
  if (!$('#chat header').classList.contains('rd')) return;
  e.stopPropagation();
  fold(false);
}, true);
$('#ctw').onkeydown = e => {
  if ((e.key == 'Enter' || e.key == ' ') && $('#chat header').classList.contains('rd')) {
    e.preventDefault();
    fold(false);
  }
};
// Téléphone : l'en-tête se replie sur la ligne de contexte quand le joueur descend dans le fil, et revient dès
// qu'il remonte. Seuls ses gestes comptent (gx : dernier toucher ou molette), pas le défilement de l'application
// (ouverture, réponse qui s'écrit, flèches de tour). hdAt : moment du dernier repli, pour ne pas replier et
// déplier en rafale.
let hdAt = 0,
  gx = 0,
  sy = 0,
  hh = '';
// Téléphone : l'en-tête flotte sur le fil (style.css), qui part sous sa hauteur dépliée. Caché (liste des
// histoires), il ne mesure rien : la hauteur gardée sert au retour.
const hhSet = h => {
  const v = h + 'px';
  if (h && !$('#chat header').classList.contains('rd') && v != hh) $('#chat').style.setProperty('--hh', (hh = v));
};
new ResizeObserver(([e]) => hhSet(e.borderBoxSize[0].blockSize)).observe($('#chat header'), { box: 'border-box' });
// Mesure immédiate, avant un saut dans le fil qui suit l'ouverture (chat.js) : l'observateur n'a pas encore parlé.
export const hhNow = () => hhSet($('#chat header').getBoundingClientRect().height);
function fold(f) {
  const hd = $('#chat header');
  if (hd.classList.contains('rd') == f) return;
  hd.classList.toggle('rd', f);
  hdAt = Date.now();
  $('#ctw').tabIndex = f ? 0 : -1;
}
// Grand écran (ordinateur) : même seuil que les @media (min-width: 1200px) de style.css.
export const WIDE = matchMedia('(min-width: 1200px)');
// Grand écran : à droite, les personnages en scène et le dernier état, toujours visibles. Sans rien à
// montrer, pas de colonne (classe sd absente). Reconstruit seulement quand son contenu change.
function sideView(pr) {
  if (!WIDE.matches) return;
  const ms = app.cur.messages,
    i = stIdx(),
    sd = $('#side'),
    k = [app.cur.id, ctx.chars?.length, ctx.iv, pr.map(c => c.name).join('|'), i < 0 ? '' : i + sig(ms[i].state)].join(':');
  if (sd.dataset.k === k) return;
  sd.dataset.k = k;
  const parts = [
    ctx.chars?.length &&
      el(
        'section',
        null,
        el('h2', { class: 'sdh', text: 'En scène' }),
        pr.length
          ? el(
              'button',
              {
                class: 'sdc',
                'aria-label': 'Personnages en scène : ' + pr.map(c => c.name).join(', '),
                onclick: () => $('#pe').click()
              },
              pr.map(c => el('span', { class: 'sdp' }, face(c), el('span', { text: c.name })))
            )
          : el('p', { class: 'hint', text: 'Personne en scène pour l’instant.' })
      ),
    i >= 0 && el('section', null, el('h2', { class: 'sdh', text: 'État' }), stGrid(stRows(i, ms[i])))
  ].filter(Boolean);
  sd.replaceChildren(...parts);
  $('#chat').classList.toggle('sd', parts.length > 0);
}
WIDE.onchange = () => {
  if (!app.cur || $('#chat').hidden) return;
  sideView(inScene(app.cur.messages.slice(-6)));
  fold(false);
};
$('#tk').onclick = e => {
  const t = $('#tk');
  if (!e.target.closest('.tks, .tkl')) return;
  const open = t.classList.toggle('open');
  for (const b of t.querySelectorAll('button')) b.setAttribute('aria-expanded', String(open));
  // Le bouton touché disparaît : le focus passe à celui qui le remplace.
  if (t.contains(document.activeElement)) t.querySelector(open ? '.tkl' : '.tks')?.focus();
};
const goTurn = d => {
  const w = $('#msgs'),
    e = msgEl(visibleStart() + d);
  if (e) e.scrollIntoView({ block: 'start' });
  else w.scrollTo({ top: d < 0 ? 0 : w.scrollHeight });
};
// Loin de la fin du fil (plus de 80 px dessous) : flèches de tour, position de lecture, réponse qui arrive.
export const far = () => {
  const m = $('#msgs');
  return m.scrollHeight - m.scrollTop - m.clientHeight >= 80;
};
// Premier message visible en haut du fil, sous l'en-tête quand il flotte dessus (téléphone) : même repère que
// scrollIntoView, le haut du fil plus son scroll-padding.
export const visibleStart = () => {
  const m = $('#msgs'),
    top = m.getBoundingClientRect().top + (parseFloat(getComputedStyle(m).scrollPaddingTop) || 0),
    els = [...m.querySelectorAll('.m')],
    e = els.find(x => x.getBoundingClientRect().bottom > top + 24) || els.at(-1);
  // La réponse en cours d'écriture (#live) n'a pas encore de numéro : elle suit le dernier message enregistré.
  return !e ? 0 : e.dataset.i != null ? +e.dataset.i : app.cur.messages.length;
};
// Position de lecture d'une histoire : le premier message visible, rien si on est à la fin.
export const readPos = id => {
  if (!id || $('#chat').hidden) return;
  const i = far() ? visibleStart() : 0;
  if (i > 0) LS.set('pos:' + id, i);
  else LS.del('pos:' + id);
};
// Pastille « Nouveau message » : signale une réponse qui arrive ou est arrivée sous l'écran, jusqu'à ce que
// son début soit visible.
export const tail = () => document.querySelector('#live') || [...document.querySelectorAll('#msgs > .m[data-i]')].at(-1);
export const unseen = e => !!e && e.getBoundingClientRect().top > $('#msgs').getBoundingClientRect().bottom - 24;
export function newShow(t) {
  const b = $('#newm');
  if (b.hidden || b.firstChild?.textContent != t) b.replaceChildren(el('span', { text: t }), ic('down', 16));
  b.hidden = false;
}
// Flèches de tour : là pendant le défilement et un moment après, puis effacées pour ne pas couvrir le texte qu'on
// lit. Défiler ou toucher le fil les rappelle ; pas l'écriture de l'IA, qui appelle navView à chaque image sans les
// réveiller, sinon elles couvriraient la réponse qu'on est en train de lire.
let navT;
const navWake = () => {
  $('#nav').classList.remove('idle');
  clearTimeout(navT);
  navT = setTimeout(() => $('#nav').classList.add('idle'), 2500);
};
export const navView = () => {
  const f = far(),
    n = $('#nav');
  if (f && n.hidden) navWake();
  n.hidden = !f;
  if (!f || !unseen(tail())) $('#newm').hidden = true;
};
$('#msgs').addEventListener('pointerdown', navWake, { passive: true });
for (const t of ['touchmove', 'wheel']) $('#msgs').addEventListener(t, () => (gx = Date.now()), { passive: true });
$('#msgs').onscroll = () => {
  navWake();
  navView();
  const y = $('#msgs').scrollTop,
    dy = y - sy;
  if (Math.abs(dy) < 24 && y >= 40) return;
  sy = y;
  const now = Date.now();
  if (now - gx < 800 && now - hdAt > 400 && !WIDE.matches && CTX) fold(y >= 40 && dy > 0);
};
// Clavier ouvert (Android avec interactive-widget=resizes-content, index.html ; iPhone) : le fil rapetisse par le
// bas. Si on lisait la fin, elle reste en vue au lieu de passer sous la saisie. Le rétrécissement ne déplace pas
// scrollTop : l'écart d'avant se lit avec l'ancienne hauteur. Rien depuis une hauteur nulle : à l'ouverture d'une
// histoire (fil caché puis montré), la position de lecture reste. Hauteur bordure comprise : le haut du fil,
// sous l'en-tête flottant, est une marge intérieure qui change avec lui.
let h0 = 0;
new ResizeObserver(([e]) => {
  const h = e.borderBoxSize[0].blockSize,
    m = $('#msgs');
  if (h0 && h < h0 && m.scrollHeight - m.scrollTop - h0 < 80) m.scrollTop = m.scrollHeight;
  h0 = h;
}).observe($('#msgs'), { box: 'border-box' });
$('#newm').onclick = () => {
  const m = $('#msgs');
  $('#newm').hidden = true;
  m.scrollTo({ top: m.scrollHeight, behavior: smooth() });
};
$('#nvp').onclick = () => goTurn(-1);
$('#nvn').onclick = () => goTurn(1);
