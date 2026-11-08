import { bkOn, sync } from './backup.js';
import { emit, on } from './bus.js';
import { recapOff } from './recap.js';
import { coverOf, getTree, localTree } from './scenarios.js';
import { S, app } from './state.js';
import { clean, del, getAll, getOne, put, saveSet } from './store.js';
import { $, LS, ago, dlg, el, hue, ic, initial, nz, uid, vt } from './util.js';

export async function showList() {
  // L'encart garde l'histoire en mémoire (Résumer) : retiré en quittant.
  recapOff();
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
// Ordre de la liste : la plus récemment modifiée d'abord.
export const byRecent = (x, y) => y.updated - x.updated;
export async function draw() {
  const a = (await getAll()).sort(byRecent);
  const T0 = localTree();
  const q = nz($('#q').value.trim());
  const f = q ? a.filter(s => nz(s.name + ' ' + (s.pv || '')).includes(q)) : a;
  const hero = q ? null : f.find(s => s.n > 0);
  const card = (s, h) => {
    const cv = coverOf(s, T0),
      hv = hue(s.name),
      tags = [];
    if (!s.n && !h) tags.push(el('span', { class: 'tag', text: 'Nouveau' }));
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
          data: { id: s.id, played: s.n > 0 ? '1' : '' },
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
              text: a.length ? 'Aucun résultat.' : 'Aucune histoire. Touchez ↻ en haut pour charger les scénarios de GitHub.'
            })
          )
        ])
  );
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
// Histoire visée par une action de menu : celle de la conversation ouverte (l'objet vivant, qu'une copie lue en
// base écraserait au prochain enregistrement) ou une autre, lue en base.
const target = id => (!$('#chat').hidden && app.cur?.id == id ? app.cur : getOne(id));
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
// état, note…), sans messages ni mémoire. L'histoire d'origine n'est pas touchée. Rend son id.
export async function newGame(id) {
  const s = await target(id),
    c = clean({
      ...s,
      id: uid(),
      name: s.name.endsWith(' (nouvelle partie)') ? s.name : s.name + ' (nouvelle partie)',
      reset: 0,
      updated: Date.now(),
      messages: [],
      mem: null,
      // Nouveau personnage : la fiche du mode jeu de rôle repart vide.
      sheet: {}
    });
  await put(c);
  return c.id;
}
$('#mc').onclick = () => $('#mn').close();
$('#mng').onclick = async () => {
  $('#mn').close();
  emit('open', await newGame(app.menuId));
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
// une histoire locale (importée, ou créée par une ancienne version) n'existe que sur l'appareil, le message le dit.
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
          : 'Cette histoire ne vient pas d’un scénario GitHub : son prompt disparaît avec elle s’il n’a pas d’autre histoire. Pour le garder, lancez d’abord une « Nouvelle partie ».'),
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
$('#rf').onclick = async () => {
  await getTree(true);
  showList();
};
