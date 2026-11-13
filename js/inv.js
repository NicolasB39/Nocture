// Feuille Inventaire (mode Inventaire, modes.js) : les quantités tenues par l'application et les derniers
// changements. En lecture seule : seul le narrateur fait gagner ou perdre quelque chose, par sa balise.
import { invOf } from './modes.js';
import { app } from './state.js';
import { $, el } from './util.js';

const fill = () => {
  const { items, log } = invOf(app.cur.messages);
  $('#invl').replaceChildren(
    ...(items.length
      ? items.map(x =>
          el(
            'div',
            { class: 'shr' + (x.n ? '' : ' none') },
            el('span', { text: x.k }),
            el('b', { text: x.max != null ? x.n + ' / ' + x.max : String(x.n) })
          )
        )
      : [el('p', { class: 'note', text: 'Inventaire vide.' })])
  );
  const last = log.slice(-10).reverse();
  $('#invr').replaceChildren(
    ...(last.length
      ? last.map(c => el('span', { class: 'jt' + (c.d < 0 ? ' ko' : '') }, (c.d > 0 ? '+' : '−') + Math.abs(c.d) + ' ' + c.k))
      : [el('p', { class: 'note', text: 'Aucun changement pour l’instant.' })])
  );
};
$('#minv').onclick = () => {
  $('#dmn').close();
  fill();
  $('#dinv').showModal();
};
