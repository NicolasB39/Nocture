import assert from 'node:assert/strict';
import test from 'node:test';

const node = t => ({
  tagName: t.toUpperCase(),
  className: '',
  textContent: '',
  dataset: {},
  kids: [],
  append(...x) {
    this.kids.push(...x);
  },
  setAttribute(k, v) {
    this[k] = v;
  }
});
globalThis.document = { createElement: node };
const { body, fr, line, parseIntro } = await import('../js/format.js');

test('parseIntro sépare l’accroche des débuts proposés, trois au plus', () => {
  assert.deepEqual(parseIntro('Une nuit de tempête.\n\nUn gardien ment.\n- Je frappe.\n2. J’attends.\n- Je fuis.\n- Je crie.'), {
    pitch: 'Une nuit de tempête.\n\nUn gardien ment.',
    starts: ['Je frappe.', 'J’attends.', 'Je fuis.']
  });
  assert.deepEqual(parseIntro(''), { pitch: '', starts: [] });
});

const NB = ' ',
  FN = ' ';

test('guillemets, apostrophes et espaces insécables', () => {
  assert.equal(
    fr('"Qui va là?" demande-t-il. C\'est l\'heure: partons!'),
    '«' + NB + 'Qui va là' + FN + '?' + NB + '» demande-t-il. C’est l’heure' + NB + ': partons' + FN + '!'
  );
  assert.equal(fr('« Bonjour »'), '«' + NB + 'Bonjour' + NB + '»');
  assert.equal(fr('Quoi ?!'), 'Quoi' + FN + '?!');
});

test('tirets de dialogue et points de suspension', () => {
  assert.equal(fr('- Pas encore...\n-- Si.'), '— Pas encore…\n— Si.');
  assert.equal(fr('Il hésite -- puis entre.'), 'Il hésite — puis entre.');
});

test('heures, adresses et texte déjà composé restent intacts', () => {
  for (const t of ['Rendez-vous à 12:30.', 'Voir http://exemple.fr/a?b=1', 'Un mot-clé'])
    assert.equal(fr(t), t);
  const once = fr('"Qui va là?" C\'est l\'heure: partons!');
  assert.equal(fr(once), once, 'appliquer deux fois ne change rien');
});

const txt = x => (typeof x == 'string' ? x : x.kids.length ? x.kids.map(txt).join('') : x.textContent);

test('les gestes et le gras survivent à la typographie, dans les messages du joueur comme dans les choix', () => {
  const k = body('*Il sourit.* "Entrez!" dit-il. **Vite**: la nuit tombe.', null, true)[0].kids,
    t = k.map(txt).join('');
  assert.equal(k[0].className, 'act');
  assert.equal(k[0].textContent, 'Il sourit.');
  assert.ok(k.some(x => x.tagName == 'B' && x.textContent == 'Vite'));
  assert.equal(t, 'Il sourit. «' + NB + 'Entrez' + FN + '!' + NB + '» dit-il. Vite' + NB + ': la nuit tombe.');
  assert.equal(line('*Je recule.* Non!').map(txt).join(''), 'Je recule. Non' + FN + '!');
});

test('les paroles sont repérées pour s’afficher en clair, le récit autour non', () => {
  const says = t => body(t)[0].kids.filter(x => x.className == 'say').map(txt);
  assert.deepEqual(says('Elle lève les yeux. « Dix minutes. » Puis elle sourit.'), ['«' + NB + 'Dix minutes.' + NB + '»']);
  assert.deepEqual(says('"Entrez", dit-il, "et fermez."'), ['«' + NB + 'Entrez' + NB + '»', '«' + NB + 'et fermez.' + NB + '»'], 'guillemets droits');
  assert.deepEqual(says('Il hésite. « Je ne sais pas…'), ['«' + NB + 'Je ne sais pas…'], 'réplique non fermée : jusqu’à la fin du paragraphe');
  assert.deepEqual(says('Trois contrats :\n- Rue Pinel, rang D\n- Quai de l’Aubre, rang E'), [], 'une liste à puces reste du récit');
  assert.deepEqual(says('Le Bureau parle de « phénomène saisonnier », et la « Mère » Lucienne rit.'), [], 'un terme cité reste du récit');
  assert.deepEqual(says('« Treize heures trente et une », dit-elle.'), ['«' + NB + 'Treize heures trente et une' + NB + '»'], 'réplique sans ponctuation finale, assez longue');
  assert.equal(line('*Je recule.* « Non ! »').filter(x => x.className == 'say').length, 1, 'même règle dans l’aperçu et les choix');
  const n = body('*Le papier dit : « Sortie refusée. » Le tampon est frais.* **Vite**', null)[0].kids.map(txt).join('');
  assert.ok(!n.includes('*'), 'narrateur : astérisques d’une paire coupée par une réplique retirés');
  assert.match(n, /Vite$/, 'le gras reste');
  const u = body('*Je recule.* « Non. »', null, true)[0].kids;
  assert.equal(u[0].className, 'act', 'joueur : le geste garde son rendu');
});
