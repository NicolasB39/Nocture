# Personnages, fiches et images

## Les deux niveaux

Chaque personnage existe à deux niveaux, et c'est ce qui permet d'en avoir beaucoup sans ruiner le budget.

**Le casting** est envoyé en permanence : une ligne par personnage, tirée de l'en-tête `résumé:`. L'IA sait donc toujours qui peuple le monde et peut faire entrer qui elle veut.

**La fiche complète** n'arrive que lorsque le personnage est en scène, c'est-à-dire quand son nom ou un de ses mots-clés apparaît dans les six derniers messages ou dans le panneau d'état.

Conséquence directe sur l'écriture : le `résumé:` doit suffire à donner envie de faire entrer le personnage, et à le faire entrer juste. Une ligne molle et il n'apparaîtra jamais ; une ligne qui ment et il apparaîtra mal.

```
résumé: herboriste du village, amie d'enfance du joueur, sait pour le naufrage
```

Dix à quinze mots. Qui, où, et le ressort dramatique.

## Écrire la fiche

```markdown
résumé: gardien du port, méfiant envers les étrangers, boit depuis la mort de son frère
mots-clés: Ozenn, le gardien, le vieux du port
toujours: non

# Ozenn

## Apparence
Soixante ans, les épaules basses, une vareuse qu'il ne quitte jamais.

## Voix
Phrases courtes. Ne répond pas aux questions directes du premier coup.
Dit « petit » ou « petite » à {{user}} quand il est de bonne humeur.
Exemple de réplique : « T'as vu l'heure ? La marée attend personne, petit. »

## Ce qu'il sait
- Le phare s'est éteint trois nuits avant le naufrage.
- Il n'en a jamais parlé à personne.

## Ce qu'il veut
Qu'on lui fiche la paix. Et que quelqu'un finisse par poser la bonne question.

## Lignes à ne pas franchir
Ozenn ne révèle jamais spontanément ce qu'il sait du phare. Il faut l'y amener.
```

### La réplique d'exemple

Une ligne `Exemple de réplique : « … »` dans la section Voix est le moyen le plus sûr de fixer une voix. Une description (« sarcastique », « poli ») laisse l'IA retomber sur sa voix par défaut, la même pour tous ; une vraie réplique lui donne le rythme, le registre et les tics. Écrivez-la dans une situation typique du personnage, sans révéler de secret. Deux personnages d'un même scénario ne doivent pas pouvoir échanger leurs répliques. Un personnage qui ne parle pas (un animal, un dragonneau) reçoit à la place un « Exemple de réaction : *…* », un geste typique.

### Le compagnon

Un personnage qui accompagne le joueur en permanence attire l'intrigue : sans consigne, l'IA lui fait choisir l'itinéraire et prendre les décisions. Ajoutez à ses « Lignes à ne pas franchir » : « Il ne guide pas : il donne son avis une fois, puis laisse {{user}} choisir, ou refuse et reste sur place. »


## Images

### Ce que l'application en fait

Une image de personnage **détourée** (fond transparent) s'affiche en scène : posée sur le décor du lieu courant (voir `decors.md`). Dans la conversation, l'application place le personnage sur la ligne des 2/3 à droite, la taille en bas ; dans la fenêtre Personnages, elle le centre. Elle mesure la silhouette elle-même : vous n'avez rien à cadrer, il suffit que l'image contienne le personnage seul, en buste coupé à la taille par le bas de l'image.

Une image **à fond plein** (un JPG, ou un PNG sans transparence) s'affiche seule, en pleine largeur, sans décor derrière. C'est l'ancien fonctionnement, toujours accepté, mais elle ne profite pas des décors.

### Style et format, non négociables

- **Style : anime réaliste.** Traits d'animation japonaise contemporaine, mais anatomie, lumière et matières crédibles. Pas de cel-shading plat, pas de chibi, pas de rendu photographique non plus.
- **Personnages : détourés, en buste coupé à la taille, expressions marquées, format vertical 2:3** (1024 × 1536 par exemple), exportés en **PNG ou WebP avec transparence**. Pas d'ombre portée au sol.
- **Décors : 16/9, sans personnage**, dans `decors/` et non plus dans `personnages/`.
- **Couverture : 3/4**, sujet centré.
- Cohérence avant qualité : mieux vaut six images du même style qu'une superbe et cinq dépareillées. Un même bloc de style en tête de tous les prompts, et une même lumière (venant de la gauche) pour les personnages et les décors.

Les gabarits de prompts, pour chaque sorte d'image, sont dans `images.md`.

**La couverture est l'exception.** `cover.webp` se recadre en 3/4 sur la carte de la liste, en 16/10 sur la carte « Reprendre » et en 16/9 en tête de conversation. Livrez-la en **3/4** (600 × 800) avec le sujet bien centré verticalement, sans quoi les deux autres recadrages le décapiteront.

### Nommage

Une image se nomme librement ; son code est `<dossier>_<fichier>` en minuscules.

```
personnages/Maren/sourire.png    →   maren_sourire
personnages/Ozenn/colere.png     →   ozenn_colere
```

Vous n'écrivez ces codes nulle part : l'application injecte la liste de ceux dont le personnage est en scène, et impose seule la syntaxe `{{img::...}}`. Un personnage absent de la scène ne voit pas ses codes proposés, ce qui évite les confusions.

Trois expressions suffisent pour commencer : une neutre, une positive, une fermée. Nommez-les de façon prévisible et homogène d'un personnage à l'autre (`neutre`, `sourire`, `ferme`…), et gardez **la même pose et le même cadrage** d'une expression à l'autre : seul le visage doit changer quand l'IA passe de l'une à l'autre.

**Une seule planche par personnage.** Générez toutes les expressions d'un personnage en une image : le même personnage répété côte à côte, une expression par silhouette. Une seule génération garde le visage, la tenue et la lumière identiques, ce que des générations séparées ne garantissent pas. Générez-la sur fond vert d'incrustation uni (#00FF00), gardez le PNG d'origine, puis découpez-la :

```
node scripts/decouper.mjs planche-maren.png "scenarios/Le Phare d'Arvor/personnages/Maren" neutre sourire ferme
```

Le script retire le fond uni, repère les silhouettes de gauche à droite et écrit une image détourée par nom, verticale 2:3, personnage centré. Le gabarit de la planche est dans `images.md`. Ne laissez pas la planche dans le dossier du personnage : elle deviendrait une expression de plus.

Formats acceptés : `.webp`, `.png`, `.jpg`, `.jpeg`, `.gif`. Pour un personnage détouré, prenez le PNG ou le WebP : le JPG n'a pas de transparence, et celle du GIF est crénelée.

### Les lieux

Les images de lieux ne vont plus dans `personnages/`. Elles vont dans `decors/`, et c'est l'application qui les choisit d'après le lieu de la scène. Voir `decors.md`.
