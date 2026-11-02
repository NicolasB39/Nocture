import { test } from 'node:test';
import assert from 'node:assert/strict';

// send.js touche au DOM au chargement : un faux document suffit, seul localStorage compte ici.
const node = () =>
  new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k == 'then' ? undefined : node()),
    apply: () => node(),
    set: () => true
  });
globalThis.document = node();
globalThis.window = node();
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
const L = {};
globalThis.localStorage = {
  getItem: k => L[k] ?? null,
  setItem: (k, v) => (L[k] = String(v)),
  removeItem: k => delete L[k]
};
const { cold, heat, hotOf } = await import('../js/send.js');
const { S } = await import('../js/state.js');

test('cache : heure et point mémoire gardés sur l’appareil, survivent à un rechargement', () => {
  S.c1h = false;
  const s = { id: 'h1', messages: [{ role: 'assistant', content: 'x', t: Date.now() - 600e3 }], mem: { upto: 4 } };
  assert.equal(cold(s), true, 'dernière réponse il y a 10 minutes : expiré');
  heat(s, Date.now() - 60e3, 4);
  assert.equal(cold(s), false, 'relancé il y a une minute : encore chaud');
  assert.deepEqual(hotOf(s).upto, 4);
  heat(s, Date.now());
  assert.equal(hotOf(s).upto, 4, 'une relance garde le point mémoire du dernier envoi');
  L['hot:h1'] = String(Date.now());
  assert.equal(cold(s), true, 'ancien format (nombre seul) : tenu pour expiré, sans erreur');
  L['hot:h1'] = '{';
  assert.deepEqual(hotOf(s), {}, 'valeur illisible : ignorée');
});
