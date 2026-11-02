import { test } from 'node:test';
import assert from 'node:assert/strict';
import './stub.js';

const { chat, cold } = await import('../js/ai.js');
const { S } = await import('../js/state.js');

const ok = () =>
  new Response(JSON.stringify({ content: [{ type: 'text', text: 'Suite.' }], stop_reason: 'end_turn' }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

test('cache : chaud seulement après une réponse reçue, et gardé sur l’appareil', async () => {
  Object.assign(S, { key: 'k', model: '', c1h: false });
  const s = { id: 'h1', messages: [{ role: 'assistant', content: 'x', t: Date.now() - 600e3 }] };
  const ms = [{ role: 'user', content: 'Bonjour' }];
  assert.equal(cold(s), true, 'dernière réponse il y a 10 minutes : expiré');
  globalThis.fetch = async () => new Response('{"error":{"message":"refusée"}}', { status: 401 });
  await assert.rejects(chat(ms, { primary: true, sid: s.id }));
  assert.equal(cold(s), true, 'requête échouée : le cache reste froid');
  globalThis.fetch = async () => ok();
  await chat(ms, { primary: true, sid: s.id });
  assert.equal(cold(s), false, 'réponse reçue : chaud, même après un rechargement (lu sur l’appareil)');
});
