import { fr } from './format.js';
import { jourLabel } from './scene.js';
import { el } from './util.js';

// Écran de passage : quand le lieu change (annoncé en tête de réponse) ou que le jour change, le décor du lieu
// remplit l'écran avec son titre, comme un changement de chapitre, puis s'efface. Un toucher le passe. Sans
// décor, le titre seul sur fond sombre. Décoratif (aria-hidden) : l'intertitre du récit dit déjà le lieu.
// Posé dans #chat : il prend la couleur de l'histoire et disparaît avec la conversation.
const T = 2800;
export const passageOff = () => document.querySelector('.pass')?.remove();
export function passage({ lieu = '', jour = '', d = '', mo = '' }) {
  const j = jourLabel(jour);
  if (!lieu && !j) return;
  passageOff();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches,
    dec = d && el('div', { class: 'dec' }, el('img', { src: d, alt: '' })),
    gl = el('i'),
    tt = el('div', { class: 'pst' }, lieu && j && el('small', { text: fr(j) }), el('b', { text: fr(lieu || j) }), gl),
    o = el('div', { class: 'pass', 'aria-hidden': 'true', data: { mo } }, dec, tt),
    op = { duration: T, easing: 'ease-in-out', fill: 'both' };
  document.querySelector('#chat').append(o);
  const an = [o.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], op)];
  if (!still) {
    if (dec) an.push(dec.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], { ...op, easing: 'ease-out' }));
    const up = { opacity: 0, transform: 'translateY(12px)' },
      in0 = { transform: 'scaleX(0)' };
    an.push(
      tt.animate([up, { ...up, offset: 0.12 }, { opacity: 1, transform: 'none', offset: 0.3 }, { opacity: 1, transform: 'none' }], op),
      gl.animate([in0, { ...in0, offset: 0.25 }, { transform: 'none', offset: 0.45 }, { transform: 'none' }], op)
    );
  }
  an[0].onfinish = () => o.remove();
  o.onclick = () => an.forEach(a => a.finish());
}
