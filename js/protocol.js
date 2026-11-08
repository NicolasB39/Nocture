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
  '\n\n# Choix\nTermine par un bloc <choix> de trois actions numérotées pour le personnage du joueur, seul endroit où tu le fais agir ou parler, toujours à la première personne (« Je… », jamais « Vous… »). Ne les recopie pas en liste dans le récit. ' + prompt;
// Conseils de narration, communs à tous les scénarios : le scénario donne le monde et le ton, ceci le mouvement.
const NARRATION =
  "\n\n# Narration\n- Le joueur décide seul de ce que fait, dit, pense et ressent {{user}} : ce qu'il écrit est une tentative, dont tu narres le résultat et les réactions, jamais la suite de ses gestes. Tu joues tout le reste.\n- Sauf exception prévue par le scénario, les personnages n'ont pas accès aux pensées de {{user}} : ils ne réagissent qu'à ce qui est dit, fait ou visible.\n- Le monde et ses personnages vivent sans attendre le joueur : ils prennent des initiatives, poursuivent leurs propres buts et réagissent entre eux, pas seulement à {{user}}. L'histoire avance même quand le joueur hésite.\n- Chaque personnage a sa voix : son vocabulaire, son rythme, ce qu'il tait. Ses répliques portent des intentions, pas des explications.\n- Un ou deux détails concrets (un son, une odeur, un objet) valent mieux que des adjectifs généraux.\n- Fais revenir ce qui a déjà eu lieu : un objet, une promesse, une blessure, une phrase dite plus tôt. Les souvenirs fournis servent à cela.\n- Ouvre ta réponse sur ce que l'action du joueur provoque (une réaction, une réplique, un détail), sans raconter de nouveau ce qu'il vient d'écrire, et ne termine pas toujours de la même façon.\n- Quand une action se répète ou qu'un moment n'apporte rien de neuf (entraînement, trajet, attente), donnes-en le résultat en quelques phrases et avance le temps jusqu'au prochain moment qui compte.\n- Montre les émotions des personnages par leurs gestes et leurs réactions plutôt que de les nommer.\n- Pas de didascalie vide (« Un temps. », « Silence. », « Une pause. ») : une pause se montre par un geste ou un détail concret.";
const STYLE =
  '\n\n# Style\nGestes et actions entre astérisques (*il repose sa tasse*), paroles en texte simple. Dans un tour, le geste précède la parole.';
const IMAGES =
  '\n\n# Images\nAffiche une image avec {{img::code}} seul sur sa ligne, codes listés dans <images_disponibles>. Place-la au fil du récit, là où elle illustre le texte, pas par défaut en tête de réponse.';

// Mode jeu de rôle (regles.md) : l'IA désigne les jets, l'application les lance (dice.js).
const jetBlock = (rules, choices) =>
  '\n\n# Jets de dés\nLes dés sont lancés par l’application, jamais par toi. Caractéristiques de {{user}} : ' +
  rules.join(', ') +
  '. Difficultés : facile, moyen, difficile, très difficile.' +
  (choices
    ? '\n- Dans le bloc <choix>, termine une action risquée par la caractéristique qui convient et sa difficulté, entre parenthèses, en fin de ligne : « … (Caractéristique, difficile) ». Une action sans risque n’en a pas.'
    : '') +
  '\n- Quand le message du joueur contient un bloc <jet>, raconte l’issue de son action selon ce résultat, sans le contredire : une réussite critique va au-delà de l’espéré, un échec critique ajoute une complication.' +
  '\n- Quand le joueur tente de lui-même une action risquée, sans <jet>, n’en raconte pas l’issue : montre l’instant d’avant en deux ou trois phrases, puis termine ta réponse par <jet>Caractéristique, difficulté</jet>' +
  (choices ? ' à la place du bloc <choix>.' : '.');

export const DEFAULT_CHOICE =
  'Trois propositions courtes, de registres différents (par exemple une audacieuse, une prudente, une inattendue), écrites à la première personne, chacune sous la forme *un geste* suivi de ce que dit le personnage.';
export const DEFAULT_FIELDS = 'Lieu, Objectif, Humeur';

// Formats de sortie imposés par l'application (partie fixe du prompt système).
export function protocol({ stat = false, fields = '', choices = false, prompt = '', images = false, rules = [] } = {}) {
  return (
    NARRATION +
    STYLE +
    (images ? IMAGES : '') +
    (stat ? stateBlock(fields || DEFAULT_FIELDS, choices) : '') +
    (choices ? choiceBlock(prompt || DEFAULT_CHOICE) : '') +
    (rules.length ? jetBlock(rules, choices) : '')
  );
}

const MARKS = [
  ['<choix>', 'le format des choix'],
  ['<etat>', "le format de l'état"],
  ['{{img::', 'la syntaxe des images']
];
export const conflicts = t => MARKS.filter(([k]) => (t || '').includes(k)).map(x => x[1]);
