import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import './stub.js';


const { BUSY, backoff, chat, lastTurn, waitMsg } = await import('../js/ai.js');
const { S } = await import('../js/state.js');

const ok = t =>
  new Response(JSON.stringify({ content: [{ type: 'text', text: t }], stop_reason: 'end_turn' }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
const fail = s => new Response(JSON.stringify({ error: { message: 'erreur ' + s } }), { status: s });
const queue = rs => {
  const calls = [];
  globalThis.fetch = async () => {
    calls.push(1);
    const r = rs.shift();
    if (r instanceof Error) throw r;
    return r;
  };
  return calls;
};
const ms = [{ role: 'user', content: 'Bonjour' }];

beforeEach(() => {
  Object.assign(S, { key: 'k', model: '' });
});

test('backoff double à chaque essai, borné, et suit retry-after', () => {
  assert.deepEqual([0, 1, 2].map(a => backoff(a)), [2, 4, 8]);
  assert.deepEqual([0, 1, 2].map(a => backoff(a, null, 7.5, 90)), [15, 30, 60], 'limite de débit');
  assert.equal(backoff(9), 60);
  assert.equal(backoff(0, '7'), 7);
  assert.equal(backoff(0, 'n’importe quoi'), 2);
  assert.equal(backoff(0, '0'), 2);
});

test('les erreurs passagères sont retentées, pas les erreurs de requête', () => {
  for (const s of [500, 502, 503, 504, 529]) assert.ok(BUSY.has(s), s);
  for (const s of [400, 401, 403, 404, 429]) assert.ok(!BUSY.has(s), s);
});

test('une 503 est retentée puis la réponse arrive', async () => {
  const why = [];
  const calls = queue([fail(503), ok('Le récit continue.')]);
  const r = await chat(ms, { onWait: (w, y) => w && why.push(y) });
  assert.equal(r.t, 'Le récit continue.');
  assert.equal(calls.length, 2);
  assert.ok(why.length && why.every(y => y == 'busy'));
});

test('une coupure réseau avant réponse est retentée', async () => {
  const why = [];
  const calls = queue([new TypeError('Failed to fetch'), ok('Me revoilà.')]);
  const r = await chat(ms, { onWait: (w, y) => w && why.push(y) });
  assert.equal(r.t, 'Me revoilà.');
  assert.equal(calls.length, 2);
  assert.ok(why.every(y => y == 'net'));
});

test('une erreur 400 part tout de suite, sans nouvel essai', async () => {
  const calls = queue([fail(400), ok('jamais')]);
  await assert.rejects(chat(ms), /erreur 400/);
  assert.equal(calls.length, 1);
});

test('un 429 attend le délai de retry-after (90 s au plus), sinon 15 s', async () => {
  const first = async h => {
    const ac = new AbortController();
    let w0 = 0;
    queue([new Response(JSON.stringify({ error: { message: 'limite' } }), { status: 429, headers: h }), ok('jamais')]);
    await assert.rejects(
      chat(ms, {
        ac,
        onWait: (w, why) => {
          if (w && !w0) {
            w0 = w;
            assert.equal(why, 'retry');
            // Après coup : la pause d'une seconde qui suit écoute alors l'annulation et s'arrête aussitôt.
            setTimeout(() => ac.abort('stop'));
          }
        }
      }),
      /Annulé/
    );
    return w0;
  };
  assert.equal(await first({ 'retry-after': '7' }), 7);
  assert.equal(await first({ 'retry-after': '1' }), 1);
  assert.equal(await first({ 'retry-after': '600' }), 90);
  assert.equal(await first({}), 15);
});

test('annuler pendant l’attente arrête les essais', async () => {
  const ac = new AbortController();
  const calls = queue([fail(503), ok('jamais')]);
  setTimeout(() => ac.abort('stop'), 300);
  await assert.rejects(chat(ms, { ac }), /Annulé/);
  assert.equal(calls.length, 1);
});

test('les messages d’attente nomment la cause', () => {
  assert.match(waitMsg(4, 'busy'), /surchargé ou en panne : nouvelle tentative dans 4 s/);
  assert.match(waitMsg(3, 'net'), /connexion perdue/);
});

// Flux simulé : un morceau par lecture, puis fin propre ou coupure réseau.
const sse = (parts, cut = false) => {
  const enc = new TextEncoder();
  let i = 0;
  return new Response(
    new ReadableStream({
      pull(c) {
        if (i < parts.length) c.enqueue(enc.encode(parts[i++]));
        else if (cut) c.error(new TypeError('network error'));
        else c.close();
      }
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } }
  );
};
const ev = o => 'event: ' + o.type + '\ndata: ' + JSON.stringify(o) + '\n\n';
const antStart = ev({ type: 'message_start', message: { usage: { input_tokens: 50, output_tokens: 1 } } }),
  antText = t => ev({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } });

test('une coupure réseau en pleine réponse garde le texte reçu', async () => {
  queue([sse([antStart, antText('La pluie tombe. '), antText('Il se tait.')], true)]);
  const r = await chat(ms, { od: () => {} });
  assert.equal(r.t, 'La pluie tombe. Il se tait.');
  assert.equal(r.partial, true);
});

test('un flux fermé sans fin annoncée est une réponse incomplète', async () => {
  queue([sse([antStart, antText('Début du récit.')])]);
  assert.equal((await chat(ms, { od: () => {} })).partial, true);
  queue([sse([antStart, antText('Récit entier.'), ev({ type: 'message_delta', delta: { stop_reason: 'end_turn' } }), ev({ type: 'message_stop' })])]);
  assert.equal((await chat(ms, { od: () => {} })).partial, false);
});

test('une surcharge annoncée dans le flux de Claude avant tout texte est retentée', async () => {
  const why = [];
  const calls = queue([
    sse([antStart, ev({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } })]),
    sse([antStart, antText('Le récit reprend.'), ev({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } }), ev({ type: 'message_stop' })])
  ]);
  const r = await chat(ms, { od: () => {}, onWait: (w, y) => w && why.push(y) });
  assert.equal(r.t, 'Le récit reprend.');
  assert.equal(calls.length, 2);
  assert.ok(why.length && why.every(y => y == 'busy'));
});

test('une réponse de Claude interrompue compte une sortie estimée, pas 1 jeton', async () => {
  const t = 'Une longue phrase de récit, reçue avant la coupure du réseau. '.repeat(10);
  queue([sse([antStart, antText(t)], true)]);
  const r = await chat(ms, { od: () => {}, primary: true });
  assert.equal(r.partial, true);
  const e = lastTurn().e;
  assert.ok(e[1] > 100, 'sortie estimée sur le texte : ' + e[1]);
  assert.equal(e[3], 1, 'marquée comme estimée');
});
