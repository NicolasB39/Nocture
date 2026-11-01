import { S } from './state.js';

const W = 60000;
let use = [];
const RL = {};
export const last = { cached: 0, total: 0, wrote: 0 };

const local = m => {
  const t = Date.now() - W;
  use = use.filter(x => x[0] > t);
  return use.reduce((a, x) => a + (x[2] === m ? x[1] : 0), 0);
};
export const spend = (n, m) => n > 0 && use.push([Date.now(), n, m]);
export const reset = () => {
  use = [];
  for (const k in RL) delete RL[k];
  Object.assign(last, { cached: 0, total: 0, wrote: 0 });
};

export function note(h, u, m, primary) {
  const tot = u?.total_tokens || (u?.prompt_tokens || 0) + (u?.completion_tokens || 0);
  if (tot) spend(u?.rl ?? tot, m);
  if (primary) {
    last.total = tot || 0;
    last.cached = u?.prompt_tokens_details?.cached_tokens ?? 0;
    last.wrote = u?.cache_write ?? 0;
  }
  const g = k => h?.get?.(k) ?? null,
    lim = +g('anthropic-ratelimit-input-tokens-limit') || 0,
    rem = g('anthropic-ratelimit-input-tokens-remaining');
  if (lim && rem != null && rem !== '') {
    RL[m] = {
      lim,
      rem: +rem,
      at: Date.now(),
      req: +g('anthropic-ratelimit-requests-remaining') || 0
    };
    (S.tpms ??= {})[m] = lim;
  } else if (RL[m]?.x) delete RL[m];
}
export const hit429 = (m, ms) => {
  RL[m] = {
    lim: RL[m]?.lim || S.tpms?.[m] || S.tpm || 0,
    rem: 0,
    at: Date.now() + (ms || 0),
    req: 0,
    x: true
  };
};

const aged = (m, since, now) =>
  use.reduce(
    (a, x) => a + (x[2] === m && x[0] <= now - W && x[0] > since - W ? x[1] : 0),
    0
  );
export function status(m) {
  const r = RL[m],
    now = Date.now();
  if (r?.lim && now - r.at < 150000) {
    const api = Math.min(r.lim, r.rem + aged(m, r.at, now)),
      loc = r.lim - local(m);
    return { lim: r.lim, rem: Math.max(0, Math.round(Math.min(api, loc))), src: 'api', req: r.req };
  }
  const lim = S.tpms?.[m] || S.tpm || 0;
  return lim ? { lim, rem: Math.max(0, lim - local(m)), src: 'local', req: 0 } : null;
}

export function wait(est, m) {
  const s = status(m);
  if (!s || !est || est > s.lim || est <= s.rem) return 0;
  if (s.src == 'api') return Math.ceil(((est - s.rem) / s.lim) * 60);
  const now = Date.now();
  let acc = s.rem;
  for (const [t, n, k] of use.filter(x => x[2] === m).sort((a, b) => a[0] - b[0])) {
    acc += n;
    if (acc >= est) return Math.max(1, Math.ceil((t + W - now) / 1000));
  }
  return 60;
}
