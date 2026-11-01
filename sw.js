const C = 'nocturne-80ca2919cd',
  A = [
    './',
    'index.html',
    'reparer.html',
    'manifest.json',
    'icon-180.png',
    'icon-192.png',
    'icon-512.png',
    'icon-192-mask.png',
    'icon-512-mask.png',
    'css/style.css',
    'fonts/literata-r.woff2',
    'fonts/literata-i.woff2',
    'js/ai.js',
    'js/backup.js',
    'js/boot.js',
    'js/bus.js',
    'js/cast.js',
    'js/chat.js',
    'js/cost.js',
    'js/format.js',
    'js/journal.js',
    'js/list.js',
    'js/main.js',
    'js/memory.js',
    'js/merge.js',
    'js/nav.js',
    'js/prompt.js',
    'js/protocol.js',
    'js/read.js',
    'js/recall.js',
    'js/reparer.js',
    'js/scenarios.js',
    'js/scene.js',
    'js/send.js',
    'js/settings.js',
    'js/state.js',
    'js/stats.js',
    'js/statview.js',
    'js/store.js',
    'js/util.js',
    'js/view.js'
  ],
  // Fichiers des scénarios (textes, images) : cache à part, gardé d'une version à l'autre, MAX entrées au plus.
  D = 'nocturne-scenarios',
  MAX = 400;
const SH = new Set(A.map(a => new URL(a, self.registration.scope).href));
// Fichiers demandés avec ?v=<version> (rangés sous leur adresse) : les copies encore en cache chez
// l'hébergeur juste après un déploiement sont contournées. Installation refusée si la page (sous ses deux
// adresses, ./ étant celle de démarrage) ou les scripts ne portent pas cette version : le navigateur
// retentera, l'ancienne version reste en place.
const V = C.slice('nocturne-'.length);
self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(C).then(async c => {
      await Promise.all(
        A.map(async u => {
          const x = await fetch(u + (u.includes('?') ? '&' : '?') + 'v=' + V, { cache: 'reload' });
          if (!x.ok) throw new Error(u + ' : ' + x.status);
          await c.put(u, x);
        })
      );
      for (const [u, t] of [['./', 'content="' + V + '"'], ['index.html', 'content="' + V + '"'], ['js/main.js', "VERSION = '" + V + "'"]])
        if (!(await (await c.match(u))?.text())?.includes(t)) {
          await caches.delete(C);
          throw new Error('version mélangée : ' + u);
        }
    })
  )
);
self.addEventListener('message', e => {
  if (e.data == 'skip') self.skipWaiting();
});
self.addEventListener('activate', e =>
  e.waitUntil(
    caches
      .keys()
      .then(k => Promise.all(k.filter(x => x != C && x != D).map(x => caches.delete(x))))
      .then(() => clients.claim())
  )
);
const trim = async () => {
  const c = await caches.open(D);
  const k = await c.keys();
  for (const r of k.slice(0, Math.max(0, k.length - MAX))) await c.delete(r);
};
const store = (r, x) => {
  if (!x.ok) return;
  const c = x.clone(),
    sh = SH.has(r.url);
  return caches
    .open(sh ? C : D)
    .then(k => k.put(r, c))
    .then(() => (sh ? 0 : trim()));
};
// Fichiers de l'application : seulement ceux de l'installation, jamais rafraîchis un par un dans ce cache
// (un rafraîchissement partiel mélangerait deux versions). Une nouvelle version passe par un nouveau worker.
const shell = r => caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r));
// Réseau, réponse mise en cache : le worker reste actif jusqu'à la fin de l'enregistrement.
const net = (e, r) => {
  const ps = [];
  const n = fetch(r.url, { cache: 'no-cache' }).then(x => {
    ps.push(store(r, x));
    return x;
  });
  e.waitUntil(n.then(() => Promise.all(ps)).catch(() => {}));
  return n;
};
const swr = (e, r) => {
  const n = net(e, r);
  return caches.match(r, { ignoreSearch: true }).then(m => m || n);
};
const nf = (e, r) => {
  const n = net(e, r);
  return Promise.race([n, new Promise((_, j) => setTimeout(j, 4000))]).catch(() =>
    caches
      .match(r, { ignoreSearch: true })
      .then(m => m || (r.mode == 'navigate' ? caches.match('./') : 0))
      .then(m => m || n)
  );
};
self.addEventListener('fetch', e => {
  const r = e.request,
    u = new URL(r.url);
  if (r.method != 'GET' || u.origin != location.origin) return;
  e.respondWith(SH.has(u.href) ? shell(r) : r.destination == 'image' ? swr(e, r) : nf(e, r));
});
