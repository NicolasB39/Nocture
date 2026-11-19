# Arborescence et syntaxe

Tout vit dans le dépôt GitHub de l'application, sous `scenarios/`. Un workflow régénère `index.json` à chaque publication : l'application ne voit que les fichiers listés dedans.

```
scenarios/
  Le Phare d'Arvor/          ← le nom du dossier devient le nom du scénario
    systeme.md               ← obligatoire, sinon le scénario n'apparaît pas
    cover.webp               ← optionnel : vignette et en-tête (3/4, voir personnages.md)
    etat.md                  ← optionnel : champs du panneau d'état
    regles.md                ← optionnel : caractéristiques, active les dés (voir modes.md)
    inventaire.md            ← optionnel : objets de départ, active l'inventaire (voir modes.md)
    liens.md                 ← optionnel : échelle et paliers, active les liens (voir modes.md)
    intro.md                 ← optionnel : accroche et débuts proposés avant le premier tour
    avatar.md                ← optionnel : description du personnage du joueur
    images.md                ← optionnel, ignoré par l'application : bloc de style et prompts
    personnages/
      Maren/
        fiche.md             ← fiche détaillée, avec en-têtes
        sourire.png          ← détourée, en buste · code image : maren_sourire
        colere.png           ← code image : maren_colere
      Ozenn/
        fiche.md
    monstres/                ← optionnel : images de monstres, à plat, sans fiche
      kraken.webp            ← code image : monstre_kraken
    decors/                  ← choisis par l'application d'après le lieu, jamais par l'IA
      phare.webp             ← 16/9, sans personnage
      phare.md               ← optionnel : « Mots-clés : phare, salle de veille »
      defaut.webp            ← optionnel : fond quand aucun décor ne correspond
    lorebook/
      la-corne-de-brume.md   ← un fichier par entrée, à plat
      le-naufrage.md
```

## Règles de nommage

- Le nom du dossier est affiché tel quel : accents, espaces et apostrophes passent sans problème dans le dépôt. Évitez les deux-points et les barres obliques.
- Les dossiers de personnages suivent la même règle, mais leur nom devient le préfixe des codes d'images, débarrassé de ses accents : `personnages/Élise/neutre.png` donne `elise_neutre`. Un nom sans accent ni espace évite les surprises.
- Les images acceptées sont `.webp`, `.png`, `.jpg`, `.jpeg`, `.gif`, en **style anime réaliste**. Personnages : **détourés** (PNG ou WebP transparent), en buste coupé à la taille, vertical 2:3. Décors : **16/9** dans `decors/`. Couverture : **3/4**. Voir `reference/personnages.md`, `reference/decors.md` et, pour les prompts, `reference/images.md`.
- Le code d'une image est `<dossier>_<fichier>` en minuscules, accents compris : `personnages/Maren/sourire.webp` donne `maren_sourire`.
- Le lorebook ne lit que les `.md` directement dans `lorebook/`, pas dans des sous-dossiers.
- Un dossier de personnage sans `fiche.md` mais avec des images est accepté : il n'apporte que ses codes d'images.
- `decors/` ne lit que les images et les `.md` directement dedans. Un décor n'a pas de code d'image : l'IA ne le voit jamais.
- `monstres/` ne lit que les images directement dedans, sans fiche ni mots-clés : `monstres/kraken.webp` donne `monstre_kraken`. L'IA reçoit ces codes sur une ligne « Monstres » et affiche l'image quand le monstre entre en scène ; la feuille Personnages ne les montre pas. Une image **à fond plein** (le monstre dans son décor, 16/9) s'affiche seule, en pleine largeur ; une image détourée est posée sur le décor du lieu. Deux ou trois monstres typiques par famille suffisent : l'IA en décrit d'autres en texte, sans image. Les monstres se décrivent dans le lorebook ou le prompt système, pas dans ce dossier.

## etat.md

Une seule ligne, les champs séparés par des virgules.

```
Lieu, Objectif, Santé (0/100), Humeur
```

Gardez **`Lieu`** dès que le scénario a des décors : c'est ce champ que l'application lit pour choisir le décor de chaque scène (voir `reference/decors.md`). Sans lui, elle devine le lieu d'après le texte, moins sûrement.

Si le temps compte dans l'histoire, ajoutez **`Jour`** et **`Heure`** (valeur « 8h40 ») :

- un narrateur qui voit l'heure la fait avancer ; sans horloge sous les yeux, il étire une matinée sur des dizaines de tours ;
- l'application teinte les décors selon l'heure (aube avant 8h, soir à partir de 18h, nuit à partir de 21h) ;
- la mémoire date les souvenirs et les rendez-vous d'après le champ `Jour` (ou `Date`), et la baisse quotidienne de l'inventaire le suit.

Dites dans la section Rythme de `systeme.md` comment l'heure avance et quand le Jour change (voir `reference/systeme.md`).

Ces champs sont injectés par l'application dans le format qu'elle impose. N'écrivez pas le gabarit du bloc, seulement la liste. Une valeur bornée s'écrit `80/100` dans la réponse de l'IA, ce qui déclenche l'affichage d'une barre et du delta par rapport au tour précédent.

Trois à cinq champs. Chaque champ est réémis à chaque tour, dans la partie non mise en cache du prompt.

## avatar.md

Du texte libre. Sert à cadrer ce que l'histoire suppose du joueur sans lui retirer sa liberté.

```
Vous êtes gardien ou gardienne de phare depuis trois ans.
Le reste — âge, origine, apparence, nom — vous appartient.
```

Le joueur choisit son nom dans l'application ; `{{user}}` est remplacé partout par ce nom.

## fiche.md d'un personnage

En-têtes optionnels en tête de fichier, un par ligne, avant le texte. Ils s'arrêtent à la première ligne qui n'en est pas un.

```
résumé: herboriste du village, amie d'enfance du joueur
mots-clés: herboriste, apothicaire, la vieille Maren
toujours: non

Maren a soixante ans et les mains tachées de sève…
```

| En-tête | Effet | Défaut |
|---|---|---|
| `résumé:` | la ligne du casting, envoyée en permanence | la première ligne du texte, tronquée à 140 caractères |
| `mots-clés:` | déclencheurs en plus du nom du dossier, séparés par des virgules | le nom du dossier seul |
| `toujours:` | `oui` force l'envoi permanent de la fiche entière | `non` |

`resume`, `resumé`, `mots cles`, `motsclés` sont acceptés : l'application ignore accents et tirets.

## Entrée de lorebook

Mêmes principes, trois en-têtes différents.

```
mots-clés: corne de brume, sirène, brume*
priorité: 2
toujours: non

Quand la corne retentit trois fois…
```

| En-tête | Effet |
|---|---|
| `mots-clés:` | déclencheurs, séparés par des virgules |
| `priorité:` | nombre ; les plus élevés passent en premier quand le nombre d'entrées est plafonné |
| `toujours:` | `oui` injecte l'entrée à chaque tour |

Une entrée sans `mots-clés:` ni `toujours: oui` est ignorée.

**Joker** : un mot-clé terminé par `*` accepte tous les suffixes. `brume*` déclenche sur « brume », « brumes », « brumeux ». Sans l'étoile, le mot doit être entier : « brume » ne déclenche pas sur « brumeux ».

Les mots-clés sont comparés sans accents ni casse. `sirène` déclenche sur « Sirene » comme sur « SIRÈNE ».

## Ce que l'IA reçoit, et dans quel ordre

Connaître cet ordre change la façon d'écrire. Deux zones, séparées par l'historique.

**Avant l'historique** — stable d'un tour à l'autre, donc relu depuis le cache :

1. `systeme.md`
2. le préambule commun de l'utilisateur, s'il en a défini un
3. le casting : une ligne par personnage, le `résumé:` de chaque fiche
4. les fiches et le lorebook `toujours` (ou tous, s'ils sont modestes), et la liste des codes d'images
5. le protocole généré par l'application : conseils de narration, gestes entre astérisques, images, état, choix, et les règles des modes actifs (dés, inventaire, liens)
6. `avatar.md`
7. la mémoire : résumé de l'histoire, lignes récentes, souvenirs, relations, note

**Après l'historique** — recalculé à chaque tour :

8. le dernier message du joueur
9. les entrées de lorebook déclenchées
10. les fiches des personnages en scène, avec leur relation au joueur
11. des passages anciens de l'histoire qui font écho au tour en cours
12. l'état précédent
13. avec les modes : l'inventaire exact et les liens actuels (quelques lignes)

Conséquences pratiques :

- Le casting est toujours là : l'IA sait en permanence qui existe dans le monde et peut faire entrer qui elle veut, même sans la fiche.
- La fiche complète n'arrive que si le nom ou un mot-clé apparaît dans les six derniers messages ou dans le panneau d'état. Écrivez donc des `résumé:` qui suffisent à faire entrer le personnage en scène.
- Tant que l'ensemble des fiches tient dans un petit budget, aucune n'est filtrée. Le déclenchement ne compte que sur les gros scénarios.
- Ce qui est en haut doit être stable. Ne mettez rien dans `systeme.md` qui dépendrait du tour en cours.
