import { API, S, app } from './state.js';

// Consignes concises pour Sonnet et Opus, qui suivent bien les consignes ; détaillées pour les autres modèles.
const LEAN = /sonnet|opus/i;

// Modèle de narration : celui du scénario ouvert, sinon celui des Réglages.
export const modelOf = (s = app.cur) => s?.model || S.model || API.m;
export const family = m => (S.proto == 'full' || S.proto == 'lean' ? S.proto : LEAN.test(m || '') ? 'lean' : 'full');

// Le lieu arrive avec l'état, en fin de réponse : trop tard pour l'affichage progressif. Quand il change,
// une balise <lieu> en tête l'annonce dès les premiers mots (intertitre, lettrine, décor) ; l'état reste en
// fin de réponse, pour suivre ce qui s'y passe.
const lieuBlock = (fields, lean) => {
  const f = fields.match(/(?:^|,\s*)((?:lieu|endroit|localisation|position)[^,]*)/i)?.[1].trim();
  if (!f) return '';
  return lean
    ? '\nQuand le lieu change, ouvre ta réponse par <lieu>nouveau lieu</lieu> seul sur sa ligne (même valeur que le champ ' + f + ') ; sinon, pas de balise.'
    : '\nQuand le lieu change dans ta réponse, ouvre-la par une ligne <lieu>nouveau lieu</lieu>, seule sur sa ligne et avant la narration, avec exactement la valeur que tu donneras au champ ' +
        f +
        ". Sans changement de lieu, n'écris pas cette ligne.";
};
const stateBlock = (fields, lean, choices) =>
  (lean
    ? '\n\n# État\nAprès la narration' +
      (choices ? ', avant le bloc <choix>' : '') +
      ", ajoute un bloc <etat> listant « Champ: valeur », un par ligne. Champs : " +
      fields +
      '. Une valeur bornée s\'écrit 80/100.'
    : "\n\n# Format de l'état\nAprès ta narration" +
      (choices ? ' et avant le bloc de choix' : '') +
      ", écris l'état courant, une ligne « Champ: valeur » par champ :\n<etat>\nChamp: valeur\n</etat>\nChamps à suivre : " +
      fields +
      ".\nUne valeur numérique avec un maximum s'écrit 80/100.") + lieuBlock(fields, lean);

const choiceBlock = (prompt, lean) =>
  lean
    ? '\n\n# Choix\nTermine par un bloc <choix> de trois actions numérotées pour le personnage du joueur. ' + prompt
    : '\n\n# Format des choix\nTermine chaque réponse par trois actions possibles pour le personnage du joueur. ' +
      prompt +
      '\nUtilise exactement ce format, sans rien écrire après :\n<choix>\n1. …\n2. …\n3. …\n</choix>';

const styleBlock = lean =>
  lean
    ? '\n\n# Style\nGestes et actions entre astérisques (*il repose sa tasse*), paroles en texte simple. Dans un tour, le geste précède la parole.'
    : "\n\n# Style du texte\nÉcris les gestes, les actions et les didascalies entre astérisques, par exemple *il repose sa tasse*. Laisse les paroles en texte simple, éventuellement entre guillemets. Quand un personnage fait puis dit quelque chose dans le même tour, le geste vient avant la parole.";

const imageBlock = lean =>
  lean
    ? "\n\n# Images\nAffiche une image avec {{img::code}} seul sur sa ligne, codes listés dans <images_disponibles>. Place-la au fil du récit, là où elle illustre le texte, pas par défaut en tête de réponse."
    : "\n\n# Images\nPour afficher une image, écris {{img::code}} seul sur sa propre ligne, avec un code de la liste <images_disponibles>. Place-la à l'endroit du récit qu'elle illustre : quand le personnage apparaît, réagit ou change d'expression, entre deux paragraphes, au milieu du texte. N'ouvre pas systématiquement ta réponse par une image : commence par la narration, puis insère l'image au moment voulu. Tu peux en utiliser plusieurs, chacune à sa place.";

export const DEFAULT_CHOICE =
  'Trois propositions courtes et variées, écrites à la première personne, chacune sous la forme *un geste* suivi de ce que dit le personnage.';
export const DEFAULT_CHOICE_PLAIN = 'Trois propositions courtes et variées, écrites à la première personne.';
export const DEFAULT_FIELDS = 'Lieu, Objectif, Humeur';

export function protocol({ model = modelOf(), stat = false, fields = '', choices = false, prompt = '', images = false, style = true } = {}) {
  const lean = family(model) == 'lean',
    tail = [];
  let sys = '';
  if (style) sys += styleBlock(lean);
  if (images) sys += imageBlock(lean);
  if (stat) {
    sys += stateBlock(fields || DEFAULT_FIELDS, lean, choices);
    tail.push('<etat>');
  }
  if (choices) {
    sys += choiceBlock(prompt || (style ? DEFAULT_CHOICE : DEFAULT_CHOICE_PLAIN), lean);
    tail.push('<choix>');
  }
  return {
    sys,
    tail: lean || !tail.length ? '' : '\n\n<rappel>\nTermine par le bloc ' + tail.join(' puis le bloc ') + '.\n</rappel>'
  };
}

const MARKS = [
  ['<choix>', 'le format des choix'],
  ['<etat>', "le format de l'état"],
  ['{{img::', 'la syntaxe des images']
];
export const conflicts = t => MARKS.filter(([k]) => (t || '').includes(k)).map(x => x[1]);
