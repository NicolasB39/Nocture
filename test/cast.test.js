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
    this.attrs[k] = String(v);
  },
  getAttribute(k) {
    return this.attrs[k] ?? null;
  },
  querySelectorAll: () => [],
  addEventListener() {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  showModal() {
    this.open = true;
  },
  close() {}
});
const reg = {};
globalThis.document = {
  createElement: node,
  createElementNS: (_, t) => node(t),
  querySelector: s => (reg[s] ??= node('x')),
  querySelectorAll: () => []
};

const { view } = await import('../js/cast.js');
const { app, ctx } = await import('../js/state.js');

const flat = n => [n, ...(n.kids || []).flatMap(k => (typeof k == 'object' ? flat(k) : []))];
const texts = n => flat(n).map(x => x.textContent).filter(Boolean);

const re = w => new RegExp('(^|[^a-z0-9])' + w + '(?![a-z0-9])');
const setup = () => {
  Object.assign(ctx, {
    chars: [
      { name: 'Elric', sum: 'Gardien des runes.', images: [], keys: [re('elric')] },
      { name: 'Maëlys', sum: 'Aventurière à l’armure cabossée.', images: ['maëlys_sourire', 'maëlys_colere'], keys: [re('maelys')] }
    ],
    images: [
      { code: 'maëlys_sourire', url: 'a.webp' },
      { code: 'maëlys_colere', url: 'b.webp' }
    ]
  });
  app.cur = {
    messages: [{ role: 'assistant', content: 'Maëlys sourit.' }],
    mem: { relations: { Maëlys: 'Complice, elle vous fait confiance.', 'L’aubergiste': 'vous doit une faveur' } }
  };
};

test('les personnages en scène passent en premier, déplié, avec images et relation', () => {
  setup();
  view();
  const rows = reg['#pel'].kids.filter(k => k.className == 'pc');
  assert.equal(rows.length, 2);
  const first = texts(rows[0]);
  assert.ok(first.includes('Maëlys'));
  assert.ok(first.includes('En scène'));
  assert.ok(first.includes('Complice, elle vous fait confiance.'));
  assert.ok(first.includes('Sourire') && first.includes('Colere'));
  const [btn, pan] = rows[0].kids;
  assert.equal(btn.attrs['aria-expanded'], 'true');
  assert.equal(pan.hidden, false);
  const [btn2, pan2] = rows[1].kids;
  assert.equal(btn2.attrs['aria-expanded'], 'false');
  assert.equal(pan2.hidden, true);
  assert.ok(!texts(rows[1]).includes('En scène'));
  assert.ok(texts(rows[1]).includes('Aucune relation mémorisée pour l’instant.'));
  assert.match(reg['#pes'].textContent, /2 personnages · 1 en scène/);
});

test('les relations hors distribution vont dans « Personnes croisées »', () => {
  setup();
  view();
  const all = texts(reg['#pel']);
  assert.ok(all.includes('Personnes croisées'));
  assert.ok(all.includes('L’aubergiste'));
  assert.ok(all.includes('vous doit une faveur'));
  assert.equal(all.filter(t => t == 'Maëlys').length, 1);
});

test('le bouton déplie et replie la fiche', () => {
  setup();
  view();
  const [btn, pan] = reg['#pel'].kids.find(k => k.className == 'pc').kids;
  btn.onclick();
  assert.equal(pan.hidden, true);
  assert.equal(btn.attrs['aria-expanded'], 'false');
  btn.onclick();
  assert.equal(pan.hidden, false);
});

test('un scénario sans fiches n’affiche que les personnes croisées, ou un message', () => {
  setup();
  ctx.chars = [];
  view();
  assert.match(reg['#pes'].textContent, /pas de fiches/);
  assert.ok(texts(reg['#pel']).includes('L’aubergiste'));
  app.cur.mem.relations = {};
  view();
  assert.ok(texts(reg['#pel']).some(t => /apparaîtront ici/.test(t)));
});
