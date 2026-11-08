# Nocturne

Application web installable (PWA) pour jouer des histoires interactives avec une IA. Tout tourne dans le navigateur : les scénarios, l'historique et la mémoire sont stockés localement (IndexedDB), les requêtes partent directement vers l'API de Claude (Anthropic).

## Mise en ligne (GitHub Pages)

1. Déposer à la racine du dépôt tous les fichiers de l'application (voir [« Structure du code »](docs/technique.md#structure-du-code)).
2. Copier `index.yml` dans `.github/workflows/index.yml`.
3. Réglages du dépôt, Pages, Source : **GitHub Actions**.

Le workflow a deux étapes. **test** installe Playwright, lance les tests unitaires (`npm test`), construit, puis lance le test de bout en bout dans Chromium (`npm run test:e2e`) ; en cas d'échec, la capture `e2e-echec.png` est jointe à l'exécution. **deploy** ne part que si **test** a réussi : il refait `npm run build` et publie, sans `node_modules` ni navigateur dans le site. `npm run build` calcule un numéro de version à partir du contenu des fichiers et met à jour tout seul le service worker, les préchargements et les numéros de version. Il échoue si `index.html` contient un identifiant dupliqué, un `label for=` orphelin, si un module vise un élément absent de la page, si deux modules s'importent en boucle (voir [« Structure du code »](docs/technique.md#structure-du-code)), ou si une règle CSS fixe `display` sur une feuille (`dialog`) sans viser `[open]` : une feuille fermée reprendrait alors sa place dans le flux et allongerait la page.

Le workflow génère aussi `index.json` (liste des fichiers de `scenarios/`) à chaque push. L'application le lit en priorité, ce qui évite la limite de 60 requêtes par heure de l'API GitHub et fonctionne avec un domaine personnalisé. Sans `index.json`, elle interroge l'API GitHub (dépôt déduit de l'URL, ou saisi dans Réglages).

## Documentation

- [Utiliser Nocturne](docs/utilisation.md) : l'interface, les réglages, la sauvegarde en ligne.
- [Écrire un scénario](docs/scenarios.md) : structure des scénarios, fiches, images, décors, lorebook, protocole.
- [Fonctionnement technique](docs/technique.md) : prompt et cache, API Claude, mémoire, stockage, structure du code, déploiement.

## Fonctions

- Réponses en streaming, trois suggestions de réponse (envoi direct ou crayon pour modifier), bouton annuler.
- Mode jeu de rôle pour les scénarios qui ont un `regles.md` : fiche du personnage, jets de d20 lancés par l'application sur les actions risquées (voir [« Mode jeu de rôle »](docs/scenarios.md#mode-jeu-de-rôle-reglesmd)).
- Variantes de réponse (flèches ‹ ›) en régénérant, bouton « continuer » (double chevron) pour prolonger une réponse coupée.
- Modifier, copier ou supprimer à partir d'un message (feuille « … » sous le message). La suppression est immédiate, avec un bouton « Annuler » pendant 7 secondes tant que la conversation n'a pas changé. Les lignes récentes des messages supprimés sont retirées de la mémoire ; si la suppression touche des messages déjà résumés, la notification prévient que le résumé en garde la trace. Pour rejouer un scénario sans perdre la partie en cours, « Nouvelle partie » (menu « … » de la carte ou de la conversation) crée une histoire vierge du même scénario, avec les mêmes réglages (nom du joueur, modèle, choix, panneau d'état, note) mais sans messages ni mémoire. Supprimer une histoire (menu « … » de la carte) efface la conversation, sa mémoire et ses réglages ; un scénario GitHub reste dans le dépôt et dans la bibliothèque, alors qu'un scénario créé dans l'application, dont le prompt vit dans ses histoires, disparaît avec la dernière. Supprimer à partir du premier message recommence l'histoire ; pour un scénario GitHub, cette remise à zéro est synchronisée comme une modification (sans elle, une histoire GitHub vide n'est jamais synchronisée, et la version en ligne reviendrait).
- Modifier un message déjà résumé : sa ligne récente est retirée de la mémoire, et une notification prévient que le résumé garde la trace de l'ancienne version.
- Bifurquer à partir d'un message (même feuille) : une nouvelle histoire reprend jusque-là, l'originale reste intacte.
- Modifier et renvoyer un tour du joueur (même feuille) : la suite est remplacée par une nouvelle réponse, sans annulation possible ; la fenêtre l'annonce et conseille de bifurquer d'abord pour garder l'ancienne suite. Si le tour était déjà résumé, il repart tel quel et le résumé garde la trace de l'ancienne version.
- Régénérer avec une indication (« plus court », « fais parler Elias »…) : appui long ou clic droit sur « Régénérer », ou feuille « … » du dernier message. L'indication est ajoutée à la fin du dernier tour, dans la partie non mise en cache, pour cette réponse seulement : elle n'est pas enregistrée, et « Réessayer » la reprend.
- Après un échec d'envoi, le bouton « Réessayer » de la bande d'erreur relance la même demande (envoi, régénération ou continuation) sans doubler le tour.
- Une pastille « Réponse en cours ↓ » puis « Nouveau message ↓ » signale une réponse qui arrive sous l'écran pendant qu'on relit plus haut ; elle disparaît quand le début de la réponse devient visible.
- Rappel automatique de passages anciens quand la scène reparle d'un détail sorti de l'historique envoyé.
- Coût estimé par modèle et par période dans les statistiques, en dollars ou en euros.
- Le bouton stop (et la sortie de la conversation) conserve le texte déjà reçu, que « Continuer » peut prolonger.
- Mémoire à quatre étages : chapitres, résumé et souvenirs éditables (ajout et retrait à l'unité), lignes récentes consultables dans le Sommaire, note pour l'IA (menu « … » de la conversation, « Mémoire et note »), et relations par personnage, consultables dans la fenêtre Personnages. Tous les souvenirs gardés (soixante au plus) partent avec la mémoire.
- Modèle distinct pour les résumés de mémoire (Haiku 5.5 par défaut).
- Modèle et effort par scénario (section Génération des réglages de l'histoire). Sans modèle, le scénario reprend celui des Réglages. Le modèle du scénario sert à garder un grand modèle pour les histoires qui le méritent et un petit, bien moins cher, pour les autres ; il compte pour les statistiques.
- Coût des extras affiché sous les cases Choix et Panneau d'état (section Narration) : taille moyenne d'un bloc, part de la sortie et coût pour 100 réponses, mesurés sur les dernières réponses de l'histoire. Ces blocs sont réécrits par l'IA à chaque réponse et payés comme sortie : décochez ceux qui ne servent pas.
- Protocole de sortie centralisé, conseils de narration communs et préambule commun à tous les scénarios.
- Modèles proposés dans les champs Modèle : ceux dont le tarif est connu (`js/cost.js`) ; un autre se tape à la main.
- Compteurs : estimation des tokens envoyés, cache et coût du dernier tour sous la conversation (voir [« Prompt et cache »](docs/technique.md#prompt-et-cache)).
- Recherche dans la liste, sauvegarde JSON (clés API exclues) avec rappel tous les 30 jours, synchronisation en ligne sur un dépôt GitHub privé.
- Bouton retour du téléphone géré, y compris pour fermer une feuille ouverte depuis la liste, fonctionnement hors ligne : les fichiers des scénarios, images comprises, restent en cache d'une version de l'application à l'autre (400 au plus).

## Licence

Le code de l'application (tout le dépôt sauf les exceptions ci-dessous) est sous licence MIT : voir `LICENSE`.

Ne sont pas couverts par cette licence :
- le dossier `scenarios/` (textes, fiches, lorebooks et images des scénarios) : tous droits réservés à leurs auteurs respectifs, pour un usage personnel ;
- la police Literata (`fonts/`), qui garde sa propre licence (SIL Open Font License, `fonts/LICENSE-Literata.txt`).
