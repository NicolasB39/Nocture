// Modes Inventaire (inventaire.md) et Liens (liens.md) d'un scénario GitHub. Le narrateur signale les
// changements par une balise (<inventaire>+1 Corde, −5 Or</inventaire>, <lien>Inès +1</lien>), split (format.js)
// les range dans la réponse (m.inv, m.links) et l'application tient les comptes : l'inventaire et les liens à un
// moment donné se recalculent depuis le départ, si bien que supprimer, régénérer, modifier ou bifurquer les
// corrigent d'eux-mêmes, sans rien stocker à part.
import { signed } from './dice.js';
import { sameName } from './memory.js';
import { ctx } from './state.js';
import { wkey } from './util.js';

const num = s => +String(s).replace('−', '-');

// Changements écrits par le narrateur : « +1 Corde, −5 Or », « Corde +1 », « Inès : −1 ». Quantité 1 par défaut.
export const deltas = t => {
  const out = [];
  for (const raw of String(t || '').split(/[,;\n]/)) {
    // Puce de liste (« - Inès +1 ») retirée : son tiret n'est pas un signe moins. Le tiret court « – » en est un.
    const x = raw
      .replace(/[*_.]+$/g, '')
      .trim()
      .replace(/^[-*•]\s+(?=\D)/, '')
      .replace(/^–|–(?=\s*\d*$)/, '-');
    const a = x.match(/^([+−-])\s*(\d+)?\s*(.+)$/),
      b = !a && x.match(/^(.+?)\s*:?\s*([+−-])\s*(\d+)?$/),
      [s, n, k] = a ? [a[1], a[2], a[3]] : b ? [b[2], b[3], b[1]] : [];
    const v = Math.min(999, +(n || 1));
    if (k?.trim() && v) out.push([k.trim(), s == '+' ? v : -v]);
  }
  return out.slice(0, 12);
};

// inventaire.md : une ligne par objet ou ressource, « Or: 20 », « Énergie: 10/10 », « Rations: 3, −1 par jour ».
// Les lignes qui commencent par # sont des commentaires.
export const parseInv = t => {
  const out = [];
  for (const l of String(t || '').split('\n')) {
    if (l.trim().startsWith('#')) continue;
    const m = l.match(/^\s*[-*•]?\s*([^:#]{1,40}?)\s*:\s*(\d+)(?:\s*\/\s*(\d+))?(?:\s*[,;]\s*[-−]\s*(\d+)\s*par\s+jour)?/i);
    if (m) out.push({ k: m[1].trim(), n: +m[2], max: m[3] ? +m[3] : null, day: m[4] ? +m[4] : 0 });
  }
  return out.slice(0, 20);
};

// liens.md : « Échelle : −3 à 3 » (facultatif) et des paliers « Inès, à +2 : elle révèle son secret ».
export const parseLiens = t => {
  let min = -3,
    max = 3;
  const steps = [];
  for (const l of String(t || '').split('\n')) {
    if (l.trim().startsWith('#')) continue;
    const e = l.match(/chelle\s*:?\s*([+−-]?\d+)\s*(?:à|a|–|—)\s*([+−-]?\d+)/i);
    if (e) [min, max] = [num(e[1]), num(e[2])];
    const p = !e && l.match(/^\s*[-*•]?\s*(.+?)\s*,\s*à\s*([+−-]?\d+)\s*:\s*(.+)$/);
    if (p) steps.push({ who: p[1].trim(), at: num(p[2]), text: p[3].trim() });
  }
  if (!(min <= 0 && max >= 0 && min < max && max - min <= 20)) [min, max] = [-3, 3];
  return { min, max, steps: steps.slice(0, 40) };
};

// Personnage à fiche désigné par k : le nom exact d'abord (« Jean-Pierre » n'est pas « Jean »), sinon un nom
// approchant (sameName : « Inès », « Inès la guérisseuse »).
const charOf = (chars, k) => chars.find(c => wkey(c.name) == wkey(k)) || chars.find(c => sameName(c.name, k));
export const invOn = s => !!(s?.remote && ctx.inv?.length);
export const linksOn = s => !!(s?.remote && ctx.liens && ctx.chars?.length);

// Jour de l'état (champ « Jour… » du panneau), pour la baisse quotidienne des ressources.
export const dayOf = st => {
  const e = (st || []).find(([k]) => /^jour\b/.test(wkey(k))),
    n = e && parseInt(e[1].match(/\d+/)?.[0]);
  return Number.isFinite(n) ? n : null;
};

// Inventaire après les upto premiers messages : quantités de départ, baisse par jour passé, puis les changements
// de chaque réponse. Jamais sous zéro ni au-dessus de la borne ; une dépense impossible (plus que ce qu'on a) est
// ignorée. log : les changements appliqués, pour la feuille Inventaire.
export const invOf = (ms, base = ctx.inv || [], upto = ms.length) => {
  const items = base.map(x => ({ ...x, start: true })),
    log = [];
  let day = null;
  for (let i = 0; i < upto; i++) {
    const m = ms[i];
    if (m.role != 'assistant') continue;
    const d = dayOf(m.state);
    if (d != null) {
      if (day != null && d > day) for (const x of items) if (x.day) x.n = Math.max(0, x.n - x.day * (d - day));
      day = d;
    }
    for (const [k, v] of m.inv || []) {
      let x = items.find(y => wkey(y.k) == wkey(k));
      if (!x) {
        if (v <= 0) continue;
        items.push((x = { k, n: 0, max: null, day: 0 }));
      }
      if (x.n + v < 0) continue;
      const n0 = x.n;
      x.n = x.max != null ? Math.min(x.max, x.n + v) : x.n + v;
      if (x.n != n0) log.push({ i, k: x.k, d: x.n - n0 });
    }
  }
  return { items: items.filter(x => x.start || x.n > 0), log };
};
export const invLine = x => x.k + ': ' + x.n + (x.max != null ? '/' + x.max : '');

// Liens après les messages ms : 0 au départ pour chaque personnage à fiche, borné à l'échelle de liens.md. Un nom
// qui ne désigne aucun personnage à fiche est ignoré.
export const linksOf = (ms, chars = ctx.chars || [], L = ctx.liens) => {
  const clamp = x => Math.max(L.min, Math.min(L.max, x)),
    v = new Map(chars.map(c => [c.name, clamp(0)])),
    log = [];
  ms.forEach((m, i) => {
    if (m.role != 'assistant') return;
    for (const [k, d] of m.links || []) {
      const c = charOf(chars, k);
      if (!c) continue;
      const a = v.get(c.name),
        b = clamp(a + d);
      if (b != a) {
        v.set(c.name, b);
        log.push({ i, k: c.name, d: b - a });
      }
    }
  });
  return { v, log };
};
// Paliers atteints : à +2, une valeur de 2 ou plus ; à −2, une valeur de −2 ou moins.
export const stepsOf = (name, val, L = ctx.liens, chars = ctx.chars || []) =>
  (L?.steps || []).filter(s => (charOf(chars, s.who)?.name ?? s.who) == name && (s.at >= 0 ? val >= s.at && s.at > 0 : val <= s.at));

// Blocs de fin de requête (buildInfo) : l'inventaire exact et les liens actuels, hors cache.
export const modesTail = s => {
  let t = '';
  if (invOn(s))
    t += '\n\n<inventaire_actuel>\n' + (invOf(s.messages).items.map(invLine).join('\n') || '(vide)') + '\n</inventaire_actuel>';
  if (linksOn(s)) {
    const { v } = linksOf(s.messages);
    t +=
      '\n\n<liens>\n' +
      [...v]
        .map(([k, x]) => {
          const st = stepsOf(k, x);
          return k + ' : ' + signed(x) + (st.length ? ' (palier atteint : ' + st.map(p => p.text).join(' ; ') + ')' : '');
        })
        .join('\n') +
      '\n</liens>';
  }
  return t;
};
// Changements d'une réponse, pour la ligne sous le message et l'édition (raw, format.js).
export const invText = a => a.map(([k, d]) => (d > 0 ? '+' : '−') + Math.abs(d) + ' ' + k).join(', ');
export const linkText = a => a.map(([k, d]) => k + ' ' + signed(d)).join(', ');
