# Fonctionnement technique

Prompt et cache, appels à Claude, mémoire, stockage, structure du code et déploiement. Retour au [README](../README.md).

## Prompt et cache

Les Réglages sont groupés : clé API Claude, modèles et cache en haut, puis « Lecture », « Narration », « Compteurs et journal » et « GitHub et sauvegarde » dans des sections repliées.

À chaque envoi partent le prompt système, la mémoire et tous les messages que la mémoire n'a pas encore résumés (voir « Mémoire »).

### Placement dans le prompt et cache

Le cache de prompt de Claude réutilise le calcul d'un **préfixe exact**. Dès le premier caractère qui diffère, tout ce qui suit est recalculé, et payé plein tarif.

L'application range donc le prompt par volatilité croissante :

```
système  prompt du scénario, préambule, casting, fiches et lorebook « toujours »,
         codes d'images, protocole, avatar, chapitres    ← fixe
         résumé, lignes récentes, souvenirs, relations, note   ← change par paliers
historique
queue    dernier message, lorebook déclenché, fiches en scène, passages anciens, état précédent
```

Le choix du niveau suit un arbitrage simple. Un bloc placé avant l'historique est gratuit les tours où il ne bouge pas, mais le tour où il change, il invalide aussi tout l'historique. Pour un bloc de C tokens qui change tous les K tours avec un historique de H tokens, le remonter vaut le coup si `(C + H) / K < C`.

La mémoire ne change que par paliers, surtout en début de séance (voir « API Claude ») : elle vient juste après la partie fixe, et les souvenirs partent tous (soixante au plus) plutôt que triés par pertinence, pour qu'ils ne varient pas d'un tour à l'autre. Le lorebook et les fiches de personnages déclenchés par mots-clés changent bien plus souvent : ils restent en queue, où ils n'invalident rien. Seuls ceux qui ne changent jamais (`toujours`, ou tout un lorebook et des fiches modestes, voir [« Fiches de personnages »](scenarios.md#fiches-de-personnages)) montent dans la partie fixe. L'état précédent change à chaque tour par nature.

Le compteur sous la conversation indique par exemple « ≈ 6 953 tokens envoyés (réel : 7 012) · 10 messages envoyés sur 16 » : les messages plus anciens ne sont plus envoyés, l'IA n'en a que la mémoire.

Le compteur est **masqué par défaut** : on lit une histoire, pas un tableau de bord. « Afficher les compteurs sous la conversation » (Réglages, section « Compteurs et journal ») le rend permanent.

### API Claude

L'application appelle l'API native de Claude (`/v1/messages`). Renseignez « Clé API Claude » dans Réglages, avec une clé de la console Anthropic ; il n'y a pas d'offre gratuite. Modèle par défaut : `claude-sonnet-5-5` (`claude-haiku-5-5` coûte moins cher). Chaque réponse est plafonnée à 8 192 tokens, réflexion comprise : une sécurité contre une réponse sans fin, pas une longueur (ce plafond coupe, il ne raccourcit pas). La longueur des réponses se demande au modèle, dans le préambule commun ou la note pour l'IA. Les anciens réglages propres à chaque histoire (longueur maximale, souvenirs injectés, passages rappelés, profondeur et plafond du lorebook, gestes entre astérisques, cadrage en pied) ont été retirés : une histoire qui en avait un reprend le fonctionnement commun, et le cadrage en pied se coche désormais une fois pour toutes dans Réglages, section Lecture.

L'application pose trois marqueurs de cache (l'API en accepte quatre) :

1. après la partie fixe de la consigne (scénario, préambule, liste des personnages, fiches et lorebook `toujours`, codes d'images, protocole, avatar, chapitres clos) : elle ne change qu'à la clôture d'un chapitre, et reste relue depuis le cache même quand la mémoire change ;
2. après la mémoire (résumé, lignes récentes, souvenirs, relations, note) ;
3. sur l'avant-dernier message, juste avant le dernier message qui porte le lorebook déclenché, les fiches en scène et l'état précédent.

Tout l'historique stable est ainsi relu depuis le cache à un dixième du prix d'entrée au plus (un vingtième sur Sonnet et Opus 5.5, un quarantième sur Fable 5.1), et seule la dernière paire message-réponse est écrite à chaque tour.

Les « personnages récurrents » (fiches mises en cache à part, entre la partie fixe et la mémoire, pour les scénarios dont les fiches dépassaient le budget) ont été retirés quand le budget est passé à 8 000 tokens : plus aucun scénario du dépôt ne s'en servait.

La mémoire garde toujours au moins 40 messages mot pour mot, et choisit son moment pour avancer, parce qu'une mise à jour réécrit tout le cache de la mémoire et de l'historique :

- **En début de séance**, quand le cache a expiré (rien envoyé pour cette histoire depuis 5 minutes, ou une heure avec « Garder le cache une heure »), le premier envoi réécrira tout le prompt de toute façon. La mémoire avance alors dès 50 messages en attente, jusqu'à n'en garder que 40, et la réécriture porte directement le prompt raccourci. Le résumé part dès l'ouverture de l'histoire, pendant que vous relisez ; si vous envoyez avant qu'il soit fini, l'envoi l'attend au plus 30 secondes (« Mise à jour de la mémoire avant l'envoi… », Arrêter coupe l'attente), puis part quand même. Le résumé, fait par le modèle de mémoire (Haiku 5.5 par défaut), coûte environ dix fois moins que ce qu'il évite de réécrire et de relire.
- **En cours de séance**, la mémoire n'avance qu'au-delà de 120 messages en attente : une longue séance peut donc se jouer sans aucune réécriture due à la mémoire.
- **Jauge du bouton Envoyer** : un anneau autour du bouton se remplit de 40 messages en attente (juste après une mise à jour) à 120 (la suivante). Il passe en doré plein sur les cinq derniers tours, qui affichent leur compte à rebours dans une pastille, et pulse pendant la mise à jour. Le lecteur d'écran l'annonce avec le bouton (« mémoire : 4 tours avant la mise à jour »).

Les résumés partent par appels de 20 messages. Sur deux soirées mesurées (89 tours de Sonnet 5.5), les messages au-delà des 40 premiers et la mise à jour en cours de jeu pèsent ensemble environ 12 % du coût d'un tour, la sortie plus de la moitié ; le seuil de 120 est à quelques pour cent du minimum calculé (vers 110), et la courbe est plate autour. En contrepartie, l'IA voit 40 messages mot pour mot en début de séance (une vingtaine de tours), puis jusqu'à 120. Le cache dure 5 minutes, prolongées à chaque tour ; « Garder le cache une heure » (Réglages) l'allonge, avec une écriture plus chère. Il est réécrit quand la mémoire se met à jour, quand un ancien message est modifié ou après une pause plus longue que sa durée. Le compteur sous la conversation affiche les tokens « lus en cache » et « mis en cache » pour vérifier l'économie réelle.

**Maintien du cache pendant les pauses.** Lire une réponse puis écrire son tour dépasse souvent 5 minutes : le cache expirait, et le tour suivant réécrivait tout le prompt à 1,25 fois le prix d'entrée. Quand « Garder le cache au chaud pendant les pauses » est coché (Réglages, par défaut), l'application renvoie la dernière requête de narration avec `max_tokens: 0` environ 4 minutes 30 après son début : l'API relit le préfixe au tarif réduit (un dixième de l'entrée au plus, un vingtième sur Sonnet et Opus 5.5), repousse l'échéance de 5 minutes et ne génère rien. Seul le dernier message, hors cache, est payé plein tarif. La relance part sans streaming (refusé avec `max_tokens: 0`) mais avec le même effort, qui fait partie du préfixe. Elle n'a lieu que tant que la conversation est ouverte et la page visible, au plus trois fois d'affilée (une vingtaine de minutes) sans nouvel envoi ; au-delà, mieux vaut laisser expirer. Elle est sans objet avec le cache d'une heure, qui reste préférable pour des pauses régulières de plus de 20 minutes. Les relances sont comptées dans les statistiques.

**Effort.** Sonnet 5.5 et les modèles récents réfléchissent avant de répondre, et cette réflexion, invisible, est facturée comme de la sortie. Réglages de l'histoire, section Génération : « Effort », **Faible par défaut**, Moyen ou Élevé, envoyé dans `output_config.effort`. Faible suffit le plus souvent pour un récit ; montez-le si l'histoire perd en cohérence. L'effort n'est envoyé qu'aux modèles qui le prennent en charge (Opus et Sonnet 4.6 et suivants, Opus 4.5, Haiku 5.5, Fable, Mythos) ; Haiku 4.5 et Sonnet 4.5 le refusent, l'application s'en abstient et la note le signale. Les résumés de mémoire partent toujours en effort faible.

**Changer l'effort en cours de partie** change l'effort en tête de requête, ce qui réécrit le cache une fois (quelques centimes sur une longue histoire).

**Refus.** Claude peut refuser d'écrire une réponse, y compris au milieu du texte, notamment sur des scènes très sombres. L'application l'affiche clairement (« Claude a refusé d'écrire cette réponse », avec le motif quand l'API le donne), ne garde pas le texte déjà reçu, qui n'est pas une réponse complète, et propose « Indication… » pour orienter la scène plutôt que de renvoyer la même requête, qui serait refusée de même. Pour la narration avec Fable 5.1, Opus 5.5, Opus 5 et Sonnet 5.5, l'application demande aussi le **relais** d'Anthropic (`fallbacks: "default"`, bêta `server-side-fallback-2026-07-01`) : une requête refusée est reprise côté serveur par un autre modèle choisi selon le motif. Avec Sonnet 5.5, seuls les refus « cybersécurité » et « développement d'IA » sont relayés ; les refus « contenu sensible », les plus probables en fiction, reviennent comme refus. Haiku 5.5 n'a pas de relais.

**Mémoire sur Haiku 5.5.** Quand « Modèle pour la mémoire » est vide, les résumés partent vers `claude-haiku-5-5` (0,10 $ / 0,50 $ par million de tokens, une vingtaine de fois moins que Sonnet 5.5) plutôt que vers le modèle de narration. Renseigner le champ reprend la main.

**Version de l'API et échantillonnage.** L'application appelle Claude avec la version d'API `2026-10-21` (en-tête `anthropic-version`, constante `ANT_VERSION` dans `ai.js`). Dans cette version, `temperature`, `top_p` et `top_k` sont refusés (erreur 400) sur tous les modèles, même à leur valeur par défaut : l'application ne les envoie donc jamais. Conséquence avec Sonnet 4.6, Opus 4.6 et Haiku 4.5, les seuls modèles Claude qui acceptaient encore une température : ils écrivent désormais avec l'échantillonnage par défaut, et il n'existe pas de réglage de remplacement. Les autres changements de cette version (documents dans un message de l'IA, citations dans un message du joueur, champs de l'API d'administration) ne concernent pas l'application. Guide de migration : https://platform.claude.com/docs/en/api/migration-2026-10-21

Les appels partent directement du navigateur avec l'en-tête `anthropic-dangerous-direct-browser-access` : la clé reste sur l'appareil. Une surcharge (529) est relancée comme les autres erreurs passagères (voir « Erreurs et relances »). Le résumé de mémoire utilise les sorties structurées (`output_config.format`, schéma JSON) : l'API garantit une réponse conforme (voir « Mémoire »).

### Erreurs et relances

Le compteur affiche aussi les tokens lus et mis en cache. C'est le moyen de vérifier que le préfixe stable du prompt est bien réutilisé.

En cas de refus pour dépassement (429), l'application relance jusqu'à trois fois. Le délai est lu dans l'en-tête `retry-after`, à défaut 15, 30 puis 60 secondes, avec un plafond de 90. Le décompte est affiché pendant l'attente, y compris pour la requête de mémoire.

Les **erreurs passagères** sont relancées de la même façon, jusqu'à trois fois : surcharge ou panne de l'API (500, 502, 503, 504, 529) et coupure réseau avant toute réponse. L'attente double à chaque essai (2, 4 puis 8 secondes), sauf si l'API indique elle-même un délai (`retry-after`, plafonné à 60 secondes). Le message dit la cause (« Claude est surchargé ou en panne », « connexion perdue ») et le bouton d'arrêt annule l'attente. Une erreur de requête (400, clé refusée…) n'est jamais relancée, et une coupure au milieu d'une réponse diffusée garde le texte reçu, que « Continuer » peut prolonger, plutôt que de tout redemander. Le délai maximal sans réponse repart de zéro après chaque attente.

Le message dit la cause de l'attente : « Claude a refusé l'envoi (limite de débit) », « Claude est surchargé ou en panne » ou « connexion perdue ».

Avant l'envoi, le décompte est estimé à 2,2 caractères par token (mesuré sur les décomptes réels de Sonnet et Haiku 5.5, en français) ; le nombre réel, renvoyé par Claude, s'affiche après la réponse (« réel : … »).

## Mémoire

La mémoire tient sur quatre étages, du plus détaillé au plus condensé :

- **La fenêtre** : les derniers messages, envoyés mot pour mot.
- **Les lignes récentes** : une phrase par message sorti de la fenêtre, pour garder le détail immédiat sans payer le texte intégral. Les plus anciennes disparaissent au fur et à mesure, une fois absorbées par le résumé.
- **Les chapitres** : quand un lot de messages termine un arc ou en ouvre un nouveau (lieu quitté pour de bon, quête achevée ou nouvelle, ellipse), le modèle de mémoire clôt le chapitre en cours : un titre et un résumé de 700 caractères au plus, figés ensuite, jamais réécrits. Un chapitre compte au moins 60 messages ; à 200, le modèle est invité à le clore. Le narrateur reçoit les chapitres juste avant la mémoire, en entier pour les 12 derniers, par leur titre seul pour les plus anciens. Comme ils ne changent qu'à la clôture d'un chapitre, ils ferment la partie fixe du prompt : relus depuis le cache à chaque tour, ils ne sont réécrits qu'une fois par chapitre, et non à chaque mise à jour de la mémoire comme le résumé. Sans chapitres, un résumé unique se réécrivait sur lui-même à chaque lot, et les débuts d'une longue histoire s'y réduisaient à une phrase. Les chapitres se relisent et se corrigent dans la feuille Mémoire, et servent de titres dans le Sommaire.
- **Le résumé** : le récit condensé du chapitre en cours (de toute l'histoire tant qu'aucun chapitre n'est clos), plafonné pour ne pas gonfler avec le temps. Il est écrit en deux parties, « Événements » et « Situation actuelle », qui nomme aussi les fils en suspens (promesses, dettes, menaces, secrets, objets à retrouver) ; les souvenirs gardent eux aussi en priorité ce qui pourra revenir plus tard, pour que le narrateur ait de quoi faire revenir le passé ; les souvenirs, les relations et l'objectif ont leurs propres champs et ne doivent pas y figurer. Quand il dépasse son plafond, il est coupé à la fin de la dernière phrase complète plutôt qu'au milieu d'un mot.

Chaque ligne récente renvoie au message qu'elle résume, ce qui permet au Sommaire d'y sauter. Si le modèle renvoie plus ou moins de lignes qu'il n'a reçu de messages, les lignes sont gardées sans ce lien, plutôt que de pointer vers de mauvais messages.

À côté, deux listes : les **souvenirs** (faits durables) et les **relations** (une ligne par personnage). Toutes les relations sont envoyées avec la mémoire, dans la partie qui reste en cache ; celle d'un personnage en scène est de plus répétée sous sa fiche quand celle-ci part en fin de requête. Les relations se consultent dans la fenêtre Personnages, pas dans la feuille Mémoire.

Les modèles reformulent : « Alice », « alice », « Alice, l'herboriste » désignent la même personne, et « la fiole est verte » revient sous la forme « La fiole verte est importante ». L'application rapproche donc les noms dont les mots se recouvrent, et les souvenirs dont le vocabulaire se recouvre à plus de 60 %. Dans les deux cas la formulation la plus récente remplace l'ancienne au lieu de s'y ajouter.

Les deux listes sont plafonnées : 12 relations, 60 souvenirs. Au-delà, les entrées les moins récemment mises à jour disparaissent, sauf les personnages qui ont une fiche dans `personnages/`, qui ne sont jamais évincés. Les figurants de passage finissent donc par sortir d'eux-mêmes. Le résumeur reçoit en plus la liste de ce qu'il connaît déjà, avec la consigne de reprendre les noms tels quels et de ne pas répéter les souvenirs acquis.

Le résumé, les souvenirs, les relations et les lignes récentes arrivent dans des champs séparés (sorties structurées, voir « API Claude ») : le modèle ne peut plus recopier les souvenirs ou les relations dans le résumé, ce qui les faisait partir deux fois dans le prompt.

Une relation enregistrée peut dater : la mémoire ne résume les messages qu'avec un retard de 40 à 120 messages (par lots de 20, voir « API Claude »), et l'IA lit pourtant la relation d'un personnage en scène en fin de prompt, juste avant d'écrire. Pour qu'elle ne l'emporte pas sur une évolution récente, cette ligne est envoyée sous la forme « Relation (état enregistré, peut dater ; les événements récents priment) : … », et le bloc `<relations>` de la mémoire porte la même mise en garde en tête. Le résumé (`<previous_history>`) et les lignes récentes (`<recent_history>`) commencent de même par « Antérieur aux messages qui suivent : s'ils le contredisent, ils priment », pour que l'IA ne reprenne pas un lieu, une blessure ou un fil que les derniers messages ont dépassés. La liste complète ne change qu'à chaque mise à jour de la mémoire, comme le résumé : elle est donc relue depuis le cache sans le réécrire d'un tour à l'autre, quel que soit le personnage en scène.

Les chapitres (titre, résumé, retrait), le résumé et les souvenirs restent modifiables à la main dans la feuille Mémoire. Supprimer des messages, renvoyer un tour modifié ou bifurquer retire les chapitres qui commencent après le point de coupe ; celui qui le contient s'y arrête désormais, son résumé gardant, comme celui de la mémoire, la trace de la suite. Les relations, elles, n'y figurent plus : elles sont mises à jour par le modèle et affichées en lecture seule dans la fenêtre Personnages. Enregistrer la feuille Mémoire ne les touche pas.

L'objectif courant ne vit pas dans la mémoire mais dans le panneau d'état, qui est mis à jour à chaque tour. Ajoutez simplement un champ `Objectif` à la liste.

Tout est régénéré par une requête de résumé lancée pendant que vous lisez la réponse précédente. Dans Réglages, « Modèle pour la mémoire » permet de confier ce travail à un modèle plus petit que celui de la narration.

Cette requête demande une réponse **en JSON** avec les sorties structurées de l'API (`output_config.format`) : un schéma fixe les champs `resume`, `souvenirs`, `relations` (liste de `{ nom, relation }`), `lignes` et, une fois le chapitre en cours assez long pour être clos, `chapitre` (`{ clos, titre, resume }`), et Claude répond toujours conformément. La narration, elle, reste en texte balisé : le JSON empêcherait l'affichage au fil de l'eau et abîmerait l'écriture, alors que la mémoire n'est jamais affichée telle quelle. Si la requête échoue (réseau, réponse coupée par la longueur maximale), la mémoire reste inchangée et l'essai reprend au tour suivant.

Cette requête n'est pas diffusée : son délai maximal est de 5 minutes au lieu de 2.

### Passages anciens

Le résumé perd forcément des détails : la couleur d'un objet, la phrase exacte d'un personnage, le nom d'une auberge. Quand la scène actuelle en reparle, l'application retrouve le vieux passage et en joint un extrait (600 caractères au plus) à votre message, dans un bloc `<passages_anciens>` qui prévient l'IA qu'il peut dater.

La recherche se fait sur l'appareil, sans requête supplémentaire : les mots de vos deux derniers messages (et de l'état) sont comparés à ceux des messages qui ne sont plus envoyés tels quels, parce que la mémoire les a déjà résumés. Un passage n'est retenu que s'il partage au moins deux mots avec la scène, dont un distinctif, c'est-à-dire présent dans un passage sur trois au plus : les mots courants (« pluie », « regard ») et les mots outils ne suffisent jamais. Les plus pertinents passent en premier, puis sont remis dans l'ordre du récit ; l'extrait est le paragraphe qui contient le plus de mots communs.

Le bloc part en queue, avec le lorebook déclenché : il n'invalide rien du cache, et ses tokens entrent dans le compteur comme le reste du dernier message. Deux passages au plus.

## Stockage sur l'appareil

Les messages sont rangés par paquets de 25 dans la base locale, et un enregistrement ne réécrit que les paquets qui ont changé : jouer un tour dans une longue histoire ne réécrit plus toute l'histoire. La couverture est stockée une seule fois, à part, et n'est réécrite que si elle change ; la liste ne charge que des informations légères. Les variantes d'une réponse (flèches ‹ ›) ne sont gardées que tant que cette réponse est la dernière : elles disparaissent dès que vous envoyez le message suivant.

Si l'appareil manque de place, un enregistrement refusé par le navigateur est signalé comme une erreur (« Enregistrement impossible ») au lieu de bloquer l'envoi sur « Réponse en cours ».

Les images d'un scénario GitHub ne sont visibles que dans ce scénario : si vous changez d'histoire pendant un chargement, celui qui arrive en retard est ignoré.

## Structure du code

```
index.html          structure de la page (aucun style ni script en ligne)
css/style.css       tout le style
fonts/              Literata (récit), romain et italique variables, sous-ensemble latin
js/
  main.js           point d'entrée : charge les modules, démarre l'application
  state.js          réglages (S), scénario ouvert et état de l'interface (app), contexte (ctx), images (IMG)
  util.js           petits outils : sélecteur $, échappement, dates, boîtes de dialogue, notifications
  bus.js            annonces entre modules (on / emit), pour éviter les imports en boucle
  store.js          base locale (IndexedDB) : scénarios, réglages, import validé, bifurcation
  scenarios.js      scénarios GitHub : arbre de fichiers, couvertures, personnages, images, lorebook
  prompt.js         assemblage du prompt : casting, mémoire, lorebook, estimation des tokens
  recall.js         rappel de passages anciens par mots distinctifs (sans DOM, testé unitairement)
  protocol.js       formats de sortie imposés par l'application (état, choix, images)
  ai.js             appel à l'API Claude (streaming) et résumé de mémoire
  format.js         mise en forme du texte (Markdown léger, images, choix, état, carte des jets)
  dice.js           mode jeu de rôle : marques de jet, lancer du d20, résultat, fiche (sans DOM, testé unitairement)
  sheet.js          fiche du personnage : répartition des points, derniers jets
  scene.js          scènes : choix du décor, moment de la journée, détection de la transparence, placement du personnage
  passage.js        écran de passage au changement de lieu ou de jour
  recap.js          encart « Précédemment » à la reprise d'une histoire
  read.js           réglages de lecture (taille, police, interlignage) et position de lecture
  cast.js           fenêtre Personnages
  view.js           conversation, affichage : messages, état, scènes, compteurs, en-tête, navigation
  send.js           conversation, envoi : appel au modèle, affichage progressif, maintien du cache, saisie
  chat.js           conversation, actions : ouverture, variantes, modification, suppression, bifurcation
  list.js           liste des scénarios : recherche, menu des cartes
  nav.js            navigation (bouton retour du téléphone)
  settings.js       réglages de l'histoire, mémoire, note, réglages IA, import
  backup.js         export, synchronisation GitHub (syncOnce testé avec un dépôt simulé, test/sync.test.js)
  merge.js          fusion des sauvegardes (sans DOM, testé unitairement)
  memory.js         mémoire longue : fusion des souvenirs et des relations, chapitres
  stats.js          statistiques d'usage en tokens (sans DOM, testé unitairement)
  cost.js           tarifs et coût estimé (sans DOM, testé unitairement)
  statview.js       feuille Statistiques
  journal.js        journal des appels : liste, analyse du cache, export
  boot.js           garde-fou de démarrage : alerte et bouton Réparer si un fichier manque
  reparer.js        script de la page reparer.html
reparer.html        page de réparation (vide les caches, garde les histoires)
sw.js               service worker (hors ligne)
tools/build.mjs     numérotation de version, liste du service worker, contrôles
test/               tests unitaires (node --test), sans aucune dépendance
test/e2e.mjs        test de bout en bout dans Chromium (API Claude et GitHub simulées)
.claude/agents/     relecteur.md : agent Claude Code qui relit une modification selon les règles ci-dessous
```

En local : `npm test` lance les tests, `npm run build` régénère les numéros de version. Le test de bout en bout demande Playwright, seule dépendance de développement (`package.json`) : `npm install && npx playwright install chromium`, puis `npm run test:e2e` depuis la racine, après `npm run build`. Sans télécharger le Chromium de Playwright, `PW_CHANNEL=msedge npm run test:e2e` (ou `PW_CHANNEL=chrome`) utilise le navigateur déjà installé. `npm run build` fonctionne aussi sous Windows avec des fins de ligne CRLF, et y calcule la même version qu'en CI. Le workflow lance le test de bout en bout à chaque déploiement. Il vérifie le démarrage, le retour Android, l'envoi et l'affichage progressif, la stabilité de l'écran (y compris dans une longue histoire dont un message sort par le haut), les variantes, Claude (en-têtes et marqueurs de cache), la synchronisation GitHub et les décors (placement aux 2/3, décor par message, fond par défaut et généré, fenêtre Personnages). En cas d'échec, il enregistre une capture `e2e-echec.png`.

Règles du projet :

- Les fichiers sont des modules ES (`import` / `export`) : chacun déclare ce qu'il utilise. Aucun script en ligne.
- **Aucune construction de HTML par chaîne de caractères.** Tout passe par `el(balise, propriétés, enfants)` dans `util.js`, qui crée de vrais nœuds. Le texte est posé en `textContent`, jamais interprété : une injection depuis un scénario, un lorebook ou une réponse d'IA est impossible par construction, et il n'y a plus d'échappement à ne pas oublier.
- `render()` ne reconstruit pas la conversation à chaque tour : il compare les nœuds existants à l'état voulu et ne remplace que ceux qui ont changé. Un message ajouté laisse les précédents en place, avec leur sélection de texte et leurs images déjà chargées.
- L'état partagé qui change vit dans `state.js` (`app.cur`, `app.busy`…). Les autres variables restent locales à leur module.
- Un module ne doit appeler aucune fonction d'un autre module au moment du chargement, seulement dans des gestionnaires d'événements ou des fonctions (s'abonner avec `on()` de `bus.js` est la seule exception).
- **Pas d'import en boucle**, ni direct ni par un détour : `npm run build` refuse `backup.js → send.js → backup.js`. Les imports vont de l'interface vers les couches basses (`send.js` importe `backup.js`, jamais l'inverse ; dans la conversation, `chat.js` importe `send.js`, qui importe `view.js`). Quand une couche basse doit faire réagir l'interface, elle l'annonce par `emit()` de `bus.js` et l'interface s'abonne avec `on()`. Annonces actuelles : `open` (ouvrir une histoire, géré par `nav.js`), `list:stale` (redessiner la liste si elle est visible, `list.js`), `cur:remote` (histoire ouverte modifiée ou supprimée par la synchronisation, `chat.js`). `emit()` rend une promesse résolue quand toutes les réactions sont terminées.
- Pour tester en local, servez le dossier avec un serveur HTTP (`python3 -m http.server`), car les modules ne se chargent pas depuis `file://`.
- Quand vous ajoutez un fichier JavaScript dans `js/`, il est repris automatiquement par `npm run build` (service worker et `modulepreload`). Rien à déclarer à la main.
- Les numéros de version sont calculés à partir du contenu des fichiers par `npm run build`, lancé par le workflow à chaque déploiement. Ne les modifiez pas à la main.
- La logique sans DOM (fusion, validation, construction du prompt) doit rester testable : ajoutez un test dans `test/` quand vous la touchez.
- Les messages construits par `prompt.js` peuvent porter des repères internes (`blocks` sur le message système : la partie fixe et la mémoire, chacune avec son marqueur de cache, que `toAnt` envoie tels quels). Ils ne doivent jamais partir tels quels : `toAnt` construit ses propres blocs pour Claude. Le faux serveur Claude du test de bout en bout refuse toute la requête si un message porte un autre champ que `role` et `content`.

### Historique : autres fournisseurs

Avant de ne plus parler qu'à Claude, l'application parlait aussi aux fournisseurs compatibles OpenAI (Groq, Gemini, Mistral, OpenRouter), avec une limite de tokens, une température et un Top P réglables. Ce code est conservé dans le tag git `multi-ia`, posé sur le dernier commit qui le contient : `git checkout multi-ia` pour le consulter. Pour le remettre, il faudrait l'adapter au code actuel, qui a continué d'évoluer sans lui.

## Déploiement et dépannage

**Déployez toujours tous les fichiers ensemble**, y compris les nouveaux : `index.html`, `sw.js`, `manifest.json`, les icônes, `reparer.html`, `package.json`, les dossiers `css/`, `js/`, `tools/` et `test/`. L'application est découpée en modules : il suffit qu'un seul fichier manque ou ne soit pas à jour pour que rien ne démarre (page vide, boutons sans effet).

Protections intégrées :

- `npm run build` refuse de produire une version incohérente (identifiant dupliqué, sélecteur pointant dans le vide, import en boucle), et les tests unitaires puis de bout en bout tournent avant chaque déploiement : s'ils échouent, rien n'est publié.
- Si un fichier est introuvable, une alerte « L'application ne démarre pas correctement » nomme le fichier fautif et propose **Réparer**.
- Si la page et les scripts sont de versions différentes, une alerte « Mise à jour incomplète » le signale et l'application reste utilisable autant que possible.
- Le service worker refuse d'installer une nouvelle version dont un fichier manque, ou dont la page et les scripts reçus ne portent pas le même numéro de version (copies encore en cache chez l'hébergeur juste après un déploiement) : l'ancienne version continue de fonctionner et l'installation est retentée plus tard. Il télécharge les fichiers avec le numéro de version dans l'adresse, puis sert toujours ceux de son installation, sans les rafraîchir un par un : une version installée reste cohérente, même hors ligne.
- **Réparer** ne vide les caches que si le serveur répond vraiment. Hors ligne (ou derrière la page de connexion d'un Wi-Fi public), il se contente de recharger, pour ne pas rendre l'application inutilisable jusqu'au retour du réseau. Après le nettoyage, il réinstalle le service worker et attend qu'il prenne la page en main (20 secondes au plus) avant de recharger : les fichiers arrivent alors tous de la même version, même si l'hébergeur garde encore une ancienne copie de l'un d'eux (jusqu'à 10 minutes après un déploiement, ce qui donne une erreur du type « ne fournit pas l'export… »). **Recharger** fait de même quand aucun service worker ne tient la page, par exemple à la première visite sur un appareil.
- Une nouvelle version ne prend jamais la main sous vos pieds. Elle s'installe en arrière-plan, puis une notification « Nouvelle version prête — Recharger » attend votre accord ; la page se recharge alors d'un bloc. C'est ce qui évite l'essentiel des « mises à jour incomplètes », où une page déjà ouverte se retrouvait à mélanger l'ancien HTML et les nouveaux scripts.

Si l'application ne répond plus malgré tout :

1. Vérifiez sur GitHub que tous les fichiers sont présents (ouvrez `js/read.js`, `js/boot.js`… dans votre dépôt) et que le déploiement est terminé.
2. Ouvrez `https://votre-adresse/reparer.html` et touchez **Réparer** : cela supprime les copies d'application en cache sur l'appareil puis rouvre l'application. La page fait la même vérification que le bouton de l'application : sans réseau, elle ne vide rien et le dit. **Vos histoires et vos réglages ne sont pas effacés.**
3. N'utilisez pas « Effacer les données du site » dans le navigateur : cela supprime aussi vos histoires stockées sur l'appareil (sauvegardez-les d'abord avec la synchronisation ou l'export).

## Politique de sécurité (CSP)

`index.html` contient une politique de sécurité qui limite les scripts à ceux de l'application et les connexions réseau aux deux services utilisés : `api.anthropic.com` (Claude) et `api.github.com`. Conséquence : pour ajouter un autre service, ajoutez son adresse à `connect-src` dans cette balise, sinon le navigateur bloquera les requêtes. Une erreur « Refused to connect » dans la console du navigateur indique ce cas.
