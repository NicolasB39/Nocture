import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

globalThis.document = { createElement: () => ({}), querySelector: () => null, querySelectorAll: () => [] };
globalThis.matchMedia = () => ({ matches: false });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { FB_BETA, antBetas, chat, lastTurn, toAnt } = await import('../js/ai.js');
const { LONG, priceOf } = await import('../js/cost.js');
const { buildInfo } = await import('../js/prompt.js');
const { S, ctx } = await import('../js/state.js');

const sse = parts => {
  const enc = new TextEncoder();
  let i = 0;
  return new Response(
    new ReadableStream({
      pull(c) {
        if (i < parts.length) c.enqueue(enc.encode(parts[i++]));
        else c.close();
      }
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } }
  );
};
const ev = o => 'event: ' + o.type + '\ndata: ' + JSON.stringify(o) + '\n\n';
const start = (model = 'claude-sonnet-5-5', usage = { input_tokens: 50, output_tokens: 1 }) =>
  ev({ type: 'message_start', message: { model, usage } });
const text = t => ev({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } });
const stop = (reason, extra = {}) =>
  ev({ type: 'message_delta', delta: { stop_reason: reason, ...extra }, usage: { output_tokens: 40 } }) + ev({ type: 'message_stop' });
let req = null;
const queue = rs => {
  globalThis.fetch = async (u, o) => {
    req = { h: o.headers, b: JSON.parse(o.body) };
    return rs.shift();
  };
};
const ms = [
  { role: 'user', content: 'Bonjour' },
  { role: 'assistant', content: 'Il pleut.' },
  { role: 'user', content: 'Je sors.' }
];

beforeEach(() => {
  Object.assign(S, { key: 'k', model: '', c1h: false });
});

test('relais en cas de refus : demandé pour la narration sur les modèles qui le prennent en charge', async () => {
  queue([sse([start(), text('La pluie tombe.'), stop('end_turn')])]);
  await chat(ms, { od: () => {}, model: 'claude-sonnet-5-5', primary: true });
  assert.equal(req.b.fallbacks, 'default');
  assert.equal(req.h['anthropic-beta'], FB_BETA);
  // Pas pour la mémoire, ni pour Haiku 5.5 (pas de relais côté serveur).
  queue([sse([start(), text('Résumé.'), stop('end_turn')])]);
  await chat(ms, { od: () => {}, model: 'claude-sonnet-5-5' });
  assert.ok(!('fallbacks' in req.b) && !req.h['anthropic-beta']);
  assert.ok(!('fallbacks' in toAnt(ms, { model: 'claude-haiku-5-5', fallback: true })));
  assert.equal(toAnt(ms, { model: 'claude-opus-5-5-20261001', fallback: true }).fallbacks, 'default');
});

test('un refus en plein texte est une erreur, le texte reçu n’est pas gardé', async () => {
  queue([sse([start(), text('Elle sort le couteau'), stop('refusal', { stop_details: { type: 'refusal', category: 'general_harms' } })])]);
  await assert.rejects(chat(ms, { od: () => {}, model: 'claude-sonnet-5-5', primary: true }), e => {
    assert.equal(e.refusal, true);
    assert.match(e.message, /Claude a refusé.*contenu sensible/);
    return true;
  });
  assert.ok(lastTurn(), 'ce qui a été facturé est compté');
});

test('refus sans réponse en bloc', async () => {
  queue([
    new Response(JSON.stringify({ model: 'claude-sonnet-5-5', content: [], stop_reason: 'refusal', stop_details: { category: 'cyber' }, usage: { input_tokens: 9, output_tokens: 0 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ]);
  await assert.rejects(chat(ms, { model: 'claude-sonnet-5-5' }), e => e.refusal && /cybersécurité/.test(e.message));
});

test('relais : le coût est compté pour le modèle qui a vraiment répondu', async () => {
  queue([sse([start('claude-sonnet-5'), text('Repris par un autre modèle.'), stop('end_turn')])]);
  const r = await chat(ms, { od: () => {}, model: 'claude-sonnet-5-5', primary: true });
  assert.equal(r.t, 'Repris par un autre modèle.');
  assert.equal(lastTurn().key, 'claude-sonnet-5');
});

test('Haiku 5.5 au-delà de 100 000 tokens de prompt : compté sous sa propre ligne, au tarif majoré', async () => {
  queue([sse([start('claude-haiku-5-5', { input_tokens: 120000, output_tokens: 1 }), text('Long.'), stop('end_turn')])]);
  await chat(ms, { od: () => {}, model: 'claude-haiku-5-5', primary: true });
  assert.equal(lastTurn().key, 'claude-haiku-5-5' + LONG);
  assert.deepEqual(priceOf(lastTurn().key), [0.5, 2.5, 0.05]);
  queue([sse([start('claude-haiku-5-5', { input_tokens: 90000, output_tokens: 1 }), text('Court.'), stop('end_turn')])]);
  await chat(ms, { od: () => {}, model: 'claude-haiku-5-5', primary: true });
  assert.equal(lastTurn().key, 'claude-haiku-5-5');
});

test('début de séance : la mémoire avance jusqu’à 40 messages gardés, un second appel attend la même mise à jour', async () => {
  const { app } = await import('../js/state.js');
  const { summarize } = await import('../js/ai.js');
  let calls = 0,
    fmt = null;
  globalThis.fetch = async (u, o) => {
    calls++;
    fmt = JSON.parse(o.body).output_config?.format;
    const n = (JSON.parse(o.body).messages.at(-1).content.match(/^\d+\. /gm) || []).length;
    const t = JSON.stringify({ resume: 'Résumé ' + calls, souvenirs: [' Un fait. '], relations: [{ nom: 'Alice', relation: 'amie' }], lignes: Array.from({ length: n }, (_, i) => 'ligne ' + i) });
    return new Response(JSON.stringify({ model: 'claude-haiku-5-5', content: [{ type: 'text', text: t }], stop_reason: 'end_turn', usage: { input_tokens: 900, output_tokens: 200 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };
  const s = {
    id: 'seance',
    messages: Array.from({ length: 75 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'message ' + i })),
    mem: { summary: '', memories: [], relations: {}, lines: [], upto: 0 }
  };
  const cur = app.cur,
    busy = app.busy;
  try {
    // Envoi en cours : la mémoire n'est pas enregistrée ici (persist), la fin du tour s'en charge.
    Object.assign(app, { cur: s, busy: true });
    const p = summarize(s, true);
    assert.equal(summarize(s), p, 'même mise à jour, que l’envoi attend');
    await p;
    assert.equal(s.mem.upto, 35, '75 messages en attente : 35 résumés, 40 gardés');
    assert.equal(calls, 2, 'paquets de 20 puis 15');
    assert.equal(fmt?.type, 'json_schema', 'réponse en JSON garanti (sorties structurées)');
    assert.deepEqual(s.mem.relations, { Alice: 'amie' });
    assert.deepEqual(s.mem.memories, ['Un fait.']);
    // En jeu, 40 messages en attente ne déclenchent rien (seuil 120).
    calls = 0;
    await summarize(s);
    assert.equal(calls, 0);
  } finally {
    Object.assign(app, { cur, busy });
  }
});

test('sorties structurées : le schéma rejoint l’effort dans output_config, ou part seul', () => {
  const schema = { type: 'object', properties: {}, additionalProperties: false };
  assert.deepEqual(toAnt(ms, { model: 'claude-haiku-5-5', effort: 'low', schema }).output_config, {
    effort: 'low',
    format: { type: 'json_schema', schema }
  });
  assert.deepEqual(toAnt(ms, { model: 'claude-haiku-4-5', effort: 'low', schema }).output_config, { format: { type: 'json_schema', schema } });
  assert.equal(toAnt(ms, { model: 'claude-haiku-4-5' }).output_config, undefined);
});

test('mémoire : une réponse coupée ou un résumé vide laissent la mémoire intacte', async () => {
  const { app } = await import('../js/state.js');
  const { summarize } = await import('../js/ai.js');
  const cur = app.cur;
  for (const [stop, resume] of [
    ['max_tokens', 'Résumé coupé'],
    ['end_turn', '  ']
  ]) {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: stop == 'max_tokens' ? '{"resume":"' + resume : JSON.stringify({ resume, souvenirs: [], relations: [], lignes: [] }) }],
          stop_reason: stop,
          usage: { input_tokens: 900, output_tokens: 200 }
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    const s = {
      id: 'm-' + stop,
      messages: Array.from({ length: 130 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'message ' + i })),
      mem: { summary: 'Résumé précédent.', memories: [], relations: {}, lines: [], upto: 0 }
    };
    app.cur = null;
    await summarize(s);
    assert.equal(s.mem.summary, 'Résumé précédent.', stop);
    assert.equal(s.mem.upto, 0, stop);
  }
  app.cur = cur;
});
