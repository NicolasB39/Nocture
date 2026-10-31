import { IMG, S, app, ctx } from './state.js';
import { LS, ikey, nz } from './util.js';

let TREE = null;
export let TERR = '';
export const localTree = () => {
  if (TREE) return TREE;
  try {
    return JSON.parse(LS.get('tree') || 'null')?.p || null;
  } catch (e) {
    return null;
  }
};
export const coverOf = (s, T) => {
  if (s.cover) return s.cover;
  if (!s.remote || !s.folder) return '';
  const b = 'scenarios/' + s.folder + '/',
    f = (T || localTree() || []).find(
      p => p.startsWith(b) && /^cover\.(webp|png|jpe?g|gif)$/i.test(p.slice(b.length))
    );
  return f ? encodeURI(f) : '';
};
const unq = p => {
  if (!p.startsWith('"')) return p;
  const a = [...p.slice(1, -1)],
    b = [],
    te = new TextEncoder();
  for (let i = 0; i < a.length; i++) {
    if (a[i] == '\\') {
      const o = a.slice(i + 1, i + 4).join('');
      if (/^[0-7]{3}$/.test(o)) {
        b.push(parseInt(o, 8));
        i += 3;
        continue;
      }
      const m = { n: 10, t: 9, '"': 34, '\\': 92 }[a[i + 1]];
      if (m !== undefined) {
        b.push(m);
        i++;
        continue;
      }
    }
    b.push(...te.encode(a[i]));
  }
  return new TextDecoder().decode(new Uint8Array(b));
};
const txt = p =>
  fetch(encodeURI(p), { cache: 'no-cache' })
    .then(r => (r.ok ? r.text() : ''))
    .catch(() => '');
const kre = k => {
  const p = k.endsWith('*'),
    e = (p ? k.slice(0, -1) : k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return e ? new RegExp('(^|[^a-z0-9])' + e + (p ? '' : '(?![a-z0-9])')) : null;
};
const repo = () => {
  if (/^[\w.-]+\/[\w.-]+$/.test(S.repo || '')) return S.repo.split('/');
  const seg = location.pathname.split('/')[1];
  return [location.hostname.split('.')[0], seg && !seg.includes('.') ? seg : location.hostname];
};
export async function getTree(force) {
  let c = null;
  try {
    c = JSON.parse(LS.get('tree') || 'null');
  } catch (e) {}
  if (!force && c && Date.now() - c.t < 60000) {
    TREE = c.p;
    TERR = '';
    return TREE;
  }
  TERR = '';
  try {
    const r = await fetch('index.json', { cache: 'no-cache' });
    const j = r.ok ? await r.json().catch(() => null) : null;
    if (Array.isArray(j) && j.every(x => typeof x == 'string')) {
      TREE = j.map(unq);
      LS.set('tree', JSON.stringify({ t: Date.now(), p: TREE }));
      return TREE;
    }
  } catch (e) {}
  try {
    const [o, r] = repo();
    const j = await (
      await fetch(`https://api.github.com/repos/${o}/${r}/git/trees/HEAD?recursive=1`)
    ).json();
    if (j.tree) {
      TREE = j.tree.filter(x => x.type == 'blob').map(x => x.path);
      if (j.truncated) TERR = 'arbre GitHub tronqué, ajoutez index.json (voir README)';
      LS.set('tree', JSON.stringify({ t: Date.now(), p: TREE }));
    } else TERR = j.message || 'réponse inattendue';
  } catch (e) {
    TERR = 'réseau indisponible';
  }
  if (TERR && !TREE && c) TREE = c.p;
  return TREE || [];
}
const fiche = t => {
  const ls = t.split(/\r?\n/);
  let sum = '',
    always = false,
    keys = [],
    i = 0;
  for (; i < ls.length; i++) {
    const m = ls[i].match(/^\s*(r[ée]sum[ée]|toujours|mots[-\s]?cl[ée]s)\s*(?::\s*(.*))?$/i);
    if (!m) break;
    const n = nz(m[1]),
      v = (m[2] || '').trim();
    if (n.startsWith('res')) sum = v;
    else if (n == 'toujours') always = !/^(non|false|0)$/i.test(v);
    else keys = v.split(',').map(x => x.trim()).filter(Boolean);
  }
  const text = ls.slice(i).join('\n').trim();
  return {
    sum: sum || text.split(/\n+/)[0]?.replace(/^#+\s*/, '').slice(0, 140) || '',
    always,
    keys,
    text
  };
};
let gen = 0;
// Version de l'index des images (ctx.iv), dans la clé de rendu des messages (view.js) : elle ne change que
// si l'index change, pour qu'une histoire locale rouverte garde ses messages déjà construits.
let ivK = '',
  ivN = 0;
const imgVer = im => {
  const k = Object.entries(im)
    .map(e => e.join('='))
    .sort()
    .join('\n');
  if (k !== ivK) {
    ivK = k;
    ivN++;
  }
  return ivN;
};
export async function loadCtx() {
  const g = ++gen,
    im = {};
  for (const k in IMG) delete IMG[k];
  Object.assign(ctx, { system: '', avatar: '', chars: [], lore: [], images: [], stat: '', decors: [], decorDef: '', intro: '', iv: imgVer({}) });
  if (!app.cur.remote) return;
  const base = 'scenarios/' + app.cur.folder + '/',
    pb = base + 'personnages/';
  const [T, system, avatar] = await Promise.all([
    getTree(),
    txt(base + 'systeme.md'),
    txt(base + 'avatar.md')
  ]);
  const stat = T.includes(base + 'etat.md') ? (await txt(base + 'etat.md')).trim() : '',
    intro = T.includes(base + 'intro.md') ? (await txt(base + 'intro.md')).trim() : '';
  const ch = {};
  for (const p of T) {
    if (!p.startsWith(pb)) continue;
    const [n, file, ...rest] = p.slice(pb.length).split('/');
    if (!file || rest.length) continue;
    (ch[n] ??= []).push(file);
  }
  const images = [],
    fp = [];
  for (const [n, files] of Object.entries(ch)) {
    const own = [];
    for (const f of files) {
      const m = f.match(/^(.+)\.(webp|png|jpe?g|gif)$/i);
      if (m) {
        const c = (n + '_' + m[1]).toLowerCase();
        im[c] = encodeURI(pb + n + '/' + f);
        im[ikey(c)] ??= im[c];
        images.push({ code: c, url: im[c] });
        own.push(c);
      }
    }
    if (files.includes('fiche.md'))
      fp.push(
        txt(pb + n + '/fiche.md').then(t => {
          const F = fiche(t);
          return {
            name: n,
            sum: F.sum,
            text: F.text,
            always: F.always,
            images: own,
            keys: [n, ...F.keys].map(k => kre(nz(k))).filter(Boolean)
          };
        })
      );
    else if (own.length)
      fp.push(
        Promise.resolve({
          name: n,
          sum: '',
          text: '',
          always: false,
          images: own,
          keys: [kre(nz(n))].filter(Boolean)
        })
      );
  }
  const chars = (await Promise.all(fp)).filter(x => x.text || x.images.length);
  const lb = base + 'lorebook/';
  const lore = (
    await Promise.all(
      T.filter(p => p.startsWith(lb) && p.endsWith('.md') && !p.slice(lb.length).includes('/')).map(
        p => txt(p)
      )
    )
  )
    .map(t => {
      const ls = t.split(/\r?\n/);
      let keys = [],
        always = false,
        pr = 0,
        i = 0;
      for (; i < ls.length; i++) {
        const m = ls[i].match(/^\s*(mots[-\s]?cl[ée]s|toujours|priorit[ée])\s*(?::\s*(.*))?$/i);
        if (!m) break;
        const n = nz(m[1]),
          v = (m[2] || '').trim();
        if (n.startsWith('mots'))
          keys = v
            .split(',')
            .map(k => kre(nz(k.trim())))
            .filter(Boolean);
        else if (n == 'toujours') always = !/^(non|false|0)$/i.test(v);
        else pr = +v || 0;
      }
      const text = ls.slice(i).join('\n').trim();
      return text && (always || keys.length) ? { keys, always, pr, text } : null;
    })
    .filter(Boolean);
  images.sort((x, y) => x.code.localeCompare(y.code));
  const db = base + 'decors/',
    all = await Promise.all(
      T.filter(p => p.startsWith(db) && !p.slice(db.length).includes('/') && /\.(webp|png|jpe?g|gif)$/i.test(p)).map(
        async p => {
          const n = p.slice(db.length).replace(/\.[^.]+$/, ''),
            md = db + n + '.md',
            keys = [n.replace(/[_-]+/g, ' ')];
          if (T.includes(md)) {
            const m = (await txt(md)).match(/^\s*mots[-\s]?cl[ée]s\s*:\s*(.*)$/im);
            if (m) keys.push(...m[1].split(','));
          }
          return { name: n, url: encodeURI(p), keys: keys.map(k => kre(nz(k.trim()))).filter(Boolean) };
        }
      )
    ),
    def = all.find(d => nz(d.name) == 'defaut'),
    decors = all.filter(d => d !== def),
    decorDef = def?.url || '';
  if (g !== gen) return;
  Object.assign(IMG, im);
  Object.assign(ctx, { system, avatar, chars, lore, images, stat, decors, decorDef, intro, iv: imgVer(im) });
}
