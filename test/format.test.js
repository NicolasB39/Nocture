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

test('écran de passage : seulement un lieu annoncé en tête, nouveau, et pas celui de la réponse régénérée', async () => {
  const { passageLieu } = await import('../js/format.js');
  const avant = [['Lieu', 'La cour']];
  assert.equal(passageLieu('<lieu>Le gué</lieu>\n\n*L’eau monte.*', avant), 'Le gué');
  assert.equal(passageLieu('  <lieu>Le Gué</lieu>', avant), 'Le Gué');
  // Déjà là (accents et majuscules ignorés), ou annoncé au milieu de la réponse : rien.
  assert.equal(passageLieu('<lieu>la cour</lieu>\n\nTexte', avant), '');
  assert.equal(passageLieu('*Ils marchent.*\n\n<lieu>Le gué</lieu>', avant), '');
  // Régénération d'une réponse qui annonçait déjà ce lieu : pas une seconde fois.
  assert.equal(passageLieu('<lieu>Le gué</lieu>', avant, [['Lieu', 'Le gué']]), '');
  // Premier lieu de l'histoire, ou état d'avant sans lieu : l'écran vient aussi.
  assert.equal(passageLieu('<lieu>Pont-aux-Saules</lieu>', null), 'Pont-aux-Saules');
  assert.equal(passageLieu('<lieu>Le gué</lieu>', [['Jour', '2']]), 'Le gué');
  // Balise pas encore fermée pendant l'écriture : rien pour l'instant.
  assert.equal(passageLieu('<lieu>Le g', avant), '');
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

test('marque du journal : choix présents, recopiés, rattrapés ou absents', async () => {
  const { choiceMark } = await import('../js/format.js');
  const B = '\n\n<choix>\n1. *Je pars.*\n2. *Je reste.*\n</choix>';
  assert.equal(choiceMark('Récit.' + B), 'présents');
  assert.equal(choiceMark('Récit.\n\n1. *Je pars.*\n2. *Je reste.*' + B), 'recopiés');
  assert.equal(choiceMark('Récit.\n\n1. *Je pars.*\n2. *Je reste.*'), 'rattrapés');
  assert.equal(choiceMark('Récit.\n\n<etat>\nLieu: ici\n</etat>'), 'absents');
  const S = '\n\nLieu: Quai\nJour: 2';
  assert.equal(choiceMark('Récit.\n\n1. *Je pars.*\n2. *Je reste.*' + S + B, 'Lieu, Jour'), 'recopiés', 'état en clair après la liste');
  assert.equal(choiceMark('Récit.\n\n1. *Je pars.*\n2. *Je reste.*' + S, 'Lieu, Jour'), 'rattrapés');
});

test('choix recopiés dans le récit en plus du bloc <choix> : la liste du récit est retirée', async () => {
  const { split, dropDup } = await import('../js/format.js');
  const { clean } = await import('../js/store.js');
  const B = '<choix>\n1. *Je descends sonder le passage.*\n2. « On campe ici. »\n3. *Je demande à Berthe.*\n</choix>';
  const t = '*Le soir tombe sur la rivière.*\n\n**Vos options :**\n\n1. **Je descends sonder le passage.**\n2. « On campe ici. »\n3. *Je demande à Berthe.*';
  const s = split(t + '\n\n' + B);
  assert.equal(s.content, '*Le soir tombe sur la rivière.*');
  assert.equal(s.choices.length, 3);
  // Paraphrasés mais en forme d'actions du joueur, séparés par des lignes vides : retirés aussi.
  assert.equal(
    split('Récit.\n\n1. *Je sonde le gué.*\n\n2. *J’installe le camp.*\n\n3. « Berthe ? »\n\n' + B).content,
    'Récit.'
  );
  // Une liste du récit (lettre, inventaire) reste : ni reprise des choix, ni action du joueur.
  assert.equal(split('La lettre dit :\n\n1. Payer la dette.\n2. Quitter la ville.\n\n' + B).content, 'La lettre dit :\n\n1. Payer la dette.\n2. Quitter la ville.');
  // Une seule ligne numérotée : laissée.
  assert.equal(dropDup('Récit.\n\n1. *Je pars.*', ['*Je pars.*', 'Rester']), 'Récit.\n\n1. *Je pars.*');
  // Réponse déjà enregistrée en double : corrigée au chargement.
  const c = clean({ id: 'd', messages: [{ role: 'assistant', content: t, choices: ['*Je descends sonder le passage.*', '« On campe ici. »', '*Je demande à Berthe.*'] }] });
  assert.equal(c.messages[0].content, '*Le soir tombe sur la rivière.*');
});

test('relecture Fable : inscriptions gardées, pas de rattrapage sans choix, demande de jet avec deux-points', async () => {
  const { split } = await import('../js/format.js');
  const { isRoll } = await import('../js/util.js');
  const B = '<choix>\n1. *Je recule.*\n2. « On entre. »\n</choix>';
  const t = 'Sur le mur, trois inscriptions :\n\n1. « Ne pas entrer »\n2. « Danger »\n3. « Fuyez »';
  assert.equal(split(t + '\n\n' + B).content, t);
  const loose = 'Récit.\n\n1. « Je reste. »\n2. « Je pars. »';
  assert.equal(split(loose).choices?.length, 2);
  assert.equal(split(loose, false).content, loose);
  assert.ok(!isRoll('Adresse : difficile'));
  assert.ok(isRoll('Adresse, difficile (15) : 14 + 2 = 16, réussite'));
});

test('état écrit sans balise : rattrapé sur les champs du panneau, jamais une réplique', async () => {
  const { split } = await import('../js/format.js');
  const F = 'Lieu, Jour, Santé (sur 100)';
  const s = split('Il avance.\n\nLieu: Boulangerie\nJour: 2\n[Santé : 64/100]', true, F);
  assert.equal(s.content, 'Il avance.');
  assert.deepEqual(s.state, [['Lieu', 'Boulangerie'], ['Jour', '2'], ['Santé', '64/100']]);
  assert.equal(split('Il avance.\n\nInès : Viens.\nRenard : Non.', true, F).content, 'Il avance.\n\nInès : Viens.\nRenard : Non.');
  assert.equal(split('Il avance.\n\nLieu: Boulangerie\nJour: 2', true, '').state, undefined, 'sans panneau, rien');
  assert.deepEqual(split('Il avance.\n\n<etat>\nLieu: Quai\n</etat>', true, F).state, [['Lieu', 'Quai']]);
  const L = 'Date, Lieu, Rang et stats, Condition, Objets';
  assert.equal(split('Il avance.\n\nDate: lundi\nLieu: Hall\nRang: C\nStats: 3\nCondition: bonne\nObjets: aucun', true, L).state.length, 6, 'champ en plusieurs mots');
  assert.equal(split('Il avance.\n\nHumeur: calme\nLieu: Hall\nCondition: bonne', true, L).state, undefined, 'à moitié reconnu : rien');
  assert.equal(split('Il avance.\n\nSanté (0/100): 64/100\nLieu: Hall', true, 'Lieu, Santé (0/100)').state.length, 2);
  const d = split('Il avance.\n\nLieu: Quai\nJour: 2\n\n<etat>\nLieu: Hall\nJour: 2\n</etat>', true, F);
  assert.equal(d.content, 'Il avance.', 'état recopié en plus du bloc : lignes retirées');
  assert.deepEqual(d.state, [['Lieu', 'Hall'], ['Jour', '2']], 'le bloc fait foi');
  const e = split('Il avance.\n\n1. *Je pars.*\n2. *Je reste.*\n\nLieu: Quai\nJour: 2\n\n<etat>\nLieu: Hall\nJour: 2\n</etat>\n\n<choix>\n1. *Je pars.*\n2. *Je reste.*\n</choix>', true, F);
  assert.equal(e.content, 'Il avance.', 'liste recopiée puis état en clair : les deux retirés');
  const g = split('Il avance.\n\n1. *Je pars.*\n2. *Je reste.*\n\nLieu: Quai\nJour: 2', true, F);
  assert.deepEqual([g.content, g.choices, g.state.length], ['Il avance.', ['*Je pars.*', '*Je reste.*'], 2], 'sans balises : choix et état rattrapés');
});
