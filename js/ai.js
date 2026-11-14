import { HAIKU_LONG, LONG, base } from './cost.js';
import { estTok } from './prompt.js';
import { modelOf } from './protocol.js';
import { choiceMark, lastEtat } from './format.js';
import { dayOf } from './modes.js';
import { CH_MAX, CH_MIN, CH_SUM, SUM_KEEP, chStart, clip, mergeMem, mergeRel, summaryOf, unnum } from './memory.js';
import { record } from './stats.js';
import { API, S, app, ctx } from './state.js';
import { emit } from './bus.js';
import { addCall, getOne, put } from './store.js';
import { $, bare, err, LS } from './util.js';

// La mémoire garde SUM_KEEP messages mot pour mot. Chaque mise à jour réécrit tout
// le cache : en jeu, elle n'a lieu qu'au-delà de SUM_PLAY messages en attente ; en début de séance, quand le
// cache a expiré et sera réécrit de toute façon, elle part dès SUM_START (sessionSum, send.js), avant le premier
// envoi, qui écrit alors directement le prompt raccourci.
export const SUM_PLAY = 120;
export const SUM_START = 50;
export const sumGate = (u, go, hi = SUM_PLAY) => u >= hi || (go && u > SUM_KEEP);
// Messages par appel de résumé : deux paquets de 20 plutôt que quatre de 10, moitié moins d'appels, et le
// résumé, les relations et les souvenirs ne repartent que deux fois. Pas plus de 20 : le modèle doit rendre
// une ligne par message, et un compte faux fait perdre le lien des lignes à leur message.
export const SUM_BATCH = 20;
// Lot le plus petit : en dessous, il réécrirait tout le résumé pour presque rien ; les messages attendent le suivant.
const SUM_MIN = 10;
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
// Relais en cas de refus (beta) : la requête refusée est rejouée côté serveur sur le modèle de secours
// qu'Anthropic choisit selon le motif du refus. Avec Sonnet 5.5, seuls les refus « cyber » et « frontier_llm »
// sont relayés ; les autres (« general_harms », etc.) reviennent comme refus.
export const FB_BETA = 'server-side-fallback-2026-07-01';
export const fallbackOk = model => ['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5'].includes(base(model));
// En-tête bêta d'une requête Claude (le relais en cas de refus).
export const antBetas = b => (b.fallbacks ? FB_BETA : '');
// schema : réponse en JSON conforme à ce schéma (sorties structurées), garantie par l'API.
// Plafond d'une réponse, réflexion comprise : une sécurité, pas une longueur (une réponse coupée se perd).
const MAX_TOK = 8192;
export const toAnt = (ms, { model, max, stream, ttl, effort, fallback, schema }) => {
  const cc = { type: 'ephemeral', ...(ttl ? { ttl: '1h' } : {}) },
    sys = [],
    out = [];
  for (const m of ms)
    if (m.role == 'system')
      // blocks : découpage du système (buildInfo, prompt.js), chaque bloc avec ou sans marqueur de cache.
      for (const x of m.blocks || [{ text: m.content, cache: true }])
        if (x.text.trim()) sys.push({ type: 'text', text: x.text, ...(x.cache ? { cache_control: cc } : {}) });
  for (const m of ms) {
    if (m.role == 'system') continue;
    const l = out.at(-1);
    if (l?.role == m.role) l.content += '\n\n' + m.content;
    else out.push({ role: m.role, content: m.content });
  }
  if (out[0]?.role == 'assistant') out.unshift({ role: 'user', content: '(Suite de l’histoire.)' });
  // Marqueur de cache sur le dernier message avant le tour en cours.
  const b = out.at(-2);
  if (b?.content.trim()) b.content = [{ type: 'text', text: b.content, cache_control: cc }];
  const oc = {
      ...(EFFORTS.includes(effort) && effortOk(model) ? { effort } : {}),
      ...(schema ? { format: { type: 'json_schema', schema } } : {})
    };
  return {
    model,
    max_tokens: max || MAX_TOK,
    ...(sys.length ? { system: sys } : {}),
    messages: out,
    ...(Object.keys(oc).length ? { output_config: oc } : {}),
    ...(fallback && fallbackOk(model) ? { fallbacks: 'default' } : {}),
    ...(stream ? { stream: true } : {})
  };
};
// Usage d'une réponse, en tokens : entrée (cache compris), sortie, cache lu, cache écrit.
export const usageOf = u =>
  u && {
    in: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
    out: u.output_tokens || 0,
    read: u.cache_read_input_tokens || 0,
    write: u.cache_creation_input_tokens || 0,
    // Part écrite pour une heure, quand l'API la détaille (sinon : d'après le réglage, track).
    ...(u.cache_creation ? { w1: u.cache_creation.ephemeral_1h_input_tokens || 0 } : {})
  };
// Maintien du cache : le cache de Claude expire 5 minutes après le début de la dernière requête qui l'a
// lu ou écrit. Pendant une pause, renvoyer la même requête avec max_tokens: 0 (sans streaming, refusé
// dans ce cas) relit le préfixe au tarif réduit et repousse l'échéance, au lieu de le réécrire à 1,25 fois
// le prix d'entrée au tour suivant. Même effort que la vraie requête : il fait partie du préfixe.
let LAST = null;
export const WARM_AT = 270000;
// Cache tenu pour chaud : hot:<histoire>, début de la dernière requête de narration réussie ou relance, gardé sur
// l'appareil pour survivre à un rechargement de la page. Une requête échouée ne le réchauffe pas.
const heat = (sid, t) => sid && LS.set('hot:' + sid, t);
// Début de séance : le cache a expiré, rien n'a lu ni écrit le prompt de l'histoire depuis sa durée de vie.
export const cold = (s, old) => {
  const t = Math.max(+LS.get('hot:' + s.id) || 0, old?.t || 0, s.messages.findLast(m => m.role == 'assistant')?.t || 0);
  return Date.now() - t > (S.c1h ? 3600e3 : 300e3);
};
export const lastWarmable = () => LAST;
export async function keepWarm() {
  if (!LAST || !S.key) return false;
  // Sans relais (rien à relayer, et hors du préfixe) ni streaming (refusé avec max_tokens: 0).
  // Le dernier message (tour du joueur, avec lorebook, fiches, passages et état joints) est hors du cache, qui
  // s'arrête à l'avant-dernier (toAnt) : un caractère suffit, au lieu de le payer plein tarif à chaque relance.
  const { stream, fallbacks, ...b } = LAST.body,
    ms = b.messages?.at(-1)?.role == 'user' ? [...b.messages.slice(0, -1), { role: 'user', content: '.' }] : b.messages,
    w = { ...b, messages: ms, max_tokens: 0 },
    key = b.model,
    { sid } = LAST,
    t0 = (LAST.at = Date.now());
  try {
    const r = await post(w);
    if (!r.ok) {
      journal('relance', w, { sid, key, err: 'Erreur ' + r.status, ms: Date.now() - t0 });
      return false;
    }
    const u = usageOf((await r.json().catch(() => ({}))).usage);
    journal('relance', w, { sid, key, ...track(u, key), ms: Date.now() - t0 });
    heat(sid, t0);
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
// Erreurs passagères de l'API (surcharge, passerelle) : on retente.
export const BUSY = new Set([500, 502, 503, 504, 529]);
export const TRIES = 3;
// Délai avant l'essai a + 1, en secondes : celui qu'annonce l'API (retry-after), sinon base × 2, 4, 8…, plafonné.
export const backoff = (a, ra, base = 1, max = 60) => Math.min(max, Math.max(1, Math.round(+ra || base * 2 ** (a + 1))));
// Requête à l'API Messages : clé, version, et en-tête bêta du relais s'il est demandé.
const post = (body, signal) => {
  const bt = antBetas(body);
  return fetch(API.u + '/messages', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', ...authH(S.key), ...(bt ? { 'anthropic-beta': bt } : {}) },
    body: JSON.stringify(body)
  });
};
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
  const w1 = Math.min(u.write, u.w1 ?? (S.c1h ? u.write : 0)),
    e = [u.in, u.out, 1, u.est ? 1 : 0, u.read, u.write - w1, w1];
  if (primary) TURN = { key, e };
  record(key, e);
  return { key, e };
};
// Journal des appels (Réglages, Compteurs et journal ; journal.js) : la requête telle qu'envoyée, sans la clé, ce
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
  { max = 0, ac = new AbortController(), od = null, model = '', effort = '', onWait = null, primary = false, timeout = 120000, kind = '', sid = '', schema = null } = {}
) {
  if (!S.key) throw new Error('clé API manquante');
  if (primary) TURN = null;
  const mdl = model || modelOf(null);
  const hold = async (next, why) => {
    for (let w = next(); w > 0 && !ac.signal.aborted; w = next()) {
      onWait?.(w, why);
      await pause(1000, ac.signal);
    }
    onWait?.(0);
    if (ac.signal.aborted) throw new Error('Annulé.');
  };
  let tm;
  const arm = () => {
    clearTimeout(tm);
    tm = setTimeout(() => ac.abort('timeout'), timeout);
  };
  arm();
  const t0 = Date.now();
  // Dernière requête envoyée, pour le journal des appels, même en cas d'échec.
  let body = null;
  // Fin commune des deux lectures (flux ou bloc) : compte l'usage, journalise, puis rend la réponse ou lève
  // l'erreur. Un refus (relais compris) jette le texte déjà reçu, mais ce qui a été facturé est compté.
  const finish = ({ text, stop, sd, served, u, part = false }) => {
    const key = served || mdl,
      out = text.trim();
    // Réponse arrêtée en route : Claude n'a donné que l'usage de message_start (environ 1 jeton de sortie). La
    // sortie est estimée sur le texte reçu, et le compte marqué comme estimé.
    if (part && u && out && u.out < estTok(out)) u = { ...u, out: estTok(out), est: true };
    const x = { sid, key, ...track(u, key, primary), stop: stop || (part ? 'coupée' : ''), ms: Date.now() - t0 };
    // Tour du narrateur d'une histoire à choix : ce qu'il a fait de ses choix, pour les compter dans le journal.
    if (kind == 'tour' && out && !(app.cur?.id == sid && app.cur.noChoices)) x.ch = choiceMark(out);
    if (stop == 'refusal') {
      journal(kind, body, x);
      throw logged(refusal(sd));
    }
    if (!out) {
      journal(kind, body, { ...x, err: 'réponse vide' });
      throw logged(new Error('réponse vide (la réflexion a peut-être tout pris : baissez l’effort dans les réglages de l’histoire)'));
    }
    journal(kind, body, x);
    if (primary) heat(sid, LAST.at);
    return { t: out, cut: stop == 'max_tokens', partial: part };
  };
  const retry = async (secs, why) => {
    let left = secs;
    await hold(() => left--, why);
    arm();
  };
  try {
    for (let a = 0; ; a++) {
      let r;
      body = toAnt(ms, { model: mdl, max, stream: !!od, ttl: S.c1h, effort, fallback: primary, schema });
      // La dernière requête de narration sert de modèle au maintien du cache (keepWarm).
      if (primary) LAST = { body, at: Date.now(), sid };
      try {
        r = await post(body, ac.signal);
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
        return finish({ text: tt, stop: fr, sd, served, u: usageOf(us), part });
      }
      const j = await r.json().catch(() => ({}));
      const er = j.error;
      if (r.status == 429 && a < TRIES) {
        await retry(backoff(a, r.headers.get('retry-after'), 7.5, 90), 'retry');
        continue;
      }
      if (BUSY.has(r.status) && a < TRIES) {
        await retry(backoff(a, r.headers.get('retry-after')), 'busy');
        continue;
      }
      if (!r.ok || er) throw new Error(er?.message || 'Erreur ' + r.status);
      return finish({
        text: (j.content || [])
          .filter(b => b.type == 'text')
          .map(b => b.text)
          .join(''),
        stop: j.stop_reason || '',
        sd: j.stop_details,
        served: j.model,
        u: usageOf(j.usage)
      });
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
      : 'connexion perdue') +
  ' : nouvelle tentative dans ' +
  w +
  ' s…';
const SUMJ =
  "Tu mets à jour la mémoire d'une histoire interactive. Écris en français. Ne mentionne jamais les jets de dés ni leurs chiffres, seulement ce qui s'est passé.\n" +
  "- evenements : les Événements du résumé actuel, condensés, puis ceux des nouveaux messages : toute l'histoire depuis le dernier chapitre clos, sans jamais retirer un tournant (rencontre, pacte, révélation, blessure grave), 850 caractères maximum, sans intertitre ; ni souvenirs, ni relations, ni objectif : ils ont leurs propres champs.\n" +
  '- situation : d’abord les fils en suspens encore ouverts (promesses, dettes, menaces, rendez-vous, objets à retrouver), cinq au plus, chacun avec son échéance en « Jour N » quand le jour en cours est donné, sans ceux qui sont réglés ; puis où en est le joueur, point de départ du prochain tour, en une phrase. 350 caractères maximum, sans intertitre.\n' +
  '- souvenirs : faits durables NOUVEAUX seulement, une phrase chacun, en priorité ce qui pourra revenir plus tard (promesses, dettes, menaces, secrets, objets donnés ou perdus) ; ne répète pas ceux déjà connus. Quand le jour en cours est donné, chaque souvenir commence par « Jour N : » et un rendez-vous s’écrit avec son jour (« Jour 3 à 21h30 ») ; jamais « demain », « ce soir » ou « ce matin » ; pas de chiffre du panneau (santé, niveau) ni de simple péripétie. Liste vide si rien de neuf.\n' +
  "- relations : ce que le personnage est pour le joueur et ce qu'il sait de lui (lien, dette, promesse, secret partagé), une phrase, pas ce qu'il fait en ce moment ; pour les personnages récurrents seulement, jamais les figurants de passage. Reprends EXACTEMENT les noms déjà connus, sans les reformuler ni y ajouter de titre. Quand l'histoire révèle qu'un personnage connu sous un autre nom est un personnage à fiche, écris « Nom de la fiche (ancien nom) ».\n" +
  "- lignes : une entrée par message fourni, dans l'ordre, une phrase courte et factuelle.\n" +
  "- chapitre (seulement quand il est demandé) : clos vaut true si ces messages terminent un arc ou en ouvrent un nouveau (lieu quitté pour de bon, quête achevée ou nouvelle, ellipse) : un arc fini plus tôt dans le chapitre ne se représentera pas. titre (quelques mots) et resume (700 caractères maximum) décrivent alors le chapitre entier ; seule la situation ouvre le chapitre suivant. Sinon clos vaut false, titre et resume vides.";
// Réponse de la mémoire, garantie conforme par l'API (sorties structurées). Le champ chapitre n'existe que si
// le chapitre en cours est assez long pour être clos. Le résumé principal est en deux champs, assemblés par
// summaryOf (memory.js) : à la clôture, l'application ne garde que la situation, sans dépendre du modèle.
const SCHEMA = ch => ({
  type: 'object',
  properties: {
    evenements: { type: 'string' },
    situation: { type: 'string' },
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
    lignes: { type: 'array', items: { type: 'string' } },
    ...(ch && {
      chapitre: {
        type: 'object',
        properties: { clos: { type: 'boolean' }, titre: { type: 'string' }, resume: { type: 'string' } },
        required: ['clos', 'titre', 'resume'],
        additionalProperties: false
      }
    })
  },
  required: ['evenements', 'situation', 'souvenirs', 'relations', 'lignes', ...(ch ? ['chapitre'] : [])],
  additionalProperties: false
});
// RUN : histoires dont la mémoire est en train d'avancer (jauge du bouton Envoyer, annoncée par « mem »).
const SUMS = new Map(),
  RUN = new Set();
export const summing = id => RUN.has(id);
const LINES_MAX = 24;
// Histoire ouverte : on l'enregistre telle quelle, une copie relue en base pourrait dater d'avant la
// réponse que l'envoi est en train d'enregistrer. Pendant un tour, rien : la mémoire est sur le même objet
// et la fin du tour l'enregistrera (Régénérer a retiré la réponse en mémoire seulement, l'enregistrer ici
// la perdrait). Histoire fermée : seulement si la base n'a pas changé depuis (synchronisation). Rend false si
// rien n'a pu être enregistré : la mise à jour s'arrête au lieu de payer des lots perdus. La date de l'histoire ne
// change pas : une mise à jour de la mémoire seule ne doit pas la faire passer pour modifiée ici, ce qui ferait
// d'une version jouée sur un autre appareil une copie « (conflit) » ; la mémoire part avec le tour suivant.
const persist = async s => {
  if (app.cur?.id == s.id) {
    app.cur.mem = s.mem;
    if (!app.busy) await put(app.cur);
    return true;
  }
  const f = await getOne(s.id);
  if (!f || f.updated !== s.updated) return false;
  f.mem = s.mem;
  await put(f);
  s.updated = f.updated;
  return true;
};
const addLines = (s, ln, n) => {
  if (ln.length)
    s.mem.lines = [
      ...(s.mem.lines || []),
      ...ln.map((t, k) => (ln.length == n ? { i: s.mem.upto + k, t: unnum(t) } : { i: -1, u: s.mem.upto + n - 1, t: unnum(t) }))
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
    { summary, memories, chapters } = s.mem;
  return cur =>
    s.mem.upto !== u0 ||
    s.mem.summary !== summary ||
    s.mem.memories !== memories ||
    s.mem.chapters !== chapters ||
    (cur?.id == s.id && cur !== s) ||
    src.some((m, k) => s.messages[u0 + k] !== m || m.content !== c0[k]);
};
// Une seule mise à jour à la fois par histoire ; un second appel rend celle en cours, que l'envoi peut attendre.
// start : début de séance, la mémoire avance dès SUM_START messages en attente.
// Histoire quittée : rien, la mémoire repartira à sa prochaine ouverture (ses personnages à fiche, connus
// seulement histoire ouverte, ne seraient pas protégés). Histoire rouverte pendant une mise à jour (nouvel objet,
// dont l'ancienne abandonnera le résultat) : la nouvelle part après elle.
// Deux échecs de suite (FAIL : nombre, et messages au dernier échec) : plus d'essai à chaque tour, seulement en
// début de séance ou après SUM_BATCH * 2 nouveaux messages, pour que la mémoire ne reste pas figée.
const FAIL = new Map();
export function summarize(s, start = false) {
  if (!s || app.cur !== s) return Promise.resolve();
  const r = SUMS.get(s.id),
    f = FAIL.get(s.id);
  if (r?.s === s) return r.p;
  if (!start && f?.n >= 2 && s.messages.length - f.at < SUM_BATCH * 2) return Promise.resolve();
  const p = Promise.resolve(r?.p)
    .catch(() => {})
    .then(() => sumRun(s, start))
    .finally(() => SUMS.get(s.id)?.p === p && SUMS.delete(s.id));
  SUMS.set(s.id, { s, p });
  return p;
}
async function sumRun(s, start) {
  // État de la mémoire dans la bande #err : seulement si elle est vide ou porte encore notre message, pour ne
  // jamais écrire ni effacer celui d'un tour (échec avec Réessayer, réponse coupée, attente de débit).
  let said = '';
  const mine = () => app.cur === s && !app.busy && [said, ''].includes($('#err').textContent);
  const say = t => mine() && err((said = t));
  // Personnages à fiche, dont les relations ne sont jamais écartées : ceux du scénario ouvert, seulement si
  // c'est bien cette histoire (on a pu en ouvrir une autre pendant la réponse).
  const keep = app.cur === s ? (ctx.chars || []).map(c => c.name) : [];
  try {
    let go = false;
    while ((go = sumGate(s.messages.length - s.mem.upto, go, start ? SUM_START : SUM_PLAY))) {
      if (s.messages.length - s.mem.upto - SUM_KEEP < SUM_MIN) break;
      say('Mise à jour de la mémoire…');
      if (!RUN.has(s.id)) {
        RUN.add(s.id);
        emit('mem');
      }
      // Jamais en dessous de SUM_KEEP messages gardés mot pour mot.
      const n = Math.min(SUM_BATCH, s.messages.length - s.mem.upto - SUM_KEEP),
        parts = s.messages
          .slice(s.mem.upto, s.mem.upto + n)
          .map(m => (m.role == 'user' ? 'Joueur : ' : 'Narrateur : ') + bare(m.content).trim());
      const stale = batchGuard(s, parts.length),
        // Messages du chapitre en cours une fois ce lot résumé : dit au modèle s'il peut, ou doit, le clore.
        k = s.mem.upto + parts.length - chStart(s.mem),
        chs = s.mem.chapters || [],
        // Jour du panneau à la fin du lot : les messages résumés n'ont pas l'état, le modèle ne saurait pas dater.
        day = dayOf(lastEtat(s.messages, s.mem.upto + parts.length));
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
              (keep.length ? '\n\nPersonnages à fiche : ' + keep.join(', ') : '') +
              '\n\nSouvenirs déjà retenus (ne les répète pas) :\n' +
              ((s.mem.memories || []).map(x => '- ' + x).join('\n') || '(aucun)') +
              '\n\nChapitres déjà clos :\n' +
              (chs.map((c, i) => i + 1 + '. ' + c.t).join('\n') || '(aucun)') +
              '\n\nChapitre en cours : ' +
              k +
              ' messages avec ce lot. ' +
              (k < CH_MIN
                ? 'Trop court pour être clos.'
                : k >= CH_MAX
                  ? 'Il est temps de le clore : clos = true.'
                  : 'Clos-le si ces messages terminent un arc ou en ouvrent un nouveau ; une nuit passée ou un changement de jour le clôt toujours.') +
              (day != null ? '\n\nJour en cours à la fin de ces messages : Jour ' + day + '.' : '') +
              '\n\nMessages à intégrer (' +
              parts.length +
              ') :\n' +
              parts.map((x, i) => i + 1 + '. ' + x).join('\n\n')
          }
        ],
        {
          model: memModel(),
          effort: 'low',
          kind: 'mémoire',
          sid: s.id,
          schema: SCHEMA(k >= CH_MIN),
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
        list = a => a.map(x => x.trim()).filter(Boolean);
      const ch = k >= CH_MIN && j.chapitre,
        sum = summaryOf(j.evenements, j.situation, ch?.clos);
      if (!sum) throw new Error('résumé vide');
      // Clos sans résumé, le chapitre perdrait ses Événements, déjà retirés du résumé principal.
      if (ch?.clos && !ch.resume.trim()) throw new Error('chapitre clos sans résumé');
      if (ch?.clos)
        s.mem.chapters = [
          ...chs,
          { t: ch.titre.trim() || 'Chapitre ' + (chs.length + 1), s: clip(ch.resume.trim(), CH_SUM), upto: s.mem.upto + parts.length }
        ];
      s.mem.summary = sum;
      s.mem.memories = mergeMem(s.mem.memories, list(j.souvenirs));
      s.mem.relations = mergeRel(s.mem.relations, Object.fromEntries(j.relations.map(r => [r.nom.trim(), r.relation.trim()])), keep);
      addLines(s, list(j.lignes), parts.length);
      s.mem.upto += parts.length;
      if (!(await persist(s))) break;
      emit('mem');
    }
    if (said && mine()) err('');
    FAIL.delete(s.id);
  } catch (e) {
    const n = (FAIL.get(s.id)?.n || 0) + 1;
    FAIL.set(s.id, { n, at: s.messages.length });
    say('Mémoire non mise à jour (' + e.message + ') : nouvel essai ' + (n < 2 ? 'au prochain tour.' : 'dans quelques tours.'));
  } finally {
    if (RUN.delete(s.id)) emit('mem');
  }
}
