import './stub.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { deltas, invOf, linksOf, modesTail, parseInv, parseLiens, stepsOf } from '../js/modes.js';
import { raw, setBody, split } from '../js/format.js';
import { protocol } from '../js/protocol.js';
import { clean } from '../js/store.js';
import { ctx } from '../js/state.js';

const a = (inv, extra = {}) => ({ role: 'assistant', content: 'x', ...(inv ? { inv } : {}), ...extra });

beforeEach(() => {
  Object.assign(ctx, { chars: [{ name: 'Inès' }, { name: 'Renard' }], inv: [], liens: null });
});

test('changements écrits par le narrateur, sous plusieurs formes', () => {
  assert.deepEqual(deltas('+1 Corde, −5 Or, -2 Rations'), [['Corde', 1], ['Or', -5], ['Rations', -2]]);
  assert.deepEqual(deltas('Corde +1 ; Inès : −1\n+ Lanterne'), [['Corde', 1], ['Inès', -1], ['Lanterne', 1]]);
  assert.deepEqual(deltas('rien à signaler'), []);
  assert.deepEqual(deltas('\n- Inès +1\n- +1 Corde\n– 2 Or'), [['Inès', 1], ['Corde', 1], ['Or', -2]], 'puces et tiret court');
});

test('inventaire.md : quantités, bornes et baisse par jour', () => {
  assert.deepEqual(parseInv('# départ\n- Or: 20\nÉnergie : 10/10\nRations: 3, −1 par jour\nn’importe quoi'), [
    { k: 'Or', n: 20, max: null, day: 0 },
    { k: 'Énergie', n: 10, max: 10, day: 0 },
    { k: 'Rations', n: 3, max: null, day: 1 }
  ]);
});

test('inventaire : changements appliqués, dépense impossible ignorée, borne, baisse quand le Jour avance', () => {
  const base = parseInv('Or: 20\nÉnergie: 8/10\nRations: 3, −1 par jour');
  const ms = [
    a([['Or', -5], ['Corde', 1]], { state: [['Jour', '1']] }),
    { role: 'user', content: 'Je paie.' },
    a([['Or', -30], ['Énergie', 5]]),
    a(null, { state: [['Jour', 'Jour 3']] }),
    a([['Rations', -1], ['Torche', -1]])
  ];
  const { items, log } = invOf(ms, base);
  const q = Object.fromEntries(items.map(x => [x.k, x.n]));
  assert.deepEqual(q, { Or: 15, Énergie: 10, Rations: 0, Corde: 1 });
  assert.ok(!log.some(c => c.k == 'Or' && c.d == -30), 'dépense impossible ignorée');
  // Les quantités suivent l'historique : sans les derniers messages, la baisse n'a pas eu lieu.
  assert.equal(invOf(ms, base, 3).items.find(x => x.k == 'Rations').n, 3);
});

test('liens : échelle, personnages à fiche seulement, bornes et paliers', () => {
  const L = parseLiens('Échelle : −2 à 2\nInès, à +2 : elle révèle son secret\nRenard, à −2 : il vous dénonce');
  assert.deepEqual([L.min, L.max], [-2, 2]);
  const ms = [{ role: 'assistant', content: 'x', links: [['Inès', 1], ['Inconnu', 1]] }, { role: 'assistant', content: 'y', links: [['ines', 3], ['Renard', -1]] }];
  const { v } = linksOf(ms, ctx.chars, L);
  assert.deepEqual([...v], [['Inès', 2], ['Renard', -1]]);
  assert.deepEqual(stepsOf('Inès', 2, L).map(s => s.text), ['elle révèle son secret']);
  assert.deepEqual(stepsOf('Renard', -1, L), []);
  assert.deepEqual([parseLiens('').min, parseLiens('').max], [-3, 3], 'échelle par défaut');
  const J = [{ name: 'Jean' }, { name: 'Jean-Pierre' }];
  assert.deepEqual([...linksOf([{ role: 'assistant', content: 'x', links: [['Jean-Pierre', 1]] }], J, L).v], [['Jean', 0], ['Jean-Pierre', 1]], 'nom exact d’abord');
});

test('balises retirées du récit, rangées dans la réponse, remises à l’édition et gardées au chargement', () => {
  const p = split('Il trouve une corde.\n\n<inventaire>+1 Corde, −5 Or</inventaire>\n<lien>Inès +1</lien>');
  assert.equal(p.content, 'Il trouve une corde.');
  assert.deepEqual(p.inv, [['Corde', 1], ['Or', -5]]);
  assert.deepEqual(p.links, [['Inès', 1]]);
  const m = { role: 'assistant', content: '' };
  setBody(m, p);
  assert.deepEqual(split(raw(m)).inv, p.inv, 'aller-retour par l’édition');
  assert.deepEqual(split(raw(m)).links, p.links);
  const c = clean({ id: 'x', messages: [{ ...m, inv: [...m.inv, ['bad', 1.5], 'x'] }] });
  assert.deepEqual(c.messages[0].inv, p.inv);
  assert.deepEqual(c.messages[0].links, p.links);
  // Balise jamais fermée : la fin de sa ligne seulement.
  const u = split('Il avance.\n<lien>Inès +1\nLa nuit tombe.');
  assert.deepEqual(u.links, [['Inès', 1]]);
  assert.match(u.content, /La nuit tombe\./);
});

test('consignes et fin de requête seulement quand le scénario a le mode', () => {
  assert.doesNotMatch(protocol({}), /# Inventaire|# Liens/);
  assert.match(protocol({ inv: true, liens: { min: -3, max: 3 } }), /# Inventaire[\s\S]*<inventaire>\+1 Corde[\s\S]*# Liens[\s\S]*de -3 \(hostile\) à 3/);
  Object.assign(ctx, { inv: parseInv('Or: 20'), liens: parseLiens('Inès, à +1 : elle sourit') });
  const s = { remote: true, messages: [a([['Or', -2]], { links: [['Inès', 1]] })] };
  const t = modesTail(s);
  assert.match(t, /<inventaire_actuel>\nOr: 18\n<\/inventaire_actuel>/);
  assert.match(t, /<liens>\nInès : \+1 \(palier atteint : elle sourit\)\nRenard : 0\n<\/liens>/);
  assert.equal(modesTail({ remote: false, messages: [] }), '');
});
