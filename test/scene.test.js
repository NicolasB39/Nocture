import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SA, decorFor, decorNow, decorsOf, head, heureOf, isGoal, isWorse, jourLabel, jourOf, lieuOf, momentNow, momentOf, momentsOf, place } from '../js/scene.js';
import { ctx } from '../js/state.js';

const re = k => new RegExp('(^|[^a-z0-9])' + k + '(?![a-z0-9])');
beforeEach(() => {
  ctx.decors = [
    { name: 'foret', url: 'd/foret.webp', keys: [re('foret'), re('clairiere')] },
    { name: 'foret_nuit', url: 'd/foret_nuit.webp', keys: [re('foret de nuit')] },
    { name: 'taverne', url: 'd/taverne.webp', keys: [re('taverne'), re('auberge')] }
  ];
  ctx.decorDef = 'd/defaut.webp';
});

test('lieuOf lit le champ Lieu ou ses synonymes', () => {
  assert.equal(lieuOf([['Humeur', 'calme'], ['Lieu', 'Forêt']]), 'Forêt');
  assert.equal(lieuOf([['Endroit', 'Auberge']]), 'Auberge');
  assert.equal(lieuOf([['Humeur', 'calme']]), '');
  assert.equal(lieuOf(undefined), '');
});

test('decorFor : accents ignorés, mot-clé le plus précis, puis fond par défaut', () => {
  assert.equal(decorFor('Clairière au nord'), 'd/foret.webp');
  assert.equal(decorFor('Forêt de nuit'), 'd/foret_nuit.webp');
  assert.equal(decorFor('Un lieu inventé'), 'd/defaut.webp');
  ctx.decorDef = '';
  assert.equal(decorFor('Un lieu inventé'), '');
});

test('chaque message garde le décor de son moment', () => {
  const ms = [
    { role: 'assistant', content: 'A {{img::x}}', state: [['Lieu', 'Taverne']] },
    { role: 'user', content: 'Je sors.' },
    { role: 'assistant', content: 'B {{img::x}}' },
    { role: 'assistant', content: 'C {{img::x}}', state: [['Lieu', 'Forêt']] },
    { role: 'assistant', content: 'D sans image' }
  ];
  assert.deepEqual(decorsOf(ms), ['d/taverne.webp', '', 'd/taverne.webp', 'd/foret.webp', '']);
  assert.equal(decorNow(ms), 'd/foret.webp');
});

test('sans panneau d’état, le décor vient du texte des messages', () => {
  const ms = [
    { role: 'user', content: 'J’entre dans l’auberge.' },
    { role: 'assistant', content: 'Le feu crépite. {{img::x}}' }
  ];
  assert.deepEqual(decorsOf(ms), ['', 'd/taverne.webp']);
  assert.equal(decorNow(ms), 'd/taverne.webp');
});

test('place : buste centré aux trois quarts, taille au bas de la scène, tête près du haut', () => {
  const a = { r: 0.5, b: [0.4, 0.6, 0.1, 1] },
    p = place(a),
    cx = p.left + ((0.4 + 0.6) / 2) * p.width;
  assert.ok(Math.abs(cx - 75) < 1e-9);
  assert.ok(Math.abs(p.bottom) < 1e-9);
  const hp = 0.94 / 0.9;
  assert.ok(Math.abs(1 - (1 - 0.1) * hp - 0.06) < 1e-9, 'haut de la tête à 6 %');
});

test('place : un personnage large est décalé pour rester entier', () => {
  const a = { r: 2, b: [0.2, 0.9, 0, 1] },
    p = place(a),
    right = p.left + 0.9 * p.width;
  assert.ok(right <= 98 + 1e-9, 'bord droit ' + right);
  assert.ok(Math.abs(right - 98) < 1e-6, 'collé au bord de sécurité : ' + right);
  assert.ok(p.left + 0.2 * p.width >= 2 - 1e-9);
  const c = place({ r: 1, b: [0.2, 0.9, 0, 1] }, { x: 0.5, top: 0.06, fill: 1.9, sa: 1 });
  assert.ok('top' in c && !('bottom' in c));
});

test('la scène est un plan 16/9, le personnage y fait 94 % de la hauteur', () => {
  assert.ok(Math.abs(SA - 16 / 9) < 1e-12);
  const p = place({ r: 0.5, b: [0, 1, 0, 1] });
  assert.ok(Math.abs(p.width - (0.94 * 0.5 * 100) / SA) < 1e-9, 'largeur du personnage : ' + p.width + ' %');
});

test('moment de la journée : mots et heures reconnus, rien sans champ, le dernier connu reste', () => {
  const mo = v => momentOf([['Moment', v]]);
  assert.equal(mo('Aube'), 'aube');
  assert.equal(mo('Point du jour'), 'aube');
  assert.equal(mo('Crépuscule'), 'soir');
  assert.equal(mo('Tombée de la nuit'), 'soir');
  assert.equal(mo('Nuit noire'), 'nuit');
  assert.equal(mo('Minuit'), 'nuit');
  assert.equal(mo('Midi'), '');
  assert.equal(momentOf([['Heure', '21 h 30']]), 'nuit');
  assert.equal(momentOf([['Heure', '6h']]), 'aube');
  assert.equal(momentOf([['Heure', '14h']]), '');
  assert.equal(momentOf([['Lieu', 'Le gué']]), null);
  const ms = [
    { role: 'assistant', content: '', state: [['Moment', 'Crépuscule']] },
    { role: 'user', content: '' },
    { role: 'assistant', content: '', state: [['Lieu', 'Camp']] },
    { role: 'assistant', content: '', state: [['Moment', 'Matin']] }
  ];
  assert.deepEqual(momentsOf(ms), ['soir', 'soir', 'soir', '']);
  assert.equal(jourOf([['Lieu', 'Gué'], ['Jour', '2']]), '2');
  assert.equal(jourOf([['Jours restants', '5'], ['Journal', 'x']]), '');
  assert.equal(jourOf([['Date', '3 mai']]), '3 mai');
  assert.equal(jourLabel(' 2 '), 'Jour 2');
  assert.equal(jourLabel('3 mai'), '3 mai');
  assert.equal(jourLabel('1/12'), 'Jour 1/12');
  assert.equal(momentNow(ms), '');
  assert.equal(momentNow(ms.slice(0, 3)), 'soir');
});

test('ligne de contexte de l’en-tête : première partie d’une valeur, heure sous ses trois noms', () => {
  assert.equal(head("Rue Pinel, cour de l'atelier"), 'Rue Pinel');
  assert.equal(head('J+3 (pluie)'), 'J+3');
  assert.equal(head(''), '');
  for (const k of ['Heure', 'Moment', 'Période']) assert.equal(heureOf([['Lieu', 'Quai'], [k, '14h03']]), '14h03', k);
  assert.equal(heureOf([['Lieu', 'Quai']]), undefined);
  assert.equal(momentOf([['Période', 'soir']]), 'soir', 'même champ pour la teinte des décors');
});

test('isGoal reconnaît les objectifs, pas le butin', () => {
  for (const k of ['Objectif', 'Objectifs', 'Quête secondaire', 'Mission', 'But', 'Quête en cours']) assert.ok(isGoal(k), k);
  for (const k of ['Butin', 'Questions', 'Rang', 'Missionnaire']) assert.ok(!isGoal(k), k);
});

test('isWorse reconnaît les valeurs où monter est mauvais', () => {
  for (const k of ['Stress', 'Fatigue', 'Faim', 'Soupçons de la guilde', 'Dette envers Gaudine', 'Peur (0/10)', 'Blessures', 'Corruption'])
    assert.ok(isWorse(k), k);
  for (const k of ['Santé', 'Mana', 'Énergie', 'Réputation', 'Moral des troupes', 'Patience de l’huissier', 'Dangereux', 'Faiblesse'])
    assert.ok(!isWorse(k), k);
});
