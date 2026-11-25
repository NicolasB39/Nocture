// Feuille Inventaire (mode Inventaire, modes.js) : les quantités tenues par l'application et les derniers
// changements. En lecture seule : seul le narrateur fait gagner ou perdre quelque chose, par sa balise.
import { invOf, invText } from './modes.js';
import { app } from './state.js';
import { $, el, orNote } from './util.js';

const fill = () => {
  const { items, log } = invOf(app.cur.messages);
  $('#invl').replaceChildren(
    ...orNote(
      items.map(x =>
        el(
          'div',
          { class: 'shr' + (x.n ? '' : ' none') },
          el('span', { text: x.k }),
          el('b', { text: x.max != null ? x.n + ' / ' + x.max : String(x.n) })
        )
      ),
      'Inventaire vide.'
    )
  );
  const last = log.slice(-10).reverse();
  $('#invr').replaceChildren(
    ...orNote(
      last.map(c => el('span', { class: 'jt' + (c.d < 0 ? ' ko' : '') }, invText([[c.k, c.d]]))),
      'Aucun changement pour l’instant.'
    )
  );
};
$('#minv').onclick = () => {
  $('#dmn').close();
  fill();
  $('#dinv').showModal();
};
