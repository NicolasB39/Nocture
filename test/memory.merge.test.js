import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memsOf, mergeMem, mergeRel, near, sameName, situationOf } from '../js/memory.js';

test('sameName rapproche les variantes d’un même nom', () => {
  assert.ok(sameName('Alice', 'alice'));
  assert.ok(sameName('Alice', "Alice, l'herboriste"));
  assert.ok(sameName('alice herboriste', 'Alice'));
  assert.ok(!sameName('Alice', 'Bob'));
  assert.ok(!sameName('', 'Alice'));
});

test('une relation reformulée met à jour au lieu de dupliquer', () => {
  let r = mergeRel({}, { Alice: 'méfiante' });
  r = mergeRel(r, { alice: 'un peu moins méfiante' });
  r = mergeRel(r, { "Alice, l'herboriste": 'confiante' });
  assert.deepEqual(r, { Alice: 'confiante' });
});

test('les relations vides ou « aucun » sont ignorées', () => {
  assert.deepEqual(mergeRel({ Alice: 'x' }, { Bob: '', Clé: 'aucun', '': 'y' }), { Alice: 'x' });
});

test('les figurants s’effacent, les personnages connus restent', () => {
  let r = { Alice: 'amie' };
  for (let i = 0; i < 20; i++) r = mergeRel(r, { ['Garde ' + i]: 'neutre' }, ['Alice'], 5);
  assert.ok('Alice' in r);
  assert.equal(Object.keys(r).length, 5);
  assert.ok('Garde 19' in r);
  assert.ok(!('Garde 0' in r));
});

test('sans protection, le plus ancien part en premier', () => {
  let r = {};
  for (let i = 0; i < 6; i++) r = mergeRel(r, { ['P' + i]: 'x' }, [], 3);
  assert.deepEqual(Object.keys(r), ['P3', 'P4', 'P5']);
});

test('near repère une reformulation', () => {
  assert.ok(near('la fiole est verte', 'La fiole verte est importante'));
  assert.ok(near('le gardien dort', 'Le gardien dort toujours'));
  assert.ok(!near('la fiole est verte', 'le bateau part à l’aube'));
});

test('un souvenir reformulé remplace l’ancien et remonte en fin de liste', () => {
  const m = mergeMem(['la fiole est verte', 'le bateau part à l’aube'], [
    'La fiole verte contient le poison'
  ]);
  assert.equal(m.length, 2);
  assert.equal(m.at(-1), 'La fiole verte contient le poison');
  assert.ok(!m.some(x => x === 'la fiole est verte'));
});

test('les souvenirs sont plafonnés en gardant les plus récents', () => {
  const m = mergeMem(
    Array.from({ length: 10 }, (_, i) => 'souvenir alpha' + i),
    ['tout dernier fait'],
    4
  );
  assert.equal(m.length, 4);
  assert.equal(m.at(-1), 'tout dernier fait');
});

test('les accents fusionnent et l’orthographe accentuée l’emporte', () => {
  assert.ok(sameName('Zoé', 'Zoe'));
  assert.ok(sameName('Hélène', 'Helene'));
  let r = mergeRel({}, { Zoe: 'neutre' });
  r = mergeRel(r, { Zoé: 'amicale' });
  assert.deepEqual(r, { Zoé: 'amicale' });
  r = mergeRel(r, { Zoe: 'complice' });
  assert.deepEqual(r, { Zoé: 'complice' });
});

test('les accents ne créent pas de doublon de souvenir, la formulation récente gagne', () => {
  assert.deepEqual(mergeMem(['la fiole est verte'], ['La fiôle est vérte']), ['La fiôle est vérte']);
  assert.deepEqual(mergeMem(['La fiôle est vérte'], ['la fiole est verte']), ['la fiole est verte']);
});

test('souvenirs d’un personnage : son nom en mot entier, sans accents ni casse', () => {
  const M = ['Sera doit son pain du matin à Buena.', 'Inès a menti au proviseur.', 'Seriel garde la clé du Hall B.', 'Buena promet de revoir SERA.'];
  assert.deepEqual(memsOf(M, 'Sera'), [M[0], M[3]]);
  assert.deepEqual(memsOf(M, 'Ines'), [M[1]]);
  assert.deepEqual(memsOf(M, 'Brindille'), []);
  assert.deepEqual(memsOf(undefined, 'Sera'), []);
  // Nom composé : le titre ne suffit pas.
  const D = ['La dame du péage a menti.', 'Isaure a payé le passeur.'];
  assert.deepEqual(memsOf(D, 'Dame Isaure'), [D[1]]);
});

test('chapitre clos : le résumé principal repart de la Situation actuelle', () => {
  const r = 'Événements : J+0, Buena paie Orbec.' + '\n\n' + 'Situation actuelle : Buena attend. Fils en suspens : tenue chez Orbec.';
  assert.equal(situationOf(r), 'Situation actuelle : Buena attend. Fils en suspens : tenue chez Orbec.');
  assert.equal(situationOf('Événements : x.' + '\n' + '**Situation actuelle** : y.'), '**Situation actuelle** : y.');
  // Tout sur une ligne : coupé au début de la phrase.
  assert.equal(situationOf('Événements : Buena paie. Situation actuelle : Buena attend.'), 'Situation actuelle : Buena attend.');
  // Déjà réduit, ou sans repère : inchangé.
  assert.equal(situationOf('Situation actuelle : y.'), 'Situation actuelle : y.');
  assert.equal(situationOf('Buena attend devant le Hall B.'), 'Buena attend devant le Hall B.');
});
