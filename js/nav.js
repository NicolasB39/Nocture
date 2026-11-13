import { sync } from './backup.js';
import { on } from './bus.js';
import { openScenario } from './chat.js';
import { byRecent, newGame, showList } from './list.js';
import { coverOf, localTree } from './scenarios.js';
import { app } from './state.js';
import { getSome } from './store.js';
import { $, el, hue, initial, LS, toast } from './util.js';
import { readPos, WIDE } from './view.js';

export const go = async id => {
  history.pushState({ c: 1 }, '');
  await openScenario(id);
  // Histoire introuvable (supprimée ailleurs) : la bibliothèque reprend sa propre entrée d'historique.
  if (!app.cur || $('#chat').hidden) history.back();
};
on('open', go);
// Quitter la conversation : vers la bibliothèque, ou vers une autre histoire (id) dans la même entrée
// d'historique, pour que le retour mène toujours à la bibliothèque. Un tour en cours est arrêté, et attendu avant
// d'ouvrir l'autre histoire, pour que sa fin ne touche pas au nouveau fil : y compris un tour parti pendant
// l'attente (Envoyer touché juste avant). Deux changements rapprochés : le dernier l'emporte.
let to = null;
const leave = async id => {
  readPos(app.cur?.id);
  if (app.busy) app.ctl?.abort('stop');
  if (id) {
    to = id;
    while (app.busy) {
      app.ctl?.abort('stop');
      await new Promise(r => setTimeout(r, 50));
    }
    if (to != id) return;
    to = null;
    await openScenario(id);
    if (!app.cur || $('#chat').hidden) history.back();
  } else showList();
  if (LS.get('bkd')) sync();
};
// Changer d'histoire sans repasser par la bibliothèque (titre sur grand écran) : les histoires
// commencées, dans l'ordre de la liste, et celle en cours.
const SW_N = 8;
async function openSwitch() {
  const T = localTree(),
    a = await getSome(m =>
      m
        .filter(s => s.n > 0 || s.id == app.cur?.id)
        .sort(byRecent)
        .slice(0, SW_N)
    );
  $('#swl').replaceChildren(
    ...a.map(s => {
      const cv = coverOf(s, T),
        on = s.id == app.cur?.id;
      return el(
        'button',
        {
          class: 'swi' + (on ? ' on' : ''),
          'aria-current': on && 'true',
          onclick: () => {
            $('#dsw').close();
            if (!on) leave(s.id);
          }
        },
        cv
          ? el('img', { src: cv, alt: '', decoding: 'async' })
          : el('span', { class: 'pav', style: '--h:' + hue(s.name), 'aria-hidden': 'true', text: initial(s.name) }),
        el('span', { class: 'swt' }, el('b', { text: s.name }), s.pv && el('small', { text: s.pv }))
      );
    })
  );
  $('#dsw').showModal();
}
// Nouvelle partie depuis la conversation : elle s'ouvre à sa place, l'ancienne reste dans la bibliothèque.
$('#mnew').onclick = async () => {
  $('#dmn').close();
  await leave(await newGame(app.cur.id));
  toast('Nouvelle partie · l’ancienne reste dans la bibliothèque');
};
$('#sw').onclick = openSwitch;
$('#ct').onclick = () => WIDE.matches && openSwitch();
// Souris : le nom d'un bouton en bulle d'aide quand l'écran ne le montre pas déjà (icône, initiales, « A+ »),
// repris de son aria-label à chaque survol (il change parfois, comme celui d'Envoyer). Un title écrit par le
// code est gardé.
// Texte affiché d'un élément, sans ce qui est masqué aux lecteurs d'écran (numéros, initiales).
const shown = n =>
  [...n.childNodes].map(x => (x.nodeType == 3 ? x.data : x.getAttribute?.('aria-hidden') == 'true' ? '' : shown(x))).join('');
addEventListener('pointerover', e => {
  const b = e.pointerType == 'mouse' && e.target.closest?.('button[aria-label]'),
    t = b && shown(b).trim();
  if (!b || (b.title && !b.dataset.tt) || (t && b.getAttribute('aria-label').includes(t))) return;
  b.title = b.getAttribute('aria-label');
  b.dataset.tt = '1';
});
$('#back').onclick = () => (history.state?.c ? history.back() : leave());
addEventListener('visibilitychange', () => {
  if (document.visibilityState == 'hidden') readPos(app.cur?.id);
});
let skip = false;
const open = () => document.querySelector('dialog[open]');
const sm = HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal = function () {
  sm.call(this);
  if (!history.state?.d) history.pushState({ ...history.state, d: 1 }, '');
};
document.addEventListener(
  'close',
  () =>
    setTimeout(() => {
      if (!open() && history.state?.d) {
        skip = true;
        history.back();
      }
    }),
  true
);
// Menus et feuilles de lecture (closedby="any") : un toucher sur le fond assombri les ferme, comme sur le
// téléphone. Le navigateur le fait lui-même quand il connaît closedby ; ce repli sert aux autres (Safari). Appui et
// relâcher hors de la feuille tous les deux, pour qu'un glissement commencé dedans ne la ferme pas. Jamais une
// feuille où l'on écrit (réglages, modification d'un message…) : un toucher maladroit ferait perdre la saisie.
const outside = (d, e) => {
  const r = d.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};
let downOut = null;
document.addEventListener('pointerdown', e => {
  const d = e.target;
  downOut = d instanceof HTMLDialogElement && d.open && d.hasAttribute('closedby') && outside(d, e) ? d : null;
});
document.addEventListener('pointerup', e => {
  const d = downOut;
  downOut = null;
  if (d?.open && e.target === d && outside(d, e)) d.close();
});
// Feuilles : tirer leur haut (poignée, titre) vers le bas les ferme ; un geste vif suffit, sans aller jusqu'en bas.
// Au doigt seulement : à la souris, les feuilles n'ont pas de poignée. Vers le haut, la feuille résiste. Pas sur
// grand écran, où la fenêtre est centrée (elle se ferme en fondu, pas en glissant), ni depuis le fond assombri.
const CENTRE = matchMedia('(min-width: 640px)');
document.addEventListener(
  'touchstart',
  e => {
    const d = e.target.closest?.('dialog[open]');
    if (!d || d.id == 'dpic' || CENTRE.matches || e.touches.length > 1 || d.scrollTop > 0) return;
    const r = d.getBoundingClientRect(),
      y = e.touches[0].clientY - r.top;
    if (y < 0 || y > 64) return;
    if (e.target.closest('button, input, select, textarea, a, summary, label')) return;
    const y0 = e.touches[0].clientY;
    // Vitesse au lâcher : celle du dernier mouvement, nulle si le doigt s'est arrêté avant de se lever.
    let dy = 0,
      v = 0,
      ly = y0,
      lt = e.timeStamp;
    const ac = new AbortController(),
      o = { signal: ac.signal };
    d.style.transition = 'none';
    const move = ev => {
      if (ev.touches.length > 1) return;
      ev.preventDefault();
      const cy = ev.touches[0].clientY;
      v = (cy - ly) / Math.max(1, ev.timeStamp - lt);
      ly = cy;
      lt = ev.timeStamp;
      dy = cy - y0;
      d.style.transform = 'translateY(' + (dy > 0 ? dy : -Math.sqrt(-dy)) + 'px)';
    };
    const end = ev => {
      ac.abort();
      if (ev.timeStamp - lt > 100) v = 0;
      // La transition reprend de là où le doigt a lâché : vers le bas pour fermer, sinon retour en place.
      d.style.transition = d.style.transform = '';
      if (ev.type == 'touchend' && (dy > Math.min(140, r.height / 3) || (dy > 24 && v > 0.3))) d.close();
    };
    addEventListener('touchmove', move, { ...o, passive: false });
    addEventListener('touchend', end, o);
    addEventListener('touchcancel', end, o);
  },
  { passive: true }
);
addEventListener('popstate', () => {
  if (skip) {
    skip = false;
    return;
  }
  const d = [...document.querySelectorAll('dialog[open]')].at(-1);
  if (d) {
    d.close();
    if (open()) history.pushState({ ...history.state, d: 1 }, '');
    return;
  }
  if (!$('#chat').hidden) leave();
  if (history.state?.d) {
    skip = true;
    history.back();
  }
});
