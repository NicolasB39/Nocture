import { clip } from './memory.js';
import { nz } from './util.js';

// Rappel de passages anciens : quand le résumé a perdu un détail, on retrouve par mots rares
// (noms, lieux, objets) les anciens messages qui ne sont plus envoyés, et on en réinjecte un extrait.
export const RECALL_N = 2;
const EXCERPT = 600;

// Mots trop courants pour signaler un lien entre deux passages (sans accents, quatre lettres ou plus).
const STOP = new Set(
  (
    'avec dans pour mais plus tout toute tous toutes cette ces comme elle elles nous vous leur leurs sont etre avoir ' +
    'fait faire sans sous vers chez entre encore aussi alors donc bien tres peut puis quand quoi quel quelle quels ' +
    'quelles ceux celle celles celui cela ceci etait etaient avait avaient sera seront votre notre deja juste moins ' +
    'meme memes autre autres avant apres depuis pendant jamais rien chose choses ainsi dont voila comment pourquoi ' +
    'parce quelque quelques chaque toujours souvent petit petite petits petites grand grande grands grandes regard ' +
    'regarde regardes yeux main mains voix tete visage sourire sourit souffle lentement doucement instant moment ' +
    'jusqu quil quils lorsque tandis contre dessus dessous devant derriere autour loin pres trop assez beaucoup avez ' +
    'avons suis etes sommes sais sait savez veux veut voulez vais allez aller dire disant voir vois voit prendre ' +
    'prend pris laisse laisser semble fois cote part peux pouvez faut tient tenir vient venir enfin ' +
    'joueur narrateur user quoi seul seule premier premiere derniere dernier nouveau nouvelle temps jour nuit'
  ).split(' ')
);

// Texte enregistré (choix et état déjà à part, split), sans les balises d'images.
const clean = t => t.replace(/\{\{[^}]*\}\}/g, '').trim();
const words = t => new Set((nz(t).match(/[a-z0-9]{4,}/g) || []).filter(w => !STOP.has(w)));
// Mots de chaque message, gardés tant que son texte ne change pas : la recherche repasse sur toute la partie
// résumée de l'histoire à chaque tour.
const MW = new WeakMap();
const wordsOf = m => {
  let c = MW.get(m);
  if (c?.t !== m.content) MW.set(m, (c = { t: m.content, w: words(clean(m.content)) }));
  return c.w;
};

// Le paragraphe qui contient le plus de mots de la requête, élargi au suivant s'il est court.
const excerpt = (t, q) => {
  // Un paragraphe de deux lignes « Champ: valeur » ou plus est un état écrit sans balise : jamais rappelé.
  const ps = clean(t)
    .split(/\n\s*\n/)
    .filter(p => {
      const ls = p.trim().split('\n');
      return p.trim() && !(ls.length > 1 && ls.every(l => /^\s*[-*•]?\s*\[?[^:\n\]]{1,30}:\s*\S/.test(l)));
    });
  let b = 0,
    best = -1;
  ps.forEach((p, i) => {
    let h = 0;
    for (const w of words(p)) if (q.has(w)) h++;
    if (h > best) [best, b] = [h, i];
  });
  let x = ps[b] || '';
  if (x.length < EXCERPT / 2 && ps[b + 1]) x += '\n\n' + ps[b + 1];
  return clip(x, EXCERPT);
};

// ms : tous les messages ; before : premier index encore envoyé tel quel ; query : texte de la scène actuelle.
// Rend au plus n passages, dans l'ordre du récit : [{ i, role, text }].
export function recall(ms, before, query, n = RECALL_N) {
  if (n <= 0 || before <= 0) return [];
  const q = words(query);
  if (!q.size) return [];
  const docs = ms.slice(0, before).map(wordsOf);
  const df = new Map();
  for (const d of docs) for (const w of d) if (q.has(w)) df.set(w, (df.get(w) || 0) + 1);
  // Il faut au moins un mot distinctif : présent dans un passage sur dix au plus (trois passages au moins
  // tolérés, pour qu'un nom revenu quelques fois dans une courte histoire compte encore). Un personnage présent
  // partout ne suffit pas à lui seul.
  const N = docs.length,
    rare = w => df.get(w) <= Math.max(3, N / 10);
  const scored = docs
    .map((d, i) => {
      let s = 0,
        k = 0,
        r = 0;
      for (const w of q)
        if (d.has(w)) {
          k++;
          if (rare(w)) r++;
          s += Math.log(1 + N / df.get(w));
        }
      return { i, s, ok: k >= 2 && r >= 1 };
    })
    .filter(x => x.ok)
    .sort((a, b) => b.s - a.s || b.i - a.i)
    .slice(0, n)
    .sort((a, b) => a.i - b.i);
  return scored.map(({ i }) => ({ i, role: ms[i].role, text: excerpt(ms[i].content, q) })).filter(p => p.text);
}

export const recallTag = (ps, nm = 'Joueur') =>
  ps.length
    ? '\n\n<passages_anciens>\n(Extraits d’anciens messages qui ne sont plus dans l’historique, retrouvés parce qu’ils parlent de la scène actuelle. Ils peuvent dater : les événements récents priment.)\n' +
      ps.map(p => '[' + (p.role == 'user' ? nm : 'Récit') + '] ' + p.text).join('\n\n') +
      '\n</passages_anciens>'
    : '';
