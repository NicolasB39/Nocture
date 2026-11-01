// Statistiques d'usage : d[jour][modèle] = [entrée, sortie, requêtes, requêtes estimées, cache lu, cache écrit
// 5 min, cache écrit 1 h] (cache compris dans l'entrée).
export const STATS = { v: 1, d: {} };
export const SESSION = {};

let hook = null;
export const watch = fn => (hook = fn);

const two = n => String(n).padStart(2, '0');
export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
};
export const monthKey = k => k.slice(0, 7);

const add = (o, e) => {
  for (let i = 0; i < e.length; i++) o[i] = (o[i] || 0) + (e[i] || 0);
};
// e : une requête, au format ci-dessus (requêtes = 1).
export const record = (key, e, t = Date.now()) => {
  if (!key || !(e[0] > 0 || e[1] > 0)) return;
  add(((STATS.d[dayKey(t)] ??= {})[key] ??= []), e);
  add((SESSION[key] ??= []), e);
  hook?.();
};

export const load = v => {
  if (v && typeof v.d == 'object' && v.d) STATS.d = v.d;
};
// d + k × by, case par case (jour, modèle, compteur), sans toucher d : fusionne ce qu'une fenêtre a compté
// depuis sa dernière lecture avec ce qu'une autre a enregistré entre-temps (main.js). Les cases revenues
// à zéro (statistiques effacées) disparaissent, au lieu de rester comme modèles à 0 requête.
export const shift = (d, by, k = 1) => {
  const o = structuredClone(d);
  for (const day in by) {
    for (const key in by[day]) {
      const e = ((o[day] ??= {})[key] ??= []);
      by[day][key].forEach((v, i) => (e[i] = (e[i] || 0) + k * (v || 0)));
      if (e.every(v => !v)) delete o[day][key];
    }
    if (o[day] && !Object.keys(o[day]).length) delete o[day];
  }
  return o;
};
export const clear = () => {
  STATS.d = {};
  for (const k in SESSION) delete SESSION[k];
  hook?.();
};

export const merge = (...maps) => {
  const o = {};
  for (const m of maps) for (const k in m || {}) add((o[k] ??= [0, 0, 0, 0]), m[k]);
  return o;
};
export const dayMap = (k, st = STATS) => st.d[k] || {};
export const monthMap = (ym, st = STATS) =>
  merge(...Object.keys(st.d).filter(k => k.startsWith(ym)).map(k => st.d[k]));
export const total = map => {
  const o = [0, 0, 0, 0];
  for (const k in map) add(o, map[k]);
  return o;
};
export const monthDays = (ym, st = STATS) => {
  const [y, m] = ym.split('-').map(Number),
    n = new Date(y, m, 0).getDate(),
    o = [];
  for (let d = 1; d <= n; d++) {
    const k = ym + '-' + two(d);
    o.push([k, total(st.d[k] || {})]);
  }
  return o;
};
