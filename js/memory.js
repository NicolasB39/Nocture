import { nz } from './util.js';

export const REL_MAX = 12;
export const MEM_MAX = 60;
// Taille du résumé, gardé et envoyé : la consigne en demande 1200 caractères, un peu de marge en plus.
export const SUM_MAX = 1400;
// Chapitres : un résumé figé par arc terminé, jamais réécrit ensuite. Un chapitre se clôt entre CH_MIN et
// CH_MAX messages ; seuls les CH_FULL derniers partent en entier au narrateur, les plus anciens par leur titre.
export const CH_MIN = 60;
export const CH_MAX = 200;
export const CH_SUM = 700;
export const CH_FULL = 12;
// Premier message du chapitre en cours : la fin du dernier chapitre clos.
export const chStart = mem => Math.min(mem.chapters?.at(-1)?.upto || 0, mem.upto);

const key = s =>
  nz(String(s))
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const parts = s => key(s).split(' ').filter(Boolean);
const words = s => new Set(parts(s).filter(w => w.length > 3));
// Souvenirs qui citent un personnage (fenêtre Personnages) : un mot de son nom, entier, accents et casse ignorés.
// Les titres et articles d'un nom composé (« Dame Isaure », « Le Chevalier ») ne comptent pas : « la dame du
// péage » n'est pas Isaure.
const TITRES = new Set('les des dame sire messire maitre frere soeur pere mere capitaine professeur docteur madame monsieur mademoiselle'.split(' '));
export const memsOf = (mems, name) => {
  const N = parts(name).filter(w => w.length > 2 && !TITRES.has(w));
  return N.length ? (mems || []).filter(m => parts(m).some(w => N.includes(w))) : [];
};
// Chapitre clos : le résumé principal repart de sa Situation actuelle (fils en suspens compris). Le modèle garde
// parfois aussi ses Événements, déjà racontés par le résumé du chapitre, et le prompt les enverrait deux fois.
// Le repère est cherché en début de ligne ou de phrase : le modèle n'en fait pas toujours un paragraphe.
export const situationOf = t => {
  const m = t.match(/(^|\n|[.!?…»]\s+)[\s*#_]*Situation actuelle\b/i);
  return m ? t.slice(m.index + m[1].length).trim() : t;
};

export const sameName = (a, b) => {
  const A = parts(a),
    B = parts(b);
  if (!A.length || !B.length) return false;
  const [x, y] = A.length <= B.length ? [A, B] : [B, A];
  return x.every(w => y.includes(w));
};

export const near = (a, b) => {
  const A = words(a),
    B = words(b);
  if (!A.size || !B.size) return key(a) === key(b);
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size) >= 0.6;
};

const marks = s => (String(s).normalize('NFD').match(/[\u0300-\u036f]/g) || []).length;
export const better = (a, b) => (marks(b) > marks(a) || (!a.trim() && b.trim()) ? b : a);

export function mergeRel(cur = {}, inc = {}, keep = [], max = REL_MAX) {
  const out = { ...cur };
  for (const [n, v] of Object.entries(inc)) {
    const name = String(n).trim(),
      val = String(v).trim();
    if (!name || !val || /^aucun/i.test(val)) continue;
    const hit = Object.keys(out).find(x => sameName(x, name)),
      k = hit ? better(hit, name) : name;
    if (hit) delete out[hit];
    delete out[k];
    out[k] = val;
  }
  for (const k of Object.keys(out)) {
    if (Object.keys(out).length <= max) break;
    if (!keep.some(n => sameName(n, k))) delete out[k];
  }
  return out;
}

export function mergeMem(cur = [], inc = [], max = MEM_MAX) {
  const out = [...cur];
  for (const raw of inc) {
    const t = String(raw).trim();
    if (!t) continue;
    const i = out.findIndex(x => near(x, t));
    if (i >= 0) out.splice(i, 1);
    out.push(t);
  }
  return out.slice(-max);
}

export const cutLines = (lines, i) => (lines || []).filter(l => l.i < i);
// Chapitres d'une histoire coupée au message i : ceux qui commencent après disparaissent, celui qui contient i
// finit en i (son résumé, comme celui de la mémoire, garde la trace de la suite).
export const cutChapters = (C, i) =>
  (C || []).filter((c, k) => (k ? C[k - 1].upto : 0) < i).map(c => (c.upto > i ? { ...c, upto: i } : c));
// Les messages partent numérotés vers la mémoire (« 1. Joueur : … ») et le modèle recopie souvent ce numéro en
// tête de ligne : « 3. », « 3) », « 3 : », éventuellement en gras. « 12:30 » ou « 3 gardes » restent intacts.
export const unnum = t => t.replace(/^[\s*_]*\d{1,2}\s*[.):][\s*_]+/, '').trim();
export const clip = (t, max) => {
  t = String(t || '').trim();
  if (t.length <= max) return t;
  const c = t.slice(0, max),
    m = c.match(/^[\s\S]*[.!?…»)](?=\s|$)/);
  return m && m[0].length > max * 0.6 ? m[0] : c.replace(/\s+\S*$/, '') + '…';
};
