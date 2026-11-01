import assert from 'node:assert/strict';
import test from 'node:test';
import { clean, forkOf } from '../js/store.js';
import { cutChapters } from '../js/memory.js';

test('chapitres : coupés avec l’histoire, nettoyés au chargement', () => {
  const C = [
    { t: 'A', s: 'a', upto: 60 },
    { t: 'B', s: 'b', upto: 120 },
    { t: 'C', s: 'c', upto: 180 }
  ];
  assert.deepEqual(cutChapters(C, 200), C);
  assert.deepEqual(cutChapters(C, 90).map(c => [c.t, c.upto]), [['A', 60], ['B', 90]], 'B contient 90 : il y finit ; C disparaît');
  assert.deepEqual(cutChapters(C, 60).map(c => c.t), ['A'], 'B commence en 60 : il disparaît');
  assert.deepEqual(cutChapters(undefined, 10), []);
  const s = clean({
    id: 'c',
    name: 'C',
    messages: Array.from({ length: 100 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i })),
    mem: { summary: '', upto: 100, chapters: [{ t: 'A', s: 'a', upto: 60 }, { t: 'B', s: 'b', upto: 150 }, { t: 'x' }, null] }
  });
  assert.deepEqual(s.mem.chapters, [{ t: 'A', s: 'a', upto: 60 }, { t: 'B', s: 'b', upto: 100 }]);
  assert.deepEqual(forkOf(s, 49, 'f', 'f2').mem.chapters, [{ t: 'A', s: 'a', upto: 50 }]);
});

const s = clean({
  id: 'a',
  name: 'Brume',
  pin: true,
  messages: Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i })),
  mem: {
    summary: 'Tout',
    upto: 8,
    win: 9,
    lines: Array.from({ length: 8 }, (_, i) => ({ i, t: 'l' + i }))
  }
});

test('la bifurcation garde les messages jusqu’au point choisi inclus', () => {
  const c = forkOf(s, 4, 'Brume (bifurcation)', 'b');
  assert.equal(c.id, 'b');
  assert.equal(c.name, 'Brume (bifurcation)');
  assert.equal(c.pin, false);
  assert.deepEqual(c.messages.map(m => m.content), ['m0', 'm1', 'm2', 'm3', 'm4']);
});

test('la mémoire ne pointe plus au-delà du point de bifurcation', () => {
  const c = forkOf(s, 4, 'x', 'b');
  assert.equal(c.mem.upto, 5);
  assert.deepEqual(c.mem.lines.map(l => l.i), [0, 1, 2, 3, 4]);
  assert.equal(c.mem.summary, 'Tout');
});

test('l’histoire d’origine n’est pas modifiée', () => {
  forkOf(s, 2, 'x', 'b');
  assert.equal(s.messages.length, 10);
  assert.equal(s.mem.upto, 8);
  assert.equal(s.mem.lines.length, 8);
  assert.equal(s.id, 'a');
});

test('bifurquer sur le dernier message garde la mémoire telle quelle', () => {
  const c = forkOf(s, 9, 'x', 'b');
  assert.equal(c.messages.length, 10);
  assert.equal(c.mem.upto, 8);
});
