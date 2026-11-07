// Jets de dés (mode jeu de rôle) : un scénario qui a un regles.md liste ses caractéristiques. L'IA ne lance
// jamais les dés : elle marque une action risquée « (Caractéristique, difficulté) » dans ses choix, ou finit sa
// réponse par <jet>Caractéristique, difficulté</jet> ; l'application lance un d20, ajoute le bonus de la fiche
// (s.sheet) et écrit le résultat dans le message du joueur, où l'IA le lit et où la carte du dé l'affiche.
// La balise elle-même (JET, isRoll) est définie dans util.js, avec sa version en texte simple.
import { ctx } from './state.js';
import { ikey, isRoll, JET } from './util.js';

// Seuils du d20 : à bonus nul, 75, 55, 40 et 25 % de réussite (un 20 réussit toujours, un 1 échoue toujours).
const DIFF = { facile: 6, moyen: 10, difficile: 13, 'très difficile': 16 };
export const BONUS = { min: -1, max: 2, pts: 3 };
// Difficultés, la plus longue d'abord : « très difficile » est reconnue avant « difficile ».
const DS = Object.keys(DIFF).sort((x, y) => y.length - x.length);

// Caractéristiques du scénario ouvert (scénarios GitHub seulement), dans l'ordre de regles.md.
export const rulesOf = s => (s?.remote ? ctx.rules || [] : []);
// Fiche de l'histoire s : un bonus borné par caractéristique de regles.md.
export const sheetOf = s => {
  const o = {};
  for (const k of rulesOf(s)) o[k] = Math.min(BONUS.max, Math.max(BONUS.min, Math.trunc(+s?.sheet?.[k] || 0)));
  return o;
};
export const spent = sh => Object.values(sh).reduce((a, v) => a + v, 0);
export const signed = v => (v > 0 ? '+' + v : v < 0 ? '−' + -v : '0');

// Action marquée « … (Adresse, difficile) », de préférence en fin de ligne mais acceptée n'importe où (la
// dernière marque valide) : son texte sans la marque, la caractéristique et la difficulté. Une parenthèse
// ordinaire n'est pas une marque : il faut une caractéristique de regles.md et une difficulté reconnue, même
// accordée (« moyenne ») comme dans askOf.
export const checkOf = (t, rules) => {
  t = String(t);
  let hit = null;
  if (rules.length)
    for (const m of t.matchAll(/[ \t]*\(([^(),]+),\s*([^(),]+)\)/g)) {
      const k = rules.find(r => ikey(r) == ikey(m[1])),
        d = DS.find(x => ikey(m[2]).includes(ikey(x)));
      if (k && d) hit = { m, k, d };
    }
  if (!hit) return null;
  const { m, k, d } = hit;
  return { text: (t.slice(0, m.index) + t.slice(m.index + m[0].length)).replace(/[ \t]{2,}/g, ' ').trim(), k, d };
};
// Jet demandé par le narrateur en fin de réponse : le dernier <jet> sans résultat. Lecture tolérante, pour qu'une
// demande ne reste jamais sans bouton : « Adresse (difficile) » ou « Adresse - difficile » passent, une
// caractéristique absente de regles.md est gardée telle quelle (bonus nul), une difficulté inconnue vaut moyen.
export const askOf = (t, rules) => {
  let p = null;
  if (rules.length)
    for (const m of String(t).matchAll(JET)) {
      if (isRoll(m[1])) continue;
      const [a = '', ...b] = m[1].split(/[,(;]|\s[-–—]\s/),
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
