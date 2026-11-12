// Coût estimé des statistiques d'usage. Tarifs en dollars par million de tokens :
// [entrée, sortie, lecture du cache]. L'écriture du cache coûte 1,25 × l'entrée (5 min) ou 2 × (1 h).
// La lecture du cache vaut 0,1 × l'entrée, sauf Fable 5.1 (0,025 ×), Opus 5.5 et Sonnet 5.5 (0,05 ×).
// Tarifs publics d'Anthropic vérifiés le 31 octobre 2026. Un nouveau modèle s'ajoute ici.
// Haiku 5.5 coûte cinq fois plus au-delà de 100 000 tokens de prompt (cache compris) : ces requêtes sont
// comptées sous leur propre clé (ai.js), avec le suffixe LONG.
export const HAIKU_LONG = 100000;
export const LONG = ' (prompt > 100 k)';
export const PRICES = {
  ['claude-haiku-5-5' + LONG]: [0.5, 2.5, 0.05],
  'claude-fable-5-1': [10, 50, 0.25],
  'claude-fable-5': [10, 50, 1],
  'claude-opus-5-5': [4, 20, 0.2],
  'claude-opus-5': [5, 25, 0.5],
  'claude-opus-4-8': [5, 25, 0.5],
  'claude-opus-4-7': [5, 25, 0.5],
  'claude-opus-4-6': [5, 25, 0.5],
  'claude-sonnet-5-5': [2, 10, 0.1],
  'claude-sonnet-5': [2, 10, 0.2],
  'claude-sonnet-4-6': [3, 15, 0.3],
  'claude-haiku-5-5': [0.1, 0.5, 0.01],
  'claude-haiku-4-5': [1, 5, 0.1]
};

// Tarif connu, y compris pour un identifiant daté (claude-haiku-4-5-20251001) ; null pour un modèle inconnu,
// même voisin d'un modèle connu (claude-sonnet-5-7 n'a pas le tarif de claude-sonnet-5).
export const priceOf = key => PRICES[key] || PRICES[String(key).replace(/-\d{8}$/, '')] || null;

// e : entrée des statistiques [entrée, sortie, requêtes, estimées, cache lu, cache écrit 5 min, cache écrit 1 h].
// Le cache lu et écrit est compris dans l'entrée.
export const costOf = (e, pr) => {
  if (!pr) return null;
  const [i, o, r] = pr,
    [p = 0, c = 0, , , cr = 0, w5 = 0, w1 = 0] = e,
    fresh = Math.max(0, p - cr - w5 - w1);
  return (fresh * i + cr * r + w5 * i * 1.25 + w1 * i * 2 + c * o) / 1e6;
};

// Somme d'une période, et les modèles qui ont servi sans tarif connu.
export const costMap = map => {
  let sum = 0,
    any = false;
  const unknown = [];
  for (const k in map) {
    const v = costOf(map[k], priceOf(k));
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
