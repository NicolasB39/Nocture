# Écrire systeme.md

## Le squelette

Quatre sections, dans cet ordre. Les trois premières sont presque obligatoires, la quatrième est l'histoire elle-même.

```markdown
# Le Phare d'Arvor

Rôle : assistant, maître du jeu et narrateur. Vous incarnez le monde et tous
les personnages non joueurs d'une fiction interactive. Décrivez les lieux,
évaluez les choix de {{user}}, faites avancer l'histoire.

## Prémisse et ton
- Cadre : (le pitch en deux phrases)
- Ton : (trois ou quatre adjectifs, pas davantage)

## Prose et garde-fous
- Personne : deuxième personne du singulier (« vous »).
- Longueur : 150 à 300 mots par tour. Terminez sur une ouverture claire.
- Agentivité : le joueur décide seul de ce que fait, dit, pense et ressent
  {{user}}. Narrez le monde, les réactions des PNJ et les conséquences de ses actes.
- Anti-télépathie : les PNJ n'ont aucun accès aux pensées de {{user}}. Ils ne
  réagissent qu'à ce qui est dit, fait ou visible.
- Dialogues entre guillemets « ».

## Rythme
- (ce que contient une journée : combien de scènes, lesquelles)
- (qui agit hors de la vue du joueur, et comment il l'apprend)
- (comment l'heure avance, quand le Jour change)

## Le monde
(le reste : lieux, factions, mécaniques, boucle de jeu)
```

La ligne de rôle compte : elle dit à l'IA ce qu'elle est avant qu'elle ne lise quoi que ce soit d'autre.

L'agentivité est écrite en positif : dire ce que fait le joueur et ce que fait le narrateur marche mieux qu'une liste d'interdits, et laisse au narrateur l'audace de faire réagir le monde.

### La section Rythme

C'est elle qui fait avancer l'histoire. Le bloc « Narration » de l'application pose des règles générales (une scène tient en cinq ou six échanges, puis une ellipse) ; le scénario dit ce qu'une journée **de cette histoire** doit contenir. Sans elle, l'IA s'attarde sur chaque geste : un journal réel a compté 70 tours pour une seule matinée, sans que l'intrigue principale n'arrive jamais.

Quatre lignes suffisent, concrètes et vérifiables :

```markdown
## Rythme
- Le champ Heure du panneau (« 8h40 ») avance à chaque réponse : quelques minutes pour un échange, une demi-heure ou plus pour un trajet ou une scène. Le soir venu, {{user}} rentre ou passe la nuit quelque part, et le Jour augmente au réveil. Une heure donnée dans le récit (horloge, montre, « il reste trois heures ») est celle du bloc d'état de la même réponse : fixe l'Heure d'abord, puis compte depuis elle.
- Une journée compte trois ou quatre scènes, dont une liée à l'enquête et une où Maren ou Ozenn agit de sa propre initiative.
- Entre deux scènes, Maren et Ozenn avancent leurs propres affaires hors de la vue de {{user}} ; {{user}} en découvre les effets (une rumeur, un message, une visite).
- Une filature ou une fuite se règle en trois échanges : semés, rattrapés ou marché conclu.
```

- **Nommez les personnages** qui doivent agir : « les PNJ prennent des initiatives » reste lettre morte, « Dussault, Inès ou Kaël agit de sa propre initiative » les fait entrer en scène.
- **Le hors-champ** est ce qui fait vivre le monde : un personnage qui a avancé ses affaires pendant que le joueur était ailleurs arrive avec du neuf.
- **Une récompense concrète** (un niveau, un objet nommé, un chiffre) vaut mieux qu'une promesse vague, que l'IA oublie.
- Pas de « Pas de téléportation : décrivez le trajet » : c'est l'inverse qui manque presque toujours. Un trajet tient en une phrase.

Les gestes entre astérisques ne figurent pas dans le squelette : l'application les demande déjà (l'application rend `*texte*` en teinte distincte). Une préférence propre au scénario, comme les guillemets « » pour les dialogues, tient en une ligne.

## Ce qui ne va pas dedans

| Tentation | Où ça va vraiment |
|---|---|
| « Termine par un bloc `<etat>` avec Lieu, Santé… » | `etat.md`, la liste des champs seulement |
| « Propose trois choix numérotés en fin de réponse » | réglage « Proposer trois choix » du scénario |
| « Pour afficher une image, écris `{{img::code}}` » | rien à écrire, l'application s'en charge |
| « Codes disponibles : maren_sourire, ozenn_dos… » | rien à écrire, injectés selon les personnages en scène |
| La fiche détaillée de chaque personnage | `personnages/<Nom>/fiche.md` |
| Un secret à révéler au bon moment | `lorebook/` avec des mots-clés |
| « Gestes et actions entre astérisques » | rien à écrire, l'application le demande |
| « Faites agir les PNJ », « variez vos tours », « détails concrets » | rien à écrire, c'est le bloc « Narration » de l'application ; gardez seulement ce qui est propre au scénario (un gag récurrent, un registre, un rythme) |
| « Lancez un d20 », « l'action réussit sur 12 », « le joueur a 20 pièces d'or » | `regles.md`, `inventaire.md` (voir `modes.md`) ; dans `systeme.md`, seulement ce qui fixe la difficulté et ce qu'un échec coûte dans ce monde |
| « Indique la situation entre crochets », « [Action risquée : …] » | rien : l'état et les jets ont leurs blocs ; les crochets restent pour un élément de la fiction (messages d'un Système) |

Le prompt système part **à chaque tour**, en entier. Tout ce qui peut être déclenché au bon moment doit l'être.

## Les outils de mise en forme

L'IA lit le Markdown, les balises XML et le pseudo-code, et les traite différemment.

### Markdown : hiérarchie et poids

- `#`, `##`, `###` créent des chapitres et sous-chapitres. L'IA s'en sert pour savoir ce qui dépend de quoi.
- Un tiret suivi d'une espace crée une puce, que l'IA lit comme une règle.
- `**gras**` signale une priorité plus haute. Ne le gaspillez pas.
- Une énumération séparée par des virgules met tous ses éléments au même poids. Séparez donc le superficiel du structurant.

### XML : forcer l'attention

Une section entourée d'une balise reçoit un traitement nettement plus appuyé que du Markdown seul. À réserver aux directives que l'IA ne doit jamais contourner, parce que l'effet s'érode si tout est balisé.

```xml
<garde_fou>
Nul ne sait que {{user}} a vu le naufrage : c'est le moteur de l'enquête.
1. Les PNJ ne peuvent pas deviner ce que {{user}} tait.
2. Un PNJ ne peut l'apprendre que si {{user}} le dit à voix haute ou laisse
   une trace matérielle.
3. Exception : Ozenn remarque les mains tremblantes, sans en comprendre la cause.
</garde_fou>
```

Nommez la balise d'après son contenu, en minuscules avec des tirets bas. Deux ou trois blocs de ce type par scénario, pas dix.

La balise suffit à marquer l'importance. N'y ajoutez ni « DIRECTIVE CRITIQUE », ni capitales, ni « JAMAIS » : avec les modèles Claude actuels, un prompt alarmé rend la narration prudente et timide, et quand tout est critique, plus rien ne l'est. Donnez plutôt la raison de la règle, en une demi-phrase : le modèle l'applique mieux, y compris dans les cas qu'elle n'a pas prévus.

### Pseudo-code : conditions

Les mots SI, ET, ALORS en majuscules signalent une séquence conditionnelle, que l'IA vérifie à chaque tour.

```
SI [Lieu : la jetée] ET [Jour : 5] ET [Corne : non sonnée] ALORS [Déclencher : la marée noire]
```

Les crochets délimitent sans ambiguïté. Utile pour les événements à retardement. Placez ces règles dans le lorebook plutôt que dans le prompt système quand elles ne concernent qu'une partie de l'histoire.

## Jouer aux forces du modèle, pas contre

- **Pas de hasard.** L'IA ne tire pas de nombres aléatoires : elle imite le hasard, avec des biais visibles. Remplacez « 30 % de chances que le garde vous repère » par une condition explicite sur l'état du monde.
- **Pas de comptabilité fine.** Multiplicateurs, points de vie au point près, économies chiffrées : elle dérive. Préférez des paliers qualitatifs (« épuisé, fatigué, dispos ») que le panneau d'état suit très bien.
- **Oui aux conséquences.** Elle excelle à relier un choix ancien à une scène présente, surtout si le fait est dans les souvenirs ou le panneau d'état.
- **Oui aux PNJ qui résistent.** Dites explicitement qu'ils peuvent refuser, mentir, être en désaccord. Sans cela, ils cèdent à tout.
- **Oui aux PNJ qui veulent quelque chose.** Le bloc « Narration » de l'application leur demande de prendre des initiatives ; c'est le « Ce qu'il veut » de leur fiche qui leur en donne la matière.
- **Oui au monde qui bouge hors champ.** Des événements à retardement (`SI … ALORS`, de préférence dans le lorebook) font avancer l'histoire même quand le joueur hésite.

## Longueur

Visez 2 000 à 6 000 caractères. En dessous, l'histoire manque de matière. Au-delà, le prompt système mange le budget de l'historique à chaque tour, et les fiches comme le lorebook sont faits pour recevoir le surplus.

Une discipline utile : tout ce qui ne concerne qu'un lieu, un personnage ou un moment ne va pas dans `systeme.md`.
