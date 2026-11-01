import { bkOn, sync } from './backup.js';
import { emit, on } from './bus.js';
import { coverOf, getTree, localTree } from './scenarios.js';
import { API, S, app } from './state.js';
import { del, getAll, getOne, put, saveSet } from './store.js';
import { $, LS, ago, dlg, el, hue, ic, nz, plain, uid, vt } from './util.js';

export async function showList() {
  app.cur = null;
  await draw();
  await vt(() => {
    $('#chat').hidden = true;
    $('#list').hidden = false;
  });
  const T = await getTree();
  const fs = [
    ...new Set(T.map(p => p.match(/^scenarios\/([^/]+)\/systeme\.md$/)?.[1]).filter(Boolean))
  ];
  const have = await getAll();
  for (const f of fs)
    if (!have.some(s => s.remote && s.folder == f)) {
      await put({
        id: 'gh:' + f,
        name: f,
        folder: f,
        remote: true,
        updated: Date.now(),
        messages: []
      });
    }
  await draw();
}
const CVC = new Map();
const coverImg = (id, src) => {
  let e = CVC.get(id);
  if (!e || e.dataset.src !== src) {
    e = el('img', { class: 'cv', src, alt: '', loading: 'lazy', decoding: 'async' });
    e.dataset.src = src;
    CVC.set(id, e);
  }
  return e;
};
export async function draw() {
  const a = (await getAll()).sort(
    (x, y) => (y.pin ? 1 : 0) - (x.pin ? 1 : 0) || y.updated - x.updated
  );
  const T0 = localTree();
  const q = nz($('#q').value.trim());
  let f = a.filter(s =>
    app.FIL == 'play' ? s.n > 0 : app.FIL == 'lib' ? s.remote : app.FIL == 'own' ? !s.remote : true
  );
  if (q) f = f.filter(s => nz(s.name + ' ' + (s.pv || '')).includes(q));
  const hero = !q && app.FIL == 'all' ? f.find(s => s.n > 0) : null;
  const card = (s, h) => {
    const cv = coverOf(s, T0),
      hv = hue(s.name),
      tags = [];
    if (s.pin) tags.push(el('span', { class: 'tag', text: 'Épinglé' }));
    if (!s.n && !h) tags.push(el('span', { class: 'tag', text: 'Nouveau' }));
    if (LS.get('draft:' + s.id)) tags.push(el('span', { class: 'tag q2', text: 'Brouillon' }));
    return el(
      'div',
      { class: 'item ' + (h ? 'hero' : 'card') },
      cv
        ? coverImg(s.id, cv)
        : el(
            'div',
            { class: 'art v' + (hv % 4), style: '--h:' + hv },
            el('span', { class: 'ini', text: (s.name.trim()[0] || '?').toUpperCase() })
          ),
      tags.length ? el('div', { class: 'tags' }, tags) : null,
      el(
        'div',
        { class: 't' },
        el('h3', null, el('button', { class: 'ttl', text: s.name, data: { id: s.id } })),
        h
          ? [
              el('small', { class: 'pv', text: s.pv || '' }),
              el('span', { class: 'go', text: 'Reprendre' })
            ]
          : el('small', {
              text: s.n ? s.n + ' message' + (s.n > 1 ? 's' : '') + ' · ' + ago(s.updated) : ''
            })
      ),
      el(
        'button',
        {
          class: 'menu',
          data: { id: s.id, pin: s.pin ? '1' : '' },
          'aria-label': 'Options de ' + s.name
        },
        ic('more', 18)
      )
    );
  };
  const list = [hero && card(hero, 1), ...f.filter(s => s !== hero).map(s => card(s))].filter(Boolean);
  $('#items').replaceChildren(
    ...(list.length
      ? list
      : [
          el(
            'div',
            { class: 'empty' },
            ic('logo', 44),
            el('p', {
              text: a.length ? 'Aucun résultat.' : 'Aucun scénario. Créez-en un pour commencer.'
            })
          )
        ])
  );
  const cnt = {
    all: a.length,
    play: a.filter(s => s.n > 0).length,
    lib: a.filter(s => s.remote).length,
    own: a.filter(s => !s.remote).length
  };
  for (const b of $('#tabs').querySelectorAll('button'))
    b.querySelector('.cnt').textContent = cnt[b.dataset.f] || '';
  $('#ak').hidden = !!S.keys[API.k];
  $('#bk').hidden = !(
    a.some(s => s.n > 0) &&
    Date.now() - (+LS.get('bk') || +LS.get('first') || Date.now()) > 2592e6 &&
    Date.now() - (+LS.get('bks') || 0) > 6048e5
  );
}
$('#items').onclick = e => {
  const m = e.target.closest('.menu');
  if (m) {
    app.menuId = m.dataset.id;
    $('#mp').textContent = m.dataset.pin ? 'Détacher' : 'Épingler';
    $('#mnt').textContent = m.closest('.item').querySelector('.ttl').textContent;
    $('#mn').showModal();
    return;
  }
  const it = e.target.closest('.ttl');
  if (it) emit('open', it.dataset.id);
};
on('list:stale', () => {
  if (!$('#list').hidden) return draw();
});
let qt;
$('#q').oninput = () => {
  clearTimeout(qt);
  qt = setTimeout(draw, 150);
};
$('#tabs').onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  app.FIL = b.dataset.f;
  $('#tabs')
    .querySelectorAll('button')
    .forEach(x => {
      x.classList.toggle('on', x == b);
      x.setAttribute('aria-checked', x == b);
    });
  draw();
};
$('#mc').onclick = () => $('#mn').close();
$('#mp').onclick = async () => {
  const s = await getOne(app.menuId);
  $('#mn').close();
  s.pin = !s.pin;
  s.updated = Date.now();
  await put(s);
  draw();
};
$('#mt').onclick = async () => {
  const s = await getOne(app.menuId);
  $('#mn').close();
  const nm = s.pname?.trim() || 'Joueur';
  const t =
    '# ' +
    s.name +
    '\n\n' +
    s.messages
      .map(m => '**' + (m.role == 'user' ? nm : 'Narrateur') + '**\n\n' + plain(m.content, nm))
      .join('\n\n---\n\n') +
    '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([t], { type: 'text/markdown' }));
  a.download = (s.name.replace(/[\\/:*?"<>|]+/g, '_') || 'histoire') + '.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1e4);
};
$('#mr').onclick = async () => {
  const s = await getOne(app.menuId);
  $('#mn').close();
  const n = await dlg('Renommer', { v: s.name });
  if (n && n.trim()) {
    s.name = n.trim();
    s.updated = Date.now();
    await put(s);
    showList();
  }
};
$('#md').onclick = async () => {
  const s = await getOne(app.menuId);
  const c = structuredClone(s);
  c.id = uid();
  c.name = s.name + ' (copie)';
  c.updated = Date.now();
  await put(c);
  $('#mn').close();
  showList();
};
$('#mx').onclick = async () => {
  $('#mn').close();
  if (
    await dlg('Supprimer ce scénario ?', { m: 'Tout son historique sera effacé.', ok: 'Supprimer' })
  ) {
    await del(app.menuId);
    (S.tomb ??= {})[app.menuId] = Date.now();
    await saveSet();
    showList();
    if (bkOn()) sync();
  }
};
const TPL = {
  tp0: '',
  tp1: `Nous jouons une enquête contemporaine. Le joueur est enquêteur ; je suis le narrateur et tous les autres personnages.

Ville de province, pluie, hiver. Les gens mentent par habitude plus que par calcul. Les indices se gagnent en parlant aux bonnes personnes, pas en fouillant au hasard.

Voix : présent, deuxième personne, phrases courtes. Les dialogues portent l'essentiel. Pas de récapitulatif, pas de morale.

Je ne décide jamais à la place du joueur et je ne résous pas l'affaire pour lui. Chaque réponse fait avancer d'une scène, et se termine sur quelque chose que le joueur peut saisir : une porte, une question, un silence.`,
  tp2: `Nous jouons un récit de fantasy itinérante. Le joueur est un voyageur ; je suis le narrateur et tous les autres personnages.

Un monde ancien, traversé de routes et de ruines, où la magie coûte toujours quelque chose. Pas d'élu, pas de prophétie : des gens, des dettes, des saisons.

Voix : présent, deuxième personne, descriptions concrètes et sensorielles, jamais plus de deux images par paragraphe.

Je ne décide jamais à la place du joueur. Les rencontres ont leurs propres intentions et continuent d'exister quand il s'éloigne. Chaque réponse fait avancer d'une scène et laisse une route ouverte.`,
  tp3: `Nous jouons un huis clos. Le joueur est l'un des occupants ; je suis le narrateur et tous les autres personnages.

Un lieu fermé, un petit groupe, une raison de ne pas pouvoir partir. La tension vient de ce que les gens taisent. Rien de surnaturel tant que le joueur ne l'amène pas.

Voix : présent, deuxième personne, beaucoup de dialogue, peu de décor une fois le lieu posé. Les silences comptent autant que les répliques.

Je ne décide jamais à la place du joueur. Chaque personnage a un secret et une peur ; ils agissent même quand on ne les regarde pas. Chaque réponse resserre un peu l'étau.`
};
let NEW = '';
$('#new').onclick = async () => {
  const n = await dlg('Nom du scénario', { v: '' });
  if (!n || !n.trim()) return;
  NEW = n.trim();
  $('#dtp').showModal();
};
$('#tpx').onclick = () => $('#dtp').close();
for (const k of Object.keys(TPL))
  $('#' + k).onclick = async () => {
    $('#dtp').close();
    const s = {
      id: uid(),
      name: NEW,
      updated: Date.now(),
      system: TPL[k],
      avatar: '',
      messages: []
    };
    await put(s);
    await emit('open', s.id);
    emit('settings:open');
  };
$('#rf').onclick = async () => {
  await getTree(true);
  showList();
};
