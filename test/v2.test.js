import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toAnt, usageOf } from '../js/ai.js';
import { clip } from '../js/memory.js';
import { merge } from '../js/merge.js';
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
  assert.equal(b.max_tokens, 8192);
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

test('usageOf : entrée cache compris, sortie, cache lu et écrit', () => {
  const u = usageOf({ input_tokens: 50, cache_read_input_tokens: 1000, cache_creation_input_tokens: 200, output_tokens: 300 });
  assert.deepEqual(u, { in: 1250, out: 300, read: 1000, write: 200 });
  assert.deepEqual(usageOf({}), { in: 0, out: 0, read: 0, write: 0 });
  assert.equal(usageOf({ cache_creation_input_tokens: 9, cache_creation: { ephemeral_1h_input_tokens: 9 } }).w1, 9);
  assert.equal(usageOf(null), null);
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
