import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { protocol, family, conflicts } from '../js/protocol.js';
import { buildInfo } from '../js/prompt.js';
import { clean } from '../js/store.js';
import { S, ctx } from '../js/state.js';

beforeEach(() => {
  S.proto = '';
  S.pre = '';
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('les gros modèles passent en consignes concises', () => {
  assert.equal(family('claude-haiku-5-5'), 'full');
  assert.equal(family('claude-sonnet-4-6'), 'lean');
  assert.equal(family('claude-opus-5-5'), 'lean');
  assert.equal(family(''), 'full');
});

test('le réglage manuel l’emporte sur la détection', () => {
  S.proto = 'lean';
  assert.equal(family('claude-haiku-5-5'), 'lean');
  S.proto = 'full';
  assert.equal(family('claude-sonnet-5-5'), 'full');
});

test('le mode concis est plus court et supprime le rappel', () => {
  const o = { stat: true, fields: 'Lieu', choices: true, images: true };
  const a = protocol({ ...o, model: 'claude-haiku-5-5' });
  const b = protocol({ ...o, model: 'claude-sonnet-5-5' });
  assert.ok(b.sys.length < a.sys.length);
  assert.match(a.tail, /<rappel>/);
  assert.equal(b.tail, '');
});

test('lieu annoncé en tête : demandé seulement si l’état suit un lieu', () => {
  for (const model of ['claude-haiku-5-5', 'claude-sonnet-5-5']) {
    assert.match(protocol({ model, stat: true, fields: 'Objectif, Lieu actuel, Humeur' }).sys, /<lieu>nouveau lieu<\/lieu>[^\n]*champ Lieu actuel/);
    assert.doesNotMatch(protocol({ model, stat: true, fields: 'Objectif, Humeur' }).sys, /<lieu>/);
    assert.doesNotMatch(protocol({ model, stat: false, fields: 'Lieu' }).sys, /<lieu>/);
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

test('une sauvegarde importée ne garde pas l’annonce du lieu', () => {
  const s = clean({
    id: 's',
    messages: [{ role: 'assistant', content: '<lieu>Volcan</lieu>\n\nUn volcan gronde.', state: [['Lieu', 'Volcan']] }]
  });
  assert.doesNotMatch(s.messages[0].content, /lieu>/);
  assert.match(s.messages[0].content, /Un volcan gronde\./);
});

test('le rappel ne liste que les blocs activés', () => {
  const model = 'claude-haiku-5-5';
  assert.match(protocol({ model, stat: true, choices: false }).tail, /le bloc <etat>\.$/m);
  assert.match(protocol({ model, stat: true, choices: true }).tail, /<etat> puis le bloc <choix>/);
  assert.equal(protocol({ model, stat: false, choices: false }).tail, '');
});

test('aucun format n’est émis pour ce qui est désactivé', () => {
  const p = protocol({ stat: false, choices: false, images: false, style: false });
  assert.equal(p.sys, '');
});

test('la consigne d’images demande de les placer dans le récit, pas en tête', () => {
  for (const model of ['claude-sonnet-5-5', 'claude-haiku-5-5']) {
    const s = protocol({ model, images: true }).sys;
    assert.match(s, /\{\{img::code\}\}/);
    assert.match(s, /récit|texte/);
    assert.match(s, /pas (systématiquement|par défaut)|N.ouvre pas/);
  }
});

test('la consigne de style est émise par défaut', () => {
  assert.match(protocol({ stat: false, choices: false, images: false }).sys, /astérisques/);
  assert.match(protocol({ choices: true }).sys, /\*un geste\*/);
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
