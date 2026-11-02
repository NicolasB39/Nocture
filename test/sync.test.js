import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import './stub.js';

globalThis.window = globalThis;

const { syncOnce } = await import('../js/backup.js');
const { S, app } = await import('../js/state.js');

// Dépôt GitHub simulé (API contents) : chemin → { text, sha } ; log garde les écritures dans l'ordre.
const B = { p: 'gh', repo: 'me/bk', tok: 't', nosq: 'me/bk' };
const DIR = 'histoires-backup/';
// cutAt : écriture (« PUT index.json ») où le réseau coupe, une fois.
let GH, log, sha, cutAt;
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const json = (status, o) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });
globalThis.fetch = async (u, o = {}) => {
  const p = decodeURI(new URL(u).pathname.replace(/^\/repos\/me\/bk\/contents\//, '')),
    m = o.method || 'GET';
  if (cutAt && cutAt == m + ' ' + p.slice(DIR.length)) {
    cutAt = null;
    throw new TypeError('Failed to fetch');
  }
  if (m == 'GET') {
    const f = GH.get(p);
    if (f) return json(200, { encoding: 'base64', content: b64(f.text), sha: f.sha });
    const kids = [...GH.keys()].filter(k => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/'));
    return kids.length ? json(200, kids.map(k => ({ name: k.slice(p.length + 1), type: 'file', sha: GH.get(k).sha }))) : json(404, {});
  }
  const b = JSON.parse(o.body),
    f = GH.get(p);
  if (f && b.sha !== f.sha) return json(409, { message: 'conflict' });
  log.push(m + ' ' + p.slice(DIR.length));
  if (m == 'DELETE') {
    GH.delete(p);
    return json(200, {});
  }
  GH.set(p, { text: Buffer.from(b.content, 'base64').toString('utf8'), sha: 's' + ++sha });
  return json(200, { content: { sha: 's' + sha } });
};
const remote = n => JSON.parse(GH.get(DIR + n).text);

// Stockage local d'un appareil, en mémoire.
const device = (...ss) => {
  const M = new Map(ss.map(s => [s.id, structuredClone(s)]));
  return {
    M,
    db: {
      getAll: async () => [...M.values()].map(x => structuredClone(x)),
      getOne: async id => (M.has(id) ? structuredClone(M.get(id)) : undefined),
      put: async v => void M.set(v.id, structuredClone(v)),
      del: async id => void M.delete(id)
    }
  };
};
const story = (id, updated, text = 'x') => ({ id, name: id.toUpperCase(), updated, messages: [{ role: 'user', content: text }], mem: { summary: '', memories: [], upto: 0 } });
// Passe de synchronisation avec l'état propre à un appareil (repères « vu », marques de suppression).
const pass = async (d, st = {}) => {
  Object.assign(S, { tomb: st.tomb || {}, bkSeen: st.seen || {}, bkAt: st.at || '' });
  log = [];
  await syncOnce(B, [], d.db);
  return { tomb: S.tomb, seen: S.bkSeen, at: S.bkAt };
};

beforeEach(() => {
  GH = new Map();
  sha = 0;
  cutAt = null;
  app.cur = null;
  app.busy = false;
});

test('premier envoi : chaque histoire et l’index ; une seconde passe sans changement n’écrit rien', async () => {
  const d = device(story('a', 10), story('b', 20));
  const st = await pass(d);
  assert.deepEqual(log.sort(), ['PUT a.json', 'PUT b.json', 'PUT index.json']);
  assert.deepEqual(remote('index.json').items.map(x => x.id).sort(), ['a', 'b']);
  await pass(d, st);
  assert.deepEqual(log, []);
});

test('une histoire venue d’un autre appareil est reçue', async () => {
  await pass(device(story('a', 10)));
  const d2 = device();
  await pass(d2);
  assert.equal(d2.M.get('a').messages[0].content, 'x');
  assert.deepEqual(log, [], 'rien à renvoyer');
});

test('suppression : l’index est écrit avant l’effacement des fichiers', async () => {
  const d = device(story('a', 10), story('b', 20));
  let st = await pass(d);
  d.M.delete('a');
  st = await pass(d, { ...st, tomb: { a: Date.now() } });
  assert.deepEqual(log, ['PUT index.json', 'DELETE a.json']);
  assert.deepEqual(remote('index.json').items.map(x => x.id), ['b']);
  assert.ok(!GH.has(DIR + 'a.json'));
});

test('suppression interrompue avant l’effacement : fichier orphelin effacé au passage suivant', async () => {
  const d = device(story('a', 10), story('b', 20));
  let st = await pass(d);
  // Index déjà réécrit sans a, fichier encore là (coupure entre les deux écritures).
  const idx = remote('index.json');
  GH.set(DIR + 'index.json', {
    text: JSON.stringify({ ...idx, items: idx.items.filter(x => x.id != 'a'), tomb: { a: Date.now() } }),
    sha: 's' + ++sha
  });
  d.M.delete('a');
  st = await pass(d, { ...st, tomb: { a: Date.now() } });
  assert.deepEqual(log, ['PUT index.json', 'DELETE a.json']);
  await pass(d, st);
  assert.deepEqual(log, []);
});

test('fichier réécrit par un autre appareil sans son index : le fichier fait foi', async () => {
  const d1 = device(story('a', 10));
  const s1 = await pass(d1);
  // Autre appareil arrêté entre l'écriture de a.json et celle de l'index.
  GH.set(DIR + 'a.json', { text: JSON.stringify({ ...story('a', 40, 'plus récent'), cv: '' }), sha: 's' + ++sha });
  await pass(d1, s1);
  assert.equal(d1.M.get('a').messages[0].content, 'plus récent');
  assert.equal(remote('index.json').items[0].updated, 40, 'index réparé');
});

test('modifiée des deux côtés : une seule copie « (conflit) », même après une synchronisation coupée', async () => {
  const d1 = device(story('a', 10));
  const s1 = await pass(d1),
    d2 = device();
  const s2 = await pass(d2);
  d2.M.set('a', story('a', 20, 'appareil 2'));
  await pass(d2, s2);
  d1.M.set('a', story('a', 30, 'appareil 1'));
  // Coupure pendant l'envoi : la copie de la version distante est faite ici et déjà envoyée, mais ni l'index ni
  // les repères ne sont enregistrés ; le passage relancé voit de nouveau le conflit.
  cutAt = 'PUT a.json';
  await assert.rejects(pass(d1, s1));
  const t1 = await pass(d1, s1);
  const copies = [...d1.M.keys()].filter(k => k != 'a');
  assert.equal(copies.length, 1, 'pas de seconde copie au passage relancé');
  assert.match(d1.M.get(copies[0]).name, /conflit/);
  assert.equal(d1.M.get(copies[0]).messages[0].content, 'appareil 2', 'la version perdante est gardée');
  assert.equal(d1.M.get('a').messages[0].content, 'appareil 1', 'la plus récente garde l’identifiant');
  assert.equal(remote('index.json').items.length, 2);
  await pass(d1, t1);
  assert.deepEqual(log, []);
});
