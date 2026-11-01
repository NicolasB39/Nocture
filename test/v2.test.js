import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normU, toAnt } from '../js/ai.js';
import { clip } from '../js/memory.js';
import { merge } from '../js/merge.js';
import { last, note, status } from '../js/rate.js';
import { clean } from '../js/store.js';

const ms = [
  { role: 'system', content: 'SYS' },
  { role: 'assistant', content: 'a0' },
  { role: 'user', content: 'u1' },
  { role: 'user', content: 'u1b' },
  { role: 'assistant', content: 'a1' },
  { role: 'user', content: 'u2 + queue' }
];

test('toAnt : système et avant-dernier message marqués pour le cache', () => {
  const b = toAnt(ms, { model: 'm', max: 0, stream: true });
  assert.deepEqual(b.system, [{ type: 'text', text: 'SYS', cache_control: { type: 'ephemeral' } }]);
  assert.equal(b.max_tokens, 4096);
  assert.equal(b.stream, true);
  assert.equal(b.messages[0].role, 'user');
  assert.equal(b.messages[2].content, 'u1\n\nu1b');
  assert.deepEqual(b.messages.at(-2).content, [{ type: 'text', text: 'a1', cache_control: { type: 'ephemeral' } }]);
  assert.equal(b.messages.at(-1).content, 'u2 + queue');
  assert.ok(b.messages.every((m, i) => !i || m.role !== b.messages[i - 1].role));
});

test('toAnt : durée d’une heure, jamais d’échantillonnage (API 2026-10-21)', () => {
  const b = toAnt(ms, { model: 'm', max: 900, ttl: true });
  assert.equal(b.system[0].cache_control.ttl, '1h');
  assert.equal(b.max_tokens, 900);
  for (const k of ['temperature', 'top_p', 'top_k']) assert.ok(!(k in b), k);
});

test('toAnt : requête à un seul message, sans marqueur de message', () => {
  const b = toAnt([{ role: 'system', content: 'S' }, { role: 'user', content: 'x' }], { model: 'm' });
  assert.equal(b.messages.length, 1);
  assert.equal(typeof b.messages[0].content, 'string');
});

test('normU convertit l’usage Claude au format des compteurs', () => {
  const u = normU({ input_tokens: 50, cache_read_input_tokens: 1000, cache_creation_input_tokens: 200, output_tokens: 300 });
  assert.equal(u.prompt_tokens, 1250);
  assert.equal(u.completion_tokens, 300);
  assert.equal(u.total_tokens, 1550);
  assert.equal(u.prompt_tokens_details.cached_tokens, 1000);
  assert.equal(u.cache_write, 200);
  assert.equal(u.rl, 250);
  assert.equal(normU(null), null);
});

test('note lit les en-têtes de débit d’Anthropic et le cache', () => {
  const h = new Headers({
    'anthropic-ratelimit-input-tokens-limit': '30000',
    'anthropic-ratelimit-input-tokens-remaining': '29000',
    'anthropic-ratelimit-requests-remaining': '49'
  });
  note(h, normU({ input_tokens: 10, cache_read_input_tokens: 900, cache_creation_input_tokens: 90, output_tokens: 5 }), 'claude-x', true);
  assert.equal(last.cached, 900);
  assert.equal(last.wrote, 90);
  const s = status('claude-x');
  assert.equal(s.lim, 30000);
  assert.equal(s.src, 'api');
});

test('clip coupe en fin de phrase, sinon au mot', () => {
  const t = 'Première phrase complète. Deuxième phrase qui déborde largement de la limite fixée.';
  assert.equal(clip(t, 40), 'Première phrase complète.');
  assert.equal(clip('mot '.repeat(30), 20), 'mot mot mot mot mot…');
  assert.equal(clip('court', 10), 'court');
});

test('clean ne garde les variantes que sur le dernier message', () => {
  const v = [{ content: 'a' }, { content: 'b' }];
  const s = clean({
    id: 'x',
    messages: [
      { role: 'assistant', content: 'a', alts: v, ai: 0 },
      { role: 'user', content: 'u' },
      { role: 'assistant', content: 'a', alts: v, ai: 1 }
    ]
  });
  assert.equal(s.messages[0].alts, undefined);
  assert.equal(s.messages[2].alts.length, 2);
  assert.equal(s.messages[2].ai, 1);
});

test('merge sur fiches résumées : historique vide ignoré, copie de conflit tracée', () => {
  const l = [
    { id: 'a', name: 'A', updated: 30, n: 4 },
    { id: 'g', name: 'G', updated: 5, remote: true, n: 0 }
  ];
  const r = [{ id: 'a', name: 'A', updated: 20, n: 3 }];
  const m = merge(l, r, {}, {}, { seen: { a: 10 }, now: 99, nid: () => 'c1' });
  assert.deepEqual(m.keep.map(x => x.id).sort(), ['a', 'c1']);
  assert.deepEqual(m.copies.map(([c, src, fromR]) => [c.id, src, fromR]), [['c1', 'a', true]]);
  assert.ok(!m.keep.some(x => x.id == 'g'));
});
