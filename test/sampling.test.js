import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.document = { createElement: () => ({}), querySelector: () => null, querySelectorAll: () => [] };
globalThis.matchMedia = () => ({ matches: false });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { ANT_VERSION, authH, chat } = await import('../js/ai.js');
const { S } = await import('../js/state.js');

const ms = [
  { role: 'system', content: 'SYS' },
  { role: 'user', content: 'Bonjour' }
];

test('Claude est appelé avec la version d’API 2026-10-21', () => {
  assert.equal(ANT_VERSION, '2026-10-21');
  assert.equal(authH('k')['anthropic-version'], '2026-10-21');
  assert.equal(authH('k')['x-api-key'], 'k');
});

test('température, Top P et Top K ne partent jamais, quel que soit le modèle', async () => {
  const bodies = [],
    heads = [];
  globalThis.fetch = async (u, o) => {
    bodies.push(JSON.parse(o.body));
    heads.push(o.headers);
    return new Response(JSON.stringify({ content: [{ type: 'text', text: 'Ok.' }], stop_reason: 'end_turn' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };
  Object.assign(S, { keys: { claude: 'k' }, models: {}, tpm: 0, tpms: {} });
  for (const m of ['', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-5-5']) {
    S.models.claude = m;
    await chat(ms);
    const b = bodies.at(-1);
    for (const k of ['temperature', 'top_p', 'top_k']) assert.ok(!(k in b), (m || 'défaut') + ' : ' + k);
    assert.equal(heads.at(-1)['anthropic-version'], '2026-10-21');
  }
});
