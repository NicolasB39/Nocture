import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

globalThis.document = { createElement: () => ({}), querySelector: () => null, querySelectorAll: () => [] };
globalThis.matchMedia = () => ({ matches: false });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { EFF_BETA, FB_BETA, antBetas, chat, lastTurn, toAnt } = await import('../js/ai.js');
const { LONG, priceOf } = await import('../js/cost.js');
const { buildInfo, effortCut, effortPlan, effortSet } = await import('../js/prompt.js');
const { S, ctx } = await import('../js/state.js');
const { reset } = await import('../js/rate.js');

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
  Object.assign(S, { provider: 'claude', keys: { claude: 'k' }, models: {}, tpm: 0, tpms: {}, c1h: false });
  reset();
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

test('refus sans réponse en bloc, et filtre de contenu d’un fournisseur compatible OpenAI', async () => {
  queue([
    new Response(JSON.stringify({ model: 'claude-sonnet-5-5', content: [], stop_reason: 'refusal', stop_details: { category: 'cyber' }, usage: { input_tokens: 9, output_tokens: 0 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ]);
  await assert.rejects(chat(ms, { model: 'claude-sonnet-5-5' }), e => e.refusal && /cybersécurité/.test(e.message));
  Object.assign(S, { provider: 'groq', keys: { groq: 'k' } });
  queue([
    new Response(JSON.stringify({ choices: [{ message: { content: '' }, finish_reason: 'content_filter' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  ]);
  await assert.rejects(chat(ms), e => e.refusal && /filtre de contenu/.test(e.message));
});

test('relais : le coût est compté pour le modèle qui a vraiment répondu', async () => {
  queue([sse([start('claude-sonnet-5'), text('Repris par un autre modèle.'), stop('end_turn')])]);
  const r = await chat(ms, { od: () => {}, model: 'claude-sonnet-5-5', primary: true });
  assert.equal(r.t, 'Repris par un autre modèle.');
  assert.equal(lastTurn().key, 'claude/claude-sonnet-5');
});

test('Haiku 5.5 au-delà de 100 000 tokens de prompt : compté sous sa propre ligne, au tarif majoré', async () => {
  queue([sse([start('claude-haiku-5-5', { input_tokens: 120000, output_tokens: 1 }), text('Long.'), stop('end_turn')])]);
  await chat(ms, { od: () => {}, model: 'claude-haiku-5-5', primary: true });
  assert.equal(lastTurn().key, 'claude/claude-haiku-5-5' + LONG);
  assert.deepEqual(priceOf(lastTurn().key), [0.5, 2.5, 0.05]);
  queue([sse([start('claude-haiku-5-5', { input_tokens: 90000, output_tokens: 1 }), text('Court.'), stop('end_turn')])]);
  await chat(ms, { od: () => {}, model: 'claude-haiku-5-5', primary: true });
  assert.equal(lastTurn().key, 'claude/claude-haiku-5-5');
});

test('changement d’effort en cours de partie : message d’effort dans l’historique, effort de départ gardé', () => {
  const m2 = ms.map(m => ({ ...m }));
  m2[2].effBefore = 'high';
  const b = toAnt(m2, { model: 'claude-sonnet-5-5', effort: 'high', effBase: 'low', fallback: true });
  assert.deepEqual(b.output_config, { effort: 'low' }, 'premier niveau inchangé : le cache tient');
  assert.deepEqual(b.messages[2], { role: 'system', content: [], output_config: { effort: 'high' } });
  assert.equal(b.messages[3].content, 'Je sors.');
  assert.equal(b.messages[1].content[0].cache_control.type, 'ephemeral', 'marqueur de cache avant le message d’effort');
  assert.ok(!('fallbacks' in b), 'pas de relais avec un changement d’effort');
  assert.equal(antBetas(b), EFF_BETA);
  // Modèle sans effort par message : l'effort actuel part en premier niveau, sans message.
  const o = toAnt(m2, { model: 'claude-sonnet-4-6', effort: 'high', effBase: 'low' });
  assert.deepEqual(o.output_config, { effort: 'high' });
  assert.ok(o.messages.every(m => m.role != 'system'));
});

test('effortSet et effortPlan : position du changement, régénération, fenêtre', () => {
  const s = { effort: 'low', messages: [{ role: 'user' }, { role: 'assistant' }] };
  effortSet(s, 'high');
  assert.deepEqual(s.effLog, [[0, 'low'], [2, 'high']]);
  s.messages.push({ role: 'user' });
  assert.deepEqual(effortPlan(s, 0), { base: 'low', marks: [[2, 'high']] });
  assert.deepEqual(effortPlan(s, 2), { base: 'high', marks: [] }, 'changement avant la fenêtre : premier niveau');
  // Régénération de la réponse précédente : le changement est ramené devant le dernier tour du joueur.
  const r = { effort: 'low', messages: [{ role: 'user' }, { role: 'assistant' }] };
  effortSet(r, 'medium');
  r.messages.pop();
  assert.deepEqual(effortPlan(r, 0).marks, [], 'devant le premier message envoyé : premier niveau');
  assert.equal(effortPlan(r, 0).base, 'medium');
  // Dernier message du joueur sans réponse (échec) : le changement vaut pour lui.
  const f = { effort: '', messages: [{ role: 'user' }, { role: 'assistant' }, { role: 'user' }] };
  effortSet(f, 'high');
  assert.deepEqual(f.effLog, [[0, ''], [2, 'high']]);
  // Retour à l'effort de départ : aucun message.
  effortSet(f, 'low');
  assert.deepEqual(effortPlan(f, 0).marks, []);
  // Messages retirés : le changement fait plus loin vaut dès la coupure.
  const c = { effort: 'high', effLog: [[0, 'low'], [6, 'medium'], [9, 'high']] };
  effortCut(c, 4);
  assert.deepEqual(c.effLog, [[0, 'low'], [4, 'high']]);
});

test('buildInfo pose le changement d’effort sur le bon message et donne l’effort de départ', () => {
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
  S.ctxLim = 0;
  const s = {
    id: 's',
    system: 'SYS',
    noChoices: true,
    effort: 'low',
    messages: [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' }
    ],
    mem: { summary: '', memories: [], upto: 0, relations: {} }
  };
  effortSet(s, 'high');
  s.messages.push({ role: 'user', content: 'c' });
  const r = buildInfo(s);
  assert.equal(r.effort, 'low');
  assert.deepEqual(r.msgs.filter(m => m.effBefore).map(m => [m.content.slice(0, 1), m.effBefore]), [['c', 'high']]);
});

test('effLog : clean filtre et trie, effortSet fond les changements déjà résumés', async () => {
  const { clean } = await import('../js/store.js');
  const c = clean({ id: 'a', messages: [], effLog: [[5, 'high'], [0, 'low'], [-1, 'low'], [2, 'max'], [3.5, 'low'], 'x', [1, 'medium']] });
  assert.deepEqual(c.effLog, [[0, 'low'], [1, 'medium'], [5, 'high']]);
  assert.deepEqual(clean({ id: 'b', messages: [] }).effLog, []);
  const s = { effort: 'low', effLog: [[0, 'low'], [3, 'high'], [6, 'medium']], messages: Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user' })), mem: { upto: 8 } };
  effortSet(s, 'high');
  assert.deepEqual(s.effLog, [[0, 'medium'], [12, 'high']]);
});

test('maintien du cache avec un message d’effort : en-tête bêta gardé, sans relais', async () => {
  const { keepWarm } = await import('../js/ai.js');
  const m2 = ms.map(m => ({ ...m }));
  m2[2].effBefore = 'high';
  queue([sse([start(), text('La pluie.'), stop('end_turn')])]);
  await chat(m2, { od: () => {}, model: 'claude-sonnet-5-5', effort: 'high', effBase: 'low', primary: true });
  assert.equal(req.h['anthropic-beta'], EFF_BETA);
  queue([new Response(JSON.stringify({ usage: { input_tokens: 1, cache_read_input_tokens: 3000, output_tokens: 0 } }), { status: 200 })]);
  assert.equal(await keepWarm(), true);
  assert.equal(req.h['anthropic-beta'], EFF_BETA);
  assert.ok(!('fallbacks' in req.b) && !('stream' in req.b));
  assert.equal(req.b.max_tokens, 0);
  assert.ok(req.b.messages.some(m => m.output_config?.effort == 'high'));
});

test('début de séance : la mémoire avance jusqu’à 40 messages gardés, un second appel attend la même mise à jour', async () => {
  const { app } = await import('../js/state.js');
  const { summarize } = await import('../js/ai.js');
  let calls = 0;
  globalThis.fetch = async (u, o) => {
    calls++;
    const n = (JSON.parse(o.body).messages.at(-1).content.match(/^\d+\. /gm) || []).length;
    const t = JSON.stringify({ resume: 'Résumé ' + calls, souvenirs: [], relations: {}, lignes: Array.from({ length: n }, (_, i) => 'ligne ' + i) });
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
    // En jeu, 40 messages en attente ne déclenchent rien (seuil 120).
    calls = 0;
    await summarize(s);
    assert.equal(calls, 0);
  } finally {
    Object.assign(app, { cur, busy });
  }
});
