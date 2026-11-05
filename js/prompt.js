import { rulesOf } from './dice.js';
import { lastEtat } from './format.js';
import { CH_FULL, SUM_MAX, clip, sameName } from './memory.js';
import { DEFAULT_FIELDS, protocol } from './protocol.js';
import { recall, recallTag } from './recall.js';
import { S, ctx, playerName } from './state.js';
import { nz } from './util.js';

// Estimation, avant l'envoi : 2,2 caractères par token, mesuré sur les décomptes réels de Sonnet et Haiku 5.5
// (récit en français, balises comprises). Le vrai compte vient de la réponse.
export const estTok = t => Math.ceil(t.length / 2.2) + 4;
export const statOn = s => s.stat ?? !!(s.remote && ctx.stat);
export const statFields = s =>
  (s.statFields || '').trim() || (s.remote ? ctx.stat : '') || DEFAULT_FIELDS;

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
// requête ; au-delà de CACHED_FREE tokens, seuls les actifs partent. Le seuil laisse de la marge aux scénarios
// joués (les 19 fiches de Lumencia font environ 5 200 tokens) : une fiche ajoutée ne fait pas tout basculer.
const CACHED_FREE = 8000;
export const toks = L => L.reduce((a, x) => a + estTok(x.text), 0);
// Lorebook entier en partie fixe s'il tient dans le budget ; sinon les entrées « toujours » y vont, et les
// autres partent en fin de requête quand un de leurs mots-clés est dans les deux derniers messages.
const loreAll = () => toks(ctx.lore || []) <= CACHED_FREE;
const loreFor = ms => {
  if (loreAll()) return '';
  const t = textOf(ms);
  return loreTag((ctx.lore || []).filter(e => !e.always && e.keys.some(r => r.test(t))).sort((x, y) => y.pr - x.pr));
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
// Fiches qui ne tiennent pas dans la partie fixe : envoyées en fin de requête pour les personnages en scène.
const loose = () => {
  const C = withText();
  return small(C) ? [] : C.filter(c => !c.always);
};
const charsFor = ms => {
  const t = textOf(ms);
  return loose().filter(c => c.keys.some(r => r.test(t)));
};
const permBlock = () => {
  const C = charsPerm(),
    all = loreAll(),
    im = (ctx.chars || []).filter(c => c.images?.length);
  return (
    (C.length
      ? '\n\n<personnages>' + C.map(x => '\n\n## ' + x.name + '\n' + x.text).join('') + '\n</personnages>'
      : '') +
    loreTag((ctx.lore || []).filter(e => e.always || all).sort((x, y) => y.pr - x.pr)) +
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
  // Tous les souvenirs gardés (MEM_MAX au plus, memory.js) : ils sont en cache avec le reste de la mémoire.
  const mm = s.mem.memories || [];
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
  sys += castBlock() + permBlock();
  sys += protocol({
    stat: statOn(s),
    fields: statFields(s).replace(/\s*\n+\s*/g, ', '),
    choices: !s.noChoices,
    prompt: s.choicePrompt?.trim(),
    images: (ctx.images || []).length > 0,
    rules: rulesOf(s)
  });
  if (av.trim()) sys += '\n\n# Avatar du joueur\n' + av;
  // Blocs du système : partie fixe et mémoire, chacun avec son marqueur de cache (avec celui de l'historique,
  // trois en tout) : une mise à jour de la mémoire ne réécrit pas la partie fixe.
  const blocks = [
    { text: U(sys + chBlock(s)), cache: true },
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

  let add = loreFor(s.messages.slice(-2));
  const act = charsFor(s.messages.slice(-6));
  if (act.length) {
    add +=
      '\n\n<personnages>' +
      act.map(x => '\n\n## ' + x.name + '\n' + x.text + relOf(s.mem, x.name)).join('') +
      '\n</personnages>';
  }
  // Passages anciens : en queue, comme le lorebook déclenché, pour ne rien invalider du cache.
  // On ne fouille que ce qui n'est plus envoyé tel quel : déjà résumé.
  add += recallTag(
    recall(s.messages, start, textOf(s.messages.slice(-2))),
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
