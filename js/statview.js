import { costMap, costOf, money, parseAmount, priceOf } from './cost.js';
import { S } from './state.js';
import { saveSet } from './store.js';
import {
  SESSION,
  clear,
  dayKey,
  dayMap,
  monthDays,
  monthKey,
  monthMap,
  total
} from './stats.js';
import { $, LS, dlg, el, toast } from './util.js';

const fmt = n => Math.round(n).toLocaleString('fr-FR');
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
let mode = 'session',
  cur = new Date();

const step = d => {
  const x = new Date(cur);
  if (mode == 'day') x.setDate(x.getDate() + d);
  else {
    x.setDate(1);
    x.setMonth(x.getMonth() + d);
  }
  cur = x;
};
const atNow = () =>
  mode == 'day' ? dayKey(cur) >= dayKey() : monthKey(dayKey(cur)) >= monthKey(dayKey());

// Part de l'entrée lue ou écrite en cache (e[4] lu, e[5] et e[6] écrits 5 min et 1 h) : c'est ce qui dit si le
// cache joue son rôle.
const cacheTxt = e => {
  const r = e[4] || 0,
    w = (e[5] || 0) + (e[6] || 0);
  return r || w ? ' (dont ' + fmt(r) + ' lus en cache, ' + fmt(w) + ' mis en cache)' : '';
};
const rows = map => {
  const ks = Object.keys(map).sort((a, b) => map[b][0] + map[b][1] - (map[a][0] + map[a][1])),
    top = ks.length ? map[ks[0]][0] + map[ks[0]][1] : 1;
  return ks.map(k => {
    const e = map[k],
      t = e[0] + e[1],
      c = costOf(e, priceOf(k));
    return el(
      'div',
      { class: 'ur' },
      el(
        'div',
        { class: 'uh' },
        el('b', { text: k }),
        el('span', { text: fmt(t) })
      ),
      el('i', { class: 'bar' }, el('u', { style: 'width:' + Math.max(2, (t / top) * 100) + '%' })),
      el(
        'div',
        { class: 'uf' },
        el('small', {
          text:
            fmt(e[0]) +
            ' en entrée' +
            cacheTxt(e) +
            ' · ' +
            fmt(e[1]) +
            ' en sortie · ' +
            fmt(e[2]) +
            (e[2] > 1 ? ' requêtes' : ' requête') +
            (c != null ? ' · ≈ ' + money(c, S.fx) : ' · sans tarif')
        })
      )
    );
  });
};
const num2 = v => String(v).replace('.', ',');

const bars = ym => {
  const ds = monthDays(ym),
    mx = Math.max(1, ...ds.map(([, t]) => t[0] + t[1])),
    best = ds.reduce((a, b) => (b[1][0] + b[1][1] > a[1][0] + a[1][1] ? b : a), ds[0]);
  const lab = k => new Date(k + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return el(
    'div',
    {
      class: 'ud',
      role: 'img',
      'aria-label':
        best[1][0] + best[1][1]
          ? 'Jour le plus chargé : ' + lab(best[0]) + ', ' + fmt(best[1][0] + best[1][1]) + ' tokens'
          : 'Aucune utilisation ce mois-ci'
    },
    ds.map(([k, t]) => {
      const v = t[0] + t[1];
      return el('i', {
        title: lab(k) + ' : ' + fmt(v) + ' tokens',
        style: 'height:' + (v ? Math.max(4, (v / mx) * 100) : 2) + '%',
        class: v ? 'on' : ''
      });
    })
  );
};

// Plafond mensuel (S.cap, en dollars comme les tarifs) : il ne bloque rien, il prévient à 80 % puis à
// 100 %, une fois par mois et par seuil.
const monthCost = () => costMap(monthMap(monthKey(dayKey()))).sum;
export const capLevel = (spent, cap) => (!cap ? 0 : spent >= cap ? 1 : spent >= cap * 0.8 ? 0.8 : 0);
export function capCheck() {
  if (!S.cap) return;
  const spent = monthCost(),
    lv = capLevel(spent, S.cap),
    k = 'cap:' + monthKey(dayKey());
  if (!lv || +(LS.get(k) || 0) >= lv) return;
  LS.set(k, lv);
  toast(
    (lv >= 1 ? 'Plafond mensuel atteint : ' : '80 % du plafond mensuel : ') +
      money(spent, S.fx) +
      ' sur ' +
      money(S.cap, S.fx) +
      ' ce mois-ci',
    { label: 'Voir', fn: () => openStats('month') }
  );
}
export function openStats(m = 'session') {
  mode = m;
  cur = new Date();
  view();
  if (!$('#dus').open) $('#dus').showModal();
}
const capRow = () => {
  if (!S.cap) return null;
  const spent = monthCost(),
    pc = Math.min(100, (spent / S.cap) * 100);
  return el(
    'div',
    { class: 'ucap' + (spent >= S.cap ? ' over' : '') },
    el('small', {
      text: 'Ce mois-ci : ' + money(spent, S.fx) + ' sur un plafond de ' + money(S.cap, S.fx)
    }),
    el('i', { class: 'bar' }, el('u', { style: 'width:' + Math.max(1, pc) + '%' }))
  );
};
export function view() {
  for (const b of $('#ust').querySelectorAll('button'))
    b.setAttribute('aria-checked', b.dataset.m == mode);
  const nav = mode != 'session';
  $('#usn').hidden = !nav;
  $('#usx').disabled = nav && atNow();
  let map, ym;
  if (mode == 'session') {
    map = SESSION;
    $('#usl').textContent = '';
  } else if (mode == 'day') {
    map = dayMap(dayKey(cur));
    $('#usl').textContent = cap(
      cur.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    );
  } else {
    ym = monthKey(dayKey(cur));
    map = monthMap(ym);
    $('#usl').textContent = cap(cur.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  }
  const t = total(map),
    est = t[3],
    cm = costMap(map);
  const parts = [
    el(
      'div',
      { class: 'ut' },
      el('b', { text: fmt(t[0] + t[1]) }),
      el('small', {
        text:
          'tokens · ' +
          fmt(t[0]) +
          ' en entrée' +
          cacheTxt(t) +
          ' · ' +
          fmt(t[1]) +
          ' en sortie · ' +
          fmt(t[2]) +
          (t[2] > 1 ? ' requêtes' : ' requête')
      }),
      cm.any ? el('span', { class: 'uc', text: '≈ ' + money(cm.sum, S.fx) + ' dépensés' }) : null
    ),
    capRow(),
    ym && t[2] ? bars(ym) : null,
    ...(t[2]
      ? rows(map)
      : [
          el('p', {
            class: 'hint',
            text:
              mode == 'session'
                ? 'Rien depuis l’ouverture de l’application.'
                : 'Aucune utilisation sur cette période.'
          })
        ]),
    t[2] && cm.unknown.length
      ? el('p', {
          class: 'note',
          text:
            'Coût non compté pour ' +
            (cm.unknown.length > 1 ? cm.unknown.length + ' modèles sans tarif' : 'un modèle sans tarif') +
            ' : son tarif s’ajoute dans js/cost.js.'
        })
      : null,
    t[2] && cm.any
      ? el('p', {
          class: 'note',
          text:
            'Coût estimé à partir des tarifs publics, cache compris' +
            (S.fx ? ', converti à ' + num2(S.fx) + ' € pour 1 $' : ', en dollars') +
            ' : votre facture fait foi.'
        })
      : null,
    est
      ? el('p', {
          class: 'note',
          text:
            fmt(est) +
            (est > 1 ? ' requêtes sont estimées' : ' requête est estimée') +
            ' : réponse interrompue, sortie comptée sur le texte reçu.'
        })
      : null,
    mode == 'session'
      ? el('p', {
          class: 'note',
          text: 'Une session court depuis l’ouverture de l’application, jusqu’à sa fermeture complète.'
        })
      : null
  ].filter(Boolean);
  $('#usv').replaceChildren(...parts);
}

$('#usb').onclick = () => openStats(mode);
$('#usk').onclick = async () => {
  const fx = S.fx || 1,
    v = await dlg('Plafond mensuel', {
      m:
        'Montant, en ' +
        (S.fx ? 'euros' : 'dollars') +
        ', au-delà duquel l’application vous prévient (à 80 % puis à 100 %). Elle ne bloque aucun envoi. Vide : pas de plafond.',
      v: S.cap ? num2(Math.round(S.cap * fx * 100) / 100) : '',
      ok: 'Enregistrer'
    });
  if (v === null) return;
  const n = parseAmount(v);
  if (n === undefined) {
    await dlg('Montant illisible', { m: 'Écrivez un nombre, par exemple 15 ou 7,50.', no: 'Fermer' });
    return;
  }
  const cap = n ? n / fx : 0;
  // Repère du mois (avertissement déjà donné) remis à zéro seulement si le plafond change.
  if (Math.abs(cap - (S.cap || 0)) > 1e-9) LS.del('cap:' + monthKey(dayKey()));
  S.cap = cap;
  await saveSet();
  view();
  capCheck();
};
$('#ust').onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.m != mode) cur = new Date();
  mode = b.dataset.m;
  view();
};
$('#usp').onclick = () => {
  step(-1);
  view();
};
$('#usx').onclick = () => {
  step(1);
  view();
};
$('#usc').onclick = () => $('#dus').close();
$('#usf').onclick = async () => {
  const v = await dlg('Afficher en euros', {
    m: 'Les tarifs sont publiés en dollars. Combien d’euros pour un dollar (exemple : 0,92) ? Vide : afficher en dollars.',
    v: S.fx ? num2(S.fx) : '',
    ok: 'Enregistrer'
  });
  if (v === null) return;
  const n = parseAmount(v);
  if (n === undefined) {
    await dlg('Taux illisible', { m: 'Écrivez un nombre, par exemple 0,92.', no: 'Fermer' });
    return;
  }
  S.fx = n || 0;
  await saveSet();
  view();
};
$('#usr').onclick = async () => {
  if (
    await dlg('Effacer les statistiques ?', {
      m: 'Les compteurs de tous les jours et de la session repartent de zéro. Les histoires ne sont pas touchées.',
      ok: 'Effacer'
    })
  ) {
    clear();
    view();
  }
};
