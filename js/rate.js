// Limite de débit de Claude (tokens d'entrée par minute), lue dans les en-têtes de chaque réponse : jauge sous
// la conversation, et pause avant un envoi qui ne tiendrait pas dans ce qui reste de la minute.
const W = 60000;
// [heure, tokens comptés par la limite, modèle], sur les quatre dernières minutes : ce qui sort de la minute
// recrédite la jauge.
let use = [];
const RL = {};

export const reset = () => {
  use = [];
  for (const k in RL) delete RL[k];
};

// u : usage de la réponse (usageOf, ai.js). La limite compte l'entrée sauf le cache lu.
export function note(h, u, m) {
  const t = Date.now();
  use = use.filter(x => x[0] > t - 4 * W);
  if (u && u.in > u.read) use.push([t, u.in - u.read, m]);
  const g = k => h?.get?.(k) ?? null,
    lim = +g('anthropic-ratelimit-input-tokens-limit') || 0,
    rem = g('anthropic-ratelimit-input-tokens-remaining');
  if (lim && rem != null && rem !== '')
    RL[m] = { lim, rem: +rem, at: t, req: +g('anthropic-ratelimit-requests-remaining') || 0 };
  else delete RL[m];
}
// Refus 429 : la jauge est à zéro jusqu'à la fin de l'attente.
export const hit429 = (m, ms) => {
  if (RL[m]) RL[m] = { ...RL[m], rem: 0, at: Date.now() + (ms || 0), req: 0 };
};

const aged = (m, since, now) =>
  use.reduce((a, x) => a + (x[2] === m && x[0] <= now - W && x[0] > since - W ? x[1] : 0), 0);
// Tokens restants sur la minute pour le modèle m, d'après le dernier en-tête (2 min 30 au plus) : seuls
// reviennent les tokens de vos requêtes sortis de la fenêtre depuis.
export function status(m) {
  const r = RL[m],
    now = Date.now();
  if (!r?.lim || now - r.at >= 150000) return null;
  return { lim: r.lim, rem: Math.max(0, Math.round(Math.min(r.lim, r.rem + aged(m, r.at, now)))), req: r.req };
}

export function wait(est, m) {
  const s = status(m);
  if (!s || !est || est > s.lim || est <= s.rem) return 0;
  return Math.ceil(((est - s.rem) / s.lim) * 60);
}
