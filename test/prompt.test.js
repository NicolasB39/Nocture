import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clean } from '../js/store.js';
import { buildInfo, estTok } from '../js/prompt.js';
import { parseEtat, choicesOf, lastEtat, split, raw } from '../js/format.js';
import { S, ctx } from '../js/state.js';

const sc = (o = {}) =>
  clean({ id: 's', name: 'S', system: 'SYS', messages: [], ...o });

beforeEach(() => {
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '' });
});

test('clean rejette ce qui n’est pas un scénario', () => {
  assert.equal(clean(null), null);
  assert.equal(clean({ id: '', messages: [] }), null);
  assert.equal(clean({ id: 'a' }), null);
});

test('clean filtre les messages invalides et borne mem.upto', () => {
  const r = clean({
    id: 'a',
    messages: [
      { role: 'user', content: 'ok' },
      { role: 'system', content: 'non' },
      { role: 'assistant', content: 42 }
    ],
    mem: { upto: 99, memories: ['m', 7] }
  });
  assert.equal(r.messages.length, 1);
  assert.equal(r.mem.upto, 1);
  assert.deepEqual(r.mem.memories, ['m']);
  assert.equal(r.name, 'Sans titre');
});

test('clean normalise les variantes', () => {
  const r = clean({
    id: 'a',
    messages: [{ role: 'assistant', content: 'b', alts: [{ content: 'a' }, { content: 'b' }], ai: 9 }]
  });
  assert.equal(r.messages[0].ai, 1);
  const u = clean({ id: 'a', messages: [{ role: 'assistant', content: 'b', alts: [{ content: 'b' }], ai: 0 }] });
  assert.equal(u.messages[0].alts, undefined);
});

test('tous les messages non résumés partent', () => {
  const s = sc({
    noChoices: true,
    messages: Array.from({ length: 6 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: 'm' + i
    }))
  });
  const r = buildInfo(s);
  assert.equal(r.win, 0);
  assert.equal(r.msgs.length, 7);
  assert.equal(r.msgs[0].role, 'system');
});

test('le format des choix vit dans le système, rien de plus sur le dernier message', () => {
  const s = sc({ messages: [{ role: 'user', content: 'bonjour' }] });
  const r = buildInfo(s);
  assert.match(r.msgs[0].content, /# Choix/);
  assert.equal(r.msgs.at(-1).content, 'bonjour');
});

test('le prompt système ne bouge pas quand l’historique avance', () => {
  const base = { noChoices: true, system: 'SYS' };
  const a = buildInfo(sc({ ...base, messages: [{ role: 'user', content: 'un' }] }));
  const b = buildInfo(
    sc({
      ...base,
      messages: [
        { role: 'user', content: 'un' },
        { role: 'assistant', content: 'deux' },
        { role: 'user', content: 'trois' }
      ]
    })
  );
  assert.equal(a.msgs[0].content, b.msgs[0].content);
});

test('le casting liste tous les personnages, les fiches ne suivent que les actifs, les images sont en cache', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'herboriste', text: 'A'.repeat(10000), always: false, images: ['alice_x'], keys: [/(^|[^a-z0-9])alice(?![a-z0-9])/] },
    { name: 'Bob', sum: 'garde', text: 'B'.repeat(10000), always: false, images: [], keys: [/(^|[^a-z0-9])bob(?![a-z0-9])/] }
  ];
  ctx.images = [{ code: 'alice_x', url: 'u' }];
  const r = buildInfo(sc({ noChoices: true, remote: true, messages: [{ role: 'user', content: 'je parle à Alice' }] }));
  assert.match(r.msgs[0].content, /- Alice : herboriste/);
  assert.match(r.msgs[0].content, /- Bob : garde/);
  const last = r.msgs.at(-1).content;
  assert.match(last, /## Alice/);
  assert.doesNotMatch(last, /## Bob/);
  assert.doesNotMatch(last, /alice_x/);
  assert.match(r.msgs[0].content.slice(0, r.msgs[0].cut), /<images_disponibles>\n- Alice : alice_x\n/);
});

test('en dessous du seuil, toutes les fiches vont dans la partie stable, aucune dans la queue', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'a', text: 'court', always: false, images: [], keys: [/zzz/] },
    { name: 'Bob', sum: 'b', text: 'court', always: false, images: [], keys: [/zzz/] }
  ];
  const r = buildInfo(sc({ noChoices: true, remote: true, messages: [{ role: 'user', content: 'rien' }] })),
    stable = r.msgs[0].content.slice(0, r.msgs[0].cut);
  assert.match(stable, /## Alice/);
  assert.match(stable, /## Bob/);
  assert.doesNotMatch(r.msgs.at(-1).content, /## Alice|## Bob/);
});

test('les trois étages de mémoire vivent dans le préfixe, pas dans la queue', () => {
  const s = sc({
    noChoices: true,
    note: 'ma note',
    messages: [{ role: 'user', content: 'suite' }],
    mem: { summary: 'ancien', lines: [{ i: 0, t: 'il a ouvert la porte' }], memories: ['la fiole est verte'], relations: {} }
  });
  const r = buildInfo(s),
    sys = r.msgs[0].content,
    last = r.msgs.at(-1).content;
  for (const t of ['previous_history', 'recent_history', 'long_term_memory', 'system_note']) {
    assert.match(sys, new RegExp('<' + t + '>'));
    assert.doesNotMatch(last, new RegExp('<' + t + '>'));
  }
});

test('la mémoire ne change pas le préfixe tant que le résumé ne bouge pas', () => {
  const mem = { summary: 'ancien', lines: ['a'], memories: ['m'], relations: {} };
  const a = buildInfo(sc({ noChoices: true, mem, messages: [{ role: 'user', content: 'un' }] }));
  const b = buildInfo(
    sc({
      noChoices: true,
      mem,
      messages: [
        { role: 'user', content: 'un' },
        { role: 'assistant', content: 'deux' },
        { role: 'user', content: 'trois' }
      ]
    })
  );
  assert.equal(a.msgs[0].content, b.msgs[0].content);
});

test('tous les souvenirs gardés partent avec la mémoire', () => {
  const memories = Array.from({ length: 30 }, (_, i) => 'fait ' + i);
  const r = buildInfo(sc({ noChoices: true, mem: { memories }, messages: [{ role: 'user', content: 'x' }] }));
  assert.equal((r.msgs[0].content.match(/^- fait /gm) || []).length, 30);
});

test('fiches et lorebook trop gros restent en queue, où ils n’invalident rien', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'a', text: 'A'.repeat(10000), always: false, images: [], keys: [/alice/] },
    { name: 'Bob', sum: 'b', text: 'B'.repeat(10000), always: false, images: [], keys: [/bob/] }
  ];
  ctx.lore = [{ keys: [/porte/], always: false, pr: 0, text: 'La porte grince. ' + 'L'.repeat(18000) }];
  const r = buildInfo(
    sc({ noChoices: true, remote: true, messages: [{ role: 'user', content: 'alice ouvre la porte' }] })
  );
  assert.doesNotMatch(r.msgs[0].content, /## Alice/);
  assert.doesNotMatch(r.msgs[0].content, /<lorebook>/);
  assert.match(r.msgs.at(-1).content, /## Alice/);
  assert.match(r.msgs.at(-1).content, /<lorebook>/);
});

test('split sépare narration, état et choix', () => {
  const r = split('Il pleut.\n<etat>\nLieu: Quai\n</etat>\n<choix>\n1. partir\n2. rester\n</choix>');
  assert.equal(r.content, 'Il pleut.');
  assert.deepEqual(r.state, [['Lieu', 'Quai']]);
  assert.deepEqual(r.choices, ['partir', 'rester']);
});

test('raw reconstruit un message éditable sans perte', () => {
  const m = { role: 'assistant', content: 'Texte.', state: [['Lieu', 'Quai']], choices: ['a', 'b'] };
  assert.deepEqual(split(raw(m)), { content: 'Texte.', choices: ['a', 'b'], state: [['Lieu', 'Quai']] });
});

test('estTok croît avec la longueur', () => {
  assert.ok(estTok('a'.repeat(320)) > estTok('a'.repeat(32)));
});

test('parseEtat lit les paires et ignore les puces', () => {
  assert.deepEqual(parseEtat('<etat>\n- **Lieu**: Forêt\nSanté: 72/100\nvide\n</etat>'), [
    ['Lieu', 'Forêt'],
    ['Santé', '72/100']
  ]);
  assert.deepEqual(parseEtat('rien'), []);
});

test('lastEtat remonte le dernier état du narrateur', () => {
  const ms = [
    { role: 'assistant', content: 'a', state: [['Lieu', 'A']] },
    { role: 'user', content: 'b', state: [['Lieu', 'Z']] },
    { role: 'assistant', content: 'sans état' }
  ];
  assert.deepEqual(lastEtat(ms), [['Lieu', 'A']]);
});

test('choicesOf retire la numérotation et plafonne à trois', () => {
  assert.deepEqual(choicesOf('<choix>\n1. a\n2) b\n- c\n4. d\n</choix>'), ['a', 'b', 'c']);
  assert.deepEqual(choicesOf('aucun bloc'), []);
});

test('win est l’index absolu du premier message envoyé', () => {
  const msgs = Array.from({ length: 12 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    content: 'm' + i
  }));
  const s = sc({ noChoices: true, messages: msgs, mem: { upto: 6 } });
  const r = buildInfo(s);
  assert.equal(r.win, 6);
  assert.equal(r.msgs.length - 1, msgs.length - r.win);
});

test('le nombre envoyé tient compte des messages déjà résumés', () => {
  const msgs = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    content: 'z'.repeat(400) + i
  }));
  const s = sc({ noChoices: true, messages: msgs, mem: { upto: 10 } });
  const r = buildInfo(s);
  assert.equal(r.win, 10, 'les messages partent à partir du point de résumé');
  assert.equal(r.msgs.length - 1, msgs.length - r.win, 'autant de messages que n − win');
});

test('les relations voyagent avec la mémoire ; celle d’un personnage en scène est aussi sous sa fiche', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'herboriste', text: 'Fiche d’Alice. ' + 'x'.repeat(20000), always: false, images: [], keys: [/(^|[^a-z0-9])alice(?![a-z0-9])/] }
  ];
  const r = buildInfo(
    sc({
      noChoices: true,
      remote: true,
      messages: [{ role: 'user', content: 'je parle à Alice et au passeur' }],
      mem: { summary: '', memories: [], upto: 0, relations: { Alice: 'méfiante', Passeur: 'vous doit un service' } }
    })
  );
  const sys = r.msgs[0].content,
    last = r.msgs.at(-1).content;
  assert.match(sys, /<relations>\n\(États enregistrés, ils peuvent dater : les événements récents priment\.\)\n- Alice : méfiante\n- Passeur : vous doit un service\n<\/relations>/);
  assert.match(last, /Relation \(état enregistré, peut dater ; les événements récents priment\) : méfiante/);
  assert.doesNotMatch(last, /<relations>|vous doit un service/);
});

test('le message système ne dépend pas de qui est en scène, pour rester en cache', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'herboriste', text: 'Fiche d’Alice.', always: false, images: [], keys: [/(^|[^a-z0-9])alice(?![a-z0-9])/] },
    { name: 'Bob', sum: 'forgeron', text: 'Fiche de Bob.', always: false, images: [], keys: [/(^|[^a-z0-9])bob(?![a-z0-9])/] }
  ];
  const mem = { summary: 'Résumé.', memories: ['un fait'], upto: 0, relations: { Alice: 'méfiante', Bob: 'ami', Passeur: 'dette' } };
  const sys = txt =>
    buildInfo(sc({ noChoices: true, remote: true, messages: [{ role: 'user', content: txt }], mem: { ...mem } })).msgs[0].content;
  assert.equal(sys('je parle à Alice'), sys('je parle à Bob'));
  assert.equal(sys('je parle à Alice'), sys('personne ici'));
});

test('fiches et lorebook modestes en entier dans la partie fixe, en cache', () => {
  ctx.chars = [
    { name: 'Alice', sum: 'a', text: 'A'.repeat(4000), always: false, images: [], keys: [/alice/] },
    { name: 'Bob', sum: 'b', text: 'B'.repeat(4000), always: false, images: [], keys: [/bob/] }
  ];
  ctx.lore = [
    { keys: [/porte/], always: false, pr: 0, text: 'La porte grince.' },
    { keys: [/forge/], always: false, pr: 1, text: 'La forge est froide.' }
  ];
  const s = sc({ noChoices: true, remote: true, messages: [{ role: 'user', content: 'alice ouvre la porte' }] });
  let r = buildInfo(s),
    stable = r.msgs[0].content.slice(0, r.msgs[0].cut);
  assert.match(stable, /## Alice[\s\S]*## Bob/, 'toutes les fiches, même hors scène');
  assert.match(stable, /La forge est froide\.[\s\S]*La porte grince\./, 'tout le lorebook, par priorité');
  assert.match(stable, /Leurs fiches détaillées suivent\./);
  assert.doesNotMatch(r.msgs.at(-1).content, /## Alice|La porte grince/, 'rien en fin de requête');
  // Trop gros (au-delà de 8 000 tokens) : seulement les actifs.
  ctx.chars[1].text = 'B'.repeat(16000);
  r = buildInfo(s);
  assert.doesNotMatch(r.msgs[0].content.slice(0, r.msgs[0].cut), /## Bob/);
  assert.match(r.msgs.at(-1).content, /## Alice/);
});
