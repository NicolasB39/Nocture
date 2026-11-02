import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { protocol, conflicts } from '../js/protocol.js';
import { buildInfo } from '../js/prompt.js';
import { clean } from '../js/store.js';
import { S, ctx } from '../js/state.js';

beforeEach(() => {
  S.pre = '';
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('lieu annoncé en tête : demandé seulement si l’état suit un lieu', () => {
  for (const model of ['claude-haiku-5-5', 'claude-sonnet-5-5']) {
    assert.match(protocol({ model, stat: true, fields: 'Objectif, Lieu actuel, Humeur' }), /<lieu>nouveau lieu<\/lieu>[^\n]*champ Lieu actuel/);
    assert.doesNotMatch(protocol({ model, stat: true, fields: 'Objectif, Humeur' }), /<lieu>/);
    assert.doesNotMatch(protocol({ model, stat: false, fields: 'Lieu' }), /<lieu>/);
  }
});

test('la balise <lieu> est lue puis retirée du texte', async () => {
  const { LIX, lieuTag, liveText, split } = await import('../js/format.js');
  const t = '<lieu>Volcan</lieu>\n\nUn volcan gronde.\n\n<etat>\nLieu: Volcan\n</etat>';
  assert.equal(lieuTag(t), 'Volcan');
  assert.equal(split(t).content, 'Un volcan gronde.');
  assert.deepEqual(split(t).state, [['Lieu', 'Volcan']]);
  // Pendant l'écriture : balise incomplète masquée, texte ordinaire intact.
  for (const p of ['<', '<li', '<lieu>Vol']) assert.equal(liveText(p), '', p);
  assert.equal(liveText('Il entre. <3'), 'Il entre. <3');
  // Un morceau du milieu (« <et » d'un bloc <etat> qui s'écrit) n'est pas touché : body() doit le rendre
  // comme le rendu complet.
  assert.equal('\n\n<et'.replace(LIX, ''), '\n\n<et');
  assert.equal(lieuTag('Pas de balise.'), '');
  // Balise mal fermée : seule sa ligne disparaît, la narration reste.
  for (const b of ['<lieu>Volcan', '<lieu>Volcan<lieu>', '<lieu>Volcan</lie>'])
    assert.equal(split(b + '\n\nUn volcan gronde.\n\nIl fait chaud.').content, 'Un volcan gronde.\n\nIl fait chaud.', b);
});

test('aucun format n’est émis pour ce qui est désactivé ; les conseils de narration restent', () => {
  const p = protocol({ stat: false, choices: false, images: false, style: false });
  assert.doesNotMatch(p, /<etat>|<choix>|\{\{img::|astérisques/);
  assert.match(p, /# Narration/);
});

test('les choix par défaut demandent des registres différents', () => {
  assert.match(protocol({ choices: true }), /registres différents/);
  assert.match(protocol({ choices: true, style: false }), /registres différents/);
});

test('la consigne d’images demande de les placer dans le récit, pas en tête', () => {
  for (const model of ['claude-sonnet-5-5', 'claude-haiku-5-5']) {
    const s = protocol({ model, images: true });
    assert.match(s, /\{\{img::code\}\}/);
    assert.match(s, /récit|texte/);
    assert.match(s, /pas (systématiquement|par défaut)|N.ouvre pas/);
  }
});

test('la consigne de style est émise par défaut', () => {
  assert.match(protocol({ stat: false, choices: false, images: false }), /astérisques/);
  assert.match(protocol({ choices: true }), /\*un geste\*/);
});

test('conflicts repère les formats redéfinis par un scénario', () => {
  assert.deepEqual(conflicts('Réponds avec <choix> à la fin.'), ['le format des choix']);
  assert.equal(conflicts('Tu es un narrateur.').length, 0);
  assert.equal(conflicts('<etat> et {{img::x}}').length, 2);
});

test('le préambule commun est injecté dans le système', () => {
  S.pre = 'Quatre paragraphes maximum.';
  const s = clean({ id: 'a', system: 'SYS', noChoices: true, messages: [{ role: 'user', content: 'x' }] });
  assert.match(buildInfo(s).msgs[0].content, /Quatre paragraphes maximum\./);
});

test('un scénario peut ignorer le préambule commun', () => {
  S.pre = 'Quatre paragraphes maximum.';
  const s = clean({
    id: 'a',
    system: 'SYS',
    noPre: true,
    noChoices: true,
    messages: [{ role: 'user', content: 'x' }]
  });
  assert.doesNotMatch(buildInfo(s).msgs[0].content, /Quatre paragraphes/);
});

test('agentivité et anti-télépathie toujours envoyées, avec leurs exceptions', () => {
  assert.match(protocol({ choices: true }), /seul endroit où tu le fais agir ou parler/);
  for (const o of [{}, { choices: true, stat: true, style: false }]) {
    const p = protocol(o);
    assert.match(p, /Le joueur décide seul de ce que fait, dit, pense et ressent \{\{user\}\}/);
    assert.match(p, /Sauf exception prévue par le scénario, les personnages n'ont pas accès aux pensées/);
  }
});
