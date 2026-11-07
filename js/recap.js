import { chat, memModel } from './ai.js';
import { face } from './cast.js';
import { fr, lastEtat, line } from './format.js';
import { inScene } from './prompt.js';
import { jourLabel, jourOf, lieuOf } from './scene.js';
import { playerName } from './state.js';
import { $, ago, el, plain } from './util.js';

// « Précédemment » : en rouvrant une histoire après une pause (GAP), un encart en tête rappelle où l'on en
// était, sans appel à l'IA : depuis quand, où, qui est en scène, et les dernières phrases du narrateur.
// « Résumer » demande au modèle de la mémoire (petit, peu coûteux) un vrai résumé des derniers échanges.
// Il ne vaut que pour le fil tel qu'il était à l'ouverture : render() le retire dès que le fil change (envoi,
// suppression, variante, modification, mise à jour venue d'un autre appareil).
const GAP = 6 * 3600e3;
// Empreinte du fil : nombre de messages, et texte, état et choix du dernier (l'encart montre son lieu).
const keyOf = s => {
  const m = s.messages.at(-1);
  return s.messages.length + ':' + JSON.stringify(m ? [m.content, m.state, m.choices] : null);
};
export const recapCheck = s => {
  const c = document.querySelector('#prev');
  if (c && (!s || c._k !== keyOf(s))) c.remove();
};
// Dernières phrases d'un texte, environ 200 caractères, avec ce qui ferme une phrase (guillemet, fin
// d'italique), et la fin du texte même sans ponctuation : c'est là que l'histoire s'est arrêtée.
const tail = t => {
  const s = t.replace(/\s+/g, ' ').match(/[^.!?…]+(?:[.!?…]+[»"*_)]*\s*|$)/g) || [t];
  let o = '';
  for (let i = s.length - 1; i >= 0 && o.length < 200; i--) o = s[i] + o;
  return o.trim();
};
// Pas $ : l'encart est souvent absent, et $ signalerait un élément manquant (mise à jour incomplète).
export const recapOff = () => document.querySelector('#prev')?.remove();
export function recap(s) {
  recapOff();
  const ms = s.messages,
    m = ms.findLast(x => x.role == 'assistant'),
    t = ms.at(-1)?.t;
  if (!m || !t || Date.now() - t < GAP) return;
  const st = lastEtat(ms),
    where = [lieuOf(st), jourLabel(jourOf(st))].filter(Boolean).join(', '),
    who = inScene(ms.slice(-6)).slice(0, 4),
    nm = playerName(s),
    p = el('p', { class: 'pvt', tabindex: '-1', 'aria-live': 'polite' }, line(tail(plain(m.content, nm)))),
    sum = el('button', { class: 'pvs', text: 'Résumer' }),
    card = el(
      'aside',
      { id: 'prev', 'aria-label': 'Précédemment' },
      el('div', { class: 'pvh' }, el('b', { text: 'Précédemment' }), el('small', { text: ago(t) + (where ? ' · ' + fr(where) : '') })),
      p,
      el(
        'div',
        { class: 'pvf' },
        el('span', { class: 'pvw' }, who.map(face)),
        sum,
        el('button', { class: 'pvc', text: 'Fermer', onclick: recapOff })
      )
    );
  sum.onclick = async () => {
    card.querySelector('.pve')?.remove();
    sum.disabled = true;
    sum.textContent = 'Résumé…';
    try {
      const { t: r, cut } = await chat(
        [
          {
            role: 'system',
            content:
              'Tu écris le « Précédemment » d’une fiction interactive que le joueur reprend après une pause : deux ou trois phrases au passé composé, concrètes, sur ce qui vient de se passer et la situation où il s’est arrêté (qui est là, ce qui est en jeu). Son personnage : ' +
              (nm || 'le joueur') +
              '. Pas de titre, pas de liste.'
          },
          {
            role: 'user',
            content: ms
              .slice(-20)
              .map(x => (x.role == 'user' ? 'Joueur : ' : 'Narrateur : ') + plain(x.content, nm))
              .join('\n\n')
          }
        ],
        { model: memModel(), effort: 'low', kind: 'précédemment', sid: s.id }
      );
      if (cut) throw new Error('réponse coupée');
      if (!r.trim()) throw new Error('réponse vide');
      p.replaceChildren(...line(plain(r, nm)));
      // Le bouton disparaît : le focus passe au résumé.
      if (document.activeElement === sum) p.focus();
      sum.remove();
    } catch (e) {
      sum.disabled = false;
      sum.textContent = 'Résumer';
      p.after(el('small', { class: 'pve', text: 'Résumé impossible : ' + e.message }));
    }
  };
  card._k = keyOf(s);
  $('#mw').prepend(card);
}
