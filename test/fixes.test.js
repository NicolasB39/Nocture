import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clean } from '../js/store.js';
import { buildInfo } from '../js/prompt.js';
import { cutLines, mergeRel, unnum } from '../js/memory.js';
import { protocol } from '../js/protocol.js';
import { settled } from '../js/format.js';
import { S, ctx } from '../js/state.js';

beforeEach(() => {
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('un personnage à fiche reste protégé sous un nom reformulé', () => {
  const inc = { 'Alice, l’herboriste': 'amie' };
  for (let i = 0; i < 12; i++) inc['Garde ' + i] = 'neutre';
  const r = mergeRel({}, inc, ['Alice']);
  assert.ok(Object.keys(r).some(k => k.startsWith('Alice')));
  assert.equal(Object.keys(r).length, 12);
});

test('cutLines retire les lignes des messages supprimés', () => {
  const l = [{ i: -1, t: 'a' }, { i: 3, t: 'b' }, { i: 8, t: 'c' }];
  assert.deepEqual(cutLines(l, 5).map(x => x.t), ['a', 'b']);
  assert.deepEqual(cutLines(undefined, 5), []);
});

test('unnum retire le numéro de message recopié en tête de ligne', () => {
  for (const t of ['3. Bob arrive.', '3) Bob arrive.', '3 : Bob arrive.', '**3.** Bob arrive.', ' 10. Bob arrive.'])
    assert.equal(unnum(t), 'Bob arrive.', t);
  for (const t of ['3 gardes arrivent.', '12:30, Bob arrive.', '3.5 litres de vin.', 'Bob arrive.'])
    assert.equal(unnum(t), t, t);
});

test('les choix demandent un geste entre astérisques puis la réplique', () => {
  assert.match(protocol({ choices: true }), /\*un geste\*/);
});

test('le chargement garde toutes les relations (mergeRel les plafonne, sauf les personnages à fiche)', () => {
  const rel = Object.fromEntries(Array.from({ length: 20 }, (_, i) => ['P' + i, 'x']));
  const r = clean({ id: 'r', messages: [], mem: { relations: rel } });
  assert.equal(Object.keys(r.mem.relations).length, 20);
});

test('settled fige les paragraphes terminés, jamais une balise ni une image coupée', () => {
  assert.equal(settled('Un.\n\nDeux.\n\nTr'), 'Un.\n\nDeux.'.length);
  assert.equal(settled('Un.\n\nDeux.', 3), 3);
  assert.equal(settled('Un.\n\n<etat>\nLieu: x\n\nsuite'), 0);
  assert.equal(settled('Un.\n\n{{img::a\n\nb'), 0);
  assert.equal(settled('Un.\n\n{{img::a}}\n\nb'), 'Un.\n\n{{img::a}}'.length);
});
