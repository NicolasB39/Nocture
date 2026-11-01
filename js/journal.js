import { bkOn, ghSaveFile } from './backup.js';
import { costOf, money, priceOf } from './cost.js';
import { estTok } from './prompt.js';
import { S } from './state.js';
import { clearCalls, getCallBody, getCalls } from './store.js';
import { $, dlg, el, saveFile, toast } from './util.js';

// Journal des appels : chaque requête envoyée à Claude (ai.js, quand la case des Réglages est cochée), avec ce
// qu'elle a coûté. Pour une requête de narration, deux lectures utiles pour le cache : ce qui part hors cache
// (la fin du dernier message, recomposée à chaque tour) et, d'un tour à l'autre, le premier bloc qui a changé,
// à partir duquel tout le prompt a été réécrit en cache.

const NARR = ['tour', 'régénérer', 'indication', 'continuer'];
const txt = c => (typeof c == 'string' ? c : (c || []).map(b => b.text || '').join(''));
// Blocs du préfixe, dans l'ordre où le cache les lit : modèle et effort, blocs système, puis messages.
export const blocks = b => [
  ['du modèle ou de l’effort', JSON.stringify([b.model, b.output_config || null])],
  ...(b.system || []).map((x, i) => [i ? 'de la mémoire (résumé, souvenirs, relations, note)' : 'de la partie fixe du prompt', x.text]),
  ...(b.messages || []).map((m, i) => ['du message ' + (i + 1), m.role + JSON.stringify(m.output_config || null) + txt(m.content)])
];
// Le cache de la requête prev couvre jusqu'à son dernier message non système avant le dernier (marqueur posé par
// toAnt ; un message d'effort qui le suit n'en fait pas partie). Rend null si cur relit tout ce préfixe, sinon
// le premier bloc changé.
export const prefixDiff = (prev, cur) => {
  const a = blocks(prev),
    b = blocks(cur),
    ms = prev.messages || [],
    j = ms.slice(0, -1).findLastIndex(m => m.role != 'system'),
    n = 1 + (prev.system || []).length + j + 1;
  for (let i = 0; i < n; i++) if (a[i][1] !== b[i]?.[1]) return b[i]?.[0] || a[i][0];
  return null;
};
// Durée de vie du cache de la requête b : 5 minutes, ou une heure (Réglages).
const life = b => (b?.system?.[0]?.cache_control?.ttl == '1h' ? 3600e3 : 300e3);
const TAGS = {
  lorebook: 'Lorebook déclenché',
  personnages: 'Fiches des personnages en scène',
  passages_anciens: 'Passages anciens retrouvés',
  etat_precedent: 'État précédent',
  indication: 'Indication',
  rappel: 'Rappel des formats'
};
// Fin de requête, hors cache : le dernier message, découpé en blocs ajoutés par l'application, en tokens estimés.
export const tailParts = b => {
  const t = txt(b.messages?.at(-1)?.content),
    out = [];
  let rest = t;
  for (const m of t.matchAll(/<([a-z_]+)>[\s\S]*?<\/\1>/g)) {
    out.push([TAGS[m[1]] || m[1], estTok(m[0])]);
    rest = rest.replace(m[0], '');
  }
  return [['Dernier message du joueur', estTok(rest.trim())], ...out];
};

const f = x => Math.round(x).toLocaleString('fr-FR');
const hm = t => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const start = c => c.t - (c.ms || 0);
const head = c => {
  const [p = 0, o = 0, , , cr = 0, w5 = 0, w1 = 0] = c.e || [],
    k = c.e ? costOf(c.e, priceOf(c.key || '', S.prices)) : null;
  return (
    (c.e
      ? '≈ ' + f(p) + ' envoyés · ' + f(cr) + ' lus en cache · ' + f(w5 + w1) + ' écrits · ' + f(o) + ' en sortie' + (k != null ? ' · ' + money(k, S.fx) : '')
      : '') +
    (c.err ? (c.e ? ' · ' : '') + 'échec : ' + c.err : c.stop && c.stop != 'end_turn' ? ' · fin : ' + c.stop : '')
  );
};
const line = (a, b) => el('p', { class: 'scx', text: a + ' : ' + b });
// Le cache vu de la requête c : expiré depuis la dernière lecture de son histoire (requête ou relance), ou relu
// jusqu'au premier bloc changé par rapport à la requête de narration précédente.
const cacheLine = (c, b, prev, pb, reads) => {
  if (!prev || !pb) return 'pas de requête précédente réussie pour cette histoire dans le journal';
  const last = Math.max(start(prev), ...reads.map(start)),
    gap = start(c) - last;
  if (gap > life(pb))
    return 'expiré : ' + Math.round(gap / 60000) + ' min sans lecture depuis ' + hm(last) + ' (durée de vie ' + (life(pb) > 300e3 ? '1 h' : '5 min') + '), tout le prompt est réécrit';
  const d = prefixDiff(pb, b);
  return d ? 'réécrit à partir ' + d + ' (comparé à la requête de ' + hm(prev.t) + ')' : 'préfixe identique à la requête de ' + hm(prev.t) + ' : seule la suite est nouvelle';
};
const detail = async (c, prev, reads) => {
  const [b, pb] = await Promise.all([getCallBody(c.k), prev ? getCallBody(prev.k) : null]),
    e = c.e || [],
    sys = b?.system || [],
    ms = b?.messages || [],
    out = [];
  if (e.length) out.push(line('Hors cache', '≈ ' + f(e[0] - (e[4] || 0) - (e[5] || 0) - (e[6] || 0)) + ' tokens, payés plein tarif'));
  if (!b) return [...out, el('p', { class: 'scx', text: 'Requête effacée.' })];
  if (NARR.includes(c.kind))
    out.push(
      line('Cache', cacheLine(c, b, prev, pb, reads)),
      line(
        'Composition',
        [
          'partie fixe ≈ ' + f(estTok(sys[0]?.text || '')),
          sys[1] && 'mémoire ≈ ' + f(estTok(sys[1].text)),
          ms.length - 1 + ' messages d’historique ≈ ' + f(ms.slice(0, -1).reduce((a, m) => a + estTok(txt(m.content)), 0)),
          'fin de requête ≈ ' + f(estTok(txt(ms.at(-1)?.content)))
        ]
          .filter(Boolean)
          .join(' · ') + ' (tokens estimés)'
      ),
      el('p', { class: 'scx', text: 'Fin de requête, hors cache :' }),
      el('ul', { class: 'jrt' }, tailParts(b).filter(x => x[1] > 4).map(([k, v]) => el('li', { text: k + ' ≈ ' + f(v) })))
    );
  const raw = el('pre', { class: 'jrr' }),
    dt = el('details', null, el('summary', { text: 'Requête complète' }), raw);
  // Le texte complet peut peser des centaines de kilo-octets : écrit seulement à l'ouverture.
  dt.ontoggle = () => dt.open && !raw.textContent && (raw.textContent = JSON.stringify(b, null, 1));
  out.push(dt);
  return out;
};

// En-têtes seulement, du plus récent au plus ancien : les requêtes complètes se lisent à l'ouverture d'un appel.
let CALLS = [];
const draw = () => {
  $('#jrn').textContent = CALLS.length
    ? CALLS.length + (CALLS.length > 1 ? ' appels, du plus récent au plus ancien.' : ' appel.') + (S.journal ? '' : ' Journal en pause : cochez « Journal des appels » dans les Réglages.')
    : S.journal
      ? 'Aucun appel pour le moment.'
      : 'Journal désactivé : cochez « Journal des appels » dans Réglages, section Compteurs et débit.';
  $('#jrg').hidden = !CALLS.length || !bkOn();
  $('#jrl').replaceChildren(
    ...CALLS.map((c, i) => {
      // Requête de narration réussie précédente de la même histoire, et relances du cache faites entre les deux.
      const narr = NARR.includes(c.kind),
        pi = narr ? CALLS.findIndex((x, k) => k > i && x.sid == c.sid && NARR.includes(x.kind) && !x.err) : -1,
        prev = pi < 0 ? null : CALLS[pi],
        reads = prev ? CALLS.slice(i + 1, pi).filter(x => x.kind == 'relance' && x.sid == c.sid && !x.err) : [],
        h = el(
          'button',
          { class: 'sch', 'aria-expanded': 'false' },
          el('span', { class: 'sct' }, hm(c.t) + ' · ' + (c.kind || 'appel') + ' · ' + String(c.key || '').replace(/^claude-/, ''), el('span', { class: 'scv' })),
          el('span', { class: 'scm', text: head(c) })
        ),
        g = el('div', { class: 'scg' }, h);
      h.onclick = async () => {
        if (!g.querySelector('.scb')) {
          const bx = el('div', { class: 'scb' }, el('p', { class: 'scx', text: 'Lecture…' }));
          g.append(bx);
          try {
            bx.replaceChildren(...(await detail(c, prev, reads)));
          } catch (e) {
            bx.replaceChildren(el('p', { class: 'scx', text: 'Lecture impossible : ' + e.message }));
          }
        }
        h.setAttribute('aria-expanded', String(g.classList.toggle('open')));
      };
      return g;
    })
  );
};
export async function openJournal() {
  try {
    CALLS = (await getCalls()).reverse();
  } catch (e) {
    CALLS = [];
  }
  draw();
  if (!$('#djr').open) $('#djr').showModal();
}
$('#usj').onclick = openJournal;
$('#jrc').onclick = () => $('#djr').close();
// Export : les requêtes complètes sont relues une à une, dans l'ordre d'envoi.
const exportText = async () => {
  const all = [];
  for (const c of [...CALLS].reverse()) all.push({ ...c, body: await getCallBody(c.k).catch(() => null) });
  return JSON.stringify({ v: 1, calls: all });
};
const stamp = () => new Date().toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '');
$('#jre').onclick = async () =>
  saveFile(new File([await exportText()], 'nocturne-journal-' + stamp() + '.json', { type: 'application/json' }));
// Envoi dans le dépôt de sauvegarde, un fichier daté par envoi, sous <dossier de sauvegarde>/journal/.
$('#jrg').onclick = async () => {
  const b = $('#jrg'),
    n = 'journal/journal-' + stamp() + '.json';
  b.disabled = true;
  b.textContent = 'Envoi…';
  try {
    await ghSaveFile(n, await exportText(), 'Journal des appels (' + CALLS.length + ')');
    toast('Journal envoyé sur GitHub : ' + n);
  } catch (e) {
    await dlg('Envoi impossible', { m: e.message, no: 'Fermer' });
  } finally {
    b.disabled = false;
    b.textContent = 'Envoyer sur GitHub';
  }
};
$('#jrx').onclick = async () => {
  if (!(await dlg('Vider le journal ?', { m: 'Les appels enregistrés sur cet appareil sont effacés. Les statistiques ne sont pas touchées.', ok: 'Vider' })))
    return;
  await clearCalls();
  CALLS = [];
  draw();
};
