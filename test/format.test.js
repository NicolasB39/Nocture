import assert from 'node:assert/strict';
import test from 'node:test';

const node = t => ({
  tagName: t.toUpperCase(),
  className: '',
  textContent: '',
  dataset: {},
  style: {},
  kids: [],
  append(...x) {
    this.kids.push(...x);
  },
  setAttribute(k, v) {
    this[k] = v;
  }
});
globalThis.document = { createElement: node, createElementNS: (_, t) => node(t) };

const { body } = await import('../js/format.js');

const shape = t =>
  body(t).map(x => (typeof x == 'string' ? 'txt' : x.tagName + (x.className ? '.' + x.className : '')));
const texts = t =>
  body(t)
    .filter(x => x.tagName == 'P')
    .map(x => x.kids.map(k => (typeof k == 'string' ? k : k.textContent)).join(''));

test('une ligne vide sépare deux paragraphes', () => {
  assert.deepEqual(shape('Un.\n\nDeux.'), ['P', 'P']);
  assert.deepEqual(texts('Un.\n\nDeux.'), ['Un.', 'Deux.']);
});

test('un simple retour à la ligne reste dans le paragraphe', () => {
  assert.deepEqual(texts('Un.\nEncore.'), ['Un.\nEncore.']);
});

test('les lignes vides en trop ne créent pas de paragraphe vide', () => {
  assert.deepEqual(shape('Un.\n\n\n\nDeux.\n\n'), ['P', 'P']);
});

test('une image ne laisse aucun paragraphe vide autour d’elle', () => {
  assert.deepEqual(shape('Un.\n\n{{img::x}}\n\nDeux.'), ['P', 'SPAN.miss', 'P']);
  assert.deepEqual(shape('{{img::x}}'), ['SPAN.miss']);
  assert.deepEqual(shape('Un.\n\n{{img::x}}'), ['P', 'SPAN.miss']);
});

test('les lignes de citation consécutives forment un seul bloc', () => {
  assert.deepEqual(shape('> a\n> b\n\nSuite.'), ['P.q', 'P']);
  assert.deepEqual(texts('> a\n> b\n\nSuite.'), ['a\nb', 'Suite.']);
});

test('une image au milieu du texte coupe le récit en deux paragraphes', () => {
  assert.deepEqual(shape('Elle sourit.\n{{img::x}}\nPuis elle part.'), ['P', 'SPAN.miss', 'P']);
  assert.deepEqual(texts('Elle sourit.\n{{img::x}}\nPuis elle part.'), ['Elle sourit.', 'Puis elle part.']);
});

test('un jeton d’image non refermé (streaming) n’est jamais affiché en clair', () => {
  assert.deepEqual(texts('Elle sourit. {{img::ali'), ['Elle sourit.']);
  assert.deepEqual(texts('Elle sourit. {{'), ['Elle sourit.']);
  assert.deepEqual(shape('Elle sourit.\n{{img::ali'), ['P']);
});

test('les séparateurs restent des hr', () => {
  assert.deepEqual(shape('Un.\n---\nDeux.'), ['P', 'HR', 'P']);
});

test('les blocs du protocole sont retirés avant le découpage', () => {
  assert.deepEqual(shape('Un.\n\n<etat>\nLieu: ici\n</etat>\n\n<choix>\n1. a\n</choix>'), ['P']);
});

test('jets : carte dans un message du joueur seulement, demande masquée, balise incomplète cachée pendant l’écriture', () => {
  const r = 'Je saute\n\n<jet>Vigueur, moyen (12) : 9 + 1 = 10, échec</jet>';
  assert.deepEqual(
    body(r, '', true).map(x => x.tagName + (x.className ? '.' + x.className : '')),
    ['P', 'DIV.roll ko']
  );
  assert.deepEqual(shape(r), ['P']);
  assert.deepEqual(texts('Il hésite.\n\n<jet>Adresse, difficile</jet>'), ['Il hésite.']);
  for (const t of ['Il hésite.\n\n<jet>Adresse, diff', 'Il hésite.\n\n<jet>Adresse, difficile</je', 'Il hésite.\n\n<je'])
    assert.deepEqual(texts(t), ['Il hésite.'], t);
});

test('choix sans balise <choix> : rattrapés en fin de récit, jamais une liste du récit', async () => {
  const { looseChoices, split } = await import('../js/format.js');
  const { clean } = await import('../js/store.js');
  // Cas réel (journal du 7 novembre, Haiku) : trois choix numérotés, marques de jet comprises.
  const t =
    '*Cendrine referme la main sur la manche.*\n\n' +
    '1. *Je croise les bras et la fixe sans ciller.* « Votre nom entier. » (Prestance, moyen)\n' +
    '2. *Je m’assieds à côté d’elle.* « Racontez-moi. »\n' +
    '3. *Je fais un signe à Gontran.* « Une chose à la fois. » (Ruse, difficile)';
  const s = split(t + '\n\n<etat>\nLieu: Route\n</etat>');
  assert.equal(s.content, '*Cendrine referme la main sur la manche.*');
  assert.equal(s.choices.length, 3);
  assert.match(s.choices[0], /^\*Je croise.*\(Prestance, moyen\)$/);
  assert.deepEqual(s.state, [['Lieu', 'Route']]);
  // Avec la balise, rien ne change.
  assert.deepEqual(split('Récit.\n\n<choix>\n1. Je pars\n2. Je reste\n</choix>').choices, ['Je pars', 'Je reste']);
  // Pas des choix : liste du récit, numérotation fautive, liste collée au paragraphe, une seule ligne.
  assert.equal(looseChoices('La lettre dit :\n\n1. Payer la dette\n2. Quitter la ville'), null);
  assert.equal(looseChoices('Récit.\n\n1. *Je pars.*\n3. *Je reste.*'), null);
  assert.equal(looseChoices('Récit :\n1. *Je pars.*\n2. *Je reste.*'), null);
  assert.equal(looseChoices('Récit.\n\n1. *Je pars.*'), null);
  // Réponse déjà enregistrée : corrigée au chargement.
  const c = clean({ id: 'x', messages: [{ role: 'assistant', content: t }] });
  assert.equal(c.messages[0].choices.length, 3);
  assert.equal(c.messages[0].content, '*Cendrine referme la main sur la manche.*');
});
