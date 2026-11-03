import assert from 'node:assert/strict';
import test from 'node:test';
import { scenesOf, tocOf } from '../js/scene.js';

const u = content => ({ role: 'user', content }),
  a = (content, lieu) => ({ role: 'assistant', content, ...(lieu ? { state: [['Lieu', lieu]] } : {}) });
const ms = [
  u('J’entre.'),
  a('Elle sourit. La porte grince derrière vous.', 'Auberge'),
  u('Je bois.'),
  a('Le vin est amer.'),
  u('Je sors.'),
  a('*Le vent souffle.* La falaise est haute.\n\n<choix>\n1. Je saute.\n</choix>', 'Falaise'),
  u('Je regarde en bas.'),
  a('Rien.', 'falaise')
];

test('scenesOf : une scène par changement de lieu, la première depuis le début', () => {
  assert.deepEqual(scenesOf(ms), [
    { at: 1, from: 0, lieu: 'Auberge', to: 4 },
    { at: 5, from: 5, lieu: 'Falaise', to: 7 }
  ]);
  assert.deepEqual(scenesOf([]), []);
});

test('scenesOf : le lieu de la première scène peut n’arriver qu’au tour suivant', () => {
  const s = scenesOf([u('Bonjour'), a('Il fait nuit.'), u('Et alors ?'), a('Le port dort.', 'Port')]);
  assert.deepEqual(s, [{ at: 1, from: 0, lieu: 'Port', to: 3 }]);
});

test('tocOf : une scène par lieu, ses tours, la dernière en cours', () => {
  const t = tocOf(ms);
  assert.equal(t.length, 2);
  assert.deepEqual(
    t.map(s => [s.lieu, s.from, s.turns, s.cur]),
    [
      ['Auberge', 0, 2, false],
      ['Falaise', 5, 2, true]
    ]
  );
});

test('tocOf : sans aucun lieu, pas de sommaire par scènes', () => {
  assert.equal(tocOf([u('a'), a('b'), u('c'), a('d')]), null);
});
