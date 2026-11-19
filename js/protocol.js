import { API, S, app } from './state.js';

// Modèle de narration : celui du scénario ouvert, sinon celui des Réglages.
export const modelOf = (s = app.cur) => s?.model || S.model || API.m;

// Le lieu arrive avec l'état, en fin de réponse : trop tard pour l'affichage progressif. Quand il change,
// une balise <lieu> en tête l'annonce dès les premiers mots (intertitre, lettrine, décor) ; l'état reste en
// fin de réponse, pour suivre ce qui s'y passe.
const lieuBlock = fields => {
  const f = fields.match(/(?:^|,\s*)((?:lieu|endroit|localisation|position)[^,]*)/i)?.[1].trim();
  return f
    ? '\nQuand le lieu change, ouvre ta réponse par <lieu>nouveau lieu</lieu> seul sur sa ligne (même valeur que le champ ' + f + ') ; sinon, pas de balise ni de mention du lieu.'
    : '';
};
const stateBlock = (fields, choices) =>
  '\n\n# État\nAprès la narration' +
  (choices ? ', avant le bloc <choix>' : '') +
  ', ajoute un bloc qui commence par <etat> et finit par </etat> (jamais en lignes nues ni entre crochets dans le récit), listant « Champ: valeur », un par ligne, en quelques mots par champ. Champs : ' +
  fields +
  ". Une valeur bornée s'écrit 80/100." +
  lieuBlock(fields);
const choiceBlock = prompt =>
  '\n\n# Choix\nTermine par un bloc <choix> de trois actions numérotées pour le personnage du joueur, seul endroit où tu le fais agir ou parler, toujours à la première personne (« Je… », jamais « Vous… »). Ne les recopie pas en liste dans le récit. ' + prompt;
// Conseils de narration, communs à tous les scénarios : le scénario donne le monde et le ton, ceci le mouvement.
// Une consigne par ligne, jointes par des retours à la ligne dans le prompt envoyé.
const NARRATION =
  '\n\n' +
  [
    '# Narration',
    "- Le joueur décide seul de ce que fait, dit, pense et ressent {{user}} : ce qu'il écrit est une tentative, dont tu narres le résultat et les réactions, jamais la suite de ses gestes ni une réplique qu'il n'a pas écrite. Tu joues tout le reste.",
    "- Ta première phrase dit ce que l'action du joueur provoque, sans redire son geste ni ses paroles (« Vous poussez la porte… », « Vous lui demandez… »). Ta dernière ne reprend ni l'image ni le sujet de tes deux fins précédentes : termine sur une information nouvelle, un dilemme ou le geste d'un personnage qui appelle une réaction.",
    "- Sauf exception prévue par le scénario, les personnages n'ont pas accès aux pensées de {{user}} et ne savent que ce qu'ils ont vu ou appris : ils ne réagissent qu'à ce qui est dit, fait ou visible, doutent des rumeurs et peuvent se tromper.",
    "- Personne n'admire {{user}}, ne lui obéit ni ne le hait sans raison : ses actes changent peu à peu sa réputation, selon ce qu'on en voit ou en apprend, et chacun y réagit à sa façon. Chacun défend ses intérêts et ses idées : il ne change pas d'avis parce que {{user}} insiste, mais sur un argument, un fait nouveau ou un jet réussi.",
    "- Le monde vit sans attendre le joueur : les personnages prennent des initiatives, poursuivent leurs buts et réagissent entre eux ; ce qui arrive hors de la vue de {{user}} lui parvient par une nouvelle, une rumeur, un message ou une visite. Chacun a sa voix (vocabulaire, rythme, ce qu'il tait), des répliques qui portent des intentions, et une attitude qui évolue au lieu de se répéter.",
    "- Montre plutôt que nommer : un ou deux détails concrets plutôt que des adjectifs, les émotions par les gestes, une pause par un geste (jamais « Un temps. », « Silence. »). Un détail déjà décrit ne revient que s'il a changé ; des scènes plus tard, fais revenir un objet, une promesse, une phrase dite plus tôt.",
    "- Ce qui se répète ou n'apporte rien de neuf (entraînement, trajet, attente) se résume en quelques phrases. Une scène tient en cinq ou six échanges, puis aboutit du côté du monde (enjeu obtenu, perdu ou remis à plus tard) ; quand le joueur la quitte, passe par une ellipse au prochain moment qui compte. Quand le joueur veut partir, il part : un personnage peut le retenir une fois, pas davantage, puis le suivre ou le relancer plus tard."
  ].join('\n');
const STYLE =
  '\n\n# Style\nParoles entre guillemets « », le reste du récit en texte simple : dans le récit, pas d’astérisques, réservés au geste qui ouvre chaque choix. Dans un tour, le geste précède la parole. Pas de note de jeu dans le récit (« [Situation : …] », « [Action risquée : …] ») : l’état et les jets ont leurs blocs. Les messages que le scénario met entre crochets restent permis.';
const IMAGES =
  '\n\n# Images\nAffiche une image avec {{img::code}} seul sur sa ligne, codes listés dans <images_disponibles>. Place-la juste après le paragraphe où ce personnage, ou ce monstre, agit ou parle.';

// Mode jeu de rôle (regles.md) : l'IA désigne les jets, l'application les lance (dice.js).
const jetBlock = (rules, choices) =>
  '\n\n# Jets de dés\nLes dés sont lancés par l’application, jamais par toi. Caractéristiques de {{user}} : ' +
  rules.join(', ') +
  '. Difficultés : facile, moyen, difficile, très difficile.' +
  (choices
    ? '\n- Dans le bloc <choix>, termine une action risquée par la caractéristique qui convient et sa difficulté, entre parenthèses, en fin de ligne : « … (Caractéristique, difficile) ». Une action sans risque n’en a pas ; face à un danger, un des choix, et un seul, porte cette parenthèse.'
    : '') +
  '\n- Quand le message du joueur contient un bloc <jet>, raconte l’issue de son action selon ce résultat, sans le contredire : une réussite critique va au-delà de l’espéré, un échec critique ajoute une complication. Un échec change la situation (l’obstacle se ferme, se déplace ou coûte quelque chose) : la même action ne se retente pas.' +
  '\n- Quand le joueur écrit de lui-même une action, sans <jet>, raconte son issue sans dé, sauf si un échec changerait la suite (danger, adversaire, perte). Dans ce cas seulement, ne raconte ni son geste ni l’issue : montre en 60 mots au plus ce que fait le monde à cet instant (l’obstacle, l’adversaire), même si le scénario demande des réponses plus longues, et termine ta réponse par <jet>Caractéristique, difficulté</jet>' +
  (choices ? ' à la place du bloc <choix>.' : '.') +
  ' Ne termine jamais deux réponses de suite par une demande <jet>, et n’en fais jamais pour une action que le joueur n’a pas tentée.';

// Mode Inventaire (inventaire.md) : l'application tient les quantités, le narrateur signale les changements.
const invBlock = () =>
  "\n\n# Inventaire\nL'application tient l'inventaire de {{user}} : son état exact arrive à chaque tour dans <inventaire_actuel>. {{user}} n'utilise, ne donne ni ne dépense que ce qu'il possède ; s'il tente d'utiliser ce qu'il n'a pas, raconte qu'il ne l'a pas. Après la narration, signale chaque gain ou perte (objet trouvé, acheté, donné, consommé, cassé) par un bloc <inventaire>+1 Corde, −5 Or</inventaire> ; pas de bloc quand rien ne change. Un gain ou une perte se signale une seule fois, dans la réponse où il arrive : quand l'objet revient ensuite dans le récit, <inventaire_actuel> le compte déjà. Ne recopie l'inventaire ni dans le récit ni dans l'état.";
// Mode Liens (liens.md) : le lien de chaque personnage à fiche avec le joueur, tenu par l'application.
const lienBlock = (min, max) =>
  "\n\n# Liens\nL'application tient le lien de chaque personnage à fiche avec {{user}}, de " +
  min +
  ' (hostile) à ' +
  max +
  " (dévoué) : les valeurs actuelles et les paliers atteints arrivent dans <liens_actuels>, que tu ne recopies pas. Quand un geste ou une parole de {{user}} compte vraiment pour un personnage (aide réelle, promesse tenue ou trahie, risque pris pour lui ou contre lui), signale-le après la narration par <lien>Nom +1</lien> (ou −1), rarement : un compliment, une politesse ou un service isolé ne suffisent pas, le lien se construit sur la durée. Fais sentir le lien dans la façon dont chacun parle à {{user}} ; un palier atteint ouvre ce qu'il décrit.";

export const DEFAULT_CHOICE =
  "Trois propositions courtes, chacune commence par *un geste*, suivi d'une réplique seulement quand elle sert. Deux poursuivent la scène dans des registres différents ; la troisième la quitte : elle change de lieu, saute dans le temps ou tranche la question en cours. Face à un danger, l'une d'elles est une action physique risquée.";
export const DEFAULT_FIELDS = 'Lieu, Objectif, Humeur';

// Règles d'écriture communes : placées par prompt.js juste après le scénario, avant les fiches et le lorebook,
// pour qu'elles se lisent avec les règles de prose du scénario.
export const narration = () => NARRATION + STYLE;
// Formats de sortie imposés par l'application (partie fixe du prompt système), placés après les fiches et le lorebook.
export function protocol({ stat = false, fields = '', choices = false, prompt = '', images = false, rules = [], inv = false, liens = null } = {}) {
  return (
    (images ? IMAGES : '') +
    (stat ? stateBlock(fields || DEFAULT_FIELDS, choices) : '') +
    (choices ? choiceBlock(prompt || DEFAULT_CHOICE) : '') +
    (rules.length ? jetBlock(rules, choices) : '') +
    (inv ? invBlock() : '') +
    (liens ? lienBlock(liens.min, liens.max) : '')
  );
}

const MARKS = [
  ['<choix>', 'le format des choix'],
  ['<etat>', "le format de l'état"],
  ['<inventaire>', "le format de l'inventaire"],
  ['<lien>', 'le format des liens'],
  ['{{img::', 'la syntaxe des images']
];
export const conflicts = t => MARKS.filter(([k]) => (t || '').includes(k)).map(x => x[1]);
