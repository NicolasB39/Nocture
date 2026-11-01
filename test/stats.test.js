import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import {
  SESSION,
  STATS,
  clear,
  dayKey,
  dayMap,
  load,
  merge,
  monthDays,
  monthMap,
  record,
  total,
  watch
} from '../js/stats.js';

beforeEach(() => {
  watch(null);
  clear();
});

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

test('la clé de jour suit l’heure locale', () => {
  assert.equal(dayKey(at(2026, 10, 25, 23)), '2026-10-25');
  assert.equal(dayKey(at(2026, 10, 26, 0)), '2026-10-26');
  assert.equal(dayKey(at(2026, 1, 5)), '2026-01-05');
});

test('record cumule par jour, par modèle et pour la session', () => {
  record('a', [100, 50, 1, 0], at(2026, 10, 25));
  record('a', [10, 5, 1, 0], at(2026, 10, 25));
  record('b', [7, 3, 1, 1], at(2026, 10, 25));
  record('a', [1, 1, 1, 0], at(2026, 10, 26));
  assert.deepEqual(dayMap('2026-10-25')['a'], [110, 55, 2, 0]);
  assert.deepEqual(dayMap('2026-10-25')['b'], [7, 3, 1, 1]);
  assert.deepEqual(total(dayMap('2026-10-25')), [117, 58, 3, 1]);
  assert.deepEqual(SESSION['a'], [111, 56, 3, 0]);
});

test('un enregistrement vide est ignoré', () => {
  record('a', [0, 0, 1, 0]);
  assert.deepEqual(STATS.d, {});
  assert.deepEqual(SESSION, {});
});

test('le mois additionne ses jours et pas ceux du mois voisin', () => {
  record('a', [10, 0, 1, 0], at(2026, 10, 1));
  record('a', [20, 0, 1, 0], at(2026, 10, 31));
  record('a', [99, 0, 1, 0], at(2026, 11, 1));
  assert.equal(monthMap('2026-10')['a'][0], 30);
  assert.equal(monthMap('2026-11')['a'][0], 99);
  const ds = monthDays('2026-10');
  assert.equal(ds.length, 31);
  assert.equal(ds[0][0], '2026-10-01');
  assert.equal(ds[30][1][0], 20);
  assert.equal(monthDays('2026-02').length, 28);
});

test('load remplace l’historique et ignore une valeur invalide', () => {
  load({ v: 1, d: { '2026-01-01': { 'x/y': [1, 2, 3, 0] } } });
  assert.deepEqual(dayMap('2026-01-01')['x/y'], [1, 2, 3, 0]);
  load(null);
  load({ d: 5 });
  assert.deepEqual(dayMap('2026-01-01')['x/y'], [1, 2, 3, 0]);
});

test('merge additionne sans modifier ses entrées', () => {
  const a = { k: [1, 1, 1, 0] },
    b = { k: [2, 2, 2, 1], z: [5, 5, 5, 0] };
  const m = merge(a, b);
  assert.deepEqual(m.k, [3, 3, 3, 1]);
  assert.deepEqual(a.k, [1, 1, 1, 0]);
});

test('le crochet de sauvegarde est appelé à chaque enregistrement', () => {
  let n = 0;
  watch(() => n++);
  record('a', [1, 1, 1, 0]);
  record('a', [1, 1, 1, 0]);
  assert.equal(n, 2);
});

test('shift fusionne les comptes de deux fenêtres sans toucher l’original', async () => {
  const { shift } = await import('../js/stats.js');
  const base = { '2026-10-30': { 'm': [100, 10, 1, 0] } },
    mine = { '2026-10-30': { 'm': [300, 30, 3, 1] }, '2026-10-31': { 'm': [5, 5, 1, 0] } },
    saved = { '2026-10-30': { 'm': [150, 15, 2, 0], 'x': [9, 9, 1, 0, 4] } };
  const r = shift(saved, shift(mine, base, -1));
  assert.deepEqual(r, {
    '2026-10-30': { 'm': [350, 35, 4, 1], 'x': [9, 9, 1, 0, 4] },
    '2026-10-31': { 'm': [5, 5, 1, 0] }
  });
  assert.deepEqual(saved['2026-10-30']['m'], [150, 15, 2, 0]);
});
