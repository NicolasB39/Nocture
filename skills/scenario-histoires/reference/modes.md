# Modes de jeu : dés, inventaire, liens

Trois fichiers facultatifs, à la racine du scénario, activent des mécaniques que l'application tient elle-même. Le narrateur reçoit leurs consignes dans la partie fixe du prompt : **n'écrivez rien sur les dés, l'inventaire ou les liens dans `systeme.md`**, sinon il reçoit deux versions de la même règle.

Chaque mode a un coût : une consigne de plus dans la partie fixe (en cache), et pour l'inventaire et les liens quelques lignes à chaque tour. Ne les activez que si l'histoire en tire quelque chose.

## Jeu de rôle : regles.md

Les caractéristiques du personnage du joueur, sur une ligne, séparées par des virgules, huit au plus. Les lignes qui commencent par `#` sont des commentaires.

```
Vigueur, Adresse, Esprit, Présence, Volonté
```

Ce que fait l'application :

- l'IA ne lance jamais les dés : elle désigne le jet, l'application le lance (d20 + bonus de la fiche) ;
- dans les choix, une action risquée se termine par « (Adresse, difficile) » ; un seul choix au plus porte cette marque ;
- quand le joueur écrit lui-même une action, l'IA la résout sans dé, sauf si un échec changerait la suite (danger, adversaire, perte) : elle montre alors l'instant d'avant en 60 mots au plus et demande le jet ; jamais deux réponses de suite, et un obstacle raté ne se retente pas ;
- difficultés : facile, moyen, difficile, très difficile. Le joueur répartit trois points sur sa fiche (de −1 à +2 par caractéristique).

Dans `systeme.md`, vous pouvez dire ce qui fixe la difficulté dans votre monde (écart de rang, préparation, terrain) et ce qu'un échec coûte (blessure légère, perte d'un objet, jamais la mort). Pas la mécanique elle-même.

## Inventaire : inventaire.md

Une ligne par objet ou ressource, avec sa quantité de départ ; vingt lignes au plus. Une borne (`/10`) et une baisse par jour sont facultatives.

```
# Ce que possède le personnage au début.
Or: 20
Corde: 1
Énergie: 8/10
Rations: 3, −1 par jour
```

- Le narrateur reçoit l'inventaire exact à chaque tour et signale les gains et les pertes ; l'application tient les comptes (jamais sous zéro, une dépense impossible est ignorée).
- La baisse par jour suit le champ **`Jour`** du panneau : sans ce champ dans `etat.md`, rien ne baisse tout seul.
- N'ajoutez pas l'inventaire au panneau d'état (`etat.md`) : il a sa propre feuille.

Gardez des objets qui comptent pour l'histoire : une ressource qui s'épuise, un objet qui ouvre une porte, une monnaie. Pas le contenu détaillé des poches.

## Liens : liens.md

Une jauge de lien entre chaque personnage à fiche et le joueur, de −3 (hostile) à +3 (dévoué) par défaut. Le fichier, même vide, active le mode ; il peut changer l'échelle et décrire des paliers.

```
# Lien de chaque personnage avec vous. Tous commencent à 0.
Échelle : −3 à 3
Inès, à +2 : elle vous couvre devant l'Agence
Inès, à −2 : elle refuse de vous soigner tant que vous ne lui dites pas la vérité
Kaël, à +2 : il retient enfin votre nom
```

- Le nom d'un palier est celui du dossier du personnage (ou un nom approchant) ; un nom sans fiche est ignoré.
- Un palier positif est atteint à cette valeur ou au-dessus, un négatif à cette valeur ou au-dessous. Le narrateur reçoit les paliers atteints : écrivez-les comme ce qu'ils **ouvrent** dans l'histoire (une confidence, une trahison, une aide), pas comme un sentiment.
- Deux ou trois paliers par personnage important suffisent, dans les deux sens.
- Le narrateur ne bouge un lien que pour un acte qui compte (aide réelle, promesse tenue ou trahie, risque pris), jamais pour un compliment ou un service isolé : placez les paliers en conséquence, un +2 se gagne sur plusieurs scènes.

## Intro : intro.md

Facultatif, affiché avant le premier tour : une accroche, puis jusqu'à trois débuts proposés, un par ligne commençant par `-` ou `1.`.

```
Novembre. La corne de brume s'est tue depuis trois nuits, et le village vous regarde de travers.

- *Je monte au phare avant l'aube, comme chaque matin, et je trouve la porte de la lanterne entrouverte.*
- *Je descends au port. Ozenn est déjà sur le quai ; je m'arrête à sa hauteur.* « Vous l'avez entendue, vous, la corne ? »
- *Je frappe à la porte de Maren, qui m'a fait signe hier sans un mot.*
```

Chaque début est le premier message du joueur, écrit comme un choix : à la première personne, le geste entre astérisques, une réplique éventuelle entre guillemets. Il pose une situation et laisse la suite au narrateur.
