# Écrire un scénario

Comment est organisé un scénario de Nocturne (dossier `scenarios/`), et ce que l'application fournit d'elle-même. Retour au [README](../README.md).

## Structure des scénarios

```
scenarios/
  Mon scenario/
    systeme.md              prompt système (obligatoire)
    cover.webp              couverture (optionnelle, aussi .png ou .jpg)
    etat.md                 champs du panneau d'état (optionnel)
    regles.md               caractéristiques du mode jeu de rôle (optionnel, voir plus bas)
    inventaire.md           objets et ressources du mode Inventaire (optionnel, voir plus bas)
    liens.md                échelle et paliers du mode Liens (optionnel, voir plus bas)
    intro.md                accroche et débuts proposés, affichés avant le premier tour (optionnel)
    avatar.md               description du personnage du joueur, envoyée sous l'en-tête « texte montré au joueur »
    personnages/
      Alice/
        fiche.md            fiche du personnage
        sourire.webp        image, code : alice_sourire
    monstres/               images de monstres, sans fiche (optionnel, voir plus bas)
      noye.webp             code : monstre_noye
    decors/                 décors des scènes (optionnel, voir plus bas)
    lorebook/
      dragon.md
```

Le nom du dossier devient le nom du scénario. Le texte peut contenir `{{user}}` (nom du joueur : celui de l'histoire, dans ses réglages, sinon le « Nom du joueur par défaut » des Réglages de l'application, section Narration, sinon « Joueur »). N'y écrivez pas de consignes sur le format des blocs `<etat>` ou `<choix>` : voir « Protocole et préambule ».

### Fiches de personnages

Une fiche peut commencer par des lignes d'en-tête, comme le lorebook :

```
résumé: herboriste du village, amie d'enfance du joueur
mots-clés: herboriste, apothicaire
toujours: non

Alice a trente ans, les mains tachées de sève…
```

L'IA reçoit **en permanence** la liste de tous les personnages du monde, une ligne chacun (le `résumé:`, ou à défaut la première ligne de la fiche). Elle sait donc toujours qui existe et peut faire entrer qui elle veut.

Tant que l'ensemble des fiches tient dans un budget de 8 000 tokens environ, aucune n'est filtrée : le scénario reçoit toutes ses fiches à chaque tour, dans la partie fixe du prompt, qui reste en cache. Un personnage que l'IA fait entrer d'elle-même est ainsi écrit avec sa fiche complète. Le lorebook suit la même règle, avec le même budget. La partie fixe est relue en cache à prix réduit, alors que la fin de requête est payée plein tarif à chaque tour : des fiches et un lorebook modestes coûtent moins en entier dans la partie fixe que par morceaux en fin de requête (voir [Prompt et cache](technique.md#prompt-et-cache)).

Au-delà du budget, la **fiche complète** n'est envoyée que lorsque le personnage est en scène : son nom ou un de ses mots-clés apparaît dans les six derniers messages ou dans le panneau d'état. `toujours: oui` force l'envoi permanent, pour un compagnon de route par exemple : la fiche passe alors dans la partie fixe et n'est jamais envoyée une seconde fois quand le personnage est en scène.

Les codes d'images de tous les personnages sont envoyés en permanence, regroupés par personnage, dans la partie fixe, avec ceux des monstres (voir Images), et la consigne de n'utiliser que ceux d'un personnage ou d'un monstre présent dans la scène, et de ne pas en inventer pour ce qui n'a pas d'image. L'IA peut ainsi montrer un personnage dès son entrée.

### Images

Les images de `personnages/<Nom>/` (formats `.png`, `.webp`, `.jpg`, `.jpeg`, `.gif`) sont proposées à l'IA sous le code `nom_fichier` (minuscules, sans extension). Un fichier qui commence déjà par le nom du personnage n'est pas préfixé une seconde fois : `maelys/maelys_joie.png` donne `maelys_joie` (le code doublé `maelys_maelys_joie` reste reconnu). L'IA les affiche avec `{{img::alice_sourire}}` seul sur une ligne.

L'application affiche l'image **là où le modèle l'écrit**, en tête, au milieu ou à la fin. Le protocole demande de la placer juste après le paragraphe où le personnage agit ou parle. Si un scénario demande lui-même « commence par l'image » dans son prompt système, cette phrase l'emporte.

La reconnaissance du code est tolérante : majuscules, accents, espaces, tirets et tirets bas sont équivalents (`alice_sourire heureux`, `alice_sourire_heureux` et `Alice-Sourire-Heureux` désignent le même fichier), et le nom du fichier seul suffit s'il est unique (`sourire_heureux`). Quand un code ne correspond à aucune image, un repère « image introuvable : code » s'affiche à la place.

Les images de `monstres/`, à plat, n'ont ni fiche ni réglage : `monstres/noye.webp` donne le code `monstre_noye`. Elles sont proposées à l'IA sur une ligne « Monstres » de la liste des codes, et n'apparaissent pas dans la feuille Personnages. Une image de monstre à fond plein s'affiche seule, avec son propre décor ; détourée, elle est posée sur le décor du lieu comme un personnage.

Après avoir renommé des images :

- Les anciens messages gardent les anciens codes : ils afficheront le repère « image introuvable ». Modifiez le message ou régénérez la réponse.
- Réglages de l'histoire (menu « … »), section « Images détectées » : vignettes et codes exacts vus par l'application, avec le bouton « Recharger l'index » pour relire la liste des fichiers sans fermer l'application. L'index lui-même n'est régénéré qu'au déploiement GitHub (quelques dizaines de secondes après le push).

### Décors

Une image de personnage **détourée** (fond transparent, en `.png` ou `.webp`) s'affiche en scène : un décor en fond, le personnage posé dessus. L'application le détecte elle-même en lisant les pixels du bord de l'image ; une image à fond plein s'affiche seule, sans décor derrière, puisqu'elle contient déjà le sien.

Les décors se rangent dans `scenarios/<scénario>/decors/` :

```
decors/
  taverne.webp
  taverne.md        facultatif : Mots-clés : auberge, comptoir, salle commune
  foret.webp        sans .md, le nom du fichier sert de mot-clé
  defaut.webp       facultatif : fond quand aucun décor ne correspond
```

C'est l'application qui choisit le décor, pas l'IA : elle lit le champ « Lieu » du panneau d'état (ou « Endroit », « Localisation »), et à défaut cherche les mots-clés dans le texte des derniers messages. Les mots-clés suivent les règles du lorebook (accents et majuscules ignorés, mot entier, `chateau*` pour les variantes) ; quand plusieurs décors correspondent, le mot-clé le plus long l'emporte (« forêt de nuit » avant « forêt »). Si rien ne correspond, c'est `defaut.webp`, et sans lui un fond généré aux couleurs du scénario. L'IA ne reçoit pas la liste des décors : cela ne coûte aucun token.

Un champ « Moment » dans `etat.md` (ou « Heure », « Période ») teinte les décors selon l'heure : un même décor sert ainsi à toute la journée (mots reconnus dans [utilisation.md](utilisation.md#mise-en-page-de-la-conversation)).

Chaque message garde le décor de son moment : celui de son propre bloc d'état, sinon le dernier lieu connu avant lui. Relire une ancienne scène montre donc l'ancien décor. Pendant l'écriture, la scène prend le lieu précédent, puis bascule si la réponse annonce un nouveau lieu.

Le personnage, en buste, est centré aux trois quarts de la largeur, à droite, la taille au bas de la scène et la tête près du haut (le buste occupe 94 % de la hauteur). L'application mesure la silhouette elle-même : une image centrée ou avec plus de marge d'un côté donne le même résultat, et un personnage large est décalé juste assez pour rester entier. Chaque scène a des proportions fixes (16/9). Dans la fenêtre Personnages, la pastille et la galerie montrent le personnage centré sur le décor du lieu actuel.

### Lorebook

Chaque fichier `.md` commence par des lignes d'en-tête, puis le texte à injecter :

```
mots-clés: dragon*, épée
priorité: 2

Le dragon dort dans la montagne.
```

- `mots-clés:` liste séparée par des virgules, sans accents ni casse. Recherche par mot entier ; `dragon*` accepte `dragons`, `dragonnet`…
- `toujours` : entrée toujours injectée, sans mot-clé. Elle va dans la partie fixe du prompt, qui reste en cache.
- `priorité: N` : les valeurs les plus hautes passent en premier (défaut 0).

Un lorebook qui tient dans le budget de la partie fixe part en entier, en cache, et les mots-clés ne servent pas. Au-delà, les entrées `toujours` restent dans la partie fixe, et les autres partent en fin de requête quand un de leurs mots-clés apparaît dans les deux derniers messages, par priorité.

## Mode jeu de rôle (regles.md)

Un scénario qui a un fichier `regles.md` se joue avec des jets de dés. Le fichier liste les caractéristiques du personnage, sur une ligne, séparées par des virgules (huit au plus) :

```
Vigueur, Adresse, Esprit, Présence, Volonté
```

L'IA ne lance jamais les dés : un modèle ne sait pas tirer au hasard et choisit presque toujours le résultat qui arrange l'histoire. Elle désigne seulement le jet, et l'application le lance (`js/dice.js`) :

- dans ses choix, une action risquée se termine par sa caractéristique et sa difficulté : « Je force le cadenas (Adresse, difficile) ». Face à un danger, un des choix, et un seul, en porte une. L'application l'affiche en étiquette, avec la chance de réussite d'après la fiche (« Adresse · difficile · 50 % », en rouge sous 35 %) ; toucher le choix lance un d20, ajoute le bonus de la fiche et envoie le résultat avec le message ;
- quand le joueur écrit lui-même une action risquée, l'IA montre l'instant d'avant et finit par `<jet>Adresse, difficile</jet>` : un bouton « Lancer le dé », avec la même chance de réussite, apparaît, et le tour suivant part avec le résultat (et avec le brouillon en cours, s'il y en a un) ;
- le résultat s'écrit dans le message du joueur, `<jet>Adresse, difficile (13) : 14 + 2 = 16, réussite</jet>`, affiché en carte. L'IA raconte l'issue sans la contredire. Un 20 naturel est une réussite critique, un 1 naturel un échec critique.
- un jet raté peut être relancé une fois par jour de fiction : tant que la réponse qui l'a raconté est la dernière, un bouton « Relancer le dé » sous la conversation relance la même caractéristique et refait la réponse. Le jour est lu dans le champ Jour ou Date de l'état ; sans ce champ, la relance revient tous les 20 messages.

Seule l'application lance les dés : un résultat que le narrateur écrirait lui-même est retiré de sa réponse. Une demande de jet mal formée garde son bouton (caractéristique inconnue : bonus nul ; difficulté inconnue : moyen). Une marque placée au milieu d'un choix, avant une réplique ou une ponctuation, est reconnue aussi.

Difficultés : facile (6), moyen (10), difficile (13), très difficile (16), soit 75, 55, 40 et 25 % de réussite sans bonus, 85, 65, 50 et 35 % avec +2 : l'échec reste l'exception sur une action ordinaire. Quand le joueur écrit lui-même une action, l'IA en raconte l'issue sans dé, sauf si un échec changerait la scène : elle amène alors le jet en 60 mots au plus, jamais dans deux réponses de suite, et un obstacle raté ne se retente pas.

La fiche du personnage (menu « … » de la conversation, ou bouton de l'introduction avant le premier tour) répartit trois points : chaque caractéristique va de −1 à +2, et en baisser une rend un point. Une nouvelle partie repart avec une fiche vide. La fiche n'est pas envoyée à l'IA : seuls les résultats le sont, une vingtaine de tokens par jet. Les consignes des jets partent dans la partie fixe du prompt, en cache.

Le mode est réservé aux scénarios GitHub. Pas besoin de décrire les jets dans `systeme.md` : l'application s'en charge, comme pour les choix et l'état.

## Mode Inventaire (inventaire.md)

Un scénario qui a un fichier `inventaire.md` confie l'inventaire à l'application : le narrateur ne peut pas faire apparaître ou disparaître un objet en oubliant ce qu'il a écrit trois tours plus tôt. Une ligne par objet ou ressource, avec sa quantité de départ ; une borne (`/10`) et une baisse par jour sont facultatives (vingt lignes au plus, `#` pour un commentaire) :

```
Or: 20
Corde: 1
Énergie: 8/10
Rations: 3, −1 par jour
```

- À chaque tour, le narrateur reçoit l'inventaire exact (`<inventaire_actuel>`, en fin de requête) avec la règle que {{user}} n'utilise que ce qu'il possède. Les changements de la réponse précédente y sont rappelés comme déjà comptés, et la consigne demande de signaler un gain ou une perte une seule fois.
- Il signale chaque gain ou perte par `<inventaire>+1 Corde, −5 Or</inventaire>` après la narration. L'application l'applique : jamais sous zéro ni au-dessus de la borne, une dépense impossible est ignorée, un objet nouveau s'ajoute.
- La baisse par jour suit le champ « Jour » du panneau d'état (`etat.md`) : quand il passe de 2 à 4, les rations perdent 2. Sans champ Jour, rien ne baisse tout seul.
- La feuille « Inventaire » (menu « … » de la conversation) montre les quantités et les derniers changements ; la carte d'état sous chaque réponse dit ce qu'elle a changé (sans panneau d'état, une ligne discrète sous la réponse).

Chaque réponse garde ses propres changements, et l'inventaire se recalcule depuis le départ (`js/modes.js`) : supprimer, régénérer, modifier une réponse ou bifurquer le corrige de lui-même. L'application ne lit pas le texte du joueur : c'est le narrateur qui refuse un objet qu'on n'a pas, d'après la liste exacte qu'il reçoit.

## Mode Liens (liens.md)

Un scénario qui a un fichier `liens.md`, même vide, donne à chaque personnage à fiche une jauge de lien avec le joueur, de −3 (hostile) à +3 (dévoué) par défaut. Le fichier peut changer l'échelle et décrire des paliers :

```
Échelle : −3 à 3
Inès, à +2 : elle vous confie qu'elle a déserté l'Ordre
Renard, à −2 : il vous dénonce au guet
```

- Le narrateur reçoit les liens actuels et les paliers atteints (`<liens_actuels>`, en fin de requête), et signale un changement par `<lien>Inès +1</lien>`, seulement pour un acte qui compte (aide réelle, promesse tenue ou trahie, risque pris), jamais pour un compliment ou un service isolé. Un nom qui ne désigne aucun personnage à fiche est ignoré.
- La fenêtre Personnages montre la jauge sous chaque personnage, avec les paliers atteints ; la carte d'état sous la réponse (ou, sans panneau d'état, une ligne discrète) dit qui a changé.
- Un palier positif est atteint à cette valeur ou au-dessus, un palier négatif à cette valeur ou au-dessous.

Comme l'inventaire, les liens se recalculent depuis le départ. Les deux modes sont réservés aux scénarios GitHub ; leurs consignes partent dans la partie fixe du prompt, en cache, et seuls l'inventaire et les liens actuels (quelques lignes) partent à chaque tour.

## Protocole et préambule

L'application est propriétaire du **protocole** : les formats du bloc `<etat>`, du bloc `<choix>` et de la syntaxe `{{img::}}` sont produits par `js/protocol.js`, pas par les scénarios. Un `systeme.md` ne décrit que la fiction : le monde, la voix, le registre, le rythme. Faire évoluer un format se fait en un seul endroit, pour tous les scénarios à la fois. Les consignes de format sont concises et les mêmes pour tous les modèles.

Le protocole demande notamment :

- **les paroles entre guillemets « » et le reste du récit en texte simple, sans astérisques**, le geste avant la parole ; l'application affiche le récit du narrateur en gris clair et les paroles en blanc. Dans les choix, le geste reste entre astérisques ; pas de note de jeu entre crochets dans le récit (« [Situation : …] ») ;
- trois choix numérotés dans le bloc `<choix>`, à la première personne (« Je… »), seul endroit où le personnage du joueur agit ou parle, sans les recopier en liste dans le récit ;
- quand le panneau d'état suit un champ « Lieu » (ou Endroit, Localisation, Position), une ligne `<lieu>Nouveau lieu</lieu>` en tête de la réponse quand le lieu change. Cette ligne n'est ni affichée ni gardée : elle installe tout de suite l'intertitre, la lettrine et le décor, alors que l'état n'arrive qu'en fin de réponse.

L'application rattrape les écarts courants :

- Des choix écrits en simple liste numérotée sans la balise `<choix>` : quand le récit se termine par deux ou trois lignes « 1. », « 2. »… qui commencent comme une action du joueur (geste en italique, réplique, « Je »), elles sont prises comme des choix, à la réception comme au chargement des réponses enregistrées (`looseChoices`, `js/format.js`).
- Des choix écrits en liste à la fin du récit **et** dans le bloc `<choix>` : la liste qui les reprend (ou qui en a la forme : « Je… », guillemets) est retirée du récit, avec sa ligne d'annonce (« Vos options : »).
- Un état écrit en lignes nues à la fin de la réponse (« Lieu: … ») est reconnu sur les noms des champs du panneau ; s'il double un bloc `<etat>`, ces lignes sont seulement retirées du récit, le bloc faisant foi.
- Si un `systeme.md` contient encore `<choix>`, `<etat>` ou `{{img::`, l'application le signale à l'ouverture de la conversation et dans la feuille Réglages de l'histoire : l'IA recevrait deux versions du même format, et arbitrerait mal. Retirez ces lignes.

### Consignes du narrateur

Un court bloc « Narration » part pour tous les scénarios (`NARRATION`, `js/protocol.js`). Le scénario donne le monde et le ton, ce bloc le mouvement :

- le joueur seul décide de ce que fait, dit, pense et ressent son personnage : ce qu'il écrit est une tentative, dont le narrateur raconte le résultat et les réactions, sans lui prêter de geste ni de réplique ; seules les propositions de choix le font agir ou parler ;
- la réponse s'ouvre sur ce que provoque l'action du joueur, sans redire son geste ni ses paroles ; sa dernière phrase ne reprend pas l'image ou le sujet des deux fins précédentes ;
- sauf exception prévue par le scénario, les autres personnages n'ont pas accès à ses pensées et ne savent que ce qu'ils ont vu ou appris : ils doutent des rumeurs et peuvent se tromper ;
- personne n'admire le personnage du joueur, ne lui obéit ni ne le hait sans raison : ses actes changent peu à peu sa réputation, et chacun y réagit à sa façon ; chacun défend ses intérêts et ne change pas d'avis parce que le joueur insiste, mais sur un argument, un fait nouveau ou un jet réussi ;
- le monde vit sans attendre le joueur, et ce qui arrive hors de sa vue lui parvient par une nouvelle, une rumeur, un message ou une visite ; chaque personnage a sa voix, et son attitude évolue au lieu de se répéter ;
- montrer plutôt que nommer : détails concrets, émotions par les gestes, pas de didascalie vide (« Un temps. », « Silence. ») ; un détail déjà décrit ne revient que s'il a changé, et ce qui a eu lieu (objet, promesse, phrase) revient des scènes plus tard ;
- ce qui se répète (entraînement, trajet, attente) se résume ; une scène tient en cinq ou six échanges, puis aboutit, et une ellipse mène au prochain moment qui compte ; quand le joueur veut partir, il part (un personnage peut le retenir une fois, pas davantage).

Les choix par défaut en proposent deux qui poursuivent la scène, dans des registres différents, et un troisième qui la quitte (autre lieu, saut dans le temps, question tranchée). Chacun commence par un geste, avec une réplique seulement quand elle sert ; face à un danger, l'un d'eux est une action physique risquée.

### Préambule commun

Le **préambule commun** (Réglages de l'application) est votre texte à vous, ajouté au prompt système de tous les scénarios : longueur des réponses, personne, registre, manies de narration. Un scénario peut s'en affranchir avec « Ignorer le préambule commun », dans la section Narration de ses réglages (la case n'apparaît que si un préambule existe).

Ce qui reste au scénario : tout ce qui touche à la voix. Ce qui passe à l'application : tout ce qui touche à la forme des blocs.

## Skill de création de scénarios

`skills/scenario-histoires/` est le skill Claude qui aide à écrire un scénario : arborescence, prompt système et section Rythme, fiches avec réplique d'exemple, modes, prompts d'images (une planche d'expressions par personnage), et deux scripts sans dépendance :

- `node skills/scenario-histoires/scripts/verifier.mjs "scenarios/<Nom>"` relit un scénario et signale ce qui cloche ;
- `node skills/scenario-histoires/scripts/decouper.mjs planche.png "scenarios/<Nom>/personnages/<Perso>" neutre sourire ferme` découpe une planche d'expressions sur fond uni (vert d'incrustation conseillé) en une image détourée par expression.

Pour l'installer ou le mettre à jour sur claude.ai : `npm run skill` crée `scenario-histoires.zip` (ignoré par git), à téléverser dans les réglages des skills à la place de l'ancien. Après une modification de l'application qui touche aux scénarios, mettre aussi le skill à jour. `npm run scenarios` vérifie tous les scénarios du dépôt (aussi en CI).
