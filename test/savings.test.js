import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import './stub.js';

globalThis.window = globalThis;

const { MEM_MODEL, chat, effortOk, keepWarm, lastTurn, lastWarmable, memModel, toAnt } = await import('../js/ai.js');
const { S, app } = await import('../js/state.js');
const { modelOf } = await import('../js/protocol.js');
const { extrasOf } = await import('../js/prompt.js');
const { clean } = await import('../js/store.js');
const { SESSION, clear } = await import('../js/stats.js');
const { capLevel } = await import('../js/statview.js');

const ms = [
  { role: 'system', content: 'SYS' },
  { role: 'user', content: 'Bonjour' },
  { role: 'assistant', content: 'Salut.' },
  { role: 'user', content: 'Je continue.' }
];
let bodies = [];
const stub = () => {
  bodies = [];
  globalThis.fetch = async (u, o) => {
    const b = JSON.parse(o.body);
    bodies.push(b);
    return new Response(
      JSON.stringify(
        String(u).includes('anthropic')
          ? {
              content: b.max_tokens === 0 ? [] : [{ type: 'text', text: 'Ok.' }],
              stop_reason: b.max_tokens === 0 ? 'max_tokens' : 'end_turn',
              usage: { input_tokens: 10, cache_read_input_tokens: 2000, cache_creation_input_tokens: 0, output_tokens: 0 }
            }
          : { choices: [{ message: { content: 'Ok.' }, finish_reason: 'stop' }] }
      ),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  };
};

beforeEach(() => {
  Object.assign(S, { key: 'k', model: '', memModel: '', c1h: false });
  app.cur = null;
  clear();
  stub();
});

test('effortOk : Opus et Sonnet 4.6 et suivants, Haiku 5.5, Fable ; pas Haiku 4.5', () => {
  for (const m of ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5', 'claude-fable-5-1', 'claude-sonnet-4-6', 'claude-opus-4-6', 'claude-opus-4-5'])
    assert.ok(effortOk(m), m);
  for (const m of ['claude-haiku-4-5', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022', 'llama', ''])
    assert.ok(!effortOk(m), m);
});

test('toAnt n’envoie l’effort qu’aux modèles qui le prennent, et seulement une valeur connue', () => {
  assert.deepEqual(toAnt(ms, { model: 'claude-sonnet-5-5', effort: 'low' }).output_config, { effort: 'low' });
  assert.equal(toAnt(ms, { model: 'claude-haiku-4-5', effort: 'low' }).output_config, undefined);
  assert.equal(toAnt(ms, { model: 'claude-sonnet-5-5', effort: 'max' }).output_config, undefined);
  assert.equal(toAnt(ms, { model: 'claude-sonnet-5-5' }).output_config, undefined);
});

test('la mémoire passe par Haiku 5.5, sauf choix explicite', () => {
  assert.equal(memModel(), MEM_MODEL);
  S.memModel = 'claude-sonnet-5-5';
  assert.equal(memModel(), 'claude-sonnet-5-5');
});

test('le modèle du scénario l’emporte sur celui des Réglages', () => {
  const s = clean({ id: 'a', messages: [], model: ' claude-haiku-5-5 ' });
  assert.equal(s.model, 'claude-haiku-5-5');
  assert.equal(modelOf(s), 'claude-haiku-5-5');
  assert.equal(clean({ id: 'a', messages: [], model: 3 }).model, '');
  assert.equal(modelOf(null), 'claude-sonnet-5-5');
  S.model = 'claude-opus-5-5';
  assert.equal(modelOf(null), 'claude-opus-5-5');
});

test('clean garde un effort connu et oublie le reste', () => {
  assert.equal(clean({ id: 'a', messages: [], effort: 'medium' }).effort, 'medium');
  assert.equal(clean({ id: 'a', messages: [], effort: 'turbo' }).effort, '');
});

test('keepWarm renvoie la dernière requête de narration avec max_tokens 0, sans streaming', async () => {
  await chat(ms, { primary: true, effort: 'low', od: null, model: 'claude-opus-5-5' });
  const real = bodies[0];
  assert.ok(lastWarmable());
  assert.equal(await keepWarm(), true);
  const w = bodies[1];
  assert.equal(w.max_tokens, 0);
  assert.ok(!('stream' in w));
  assert.deepEqual(w.system, real.system, 'même préfixe système');
  assert.deepEqual(w.messages, real.messages, 'mêmes messages, mêmes marqueurs de cache');
  assert.deepEqual(w.output_config, { effort: 'low' }, 'même effort : il fait partie du préfixe');
  assert.equal(SESSION['claude-opus-5-5'][2], 2, 'la relance est comptée dans les statistiques');
  assert.equal(SESSION['claude-opus-5-5'][4], 4000, 'cache lu compté à part');
});

test('lastTurn garde le dernier tour de narration, ni la mémoire ni la relance du cache', async () => {
  await chat(ms, { primary: true, model: 'claude-opus-5-5' });
  const t = lastTurn();
  assert.equal(t.key, 'claude-opus-5-5');
  assert.deepEqual(t.e.slice(2), [1, 0, 2000, 0, 0], 'une requête réelle, cache lu compté');
  await chat(ms, { model: MEM_MODEL });
  await keepWarm();
  assert.equal(lastTurn(), t);
});

test('keepWarm ne fait rien sans clé', async () => {
  await chat(ms, { primary: true });
  S.key = '';
  assert.equal(await keepWarm(), false);
  assert.equal(bodies.length, 1);
});

test('une requête de mémoire ne remplace pas la requête à maintenir', async () => {
  await chat(ms, { primary: true, model: 'claude-opus-5-5' });
  await chat(ms, { model: MEM_MODEL });
  assert.equal(lastWarmable().body.model, 'claude-opus-5-5');
});

test('extrasOf mesure le poids des choix et de l’état dans la sortie', () => {
  assert.equal(extrasOf([{ role: 'user', content: 'x' }]), null);
  const a = { role: 'assistant', content: 'x'.repeat(340), choices: ['*Je pars.* Adieu.', '*Je reste.*', 'Non.'], state: [['Lieu', 'Port']] };
  const r = extrasOf([a, { role: 'user', content: 'y' }, { role: 'assistant', content: 'z'.repeat(340) }]);
  assert.equal(r.n, 2);
  assert.ok(r.ch > 0 && r.st > 0);
  assert.equal(r.ch, extrasOf([a]).ch, 'moyenne sur les réponses qui ont des choix, pas sur toutes');
  assert.equal(r.avg, (r.ch + r.st) / 2, 'coût moyen par réponse, toutes réponses confondues');
  assert.ok(r.share > 0 && r.share < 0.5);
  assert.deepEqual(
    { ch: extrasOf([{ role: 'assistant', content: 'abc' }]).ch, st: extrasOf([{ role: 'assistant', content: 'abc' }]).st },
    { ch: 0, st: 0 }
  );
});

test('capLevel : rien sans plafond, alerte à 80 % puis à 100 %', () => {
  assert.equal(capLevel(10, 0), 0);
  assert.equal(capLevel(3, 5), 0);
  assert.equal(capLevel(4, 5), 0.8);
  assert.equal(capLevel(5, 5), 1);
  assert.equal(capLevel(9, 5), 1);
});
