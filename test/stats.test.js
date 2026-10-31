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
  splitKey,
  total,
  usageOf,
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

test('le fournisseur se sépare du modèle au premier slash seulement', () => {
  assert.deepEqual(splitKey('groq/llama-3.3-70b'), ['groq', 'llama-3.3-70b']);
  assert.deepEqual(splitKey('openrouter/meta-llama/llama-4'), ['openrouter', 'meta-llama/llama-4']);
  assert.deepEqual(splitKey('sans-slash'), ['', 'sans-slash']);
});

test('usageOf lit entrée et sortie, et compte la réflexion cachée dans le total', () => {
  assert.deepEqual(usageOf({ prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 }), [100, 40]);
  assert.deepEqual(usageOf({ prompt_tokens: 100, completion_tokens: 40, total_tokens: 300 }), [100, 200]);
  assert.deepEqual(usageOf({ total_tokens: 90 }), [0, 90]);
  assert.equal(usageOf(null), null);
  assert.equal(usageOf({}), null);
});

test('record cumule par jour, par modèle et pour la session', () => {
  record('groq/a', 100, 50, false, at(2026, 10, 25));
  record('groq/a', 10, 5, false, at(2026, 10, 25));
  record('groq/b', 7, 3, true, at(2026, 10, 25));
  record('groq/a', 1, 1, false, at(2026, 10, 26));
  assert.deepEqual(dayMap('2026-10-25')['groq/a'], [110, 55, 2, 0]);
  assert.deepEqual(dayMap('2026-10-25')['groq/b'], [7, 3, 1, 1]);
  assert.deepEqual(total(dayMap('2026-10-25')), [117, 58, 3, 1]);
  assert.deepEqual(SESSION['groq/a'], [111, 56, 3, 0]);
});

test('un enregistrement vide est ignoré', () => {
  record('groq/a', 0, 0);
  assert.deepEqual(STATS.d, {});
  assert.deepEqual(SESSION, {});
});

test('le mois additionne ses jours et pas ceux du mois voisin', () => {
  record('groq/a', 10, 0, false, at(2026, 10, 1));
  record('groq/a', 20, 0, false, at(2026, 10, 31));
  record('groq/a', 99, 0, false, at(2026, 11, 1));
  assert.equal(monthMap('2026-10')['groq/a'][0], 30);
  assert.equal(monthMap('2026-11')['groq/a'][0], 99);
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
  record('groq/a', 1, 1);
  record('groq/a', 1, 1);
  assert.equal(n, 2);
});

test('shift fusionne les comptes de deux fenêtres sans toucher l’original', async () => {
  const { shift } = await import('../js/stats.js');
  const base = { '2026-10-30': { 'groq/m': [100, 10, 1, 0] } },
    mine = { '2026-10-30': { 'groq/m': [300, 30, 3, 1] }, '2026-10-31': { 'groq/m': [5, 5, 1, 0] } },
    saved = { '2026-10-30': { 'groq/m': [150, 15, 2, 0], 'claude/x': [9, 9, 1, 0, 4] } };
  const r = shift(saved, shift(mine, base, -1));
  assert.deepEqual(r, {
    '2026-10-30': { 'groq/m': [350, 35, 4, 1], 'claude/x': [9, 9, 1, 0, 4] },
    '2026-10-31': { 'groq/m': [5, 5, 1, 0] }
  });
  assert.deepEqual(saved['2026-10-30']['groq/m'], [150, 15, 2, 0]);
});
