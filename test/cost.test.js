import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { costMap, costOf, money, parseAmount, priceOf } from '../js/cost.js';
import { SESSION, clear, merge, record, total, watch } from '../js/stats.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' ≠ ' + b);

beforeEach(() => {
  watch(null);
  clear();
});

test('priceOf : tarif public, y compris pour un identifiant daté', () => {
  assert.deepEqual(priceOf('claude-sonnet-5-5'), [2, 10, 0.1]);
  assert.deepEqual(priceOf('claude-haiku-4-5-20251001'), [1, 5, 0.1]);
  assert.equal(priceOf('claude-inconnu-9'), null);
  assert.deepEqual(priceOf('claude-opus-5-5-x'), [4, 20, 0.2], 'pas confondu avec claude-opus-5');
});

test('costOf compte à part le cache lu et écrit', () => {
  // 1 M en entrée dont 600 k lus et 100 k écrits (5 min), 100 k en sortie, au tarif de Sonnet 5.5.
  const e = [1e6, 1e5, 3, 0, 6e5, 1e5, 0];
  near(costOf(e, [2, 10, 0.2]), (3e5 * 2 + 6e5 * 0.2 + 1e5 * 2 * 1.25 + 1e5 * 10) / 1e6);
  // Écriture d'une heure : deux fois l'entrée.
  near(costOf([1e6, 0, 1, 0, 0, 0, 1e6], [2, 10, 0.2]), 4);
  // Entrée sans les cases du cache.
  near(costOf([2e6, 1e6, 1, 0], [0.5, 1, 0.05]), 2);
  assert.equal(costOf([1, 1, 1, 0], null), null);
});

test('costMap additionne les modèles tarifés et liste les autres', () => {
  const m = { 'claude-haiku-5-5': [1e6, 1e6, 1, 0], 'claude-inconnu-9': [5, 5, 1, 0] };
  const r = costMap(m);
  near(r.sum, 0.6);
  assert.ok(r.any);
  assert.deepEqual(r.unknown, ['claude-inconnu-9']);
  assert.deepEqual(costMap({}), { sum: 0, any: false, unknown: [] });
});

test('money : dollars par défaut, euros avec un taux, plus de décimales pour les petites sommes', () => {
  assert.equal(money(1.5).replace(/\s/g, ' '), '1,50 $');
  assert.equal(money(2, 0.9).replace(/\s/g, ' '), '1,80 €');
  assert.equal(money(0.0123).replace(/\s/g, ' '), '0,012 $');
  assert.equal(money(0).replace(/\s/g, ' '), '0,00 $');
});

test('record garde le cache lu et écrit, et les totaux restent compatibles', () => {
  record('a', [1000, 100, 1, 0, 600, 50, 0]);
  record('a', [1000, 100, 1, 0, 400, 0, 20]);
  record('b', [10, 5, 1, 0]);
  assert.deepEqual(SESSION['a'], [2000, 200, 2, 0, 1000, 50, 20]);
  assert.deepEqual(SESSION['b'], [10, 5, 1, 0], 'sans cache, l’entrée garde quatre cases');
  assert.deepEqual(total(SESSION), [2010, 205, 3, 0, 1000, 50, 20]);
  assert.deepEqual(merge({ k: [1, 1, 1, 0] }, { k: [1, 1, 1, 0, 3] }).k, [2, 2, 2, 0, 3]);
});

test('montants : unités et espaces acceptés, illisible ou nul refusé', () => {
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('15 €'), 15);
  assert.equal(parseAmount('1 000'), 1000);
  assert.equal(parseAmount('1 000,50 €'), 1000.5);
  assert.equal(parseAmount('0,92'), 0.92);
  assert.equal(parseAmount('$7.5'), 7.5);
  assert.equal(parseAmount('dix'), undefined);
  assert.equal(parseAmount('0'), undefined);
  assert.equal(parseAmount('2 / 10'), undefined);
});
