import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merge } from '../js/merge.js';

const NOW = 1700000000000;
const T = n => NOW - 1e6 + n;
const s = (id, updated, extra = {}) => ({
  id,
  name: id,
  updated,
  messages: [{ role: 'user', content: 'x' }],
  ...extra
});
const run = (loc, rem, t1 = {}, t2 = {}, seen = {}) =>
  merge(loc, rem, t1, t2, { seen, now: NOW, nid: () => 'copie' });

test('le plus récent gagne, dans les deux sens', () => {
  let r = run([s('a', T(10))], [s('a', T(20))], {}, {}, { a: T(10) });
  assert.equal(r.keep[0].updated, T(20));
  assert.deepEqual(r.toLocal.map(x => x.id), ['a']);
  assert.equal(r.up, false);

  r = run([s('a', T(30))], [s('a', T(20))], {}, {}, { a: T(20) });
  assert.equal(r.keep[0].updated, T(30));
  assert.deepEqual(r.toLocal, []);
  assert.equal(r.up, true);
});

test('sans repère, deux versions différentes divergent : la perdante est gardée en copie', () => {
  const r = run([s('a', T(10))], [s('a', T(20))]);
  assert.deepEqual(r.keep.map(x => [x.id, x.updated]), [['copie', NOW], ['a', T(20)]]);
  assert.equal(r.keep[0].name, 'a (conflit)');
  assert.deepEqual(r.copies.map(([c, src, fromR]) => [c.id, src, fromR]), [['copie', 'a', false]]);
  // Mêmes dates : même version, pas de copie.
  assert.deepEqual(run([s('a', T(10))], [s('a', T(10))]).copies, []);
});

test('un scénario présent d’un seul côté est propagé', () => {
  const r = run([s('a', T(10))], [s('b', T(10))]);
  assert.deepEqual(r.keep.map(x => x.id).sort(), ['a', 'b']);
  assert.deepEqual(r.toLocal.map(x => x.id), ['b']);
  assert.equal(r.up, true);
});

test('une tombstone postérieure supprime des deux côtés', () => {
  const r = run([s('a', T(10))], [s('a', T(10))], { a: T(50) }, {});
  assert.deepEqual(r.keep, []);
  assert.deepEqual(r.delLocal, ['a']);
  assert.equal(r.up, true);
});

test('une tombstone antérieure à une reprise ne supprime pas', () => {
  const r = run([s('a', T(80))], [], { a: T(50) }, {});
  assert.deepEqual(r.keep.map(x => x.id), ['a']);
  assert.deepEqual(r.delLocal, []);
});

test('les tombstones distantes sont fusionnées et les anciennes purgées', () => {
  const r = run([], [], { a: NOW - 1000 }, { b: NOW - 2.5e10 });
  assert.deepEqual(Object.keys(r.tomb), ['a']);
  assert.equal(r.up, true);
});

test('un scénario distant vide n’est pas synchronisé', () => {
  const r = run([], [{ id: 'g', name: 'g', updated: T(10), remote: true, messages: [] }]);
  assert.deepEqual(r.keep, []);
});

test('divergence des deux côtés : la version perdante est conservée en copie', () => {
  const r = run([s('a', T(30))], [s('a', T(20))], {}, {}, { a: T(10) });
  assert.deepEqual(
    r.keep.map(x => [x.id, x.updated]).sort(),
    [
      ['a', T(30)],
      ['copie', NOW]
    ]
  );
  assert.deepEqual(r.toLocal.map(x => x.id), ['copie']);
  assert.match(r.keep.find(x => x.id === 'copie').name, /conflit/);
  assert.equal(r.up, true);
});

test('sans divergence réelle, pas de copie', () => {
  const r = run([s('a', T(30))], [s('a', T(10))], {}, {}, { a: T(10) });
  assert.deepEqual(r.keep.map(x => x.id), ['a']);
});

test('seen renvoie la photo des versions retenues', () => {
  const r = run([s('a', T(30))], [s('b', T(40))]);
  assert.deepEqual(r.seen, { a: T(30), b: T(40) });
});

test('une histoire GitHub vidée pour recommencer est synchronisée, une jamais jouée ne l’est pas', () => {
  const g = (updated, extra) => ({ id: 'g', name: 'g', updated, remote: true, messages: [], ...extra });
  let r = run([g(T(30), { reset: T(30) })], [s('g', T(20), { remote: true })], {}, {}, { g: T(20) });
  assert.deepEqual(r.toLocal, []);
  assert.equal(r.up, true, 'la version vidée part');
  r = run([g(T(30))], [s('g', T(20), { remote: true })], {}, {}, { g: T(20) });
  assert.deepEqual(r.toLocal.map(x => x.id), ['g'], 'jamais jouée : la version distante arrive');
});
