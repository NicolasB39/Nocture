import { face } from './cast.js';
import { money } from './cost.js';
import { body, fr, line, parseIntro } from './format.js';
import { buildInfo, inScene, statOn } from './prompt.js';
import { modelOf } from './protocol.js';
import { last as rlLast, status, wait } from './rate.js';
import { refreshSpeech, ttsOk, visibleStart } from './read.js';
import { coverOf } from './scenarios.js';
import { decorFor, decorNow, decorsOf, lieuOf, scenesOf } from './scene.js';
import { app, ctx, S } from './state.js';
import { $, accentVars, el, ic, LS } from './util.js';

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
      m.win,
      m.summary.length,
      m.memories.length,
      m.lines?.length,
      Object.keys(m.relations || {}).length,
      S.ctxLim,
      S.reserve,
      S.cpt,
      S.pre?.length,
      S.proto,
      S.provider,
      modelOf(),
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
export function tk(info) {
  const e = $('#tk');
  if (!app.cur || !app.cur.mem) {
    e.textContent = '';
    e.hidden = true;
    $('#rl').hidden = true;
    return;
  }
  const r = info || infoOf(),
    n = app.cur.messages.length,
    sentN = Math.max(0, n - r.win),
    f = x => x.toLocaleString('fr-FR'),
    k = x => (x < 1000 ? f(x) : (x / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' k');
  e.className = r.over ? 'w' : e.classList.contains('open') ? 'open' : '';
  if (r.over)
    e.textContent =
      'Prompt de base trop long pour la limite (≈ ' +
      f(r.used) +
      ' / ' +
      f(r.budget) +
      ' tokens) : réduisez le prompt système, le lorebook ou la mémoire.';
  else {
    // Pastille courte (tokens et coût du dernier tour) ; le détail s'ouvre en la touchant.
    // Compteurs réels du dernier envoi : seulement s'il venait de cette histoire.
    const c = app.turn?.id == app.cur.id ? app.turn.cost : null,
      mine = app.pt?.id == app.cur.id,
      pt = mine ? app.pt.n : 0,
      long =
        '≈ ' +
        f(r.used) +
        (r.budget ? ' / ' + f(r.budget) : '') +
        ' tokens envoyés' +
        (pt ? ' (réel : ' + f(pt) + ')' : '') +
        (mine && rlLast.cached ? ' · ' + f(rlLast.cached) + ' lus en cache' : '') +
        (mine && rlLast.wrote ? ' · ' + f(rlLast.wrote) + ' mis en cache' : '') +
        (n ? ' · ' + sentN + (sentN > 1 ? ' messages envoyés' : ' message envoyé') + ' sur ' + n : '');
    e.replaceChildren(
      el(
        'button',
        { class: 'tks', 'aria-expanded': String(e.classList.contains('open')), 'aria-label': 'Détail des compteurs' },
        '≈ ' + k(pt || r.used) + ' tokens' + (c != null ? ' · ' + money(c, S.fx) + ' ce tour' : '')
      ),
      el('span', { class: 'tkl', text: long })
    );
  }
  e.hidden = !S.counters && !r.over;
  rlView(r.used);
}
let rlEst = 0,
  rlT = 0;
const rlStop = () => {
  clearInterval(rlT);
  rlT = 0;
};
function rlView(est) {
  if (est != null) rlEst = est;
  const g = $('#rl'),
    s = status(modelOf());
  if (!s) {
    g.hidden = true;
    rlStop();
    return;
  }
  const f = x => x.toLocaleString('fr-FR'),
    pc = Math.max(0, Math.min(100, (s.rem / s.lim) * 100)),
    w = wait(rlEst + (+app.cur?.maxTok || 500), modelOf());
  g.className = w ? 'w' : '';
  g.firstChild.firstChild.style.width = pc + '%';
  g.lastChild.textContent =
    f(s.rem) +
    ' / ' +
    f(s.lim) +
    ' tokens par minute' +
    (s.src == 'local' ? ' (estimation locale)' : '') +
    (w ? ' · prochain tour dans ~' + w + ' s' : '');
  g.hidden = !S.counters && !w;
  // La jauge se remplit avec le temps : on ne la redessine chaque seconde que tant qu'elle est à l'écran.
  if (g.hidden || $('#chat').hidden) rlStop();
  else
    rlT ||= setInterval(() => {
      if (app.cur && !$('#chat').hidden && !document.hidden) rlView();
      else if (!app.cur || $('#chat').hidden) rlStop();
    }, 1000);
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
  if (ttsOk) r.append(b('v', 'Lire à voix haute', 'vol'));
  if (last) {
    const rg = b('r', 'Régénérer', 'refresh');
    rg.title = 'Régénérer · appui long ou clic droit : avec une indication';
    r.append(rg);
    if (m.role == 'assistant') r.append(b('k', 'Continuer', 'chevsr'));
  }
  r.append(b('m', 'Autres actions', 'more'));
  return r;
};
const numOf = v => {
  const m = String(v).match(/^(-?\d+(?:[.,]\d+)?)/);
  return m ? +m[1].replace(',', '.') : null;
};
const sig = st => (st || []).map(x => x[0] + '=' + x[1]).join('|');
const prevState = i => {
  const ms = app.cur.messages;
  for (let j = i - 1; j >= 0; j--)
    if (ms[j].role == 'assistant' && ms[j].state?.length) return ms[j].state;
  return [];
};
// Panneau d'état : une rangée de pastilles (les premières valeurs, avec leur variation), dépliée d'un toucher
// en grille détaillée avec les jauges. Le choix plié / déplié vaut pour toute l'appli.
const ST_N = 3;
const stCard = (i, m) => {
  if (!m.state?.length || !statOn(app.cur)) return null;
  const pm = new Map(prevState(i)),
    open = LS.get('stOpen') == '1',
    rows = m.state.map(([k, v]) => {
      const a = numOf(v),
        b = pm.has(k) ? numOf(pm.get(k)) : null,
        d = a != null && b != null && a !== b ? a - b : null;
      return { k, v, d };
    }),
    dl = (d, short) =>
      d != null &&
      el('em', {
        class: 'dl ' + (d > 0 ? 'up' : 'dn'),
        text: (d > 0 ? (short ? '▲' : '▲ +') : short ? '▼' : '▼ ') + Math.round(Math.abs(d) * 100) / 100
      }),
    more = rows.length - ST_N;
  return el(
    'div',
    { class: 'st' + (open ? ' open' : '') },
    el(
      'button',
      { class: 'stc', 'aria-expanded': String(open), 'aria-label': 'Détail de l’état' },
      rows.slice(0, ST_N).map(r => el('span', { class: 'stp' }, el('span', { text: r.k }), ' ' + r.v, dl(r.d, true))),
      more > 0 && el('span', { class: 'stp stm', text: '+' + more }),
      ic('down', 14)
    ),
    el(
      'div',
      { class: 'stx' },
      el('button', { class: 'stl', 'aria-expanded': String(open) }, 'État', ic('down', 14)),
      el(
        'div',
        { class: 'stg' },
        rows.map(({ k, v, d }) => {
          const r = v.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/),
            p = r
              ? Math.max(0, Math.min(100, (+r[1].replace(',', '.') / +r[2].replace(',', '.')) * 100))
              : null;
          return el(
            'div',
            { class: 'kv' },
            el('span', { text: k }),
            el('b', null, v, dl(d)),
            p != null && el('i', { class: 'bar' }, el('u', { style: 'width:' + p + '%' }))
          );
        })
      )
    )
  );
};
// Débuts de scène (scenesOf, scene.js), ornés d'une lettrine et d'un intertitre. LIEU[i] : le lieu connu à la
// fin du message i, pour la légende des images.
let LT = new Set(),
  LIEU = [],
  SC = [];
const sceneStarts = ms => {
  let shown = '';
  SC = scenesOf(ms);
  LIEU = ms.map(m => (shown = (m.role == 'assistant' && lieuOf(m.state)) || shown));
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
    (i == live ? $('#live') : w.querySelector(':scope > .m[data-i="' + i + '"]'))?.before(
      el('div', { class: 'scene', text: fr(s.lieu) })
    );
  }
};
// En-tête teinté par le décor du moment, à défaut par la couverture, flouté et assombri en CSS. L'adresse
// est rendue absolue : relative, la feuille de style qui lit la variable la résoudrait depuis css/.
const headDecor = dn => {
  const hd = $('#chat header');
  hd.classList.toggle('dk', !!dn);
  hd.style.setProperty('--hdi', dn ? 'url(' + JSON.stringify(new URL(dn, document.baseURI).href) + ')' : 'none');
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
  const d = decorFor(LIVE.lieu);
  headDecor(d || coverOf(app.cur));
  return d;
};
const msgNode = (i, m, last, d = '') => {
  const t = LT.has(i),
    p = m.role == 'assistant' ? LIEU[i] || '' : '',
    b = el('div', { class: 'b' }, body(m.content, d));
  // Légende des scènes : le lieu, en bas à gauche de l'image (masquée pour un portrait sans décor).
  if (p) for (const s of b.querySelectorAll('.scn')) s.append(el('span', { class: 'scap', text: fr(p) }));
  const n = el(
    'div',
    { class: 'm ' + m.role + (last ? ' last' : '') + (t ? ' lt' : ''), data: { i } },
    el('span', { class: 'sr', text: (m.role == 'user' ? 'Joueur' : 'Récit') + ' :' }),
    b,
    stCard(i, m),
    act(i, m, last)
  );
  n._k = keyOf(m, last, d, t, p);
  return n;
};
// Tout ce dont dépend le rendu d'un message : panneau d'état affiché ou non, et index des images (ctx.iv,
// changé par « Recharger l'index ») pour qu'une image ajoutée remplace son repère « image introuvable ».
const keyOf = (m, l, d, t, p) => ({
  c: m.content,
  a: m.ai,
  l,
  n: m.alts?.length || 0,
  s: sig(m.state),
  d,
  t,
  p,
  f: !!app.cur.fullBody,
  o: statOn(app.cur),
  g: ctx.iv
});
const same = (a, b) =>
  a &&
  a.c === b.c &&
  a.a === b.a &&
  a.l === b.l &&
  a.n === b.n &&
  a.s === b.s &&
  a.d === b.d &&
  a.t === b.t &&
  a.p === b.p &&
  a.f === b.f &&
  a.o === b.o &&
  a.g === b.g;
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
  const e = document.querySelector('#msgs .m[data-i="' + i + '"]');
  if (!e) return;
  e.scrollIntoView({ block: 'center', behavior: 'smooth' });
  e.classList.add('flash');
  setTimeout(() => e.classList.remove('flash'), 1600);
}
export function render(sc) {
  $('#ct').textContent = app.cur.name;
  const w = $('#msgs'),
    head = $('#mhead'),
    foot = $('#mfoot'),
    ms = app.cur.messages,
    n = ms.length,
    st = Math.max(0, n - app.LIM);
  const info = app.cur.mem ? infoOf() : null,
    D = decorsOf(ms);
  LT = sceneStarts(ms);
  const cv = !st && coverOf(app.cur);
  head.replaceChildren(
    ...[
      cv && el('img', { class: 'cover', src: cv, alt: '', decoding: 'async' }),
      st && el('button', { class: 'more', text: 'Afficher les messages précédents' })
    ].filter(Boolean)
  );
  const wi = info && info.win > st && info.win < n ? info.win : -1;
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
      k = keyOf(ms[i], i == n - 1, D[i], LT.has(i), ms[i].role == 'assistant' ? LIEU[i] || '' : '');
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
  w.querySelector(':scope > .lim')?.remove();
  if (wi > 0)
    w.querySelector(':scope > .m[data-i="' + wi + '"]')?.before(
      el('div', { class: 'lim', text: 'l’IA lit à partir d’ici' })
    );
  for (const e of w.querySelectorAll(':scope > .day')) e.remove();
  let pt = 0;
  for (let i = st; i < n; i++) {
    const t = ms[i].t;
    if (!t) continue;
    if (pt && cut6h(t, pt))
      w.querySelector(':scope > .m[data-i="' + i + '"]')?.before(
        el('div', { class: 'day', text: dayLab(t, pt) })
      );
    pt = t;
  }
  ST = st;
  titles(SC);
  const lm = ms.at(-1),
    cs = lm?.role == 'assistant' && !app.cur.noChoices ? lm.choices || [] : [];
  headDecor(decorNow(ms) || coverOf(app.cur));
  if (LIVE?.id == app.cur.id && $('#live')) liveApply();
  const av = accentVars(app.cur.accent),
    ch = $('#chat');
  for (const k of ['--ac', '--acs', '--act', '--acb', '--on'])
    if (av) ch.style.setProperty(k, av[k]);
    else ch.style.removeProperty(k);
  castView(inScene(ms.slice(-6)));
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
            { class: 'cht', data: { t: c }, 'aria-label': 'Envoyer : ' + c.replace(/\*/g, '') },
            el('span', { class: 'chn', 'aria-hidden': 'true', text: k + 1 }),
            el('span', { class: 'chx' }, line(c))
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
      cs.length && chList(cs),
      it &&
        el(
          'div',
          { class: 'intro' },
          el('h2', { class: 'ith', text: app.cur.name }),
          it.pitch && el('div', { class: 'itp b' }, body(it.pitch)),
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
  tk(info);
  navView();
  refreshSpeech();
}
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
$('#tk').onclick = e => {
  const t = $('#tk');
  if (t.classList.contains('w') || !e.target.closest('.tks, .tkl')) return;
  t.classList.toggle('open');
  t.querySelector('.tks')?.setAttribute('aria-expanded', String(t.classList.contains('open')));
};
const goTurn = d => {
  const w = $('#msgs'),
    e = document.querySelector('#msgs .m[data-i="' + (visibleStart() + d) + '"]');
  if (e) e.scrollIntoView({ block: 'start', behavior: 'smooth' });
  else w.scrollTo({ top: d < 0 ? 0 : w.scrollHeight, behavior: 'smooth' });
};
const far = () => {
  const m = $('#msgs');
  return m.scrollHeight - m.scrollTop - m.clientHeight >= 80;
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
const navView = () => {
  const f = far();
  $('#nav').hidden = !f;
  if (!f || !unseen(tail())) $('#newm').hidden = true;
};
$('#msgs').onscroll = navView;
$('#newm').onclick = () => {
  const m = $('#msgs');
  $('#newm').hidden = true;
  m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' });
};
$('#nvp').onclick = () => goTurn(-1);
$('#nvn').onclick = () => goTurn(1);
