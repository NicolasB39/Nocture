import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clean } from '../js/store.js';
import { buildInfo } from '../js/prompt.js';
import { SUM_BATCH, SUM_START, sumGate, toAnt } from '../js/ai.js';
import { SUM_KEEP } from '../js/memory.js';
import { S, ctx } from '../js/state.js';

const sc = (o = {}) => clean({ id: 's', name: 'S', system: 'SYS', remote: true, noChoices: true, messages: [], ...o });
const re = k => new RegExp('(^|[^a-z0-9])' + k + '(?![a-z0-9])');
// Deux fiches de cette taille dépassent ensemble le budget de la partie fixe (CACHED_FREE, 8 000 tokens).
const big = 'x'.repeat(10000);
// Partie fixe, mémoire (le dernier bloc du système) et dernier message.
const parts = r => [r.msgs[0].blocks[0].text, r.msgs[0].blocks.at(-1).text, r.msgs.at(-1).content];

beforeEach(() => {
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('un personnage « toujours » en scène n’apparaît qu’une fois, dans la partie stable', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'a', text: 'Fiche Alice ' + big, always: true, images: [], keys: [re('alice')] },
    { name: 'Bob', sum: 'b', text: 'Fiche Bob ' + big, always: false, images: [], keys: [re('bob')] }
  ];
  const r = buildInfo(sc({ messages: [{ role: 'user', content: 'Alice et Bob entrent' }] })),
    [stable, mem, last] = parts(r),
    all = r.msgs.map(m => m.content).join('\n');
  assert.equal(all.split('## Alice').length - 1, 1);
  assert.match(stable, /## Alice\nFiche Alice/);
  assert.doesNotMatch(last, /## Alice/);
  assert.match(last, /## Bob/);
  assert.doesNotMatch(mem + stable, /## Bob/);
});

test('lorebook au-delà du budget : les entrées « toujours » dans la partie stable, les déclenchées dans la queue', () => {
  ctx.lore = [
    { keys: [], always: true, pr: 0, text: 'Règle du monde.' },
    { keys: [/porte/], always: false, pr: 2, text: 'La porte grince. ' + big },
    { keys: [/fenêtre/], always: false, pr: 1, text: 'La fenêtre est rouge. ' + big }
  ];
  const r = buildInfo(sc({ messages: [{ role: 'user', content: 'j’ouvre la porte' }] })),
    [stable, , last] = parts(r);
  assert.match(stable, /<lorebook>\nRègle du monde\.\n<\/lorebook>/);
  assert.doesNotMatch(last, /Règle du monde/);
  assert.match(last, /La porte grince/);
  assert.doesNotMatch(last + stable, /La fenêtre est rouge/);
});

test('la partie stable ne dépend ni de la mémoire ni de la scène', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'a', text: 'A ' + big, always: false, images: ['alice_x'], keys: [re('alice')] },
    { name: 'Bob', sum: 'b', text: 'B ' + big, always: true, images: ['bob_y'], keys: [re('bob')] }
  ];
  ctx.lore = [{ keys: [], always: true, pr: 0, text: 'Règle.' }];
  const at = (txt, summary) =>
    parts(buildInfo(sc({ messages: [{ role: 'user', content: txt }], mem: { summary, memories: [], upto: 0, relations: { Alice: 'amie' } } })));
  const [a1, m1] = at('je vois Alice', 'Résumé un.'),
    [a2, m2] = at('personne', 'Résumé deux.');
  assert.equal(a1, a2);
  assert.notEqual(m1, m2);
  assert.match(m1, /^\n\n<previous_history>/);
  assert.doesNotMatch(a1, /previous_history|<relations>/);
  assert.match(a1, /- Alice : alice_x\n- Bob : bob_y/);
});

test('toAnt : sans mémoire, un seul bloc système', () => {
  const b = toAnt(
    [
      { role: 'system', content: 'STABLE', blocks: [{ text: 'STABLE', cache: true }, { text: '', cache: true }] },
      { role: 'user', content: 'u1' }
    ],
    { model: 'm' }
  );
  assert.equal(b.system.length, 1);
});

test('sumGate : en jeu la mémoire attend 120 messages, en début de séance 50, et en garde 40', () => {
  const run = (us, hi) => {
    let go = false;
    return us.map(u => (go = sumGate(u, go, hi)));
  };
  assert.deepEqual(run([119, 120, 100, 60, 41, 40]), [false, true, true, true, true, false]);
  assert.deepEqual(run([49, 50, 45, 40], SUM_START), [false, true, true, false], 'début de séance');
});

test('mémoire : paquets de 20, sans descendre sous 40 messages gardés', () => {
  // Même calcul que summarize : jamais plus que ce qui dépasse SUM_KEEP.
  const drain = (u, hi) => {
    let go = false,
      calls = 0;
    while ((go = sumGate(u, go, hi))) {
      if (u - SUM_KEEP < 10) break;
      u -= Math.min(SUM_BATCH, u - SUM_KEEP);
      calls++;
    }
    return [calls, u];
  };
  assert.deepEqual(drain(120), [4, 40]);
  assert.deepEqual(drain(75, SUM_START), [2, 40], 'début de séance : 20 puis 15');
  assert.deepEqual(drain(45, SUM_START), [0, 45], 'moins de 50 en attente : rien');
  assert.deepEqual(drain(65, SUM_START), [1, 45], 'reste de 5 : attend le lot suivant');
});
