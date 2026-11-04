import assert from 'node:assert/strict';
import test from 'node:test';
import './stub.js';

globalThis.window = globalThis;

const { chat, toAnt } = await import('../js/ai.js');
const { blocks, prefixDiff, tailParts } = await import('../js/journal.js');
const { S } = await import('../js/state.js');

const req = (msgs, o = {}) =>
  toAnt(
    [
      {
        role: 'system',
        content: 'FIXE' + (o.mem || ''),
        blocks: [
          { text: 'FIXE', cache: true },
          { text: o.mem || '', cache: true }
        ]
      },
      ...msgs
    ],
    { model: o.model || 'claude-sonnet-5-5', effort: 'low' }
  );
const u = (t, tail = '') => ({ role: 'user', content: t + tail });
const a = t => ({ role: 'assistant', content: t });

test('blocs du préfixe : modèle et effort, partie fixe, mémoire, puis messages', () => {
  const b = blocks(req([u('un')], { mem: 'MEM' }));
  assert.deepEqual(
    b.map(x => x[0]),
    ['du modèle ou de l’effort', 'de la partie fixe du prompt', 'de la mémoire (résumé, souvenirs, relations, note)', 'du message 1']
  );
});

test('tour suivant : le cache du tour précédent est relu en entier', () => {
  const p = req([u('un'), a('A1'), u('deux', '\n\n<rappel>\nx\n</rappel>')]),
    c = req([u('un'), a('A1'), u('deux'), a('A2'), u('trois', '\n\n<rappel>\nx\n</rappel>')]);
  assert.equal(prefixDiff(p, c), null);
  // Régénération : même requête, même préfixe.
  assert.equal(prefixDiff(p, p), null);
});

test('ce qui réécrit le cache est nommé : mémoire, modèle, message modifié', () => {
  const p = req([u('un'), a('A1'), u('deux')], { mem: 'M1' });
  assert.equal(prefixDiff(p, req([u('un'), a('A1'), u('deux'), a('A2'), u('trois')], { mem: 'M2' })), 'de la mémoire (résumé, souvenirs, relations, note)');
  assert.equal(prefixDiff(p, req([u('un'), a('A1'), u('deux')], { mem: 'M1', model: 'claude-opus-5-5' })), 'du modèle ou de l’effort');
  assert.equal(prefixDiff(p, req([u('un'), a('A1 modifiée'), u('deux')], { mem: 'M1' })), 'du message 2');
});

test('appel d’avant la v90 : la mémoire reste le dernier bloc, les fiches en cache sont nommées à part', () => {
  const sys = mid => [{ type: 'text', text: 'Fixe' }, { type: 'text', text: mid }, { type: 'text', text: 'Mémoire' }];
  const p = { model: 'm', system: sys('Fiche A'), messages: [{ role: 'user', content: 'un' }, { role: 'assistant', content: 'A1' }, { role: 'user', content: 'deux' }] };
  assert.equal(prefixDiff(p, { ...p, system: sys('Fiche B') }), 'des personnages récurrents');
  assert.equal(prefixDiff(p, { ...p, system: [...sys('Fiche A').slice(0, 2), { type: 'text', text: 'Autre' }] }), 'de la mémoire (résumé, souvenirs, relations, note)');
});

test('la fin de requête est découpée en blocs ajoutés par l’application', () => {
  const b = req([u('Je pousse la porte.', '\n\n<lorebook>\n' + 'L'.repeat(340) + '\n</lorebook>\n\n<etat_precedent>\nLieu: Quai\n</etat_precedent>')]);
  const t = Object.fromEntries(tailParts(b));
  assert.ok(t['Dernier message du joueur'] > 0 && t['Dernier message du joueur'] < 15);
  assert.ok(t['Lorebook déclenché'] > 100);
  assert.ok(t['État précédent'] > 0);
});

test('journal coché sans base ouverte : l’appel aboutit quand même', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ content: [{ type: 'text', text: 'Ok.' }], stop_reason: 'end_turn', usage: { input_tokens: 5, output_tokens: 2 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  Object.assign(S, { key: 'k', model: '', journal: true });
  assert.equal((await chat([u('Bonjour')], { kind: 'tour' })).t, 'Ok.');
  S.journal = false;
});
