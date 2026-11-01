// Coût estimé des statistiques d'usage. Tarifs en dollars par million de tokens :
// [entrée, sortie, lecture du cache]. L'écriture du cache coûte 1,25 × l'entrée (5 min) ou 2 × (1 h).
// La lecture du cache vaut 0,1 × l'entrée, sauf Fable 5.1 (0,025 ×), Opus 5.5 et Sonnet 5.5 (0,05 ×).
// Tarifs publics d'Anthropic vérifiés le 31 octobre 2026. Un modèle absent de la liste se renseigne dans la feuille.
// Haiku 5.5 coûte cinq fois plus au-delà de 100 000 tokens de prompt (cache compris) : ces requêtes sont
// comptées sous leur propre clé (ai.js), avec le suffixe LONG.
export const HAIKU_LONG = 100000;
export const LONG = ' (prompt > 100 k)';
export const PRICES = {
  ['claude/claude-haiku-5-5' + LONG]: [0.5, 2.5, 0.05],
  'claude/claude-fable-5-1': [10, 50, 0.25],
  'claude/claude-fable-5': [10, 50, 1],
  'claude/claude-opus-5-5': [4, 20, 0.2],
  'claude/claude-opus-5': [5, 25, 0.5],
  'claude/claude-opus-4-8': [5, 25, 0.5],
  'claude/claude-opus-4-7': [5, 25, 0.5],
  'claude/claude-opus-4-6': [5, 25, 0.5],
  'claude/claude-sonnet-5-5': [2, 10, 0.1],
  'claude/claude-sonnet-5': [2, 10, 0.2],
  'claude/claude-sonnet-4-6': [3, 15, 0.3],
  'claude/claude-haiku-5-5': [0.1, 0.5, 0.01],
  'claude/claude-haiku-4-5': [1, 5, 0.1]
};

// Tarif personnalisé d'abord, puis tarif connu, y compris pour un identifiant daté (claude-haiku-4-5-20251001).
export const priceOf = (key, custom = {}) => {
  if (Array.isArray(custom[key])) return custom[key];
  if (PRICES[key]) return PRICES[key];
  const k = Object.keys(PRICES)
    .filter(p => key.startsWith(p + '-'))
    .sort((a, b) => b.length - a.length)[0];
  return k ? PRICES[k] : null;
};

// e : entrée des statistiques [entrée, sortie, requêtes, estimées, cache lu, cache écrit 5 min, cache écrit 1 h].
// Le cache lu et écrit est compris dans l'entrée ; sans tarif de cache, il est compté au prix de l'entrée.
export const costOf = (e, pr) => {
  if (!pr) return null;
  const [i, o, r = i] = pr,
    [p = 0, c = 0, , , cr = 0, w5 = 0, w1 = 0] = e,
    fresh = Math.max(0, p - cr - w5 - w1);
  return (fresh * i + cr * r + w5 * i * 1.25 + w1 * i * 2 + c * o) / 1e6;
};

// Somme d'une période, et les modèles qui ont servi sans tarif connu.
export const costMap = (map, custom) => {
  let sum = 0,
    any = false;
  const unknown = [];
  for (const k in map) {
    const v = costOf(map[k], priceOf(k, custom));
    if (v == null) unknown.push(k);
    else {
      sum += v;
      any = true;
    }
  }
  return { sum, any, unknown };
};

// fx : euros pour un dollar ; sans taux, on reste en dollars, la monnaie des tarifs.
export const money = (usd, fx) => {
  const v = fx ? usd * fx : usd,
    d = v && v < 0.1 ? 3 : 2;
  return (
    v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) + (fx ? ' €' : ' $')
  );
};

// « 15 € », « 1 000 », « 0,92 » → nombre ; vide → null ; illisible ou nul → undefined.
export const parseAmount = t => {
  const s = String(t ?? '').trim();
  if (!s) return null;
  const m = s.replace(/[\s  ]/g, '').match(/^\D*(\d+(?:[.,]\d+)?)\D*$/),
    n = m ? +m[1].replace(',', '.') : 0;
  return n > 0 ? n : undefined;
};
// « 2 / 10 » ou « 2,5 10 0,25 » → [2, 10] / [2.5, 10, 0.25] ; vide → null ; illisible → undefined.
export const parsePrice = t => {
  const s = String(t ?? '').trim();
  if (!s) return null;
  const n = (s.match(/\d+(?:[.,]\d+)?/g) || []).map(x => +x.replace(',', '.'));
  return n.length >= 2 && n.length <= 3 ? n : undefined;
};
