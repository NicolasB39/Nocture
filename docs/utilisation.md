# Utiliser Nocturne

L'interface, les réglages, la sauvegarde. Retour au [README](../README.md).

## Apparence

Thème sombre inspiré des applications de fiction interactive : fond noir, accent laiton, cartes de scénarios avec couverture, recherche, carte « Reprendre » pour la dernière histoire, choix de réponse sous forme de cartes et feuilles de réglages qui montent du bas.

La conversation, elle, **n'utilise pas de bulles** : chaque tour occupe la largeur de la colonne et un filet le sépare du suivant, pour qu'une longue partie se lise comme une page plutôt que comme une messagerie. Le tour du joueur se distingue par son alignement à droite. Le texte entre astérisques (`*un geste*`) s'affiche en gris, la parole en blanc : c'est le même deux-tons dans le récit et dans les suggestions de réponse.

Les deux ronds en bas à droite sautent d'un tour au précédent ou au suivant ; ils disparaissent dès qu'on atteint le bas du fil, là où ils ne serviraient qu'à masquer les propositions de réponse. Le bouton `✱` du composer encadre la sélection d'astérisques.

Le laiton `#e8b45c` est réservé aux **actions** : « Reprendre », boutons Enregistrer. Les **états** (badge « Nouveau », avertissement) n'en prennent qu'une version teintée, bordée, sur fond sombre, pour qu'un badge ne pèse pas autant qu'un bouton. Le rouge `#ff6b6b` reste réservé aux erreurs et aux actions destructrices. Les surfaces s'étagent du fond vers les cartes, les champs et les menus, et les contrôles (champ de saisie, listes, cartes de choix) portent une bordure plus claire que les simples séparateurs, pour rester visibles en plein soleil.

La marque est un **croissant posé sur une ligne d'horizon**. Elle vit à trois endroits qui doivent rester d'accord : le symbole `#i-logo` dans `index.html` (en-tête de la liste et écran vide), les cinq `icon-*.png` qui en sont le rendu en laiton sur le fond, et la variable CSS `--ast`, le même tracé en masque, qui dessine le motif des vignettes sans couverture. Si l'accent ou le dessin change, les cinq PNG sont à régénérer, sans quoi l'icône d'accueil jurera avec l'application.

Pour afficher une couverture sur un scénario GitHub, ajoutez une image `cover.webp` (ou `.png`, `.jpg`) dans son dossier. Pour un scénario créé dans l'application, choisissez une image dans ses réglages : elle est réduite à 600 px de large et convertie en WebP (en JPEG sur Safari, qui n'encode pas le WebP) avant d'être stockée sur l'appareil. Elle sert de vignette dans la liste et d'en-tête dans la conversation. Sans couverture, un visuel est généré à partir du nom : teinte, position du croissant (quatre géométries) et initiale du titre en grand, pour que deux scénarios voisins ne se ressemblent pas.

La recherche filtre la bibliothèque par titre et par début de récit, et la navigation entre la liste et une conversation passe par un fondu (`startViewTransition`) là où le navigateur le gère.

Les histoires sont rangées de la plus récemment jouée à la plus ancienne ; une histoire jamais jouée porte l'étiquette « Nouveau ». Un tour tapé mais pas envoyé reste dans la saisie quand on revient à l'histoire.

Au clavier, Entrée envoie le tour (Maj+Entrée pour un retour à la ligne) et Échap ferme les fenêtres. À la souris, les boutons sans texte affichent leur nom au survol.

### Sur ordinateur

À partir de 1200 px de large, la conversation garde sa largeur de lecture et un panneau à droite montre en permanence les personnages en scène (toucher l'un d'eux ouvre la fenêtre Personnages) et le dernier état, avec ses jauges et ses variations. Sans fiches ni panneau d'état, la colonne n'apparaît pas. Le titre, suivi d'un chevron, ouvre la liste des huit dernières histoires commencées pour en changer sans repasser par la bibliothèque ; la flèche de retour y mène toujours. Changer d'histoire pendant une réponse l'arrête, comme un retour à la bibliothèque. À la souris, les feuilles perdent leur poignée ; sur grand écran, la feuille Réglages de l'histoire s'élargit et son prompt système gagne en hauteur. Sous 1200 px, et sur téléphone, rien ne change.

### Police du récit

Le récit est composé en **Literata** (SIL Open Font License, `fonts/LICENSE-Literata.txt`), embarquée dans l'application : deux fichiers variables de 80 ko, romain et italique, sous-ensemble latin complet (Latin-1, latin étendu A et B, additionnel) plus toute la ponctuation générale et les symboles utilisés par l'interface, mis en cache par le service worker. Sans elle, les piles système donnaient Georgia sur Android et Iowan sur iPhone, donc deux rendus différents du même texte. La police sans empattement reste celle du système, car elle ne sert qu'à l'interface.

### Scénarios

Les scénarios viennent du dossier `scenarios/` du dépôt GitHub (voir [Écrire un scénario](scenarios.md)) ; le bouton ↻ de la bibliothèque les relit.

Tant qu'aucune clé API Claude n'est enregistrée, un bandeau le signale en haut de la liste et mène aux Réglages.

### Options de l'histoire

Le menu « … » d'une conversation range ses entrées par usage : en haut, deux tuiles pour les outils de lecture (Sommaire, Rechercher) ; puis « Mémoire et note » (chapitres, résumé, souvenirs et la note pour l'IA, une consigne envoyée avec la mémoire à chaque tour) et « Réglages de l'histoire » ; enfin, sous « Histoire », Nouvelle partie et Renommer, comme depuis la carte de la bibliothèque, et les Réglages de l'application.

### Actions d'un message

Sous le dernier message restent les actions qu'on utilise en lisant : régénérer, continuer et passer d'une variante à l'autre. Sur les messages plus anciens, « … » flotte en haut à droite du message, au survol de la souris, au focus clavier ou quand on touche le message : le fil se lit sans rangée de boutons entre chaque tour. Copier, modifier et supprimer à partir d'ici sont regroupés derrière le bouton « … », dans une feuille : moins de boutons au fil du texte, des cibles plus grandes, et plus de « supprimer » collé à « modifier ». La suppression reste annulable pendant quelques secondes.

### Mise en page de la conversation

- Pas de trait entre les messages : l'espacement suffit à séparer les tours.
- Les tours du joueur sont des cartes alignées à droite, texte aligné à gauche, avec un liseré laiton.
- L'en-tête prend la teinte du décor du moment (image floutée et assombrie) ; sans décor, celle de la couverture de l'histoire ; sans l'un ni l'autre, il reste neutre.
- Une lettrine ouvre chaque scène : la première réponse du récit, puis chaque réponse dont le lieu de l'état change. Un intertitre en italique annonce le lieu : en tête du récit pour la première scène, puis juste avant la réponse qui change de lieu.
- Le lieu est annoncé dès le début de la réponse. L'état arrive en fin de réponse, trop tard pour l'affichage progressif : quand le panneau d'état suit un champ « Lieu » (ou Endroit, Localisation, Position), l'IA est priée d'ouvrir sa réponse par une ligne `<lieu>Nouveau lieu</lieu>` quand le lieu change. Cette ligne n'est ni affichée ni gardée ; elle installe tout de suite l'intertitre, la lettrine, le décor de l'en-tête et celui des images de la réponse. Si l'IA l'oublie, l'intertitre arrive à la fin, en fondu, et le défilement compense sa hauteur pour que le texte ne saute pas.
- Typographie française à l'affichage (récit et choix) : apostrophes courbes, guillemets « », tirets de dialogue (une ligne qui commence par `- ` ou `-- `), points de suspension, espaces insécables avant `; ! ? :` et dans les guillemets. Le texte enregistré, copié ou envoyé à l'IA ne change pas. Les heures (12:30) et les adresses restent intactes.
- Le panneau d'état tient en une rangée de pastilles : les trois premières valeurs avec leur variation, et « +N » pour le reste. Le toucher le déplie en grille détaillée avec les jauges ; plié ou déplié, le choix vaut pour toutes les histoires.
- Quand une réponse arrive, les valeurs de l'état qui ont changé s'éclairent (en rouge si elles baissent), leur variation s'envole au-dessus et les jauges glissent de l'ancienne valeur à la nouvelle. Une fois seulement : jamais à la relecture.
- Écran de passage : quand la réponse annonce un nouveau lieu, son décor remplit l'écran avec le titre du lieu pendant l'attente du texte, puis s'efface (moins de trois secondes, un toucher le passe). Jamais en fin de réponse, où il recouvrirait le texte qu'on vient de lire. Sans décor, le titre seul sur fond sombre.
- « Précédemment » : en rouvrant une histoire laissée depuis plus de six heures, un encart en tête rappelle depuis quand, où, qui est en scène et les dernières phrases du narrateur, sans appel à l'IA. « Résumer » demande au modèle de la mémoire un vrai résumé des vingt derniers messages (environ 0,002 $). L'encart disparaît dès que le fil change (envoi, suppression, variante, modification) ou d'un toucher sur Fermer.
- Jour et nuit : si l'état a un champ Moment (ou Heure, Période), les décors se teintent, rose à l'aube, orangé au crépuscule, bleu sombre la nuit, où les personnages s'assombrissent aussi. Mots reconnus : aube, aurore, point du jour, lever ; soir, crépuscule, coucher, tombée de la nuit ; nuit, minuit ; ou une heure (« 21 h »). Le jour, ou un mot inconnu, ne teinte rien.
- Les scènes illustrées (décor et personnage) occupent toute la largeur, se fondent dans le fond par le bas et portent le lieu en légende, en haut à gauche. Les portraits sans décor gardent leur cadre.
- Les personnages détourés sont cadrés aux genoux, comme dans un roman visuel : le haut de la silhouette à 3 % du haut de la scène, les trois quarts de sa hauteur visibles, et le bas de l'image fondu dès 70 %. Les pieds ne sont jamais posés sur un sol à la mauvaise perspective. La case « Montrer les personnages en pied » (Réglages de l'application, section Lecture, pour toutes les histoires) revient au cadrage en pied : 90 % de la hauteur, pieds au bas de l'image. L'agrandissement d'une image montre toujours le personnage en entier.
- L'en-tête montre les personnages en scène (ceux que les six derniers messages nomment) : trois avatars empilés au plus, puis « +N ». Sans personnage en scène, l'icône Personnages revient. Les toucher ouvre la fenêtre Personnages.
- Histoire vide : sous la couverture, le titre, l'accroche et jusqu'à trois débuts proposés (toucher pour envoyer, crayon pour modifier). Source : `intro.md` pour un scénario GitHub, le champ « Introduction » de la feuille Réglages de l'histoire sinon. Les lignes qui commencent par `- ` ou `1. ` sont les débuts, le reste l'accroche.
- Pendant l'attente de la réponse, le premier personnage en scène « réfléchit » (avec son avatar), sur trois lignes fantômes ; sans personnage, « Réflexion… ». Le compteur de secondes apparaît après 2 secondes.
- Ouvrir une histoire depuis la liste fait glisser sa couverture jusqu'à l'en-tête (transition de vue, environ 0,4 s ; aucune animation si l'appareil demande moins d'animations ou ne gère pas les transitions de vue).
- Les feuilles (menus, réglages) montent du bas de l’écran et y redescendent, plus vite à la fermeture ; sur grand écran, la fenêtre centrée apparaît sur place. Au doigt, tirer le haut d’une feuille (poignée ou titre) vers le bas la ferme : un geste vif suffit, sinon un tiers de sa hauteur. Les notifications montent légèrement en fondu.
- Les flèches tour précédent / suivant s’effacent 2,5 s après le dernier défilement, pour ne pas couvrir le texte ; défiler ou toucher le fil les rappelle.
- Quand l’appareil demande moins d’animations, rien ne glisse : feuilles, notifications et flèches gardent seulement un fondu.
- Les compteurs (option « Afficher les compteurs ») tiennent dans une pastille : tokens du dernier envoi et coût estimé du tour, quand le modèle a un tarif. La toucher affiche le détail (tokens envoyés, cache, messages envoyés).
- Les suggestions sont des lignes numérotées : toucher le texte l'envoie, le crayon à droite le place dans la zone de saisie.

**Bifurquer d'ici** crée une nouvelle histoire qui reprend jusqu'à ce message inclus, et l'ouvre : on essaie une autre direction sans rien perdre de l'originale, qui reste intacte dans la liste. La copie garde les réglages de l'histoire, la note, les souvenirs et les relations ; les lignes récentes et les repères de la mémoire sont coupés au point de bifurcation. Le résumé, lui, ne peut pas être coupé : si le message choisi est déjà résumé, la notification invite à relire le résumé (… › Mémoire et note), qui peut raconter la suite.

### État et suggestions

L'état renvoyé par le modèle s'affiche en **carte sous chaque tour du narrateur**, avec les variations chiffrées depuis le tour précédent (`▲ +2`) et une jauge pour les valeurs bornées. Sur une longue partie, cela allonge le défilement : pour n'afficher la carte que sur le dernier tour, il suffit d'ajouter une condition `last` dans `stCard`.

Chaque suggestion de réponse se compose d'un crayon à gauche, dans son propre panneau, pour la reprendre dans la saisie, et d'une carte contenant le texte et la flèche d'envoi. Le texte de la carte est cliquable et envoie lui aussi.

Le protocole demande par défaut au modèle d'écrire **les gestes entre astérisques et les paroles en texte simple**, dans la narration comme dans les choix, puisque c'est ce que l'application met en gris et en blanc.

### Statistiques d'utilisation

Le bouton en forme d'histogramme, dans l'en-tête de la liste, ouvre les **tokens consommés par modèle**, selon quatre périodes : *Session* (depuis l'ouverture de l'application, jusqu'à sa fermeture complète), *Jour*, *Mois* et *Total*. Pour le jour et le mois, les flèches parcourent l'historique ; la vue du mois ajoute un histogramme jour par jour. La vue *Total* additionne tout ce qui est enregistré sur l'appareil, depuis le premier jour (ou le dernier « Effacer »), et liste chaque mois avec sa dépense ; toucher un mois l'ouvre. Chaque modèle (par exemple « claude-sonnet-5-5 ») affiche son total, ses tokens en entrée et en sortie, et son nombre de requêtes.

L'usage est relevé à chaque requête réussie, narration comme mémoire, à partir du décompte renvoyé par Claude. La sortie comprend les tokens de réflexion, facturés comme de la sortie. Quand une réponse est interrompue (réseau, Arrêter), Claude n'a encore compté qu'un token de sortie : la sortie est alors **estimée** sur le texte reçu, et la feuille le signale (« 3 requêtes sont estimées »). Les requêtes annulées ou en erreur sans texte ne comptent pas ; un refus de Claude, lui, compte, car l'API le facture (au moins l'entrée, et le texte déjà écrit s'il survient en cours de réponse).

La feuille affiche aussi un **coût estimé**, pour la période et par modèle. Les tarifs publics des modèles Claude sont intégrés (`js/cost.js`, vérifiés le 31 octobre 2026), cache compris : les tokens lus en cache sont comptés au tarif réduit (un dixième de l'entrée, un vingtième pour Opus 5.5 et Sonnet 5.5, un quarantième pour Fable 5.1), ceux écrits au tarif majoré (1,25 fois l'entrée, 2 fois avec le cache d'une heure). Un modèle absent de `js/cost.js` est signalé « sans tarif » et n'est pas compté : son tarif s'ajoute dans ce fichier. Les tarifs étant publiés en dollars, « Devise » permet d'afficher en euros avec le taux de votre choix. C'est une estimation : votre facture fait foi. Haiku 5.5 coûte cinq fois plus quand le prompt dépasse 100 000 tokens (cache compris) : ces requêtes ont leur propre ligne, « claude-haiku-5-5 (prompt > 100 k) », comptée au tarif majoré. Quand Claude refuse une réponse et que le relais la confie à un autre modèle (voir « Refus »), elle est comptée pour le modèle qui a vraiment répondu. Le taux est gardé dans les réglages de l'appareil.

Les statistiques sont enregistrées sur l'appareil, dans un enregistrement à part des réglages, écrit avec un léger différé et à chaque mise en arrière-plan. Elles ne font partie ni de l'export en fichier ni de la sauvegarde en ligne, et ne se synchronisent donc pas entre appareils. Entre deux fenêtres de l'application ouvertes sur le même appareil (onglet et application installée), elles s'additionnent : chaque fenêtre n'écrit que ce qu'elle a compté depuis sa dernière lecture. Les réglages, eux, sont relus par les autres fenêtres à chaque enregistrement, pour qu'aucune ne réécrive une clé ou un tarif périmé. « Effacer » les remet à zéro, sans toucher aux histoires. Un jour et un modèle occupent une centaine d'octets : l'historique n'est pas purgé.

### Journal des appels

Pour comprendre où partent les tokens, cochez « Journal des appels » (Réglages, section « Compteurs et journal ») : l'application garde alors, sur l'appareil, les **100 dernières requêtes envoyées à Claude**, texte compris, avec leur type (tour, régénérer, indication, continuer, mémoire, relance du cache), le modèle qui a répondu, les tokens envoyés, lus et écrits en cache, la sortie, le coût estimé et la raison de fin, ou l'erreur. Le bouton « Journal des appels » de la feuille Statistiques les liste, du plus récent au plus ancien ; touchez un appel pour son détail :

- **Hors cache** : la part de l'entrée payée plein tarif.
- **Cache** (requêtes de narration) : le préfixe comparé à la requête réussie précédente de la même histoire. Trois cas : le cache a expiré (plus de 5 minutes, ou une heure, sans lecture ni relance), et tout le prompt est réécrit ; le préfixe est identique et seule la suite est nouvelle ; ou le journal nomme le premier bloc qui a changé (modèle ou effort, partie fixe du prompt, mémoire, ou tel message), à partir duquel tout a été réécrit en cache.
- **Composition** : partie fixe, mémoire, historique et fin de requête, en tokens estimés.
- **Fin de requête, hors cache** : le dernier message découpé en blocs (votre message, lorebook déclenché, fiches des personnages en scène, passages anciens, état précédent, indication) avec leur taille. C'est là qu'on voit ce qui gagnerait à passer dans la partie fixe.
- **Requête complète**, telle qu'envoyée.

« Exporter » enregistre le journal en JSON (pour l'analyser ailleurs) et « Vider » l'efface. Avec la sauvegarde GitHub configurée, « Envoyer sur GitHub » dépose ce même fichier dans le dépôt de sauvegarde, sous `<dossier de sauvegarde>/journal/journal-AAAA-MM-JJ-HHMMSS.json` : un nouveau fichier à chaque envoi, que la synchronisation des histoires ignore (elle ne lit que la racine du dossier). Sinon, le journal reste sur l'appareil : il n'est ni synchronisé ni sauvegardé automatiquement, et la clé API n'y figure jamais. Une requête de narration pèse de quelques dizaines à quelques centaines de kilo-octets ; décochez la case une fois l'analyse faite.

### Repères dans le fil

Chaque message est horodaté à l'écriture. Quand plus de six heures ou un changement de jour séparent deux messages, une ligne discrète marque la coupure : une heure pour une reprise dans la journée, « hier », « aujourd'hui » ou la date pour un retour plus tardif. Les histoires écrites avant cette version n'ont pas d'horodatage et n'affichent donc aucune coupure tant qu'on ne les reprend pas.

En quittant une conversation, l'application retient le message en haut de l'écran et y revient à la réouverture, avec un bouton « Aller en bas ». Si vous étiez déjà en bas, rien n'est retenu.

### Pendant la génération

Au bout de trois secondes sans texte, le bloc en cours affiche « Réflexion… 12 s ». C'est surtout utile quand le modèle réfléchit avant de répondre : sans cela, rien ne bouge. Les messages d'état (nouvelle tentative, mise à jour de la mémoire) s'affichent en pastille au bas du fil, par-dessus le texte, pour ne pas changer la hauteur de la zone de lecture ; seules les erreurs prennent leur place sous le fil. Un message d'état invisible, destiné aux lecteurs d'écran, annonce le début et la fin de la réponse, et l'auteur de chaque message est annoncé avant son texte.

Pendant l'écriture, les paragraphes terminés sont figés : seul le dernier est reconstruit à chaque rafraîchissement, au lieu de tout le texte reçu. Une longue réponse reste ainsi fluide sur un téléphone modeste. Dès que la réponse aborde son bloc d'état ou de choix, plus rien n'est figé, pour que ces blocs restent masqués. Le message définitif est ensuite rendu normalement. De même, le calcul du prompt qui alimente le compteur n'est refait que si quelque chose qui l'influence a changé ; l'envoi, lui, recalcule toujours tout.

## Personnages

Le bouton en forme de silhouettes, dans l'en-tête de la conversation, ouvre la fenêtre **Personnages** : une ligne par personnage du scénario, avec son portrait (sa première image, ou une pastille à son initiale), son nom et son résumé. Ceux qui sont nommés dans les six derniers messages passent en tête, avec l'étiquette « En scène », et le premier d'entre eux est déplié.

Toucher une ligne la déplie : la galerie de ses images (chacune s'ouvre en grand, avec le nom de l'expression tiré du nom de fichier) et **votre relation avec lui**, telle que la mémoire l'a retenue. Seul le résumé de la fiche (`résumé:`) est montré, jamais la fiche complète, qui est écrite pour l'IA et peut contenir des secrets.

En bas, **Personnes croisées** liste les relations mémorisées avec des gens qui n'ont pas de fiche, par exemple un aubergiste inventé par le modèle en cours de partie. Un scénario créé dans l'application, qui n'a pas de fiches, n'affiche que cette section.

Cette fenêtre ne coûte rien : elle n'interroge pas l'IA et ne change pas le prompt.

## Lecture

Section « Lecture » des Réglages (roue dentée de la liste, ou menu « … » de la conversation, puis Réglages de l'application). Ces réglages s'appliquent et s'enregistrent immédiatement, sans passer par « Enregistrer », et la ligne d'aperçu permet d'en juger, puisque la feuille floute la conversation derrière elle :

- **Taille du texte** de 14 à 30 px, **interlignage** de 1,4 à 2,1, **police du récit** (serif ou sans serif), **largeur de colonne** et **paragraphes**, avec aperçu. Les réglages sont conservés sur l'appareil.
- La largeur de colonne est une vraie mesure : elle vaut le nombre choisi multiplié par la taille du texte, donc agrandir le texte élargit la colonne et le nombre de caractères par ligne reste constant.
- **Paragraphes** : *Espacés* laisse un blanc entre les paragraphes, *Alinéa* les colle et décale la première ligne, comme dans un livre imprimé. Le récit est découpé en vrais paragraphes par l'application, l'espacement ne dépend donc plus des lignes vides écrites par le modèle. Les images portent une marge nulle : l'écart vient de leurs voisins, 3 px côté texte (qui s'ajoutent au demi-interligne de la ligne voisine) et 10 px entre deux images consécutives, pour qu'elles ne se touchent pas.
- **Défilement pendant la réponse** : l'écran ne bouge pas pendant que l'IA écrit. À l'envoi, le fil descend une seule fois pour montrer votre message et l'indicateur de réflexion ; la réponse s'écrit ensuite en dessous, et le message définitif prend la place du texte provisoire sans décaler l'écran, images comprises. Le bouton flèche permet de descendre quand vous voulez.

## Panneau d'état

L'IA peut suivre l'état du jeu (lieu, santé, argent, humeur…). À chaque réponse elle ajoute un bloc `<etat>` (masqué dans le texte) que l'application affiche dans un panneau sous le titre : deux pastilles repliées, tous les champs une fois ouvert, avec une barre pour les valeurs de la forme `72/100`. L'état précédent est renvoyé à l'IA à chaque tour pour assurer la cohérence.

Activation : menu « … » de la conversation, Réglages de l'histoire, section Narration, « Panneau d'état », puis la liste des champs (séparés par des virgules ou des lignes). Pour un scénario GitHub, un fichier `etat.md` (par exemple `Lieu, Santé (0/100), Argent, Humeur`) active le panneau par défaut.

## Repères dans la conversation

- **Sommaire** (menu « … ») : une frise des scènes du récit, une par lieu (le même découpage que les intertitres), sur toute l'histoire. Chaque chapitre a son étiquette, son titre et la première ligne de son résumé (« Lire » l'affiche en entier), puis ses scènes : un point sur un fil, le lieu et le nombre de tours. La scène en cours est en doré, avec « Vous êtes ici ». Toucher une scène y mène, et son premier message clignote à l'arrivée. Un lieu revisité apparaît deux fois, à sa place dans le récit. Sans champ « Lieu » dans l'état, le Sommaire reste la liste des lignes récentes de la mémoire.
- **Recherche dans l'histoire** (menu « … ») : cherche dans tous les messages, affiche un extrait autour de chaque occurrence et saute au message choisi, même s'il est au-delà des messages affichés.
- **Panneau d'état** : chaque valeur numérique affiche sa variation depuis le tour précédent (▲ +1, ▼ −4).
- **Images** : touchez une image pour l'ouvrir en plein écran.

## Gestes

- Toucher une suggestion l'envoie directement. Le crayon à sa droite la place dans la zone de saisie pour la modifier avant d'envoyer.
- Toucher un ancien message affiche ses actions ; le toucher à nouveau les masque.
- Balayer horizontalement la dernière réponse passe d'une variante à l'autre, comme les chevrons.
- Appui long (ou clic droit) sur « Régénérer » : régénérer avec une indication.

## Sauvegarde en ligne

Les histoires restent d'abord sur l'appareil. La sauvegarde en ligne les copie dans un dossier (un fichier par histoire, un fichier par couverture et un index) et les synchronise entre vos appareils. Réglages, Sauvegarde en ligne (ou icône nuage de la liste).

Fonctionnement : à chaque synchronisation, l'application lit l'index distant, garde pour chaque scénario la version la plus récente, applique les suppressions, puis ne renvoie que les histoires modifiées. La couverture est dans un fichier à part, renvoyé seulement quand elle change ; l'index retient son empreinte. Tous vos appareils doivent utiliser cette version de l'application : une version antérieure lirait les histoires sans leur couverture. Rien n'est écrasé à l'aveugle. Si la même histoire a été jouée des deux côtés depuis la dernière synchronisation, la version la plus ancienne n'est pas perdue : elle est conservée à part sous le même nom suivi de « (conflit) » (une seule copie par version perdue, même si une synchronisation coupée est relancée), à vous de choisir laquelle garder. Quand l'appareil n'a pas encore d'historique de synchronisation pour une histoire (première synchronisation, autre dépôt, histoire importée) et que les deux versions diffèrent, on ne peut pas savoir laquelle prolonge l'autre : la plus ancienne est aussi gardée en copie « (conflit) ». Un fichier distant illisible n'est jamais remplacé. Les clés API ne sont pas sauvegardées. La synchronisation se lance à l'ouverture, en quittant une conversation, en quittant l'application et au toucher du nuage. Elle attend la fin d'une réponse en cours. Si elle rapporte une version plus récente de l'histoire ouverte, l'écran est rechargé avec cette version dès qu'elle est écrite, pour que le tour suivant ne l'écrase pas ; si l'histoire a été supprimée ailleurs, la conversation se ferme. Elle repose sur l'horloge des appareils : gardez-les à l'heure.

Ce qui se passe pendant une synchronisation :

- Une histoire jouée ou modifiée ici pendant qu'elle tourne (ou dont une réponse est en cours) n'est pas remplacée par la version en ligne, ni supprimée par une suppression venue d'un autre appareil. La synchronisation suivante voit les deux versions et garde la plus ancienne en copie « (conflit) ».
- Une histoire supprimée ici pendant qu'elle tourne reste supprimée : la suppression part au passage suivant.
- L'index retient l'empreinte de chaque fichier envoyé. Si un autre appareil a réécrit un fichier sans avoir encore mis l'index à jour (synchronisation en cours ou interrompue), c'est le fichier qui fait foi.
- Un enregistrement fait pendant la synchronisation garde le repère « à synchroniser » : il partira en quittant la conversation ou l'application.

**Importer** une sauvegarde JSON (Réglages) remplace les histoires de même identifiant, mais garde leur date d'origine : une vieille sauvegarde ne passe jamais pour la version la plus récente. Si la version en ligne diffère, la synchronisation suivante garde la plus récente et met l'autre en copie « (conflit) ». Une histoire supprimée puis réimportée n'est pas supprimée de nouveau.

**Changer de dépôt** : l'historique de synchronisation (versions vues et suppressions) appartient au dépôt et repart de zéro pour un autre, mais seulement après une synchronisation réussie, pour qu'une faute de frappe dans le nom n'efface rien.

Tous vos appareils doivent utiliser la même version de l'application. En particulier, une version antérieure à la v39 ne reconnaît pas une histoire GitHub recommencée (vidée depuis le premier message) et lui remettrait ses anciens messages.

### En cas d'erreur ou de mauvaise configuration

- Si la dernière synchronisation a échoué, un **point rouge** apparaît sur le nuage. Touchez le nuage : le message d'erreur propose « Modifier la configuration ».
- Après « Enregistrer », la synchronisation se lance tout de suite et affiche son résultat (« Sauvegarde à jour » ou l'erreur).
- La configuration est aussi accessible par la roue dentée (Réglages), section « GitHub et sauvegarde », bouton « Configurer… ».
- « Effacer la configuration » oublie le dépôt et le jeton sur l'appareil. Les histoires et le fichier de sauvegarde en ligne ne sont pas touchés.
- Réglages, section « GitHub et sauvegarde », indique l'espace occupé sur l'appareil et si le navigateur a accordé la **conservation** des données. Sans elle, le navigateur peut effacer les histoires quand l'espace manque : c'est la vraie raison de configurer une sauvegarde en ligne.

### Configurer GitHub

1. Créez un dépôt **privé** dédié, par exemple `sauvegardes`, avec un fichier README pour l'initialiser.
2. GitHub, Settings, Developer settings, Personal access tokens, Fine-grained tokens : créez un jeton limité à ce seul dépôt, permission **Contents : Read and write**.
3. Dans l'application : cochez « Sauvegarder sur GitHub », puis dépôt `proprietaire/sauvegardes`, jeton, Enregistrer.

Le jeton est stocké en clair dans le navigateur de l'appareil, comme les clés API. Un jeton limité à un dépôt de sauvegarde ne donne accès à rien d'autre. Chaque synchronisation avec changement crée un commit dans ce dépôt. Pour que le dépôt ne grossisse pas sans fin, l'application compacte l'historique en un seul commit tous les 100 commits environ (les fichiers ne changent pas, seules les anciennes versions disparaissent, GitHub les nettoie ensuite à son rythme). Par sécurité, elle ne le fait que si le dépôt ne contient que la sauvegarde (plus un README, une licence ou des fichiers `.git*`) : si vous l'avez pointée vers un dépôt qui contient autre chose, l'historique n'est jamais touché. Une branche protégée contre la réécriture empêche aussi le compactage, sans gêner la synchronisation.

## Streaming

Le texte s'affiche au fur et à mesure que Claude le diffuse. Les modèles réfléchissent avant de répondre : l'application affiche alors « Réflexion… » et le texte n'apparaît qu'ensuite.

## Sécurité

La clé API est stockée en clair dans le navigateur de l'appareil et envoyée uniquement à l'API de Claude. Ne l'utilisez pas sur un appareil partagé. Elle n'est jamais incluse dans les sauvegardes.
