import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.document = { createElement: () => ({}), querySelector: () => null, querySelectorAll: () => [] };
globalThis.matchMedia = () => ({ matches: false });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { batchGuard } = await import('../js/ai.js');

const story = () => ({
  id: 'a',
  messages: Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i })),
  mem: { summary: 'résumé', memories: ['un fait'], upto: 10 }
});

test('un lot de résumé reste valable si rien ne change, ou si la suite change hors du lot', () => {
  const s = story(),
    stale = batchGuard(s, 10);
  assert.equal(stale(s), false);
  s.messages.splice(25);
  s.messages.at(-1).content = 'réécrit';
  assert.equal(stale(s), false, 'messages après le lot');
  assert.equal(stale(null), false, 'histoire fermée');
});

test('un lot de résumé ne vaut plus si le lot ou la mémoire changent pendant l’appel', () => {
  const cases = {
    'suppression dans le lot': s => s.messages.splice(15),
    'suppression avant le lot': s => {
      s.messages.splice(5);
      s.mem.upto = 5;
    },
    'message du lot modifié': s => (s.messages[12].content = 'autre'),
    'variante choisie dans le lot': s => (s.messages[13] = { ...s.messages[13], content: 'variante' }),
    'résumé corrigé à la main': s => (s.mem.summary = 'corrigé'),
    'souvenirs enregistrés': s => (s.mem.memories = [...s.mem.memories])
  };
  for (const [name, change] of Object.entries(cases)) {
    const s = story(),
      stale = batchGuard(s, 10);
    change(s);
    assert.equal(stale(s), true, name);
  }
});

test('un lot de résumé ne vaut plus si l’histoire ouverte a été rechargée', () => {
  const s = story(),
    stale = batchGuard(s, 10);
  assert.equal(stale({ ...s }), true);
  assert.equal(stale({ id: 'b' }), false, 'une autre histoire ouverte');
});
