// Fiche du personnage (mode jeu de rôle) : un bonus par caractéristique de regles.md, à répartir par le joueur,
// et les derniers jets de l'histoire. Rien n'est envoyé à l'IA : les bonus entrent dans le résultat des jets.
import { BONUS, rollParts, rulesOf, sheetOf, signed, spent } from './dice.js';
import { app } from './state.js';
import { save } from './store.js';
import { $, el, JET } from './util.js';

const fill = () => {
  const R = rulesOf(app.cur),
    sh = sheetOf(app.cur),
    left = BONUS.pts - spent(sh);
  $('#shp').textContent =
    (left > 0 ? 'Points à répartir : ' + left : 'Tous les points sont répartis') +
    '. Chaque caractéristique va de ' + signed(BONUS.min) + ' à ' + signed(BONUS.max) + ' ; baisser l’une rend un point.';
  $('#shl').replaceChildren(
    ...R.map(k =>
      el(
        'div',
        { class: 'shr' },
        el('span', { text: k }),
        el(
          'span',
          { class: 'shv' },
          el('button', { class: 'shm', data: { k }, 'aria-label': 'Retirer un point en ' + k, disabled: sh[k] <= BONUS.min, text: '−' }),
          el('b', { text: signed(sh[k]) }),
          el('button', { class: 'shp', data: { k }, 'aria-label': 'Ajouter un point en ' + k, disabled: sh[k] >= BONUS.max || left <= 0, text: '+' })
        )
      )
    )
  );
  const rs = [];
  for (const m of app.cur.messages) if (m.role == 'user') for (const j of m.content.matchAll(JET)) rs.push(rollParts(j[1]));
  const last = rs.filter(Boolean).slice(-8).reverse();
  $('#shr').replaceChildren(
    ...(last.length
      ? last.map(p =>
          el('span', { class: 'jt' + (p.ko ? ' ko' : ''), title: p.label + ' : ' + p.sum + ', ' + p.r }, p.n + ' · ' + p.r)
        )
      : [el('p', { class: 'note', text: 'Aucun jet pour l’instant.' })])
  );
};
export const openSheet = () => {
  fill();
  $('#dsh').showModal();
};
$('#shl').onclick = async e => {
  const b = e.target.closest('button[data-k]');
  if (!b || b.disabled) return;
  const sh = sheetOf(app.cur);
  const k = b.dataset.k,
    up = b.classList.contains('shp');
  sh[k] += up ? 1 : -1;
  app.cur.sheet = sh;
  await save();
  fill();
  // Les boutons sont recréés : le focus revient sur le même (ou sur l'autre de la ligne s'il est désactivé).
  const row = [...$('#shl').querySelectorAll('button')].filter(x => x.dataset.k == k),
    same = row.find(x => x.classList.contains(up ? 'shp' : 'shm'));
  (same && !same.disabled ? same : row.find(x => !x.disabled))?.focus();
};
$('#dshc').onclick = () => $('#dsh').close();
$('#msh').onclick = () => {
  $('#dmn').close();
  openSheet();
};
