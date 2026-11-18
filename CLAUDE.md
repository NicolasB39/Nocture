# Nocturne

PWA de fiction interactive avec Claude : JavaScript en modules ES, sans framework ni dépendance d'exécution, IndexedDB, service worker. Publiée sur GitHub Pages à chaque push sur `main` (`.github/workflows/index.yml`).

## Travailler avec l'utilisateur

- Répondre en français. Code simple, peu de tokens : pas de dépendance, pas de réécriture, pas d'abstraction sans besoin.
- L'utilisateur joue sur Chrome Android (pas d'iPhone) : vérifier les choix d'interface pour ce navigateur.
- Ne commiter et pousser que sur demande explicite (« Commite et pousse »). « Valide les modifications » = commit seul, puis demander pour le push.
- Pousser sur `main` depuis la branche de travail : `git fetch -q origin && git rebase origin/main && git push origin HEAD:main`.
- Ne jamais commiter `node_modules`, `package-lock.json`, `scenario-histoires.zip`, `e2e-echec.png` (ignorés).

## Vérifier

- `npm test` : tests unitaires (node:test).
- `npm run test:e2e` : bout en bout dans Chromium ; en local sans le Chromium de Playwright, `PW_CHANNEL=chrome npm run test:e2e`.
- `npm run build` : numéros de version, service worker ; échoue sur un id dupliqué, un `label for` orphelin, un import circulaire.
- `npm run css` : classes CSS sans usage apparent.
- `npm run scenarios` : vérifie tous les scénarios (aussi en CI) ; un seul : `node skills/scenario-histoires/scripts/verifier.mjs "scenarios/<Nom>"`.
- Après une modification non triviale : agent `relecteur`. Pour remettre en cause un choix : agent `contradicteur`.

## Où sont les choses

- Doc : `docs/utilisation.md` (interface), `docs/scenarios.md` (écrire un scénario, consignes du narrateur), `docs/technique.md` (prompt, mémoire, stockage, structure du code et règles du projet). Mettre à jour la doc touchée par un changement, sans y raconter l'historique (il est dans Git).
- Consignes communes du narrateur : `js/protocol.js` ; prompt d'une histoire : `js/prompt.js` ; mémoire : `js/ai.js` (SUMJ) et `js/memory.js`.
- Skill de création de scénarios : `skills/scenario-histoires/` ; `npm run skill` en fait le zip à téléverser sur claude.ai.

## Outils

- Journal d'appels exporté par l'app : `node tools/mesure-journal.mjs journal.json` mesure la dernière séance (le journal garde les 100 derniers appels, souvent de plusieurs séances).
- Images PNG ajoutées à un scénario (décor, couverture, téléversées sur GitHub) : `npm run webp` les convertit toutes en WebP (dix fois plus légères, mêmes codes) et retire les PNG.
- Planche d'expressions d'un personnage : `node tools/planche.mjs planche.png "scenarios/<Nom>/personnages/<Perso>" nom_neutre nom_sourire nom_ferme` découpe, montre un aperçu sur fond sombre et écrit les WebP.
