import { readPos, stopSpeech } from './read.js';
import { sync } from './backup.js';
import { on } from './bus.js';
import { openScenario } from './chat.js';
import { byRecent, showList } from './list.js';
import { coverOf, localTree } from './scenarios.js';
import { app } from './state.js';
import { getSome } from './store.js';
import { $, el, hue, initial, LS } from './util.js';
import { WIDE } from './view.js';

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
  stopSpeech();
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
// Changer d'histoire sans repasser par la bibliothèque (titre sur grand écran, ou Ctrl+K) : les histoires
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
$('#sw').onclick = openSwitch;
$('#ct').onclick = () => WIDE.matches && openSwitch();
$('#swc').onclick = () => $('#dsw').close();
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
addEventListener('keydown', e => {
  if (e.defaultPrevented) return;
  // Ctrl+K (Cmd+K) : changer d'histoire dans une conversation, chercher dans la bibliothèque.
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() == 'k' && !document.querySelector('dialog[open]')) {
    e.preventDefault();
    if (!$('#chat').hidden) openSwitch();
    else $('#q').focus();
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target,
    g = t.tagName;
  if (g == 'INPUT' || g == 'TEXTAREA' || g == 'SELECT' || t.isContentEditable) return;
  if (document.querySelector('dialog[open]')) return;
  if (e.key == '/' && !$('#list').hidden) {
    e.preventDefault();
    $('#q').focus();
  } else if (e.key == 'Escape' && !$('#chat').hidden) $('#back').click();
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
