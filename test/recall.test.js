import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { recall, recallTag } from '../js/recall.js';
import { buildInfo } from '../js/prompt.js';
import { S, ctx } from '../js/state.js';
import { clean } from '../js/store.js';

const filler = i => ({
  role: i % 2 ? 'assistant' : 'user',
  content: i % 2 ? 'La pluie tombe sur la ville, grise et lente.' : 'J’attends sous la pluie.'
});
const story = () => {
  const ms = Array.from({ length: 14 }, (_, i) => filler(i));
  ms[3] = {
    role: 'assistant',
    content:
      'La pluie redouble.\n\nMirelle te tend un pendentif d’argent gravé d’un phare. « Garde-le, il vient de Kervoz. »\n\n<choix>\n1. *Je le prends.* Merci.\n</choix>'
  };
  return ms;
};

beforeEach(() => {
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('retrouve l’ancien passage qui partage des mots rares avec la scène', () => {
  const ms = story();
  const r = recall(ms, 10, 'Je montre le pendentif à Mirelle sous la pluie.');
  assert.equal(r.length, 1);
  assert.equal(r[0].i, 3);
  assert.match(r[0].text, /pendentif d’argent/);
  assert.doesNotMatch(r[0].text, /choix|La pluie redouble/, 'blocs retirés, paragraphe le plus pertinent');
});

test('un seul mot commun, ou des mots trop répandus, ne suffisent pas', () => {
  const ms = story();
  assert.deepEqual(recall(ms, 10, 'Je pense à Mirelle.'), []);
  assert.deepEqual(recall(ms, 10, 'La pluie tombe sur la ville.'), []);
});

test('ne fouille que les messages qui ne sont plus envoyés', () => {
  const ms = story();
  assert.deepEqual(recall(ms, 3, 'Le pendentif de Mirelle.'), []);
  assert.deepEqual(recall(ms, 10, 'Le pendentif de Mirelle.', 0), []);
});

test('rend au plus n passages, dans l’ordre du récit', () => {
  const ms = story();
  ms[6] = { role: 'user', content: 'Je serre le pendentif de Mirelle dans ma poche.' };
  ms[1] = { role: 'assistant', content: 'On parle de Mirelle et de son pendentif au port.' };
  const r = recall(ms, 10, 'Le pendentif de Mirelle brille.', 2);
  assert.equal(r.length, 2);
  assert.ok(r[0].i < r[1].i);
});

test('le bloc nomme le joueur et prévient que les passages peuvent dater', () => {
  const t = recallTag([{ i: 1, role: 'user', text: 'Je pars.' }], 'Lou');
  assert.match(t, /<passages_anciens>[\s\S]*\[Lou\] Je pars\.[\s\S]*<\/passages_anciens>/);
  assert.match(t, /peuvent dater/);
  assert.equal(recallTag([]), '');
});

test('buildInfo joint le passage au dernier message, jamais au prompt système', () => {
  const ms = story();
  ms.push({ role: 'user', content: 'Je montre le pendentif à Mirelle.' });
  const s = clean({ id: 's', name: 'S', system: 'SYS', noChoices: true, messages: ms, mem: { upto: 10 } });
  const r = buildInfo(s);
  assert.doesNotMatch(r.msgs[0].content, /passages_anciens/);
  assert.match(r.msgs.at(-1).content, /<passages_anciens>[\s\S]*pendentif d’argent/);
  s.recallN = 0;
  assert.doesNotMatch(buildInfo(s).msgs.at(-1).content, /passages_anciens/);
});

test('sans rien de résumé ni de sorti de la fenêtre, rien n’est rappelé', () => {
  const ms = story();
  ms.push({ role: 'user', content: 'Je montre le pendentif à Mirelle.' });
  const s = clean({ id: 's', name: 'S', system: 'SYS', noChoices: true, messages: ms });
  assert.doesNotMatch(buildInfo(s).msgs.at(-1).content, /passages_anciens/);
});
