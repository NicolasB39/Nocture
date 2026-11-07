# Écrire un scénario

Comment est organisé un scénario de Nocturne (dossier `scenarios/`), et ce que l'application fournit d'elle-même. Retour au [README](../README.md).

## Structure des scénarios

```
scenarios/
  Mon scenario/
    systeme.md              prompt système (obligatoire)
    cover.webp              couverture (optionnelle)
    etat.md                 champs du panneau d'état (optionnel)
    regles.md               caractéristiques du mode jeu de rôle (optionnel, voir plus bas)
    intro.md                accroche et débuts proposés, affichés avant le premier tour (optionnel)
    avatar.md               description du personnage du joueur
    personnages/
      Alice/
        fiche.md            fiche du personnage
        sourire.webp        image, code : alice_sourire
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

Au-delà du budget de la partie fixe (voir plus bas), la **fiche complète** n'est envoyée que lorsque le personnage est en scène : son nom ou un de ses mots-clés apparaît dans les six derniers messages ou dans le panneau d'état. `toujours: oui` force l'envoi permanent, pour un compagnon de route par exemple : la fiche passe alors dans la partie stable du prompt, qui reste en cache, et n'est jamais envoyée une seconde fois quand le personnage est en scène.

Tant que l'ensemble des fiches tient dans un budget de 8 000 tokens environ, aucune n'est filtrée : le scénario reçoit toutes ses fiches à chaque tour, dans la partie stable. C'est le cas de tous les scénarios du dépôt, Lumencia compris (19 fiches, environ 5 200 tokens) : un personnage que l'IA fait entrer d'elle-même est écrit avec sa fiche complète, pas seulement avec son résumé. Le lorebook suit la même règle, avec le même budget.

La partie stable est relue en cache à un dixième du prix d'entrée au plus (un vingtième sur Sonnet et Opus 5.5, un quarantième sur Fable 5.1), alors que la fin de requête est payée plein tarif à chaque tour. Des fiches et un lorebook modestes coûtent donc moins en entier dans la partie stable que par morceaux en fin de requête : environ 5 % du coût d'un tour en moins sur un scénario comme « Réincarné par le Système » (5 fiches et 11 entrées). Sur Lumencia, avant que le budget passe de 5 000 à 8 000 tokens, un journal de 77 tours montrait environ 555 tokens de fiches envoyées en fin de requête, au prix plein, à chaque tour. Au-delà du budget, tout redevient déclenché par mots-clés.

Les codes d'images de tous les personnages sont envoyés en permanence, regroupés par personnage, dans la partie stable, avec la consigne de n'utiliser que ceux d'un personnage présent dans la scène, et de ne pas en inventer pour un personnage absent de la liste (sans quoi le modèle imite le format, `emily_emily_neutre`, pour un personnage qui n'a pas d'image). L'IA peut ainsi montrer un personnage dès son entrée, sans attendre le tour suivant.

### Images

Les images de `personnages/<Nom>/` (formats `.png`, `.webp`, `.jpg`, `.jpeg`, `.gif`) sont proposées à l'IA sous le code `nom_fichier` (minuscules, sans extension). Un fichier qui commence déjà par le nom du personnage n'est pas préfixé une seconde fois : `maelys/maelys_joie.png` donne `maelys_joie`, et l'ancien code doublé `maelys_maelys_joie` reste reconnu dans les messages déjà écrits. L'IA les affiche avec `{{img::alice_sourire}}` seul sur une ligne.

L'application affiche l'image **là où le modèle l'écrit**, en tête, au milieu ou à la fin. C'est donc la consigne qui décide : le protocole demande de la placer à l'endroit du récit qu'elle illustre et de ne pas ouvrir systématiquement la réponse par une image, et la liste des codes envoyée à chaque tour le rappelle. Si un scénario demande lui-même « commence par l'image » dans son prompt système, cette phrase l'emporte, et c'est à elle qu'il faut toucher. Les messages déjà écrits gardent leurs images où elles sont ; seules les nouvelles réponses suivent la nouvelle consigne.

La reconnaissance du code est tolérante : majuscules, accents, espaces, tirets et tirets bas sont équivalents (`alice_sourire heureux`, `alice_sourire_heureux` et `Alice-Sourire-Heureux` désignent le même fichier), et le nom du fichier seul suffit s'il est unique (`sourire_heureux`). Quand un code ne correspond à aucune image, un repère « image introuvable : code » s'affiche à la place, au lieu de ne rien montrer.

Après avoir renommé des images :

- Les anciens messages gardent les anciens codes : ils afficheront le repère « image introuvable ». Modifiez le message ou régénérez la réponse.
- Réglages de l'histoire (menu « … »), section « Images détectées » : vignettes et codes exacts vus par l'application, avec le bouton « Recharger l'index » pour relire la liste des fichiers sans fermer l'application. L'index lui-même n'est régénéré qu'au déploiement GitHub (quelques dizaines de secondes après le push).

### Décors

Une image de personnage **détourée** (fond transparent, en `.png` ou `.webp`) s'affiche en scène : un décor en fond, le personnage posé dessus. L'application le détecte elle-même en lisant les pixels du bord de l'image ; une image à fond plein s'affiche comme avant, en pleine largeur, sans décor derrière, puisqu'elle contient déjà le sien.

Les décors se rangent dans `scenarios/<scénario>/decors/` :

```
decors/
  taverne.webp
  taverne.md        facultatif : Mots-clés : auberge, comptoir, salle commune
  foret.webp        sans .md, le nom du fichier sert de mot-clé
  defaut.webp       facultatif : fond quand aucun décor ne correspond
```

C'est l'application qui choisit le décor, pas l'IA : elle lit le champ « Lieu » du panneau d'état (ou « Endroit », « Localisation »), et à défaut cherche les mots-clés dans le texte des derniers messages. Les mots-clés suivent les règles du lorebook (accents et majuscules ignorés, mot entier, `chateau*` pour les variantes) ; quand plusieurs décors correspondent, le mot-clé le plus long l'emporte (« forêt de nuit » avant « forêt »). Si rien ne correspond, c'est `defaut.webp`, et sans lui un fond généré aux couleurs du scénario : il n'y a jamais de vide. L'IA ne reçoit pas la liste des décors et écrit librement ; cela ne coûte aucun token.

Un champ « Moment » dans `etat.md` (ou « Heure », « Période ») teinte les décors selon l'heure : rose à l'aube, orangé au crépuscule, bleu sombre la nuit. Un même décor sert ainsi à toute la journée ; détail des mots reconnus dans [utilisation.md](utilisation.md). Un champ « Jour » (ou « Date ») fait venir l'écran de passage quand il change.

Chaque message garde le décor de son moment : celui de son propre bloc d'état, sinon le dernier lieu connu avant lui. Relire une ancienne scène montre donc l'ancien décor. Pendant l'écriture, la scène prend le lieu précédent, puis bascule si la réponse annonce un nouveau lieu.

Dans la conversation, le personnage est placé sur la ligne des 2/3 à droite, pieds en bas de la scène : l'application mesure la silhouette elle-même, donc une image centrée ou avec plus de marge d'un côté donne le même résultat, et un personnage large est décalé juste assez pour rester entier. Dans la fenêtre Personnages, la pastille et la galerie montrent le personnage centré sur le décor du lieu actuel. Toucher une scène l'agrandit en plein écran. Chaque scène a des proportions fixes (16/9, un plan large qui prend peu de place dans le fil), ce qui évite aussi les sauts de mise en page au chargement des images.

### Lorebook

Chaque fichier `.md` commence par des lignes d'en-tête, puis le texte à injecter :

```
mots-clés: dragon*, épée
priorité: 2

Le dragon dort dans la montagne.
```

- `mots-clés:` liste séparée par des virgules, sans accents ni casse. Recherche par mot entier ; `dragon*` accepte `dragons`, `dragonnet`…
- `toujours` : entrée toujours injectée, sans mot-clé. Elle va dans la partie stable du prompt, qui reste en cache.
- `priorité: N` : les valeurs les plus hautes passent en premier (défaut 0).

Un lorebook qui tient dans le budget de la partie fixe part en entier, en cache, et les mots-clés ne servent pas. Au-delà, les entrées `toujours` restent dans la partie fixe, et les autres partent en fin de requête quand un de leurs mots-clés apparaît dans les deux derniers messages, par priorité.

## Mode jeu de rôle (regles.md)

Un scénario qui a un fichier `regles.md` se joue avec des jets de dés. Le fichier liste les caractéristiques du personnage, sur une ligne, séparées par des virgules (huit au plus) :

```
Vigueur, Adresse, Esprit, Présence, Volonté
```

L'IA ne lance jamais les dés : un modèle ne sait pas tirer au hasard et choisit presque toujours le résultat qui arrange l'histoire. Elle désigne seulement le jet, et l'application le lance (`js/dice.js`) :

- dans ses choix, une action risquée se termine par sa caractéristique et sa difficulté : « Je force le cadenas (Adresse, difficile) ». L'application l'affiche en étiquette ; toucher le choix lance un d20, ajoute le bonus de la fiche et envoie le résultat avec le message ;
- quand le joueur écrit lui-même une action risquée, l'IA montre l'instant d'avant et finit par `<jet>Adresse, difficile</jet>` : un bouton « Lancer le dé » apparaît, et le tour suivant part avec le résultat (et avec le brouillon en cours, s'il y en a un) ;
- le résultat s'écrit dans le message du joueur, `<jet>Adresse, difficile (13) : 14 + 2 = 16, réussite</jet>`, affiché en carte. L'IA raconte l'issue sans la contredire. Un 20 naturel est une réussite critique, un 1 naturel un échec critique.

Seule l'application lance les dés : un résultat que le narrateur écrirait lui-même est retiré de sa réponse. Une demande de jet mal formée garde son bouton (caractéristique inconnue : bonus nul ; difficulté inconnue : moyen). Une marque placée au milieu d'un choix, avant une réplique ou une ponctuation, est reconnue aussi.

Difficultés : facile (6), moyen (10), difficile (13), très difficile (16), soit 75, 55, 40 et 25 % de réussite sans bonus, 85, 65, 50 et 35 % avec +2. Les seuils sont choisis pour que l'échec reste l'exception sur une action ordinaire. Quand le joueur écrit lui-même une action risquée, l'IA amène le jet en deux ou trois phrases seulement. La fiche du personnage (menu « … » de la conversation, ou bouton de l'introduction avant le premier tour) répartit trois points : chaque caractéristique va de −1 à +2, et en baisser une rend un point. Une nouvelle partie repart avec une fiche vide. Elle n'est pas envoyée à l'IA : seuls les résultats le sont, une vingtaine de tokens par jet, dans la même requête que le tour. Les consignes des jets partent dans la partie fixe du prompt, en cache.

Le mode est réservé aux scénarios GitHub. Pas besoin de décrire les jets dans `systeme.md` : l'application s'en charge, comme pour les choix et l'état.

## Protocole et préambule

L'application est propriétaire du **protocole** : les formats du bloc `<etat>`, du bloc `<choix>` et de la syntaxe `{{img::}}` sont produits par `js/protocol.js`, pas par les scénarios. Un `systeme.md` ne décrit donc plus que la fiction : le monde, la voix, le registre, le rythme.

Conséquences :

- Faire évoluer un format se fait en un seul endroit, pour tous les scénarios à la fois.
- Les consignes de format sont concises, les mêmes pour tous les modèles : elles décrivent les blocs <etat> et <choix>, le style et les images sans rappel en fin de requête.
- Un court bloc « Narration » part aussi pour tous les scénarios : le joueur seul décide de ce que fait, dit, pense et ressent son personnage, les autres n'ont pas accès à ses pensées sauf exception prévue par le scénario (seules les propositions de choix le font agir ou parler), des personnages qui agissent sans attendre le joueur et réagissent entre eux, une voix par personnage, des détails concrets, le retour de ce qui a déjà eu lieu, des réponses qui s'ouvrent sur ce que provoque l'action du joueur au lieu de la raconter de nouveau, et un rythme qui résume ce qui se répète (entraînement, trajet, attente) pour avancer jusqu'au prochain moment qui compte. Les choix par défaut demandent trois registres différents (audacieux, prudent, inattendu). Il proscrit aussi les didascalies vides (« Un temps. », « Silence. ») : un tic relevé dans un journal (une réponse sur cinq sur Lumencia), qu'une pause montrée par un geste remplace.
- Si un `systeme.md` contient encore `<choix>`, `<etat>` ou `{{img::`, l'application le signale à l'ouverture de la conversation et dans la feuille Réglages de l'histoire : l'IA recevrait deux versions du même format, et arbitrerait mal. Retirez ces lignes.

Le **préambule commun** (Réglages) est votre texte à vous (la case « Ignorer le préambule commun » des réglages de l'histoire n'apparaît que s'il en existe un), ajouté au prompt système de tous les scénarios : longueur des réponses, personne, registre, manies de narration. Un scénario peut s'en affranchir avec « Ignorer le préambule commun » dans sa section Narration.

Ce qui reste au scénario : tout ce qui touche à la voix. Ce qui passe à l'application : tout ce qui touche à la forme des blocs.
