---
name: "scenario-histoires"
description: Créer ou modifier un scénario pour l'application Histoires (PWA de fiction interactive avec une IA, scénarios versionnés dans scenarios/ sur GitHub). À utiliser dès que l'utilisateur veut écrire une nouvelle histoire, un prompt système de scénario, une fiche de personnage, une entrée de lorebook, un panneau d'état, un avatar, des décors ou des prompts de génération d'images (personnages détourés, décors, couverture) pour cette application, ou faire relire un scénario existant. Couvre l'arborescence des fichiers, la rédaction du prompt système, les fiches à déclenchement par mots-clés, les décors choisis par l'application, les prompts d'images et la vérification avant publication.
---

# Créer un scénario pour Histoires

## Avant d'écrire

Lire `reference/arborescence.md`. Il décrit les fichiers que l'application lit, leur nom exact et leur syntaxe d'en-tête. Un fichier mal nommé est ignoré en silence.

Puis, selon la demande :

| Tâche | Fichier à lire |
|---|---|
| Écrire ou retravailler le prompt système | `reference/systeme.md` |
| Créer des personnages, des fiches, des images | `reference/personnages.md` |
| Créer des décors, leurs mots-clés | `reference/decors.md` |
| Écrire les prompts de génération d'images | `reference/images.md` |
| Créer des entrées de lorebook, des déclencheurs | `reference/lorebook.md` |
| Activer les dés, l'inventaire, les liens, écrire l'intro | `reference/modes.md` |
| Relire un scénario existant | `reference/revue.md` |

`exemple/le-phare-d-arvor/` est un scénario complet et court, à copier comme point de départ. Son dossier est nommé en ASCII pour les besoins de ce paquet ; dans le dépôt, le dossier d'un scénario porte son vrai nom, accents, espaces et apostrophes compris, puisque c'est lui qui s'affiche.

## La règle qui prime sur tout

**L'application est propriétaire du format de sortie. Le scénario est propriétaire de la fiction.**

N'écrivez pas dans `systeme.md` de consignes sur :

- la forme du bloc `<etat>` ou la liste de ses champs → c'est `etat.md`
- la forme du bloc `<choix>` ou le nombre de propositions → c'est un réglage du scénario dans l'application
- la syntaxe `{{img::...}}` ou la liste des codes d'images → l'application les injecte seule
- les gestes entre astérisques → l'application le demande, sauf si la case « Demander les gestes entre astérisques » du scénario est décochée
- les conseils généraux de narration → l'application envoie un bloc « Narration » commun : personnages qui agissent sans attendre le joueur et réagissent entre eux, une voix par personnage, détails concrets, retour de ce qui a déjà eu lieu, première phrase sur ce que provoque l'action du joueur, scène de cinq ou six échanges puis ellipse
- les dés, l'inventaire, les liens → `regles.md`, `inventaire.md`, `liens.md` (voir `reference/modes.md`) ; l'application en donne seule les règles
- les notes de jeu dans le récit (« [Situation : …] », « [Action risquée : …] ») → l'état et les jets ont leurs blocs ; seuls les messages propres à la fiction (un Système, une technique) peuvent être entre crochets

L'application génère ces consignes dans la partie fixe du prompt, les mêmes pour tous les modèles. Si le prompt système les redéfinit, l'IA reçoit deux versions du même format et arbitre mal. L'application affiche d'ailleurs un avertissement à l'ouverture du scénario quand elle détecte `<choix>`, `<etat>` ou `{{img::` dans le prompt système.

Ce qui reste au scénario : le monde, le ton, la voix, le **rythme propre à l'histoire** (ce que contient une journée, qui agit hors champ), la longueur des réponses, la personne grammaticale, les garde-fous d'agentivité, les règles de fiction.

## Déroulé

1. **Cadrer avant d'écrire.** Poser au maximum trois questions : la prémisse en une phrase, le ton, et ce que le joueur incarne. Ne pas demander plus, inventer le reste et le soumettre.
2. **Créer l'arborescence** sous `scenarios/<Nom du scénario>/`. Le nom du dossier devient le nom affiché.
3. **Écrire `systeme.md`** en suivant `reference/systeme.md`, avec sa section **Rythme** : sans elle, le récit piétine (constaté en jeu : 70 tours pour une seule matinée).
4. **Écrire `etat.md`** si l'histoire suit des valeurs. Une ligne, les champs séparés par des virgules. Trois à cinq champs, pas plus (Heure en plus). Si le temps compte, mettez **`Jour`** et **`Heure`** : un narrateur qui voit l'heure la fait avancer, et la baisse quotidienne de l'inventaire suit le Jour.
5. **Écrire `avatar.md`** : ce que l'application sait du personnage du joueur, et ce qu'elle laisse ouvert.
6. **Créer les personnages**, un dossier chacun, avec `fiche.md`, ses en-têtes et une **réplique d'exemple** dans la section Voix.
7. **Créer le lorebook** pour ce qui ne doit arriver qu'au bon moment.
8. **Activer les modes** si l'histoire s'y prête (`regles.md`, `inventaire.md`, `liens.md`) et écrire `intro.md` : voir `reference/modes.md`.
9. **Écrire les prompts d'images** avec les gabarits de `reference/images.md`, à partir d'un bloc de style commun, et les ranger dans `images.md` à la racine du scénario. **Style anime réaliste** partout.
10. **Ajouter les images** :
   - personnages : **une seule planche par personnage**, le même personnage répété côte à côte dans chacune de ses expressions (une génération, donc un visage et une tenue identiques), sur fond vert d'incrustation uni (#00FF00), en PNG d'origine, puis découpée en une image par expression avec `node scripts/decouper.mjs`, qui la détoure aussi ; chaque image est **détourée** (PNG ou WebP transparent), en buste coupé à la taille par le bas de l’image, expressions marquées, verticale 2:3. Voir `reference/images.md` ;
   - décors : un par lieu récurrent dans `decors/`, en **16/9, sans personnage**, avec un `.md` de mots-clés, plus un `defaut` ; garder `Lieu` dans `etat.md` ;
   - couverture en 3/4.

   Voir `reference/personnages.md` et `reference/decors.md`.
11. **Vérifier** avec `node scripts/verifier.mjs "scenarios/<Nom>"`. Corriger tout ce qu'il signale avant de livrer.

## Choses à ne pas faire

- Écrire les règles sur un ton d'alarme : « DIRECTIVE CRITIQUE », « (CRITIQUE) », « JAMAIS » ou « DOIT » en capitales. Avec les modèles Claude actuels, un prompt inquiet donne une narration prudente et timide, qui n'ose plus faire bouger le monde. Énoncez la règle posément, avec sa raison.
- Demander à l'IA de tirer des nombres au hasard, de lancer des dés ou de calculer des probabilités : elle simule, mal. Préférer des états qualitatifs et des conditions explicites.
- Entasser les traits d'un personnage dans une seule liste à virgules : l'IA leur donne alors le même poids. Une tenue vestimentaire et un deuil d'enfance ne se mettent pas sur la même ligne.
- Faire grossir `etat.md`. Chaque champ est réécrit à chaque tour et mange le budget de la prose.
- Écrire des fiches de personnage sans en-tête `résumé:`. Sans lui, l'application tronque la première ligne pour le casting, et le résultat est souvent mauvais.
- Utiliser `{{char}}` : l'application ne connaît que `{{user}}`, remplacé par le nom choisi par le joueur.
- Ranger des décors dans `personnages/` (l'ancien dossier `personnages/Decors/`) : l'IA les insérerait comme des images, en plus du décor que l'application pose déjà. Les décors vont dans `decors/`.
- Peindre des personnages dans un décor, ou un décor derrière un personnage : chacun est posé sur l'autre par l'application.
- Mettre les prompts d'images dans une `fiche.md` : la fiche est envoyée à l'IA, ce serait des tokens perdus. Ils vont dans `images.md`.
- Laisser la planche d'expressions dans `personnages/<Nom>/` : toute image de ce dossier devient une expression (`maren_planche`) que l'IA pourrait afficher. Gardez-la hors du scénario, ou dans un dossier `planches/` que l'application ignore.
- Décrire dans `systeme.md` les dés, l'inventaire ou les liens : l'application en donne les règles dès que `regles.md`, `inventaire.md` ou `liens.md` existe.
- Laisser un compagnon guider le joueur : sans consigne, l'IA fait porter l'intrigue au personnage qui l'accompagne, qui décide de l'itinéraire à chaque tour. Écrivez dans sa fiche qu'il donne son avis une fois, puis laisse choisir.
