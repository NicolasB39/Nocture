import { API, S, app } from './state.js';

// Modèle de narration : celui du scénario ouvert, sinon celui des Réglages.
export const modelOf = (s = app.cur) => s?.model || S.model || API.m;

// Le lieu arrive avec l'état, en fin de réponse : trop tard pour l'affichage progressif. Quand il change,
// une balise <lieu> en tête l'annonce dès les premiers mots (intertitre, lettrine, décor) ; l'état reste en
// fin de réponse, pour suivre ce qui s'y passe.
const lieuBlock = fields => {
  const f = fields.match(/(?:^|,\s*)((?:lieu|endroit|localisation|position)[^,]*)/i)?.[1].trim();
  return f
    ? '\nQuand le lieu change, ouvre ta réponse par <lieu>nouveau lieu</lieu> seul sur sa ligne (même valeur que le champ ' + f + ') ; sinon, pas de balise.'
    : '';
};
const stateBlock = (fields, choices) =>
  '\n\n# État\nAprès la narration' +
  (choices ? ', avant le bloc <choix>' : '') +
  ', ajoute un bloc <etat> listant « Champ: valeur », un par ligne. Champs : ' +
  fields +
  ". Une valeur bornée s'écrit 80/100." +
  lieuBlock(fields);
const choiceBlock = prompt =>
  '\n\n# Choix\nTermine par un bloc <choix> de trois actions numérotées pour le personnage du joueur. ' + prompt;
const STYLE =
  '\n\n# Style\nGestes et actions entre astérisques (*il repose sa tasse*), paroles en texte simple. Dans un tour, le geste précède la parole.';
const IMAGES =
  '\n\n# Images\nAffiche une image avec {{img::code}} seul sur sa ligne, codes listés dans <images_disponibles>. Place-la au fil du récit, là où elle illustre le texte, pas par défaut en tête de réponse.';

export const DEFAULT_CHOICE =
  'Trois propositions courtes et variées, écrites à la première personne, chacune sous la forme *un geste* suivi de ce que dit le personnage.';
export const DEFAULT_CHOICE_PLAIN = 'Trois propositions courtes et variées, écrites à la première personne.';
export const DEFAULT_FIELDS = 'Lieu, Objectif, Humeur';

// Formats de sortie imposés par l'application (partie fixe du prompt système).
export function protocol({ stat = false, fields = '', choices = false, prompt = '', images = false, style = true } = {}) {
  return (
    (style ? STYLE : '') +
    (images ? IMAGES : '') +
    (stat ? stateBlock(fields || DEFAULT_FIELDS, choices) : '') +
    (choices ? choiceBlock(prompt || (style ? DEFAULT_CHOICE : DEFAULT_CHOICE_PLAIN)) : '')
  );
}

const MARKS = [
  ['<choix>', 'le format des choix'],
  ['<etat>', "le format de l'état"],
  ['{{img::', 'la syntaxe des images']
];
export const conflicts = t => MARKS.filter(([k]) => (t || '').includes(k)).map(x => x[1]);
