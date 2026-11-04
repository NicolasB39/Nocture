import { bkOn, sync } from './backup.js';
import { emit, on } from './bus.js';
import { coverOf, getTree, localTree } from './scenarios.js';
import { S, app, playerName } from './state.js';
import { clean, del, getAll, getOne, put, saveSet } from './store.js';
import { $, LS, ago, dlg, el, hue, ic, initial, nz, plain, uid, vt } from './util.js';

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
// Ordre de la liste : épinglées d'abord, puis la plus récemment modifiée.
export const byRecent = (x, y) => (y.pin ? 1 : 0) - (x.pin ? 1 : 0) || y.updated - x.updated;
export async function draw() {
  const a = (await getAll()).sort(byRecent);
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
            el('span', { class: 'ini', text: initial(s.name) })
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
          data: { id: s.id, pin: s.pin ? '1' : '', played: s.n > 0 ? '1' : '' },
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
              text: a.length ? 'Aucun résultat.' : 'Aucune histoire. Touchez « Nouveau » pour créer un scénario.'
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
  $('#ak').hidden = !!S.key;
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
    // Une histoire jamais jouée est déjà une partie vierge.
    $('#mng').hidden = !m.dataset.played;
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
// Histoire visée par une action de menu : celle de la conversation ouverte (l'objet vivant, qu'une copie lue en
// base écraserait au prochain enregistrement) ou une autre, lue en base.
const target = id => (!$('#chat').hidden && app.cur?.id == id ? app.cur : getOne(id));
export async function pinStory(id) {
  const s = await target(id);
  s.pin = !s.pin;
  s.updated = Date.now();
  await put(s);
  return s.pin;
}
// Renommer : vrai si le nom a changé.
// L'histoire est relue après la boîte : une synchronisation pendant la saisie a pu la remplacer.
export async function renameStory(id) {
  const n = (await dlg('Renommer', { v: (await target(id)).name }))?.trim(),
    s = await target(id);
  if (!n || n == s.name) return false;
  s.name = n;
  s.updated = Date.now();
  await put(s);
  return true;
}
// Nouvelle partie du même scénario : ses textes et les réglages de l'histoire (nom du joueur, modèle, choix,
// état, note…), sans messages, mémoire ni distribution. L'histoire d'origine n'est pas touchée. Rend son id.
export async function newGame(id) {
  const s = await target(id),
    c = clean({
      ...s,
      id: uid(),
      name: s.name.endsWith(' (nouvelle partie)') ? s.name : s.name + ' (nouvelle partie)',
      pin: false,
      reset: 0,
      updated: Date.now(),
      messages: [],
      mem: null,
      cast: [],
      castUpto: null
    });
  await put(c);
  return c.id;
}
export async function exportStory(id) {
  const s = await target(id),
    nm = playerName(s) || 'Joueur';
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
}
$('#mc').onclick = () => $('#mn').close();
$('#mng').onclick = async () => {
  $('#mn').close();
  emit('open', await newGame(app.menuId));
};
$('#mp').onclick = async () => {
  $('#mn').close();
  await pinStory(app.menuId);
  draw();
};
$('#mt').onclick = () => {
  $('#mn').close();
  exportStory(app.menuId);
};
$('#mr').onclick = async () => {
  $('#mn').close();
  if (await renameStory(app.menuId)) showList();
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
// Supprimer une histoire : la conversation, sa mémoire et ses réglages. Un scénario GitHub reste dans le dépôt ;
// celui créé dans l'application n'existe que dans ses histoires, le message le dit.
$('#mx').onclick = async () => {
  $('#mn').close();
  const s = await getOne(app.menuId);
  if (!s) return;
  if (
    await dlg('Supprimer cette histoire ?', {
      m:
        'La conversation, sa mémoire et ses réglages sont effacés. ' +
        (s.remote
          ? 'Le scénario « ' + s.folder + ' » n’est pas touché : tant qu’il est dans le dépôt, il reste dans la bibliothèque, prêt pour une nouvelle partie.'
          : 'Ce scénario a été créé dans l’application : son prompt disparaît avec elle s’il n’a pas d’autre histoire. Pour le garder, lancez d’abord une « Nouvelle partie ».'),
      ok: 'Supprimer'
    })
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

Je ne résous pas l'affaire à la place du joueur. Chaque réponse fait avancer d'une scène, et se termine sur quelque chose que le joueur peut saisir : une porte, une question, un silence.`,
  tp2: `Nous jouons un récit de fantasy itinérante. Le joueur est un voyageur ; je suis le narrateur et tous les autres personnages.

Un monde ancien, traversé de routes et de ruines, où la magie coûte toujours quelque chose. Pas d'élu, pas de prophétie : des gens, des dettes, des saisons.

Voix : présent, deuxième personne, descriptions concrètes et sensorielles, jamais plus de deux images par paragraphe.

Les rencontres ont leurs propres intentions et continuent d'exister quand il s'éloigne. Chaque réponse fait avancer d'une scène et laisse une route ouverte.`,
  tp3: `Nous jouons un huis clos. Le joueur est l'un des occupants ; je suis le narrateur et tous les autres personnages.

Un lieu fermé, un petit groupe, une raison de ne pas pouvoir partir. La tension vient de ce que les gens taisent. Rien de surnaturel tant que le joueur ne l'amène pas.

Voix : présent, deuxième personne, beaucoup de dialogue, peu de décor une fois le lieu posé. Les silences comptent autant que les répliques.

Chaque personnage a un secret et une peur ; ils agissent même quand on ne les regarde pas. Chaque réponse resserre un peu l'étau.`
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
