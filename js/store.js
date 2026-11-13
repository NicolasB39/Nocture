import { S, app, playerName } from './state.js';
import { LS, plain, uid } from './util.js';
import { cutMem } from './memory.js';
import { dropDup, looseChoices } from './format.js';

let db;
// Fiche du personnage (mode jeu de rôle) : un bonus entier par caractéristique, dans des bornes larges ; la fiche
// elle-même (dice.js) applique les bornes du jeu.
const sheet = v => {
  const o = {};
  if (v && typeof v == 'object')
    for (const k of Object.keys(v).slice(0, 8)) if (Number.isInteger(v[k]) && Math.abs(v[k]) <= 5) o[k] = v[k];
  return o;
};
// Un message ou une variante : texte, et choix et état déjà mis à part à l'enregistrement (split, format.js).
const one = (m, loose) => {
  const r = { role: m.role, content: m.content },
    c = (Array.isArray(m.choices) ? m.choices : []).filter(x => typeof x == 'string').slice(0, 3),
    t = (Array.isArray(m.state) ? m.state : []).filter(e => Array.isArray(e) && e.length == 2 && e.every(x => typeof x == 'string')).slice(0, 12);
  // Réponse enregistrée avant ces corrections : choix recopiés dans le récit (dropDup) ou écrits sans balise
  // (looseChoices), corrigée au chargement.
  if (c.length) Object.assign(r, { choices: c, content: m.role == 'assistant' ? dropDup(r.content, c) : r.content });
  else if (m.role == 'assistant' && loose) Object.assign(r, looseChoices(r.content));
  if (t.length) r.state = t;
  // Changements de l'inventaire et des liens (modes.js) : [nom, entier].
  for (const k of ['inv', 'links']) {
    const a = (Array.isArray(m[k]) ? m[k] : []).filter(e => Array.isArray(e) && typeof e[0] == 'string' && Number.isInteger(e[1])).slice(0, 12);
    if (a.length) r[k] = a.map(([n, d]) => [n, d]);
  }
  return r;
};
export const clean = x => {
  // Identifiant « index » : il écraserait l'index de la sauvegarde GitHub (index.json, backup.js).
  if (!x || typeof x.id != 'string' || !x.id || x.id == 'index' || !Array.isArray(x.messages)) return null;
  const s = v => (typeof v == 'string' ? v : ''),
    n = v => (Number.isFinite(+v) && +v > 0 ? +v : 0);
  const messages = x.messages
    .filter(m => m && (m.role == 'user' || m.role == 'assistant') && typeof m.content == 'string')
    .map((m, i, all) => {
      const r = one(m, !x.noChoices);
      if (Number.isFinite(+m.t) && +m.t > 0) r.t = +m.t;
      const a = Array.isArray(m.alts) && i == all.length - 1
        ? m.alts.map(v => (v && typeof v.content == 'string' ? one({ ...v, role: m.role }, !x.noChoices) : null))
        : null;
      if (a && a.length > 1 && a.every(Boolean)) {
        r.alts = a.map(({ role, ...rest }) => rest);
        r.ai = Math.min(Math.max(0 | m.ai, 0), r.alts.length - 1);
      }
      return r;
    });
  const mm = x.mem || {};
  const rel = {};
  // Pas de plafond ici : mergeRel le tient, sans jamais écarter un personnage à fiche.
  if (mm.relations && typeof mm.relations == 'object')
    for (const k of Object.keys(mm.relations))
      if (typeof mm.relations[k] == 'string') rel[k] = mm.relations[k];
  return {
    id: x.id,
    name: s(x.name).trim() || 'Sans titre',
    updated: n(x.updated) || Date.now(),
    remote: !!x.remote,
    reset: n(x.reset),
    folder: s(x.folder),
    system: s(x.system),
    avatar: s(x.avatar),
    pname: s(x.pname),
    note: s(x.note),
    intro: s(x.intro),
    choicePrompt: s(x.choicePrompt),
    noChoices: !!x.noChoices,
    noPre: !!x.noPre,
    cover: typeof x.cover == 'string' && x.cover.startsWith('data:') ? x.cover : '',
    effort: ['low', 'medium', 'high'].includes(x.effort) ? x.effort : '',
    model: s(x.model).trim(),
    stat: typeof x.stat == 'boolean' ? x.stat : undefined,
    statFields: s(x.statFields),
    sheet: sheet(x.sheet),
    messages,
    mem: {
      summary: s(mm.summary),
      memories: Array.isArray(mm.memories) ? mm.memories.filter(v => typeof v == 'string') : [],
      lines: Array.isArray(mm.lines)
        ? mm.lines
            .filter(v => v && typeof v.t == 'string')
            .map(v => ({ i: 0 | v.i, ...(Number.isFinite(+v.u) && v.u !== null ? { u: 0 | v.u } : {}), t: v.t }))
            .slice(-24)
        : [],
      relations: rel,
      chapters: Array.isArray(mm.chapters)
        ? mm.chapters.filter(v => v && typeof v.s == 'string').map(v => ({ t: s(v.t), s: v.s, upto: Math.min(n(v.upto), messages.length) }))
        : [],
      upto: Math.min(n(mm.upto), messages.length)
    }
  };
};
// Nouvelle histoire qui reprend jusqu'au message i inclus ; l'originale n'est pas touchée.
// Le résumé reste tel quel : il peut raconter la suite, l'appelant le signale.
export const forkOf = (s, i, name, id) => {
  const c = structuredClone(s),
    n = i + 1;
  Object.assign(c, { id, name });
  c.messages = c.messages.slice(0, n);
  cutMem(c.mem, n);
  return c;
};
const pvOf = s => {
  const m = s.messages?.at(-1);
  return m
    ? plain(m.content, playerName(s))
        .replace(/[*_#>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100)
    : '';
};
const META = s => ({
  id: s.id,
  name: s.name,
  updated: s.updated,
  remote: s.remote,
  reset: s.reset || 0,
  folder: s.folder,
  n: s.messages?.length || 0,
  pv: pvOf(s)
});
const CH = 25;
const K = {};
const pack = ms => {
  const a = [];
  for (let i = 0; i < ms.length; i += CH) a.push(JSON.stringify(ms.slice(i, i + CH)));
  return a;
};
const range = (id, from = 0) => IDBKeyRange.bound([id, from], [id, Infinity]);
export const openDB = () =>
  new Promise((res, rej) => {
    // Nom historique de la base : le renommer reviendrait à repartir d'une base vide.
    const r = indexedDB.open('histoires', 5);
    // Création d'une base neuve, ou ajout du journal des appels (version 5).
    r.onupgradeneeded = () => {
      const d = r.result;
      for (const [n, k] of [['scenarios', 'id'], ['settings', 'key'], ['meta', 'id'], ['chunks', 'k'], ['covers', 'id']])
        if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: k });
      // Journal : l'en-tête de chaque appel d'un côté, sa requête complète de l'autre, sous la même clé.
      if (!d.objectStoreNames.contains('calls')) d.createObjectStore('calls', { autoIncrement: true });
      if (!d.objectStoreNames.contains('bodies')) d.createObjectStore('bodies');
    };
    r.onblocked = () =>
      rej(new Error('Une autre fenêtre de l’application est ouverte : fermez-la, puis rechargez cette page.'));
    r.onsuccess = () => {
      db = r.result;
      db.onversionchange = () => db.close();
      res();
    };
    r.onerror = () => rej(r.error);
  });
// Une transaction annulée à la validation (quota dépassé) déclenche abort sans error : sans ce cas, la
// promesse ne se réglerait jamais et l'envoi resterait bloqué sur « Réponse en cours ».
const fail = (t, rej, f) => {
  t.onerror = t.onabort = () => {
    f?.();
    rej(t.error || new Error('Enregistrement impossible (espace de stockage plein ?)'));
  };
};
const tx = (st, m, fn) =>
  new Promise((res, rej) => {
    const t = db.transaction(st, m);
    const rq = fn(t.objectStore(st));
    t.oncomplete = () => res(rq && rq.result);
    fail(t, rej);
  });
const read = (names, fn) =>
  new Promise((res, rej) => {
    const t = db.transaction(names, 'readonly'),
      o = {};
    for (const [k, [n, q]] of Object.entries(fn)) {
      const r = q === undefined ? t.objectStore(n).getAll() : t.objectStore(n)[q instanceof IDBKeyRange ? 'getAll' : 'get'](q);
      r.onsuccess = () => (o[k] = r.result);
    }
    t.oncomplete = () => res(o);
    fail(t, rej);
  });
export const getAll = () =>
  read(['meta', 'covers'], { m: ['meta'], c: ['covers'] }).then(({ m, c }) => {
    const cv = new Map(c.map(x => [x.id, x.d]));
    return m.map(x => ({ ...x, cover: cv.get(x.id) || '' }));
  });
// Les histoires que pick retient sur leurs métadonnées, avec leur couverture : seules ces couvertures sont lues.
export const getSome = pick =>
  read(['meta'], { m: ['meta'] }).then(({ m }) => {
    const a = pick(m);
    return read(['covers'], Object.fromEntries(a.map((x, i) => [i, ['covers', x.id]]))).then(c =>
      a.map((x, i) => ({ ...x, cover: c[i]?.d || '' }))
    );
  });
export const getFull = () =>
  read(['scenarios', 'chunks', 'covers'], { h: ['scenarios'], k: ['chunks'], c: ['covers'] }).then(
    ({ h, k, c }) => {
      const ms = {},
        cv = new Map(c.map(x => [x.id, x.d]));
      for (const x of k) (ms[x.k[0]] ??= []).push(...x.m);
      return h.map(({ nc, rev, ...x }) => ({ ...x, messages: ms[x.id] || [], cover: cv.get(x.id) || '' }));
    }
  );
export const getOne = id =>
  read(['scenarios', 'chunks', 'covers'], {
    h: ['scenarios', id],
    k: ['chunks', range(id)],
    c: ['covers', id]
  }).then(({ h, k, c }) => {
    if (!h) return h;
    const { nc, rev, ...x } = h,
      ms = k.flatMap(y => y.m);
    K[id] = { c: pack(ms), v: c?.d || '', rev };
    return clean({ ...x, messages: ms, cover: c?.d || '' });
  });
// bkd : repère « à synchroniser », daté pour que sync() voie un enregistrement fait pendant qu'elle tourne.
// La synchronisation elle-même écrit sans le poser (fromSync).
export const put = (o, fromSync = false) =>
  new Promise((res, rej) => {
    if (!fromSync) LS.set('bkd', Date.now());
    const { messages = [], cover, ...head } = o,
      c = pack(messages),
      v = cover || '',
      k = K[o.id],
      t = db.transaction(['scenarios', 'chunks', 'covers', 'meta'], 'readwrite'),
      [A, C, V, M] = ['scenarios', 'chunks', 'covers', 'meta'].map(n => t.objectStore(n));
    let nk = null;
    const r = A.get(o.id);
    r.onsuccess = () => {
      const ok = k && r.result && r.result.rev === k.rev;
      head.nc = c.length;
      head.rev = uid();
      A.put(head);
      c.forEach((x, i) => {
        if (!ok || k.c[i] !== x) C.put({ k: [o.id, i], m: messages.slice(i * CH, (i + 1) * CH) });
      });
      C.delete(range(o.id, c.length));
      if (!ok || k.v !== v) v ? V.put({ id: o.id, d: v }) : V.delete(o.id);
      M.put(META(o));
      nk = { c, v, rev: head.rev };
    };
    t.oncomplete = () => {
      K[o.id] = nk;
      res();
    };
    fail(t, rej, () => delete K[o.id]);
  });
// Clés gardées sur l'appareil pour chaque histoire, suivies de son id : brouillon (send.js), position de lecture
// (pos:, view.js et chat.js), heure du cache (ai.js). Une nouvelle clé de ce genre s'ajoute ici pour partir avec l'histoire.
const LOCAL = ['draft:', 'pos:', 'hot:'];
export const del = (id, fromSync = false) => {
  if (!fromSync) LS.set('bkd', Date.now());
  for (const k of LOCAL) LS.del(k + id);
  delete K[id];
  return new Promise((res, rej) => {
    const t = db.transaction(['scenarios', 'chunks', 'covers', 'meta'], 'readwrite');
    t.objectStore('scenarios').delete(id);
    t.objectStore('chunks').delete(range(id));
    t.objectStore('covers').delete(id);
    t.objectStore('meta').delete(id);
    t.oncomplete = () => res();
    fail(t, rej);
  });
};
// Autres fenêtres de l'application (onglet et appli installée) : réglages et statistiques sont lus au
// démarrage puis réécrits en bloc. Chaque enregistrement les prévient pour qu'elles relisent, au lieu
// d'écraser plus tard la clé, le tarif ou les compteurs avec leur vieille copie. Canal ouvert par main.js.
let bc = null;
export const onPeer = fn => {
  if (typeof BroadcastChannel != 'function') return;
  bc = new BroadcastChannel('nocturne');
  bc.onmessage = e => fn(e.data);
};
const told = k => r => {
  bc?.postMessage(k);
  return r;
};
// Journal des appels (journal.js) : les CALLS_MAX derniers, dans l'ordre d'envoi, sur cet appareil seulement.
export const CALLS_MAX = 100;
export const addCall = ({ body, ...e }) =>
  new Promise((res, rej) => {
    const t = db.transaction(['calls', 'bodies'], 'readwrite'),
      s = t.objectStore('calls'),
      b = t.objectStore('bodies');
    s.add(e).onsuccess = ev => b.put(body, ev.target.result);
    const c = s.count();
    c.onsuccess = () => {
      let n = c.result - CALLS_MAX;
      if (n > 0)
        s.openCursor().onsuccess = ev => {
          const k = ev.target.result;
          if (k && n-- > 0) {
            b.delete(k.primaryKey);
            k.delete();
            k.continue();
          }
        };
    };
    t.oncomplete = () => res();
    fail(t, rej);
  });
// En-têtes seulement (k : la clé de la requête complète) ; les requêtes, lourdes, se lisent à la demande.
export const getCalls = () =>
  new Promise((res, rej) => {
    const t = db.transaction('calls', 'readonly'),
      s = t.objectStore('calls'),
      v = s.getAll(),
      k = s.getAllKeys();
    t.oncomplete = () => res(v.result.map((x, i) => ({ ...x, k: k.result[i] })));
    fail(t, rej);
  });
export const getCallBody = k => tx('bodies', 'readonly', s => s.get(k));
export const clearCalls = () =>
  new Promise((res, rej) => {
    const t = db.transaction(['calls', 'bodies'], 'readwrite');
    t.objectStore('calls').clear();
    t.objectStore('bodies').clear();
    t.oncomplete = () => res();
    fail(t, rej);
  });
export const loadSet = () =>
  tx('settings', 'readonly', s => s.get('main')).then(r => {
    if (r) Object.assign(S, r.value);
    // Réglages de fonctions retirées (v105) : plus lus, ils ne sont plus réenregistrés.
  });
export const saveSet = () => tx('settings', 'readwrite', s => s.put({ key: 'main', value: S })).then(told('set'));
export const loadStats = () => tx('settings', 'readonly', s => s.get('usage')).then(r => r?.value || null);
export const saveStats = v => tx('settings', 'readwrite', s => s.put({ key: 'usage', value: v })).then(told('stats'));
export const save = (s = app.cur) => {
  s.updated = Date.now();
  return put(s);
};
