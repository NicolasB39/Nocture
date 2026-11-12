import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMem, mergeRel, near, sameName, summaryOf } from '../js/memory.js';

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

test('un personnage à fiche révélé sous son vrai nom reprend sa relation', () => {
  // Personnage à fiche révélé sous son vrai nom : l'entrée de son faux nom disparaît, jamais une autre fiche.
  assert.deepEqual(
    mergeRel({ Cendrine: 'méfiante', Berthe: 'loyale' }, { 'Isaure (Cendrine)': 'confiante' }, ['Isaure', 'Berthe']),
    { Berthe: 'loyale', Isaure: 'confiante' }
  );
  assert.deepEqual(mergeRel({ Berthe: 'loyale' }, { 'Isaure (Berthe)': 'x' }, ['Isaure', 'Berthe']), { Berthe: 'loyale', Isaure: 'x' });
  // Seule l'entrée portant exactement l'ancien nom disparaît.
  assert.deepEqual(
    mergeRel({ Cendrine: 'méfiante', 'La sœur de Cendrine': 'amie' }, { 'Isaure (Cendrine)': 'confiante' }, ['Isaure']),
    { 'La sœur de Cendrine': 'amie', Isaure: 'confiante' }
  );
  // Sans fiche, la parenthèse n'est qu'un nom.
  assert.deepEqual(mergeRel({ Cendrine: 'a' }, { 'Garde (Cendrine)': 'b' }, ['Isaure']), { Cendrine: 'b' });
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

test('résumé principal : Événements puis Situation, la Situation seule à la clôture d’un chapitre', () => {
  assert.equal(summaryOf('Buena paie Orbec.', 'Buena attend. Fils en suspens : tenue chez Orbec.'), 'Événements : Buena paie Orbec.' + '\n\n' + 'Situation actuelle : Buena attend. Fils en suspens : tenue chez Orbec.');
  assert.equal(summaryOf('Buena paie Orbec.', 'Buena attend.', true), 'Situation actuelle : Buena attend.');
  // Intertitre recopié par le modèle malgré la consigne : retiré.
  assert.equal(summaryOf('**Événements** : x.', 'Situation actuelle : y.'), 'Événements : x.' + '\n\n' + 'Situation actuelle : y.');
  // Événements trop longs : coupés, la Situation garde sa place.
  const r = summaryOf('Une phrase longue. '.repeat(120), 'Buena attend.');
  assert.ok(r.length <= 1400 && r.endsWith('Situation actuelle : Buena attend.'), r.length);
  assert.equal(summaryOf('  ', '  '), '');
});
