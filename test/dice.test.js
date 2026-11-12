import './stub.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { askOf, chance, checkOf, noRolls, roll, rollParts, sheetOf, spent, withRoll } from '../js/dice.js';
import { protocol } from '../js/protocol.js';
import { buildInfo } from '../js/prompt.js';
import { clean } from '../js/store.js';
import { S, ctx } from '../js/state.js';
import { plain } from '../js/util.js';

const R = ['Vigueur', 'Adresse', 'Esprit', 'Présence', 'Volonté'];
beforeEach(() => {
  S.pre = '';
  Object.assign(ctx, { system: 'Récit.', avatar: '', chars: [], lore: [], images: [], stat: '', rules: R });
});

test('marque de jet d’un choix : reconnue sans accents ni casse, seulement pour une caractéristique connue', () => {
  assert.deepEqual(checkOf('*Je force le cadenas* (Adresse, difficile)', R), { text: '*Je force le cadenas*', k: 'Adresse', d: 'difficile' });
  assert.deepEqual(checkOf('Je parle (presence, tres difficile)', R), { text: 'Je parle', k: 'Présence', d: 'très difficile' });
  assert.deepEqual(checkOf('Je réfléchis (Esprit, moyenne)', R), { text: 'Je réfléchis', k: 'Esprit', d: 'moyen' });
  assert.equal(checkOf('Je force (Chance, difficile)', R), null);
  assert.equal(checkOf('Je force (Adresse, impossible)', R), null);
  assert.equal(checkOf('Je dis bonjour (poliment)', R), null);
  assert.equal(checkOf('Je force (Adresse, difficile)', []), null);
  // Marque suivie d'une ponctuation, d'une fin d'italique ou d'une réplique : reconnue, retirée du texte.
  assert.deepEqual(checkOf('Je force la serrure (Adresse, difficile).', R).text, 'Je force la serrure.');
  assert.deepEqual(checkOf('*Je force la serrure (Adresse, difficile)*', R).text, '*Je force la serrure*');
  assert.deepEqual(checkOf('*Je force le cadenas* (Adresse, difficile) « Vite ! »', R), { text: '*Je force le cadenas* « Vite ! »', k: 'Adresse', d: 'difficile' });
});

test('jet : un d20 plus le bonus de la fiche, 20 et 1 naturels toujours critiques', () => {
  assert.equal(roll({ k: 'Adresse', d: 'difficile' }, { Adresse: 2 }, 11), '<jet>Adresse, difficile (13) : 11 + 2 = 13, réussite</jet>');
  assert.equal(roll({ k: 'Adresse', d: 'difficile' }, { Adresse: -1 }, 13), '<jet>Adresse, difficile (13) : 13 − 1 = 12, échec</jet>');
  assert.match(roll({ k: 'Esprit', d: 'facile' }, {}, 1), /échec critique/);
  assert.match(roll({ k: 'Esprit', d: 'très difficile' }, {}, 20), /réussite critique/);
  for (let i = 0; i < 200; i++) {
    const n = rollParts(roll({ k: 'Esprit', d: 'moyen' }).slice(5, -6)).n;
    assert.ok(n >= 1 && n <= 20, String(n));
  }
});

test('chance de réussite : comme le d20 de l’application, 20 toujours réussi, 1 toujours raté', () => {
  assert.deepEqual(['facile', 'moyen', 'difficile', 'très difficile'].map(d => chance({ k: 'Adresse', d })), [75, 55, 40, 25]);
  assert.equal(chance({ k: 'Adresse', d: 'difficile' }, { Adresse: 2 }), 50);
  assert.equal(chance({ k: 'Adresse', d: 'facile' }, { Adresse: 9 }), 95);
  assert.equal(chance({ k: 'Adresse', d: 'très difficile' }, { Adresse: -9 }), 5);
  // Même calcul que roll, sur les vingt faces.
  for (const b of [-1, 0, 2])
    assert.equal(chance({ k: 'Esprit', d: 'moyen' }, { Esprit: b }), [...Array(20)].filter((_, n) => !roll({ k: 'Esprit', d: 'moyen' }, { Esprit: b }, n + 1).includes('échec')).length * 5);
});

test('message envoyé : la marque devient le résultat, un message sans marque ne change pas', () => {
  const t = withRoll('Je saute (Vigueur, moyen)', { remote: true, sheet: { Vigueur: 1 } });
  assert.match(t, /^Je saute\n\n<jet>Vigueur, moyen \(10\) : \d+ \+ 1 = \d+, (réussite|échec)( critique)?<\/jet>$/);
  assert.match(withRoll('(Vigueur, moyen)', { remote: true }), /^<jet>Vigueur/);
  assert.equal(withRoll('Je saute', { remote: true }), 'Je saute');
});

test('carte du dé : le résultat se relit, la demande de jet du narrateur se retrouve', () => {
  assert.deepEqual(rollParts('Adresse, difficile (15) : 14 + 2 = 16, réussite'), {
    label: 'Adresse · difficile (15)',
    what: 'Adresse · difficile',
    n: 14,
    b: 2,
    tot: 16,
    dc: 15,
    sum: '14 + 2 = 16',
    r: 'réussite',
    ko: false,
    crit: false
  });
  assert.equal(rollParts('Esprit, facile (8) : 1 + 0 = 1, échec critique').ko && rollParts('Esprit, facile (8) : 1 + 0 = 1, échec critique').crit, true);
  assert.equal(rollParts('Adresse, difficile'), null);
  assert.deepEqual(askOf('*Il hésite.*\n\n<jet>Adresse, difficile</jet>', R), { k: 'Adresse', d: 'difficile' });
  assert.equal(askOf('<jet>Adresse, difficile (15) : 14 + 2 = 16, réussite</jet>', R), null);
  // Demande mal formée : jamais sans bouton. Caractéristique inconnue gardée, difficulté inconnue : moyen.
  assert.deepEqual(askOf('<jet>Chance, difficile</jet>', R), { k: 'Chance', d: 'difficile' });
  assert.deepEqual(askOf('<jet>adresse (très difficile)</jet>', R), { k: 'Adresse', d: 'très difficile' });
  assert.deepEqual(askOf('<jet>Esprit</jet>', R), { k: 'Esprit', d: 'moyen' });
  assert.equal(askOf('<jet>Esprit, moyen</jet>', []), null);
  // Résultat écrit par le narrateur : retiré de sa réponse, la demande reste.
  assert.equal(noRolls('Il tente.\n\n<jet>Vigueur, moyen (12) : 19 + 1 = 20, réussite</jet>'), 'Il tente.\n\n');
  assert.equal(noRolls('<jet>Vigueur, moyen</jet>'), '<jet>Vigueur, moyen</jet>');
});

test('fiche : bornes du jeu et points dépensés ; le stockage garde des entiers raisonnables', () => {
  const sh = sheetOf({ remote: true, sheet: { Adresse: 9, Esprit: -4, Vigueur: 1.7, Inconnu: 2 } });
  assert.deepEqual(sh, { Vigueur: 1, Adresse: 2, Esprit: -1, Présence: 0, Volonté: 0 });
  assert.equal(spent(sh), 2);
  const s = clean({ id: 'a', messages: [], sheet: { Adresse: 2, Esprit: 'x', Vigueur: 99 } });
  assert.deepEqual(s.sheet, { Adresse: 2 });
});

test('protocole : le bloc des jets n’apparaît qu’avec des règles, et suit les choix', () => {
  assert.doesNotMatch(protocol({ choices: true }), /Jets de dés/);
  const p = protocol({ choices: true, rules: R });
  assert.match(p, /# Jets de dés[\s\S]*Vigueur, Adresse, Esprit, Présence, Volonté/);
  assert.match(p, /\(Caractéristique, difficile\)/);
  assert.match(p, /à la place du bloc <choix>/);
  assert.doesNotMatch(protocol({ rules: R }), /bloc <choix>/);
});

test('prompt : les règles d’un scénario GitHub partent dans la partie fixe, pas pour une histoire locale', () => {
  const s = clean({ id: 'r', remote: true, messages: [{ role: 'user', content: 'Je saute\n\n<jet>Vigueur, moyen (12) : 9 + 1 = 10, échec</jet>' }] });
  const r = buildInfo(s);
  assert.match(r.msgs[0].content, /# Jets de dés/);
  assert.match(r.msgs.at(-1).content, /<jet>Vigueur, moyen \(12\) : 9 \+ 1 = 10, échec<\/jet>/);
  assert.doesNotMatch(buildInfo({ ...s, remote: false, system: 'Local.' }).msgs[0].content, /# Jets de dés/);
});

test('texte simple : résultat en clair, demande retirée', () => {
  assert.equal(plain('Je saute\n\n<jet>Vigueur, moyen (12) : 9 + 1 = 10, échec</jet>'), 'Je saute\n\n(Jet : Vigueur, moyen (12) : 9 + 1 = 10, échec)');
  assert.equal(plain('Il hésite.\n\n<jet>Adresse, difficile</jet>'), 'Il hésite.');
});

test('relecture Fable : demandes et marques de jet sous d’autres formes, fiche trop chargée, jet dans <choix>, état non fermé', async () => {
  const { isRoll } = await import('../js/util.js');
  const { split, parseEtat } = await import('../js/format.js');
  for (const t of ['Adresse : difficile', "Jet d'Adresse, difficile", 'difficile, Adresse', 'Adresse difficile', 'Adresse, difficile (DD : 13)'])
    assert.deepEqual(askOf('<jet>' + t + '</jet>', R), { k: 'Adresse', d: 'difficile' }, t);
  assert.deepEqual(askOf('Il hésite.\n\n<jet>Adresse, difficile', R), { k: 'Adresse', d: 'difficile' }, 'balise jamais fermée');
  assert.ok(!isRoll('Adresse, difficulté : 13'));
  assert.ok(isRoll('Adresse, moyen (10) : 9 − 1 = 8, échec'));
  for (const c of ['Je saute (Adresse : difficile)', 'Je saute (Adresse, difficile, +2)', "Je saute (Jet d'Adresse, difficile)"])
    assert.deepEqual(checkOf(c, R) && [checkOf(c, R).text, checkOf(c, R).k, checkOf(c, R).d], ['Je saute', 'Adresse', 'difficile'], c);
  assert.equal(checkOf('Je pars (vers le nord)', R), null);
  assert.equal(checkOf("Je reste immobile (c'est difficile de garder l'esprit clair)", R), null, 'parenthèse du récit');
  assert.equal(checkOf('Je pars (Adresse, facilement)', R), null);
  assert.deepEqual(askOf('<jet>Volonté, difficile (résister à la présence du spectre)</jet>', R), { k: 'Volonté', d: 'difficile' });
  assert.equal(askOf('Il hésite.\n\n<jet>Adresse, diff', R), null, 'demande coupée');
  for (const t of ['Adresse, difficile (13) : 15, réussite', 'Adresse : 1d20 + 2 = 15']) assert.ok(isRoll(t), t);
  assert.deepEqual(sheetOf({ remote: true, sheet: { Vigueur: 2, Adresse: 2 } }), { Vigueur: 1, Adresse: 2, Esprit: 0, Présence: 0, Volonté: 0 });
  assert.equal(spent(sheetOf({ remote: true, sheet: { Vigueur: 2, Adresse: 2, Esprit: 2 } })), 3);
  const s = split('Il avance.\n\n<choix>\n<jet>Adresse, difficile</jet>\n</choix>');
  assert.equal(s.choices, undefined);
  assert.match(s.content, /<jet>Adresse, difficile<\/jet>$/);
  const e = split('Il avance.\n\n<etat>\nLieu: Taverne\n\n<jet>Adresse, difficile</jet>');
  assert.deepEqual(e.state, [['Lieu', 'Taverne']]);
  assert.match(e.content, /<jet>Adresse, difficile<\/jet>$/);
  assert.deepEqual(parseEtat('<etat>\nOr: 3\n</etat>'), [['Or', '3']]);
  assert.equal(clean({ id: 'x', messages: [{ role: 'assistant', content: 'a', state: [[1, 2]] }] }).messages[0].state, undefined);
});
