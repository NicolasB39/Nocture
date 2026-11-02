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
  ', ajoute un bloc <etat> listant « Champ: valeur », un par ligne, en quelques mots par champ. Champs : ' +
  fields +
  ". Une valeur bornée s'écrit 80/100." +
  lieuBlock(fields);
const choiceBlock = prompt =>
  '\n\n# Choix\nTermine par un bloc <choix> de trois actions numérotées pour le personnage du joueur. ' + prompt;
// Conseils de narration, communs à tous les scénarios : le scénario donne le monde et le ton, ceci le mouvement.
const NARRATION =
  "\n\n# Narration\n- Le joueur décide seul de ce que fait, dit, pense et ressent {{user}} : ce qu'il écrit est une tentative, dont tu narres le résultat et les réactions, jamais la suite de ses gestes. Tu joues tout le reste.\n- Les personnages n'ont pas accès aux pensées de {{user}} : ils ne réagissent qu'à ce qui est dit, fait ou visible.\n- Le monde et ses personnages vivent sans attendre le joueur : ils prennent des initiatives, poursuivent leurs propres buts et réagissent entre eux, pas seulement à {{user}}. L'histoire avance même quand le joueur hésite.\n- Chaque personnage a sa voix : son vocabulaire, son rythme, ce qu'il tait. Ses répliques portent des intentions, pas des explications.\n- Un ou deux détails concrets (un son, une odeur, un objet) valent mieux que des adjectifs généraux.\n- Fais revenir ce qui a déjà eu lieu : un objet, une promesse, une blessure, une phrase dite plus tôt. Les souvenirs fournis servent à cela.\n- Ouvre ta réponse sur ce que l'action du joueur provoque (une réaction, une réplique, un détail), sans raconter de nouveau ce qu'il vient d'écrire, et ne termine pas toujours de la même façon.\n- Quand une action se répète ou qu'un moment n'apporte rien de neuf (entraînement, trajet, attente), donnes-en le résultat en quelques phrases et avance le temps jusqu'au prochain moment qui compte.\n- Montre les émotions des personnages par leurs gestes et leurs réactions plutôt que de les nommer.";
const STYLE =
  '\n\n# Style\nGestes et actions entre astérisques (*il repose sa tasse*), paroles en texte simple. Dans un tour, le geste précède la parole.';
const IMAGES =
  '\n\n# Images\nAffiche une image avec {{img::code}} seul sur sa ligne, codes listés dans <images_disponibles>. Place-la au fil du récit, là où elle illustre le texte, pas par défaut en tête de réponse.';

export const DEFAULT_CHOICE =
  'Trois propositions courtes, de registres différents (par exemple une audacieuse, une prudente, une inattendue), écrites à la première personne, chacune sous la forme *un geste* suivi de ce que dit le personnage.';
export const DEFAULT_CHOICE_PLAIN =
  'Trois propositions courtes, de registres différents (par exemple une audacieuse, une prudente, une inattendue), écrites à la première personne.';
export const DEFAULT_FIELDS = 'Lieu, Objectif, Humeur';

// Formats de sortie imposés par l'application (partie fixe du prompt système).
export function protocol({ stat = false, fields = '', choices = false, prompt = '', images = false, style = true } = {}) {
  return (
    NARRATION +
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
