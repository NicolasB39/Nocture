import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { buildInfo } from '../js/prompt.js';
import { S, ctx } from '../js/state.js';
import { clean } from '../js/store.js';

const sc = () =>
  clean({
    id: 's',
    name: 'S',
    system: 'Narrateur.',
    pname: 'Léa',
    messages: [
      { role: 'user', content: 'Bonjour' },
      { role: 'assistant', content: 'Salut.' },
      { role: 'user', content: 'J’entre.' }
    ]
  });

test('sans nom propre, une histoire prend le nom du joueur par défaut des Réglages', () => {
  const s = sc();
  s.pname = '';
  S.pname = 'Kael';
  try {
    assert.match(buildInfo(s).msgs[0].content, /Nom : Kael/);
    s.pname = 'Léa';
    assert.match(buildInfo(s).msgs[0].content, /Nom : Léa/);
  } finally {
    delete S.pname;
  }
});

beforeEach(() => {
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('l’indication de régénération part à la fin du dernier tour, pas dans le système', () => {
  const s = sc(),
    ms = buildInfo(s, false, '  plus court, fais parler {{user}}  ').msgs,
    l = ms.at(-1).content;
  assert.match(l, /<indication>\nPour cette réponse seulement, le joueur demande : plus court, fais parler Léa\n/);
  assert.ok(l.startsWith('J’entre.'));
  assert.ok(!ms[0].content.includes('indication'), 'la partie en cache ne bouge pas');
  assert.equal(s.messages.at(-1).content, 'J’entre.', 'rien n’est enregistré dans l’histoire');
});

test('sans indication, ou vide, le prompt est identique', () => {
  const a = buildInfo(sc()).msgs;
  assert.deepEqual(buildInfo(sc(), false, '').msgs, a);
  assert.deepEqual(buildInfo(sc(), false, '   ').msgs, a);
  assert.ok(!a.at(-1).content.includes('<indication>'));
});
