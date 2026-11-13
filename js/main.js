import { sync } from './backup.js';
import { showList } from './list.js';
import { STATS, load as loadUsage, shift, watch } from './stats.js';
import { loadSet, loadStats, onPeer, openDB, saveStats } from './store.js';
import './cast.js';
import './inv.js';
import { $, LS, toast } from './util.js';
import { app } from './state.js';
import { applyFs } from './read.js';
import './chat.js';
import './nav.js';
import './settings.js';
import './journal.js';
import './statview.js';

const VERSION = '3a2b25e02a';
const pv = document.querySelector('meta[name="app-version"]')?.content;
if (pv !== VERSION)
  window.__boot?.warn(
    'Version mélangée : page ' + (pv || 'inconnue') + ', scripts ' + VERSION + '.'
  );
window.__started = true;

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const had = !!navigator.serviceWorker.controller;
  // asked : Recharger touché ici, rechargement sans condition.
  let going = false,
    asked = false;
  // Nouvelle version prise (Recharger, ici ou dans une autre fenêtre) : rechargement, sauf pendant une réponse ou
  // avec un texte en cours de saisie, qu'il couperait ou perdrait ; la notification le propose alors.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had || going) return;
    if (!asked && (app.busy || $('#inp')?.value.trim())) {
      toast('Nouvelle version installée', { keep: 1, label: 'Recharger', fn: () => location.reload() });
      return;
    }
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
          fn: () => {
            asked = true;
            w.postMessage('skip');
          }
        });
      };
      offer(reg.waiting);
      // Application gardée ouverte (téléphone repris depuis l'arrière-plan, réseau retrouvé) : le navigateur ne
      // cherche de mise à jour qu'à une navigation ; on la demande, une fois par heure au plus.
      let upAt = Date.now();
      const check = () => {
        if (document.hidden || Date.now() - upAt < 3600e3) return;
        upAt = Date.now();
        reg.update().catch(() => {});
      };
      document.addEventListener('visibilitychange', check);
      addEventListener('online', () => {
        upAt = 0;
        check();
      });
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
// Base ouverte : une panne plus loin vient d'ailleurs que du stockage, le message le dit.
let opened = false;
openDB()
  .then(() => {
    opened = true;
    return Promise.resolve(navigator.storage?.persist?.()).catch(() => {});
  })
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
      (opened ? 'Démarrage interrompu : ' : 'Stockage local indisponible (navigation privée ?) : ') + (e?.message || e)
    )
  );
