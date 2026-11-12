// Jets de dés (mode jeu de rôle) : un scénario qui a un regles.md liste ses caractéristiques. L'IA ne lance
// jamais les dés : elle marque une action risquée « (Caractéristique, difficulté) » dans ses choix, ou finit sa
// réponse par <jet>Caractéristique, difficulté</jet> ; l'application lance un d20, ajoute le bonus de la fiche
// (s.sheet) et écrit le résultat dans le message du joueur, où l'IA le lit et où la carte du dé l'affiche.
// La balise elle-même (JET, isRoll) est définie dans util.js, avec sa version en texte simple.
import { ctx } from './state.js';
import { ikey, isRoll, JET, wkey as toks } from './util.js';

// Seuils du d20 : à bonus nul, 75, 55, 40 et 25 % de réussite (un 20 réussit toujours, un 1 échoue toujours).
const DIFF = { facile: 6, moyen: 10, difficile: 13, 'très difficile': 16 };
export const BONUS = { min: -1, max: 2, pts: 3 };
// Difficultés, la plus longue d'abord : « très difficile » est reconnue avant « difficile ».
const DS = Object.keys(DIFF).sort((x, y) => y.length - x.length);

// Caractéristiques du scénario ouvert (scénarios GitHub seulement), dans l'ordre de regles.md.
export const rulesOf = s => (s?.remote ? ctx.rules || [] : []);
// Fiche de l'histoire s : un bonus borné par caractéristique de regles.md.
// Plus de BONUS.pts points répartis (import, caractéristique à −1 retirée de regles.md) : un point de moins à la
// plus forte, jusqu'à retomber dans la limite.
export const spent = sh => Object.values(sh).reduce((a, v) => a + v, 0);
export const sheetOf = s => {
  const o = {};
  for (const k of rulesOf(s)) o[k] = Math.min(BONUS.max, Math.max(BONUS.min, Math.trunc(+s?.sheet?.[k] || 0)));
  while (spent(o) > BONUS.pts) {
    const k = Object.keys(o).reduce((a, b) => (o[b] > o[a] ? b : a));
    o[k]--;
  }
  return o;
};
export const signed = v => (v > 0 ? '+' + v : v < 0 ? '−' + -v : '0');

// Caractéristique de regles.md nommée dans x (mot entier ; la première nommée), et difficulté reconnue en mot
// entier, « moyenne » comprise (« facilement », « au moyen de » ne comptent pas).
const at = (x, w) => (' ' + toks(x) + ' ').indexOf(' ' + toks(w) + ' ');
const ruleIn = (x, rules) =>
  rules
    .filter(r => at(x, r) >= 0)
    .sort((a, b) => at(x, a) - at(x, b))[0];
const diffIn = x => DS.find(d => at(x, d) >= 0 || (d == 'moyen' && at(x, 'moyenne') >= 0));
// Marque d'action : rien d'autre que la caractéristique, la difficulté, « jet », « de » et un bonus écrit
// (« Jet d'Adresse, difficile, +2 ») ; une parenthèse du récit ou une note hors jeu n'en est pas une.
const bare = (x, k, d) =>
  toks(x)
    .split(' ')
    .every(w => toks(k).split(' ').includes(w) || toks(d).split(' ').includes(w) || /^(moyenne|jet|test|d|de|du|\d+)$/.test(w));
// Action marquée « … (Adresse, difficile) », de préférence en fin de ligne mais acceptée n'importe où (la
// dernière marque valide) : son texte sans la marque, la caractéristique et la difficulté. Une parenthèse
// ordinaire n'est pas une marque : il faut une caractéristique de regles.md et une difficulté reconnue, dans
// n'importe quel ordre ou forme (« Adresse : difficile », « Jet d'Adresse, difficile, +2 »).
export const checkOf = (t, rules) => {
  t = String(t);
  let hit = null;
  if (rules.length)
    for (const m of t.matchAll(/[ \t]*\(([^()]+)\)/g)) {
      const k = ruleIn(m[1], rules),
        d = diffIn(m[1]);
      if (k && d && bare(m[1], k, d)) hit = { m, k, d };
    }
  if (!hit) return null;
  const { m, k, d } = hit;
  return { text: (t.slice(0, m.index) + t.slice(m.index + m[0].length)).replace(/[ \t]{2,}/g, ' ').trim(), k, d };
};
// Jet demandé par le narrateur en fin de réponse : le dernier <jet> sans résultat. Lecture tolérante, pour qu'une
// demande ne reste jamais sans bouton : une caractéristique de regles.md est cherchée dans toute la balise
// (« Adresse : difficile », « difficile, Adresse ») ; à défaut, le premier morceau est gardé tel quel (bonus nul) ;
// une difficulté inconnue vaut moyen. Une balise jamais fermée en fin de réponse compte aussi.
const JQ = /<jet\s*>(?:([^<]*)<\/jet>|([^<\n]*)\s*$)/gi;
export const askOf = (t, rules) => {
  let p = null;
  if (rules.length)
    for (const m of String(t).matchAll(JQ)) {
      const x = m[1] ?? m[2];
      if (isRoll(x)) continue;
      const r = ruleIn(x, rules);
      // Balise jamais fermée (réponse coupée sur « <jet>Adresse, diff ») : seulement si elle est complète.
      if (m[1] == null && !(r && diffIn(x))) continue;
      if (r) {
        p = { k: r, d: diffIn(x) || 'moyen' };
        continue;
      }
      const [a = '', ...b] = x.split(/[,(;]|\s[-–—]\s/),
        k = a.trim(),
        rest = ikey(b.join(' '));
      if (k && k.length <= 30)
        p = { k: rules.find(r => ikey(r) == ikey(k)) || k, d: DS.find(x => rest.includes(ikey(x))) || 'moyen' };
    }
  return p;
};
// Résultat écrit par le narrateur lui-même : retiré de sa réponse (seule l'application lance les dés).
export const noRolls = t => t.replace(JET, (m, x) => (isRoll(x) ? '' : m));

const d20 = () => (crypto.getRandomValues(new Uint32Array(1))[0] % 20) + 1;
// Résultat, tel qu'il part dans le message du joueur : « Adresse, difficile (15) : 14 + 2 = 16, réussite ».
// Un 20 naturel réussit toujours (critique), un 1 naturel échoue toujours (critique). sheet : sheetOf.
export const roll = ({ k, d }, sheet = {}, n = d20()) => {
  const b = sheet[k] || 0,
    dc = DIFF[d],
    tot = n + b,
    r = n == 20 ? 'réussite critique' : n == 1 ? 'échec critique' : tot >= dc ? 'réussite' : 'échec';
  return '<jet>' + k + ', ' + d + ' (' + dc + ') : ' + n + ' ' + (b < 0 ? '−' : '+') + ' ' + Math.abs(b) + ' = ' + tot + ', ' + r + '</jet>';
};
// Chance de réussite d'un jet, en pourcentage, comme roll la tranche : le 20 réussit et le 1 échoue toujours.
export const chance = ({ k, d }, sheet = {}) => {
  let c = 1;
  for (let n = 2; n < 20; n++) if (n + (sheet[k] || 0) >= DIFF[d]) c++;
  return c * 5;
};
// Message du joueur de l'histoire s prêt à partir : la marque d'un choix remplacée par le résultat du jet.
export const withRoll = (t, s) => {
  const c = checkOf(t, rulesOf(s));
  return c ? (c.text ? c.text + '\n\n' : '') + roll(c, sheetOf(s)) : t;
};
// Lecture d'un résultat pour la carte du dé et la fiche.
export const rollParts = x => {
  const m = String(x).match(/^(.+?) \((\d+)\) : (\d+) ([+−]) (\d+) = (-?\d+), (.+)$/),
    r = m?.[7].trim();
  return (
    m && {
      label: m[1].replace(', ', ' · ') + ' (' + m[2] + ')',
      what: m[1].replace(', ', ' · '),
      n: +m[3],
      b: m[4] == '−' ? -m[5] : +m[5],
      tot: +m[6],
      dc: +m[2],
      sum: m[3] + ' ' + m[4] + ' ' + m[5] + ' = ' + m[6],
      r,
      ko: r.startsWith('échec'),
      crit: r.endsWith('critique')
    }
  );
};
