# Utiliser Nocturne

L'interface, les réglages, la sauvegarde. Retour au [README](../README.md). Le prompt, le cache et la mémoire sont décrits dans [technique.md](technique.md), l'écriture des scénarios dans [scenarios.md](scenarios.md).

## Apparence

Thème sombre inspiré des applications de fiction interactive : fond noir, accent laiton, cartes de scénarios avec couverture, recherche, carte « Reprendre » pour la dernière histoire, suggestions de réponse numérotées et feuilles de réglages qui montent du bas.

La conversation **n'utilise pas de bulles** : chaque réponse occupe la largeur de la colonne, pour qu'une longue partie se lise comme une page plutôt que comme une messagerie. Dans les réponses du narrateur, le récit s'affiche en gris clair et les paroles en blanc : l'application repère elle-même ce qui est entre guillemets « », sans dépendre des astérisques du narrateur ; un terme cité (« phénomène saisonnier », un surnom) reste du récit. Dans vos messages et les suggestions, le geste entre astérisques (`*un geste*`) est en gris, le reste en blanc.

Le laiton `#e8b45c` est réservé aux **actions** : « Reprendre », boutons Enregistrer. Les **états** (badge « Nouveau », avertissement) n'en prennent qu'une version teintée, bordée, sur fond sombre, pour qu'un badge ne pèse pas autant qu'un bouton. Le rouge `#ff6b6b` reste réservé aux erreurs et aux actions destructrices. Les contrôles (champ de saisie, listes, choix) portent une bordure plus claire que les simples séparateurs, pour rester visibles en plein soleil.

La marque est un **croissant posé sur une ligne d'horizon**, à trois endroits qui doivent rester d'accord : le symbole `#i-logo` dans `index.html`, les cinq `icon-*.png` (son rendu en laiton) et la variable CSS `--ast` (le même tracé en masque, pour les vignettes sans couverture). Si l'accent ou le dessin change, les cinq PNG sont à régénérer.

**Couverture.** Pour un scénario GitHub, c'est l'image `cover.webp` de son dossier (voir [Écrire un scénario](scenarios.md#structure-des-scénarios)). Pour un scénario créé dans l'application, choisissez une image dans ses réglages : elle est réduite à 600 px de large et convertie en WebP (en JPEG sur Safari) avant d'être stockée sur l'appareil. Elle sert de vignette dans la liste et d'en-tête dans la conversation. Sans couverture, un visuel est généré à partir du nom (teinte, position du croissant, initiale du titre), pour que deux scénarios voisins ne se ressemblent pas.

La recherche filtre la bibliothèque par titre et par début de récit. Les histoires sont rangées de la plus récemment jouée à la plus ancienne ; une histoire jamais jouée porte l'étiquette « Nouveau ». Un tour tapé mais pas envoyé reste dans la saisie quand on revient à l'histoire.

Au clavier, Entrée envoie le tour (Maj+Entrée pour un retour à la ligne) et Échap ferme les fenêtres. À la souris, les boutons sans texte affichent leur nom au survol.

### Sur ordinateur

À partir de 1200 px de large, la conversation garde sa largeur de lecture et un panneau à droite montre en permanence les personnages en scène (toucher l'un d'eux ouvre la fenêtre Personnages) et le dernier état, avec ses jauges et ses variations. Sans fiches ni panneau d'état, la colonne n'apparaît pas. Le titre, suivi d'un chevron, ouvre la liste des huit dernières histoires commencées pour en changer sans repasser par la bibliothèque ; la flèche de retour y mène toujours. Changer d'histoire pendant une réponse l'arrête, comme un retour à la bibliothèque. À la souris, les feuilles perdent leur poignée ; la feuille Réglages de l'histoire s'élargit et son prompt système gagne en hauteur. Sous 1200 px, rien ne change.

### Police du récit

Le récit est composé en **Literata** (SIL Open Font License, `fonts/LICENSE-Literata.txt`), embarquée dans l'application et mise en cache par le service worker : le même texte a le même rendu sur Android et sur iPhone. L'interface garde la police sans empattement du système.

### Scénarios

Les scénarios viennent du dossier `scenarios/` du dépôt GitHub (voir [Écrire un scénario](scenarios.md)) ; le bouton ↻ de la bibliothèque les relit.

Tant qu'aucune clé API Claude n'est enregistrée, un bandeau le signale en haut de la liste et mène aux Réglages. Les Réglages de l'application gardent en haut la clé API, les modèles et le cache, puis « Lecture », « Narration », « Compteurs et journal » et « GitHub et sauvegarde » dans des sections repliées.

### Options de l'histoire

Le menu « … » d'une conversation range ses entrées par usage : en haut, deux tuiles pour les outils de lecture (Sommaire, Rechercher) ; puis « Mémoire et note » (chapitres, résumé, souvenirs et la note pour l'IA, une consigne envoyée avec la mémoire à chaque tour et présentée au narrateur comme prioritaire : videz-la une fois suivie) et « Réglages de l'histoire » ; enfin, sous « Histoire », Nouvelle partie et Renommer, comme depuis la carte de la bibliothèque, et les Réglages de l'application.

### Actions d'un message

Sous le dernier message restent les actions qu'on utilise en lisant : régénérer, continuer et passer d'une variante à l'autre. Sur les messages plus anciens, « … » apparaît en haut à droite du message, au survol de la souris, au focus clavier ou quand on touche le message (le toucher à nouveau le masque). Il ouvre une feuille : copier, modifier, supprimer à partir d'ici, bifurquer. La suppression reste annulable pendant quelques secondes.

**Bifurquer d'ici** crée une nouvelle histoire qui reprend jusqu'à ce message inclus, et l'ouvre : on essaie une autre direction sans rien perdre de l'originale, qui reste intacte dans la liste. La copie garde les réglages de l'histoire, la note, les souvenirs et les relations ; les lignes récentes et les repères de la mémoire sont coupés au point de bifurcation. Le résumé, lui, ne peut pas être coupé : si le message choisi est déjà résumé, la notification invite à relire le résumé (… › Mémoire et note), qui peut raconter la suite.

### Mise en page de la conversation

- Pas de trait entre les messages : l'espacement suffit à séparer les tours. Les tours du joueur sont des cartes alignées à droite, texte aligné à gauche, avec un liseré laiton.
- L'en-tête prend la teinte du décor du moment (image floutée et assombrie) ; sans décor, celle de la couverture ; sans l'un ni l'autre, il reste neutre.
- L'en-tête montre les personnages en scène (ceux que les six derniers messages nomment) : trois avatars empilés au plus, puis « +N ». Sans personnage en scène, l'icône Personnages revient. Les toucher ouvre la fenêtre Personnages.
- Une lettrine ouvre chaque scène : la première réponse du récit, puis chaque réponse dont le lieu change. Un intertitre en italique annonce le lieu, juste avant la réponse qui en change. Quand le panneau d'état suit un lieu, l'IA annonce le nouveau lieu dès le début de sa réponse (voir [Protocole](scenarios.md#protocole-et-préambule)) : l'intertitre, la lettrine et le décor s'installent avant le texte. Si l'IA l'oublie, l'intertitre arrive à la fin, en fondu, sans faire sauter le texte.
- Écran de passage : quand la réponse annonce un nouveau lieu, son décor remplit l'écran avec le titre du lieu pendant l'attente du texte, puis s'efface (moins de trois secondes, un toucher le passe). Sans décor, le titre seul sur fond sombre.
- Typographie française à l'affichage (récit et choix) : apostrophes courbes, guillemets « », tirets de dialogue (une ligne qui commence par `- ` ou `-- `), points de suspension, espaces insécables avant `; ! ? :` et dans les guillemets. Le texte enregistré, copié ou envoyé à l'IA ne change pas. Les heures (12:30) et les adresses restent intactes.
- « Précédemment » : en rouvrant une histoire laissée depuis plus de six heures, un encart en tête rappelle depuis quand, où, qui est en scène et les dernières phrases du narrateur, sans appel à l'IA. « Résumer » demande au modèle de la mémoire un vrai résumé des vingt derniers messages (environ 0,002 $). L'encart disparaît dès que le fil change (envoi, suppression, variante, modification) ou d'un toucher sur Fermer.
- Les scènes illustrées (décor et personnage) occupent toute la largeur, se fondent dans le fond par le bas et portent le lieu en légende, en haut à gauche. Les personnages détourés sont en buste, comme dans un roman visuel ([Décors](scenarios.md#décors)). Les portraits sans décor gardent leur cadre. Toucher une image l'ouvre en plein écran.
- Jour et nuit : si l'état a un champ Moment (ou Heure, Période), les décors se teintent, rose à l'aube, orangé au crépuscule, bleu sombre la nuit, où les personnages s'assombrissent aussi. Mots reconnus : aube, aurore, point du jour, lever ; soir, crépuscule, coucher, tombée de la nuit ; nuit, minuit ; ou une heure (« 21 h »). Le jour, ou un mot inconnu, ne teinte rien.
- Histoire vide : sous la couverture, le titre, l'accroche et jusqu'à trois débuts proposés (toucher pour envoyer, crayon pour modifier). Source : `intro.md` pour un scénario GitHub, le champ « Introduction » de la feuille Réglages de l'histoire sinon. Les lignes qui commencent par `- ` ou `1. ` sont les débuts, le reste l'accroche.
- Les deux ronds en bas à droite sautent d'un tour au précédent ou au suivant. Ils disparaissent en bas du fil et s'effacent 2,5 s après le dernier défilement ; défiler ou toucher le fil les rappelle. Le bouton `✱` de la zone de saisie encadre la sélection d'astérisques.
- Ouvrir une histoire depuis la liste fait glisser sa couverture jusqu'à l'en-tête, là où le navigateur gère les transitions de vue.
- Les feuilles (menus, réglages) montent du bas de l'écran et y redescendent ; sur grand écran, la fenêtre centrée apparaît sur place. Au doigt, tirer le haut d'une feuille (poignée ou titre) vers le bas la ferme : un geste vif suffit, sinon un tiers de sa hauteur. Dans une feuille qui s'enregistre (réglages de l'application ou de l'histoire, mémoire, modification d'un message), si quelque chose a changé (texte, case, souvenir retiré, couverture), ce geste, le retour du téléphone ou Échap demandent d'abord « Abandonner les modifications ? » ; la section Lecture, appliquée tout de suite, n'en compte pas ; Annuler et Enregistrer ferment sans question. Dans un champ d'une ligne (renommer, ajouter un souvenir), la touche Entrée du clavier valide.
- Quand l'appareil demande moins d'animations, rien ne glisse : feuilles, notifications et flèches gardent seulement un fondu.
- Les compteurs (option « Afficher les compteurs ») tiennent dans une pastille : tokens du dernier envoi et coût estimé du tour, quand le modèle a un tarif. La toucher affiche le détail (tokens envoyés, cache, messages envoyés ; voir [Prompt et cache](technique.md#prompt-et-cache)).

### État et suggestions

L'état s'affiche en carte sous chaque réponse du narrateur (voir [Panneau d'état](#panneau-détat)).

Les suggestions de réponse sont des lignes numérotées : toucher le texte l'envoie, le crayon à droite le place dans la zone de saisie pour le modifier avant d'envoyer. Dans un scénario à jets de dés, une action risquée porte une étiquette avec sa chance de réussite (voir [Mode jeu de rôle](scenarios.md#mode-jeu-de-rôle-reglesmd)).

### Statistiques d'utilisation

Le bouton en forme d'histogramme, dans l'en-tête de la liste, ouvre les **tokens consommés par modèle** (total, entrée, sortie, nombre de requêtes), selon quatre périodes : *Session* (jusqu'à la fermeture complète de l'application), *Jour*, *Mois*, avec un histogramme jour par jour, et *Total*, qui liste chaque mois depuis le premier jour (ou le dernier « Effacer »). Les flèches parcourent les jours et les mois ; toucher un mois du Total l'ouvre.

L'usage est relevé à chaque requête réussie, narration comme mémoire, à partir du décompte renvoyé par Claude ; la sortie comprend les tokens de réflexion. Quand une réponse est interrompue (réseau, Arrêter), la sortie est **estimée** sur le texte reçu, et la feuille le signale (« 3 requêtes sont estimées »). Les requêtes annulées ou en erreur sans texte ne comptent pas ; un refus de Claude, lui, compte, car l'API le facture.

La feuille affiche aussi un **coût estimé**, pour la période et par modèle, d'après les tarifs publics intégrés dans `js/cost.js`, cache compris : les tokens lus en cache au tarif réduit (voir [Prompt et cache](technique.md#prompt-et-cache)), ceux écrits au tarif majoré (1,25 fois l'entrée, 2 fois avec le cache d'une heure). Un modèle absent de `js/cost.js` est signalé « sans tarif » et n'est pas compté : son tarif s'ajoute dans ce fichier. Haiku 5.5 coûte cinq fois plus quand le prompt dépasse 100 000 tokens (cache compris) : ces requêtes ont leur propre ligne, « claude-haiku-5-5 (prompt > 100 k) ». Une réponse confiée par le relais à un autre modèle (voir [Refus](technique.md#api-claude)) est comptée pour le modèle qui a vraiment répondu. « Devise » affiche en euros avec le taux de votre choix. C'est une estimation : votre facture fait foi.

Les statistiques restent sur l'appareil : elles ne font partie ni de l'export ni de la sauvegarde en ligne. Deux fenêtres de l'application ouvertes sur le même appareil additionnent leurs comptes sans se les écraser. « Effacer » les remet à zéro, sans toucher aux histoires.

### Journal des appels

Pour comprendre où partent les tokens, cochez « Journal des appels » (Réglages, section « Compteurs et journal ») : l'application garde alors, sur l'appareil, les **100 dernières requêtes envoyées à Claude**, texte compris, avec leur type (tour, régénérer, indication, continuer, mémoire, relance du cache), le modèle qui a répondu, les tokens envoyés, lus et écrits en cache, la sortie, le coût estimé et la raison de fin, ou l'erreur. Le bouton « Journal des appels » de la feuille Statistiques les liste, du plus récent au plus ancien ; touchez un appel pour son détail :

- **Hors cache** : la part de l'entrée payée plein tarif.
- **Cache** (requêtes de narration) : le préfixe comparé à la requête réussie précédente de la même histoire. Trois cas : le cache a expiré (plus de 5 minutes, ou une heure, sans lecture ni relance), et tout le prompt est réécrit ; le préfixe est identique et seule la suite est nouvelle ; ou le journal nomme le premier bloc qui a changé (modèle ou effort, partie fixe du prompt, mémoire, ou tel message), à partir duquel tout a été réécrit en cache.
- **Composition** : partie fixe, mémoire, historique et fin de requête, en tokens estimés.
- **Fin de requête, hors cache** : le dernier message découpé en blocs (votre message, lorebook déclenché, fiches des personnages en scène, passages anciens, état précédent, indication) avec leur taille. C'est là qu'on voit ce qui gagnerait à passer dans la partie fixe.
- **Requête complète**, telle qu'envoyée.

« Exporter » enregistre le journal en JSON et « Vider » l'efface. Avec la sauvegarde GitHub configurée, « Envoyer sur GitHub » dépose ce même fichier dans le dépôt de sauvegarde, sous `<dossier de sauvegarde>/journal/journal-AAAA-MM-JJ-HHMMSS.json` : un nouveau fichier à chaque envoi, que la synchronisation des histoires ignore. Sinon, le journal reste sur l'appareil, ni synchronisé ni sauvegardé ; la clé API n'y figure jamais. Une requête de narration pèse de quelques dizaines à quelques centaines de kilo-octets : décochez la case une fois l'analyse faite.

### Repères dans le fil

Chaque message est horodaté à l'écriture. Quand plus de six heures ou un changement de jour séparent deux messages, une ligne discrète marque la coupure : une heure pour une reprise dans la journée, « hier », « aujourd'hui » ou la date pour un retour plus tardif. Un message sans horodatage n'en affiche pas.

En quittant une conversation, l'application retient le message en haut de l'écran et y revient à la réouverture, avec un bouton « Aller en bas ». Si vous étiez déjà en bas, rien n'est retenu.

### Pendant la génération

Le texte s'affiche au fur et à mesure que Claude le diffuse. Avant le premier mot, le premier personnage en scène « réfléchit » (avec son avatar), sur trois lignes fantômes ; sans personnage, « Réflexion… ». Un compteur de secondes s'y ajoute au bout de quelques secondes : c'est surtout utile quand le modèle réfléchit avant de répondre, sans quoi rien ne bougerait.

L'écran ne bouge pas pendant que l'IA écrit : à l'envoi, le fil descend une seule fois pour montrer votre message et l'indicateur de réflexion ; la réponse s'écrit ensuite en dessous, et le message définitif prend la place du texte provisoire sans décaler l'écran, images comprises. Le bouton flèche permet de descendre quand vous voulez.

Les messages d'état (nouvelle tentative, mise à jour de la mémoire) s'affichent en pastille au bas du fil, par-dessus le texte ; seules les erreurs prennent leur place sous le fil. Un anneau autour du bouton Envoyer montre quand la mémoire se mettra à jour (voir [Quand la mémoire avance](technique.md#quand-la-mémoire-avance)). Pour les lecteurs d'écran, le début et la fin de la réponse sont annoncés, et l'auteur de chaque message est annoncé avant son texte.

## Personnages

Le bouton en forme de silhouettes, dans l'en-tête de la conversation, ouvre la fenêtre **Personnages** : une ligne par personnage du scénario, avec son portrait (sa première image, ou une pastille à son initiale), son nom et son résumé. Ceux qui sont nommés dans les six derniers messages passent en tête, avec l'étiquette « En scène », et le premier d'entre eux est déplié.

Toucher une ligne la déplie : la galerie de ses images (chacune s'ouvre en grand, avec le nom de l'expression tiré du nom de fichier), **votre relation avec lui**, telle que la mémoire l'a retenue, et ses **souvenirs** : les cinq derniers souvenirs mémorisés qui le citent, par son nom ou un mot-clé de sa fiche. Ils n'apparaissent qu'une fois la mémoire mise à jour, après une soixantaine de tours. Seul le résumé de la fiche (`résumé:`) est montré, jamais la fiche complète, qui est écrite pour l'IA et peut contenir des secrets.

En bas, **Personnes croisées** liste les relations mémorisées avec des gens qui n'ont pas de fiche, par exemple un aubergiste inventé par le modèle en cours de partie. Un scénario créé dans l'application, qui n'a pas de fiches, n'affiche que cette section.

Cette fenêtre ne coûte rien : elle n'interroge pas l'IA et ne change pas le prompt.

## Lecture

Section « Lecture » des Réglages (roue dentée de la liste, ou menu « … » de la conversation, puis Réglages de l'application). Ces réglages s'appliquent et s'enregistrent immédiatement, sur l'appareil, et une ligne d'aperçu permet d'en juger :

- **Taille du texte** de 14 à 30 px, **interlignage** de 1,4 à 2,1, **police du récit** (serif ou sans serif).
- **Largeur de colonne** : le nombre choisi multiplié par la taille du texte, donc agrandir le texte élargit la colonne et le nombre de caractères par ligne reste constant.
- **Paragraphes** : *Espacés* laisse un blanc entre les paragraphes, *Alinéa* les colle et décale la première ligne, comme dans un livre imprimé. L'application découpe elle-même le récit en paragraphes, quelles que soient les lignes vides écrites par le modèle.

## Panneau d'état

L'IA peut suivre l'état du jeu (lieu, santé, argent, humeur…). À chaque réponse elle ajoute un bloc `<etat>`, masqué dans le texte, que l'application affiche en carte sous la réponse : une rangée de pastilles, les trois premières valeurs avec leur variation depuis le tour précédent (▲ +1, ▼ −4) et « +N » pour le reste. La toucher la déplie en grille détaillée, avec une jauge pour les valeurs de la forme `72/100` ; plié ou déplié, le choix vaut pour toutes les histoires. Quand une réponse arrive, les valeurs qui ont changé s'éclairent (en rouge si elles baissent) et les jauges glissent de l'ancienne valeur à la nouvelle, une seule fois. L'état précédent est renvoyé à l'IA à chaque tour pour assurer la cohérence.

Activation : menu « … » de la conversation, Réglages de l'histoire, section Narration, « Panneau d'état », puis la liste des champs (séparés par des virgules ou des lignes). Pour un scénario GitHub, un fichier `etat.md` (par exemple `Lieu, Santé (0/100), Argent, Humeur`) active le panneau par défaut.

## Repères dans la conversation

- **Sommaire** (menu « … ») : une frise des scènes du récit, une par lieu (le même découpage que les intertitres), sur toute l'histoire. Chaque chapitre a son étiquette, son titre et la première ligne de son résumé (« Lire » l'affiche en entier), puis ses scènes : un point sur un fil, le lieu et le nombre de tours. La scène en cours est en doré, avec « Vous êtes ici ». Toucher une scène y mène, et son premier message clignote à l'arrivée. Un lieu revisité apparaît deux fois, à sa place dans le récit. Sans champ « Lieu » dans l'état, le Sommaire reste la liste des lignes récentes de la mémoire.
- **Recherche dans l'histoire** (menu « … ») : cherche dans tous les messages, affiche un extrait autour de chaque occurrence et saute au message choisi, même s'il est au-delà des messages affichés.

## Gestes

- Toucher une suggestion l'envoie directement ; le crayon à sa droite la place dans la zone de saisie.
- Toucher un ancien message affiche ses actions ; le toucher à nouveau les masque.
- Balayer horizontalement la dernière réponse passe d'une variante à l'autre, comme les chevrons.
- Appui long (ou clic droit) sur « Régénérer » : régénérer avec une indication.

## Sauvegarde en ligne

Les histoires restent d'abord sur l'appareil. La sauvegarde en ligne les copie dans un dépôt GitHub (un fichier par histoire, un fichier par couverture et un index) et les synchronise entre vos appareils. Réglages, section « GitHub et sauvegarde » (ou icône nuage de la liste).

Fonctionnement : à chaque synchronisation, l'application lit l'index distant, garde pour chaque scénario la version la plus récente, applique les suppressions, puis ne renvoie que les histoires modifiées ; une couverture n'est renvoyée que si elle change. Rien n'est écrasé à l'aveugle. Si la même histoire a été jouée des deux côtés depuis la dernière synchronisation, la version la plus ancienne est conservée à part sous le même nom suivi de « (conflit) », à vous de choisir laquelle garder. Il en va de même quand l'appareil n'a pas encore d'historique de synchronisation pour une histoire (première synchronisation, autre dépôt, histoire importée) et que les deux versions diffèrent. Un fichier distant illisible n'est jamais remplacé. Les clés API ne sont pas sauvegardées.

La synchronisation se lance à l'ouverture, en quittant une conversation, en quittant l'application et au toucher du nuage. Elle attend la fin d'une réponse en cours. Si elle rapporte une version plus récente de l'histoire ouverte, l'écran est rechargé avec cette version, pour que le tour suivant ne l'écrase pas ; si l'histoire a été supprimée ailleurs, la conversation se ferme. Elle repose sur l'horloge des appareils : gardez-les à l'heure, et utilisez la même version de l'application sur tous.

Ce qui se passe pendant une synchronisation :

- Une histoire jouée ou modifiée ici pendant qu'elle tourne n'est ni remplacée ni supprimée par la version en ligne : la synchronisation suivante garde la plus ancienne en copie « (conflit) », et l'enregistrement part en quittant la conversation ou l'application.
- Une histoire supprimée ici pendant qu'elle tourne reste supprimée : la suppression part au passage suivant.
- Si un autre appareil a réécrit un fichier sans avoir encore mis l'index à jour, c'est le fichier qui fait foi.

**Importer** une sauvegarde JSON (Réglages) remplace les histoires de même identifiant, mais garde leur date d'origine : une vieille sauvegarde ne passe jamais pour la version la plus récente. Si la version en ligne diffère, la synchronisation suivante garde la plus récente et met l'autre en copie « (conflit) ». Une histoire supprimée puis réimportée n'est pas supprimée de nouveau.

**Changer de dépôt** : l'historique de synchronisation (versions vues et suppressions) appartient au dépôt et repart de zéro pour un autre, mais seulement après une synchronisation réussie, pour qu'une faute de frappe dans le nom n'efface rien.

### En cas d'erreur ou de mauvaise configuration

- Si la dernière synchronisation a échoué, un **point rouge** apparaît sur le nuage. Touchez le nuage : le message d'erreur propose « Modifier la configuration ».
- Après « Enregistrer », la synchronisation se lance tout de suite et affiche son résultat (« Sauvegarde à jour » ou l'erreur).
- La configuration est aussi accessible par la roue dentée (Réglages), section « GitHub et sauvegarde », bouton « Configurer… », qui s'ouvre par-dessus les Réglages : on les retrouve en le fermant.
- « Effacer la configuration » oublie le dépôt et le jeton sur l'appareil. Les histoires et le fichier de sauvegarde en ligne ne sont pas touchés.
- Réglages, section « GitHub et sauvegarde », indique l'espace occupé sur l'appareil et si le navigateur a accordé la **conservation** des données. Sans elle, le navigateur peut effacer les histoires quand l'espace manque : c'est la vraie raison de configurer une sauvegarde en ligne.

### Configurer GitHub

1. Créez un dépôt **privé** dédié, par exemple `sauvegardes`, avec un fichier README pour l'initialiser.
2. GitHub, Settings, Developer settings, Personal access tokens, Fine-grained tokens : créez un jeton limité à ce seul dépôt, permission **Contents : Read and write**.
3. Dans l'application : cochez « Sauvegarder sur GitHub », puis dépôt `proprietaire/sauvegardes`, jeton, Enregistrer.

Le jeton est stocké en clair dans le navigateur de l'appareil, comme la clé API. Un jeton limité à un dépôt de sauvegarde ne donne accès à rien d'autre. Chaque synchronisation avec changement crée un commit dans ce dépôt. Pour que le dépôt ne grossisse pas sans fin, l'application compacte l'historique en un seul commit tous les 100 commits environ (les fichiers ne changent pas, seules les anciennes versions disparaissent). Par sécurité, elle ne le fait que si le dépôt ne contient que la sauvegarde (plus un README, une licence ou des fichiers `.git*`) : un dépôt qui contient autre chose n'est jamais compacté. Une branche protégée contre la réécriture empêche aussi le compactage, sans gêner la synchronisation.

## Sécurité

La clé API est stockée en clair dans le navigateur de l'appareil et envoyée uniquement à l'API de Claude. Ne l'utilisez pas sur un appareil partagé. Elle n'est jamais incluse dans les sauvegardes.
