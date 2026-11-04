import { lastEtat } from './format.js';
import { CH_FULL, SUM_MAX, clip, sameName } from './memory.js';
import { DEFAULT_FIELDS, protocol } from './protocol.js';
import { RECALL_N, recall, recallTag } from './recall.js';
import { S, ctx, playerName } from './state.js';
import { nz } from './util.js';

// Estimation, avant l'envoi : 2,2 caractères par token, mesuré sur les décomptes réels de Sonnet et Haiku 5.5
// (récit en français, balises comprises). Le vrai compte vient de la réponse.
export const estTok = t => Math.ceil(t.length / 2.2) + 4;
export const statOn = s => s.stat ?? !!(s.remote && ctx.stat);
export const statFields = s =>
  (s.statFields || '').trim() || (s.remote ? ctx.stat : '') || DEFAULT_FIELDS;

const MEM_N = 20;

const textOf = ms =>
  nz(
    ms
      .map(m => m.content + ' ' + (m.state || []).map(e => e.join(' ')).join(' '))
      .join('\n')
  );
const loreTag = a => (a.length ? '\n\n<lorebook>\n' + a.map(e => e.text).join('\n\n') + '\n</lorebook>' : '');
// La partie fixe du prompt est relue en cache à un dixième du prix d'entrée au plus (un vingtième sur Sonnet et
// Opus 5.5, un quarantième sur Fable 5.1), alors que la fin de requête est payée plein tarif à chaque tour. Des
// fiches et un lorebook modestes coûtent donc moins en entier dans la partie fixe que par morceaux en fin de
// requête ; au-delà de CACHED_FREE tokens, seuls les actifs partent.
const CACHED_FREE = 5000;
export const toks = L => L.reduce((a, x) => a + estTok(x.text), 0);
// Lorebook entier en partie fixe, sauf limite d'entrées choisie dans le scénario.
const loreAll = max => !max && toks(ctx.lore || []) <= CACHED_FREE;
const lorePerm = max => (ctx.lore || []).filter(e => e.always || loreAll(max)).sort((x, y) => y.pr - x.pr);
const loreFor = (ms, max) => {
  if (loreAll(max)) return '';
  const t = textOf(ms);
  let a = (ctx.lore || []).filter(e => !e.always && e.keys.some(r => r.test(t))).sort((x, y) => y.pr - x.pr);
  if (max) a = a.slice(0, Math.max(0, max - lorePerm(max).length));
  return loreTag(a);
};
export const inScene = ms => {
  const t = textOf(ms);
  return (ctx.chars || []).filter(c => (c.keys || []).some(r => r.test(t)));
};
const small = C => toks(C) <= CACHED_FREE;
const withText = () => (ctx.chars || []).filter(c => c.text);
const charsPerm = () => {
  const C = withText();
  return small(C) ? C : C.filter(c => c.always);
};
// Fiches qui ne tiennent pas dans la partie fixe : envoyées parmi les récurrentes, ou en fin de requête pour
// les personnages en scène.
const loose = () => {
  const C = withText();
  return small(C) ? [] : C.filter(c => !c.always);
};
// cast : personnages récurrents, déjà envoyés en cache (castOf).
const charsFor = (ms, cast = []) => {
  const t = textOf(ms);
  return loose().filter(c => !cast.includes(c.name) && c.keys.some(r => r.test(t)));
};
// Personnages récurrents : quand les fiches ne tiennent pas toutes dans la partie fixe, celles des personnages
// nommés dans au moins CAST_MIN des CAST_N derniers messages partent en cache, entre la partie fixe et la
// mémoire, au lieu de repartir au prix plein en fin de requête à chaque tour. keep : la liste en place, gardée
// telle quelle et dans l'ordre, les nouveaux venus à la fin : ses fiches restent relues en cache, seules les
// nouvelles sont écrites. Fiches pas encore chargées (scénario injoignable) : la liste en place reste.
const CAST_N = 30,
  CAST_MIN = 3;
export const castOf = (s, keep = []) => {
  if (!withText().length) return keep;
  const C = loose(),
    T = s.messages.slice(-CAST_N).map(m => textOf([m])),
    hot = C.filter(c => T.filter(t => c.keys.some(r => r.test(t))).length >= CAST_MIN).map(c => c.name),
    old = keep.filter(n => C.some(c => c.name == n));
  return [...old, ...hot.filter(n => !old.includes(n))];
};
// La liste (s.cast) ne change qu'aux moments où ce qui la suit est réécrit de toute façon : recalculée quand le
// cache a expiré, complétée quand la mémoire a avancé depuis le dernier envoi (upto : son point d'alors).
export const nextCast = (s, cold, upto) =>
  cold ? castOf(s) : upto != null && upto !== s.mem.upto ? castOf(s, s.cast) : s.cast || [];
const castFiches = s => {
  const C = loose();
  return (s.cast || []).map(n => C.find(c => c.name == n)).filter(Boolean);
};
// Bloc système d'une fiche récurrente : le journal le reconnaît à son début.
const CAST_TAG = '\n\n<personnages>';
export const isCastBlock = t => t.startsWith(CAST_TAG);
const permBlock = loreMax => {
  const C = charsPerm(),
    im = (ctx.chars || []).filter(c => c.images?.length);
  return (
    (C.length
      ? '\n\n<personnages>' + C.map(x => '\n\n## ' + x.name + '\n' + x.text).join('') + '\n</personnages>'
      : '') +
    loreTag(lorePerm(loreMax)) +
    (im.length
      ? '\n\n<images_disponibles>\n' +
        im.map(c => '- ' + c.name + ' : ' + c.images.join(', ')).join('\n') +
        "\nN'utilise que ces codes, tels quels, et seulement pour un personnage présent dans la scène. Un personnage absent de cette liste n'a pas d'image : n'invente pas de code pour lui.\n</images_disponibles>"
      : '')
  );
};
const castBlock = () => {
  const C = ctx.chars || [],
    W = C.filter(c => c.text);
  return C.length
    ? '\n\n# Personnages du monde\n' +
        C.map(c => '- ' + c.name + (c.sum ? ' : ' + c.sum : '')).join('\n') +
        "\nTu peux faire intervenir n'importe lequel d'entre eux. " +
        (W.length && small(W)
          ? 'Leurs fiches détaillées suivent.'
          : "Leur fiche détaillée t'est fournie quand ils sont en scène.")
    : '';
};
// Chapitres clos : figés, ils ne changent qu'à la clôture d'un chapitre. Ils ferment donc la partie fixe, au
// lieu de se faire réécrire en cache avec le résumé à chaque mise à jour de la mémoire.
const chBlock = s => {
  const ch = s.mem.chapters || [];
  return ch.length
    ? '\n\n<chapitres>\n' +
        ch.map((c, i) => 'Chapitre ' + (i + 1) + ' : ' + c.t + (i >= ch.length - CH_FULL ? '\n' + c.s : '')).join('\n\n') +
        '\n</chapitres>'
    : '';
};
// Le résumé et les lignes récentes s'arrêtent 40 à 120 messages avant le dernier (mise à jour par lots) : comme
// pour les relations, l'IA est prévenue que les messages envoyés tels quels l'emportent.
const BEFORE = "\n(Antérieur aux messages qui suivent : s'ils le contredisent, ils priment.)";
const memBlock = s => {
  let t = '';
  if (s.mem.summary.trim())
    t += '\n\n<previous_history>' + BEFORE + '\n' + clip(s.mem.summary, SUM_MAX) + '\n</previous_history>';
  if (s.mem.lines?.length)
    t += '\n\n<recent_history>' + BEFORE + '\n' + s.mem.lines.map(x => '- ' + x.t).join('\n') + '\n</recent_history>';
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
export function buildInfo(s, cont, hint) {
  const nm = playerName(s);
  const U = t => t.replace(/\{\{user\}\}/gi, nm || 'Joueur');
  const c = s.remote ? ctx : { system: s.system, avatar: s.avatar };
  const av = (nm ? 'Nom : ' + nm + '\n' : '') + (c.avatar || '');
  let sys = c.system || '';
  if (!s.noPre && S.pre?.trim()) sys += '\n\n' + S.pre.trim();
  sys += castBlock() + permBlock(s.loreMax);
  sys += protocol({
    stat: statOn(s),
    fields: statFields(s).replace(/\s*\n+\s*/g, ', '),
    choices: !s.noChoices,
    prompt: s.choicePrompt?.trim(),
    style: !s.noStyle,
    images: (ctx.images || []).length > 0
  });
  if (av.trim()) sys += '\n\n# Avatar du joueur\n' + av;
  // Blocs du système : partie fixe, une fiche récurrente par bloc, mémoire. Marqueurs de cache (cache) sur la
  // partie fixe, la dernière fiche et la mémoire : avec celui de l'historique, quatre au plus. Une fiche par
  // bloc : quand la liste s'allonge, le cache retrouve l'entrée qui finissait sur l'ancienne dernière fiche et
  // n'écrit que les nouvelles.
  const F = castFiches(s),
    blocks = [
      { text: U(sys + chBlock(s)), cache: true },
      ...F.map((c, i) => ({ text: U(CAST_TAG + '\n\n## ' + c.name + '\n' + c.text + '\n</personnages>'), cache: i == F.length - 1 })),
      { text: U(memBlock(s)), cache: true }
    ];
  sys = blocks.map(b => b.text).join('');

  const start = Math.min(s.mem.upto, s.messages.length);
  const ms = s.messages.slice(start).map(m => ({ role: m.role, content: m.content }));
  if (cont)
    ms.push({
      role: 'user',
      content: "Continue ta réponse exactement là où elle s'est arrêtée, sans répéter ce qui précède."
    });
  const l = ms.at(-1);

  let add = loreFor(s.messages.slice(-(s.loreDepth || 2)), s.loreMax);
  const act = charsFor(s.messages.slice(-6), s.cast);
  if (act.length) {
    add +=
      '\n\n<personnages>' +
      act.map(x => '\n\n## ' + x.name + '\n' + x.text + relOf(s.mem, x.name)).join('') +
      '\n</personnages>';
  }
  // Passages anciens : en queue, comme le lorebook déclenché, pour ne rien invalider du cache.
  // On ne fouille que ce qui n'est plus envoyé tel quel : déjà résumé.
  add += recallTag(
    recall(s.messages, start, textOf(s.messages.slice(-2)), s.recallN ?? RECALL_N),
    nm || 'Joueur'
  );
  if (statOn(s)) {
    const prev = lastEtat(s.messages);
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
  if (add && l?.role == 'user') l.content += U(add);

  const sysMsg = sys.trim() ? [{ role: 'system', content: sys, blocks }] : [];
  return {
    msgs: [...sysMsg, ...ms],
    // Estimation des tokens envoyés (compteur sous la conversation).
    used: (sysMsg.length ? estTok(sys) : 0) + ms.reduce((a, m) => a + estTok(m.content), 0),
    // Premier message envoyé tel quel : ceux d'avant sont dans la mémoire.
    win: start
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
