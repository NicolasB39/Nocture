import assert from 'node:assert/strict';
import test from 'node:test';
import './stub.js';

const node = tag => ({
  tagName: String(tag).toUpperCase(),
  kids: [],
  dataset: {},
  style: {},
  attrs: {},
  hidden: false,
  disabled: false,
  textContent: '',
  className: '',
  append(...x) {
    this.kids.push(...x);
  },
  replaceChildren(...x) {
    for (const k of x) assert.ok(k && typeof k == 'object' && k.tagName, 'enfant invalide : ' + String(k));
    this.kids = x;
  },
  setAttribute(k, v) {
    this.attrs[k] = v;
  },
  querySelectorAll: () => [],
  showModal() {},
  close() {}
});
const reg = {};
globalThis.document = {
  createElement: node,
  querySelector: s => (reg[s] ??= node('x')),
  querySelectorAll: () => []
};

const { view } = await import('../js/statview.js');
const { record, clear } = await import('../js/stats.js');

const texts = n => [n.textContent, ...n.kids.flatMap(k => (typeof k == 'object' ? texts(k) : []))];

test('la feuille se construit sans enfant invalide, vide comme remplie', () => {
  clear();
  view();
  assert.ok(texts(reg['#usv']).some(t => /Rien depuis/.test(t)));

  record('claude-sonnet-5-5', [1200, 300, 1, 0]);
  record('claude-haiku-5-5', [50, 20, 1, 1]);
  view();
  const all = texts(reg['#usv']).join('|');
  assert.match(all, /claude-sonnet-5-5/);
  assert.match(all, /claude-haiku-5-5/);
  assert.match(all, /estimée/);
  assert.doesNotMatch(all, /null|object/);
});

test('les boutons de période déclenchent chaque vue sans erreur', () => {
  record('a', [10, 5, 1, 0]);
  for (const m of ['day', 'month', 'all', 'session']) {
    reg['#ust'].onclick({ target: { closest: () => ({ dataset: { m } }) } });
    assert.ok(reg['#usv'].kids.length > 0);
  }
  reg['#ust'].onclick({ target: { closest: () => ({ dataset: { m: 'day' } }) } });
  reg['#usp'].onclick();
  assert.match(reg['#usl'].textContent, /^[A-ZÉÈÀ]/);
  assert.doesNotMatch(reg['#usl'].textContent, /\b[A-Z][a-zéû]+ [A-Z][a-zéû]+ \d/);
});
