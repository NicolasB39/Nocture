import { memsOf, sameName } from './memory.js';
import { inScene } from './prompt.js';
import { KNEES, decorNow, momentNow, scene, zoomScene } from './scene.js';
import { app, ctx, playerName, S } from './state.js';
import { $, el, hue, ic, initial, plain } from './util.js';

const urlOf = code => (ctx.images || []).find(x => x.code == code)?.url || '';
const label = (c, code) => {
  const p = c.name.toLowerCase() + '_',
    t = (code.startsWith(p) ? code.slice(p.length) : code).replace(/[_-]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const rels = () => Object.entries(app.cur?.mem?.relations || {});
const relOf = name => rels().find(([k]) => sameName(k, name))?.[1] || '';

const dec = () => decorNow(app.cur?.messages || []);

export const face = c => {
  const u = c.images?.length ? urlOf(c.images[0]) : '';
  return u
    ? scene(u, dec(), { x: 0.5, fill: 1.9, top: 0.06, sa: 1, cls: 'pav av' })
    : el('span', { class: 'pav', style: '--h:' + hue(c.name), 'aria-hidden': 'true', text: initial(c.name) });
};

const row = (c, i, on, open) => {
  const id = 'pcp' + i,
    rel = relOf(c.name),
    mems = memsOf(app.cur?.mem?.memories, c.name).slice(-5),
    imgs = (c.images || []).filter(urlOf);
  const pan = el(
    'div',
    { class: 'pcp', id, hidden: !open },
    imgs.length
      ? el(
          'div',
          { class: 'pcg' },
          imgs.map(code =>
            el(
              'button',
              {
                class: 'pci',
                'aria-label': 'Agrandir : ' + label(c, code),
                onclick: e => zoomScene(e.currentTarget.querySelector('.scn'))
              },
              // Même cadrage que dans le récit (Réglages › Lecture) ; l'agrandissement montre toujours le personnage en pied.
              scene(urlOf(code), dec(), { x: 0.5, sa: 21 / 9, ...(S.fullBody ? { fill: 0.92, cls: 'tile' } : { ...KNEES, cls: 'tile kn' }) }),
              el('span', { text: label(c, code) })
            )
          )
        )
      : null,
    el(
      'div',
      { class: 'pcr' },
      el('span', { class: 'stl', text: 'Relation avec vous' }),
      el('p', { class: rel ? '' : 'none', text: rel || 'Aucune relation mémorisée pour l’instant.' })
    ),
    // Ce que la mémoire a retenu à son sujet : les cinq derniers souvenirs qui le citent.
    mems.length
      ? el('div', { class: 'pcr pcs' }, el('span', { class: 'stl', text: 'Souvenirs' }), el('ul', null, mems.map(t => el('li', { text: t }))))
      : null
  );
  const btn = el(
    'button',
    { class: 'pch', 'aria-expanded': open ? 'true' : 'false', 'aria-controls': id },
    face(c),
    el(
      'span',
      { class: 'pct' },
      el('span', { class: 'pcn' }, el('b', { text: c.name }), on ? el('span', { class: 'tag', text: 'En scène' }) : null),
      // Le résumé peut nommer le joueur ({{user}}), comme le reste du texte affiché.
      c.sum ? el('small', { text: plain(c.sum, playerName(app.cur)) }) : null
    ),
    ic('chevr', 18)
  );
  btn.onclick = () => {
    const o = btn.getAttribute('aria-expanded') != 'true';
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    pan.hidden = !o;
  };
  return el('div', { class: 'pc' }, btn, pan);
};

export function view() {
  const C = ctx.chars || [],
    act = new Set(inScene(app.cur?.messages?.slice(-6) || []).map(c => c.name)),
    order = [...C.filter(c => act.has(c.name)), ...C.filter(c => !act.has(c.name))],
    met = rels().filter(([k]) => !C.some(c => sameName(c.name, k)));
  $('#pes').textContent = C.length
    ? C.length + (C.length > 1 ? ' personnages' : ' personnage') + (act.size ? ' · ' + act.size + ' en scène' : '')
    : 'Ce scénario n’a pas de fiches de personnages.';
  const parts = [
    ...order.map((c, i) => row(c, i, act.has(c.name), i == 0 && act.has(c.name))),
    met.length
      ? el(
          'div',
          { class: 'pcx' },
          el('span', { class: 'stl', text: 'Personnes croisées' }),
          el(
            'div',
            { class: 'pcm' },
            met.map(([k, v]) => el('div', null, el('b', { text: k }), el('span', { text: v })))
          )
        )
      : null,
    !C.length && !met.length
      ? el('p', {
          class: 'hint',
          text: 'Les personnes que vous croiserez apparaîtront ici une fois retenues par la mémoire.'
        })
      : null
  ].filter(Boolean);
  $('#pel').replaceChildren(...parts);
}

$('#pe').onclick = () => {
  if (!app.cur) return;
  view();
  // Décors teintés par le moment présent (style.css, [data-mo]).
  $('#dpe').dataset.mo = momentNow(app.cur.messages);
  $('#dpe').showModal();
};
$('#pec').onclick = () => $('#dpe').close();
