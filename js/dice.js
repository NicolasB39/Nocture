// Jets de dés (mode jeu de rôle) : un scénario qui a un regles.md liste ses caractéristiques. L'IA ne lance
// jamais les dés : elle marque une action risquée « (Caractéristique, difficulté) » dans ses choix, ou finit sa
// réponse par <jet>Caractéristique, difficulté</jet> ; l'application lance un d20, ajoute le bonus de la fiche
// (s.sheet) et écrit le résultat dans le message du joueur, où l'IA le lit et où la carte du dé l'affiche.
import { ctx } from './state.js';
import { ikey } from './util.js';

export const DIFF = { facile: 8, moyen: 12, difficile: 15, 'très difficile': 18 };
export const BONUS = { min: -1, max: 2, pts: 3 };
const DS = Object.keys(DIFF);
export const JET = /<jet>([^<]*)<\/jet>/gi;

// Caractéristiques du scénario ouvert (scénarios GitHub seulement), dans l'ordre de regles.md.
export const rulesOf = s => (s?.remote ? ctx.rules || [] : []);

const pair = (a, b, rules) => {
  const k = rules.find(r => ikey(r) == ikey(a)),
    d = DS.find(x => ikey(x) == ikey(b));
  return k && d ? { k, d } : null;
};
// Action marquée « … (Adresse, difficile) », de préférence en fin de ligne mais acceptée n'importe où (la
// dernière marque valide) : son texte sans la marque, la caractéristique et la difficulté. Une parenthèse
// ordinaire n'est pas une marque : il faut une caractéristique de regles.md et une difficulté connue.
export const checkOf = (t, rules) => {
  t = String(t);
  let hit = null;
  if (rules.length)
    for (const m of t.matchAll(/[ \t]*\(([^(),]+),\s*([^(),]+)\)/g)) {
      const p = pair(m[1], m[2], rules);
      if (p) hit = { m, p };
    }
  if (!hit) return null;
  const { m, p } = hit;
  return { text: (t.slice(0, m.index) + t.slice(m.index + m[0].length)).replace(/[ \t]{2,}/g, ' ').trim(), ...p };
};
// Jet demandé par le narrateur en fin de réponse : le dernier <jet> sans résultat. Lecture tolérante, pour qu'une
// demande ne reste jamais sans bouton : « Adresse (difficile) » ou « Adresse - difficile » passent, une
// caractéristique absente de regles.md est gardée telle quelle (bonus nul), une difficulté inconnue vaut moyen.
const BY_LEN = [...DS].sort((x, y) => y.length - x.length);
export const askOf = (t, rules) => {
  let p = null;
  if (rules.length)
    for (const m of String(t).matchAll(JET)) {
      if (m[1].includes(':')) continue;
      const [a = '', ...b] = m[1].split(/[,(;]|\s[-–—]\s/),
        k = a.trim(),
        rest = ikey(b.join(' '));
      if (k && k.length <= 30)
        p = { k: rules.find(r => ikey(r) == ikey(k)) || k, d: BY_LEN.find(x => rest.includes(ikey(x))) || 'moyen' };
    }
  return p;
};
// Résultat écrit par le narrateur lui-même : retiré de sa réponse (seule l'application lance les dés).
export const noRolls = t => t.replace(/<jet>[^<]*:[^<]*<\/jet>/gi, '');
export const signed = v => (v > 0 ? '+' + v : v < 0 ? '−' + -v : '0');
const d20 = () => (crypto.getRandomValues(new Uint32Array(1))[0] % 20) + 1;
// Résultat, tel qu'il part dans le message du joueur : « Adresse, difficile (15) : 14 + 2 = 16, réussite ».
// Un 20 naturel réussit toujours (critique), un 1 naturel échoue toujours (critique).
export const roll = ({ k, d }, sheet = {}, n = d20()) => {
  const b = Math.trunc(+sheet[k] || 0),
    dc = DIFF[d],
    tot = n + b,
    r = n == 20 ? 'réussite critique' : n == 1 ? 'échec critique' : tot >= dc ? 'réussite' : 'échec';
  return '<jet>' + k + ', ' + d + ' (' + dc + ') : ' + n + ' ' + (b < 0 ? '−' : '+') + ' ' + Math.abs(b) + ' = ' + tot + ', ' + r + '</jet>';
};
// Message du joueur prêt à partir : la marque d'un choix remplacée par le résultat du jet.
export const withRoll = (t, rules, sheet) => {
  const c = checkOf(t, rules);
  return c ? (c.text ? c.text + '\n\n' : '') + roll(c, sheet) : t;
};
// Lecture d'un résultat pour la carte du dé.
export const rollParts = x => {
  const m = String(x).match(/^(.+?) \((\d+)\) : (\d+) ([+−]) (\d+) = (-?\d+), (.+)$/);
  return m && { label: m[1].replace(', ', ' · ') + ' (' + m[2] + ')', n: +m[3], sum: m[3] + ' ' + m[4] + ' ' + m[5] + ' = ' + m[6], r: m[7].trim() };
};
// Fiche valide : bonus entiers bornés, une entrée par caractéristique connue.
export const sheetOf = (s, rules) => {
  const o = {};
  for (const k of rules) o[k] = Math.min(BONUS.max, Math.max(BONUS.min, Math.trunc(+s?.sheet?.[k] || 0)));
  return o;
};
export const spent = sh => Object.values(sh).reduce((a, v) => a + v, 0);
