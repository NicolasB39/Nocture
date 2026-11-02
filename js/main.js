import { sync } from './backup.js';
import { showList } from './list.js';
import { STATS, load as loadUsage, shift, watch } from './stats.js';
import { loadSet, loadStats, onPeer, openDB, saveStats } from './store.js';
import { capCheck } from './statview.js';
import './cast.js';
import { LS, toast } from './util.js';
import { applyFs } from './read.js';
import './list.js';
import './chat.js';
import './nav.js';
import './settings.js';
import './backup.js';
import './journal.js';

const VERSION = 'dc8df6cbaf';
const pv = document.querySelector('meta[name="app-version"]')?.content;
if (pv !== VERSION)
  window.__boot?.warn(
    'Version mélangée : page ' + (pv || 'inconnue') + ', scripts ' + VERSION + '.'
  );
window.__started = true;

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const had = !!navigator.serviceWorker.controller;
  let going = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had || going) return;
    going = true;
    location.reload();
  });
  navigator.serviceWorker
    .register('sw.js')
    .then(reg => {
      const offer = w => {
        if (!w || !had) return;
        toast('Nouvelle version prête', {
          keep: 1,
          label: 'Recharger',
          fn: () => w.postMessage('skip')
        });
      };
      offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state == 'installed') offer(w);
        });
      });
    })
    .catch(() => {});
}
if (!LS.get('first')) LS.set('first', Date.now());
openDB()
  .then(() => Promise.resolve(navigator.storage?.persist?.()).catch(() => {}))
  .then(loadSet)
  .then(() => loadStats().then(loadUsage, () => {}))
  .then(() => {
    let t = 0,
      base = structuredClone(STATS.d),
      q = Promise.resolve();
    // Lectures et écritures des statistiques l'une après l'autre : deux écritures mêlées perdraient des comptes.
    const queue = fn => (q = q.then(fn).catch(() => {}));
    // Écriture par différence : ce que cette fenêtre a compté depuis sa dernière lecture (base), ajouté à ce
    // qu'une autre fenêtre de l'application a pu enregistrer entre-temps.
    const flush = () => {
      clearTimeout(t);
      t = 0;
      return queue(async () => {
        const saved = (await loadStats())?.d || {};
        loadUsage({ d: shift(saved, shift(STATS.d, base, -1)) });
        base = structuredClone(STATS.d);
        await saveStats(STATS);
      });
    };
    // Une autre fenêtre a enregistré : réglages relus ; statistiques relues si rien n'a été compté ici
    // depuis (sinon la prochaine écriture fusionne).
    onPeer(k => {
      if (k == 'set') loadSet().catch(() => {});
      if (k == 'stats')
        queue(async () => {
          const v = await loadStats();
          if (t || JSON.stringify(STATS.d) !== JSON.stringify(base)) return;
          loadUsage(v);
          base = structuredClone(STATS.d);
        });
    });
    watch(() => {
      if (!t) t = setTimeout(flush, 1500);
      capCheck();
    });
    addEventListener('visibilitychange', () => {
      if (document.visibilityState == 'hidden' && t) flush();
    });
    applyFs();
    return showList();
  })
  .then(() => sync())
  .catch(e =>
    window.__boot?.fail(
      'Stockage local indisponible (navigation privée ?) : ' + (e?.message || e)
    )
  );
