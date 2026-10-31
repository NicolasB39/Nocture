import { SUM_MAX, clip, sameName } from './memory.js';
import { DEFAULT_FIELDS, modelOf, protocol } from './protocol.js';
import { RECALL_N, recall, recallTag } from './recall.js';
import { S, ctx } from './state.js';
import { nz } from './util.js';

export const estTok = t => Math.ceil(t.length / (S.cpt || 3.4)) + 4;
export const budgetOf = s => {
  const L = S.ctxLim || 0;
  if (!L) return 0;
  return L - Math.min(s.maxTok || S.reserve || 1000, Math.floor(L / 2));
};
export const statOn = s => s.stat ?? !!(s.remote && ctx.stat);
export const statFields = s =>
  (s.statFields || '').trim() || (s.remote ? ctx.stat : '') || DEFAULT_FIELDS;

const CAST_FREE = 900;
const MEM_N = 20;
const WIN_STEP = 8;

const textOf = ms =>
  nz(
    ms
      .map(m => m.content + ' ' + (m.state || []).map(e => e.join(' ')).join(' '))
      .join('\n')
  );
const loreTag = a => (a.length ? '\n\n<lorebook>\n' + a.map(e => e.text).join('\n\n') + '\n</lorebook>' : '');
const lorePerm = () => (ctx.lore || []).filter(e => e.always).sort((x, y) => y.pr - x.pr);
const loreFor = (ms, max) => {
  const t = textOf(ms);
  let a = (ctx.lore || []).filter(e => !e.always && e.keys.some(r => r.test(t))).sort((x, y) => y.pr - x.pr);
  if (max) a = a.slice(0, Math.max(0, max - lorePerm().length));
  return loreTag(a);
};
export const inScene = ms => {
  const t = textOf(ms);
  return (ctx.chars || []).filter(c => (c.keys || []).some(r => r.test(t)));
};
// Rapport fixe, pas S.cpt : recalibré à chaque réponse, il ferait basculer les fiches d'un tour à l'autre entre
// la partie fixe du prompt et la fin du dernier message, et réécrire tout le cache de Claude.
const small = C => C.reduce((a, c) => a + Math.ceil(c.text.length / 3.4) + 4, 0) <= CAST_FREE;
const charsPerm = () => {
  const C = (ctx.chars || []).filter(c => c.text);
  return small(C) ? C : C.filter(c => c.always);
};
const charsFor = ms => {
  const C = (ctx.chars || []).filter(c => c.text);
  if (!C.length || small(C)) return [];
  const t = textOf(ms);
  return C.filter(c => !c.always && c.keys.some(r => r.test(t)));
};
const permBlock = () => {
  const C = charsPerm(),
    im = (ctx.chars || []).filter(c => c.images?.length);
  return (
    (C.length
      ? '\n\n<personnages>' + C.map(x => '\n\n## ' + x.name + '\n' + x.text).join('') + '\n</personnages>'
      : '') +
    loreTag(lorePerm()) +
    (im.length
      ? '\n\n<images_disponibles>\n' +
        im.map(c => '- ' + c.name + ' : ' + c.images.join(', ')).join('\n') +
        "\nÀ insérer au fil du récit, là où elles illustrent le texte, pas forcément en début de réponse. N'utilise que les images d'un personnage présent dans la scène.\n</images_disponibles>"
      : '')
  );
};
const castBlock = () => {
  const C = ctx.chars || [];
  return C.length
    ? '\n\n# Personnages du monde\n' +
        C.map(c => '- ' + c.name + (c.sum ? ' : ' + c.sum : '')).join('\n') +
        "\nTu peux faire intervenir n'importe lequel d'entre eux. Leur fiche détaillée t'est fournie quand ils sont en scène."
    : '';
};
const memBlock = s => {
  let t = '';
  if (s.mem.summary.trim())
    t += '\n\n<previous_history>\n' + clip(s.mem.summary, SUM_MAX) + '\n</previous_history>';
  if (s.mem.lines?.length)
    t += '\n\n<recent_history>\n' + s.mem.lines.map(x => '- ' + x.t).join('\n') + '\n</recent_history>';
  const k = s.memN ?? MEM_N,
    mm = k > 0 ? (s.mem.memories || []).slice(-k) : [];
  if (mm.length)
    t += '\n\n<long_term_memory>\n' + mm.map(x => '- ' + x).join('\n') + '\n</long_term_memory>';
  const rl = Object.entries(s.mem.relations || {});
  if (rl.length)
    t +=
      '\n\n<relations>\n(États enregistrés, ils peuvent dater : les événements récents priment.)\n' +
      rl.map(([k, v]) => '- ' + k + ' : ' + v).join('\n') +
      '\n</relations>';
  if (s.note?.trim()) t += '\n\n<system_note>\n' + s.note.trim() + '\n</system_note>';
  return t;
};
const relOf = (mem, name) => {
  for (const r in mem.relations || {})
    if (sameName(r, name))
      return '\nRelation (état enregistré, peut dater ; les événements récents priment) : ' + mem.relations[r];
  return '';
};
// Changements d'effort de l'histoire, s.effLog : [indice du premier message concerné, effort]. Avec Claude, l'effort
// de premier niveau reste celui du premier message envoyé, et les changements suivants deviennent des messages
// d'effort dans l'historique (toAnt, ai.js) : changer l'effort en cours de partie ne réécrit plus le cache.
// Un changement vaut à partir du prochain tour du joueur : le dernier message s'il attend encore sa réponse.
export const effortSet = (s, e) => {
  if ((s.effort || '') === e) return;
  const n = s.messages.length,
    at = s.messages.at(-1)?.role == 'user' ? n - 1 : n,
    u = Math.min(s.mem?.upto || 0, at),
    log = (s.effLog?.length ? s.effLog : [[0, s.effort || '']]).filter(([k]) => k < at);
  // Les changements déjà résumés ne servent plus qu'à donner l'effort de départ : fondus en une entrée, pour
  // que le journal ne grossisse pas avec la partie.
  const old = log.filter(([k]) => k <= u);
  s.effLog = [...(old.length ? [[0, old.at(-1)[1]]] : []), ...log.filter(([k]) => k > u), [at, e]];
  s.effort = e;
};
// Messages retirés à partir de n (suppression, renvoi, bifurcation) : un changement fait plus loin vaut dès n.
export const effortCut = (s, n) => {
  if (!s.effLog?.length) return;
  const m = new Map();
  for (const [k, v] of s.effLog) m.set(Math.min(k, n), v);
  s.effLog = [...m].sort((a, b) => a[0] - b[0]);
};
// Effort de premier niveau (celui en vigueur au message first, le premier envoyé) et changements à placer
// devant des messages plus loin. Un changement placé après le dernier tour du joueur (réponse régénérée) est
// ramené devant lui : un message d'effort ne vaut qu'à partir du tour du joueur qui le suit.
export const effortPlan = (s, first) => {
  const log = s.effLog?.length ? s.effLog : [[0, s.effort || '']],
    lu = s.messages.findLastIndex(m => m.role == 'user'),
    marks = [];
  let base = log[0][1] || 'low';
  for (const [k, e] of log) {
    const at = lu < 0 ? k : Math.min(k, lu),
      v = e || 'low';
    if (at <= first) {
      base = v;
      continue;
    }
    // Deux changements ramenés au même message : le dernier l'emporte ; aucun message s'il ne change rien.
    if (marks.at(-1)?.[0] === at) marks.pop();
    if (v !== (marks.at(-1)?.[1] ?? base)) marks.push([at, v]);
  }
  return { base, marks };
};
export function buildInfo(s, cont, hint) {
  const nm = s.pname?.trim() || '';
  const U = t => t.replace(/\{\{user\}\}/gi, nm || 'Joueur');
  const c = s.remote ? ctx : { system: s.system, avatar: s.avatar };
  const av = (nm ? 'Nom : ' + nm + '\n' : '') + (c.avatar || '');
  let sys = c.system || '';
  if (!s.noPre && S.pre?.trim()) sys += '\n\n' + S.pre.trim();
  sys += castBlock() + permBlock();
  const P = protocol({
    model: modelOf(s),
    stat: statOn(s),
    fields: statFields(s).replace(/\s*\n+\s*/g, ', '),
    choices: !s.noChoices,
    prompt: s.choicePrompt?.trim(),
    style: !s.noStyle,
    images: (ctx.images || []).length > 0
  });
  sys += P.sys;
  if (av.trim()) sys += '\n\n# Avatar du joueur\n' + av;
  const cut = U(sys).length;
  sys = U(sys + memBlock(s));

  const start = Math.min(s.mem.upto, s.messages.length);
  const ms = s.messages.slice(start).map(m => ({ role: m.role, content: m.content }));
  if (cont)
    ms.push({
      role: 'user',
      content: "Continue ta réponse exactement là où elle s'est arrêtée, sans répéter ce qui précède."
    });
  const l = ms.at(-1);

  let add = loreFor(s.messages.slice(-(s.loreDepth || 2)), s.loreMax);
  const act = charsFor(s.messages.slice(-6));
  if (act.length) {
    add +=
      '\n\n<personnages>' +
      act.map(x => '\n\n## ' + x.name + '\n' + x.text + relOf(s.mem, x.name)).join('') +
      '\n</personnages>';
  }
  // Passages anciens : en queue, comme le lorebook déclenché, pour ne rien invalider du cache.
  // On ne fouille que ce qui n'est plus envoyé tel quel : déjà résumé, ou sorti de la fenêtre au tour précédent.
  const before = Math.max(start, Math.min(s.mem.win || 0, s.messages.length));
  add += recallTag(
    recall(s.messages, before, textOf(s.messages.slice(-2)), s.recallN ?? RECALL_N),
    nm || 'Joueur'
  );
  if (statOn(s)) {
    const prev = [...s.messages].reverse().find(m => m.role == 'assistant' && m.state?.length)?.state;
    add +=
      '\n\n<etat_precedent>\n' +
      (prev
        ? prev.map(([k, v]) => k + ': ' + v).join('\n') +
          '\nNe modifie que ce que les événements de la scène changent.'
        : 'Aucun. Invente des valeurs de départ cohérentes avec le scénario.') +
      '\n</etat_precedent>';
  }
  // Indication de régénération : valable pour cette réponse seulement, jamais enregistrée dans l'histoire.
  if (hint?.trim())
    add +=
      '\n\n<indication>\nPour cette réponse seulement, le joueur demande : ' +
      hint.trim() +
      '\nRespecte-la sans la mentionner dans le récit.\n</indication>';
  add += P.tail;
  if (add && l?.role == 'user') l.content += U(add);

  const sysMsg = sys.trim() ? [{ role: 'system', content: sys, cut }] : [],
    B = budgetOf(s),
    n = ms.length,
    cost = ms.map(m => estTok(m.content)),
    base = sysMsg.length ? estTok(sys) : 0;
  const fits = f => base + cost.slice(f).reduce((a, b) => a + b, 0);
  const align = f => {
    while (f < n - 1 && ms[f].role == 'assistant') f++;
    return f;
  };
  let from = 0;
  if (B && n > 1) {
    let g = n - 1,
      acc = base + cost[n - 1];
    for (let i = n - 2; i >= 0 && acc + cost[i] <= B; i--) {
      acc += cost[i];
      g = i;
    }
    g = align(g);
    from = Math.max(0, Math.min((s.mem.win || 0) - start, n - 1));
    if (from < g) {
      while (from < g) from += WIN_STEP;
      from = align(Math.min(from, (g + n) >> 1));
      if (ms[from].role == 'assistant') from = g;
    } else if (from > g + 2 * WIN_STEP) from = g;
  }
  const eff = effortPlan(s, start + from);
  for (const [at, v] of eff.marks) if (at - start < ms.length) ms[at - start].effBefore = v;
  return {
    msgs: [...sysMsg, ...ms.slice(from)],
    effort: eff.base,
    used: fits(from),
    budget: B,
    omitted: from,
    win: start + from,
    over: B > 0 && fits(from) > B
  };
}
// Coût des extras, mesuré sur les dernières réponses : tokens moyens d'un bloc <choix> et d'un bloc <etat>
// (sur les réponses qui en ont un), coût moyen par réponse des deux (avg, payé comme sortie) et leur part
// dans la sortie totale.
export const extrasOf = (ms, n = 30) => {
  const a = ms.filter(m => m.role == 'assistant').slice(-n);
  if (!a.length) return null;
  let ch = 0,
    st = 0,
    nc = 0,
    ns = 0,
    out = 0;
  for (const m of a) {
    const c = m.choices?.length
        ? estTok('<choix>\n' + m.choices.map((x, i) => i + 1 + '. ' + x).join('\n') + '\n</choix>')
        : 0,
      e = m.state?.length ? estTok('<etat>\n' + m.state.map(([k, v]) => k + ': ' + v).join('\n') + '\n</etat>') : 0;
    ch += c;
    st += e;
    nc += c > 0;
    ns += e > 0;
    out += estTok(m.content) + c + e;
  }
  return {
    n: a.length,
    ch: nc ? ch / nc : 0,
    st: ns ? st / ns : 0,
    avg: (ch + st) / a.length,
    share: (ch + st) / out
  };
};
export const omittedCount = s => buildInfo(s).omitted;
