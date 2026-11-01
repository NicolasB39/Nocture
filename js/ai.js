import { HAIKU_LONG, LONG } from './cost.js';
import { estTok } from './prompt.js';
import { modelOf } from './protocol.js';
import { SUM_MAX, clip, mergeMem, mergeRel, splitSummary, unnum } from './memory.js';
import { hit429, note, wait } from './rate.js';
import { record } from './stats.js';
import { API, S, app, ctx } from './state.js';
import { addCall, getOne, save } from './store.js';
import { $, err } from './util.js';

// La mémoire garde SUM_KEEP messages mot pour mot. Chaque mise à jour réécrit tout
// le cache : en jeu, elle n'a lieu qu'au-delà de SUM_PLAY messages en attente ; en début de séance, quand le
// cache a expiré et sera réécrit de toute façon, elle part dès SUM_START (sessionSum, send.js), avant le premier
// envoi, qui écrit alors directement le prompt raccourci.
export const SUM_KEEP = 40;
export const SUM_PLAY = 120;
export const SUM_START = 50;
export const sumGate = (u, go, hi = SUM_PLAY) => u >= hi || (go && u > SUM_KEEP);
// Messages par appel de résumé : deux paquets de 20 plutôt que quatre de 10, moitié moins d'appels, et le
// résumé, les relations et les souvenirs ne repartent que deux fois. Pas plus de 20 : le modèle doit rendre
// une ligne par message, et un compte faux fait perdre le lien des lignes à leur message.
export const SUM_BATCH = 20;
export const authH = k => ({ 'x-api-key': k, 'anthropic-version': ANT_VERSION, 'anthropic-dangerous-direct-browser-access': 'true' });
// Version de l'API Claude. Depuis 2026-10-21, temperature, top_p et top_k sont refusés (erreur 400) sur tous
// les modèles : toAnt ne les envoie jamais.
export const ANT_VERSION = '2026-10-21';
// Résumés de mémoire quand aucun modèle n'est choisi : un résumé ne demande pas le meilleur modèle, et
// Haiku 5.5 coûte une vingtaine de fois moins que Sonnet 5.5.
export const MEM_MODEL = 'claude-haiku-5-5';
export const memModel = () => S.memModel || MEM_MODEL;
export const EFFORTS = ['low', 'medium', 'high'];
// L'effort (output_config.effort) règle la réflexion facturée avant chaque réponse. Accepté par Opus et
// Sonnet 4.6 et suivants, Haiku 5.5, Fable et Mythos (et Opus 4.5) ; Haiku 4.5 et Sonnet 4.5 le refusent.
export const effortOk = model => {
  const m = String(model || '').match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?=-|$)/);
  if (!m) return false;
  const [f, maj, min] = [m[1], +m[2], +m[3] || 0];
  if (f == 'fable' || f == 'mythos') return true;
  if (f == 'haiku') return maj >= 5;
  return maj > 4 || (maj == 4 && min >= (f == 'opus' ? 5 : 6));
};
const base = m => String(m || '').replace(/-\d{8}$/, '');
// Changement d'effort en cours de partie sans réécrire le cache (beta) : un message système vide portant
// output_config.effort, inséré dans l'historique, vaut à partir du tour du joueur qui suit. Changer l'effort
// de premier niveau, lui, réécrit tout le cache des messages.
export const EFF_BETA = 'mid-conversation-output-config-2026-07-01';
export const effortMsgOk = model =>
  ['claude-fable-5-1', 'claude-mythos-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'].includes(
    base(model)
  );
// Relais en cas de refus (beta) : la requête refusée est rejouée côté serveur sur le modèle de secours
// qu'Anthropic choisit selon le motif du refus. Avec Sonnet 5.5, seuls les refus « cyber » et « frontier_llm »
// sont relayés ; les autres (« general_harms », etc.) reviennent comme refus.
export const FB_BETA = 'server-side-fallback-2026-07-01';
export const fallbackOk = model => ['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'].includes(base(model));
// En-tête des fonctions bêta qu'utilise une requête Claude.
export const antBetas = b =>
  [b.fallbacks && FB_BETA, b.messages?.some(m => m.output_config) && EFF_BETA].filter(Boolean).join(',');
// effBefore (posé par buildInfo sur un message) : l'effort change juste avant ce message ; effBase : l'effort
// en vigueur au premier message envoyé. Sans prise en charge par le modèle, l'effort actuel part en premier
// niveau, comme avant.
// schema : réponse en JSON conforme à ce schéma (sorties structurées), garantie par l'API.
export const toAnt = (ms, { model, max, stream, ttl, effort, effBase, fallback, schema }) => {
  const cc = { type: 'ephemeral', ...(ttl ? { ttl: '1h' } : {}) },
    sys = [],
    out = [],
    marks = effortOk(model) && effortMsgOk(model) && ms.some(m => EFFORTS.includes(m.effBefore));
  for (const m of ms)
    if (m.role == 'system') {
      const k = m.cut ?? m.content.length;
      for (const t of [m.content.slice(0, k), m.content.slice(k)])
        if (t.trim()) sys.push({ type: 'text', text: t, cache_control: cc });
    }
  sys.slice(0, -3).forEach(b => delete b.cache_control);
  for (const m of ms) {
    if (m.role == 'system') continue;
    if (marks && EFFORTS.includes(m.effBefore))
      out.push({ role: 'system', content: [], output_config: { effort: m.effBefore } });
    const l = out.at(-1);
    if (l?.role == m.role) l.content += '\n\n' + m.content;
    else out.push({ role: m.role, content: m.content });
  }
  if (out[0]?.role == 'assistant') out.unshift({ role: 'user', content: '(Suite de l’histoire.)' });
  // Marqueur de cache sur le dernier message avant le tour en cours (un message d'effort n'en porte pas).
  const b = out.slice(0, -1).findLast(x => x.role != 'system');
  if (b?.content.trim()) b.content = [{ type: 'text', text: b.content, cache_control: cc }];
  const top = marks && EFFORTS.includes(effBase) ? effBase : effort,
    oc = {
      ...(EFFORTS.includes(top) && effortOk(model) ? { effort: top } : {}),
      ...(schema ? { format: { type: 'json_schema', schema } } : {})
    };
  return {
    model,
    max_tokens: max || 4096,
    ...(sys.length ? { system: sys } : {}),
    messages: out,
    ...(Object.keys(oc).length ? { output_config: oc } : {}),
    // Pas de relais avec un changement d'effort : le modèle de secours pourrait ne pas le prendre en charge.
    ...(fallback && !marks && fallbackOk(model) ? { fallbacks: 'default' } : {}),
    ...(stream ? { stream: true } : {})
  };
};
// Usage d'une réponse, en tokens : entrée (cache compris), sortie, cache lu, cache écrit.
export const usageOf = u =>
  u && {
    in: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
    out: u.output_tokens || 0,
    read: u.cache_read_input_tokens || 0,
    write: u.cache_creation_input_tokens || 0
  };
// Maintien du cache : le cache de Claude expire 5 minutes après le début de la dernière requête qui l'a
// lu ou écrit. Pendant une pause, renvoyer la même requête avec max_tokens: 0 (sans streaming, refusé
// dans ce cas) relit le préfixe au tarif réduit et repousse l'échéance, au lieu de le réécrire à 1,25 fois
// le prix d'entrée au tour suivant. Même effort que la vraie requête : il fait partie du préfixe.
let LAST = null;
export const WARM_AT = 270000;
export const lastWarmable = () => LAST;
export async function keepWarm() {
  if (!LAST || !S.key) return false;
  // Sans relais (rien à relayer, et hors du préfixe) ; un changement d'effort, lui, fait partie du préfixe.
  const { stream, fallbacks, ...b } = LAST.body,
    bt = antBetas(b),
    w = { ...b, max_tokens: 0 },
    key = b.model,
    { sid } = LAST,
    t0 = (LAST.at = Date.now());
  try {
    const r = await fetch(API.u + '/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authH(S.key), ...(bt ? { 'anthropic-beta': bt } : {}) },
      body: JSON.stringify(w)
    });
    if (!r.ok) {
      journal('relance', w, { sid, key, err: 'Erreur ' + r.status, ms: Date.now() - t0 });
      return false;
    }
    const u = usageOf((await r.json().catch(() => ({}))).usage);
    note(r.headers, u, b.model, false);
    journal('relance', w, { sid, key, ...track(u, key), ms: Date.now() - t0 });
    return true;
  } catch (e) {
    journal('relance', w, { sid, key, err: e.message, ms: Date.now() - t0 });
    return false;
  }
}
// Refus de Claude (stop_reason « refusal », réponse 200). Erreur marquée refusal : l'envoi propose une
// indication plutôt que de renvoyer la même requête, qui serait refusée de même.
const WHY = {
  cyber: 'cybersécurité',
  bio: 'biologie',
  general_harms: 'contenu sensible',
  frontier_llm: 'développement d’IA',
  reasoning_extraction: 'raisonnement interne'
};
export const refusal = sd => {
  const c = sd?.category,
    e = new Error('Claude a refusé d’écrire cette réponse' + (c ? ' (motif : ' + (WHY[c] || c) + ')' : ''));
  e.refusal = true;
  return e;
};
// Erreurs passagères de l'API (surcharge, passerelle) : on retente, sans toucher à la jauge de débit.
export const BUSY = new Set([500, 502, 503, 504, 529]);
export const TRIES = 3;
export const backoff = (a, ra) => Math.min(60, Math.max(1, Math.round(+ra || 2 ** (a + 1))));
const pause = (ms, sig) =>
  new Promise(r => {
    const t = setTimeout(r, ms);
    sig?.addEventListener('abort', () => {
      clearTimeout(t);
      r();
    }, { once: true });
  });
// Dernier tour de narration, au format des statistiques, pour afficher son coût sous la conversation.
let TURN = null;
export const lastTurn = () => TURN;
// Compte l'usage u (usageOf) dans les statistiques, sous la clé du modèle ; rend la clé et l'entrée comptée.
const track = (u, key, primary) => {
  if (!u || !(u.in || u.out)) return;
  // Haiku 5.5 coûte plus cher au-delà de 100 000 tokens de prompt : ces requêtes ont leur propre ligne.
  if (base(key) == 'claude-haiku-5-5' && u.in > HAIKU_LONG) key = base(key) + LONG;
  const e = [u.in, u.out, 1, u.est ? 1 : 0, u.read, ...(S.c1h ? [0, u.write] : [u.write, 0])];
  if (primary) TURN = { key, e };
  record(key, e);
  return { key, e };
};
// Journal des appels (Réglages, Compteurs et débit ; journal.js) : la requête telle qu'envoyée, sans la clé, ce
// qu'elle a coûté (key et e, au format des statistiques, rendus par track) et comment elle s'est terminée.
// sid : l'histoire de l'appel. Rien si la case est décochée.
const journal = (kind, body, x) => {
  if (!S.journal) return;
  try {
    addCall({ t: Date.now(), kind, body, ...x }).catch(() => {});
  } catch (e) {}
};
// Erreur déjà journalisée avec ce qu'elle a coûté : le catch de chat() ne l'ajoute pas une seconde fois.
const logged = e => Object.assign(e, { logged: true });
export async function chat(
  ms,
  { max = 0, ac = new AbortController(), od = null, model = '', effort = '', effBase = '', onWait = null, primary = false, timeout = 120000, kind = '', sid = '', schema = null } = {}
) {
  if (!S.key) throw new Error('clé API manquante');
  if (primary) TURN = null;
  const mdl = model || modelOf(null);
  const est = ms.slice(-2).reduce((a, m) => a + estTok(m.content), 0) + (max || 500);
  const hold = async (next, why) => {
    for (let w = next(); w > 0 && !ac.signal.aborted; w = next()) {
      onWait?.(w, why);
      await pause(1000, ac.signal);
    }
    onWait?.(0);
    if (ac.signal.aborted) throw new Error('Annulé.');
  };
  await hold(() => wait(est, mdl), 'pace');
  let tm;
  const arm = () => {
    clearTimeout(tm);
    tm = setTimeout(() => ac.abort('timeout'), timeout);
  };
  arm();
  const t0 = Date.now();
  // Dernière requête envoyée, pour le journal des appels, même en cas d'échec.
  let body = null;
  const retry = async (secs, why) => {
    let left = secs;
    await hold(() => left--, why);
    arm();
  };
  try {
    for (let a = 0; ; a++) {
      let r;
      body = toAnt(ms, { model: mdl, max, stream: !!od, ttl: S.c1h, effort, effBase, fallback: primary, schema });
      // La dernière requête de narration sert de modèle au maintien du cache (keepWarm).
      if (primary) LAST = { body, at: Date.now(), sid };
      const bt = antBetas(body);
      try {
        r = await fetch(API.u + '/messages', {
          method: 'POST',
          signal: ac.signal,
          headers: { 'Content-Type': 'application/json', ...authH(S.key), ...(bt ? { 'anthropic-beta': bt } : {}) },
          body: JSON.stringify(body)
        });
      } catch (e) {
        // Coupure réseau avant toute réponse : rien n'a été facturé, on peut retenter.
        if (ac.signal.aborted || !(e instanceof TypeError) || a >= TRIES) throw e;
        await retry(backoff(a), 'net');
        continue;
      }
      if (r.ok && od && r.body && (r.headers.get('content-type') || '').includes('event-stream')) {
        const rd = r.body.getReader(),
          dc = new TextDecoder();
        let buf = '',
          tt = '',
          fr = '',
          fin = false,
          part = false,
          n = 0,
          us = null,
          ex = '',
          et = '',
          // Modèle qui a vraiment répondu (relais en cas de refus) et détail d'un refus.
          served = '',
          sd = null;
        const feed = l => {
          if (!l.startsWith('data:')) return;
          try {
            const o = JSON.parse(l.slice(5).trim()),
              dl = o.delta;
            if (o.type == 'message_start') {
              us = { ...o.message?.usage };
              served = o.message?.model || served;
            } else if (o.type == 'content_block_delta' && dl?.type == 'text_delta') {
              tt += dl.text;
              n++;
              od(tt);
            } else if (o.type == 'content_block_delta' && dl?.type == 'thinking_delta') od(tt, true);
            else if (o.type == 'message_delta') {
              if (dl?.stop_reason) fr = dl.stop_reason;
              sd = dl?.stop_details || o.stop_details || sd;
              us = { ...us, ...o.usage };
            } else if (o.type == 'message_stop') fin = true;
            else if (o.type == 'error') {
              ex = o.error?.message || 'erreur de Claude';
              et = o.error?.type || '';
              fin = true;
            }
          } catch (e) {}
        };
        try {
          while (!fin) {
            const { done, value } = await rd.read();
            if (done) break;
            arm();
            buf += dc.decode(value, { stream: true });
            const ls = buf.split('\n');
            buf = ls.pop();
            for (const l of ls) feed(l);
          }
          if (!fin && buf) feed(buf);
          rd.cancel().catch(() => {});
          if (ex && !tt) {
            // Surcharge annoncée dans le flux avant tout texte (Claude répond 200 puis envoie l'erreur) :
            // rien n'a été écrit, on retente comme pour un 529.
            if (/^(overloaded|api)_error$/.test(et) && a < TRIES) {
              await retry(backoff(a), 'busy');
              continue;
            }
            throw new Error(ex);
          }
          // Flux fermé sans fin annoncée (ni message_stop, ni raison d'arrêt) : réponse incomplète.
          if (ex || (!fin && !fr)) part = true;
        } catch (e) {
          // Coupure après du texte (réseau, délai, Arrêter) : le texte reçu est gardé.
          if (!tt) throw e;
          part = true;
        }
        const key = served || mdl;
        us = usageOf(us);
        // Refus (relais compris) : le texte déjà reçu est jeté, il n'est pas une réponse complète. Ce qui a été
        // facturé est compté quand même.
        if (fr == 'refusal') {
          note(r.headers, us, mdl, primary);
          journal(kind, body, { sid, key, ...track(us, key, primary), stop: fr, ms: Date.now() - t0 });
          throw logged(refusal(sd));
        }
        const out = tt.trim();
        if (!out) {
          note(r.headers, us, mdl, primary);
          journal(kind, body, { sid, key, ...track(us, key, primary), err: 'réponse vide', stop: fr, ms: Date.now() - t0 });
          throw logged(new Error('réponse vide (modèle de raisonnement ? augmentez la longueur maximale)'));
        }
        // Réponse arrêtée en route : Claude n'a donné que l'usage de message_start (environ 1 jeton de
        // sortie). La sortie est estimée sur le texte reçu, et le compte marqué comme estimé.
        if (part && us && us.out < estTok(out)) us = { ...us, out: estTok(out), est: true };
        note(r.headers, us, mdl, primary);
        journal(kind, body, { sid, key, ...track(us, key, primary), stop: fr || (part ? 'coupée' : ''), ms: Date.now() - t0 });
        return {
          t: out,
          cut: fr == 'max_tokens',
          mode: 'stream',
          chunks: n,
          ms: Date.now() - t0,
          partial: part,
          pt: us?.in || 0
        };
      }
      const j = await r.json().catch(() => ({}));
      const er = j.error;
      if (r.status == 429 && a < TRIES) {
        // La réponse 429 porte aussi les en-têtes de débit : la jauge existe même au premier envoi.
        note(r.headers, null, mdl, false);
        const secs = Math.min(90, Math.max(3, Math.round(+r.headers.get('retry-after') || (a + 1) * 15)));
        hit429(mdl, secs * 1000);
        await retry(secs, 'retry');
        continue;
      }
      if (BUSY.has(r.status) && a < TRIES) {
        await retry(backoff(a, r.headers.get('retry-after')), 'busy');
        continue;
      }
      if (!r.ok || er) throw new Error(er?.message || 'Erreur ' + r.status);
      const u = usageOf(j.usage);
      note(r.headers, u, mdl, primary);
      const out = (j.content || [])
        .filter(b => b.type == 'text')
        .map(b => b.text)
        .join('')
        .trim();
      const key = j.model || mdl,
        x = { sid, key, ...track(u, key, primary), stop: j.stop_reason || '', ms: Date.now() - t0 };
      if (j.stop_reason == 'refusal') {
        journal(kind, body, x);
        throw logged(refusal(j.stop_details));
      }
      journal(kind, body, out ? x : { ...x, err: 'réponse vide' });
      if (!out) throw logged(new Error('réponse vide (modèle de raisonnement ? augmentez la longueur maximale)'));
      return {
        t: out,
        cut: j.stop_reason == 'max_tokens',
        mode: 'block',
        chunks: 1,
        ms: Date.now() - t0,
        pt: u?.in || 0
      };
    }
  } catch (e) {
    // Échec sans réponse comptée (erreur de l'API, réseau, arrêt) ; un refus ou une réponse vide l'est déjà.
    if (body && !e.logged)
      journal(kind, body, { sid, key: mdl, err: ac.signal.aborted ? String(ac.signal.reason || 'arrêt') : e.message, ms: Date.now() - t0 });
    if (ac.signal.aborted)
      throw new Error(
        ac.signal.reason == 'timeout'
          ? 'Délai dépassé (' + Math.round(timeout / 1000) + ' s sans réponse de Claude).'
          : 'Annulé.'
      );
    throw e;
  } finally {
    clearTimeout(tm);
  }
}
// Texte d'attente affiché pendant une pause de chat() : `why` dit qui fait attendre.
export const waitMsg = (w, why) =>
  (why == 'retry'
    ? 'Claude a refusé l’envoi (limite de débit)'
    : why == 'busy'
      ? 'Claude est surchargé ou en panne'
      : why == 'net'
        ? 'connexion perdue'
        : 'pause pour respecter la limite de débit de Claude') +
  (why == 'pace' ? ' : envoi dans ' : ' : nouvelle tentative dans ') +
  w +
  ' s…';
const SUMJ =
  "Tu mets à jour la mémoire d'une histoire interactive. Écris en français.\n" +
  "- resume : récit condensé et mis à jour de toute l'histoire, 1200 caractères maximum, en deux parties (Événements, Situation actuelle) ; ni souvenirs, ni relations, ni objectif : ils ont leurs propres champs.\n" +
  '- souvenirs : faits durables NOUVEAUX seulement, une phrase chacun ; ne répète pas ceux déjà connus. Liste vide si rien de neuf.\n' +
  "- relations : état de la relation avec le joueur, une phrase, pour les personnages récurrents seulement, jamais les figurants de passage. Reprends EXACTEMENT les noms déjà connus, sans les reformuler ni y ajouter de titre.\n" +
  "- lignes : une entrée par message fourni, dans l'ordre, une phrase courte et factuelle.";
// Réponse de la mémoire, garantie conforme par l'API (sorties structurées).
const SCHEMA = {
  type: 'object',
  properties: {
    resume: { type: 'string' },
    souvenirs: { type: 'array', items: { type: 'string' } },
    relations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { nom: { type: 'string' }, relation: { type: 'string' } },
        required: ['nom', 'relation'],
        additionalProperties: false
      }
    },
    lignes: { type: 'array', items: { type: 'string' } }
  },
  required: ['resume', 'souvenirs', 'relations', 'lignes'],
  additionalProperties: false
};
const SUMS = new Map();
const LINES_MAX = 24;
const known = () => (ctx.chars || []).map(c => c.name);
const absorb = (s, x) => {
  if (x.souvenirs.length) s.mem.memories = mergeMem(s.mem.memories, x.souvenirs);
  if (Object.keys(x.relations).length)
    s.mem.relations = mergeRel(s.mem.relations, x.relations, known());
};
// Histoire ouverte : on l'enregistre telle quelle, une copie relue en base pourrait dater d'avant la
// réponse que l'envoi est en train d'enregistrer. Pendant un tour, rien : la mémoire est sur le même objet
// et la fin du tour l'enregistrera (Régénérer a retiré la réponse en mémoire seulement, l'enregistrer ici
// la perdrait). Histoire fermée : seulement si la base n'a pas changé depuis (synchronisation).
const persist = async s => {
  if (app.cur?.id == s.id) {
    app.cur.mem = s.mem;
    if (!app.busy) await save(app.cur);
    return;
  }
  const f = await getOne(s.id);
  if (f && f.updated === s.updated) {
    f.mem = s.mem;
    await save(f);
    s.updated = f.updated;
  }
};
const addLines = (s, ln, n) => {
  if (ln.length)
    s.mem.lines = [
      ...(s.mem.lines || []),
      ...ln.map((t, k) => ({ i: ln.length == n ? s.mem.upto + k : -1, t: unnum(t) }))
    ].slice(-LINES_MAX);
};
// Instantané d'un lot de n messages à résumer. Pendant l'appel, le joueur peut supprimer ou modifier un
// message du lot, corriger la mémoire à la main, ou l'histoire être rechargée depuis un autre appareil
// (cur : l'histoire ouverte) : la fonction rendue dit alors que le résultat ne vaut plus, il est abandonné
// (nouvel essai au prochain tour).
export const batchGuard = (s, n) => {
  const u0 = s.mem.upto,
    src = s.messages.slice(u0, u0 + n),
    c0 = src.map(m => m.content),
    { summary, memories } = s.mem;
  return cur =>
    s.mem.upto !== u0 ||
    s.mem.summary !== summary ||
    s.mem.memories !== memories ||
    (cur?.id == s.id && cur !== s) ||
    src.some((m, k) => s.messages[u0 + k] !== m || m.content !== c0[k]);
};
// Une seule mise à jour à la fois par histoire ; un second appel rend celle en cours, que l'envoi peut attendre.
// start : début de séance, la mémoire avance dès SUM_START messages en attente.
export function summarize(s, start = false) {
  if (!s) return Promise.resolve();
  if (!SUMS.has(s.id)) SUMS.set(s.id, sumRun(s, start).finally(() => SUMS.delete(s.id)));
  return SUMS.get(s.id);
}
async function sumRun(s, start) {
  // État de la mémoire dans la bande #err : seulement si elle est vide ou porte encore notre message, pour ne
  // jamais écrire ni effacer celui d'un tour (échec avec Réessayer, réponse coupée, attente de débit).
  let said = '';
  const mine = () => app.cur === s && !app.busy && [said, ''].includes($('#err').textContent);
  const say = t => mine() && err((said = t));
  try {
    let go = false;
    while ((go = sumGate(s.messages.length - s.mem.upto, go, start ? SUM_START : SUM_PLAY))) {
      say('Mise à jour de la mémoire…');
      const pr = splitSummary(s.mem.summary);
      if (pr.summary && pr.summary !== (s.mem.summary || '').trim()) {
        absorb(s, pr);
        s.mem.summary = pr.summary;
      }
      // Jamais en dessous de SUM_KEEP messages gardés mot pour mot.
      const n = Math.min(SUM_BATCH, s.messages.length - s.mem.upto - SUM_KEEP),
        parts = s.messages
          .slice(s.mem.upto, s.mem.upto + n)
          .map(m => (m.role == 'user' ? 'Joueur : ' : 'Narrateur : ') + m.content.replace(/\{\{img::[^}]*\}\}/g, '').trim());
      const stale = batchGuard(s, parts.length);
      const { t, cut } = await chat(
        [
          { role: 'system', content: SUMJ },
          {
            role: 'user',
            content:
              'Résumé actuel :\n' +
              (s.mem.summary || '(vide)') +
              '\n\nRelations connues (reprends ces noms tels quels) :\n' +
              (Object.entries(s.mem.relations || {})
                .map(([k, v]) => '- ' + k + ' : ' + v)
                .join('\n') || '(aucune)') +
              '\n\nSouvenirs déjà retenus (ne les répète pas) :\n' +
              ((s.mem.memories || []).slice(-20).map(x => '- ' + x).join('\n') || '(aucun)') +
              '\n\nMessages à intégrer (' +
              parts.length +
              ') :\n' +
              parts.map((x, i) => i + 1 + '. ' + x).join('\n\n')
          }
        ],
        {
          model: memModel(),
          // Vingt messages et la réflexion du modèle : plus que les 4 096 tokens par défaut.
          max: 8192,
          effort: 'low',
          kind: 'mémoire',
          sid: s.id,
          schema: SCHEMA,
          timeout: 300000,
          onWait: (w, why) => {
            if (said) say(w ? 'Mémoire : ' + waitMsg(w, why) : 'Mise à jour de la mémoire…');
          }
        }
      );
      if (stale(app.cur)) break;
      // Coupée, la réponse n'est pas du JSON complet ; vide, le résumé effacerait celui de l'histoire.
      if (cut) throw new Error('réponse coupée par la longueur maximale');
      const j = JSON.parse(t),
        list = a => a.map(x => x.trim()).filter(Boolean),
        x = splitSummary(j.resume);
      if (!j.resume.trim()) throw new Error('résumé vide');
      s.mem.summary = clip(x.summary || j.resume.trim(), SUM_MAX);
      absorb(s, x);
      s.mem.memories = mergeMem(s.mem.memories, list(j.souvenirs));
      s.mem.relations = mergeRel(s.mem.relations, Object.fromEntries(j.relations.map(r => [r.nom.trim(), r.relation.trim()])), known());
      addLines(s, list(j.lignes), parts.length);
      s.mem.upto += parts.length;
      await persist(s);
    }
    if (said && mine()) err('');
  } catch (e) {
    say('Mémoire non mise à jour (' + e.message + ') : nouvel essai au prochain tour.');
  }
}
