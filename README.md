# Nocturne

Application web installable (PWA) pour jouer des histoires interactives avec une IA. Tout tourne dans le navigateur : les scénarios, l'historique et la mémoire sont stockés localement (IndexedDB), les requêtes partent directement vers l'API de Claude (Anthropic).

## Mise en ligne (GitHub Pages)

1. Déposer à la racine du dépôt tous les fichiers de l'application (voir « Structure du code »).
2. Copier `index.yml` dans `.github/workflows/index.yml`.
3. Réglages du dépôt, Pages, Source : **GitHub Actions**.

Le workflow a deux étapes. **test** installe Playwright, lance les tests unitaires (`npm test`), construit, puis lance le test de bout en bout dans Chromium (`npm run test:e2e`) ; en cas d'échec, la capture `e2e-echec.png` est jointe à l'exécution. **deploy** ne part que si **test** a réussi : il refait `npm run build` et publie, sans `node_modules` ni navigateur dans le site. `npm run build` calcule un numéro de version à partir du contenu des fichiers et met à jour tout seul le service worker, les préchargements et les numéros de version. Il échoue si `index.html` contient un identifiant dupliqué, un `label for=` orphelin, si un module vise un élément absent de la page, si deux modules s'importent en boucle (voir « Structure du code »), ou si une règle CSS fixe `display` sur une feuille (`dialog`) sans viser `[open]` : une feuille fermée reprendrait alors sa place dans le flux et allongerait la page.

Le workflow génère aussi `index.json` (liste des fichiers de `scenarios/`) à chaque push. L'application le lit en priorité, ce qui évite la limite de 60 requêtes par heure de l'API GitHub et fonctionne avec un domaine personnalisé. Sans `index.json`, elle interroge l'API GitHub (dépôt déduit de l'URL, ou saisi dans Réglages).

## Structure des scénarios

```
scenarios/
  Mon scenario/
    systeme.md              prompt système (obligatoire)
    cover.webp              couverture (optionnelle)
    etat.md                 champs du panneau d'état (optionnel)
    intro.md                accroche et débuts proposés, affichés avant le premier tour (optionnel)
    avatar.md               description du personnage du joueur
    personnages/
      Alice/
        fiche.md            fiche du personnage
        sourire.webp        image, code : alice_sourire
    lorebook/
      dragon.md
```

Le nom du dossier devient le nom du scénario. Le texte peut contenir `{{user}}` (nom du joueur). N'y écrivez pas de consignes sur le format des blocs `<etat>` ou `<choix>` : voir « Protocole et préambule ».

### Fiches de personnages

Une fiche peut commencer par des lignes d'en-tête, comme le lorebook :

```
résumé: herboriste du village, amie d'enfance du joueur
mots-clés: herboriste, apothicaire
toujours: non

Alice a trente ans, les mains tachées de sève…
```

L'IA reçoit **en permanence** la liste de tous les personnages du monde, une ligne chacun (le `résumé:`, ou à défaut la première ligne de la fiche). Elle sait donc toujours qui existe et peut faire entrer qui elle veut.

La **fiche complète** n'est envoyée que lorsque le personnage est en scène : son nom ou un de ses mots-clés apparaît dans les six derniers messages ou dans le panneau d'état. `toujours: oui` force l'envoi permanent, pour un compagnon de route par exemple : la fiche passe alors dans la partie stable du prompt, qui reste en cache, et n'est jamais envoyée une seconde fois quand le personnage est en scène.

Tant que l'ensemble des fiches tient dans un budget modeste (environ 3 000 tokens), aucune n'est filtrée : un scénario de quelques personnages reçoit toutes ses fiches à chaque tour, elles aussi dans la partie stable. Le lorebook suit la même règle, avec le même budget.

La partie stable est relue en cache à un dixième du prix d'entrée au plus (un vingtième sur Sonnet et Opus 5.5, un quarantième sur Fable 5.1), alors que la fin de requête est payée plein tarif à chaque tour. Des fiches et un lorebook modestes coûtent donc moins en entier dans la partie stable que par morceaux en fin de requête : environ 5 % du coût d'un tour en moins sur un scénario comme « Réincarné par le Système » (5 fiches et 11 entrées). Le lorebook garde son fonctionnement par mots-clés si « Entrées max » est réglé dans le scénario, et tout redevient déclenché au-delà du budget.

Les codes d'images de tous les personnages sont envoyés en permanence, regroupés par personnage, dans la partie stable, avec la consigne de n'utiliser que ceux d'un personnage présent dans la scène. L'IA peut ainsi montrer un personnage dès son entrée, sans attendre le tour suivant.

### Images

Les images de `personnages/<Nom>/` (formats `.png`, `.webp`, `.jpg`, `.jpeg`, `.gif`) sont proposées à l'IA sous le code `nom_fichier` (minuscules, sans extension). L'IA les affiche avec `{{img::alice_sourire}}` seul sur une ligne.

L'application affiche l'image **là où le modèle l'écrit**, en tête, au milieu ou à la fin. C'est donc la consigne qui décide : le protocole demande de la placer à l'endroit du récit qu'elle illustre et de ne pas ouvrir systématiquement la réponse par une image, et la liste des codes envoyée à chaque tour le rappelle. Si un scénario demande lui-même « commence par l'image » dans son prompt système, cette phrase l'emporte, et c'est à elle qu'il faut toucher. Les messages déjà écrits gardent leurs images où elles sont ; seules les nouvelles réponses suivent la nouvelle consigne.

La reconnaissance du code est tolérante : majuscules, accents, espaces, tirets et tirets bas sont équivalents (`alice_sourire heureux`, `alice_sourire_heureux` et `Alice-Sourire-Heureux` désignent le même fichier), et le nom du fichier seul suffit s'il est unique (`sourire_heureux`). Quand un code ne correspond à aucune image, un repère « image introuvable : code » s'affiche à la place, au lieu de ne rien montrer.

Après avoir renommé des images :

- Les anciens messages gardent les anciens codes : ils afficheront le repère « image introuvable ». Modifiez le message ou régénérez la réponse.
- Réglages du scénario (menu « … »), section « Images détectées » : vignettes et codes exacts vus par l'application, avec le bouton « Recharger l'index » pour relire la liste des fichiers sans fermer l'application. L'index lui-même n'est régénéré qu'au déploiement GitHub (quelques dizaines de secondes après le push).

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

Dans les réglages du scénario (menu « … », section « Mémoire et lorebook ») : nombre de messages scannés (défaut 2) et nombre maximum d'entrées injectées. Les entrées `toujours` comptent dans ce maximum et passent toujours ; les entrées déclenchées se partagent la place restante, par priorité.

## Protocole et préambule

L'application est propriétaire du **protocole** : les formats du bloc `<etat>`, du bloc `<choix>` et de la syntaxe `{{img::}}` sont produits par `js/protocol.js`, pas par les scénarios. Un `systeme.md` ne décrit donc plus que la fiction : le monde, la voix, le registre, le rythme.

Conséquences :

- Faire évoluer un format se fait en un seul endroit, pour tous les scénarios à la fois.
- Le protocole peut s'adapter au modèle. Réglages, « Consignes de format » : **Automatique** choisit des consignes concises pour Sonnet et Opus, qui les suivent bien, et détaillées pour les autres (Haiku, Fable), **Détaillées** et **Concises** forcent l'un ou l'autre. Le mode concis raccourcit les consignes et supprime le rappel de fin, ce qui économise environ 250 caractères par requête.
- Si un `systeme.md` contient encore `<choix>`, `<etat>` ou `{{img::`, l'application le signale à l'ouverture de la conversation et dans la feuille Scénario : l'IA recevrait deux versions du même format, et arbitrerait mal. Retirez ces lignes.

Le **préambule commun** (Réglages) est votre texte à vous, ajouté au prompt système de tous les scénarios : longueur des réponses, personne, registre, manies de narration. Un scénario peut s'en affranchir avec « Ignorer le préambule commun » dans sa section Narration.

Ce qui reste au scénario : tout ce qui touche à la voix. Ce qui passe à l'application : tout ce qui touche à la forme des blocs.

## Apparence

Thème sombre inspiré des applications de fiction interactive : fond noir, accent laiton, cartes de scénarios avec couverture, onglets de filtre, carte « Reprendre » pour la dernière histoire, choix de réponse sous forme de cartes et feuilles de réglages qui montent du bas.

La conversation, elle, **n'utilise pas de bulles** : chaque tour occupe la largeur de la colonne et un filet le sépare du suivant, pour qu'une longue partie se lise comme une page plutôt que comme une messagerie. Le tour du joueur se distingue par son alignement à droite. Le texte entre astérisques (`*un geste*`) s'affiche en gris, la parole en blanc : c'est le même deux-tons dans le récit et dans les suggestions de réponse.

Les deux ronds en bas à droite sautent d'un tour au précédent ou au suivant ; ils disparaissent dès qu'on atteint le bas du fil, là où ils ne serviraient qu'à masquer les propositions de réponse. Le bouton `✱` du composer encadre la sélection d'astérisques.

Le laiton `#e8b45c` est réservé aux **actions** : bouton « Nouveau », « Reprendre », boutons Enregistrer. Les **états** (onglet actif, badge « Nouveau », avertissement) n'en prennent qu'une version teintée, bordée, sur fond sombre, pour qu'un badge ne pèse pas autant qu'un bouton. Le rouge `#ff6b6b` reste réservé aux erreurs et aux actions destructrices. Les surfaces s'étagent du fond vers les cartes, les champs et les menus, et les contrôles (champ de saisie, listes, cartes de choix) portent une bordure plus claire que les simples séparateurs, pour rester visibles en plein soleil.

La marque est un **croissant posé sur une ligne d'horizon**. Elle vit à trois endroits qui doivent rester d'accord : le symbole `#i-logo` dans `index.html` (en-tête de la liste et écran vide), les cinq `icon-*.png` qui en sont le rendu en laiton sur le fond, et la variable CSS `--ast`, le même tracé en masque, qui dessine le motif des vignettes sans couverture. Si l'accent ou le dessin change, les cinq PNG sont à régénérer, sans quoi l'icône d'accueil jurera avec l'application.

Pour afficher une couverture sur un scénario GitHub, ajoutez une image `cover.webp` (ou `.png`, `.jpg`) dans son dossier. Pour un scénario créé dans l'application, choisissez une image dans ses réglages : elle est réduite à 600 px de large et convertie en WebP avant d'être stockée sur l'appareil. Elle sert de vignette dans la liste et d'en-tête dans la conversation. Sans couverture, un visuel est généré à partir du nom : teinte, position du croissant (quatre géométries) et initiale du titre en grand, pour que deux scénarios voisins ne se ressemblent pas.

Les onglets de filtre affichent le nombre de scénarios qu'ils contiennent, et la navigation entre la liste et une conversation passe par un fondu (`startViewTransition`) là où le navigateur le gère.

Les cartes portent les étiquettes utiles : « Nouveau » pour une histoire jamais jouée, « Brouillon » quand un tour commencé attend dans la saisie, « Épinglé » pour celles qu'on garde en tête de liste (menu « … », Épingler). L'épinglage compte comme une modification : il se synchronise entre appareils.

Au clavier : `/` place le curseur dans la recherche, `Échap` quitte une conversation.

### Police du récit

Le récit est composé en **Literata** (SIL Open Font License, `fonts/LICENSE-Literata.txt`), embarquée dans l'application : deux fichiers variables de 80 ko, romain et italique, sous-ensemble latin complet (Latin-1, latin étendu A et B, additionnel) plus toute la ponctuation générale et les symboles utilisés par l'interface, mis en cache par le service worker. Sans elle, les piles système donnaient Georgia sur Android et Iowan sur iPhone, donc deux rendus différents du même texte. La police sans empattement reste celle du système, car elle ne sert qu'à l'interface.

### Nouveau scénario

« Nouveau » demande un nom, puis propose un point de départ : enquête contemporaine, fantasy de voyage, huis clos, ou page blanche. Le canevas choisi remplit le prompt système, qui s'ouvre aussitôt pour être réécrit. Les canevas ne décrivent que la fiction : aucun ne touche au protocole (voir « Protocole et préambule »).

Tant qu'aucune clé API Claude n'est enregistrée, un bandeau le signale en haut de la liste et mène aux Réglages.

### Actions d'un message

Sous le dernier message restent les actions qu'on utilise en lisant : écouter, régénérer, continuer et passer d'une variante à l'autre. Sur les messages plus anciens, écouter et « … » flottent en haut à droite du message, au survol de la souris, au focus clavier ou quand on touche le message : le fil se lit sans rangée de boutons entre chaque tour. Copier, modifier et supprimer à partir d'ici sont regroupés derrière le bouton « … », dans une feuille : moins de boutons au fil du texte, des cibles plus grandes, et plus de « supprimer » collé à « modifier ». La suppression reste annulable pendant quelques secondes.

### Mise en page de la conversation

- Pas de trait entre les messages : l'espacement suffit à séparer les tours.
- Les tours du joueur sont des cartes alignées à droite, texte aligné à gauche, avec un liseré de la couleur d'accent.
- L'en-tête prend la teinte du décor du moment (image floutée et assombrie) ; sans décor, celle de la couverture de l'histoire ; sans l'un ni l'autre, il reste neutre.
- Une lettrine ouvre chaque scène : la première réponse du récit, puis chaque réponse dont le lieu de l'état change. Un intertitre en italique annonce le lieu : en tête du récit pour la première scène, puis juste avant la réponse qui change de lieu.
- Le lieu est annoncé dès le début de la réponse. L'état arrive en fin de réponse, trop tard pour l'affichage progressif : quand le panneau d'état suit un champ « Lieu » (ou Endroit, Localisation, Position), l'IA est priée d'ouvrir sa réponse par une ligne `<lieu>Nouveau lieu</lieu>` quand le lieu change. Cette ligne n'est ni affichée ni gardée ; elle installe tout de suite l'intertitre, la lettrine, le décor de l'en-tête et celui des images de la réponse. Si l'IA l'oublie, l'intertitre arrive à la fin, en fondu, et le défilement compense sa hauteur pour que le texte ne saute pas.
- Typographie française à l'affichage (récit et choix) : apostrophes courbes, guillemets « », tirets de dialogue (une ligne qui commence par `- ` ou `-- `), points de suspension, espaces insécables avant `; ! ? :` et dans les guillemets. Le texte enregistré, copié ou envoyé à l'IA ne change pas. Les heures (12:30) et les adresses restent intactes.
- Le panneau d'état tient en une rangée de pastilles : les trois premières valeurs avec leur variation, et « +N » pour le reste. Le toucher le déplie en grille détaillée avec les jauges ; plié ou déplié, le choix vaut pour toutes les histoires.
- Les scènes illustrées (décor et personnage) occupent toute la largeur, se fondent dans le fond par le bas et portent le lieu en légende, en haut à gauche. Les portraits sans décor gardent leur cadre.
- Les personnages détourés sont cadrés aux genoux, comme dans un roman visuel : le haut de la silhouette à 3 % du haut de la scène, les trois quarts de sa hauteur visibles, et le bas de l'image fondu dès 70 %. Les pieds ne sont jamais posés sur un sol à la mauvaise perspective. La case « Montrer les personnages en pied » (feuille Scénario, section Narration) revient au cadrage en pied : 90 % de la hauteur, pieds au bas de l'image. L'agrandissement d'une image montre toujours le personnage en entier.
- L'en-tête montre les personnages en scène (ceux que les six derniers messages nomment) : trois avatars empilés au plus, puis « +N ». Sans personnage en scène, l'icône Personnages revient. Les toucher ouvre la fenêtre Personnages.
- Histoire vide : sous la couverture, le titre, l'accroche et jusqu'à trois débuts proposés (toucher pour envoyer, crayon pour modifier). Source : `intro.md` pour un scénario GitHub, le champ « Introduction » de la feuille Scénario sinon. Les lignes qui commencent par `- ` ou `1. ` sont les débuts, le reste l'accroche.
- Pendant l'attente de la réponse, le premier personnage en scène « réfléchit » (avec son avatar), sur trois lignes fantômes ; sans personnage, « Réflexion… ». Le compteur de secondes apparaît après 2 secondes.
- Ouvrir une histoire depuis la liste fait glisser sa couverture jusqu'à l'en-tête (transition de vue, environ 0,4 s ; aucune animation si l'appareil demande moins d'animations ou ne gère pas les transitions de vue).
- Couleur d'accent par scénario (feuille Scénario, sous la couverture) : au choix, ou tirée de la couverture (la teinte la plus vive, éclaircie pour rester lisible). Elle colore le liseré des tours, les numéros des choix, la lettrine, les intertitres et le bouton d'envoi de cette histoire seulement. « Par défaut » revient à la couleur de l'appli.
- Les compteurs (option « Afficher les compteurs ») tiennent dans une pastille : tokens du dernier envoi et coût estimé du tour, quand le modèle a un tarif. La toucher affiche le détail (tokens envoyés, cache, messages envoyés).
- Les suggestions sont des lignes numérotées : toucher le texte l'envoie, le crayon à droite le place dans la zone de saisie.

**Bifurquer d'ici** crée une nouvelle histoire qui reprend jusqu'à ce message inclus, et l'ouvre : on essaie une autre direction sans rien perdre de l'originale, qui reste intacte dans la liste. La copie garde les réglages du scénario, la note, les souvenirs et les relations ; les lignes récentes et les repères de la mémoire sont coupés au point de bifurcation. Le résumé, lui, ne peut pas être coupé : si le message choisi est déjà résumé, la notification invite à relire le résumé (… › Mémoire), qui peut raconter la suite.

### État et suggestions

L'état renvoyé par le modèle s'affiche en **carte sous chaque tour du narrateur**, avec les variations chiffrées depuis le tour précédent (`▲ +2`) et une jauge pour les valeurs bornées. Sur une longue partie, cela allonge le défilement : pour n'afficher la carte que sur le dernier tour, il suffit d'ajouter une condition `last` dans `stCard`.

Chaque suggestion de réponse se compose d'un crayon à gauche, dans son propre panneau, pour la reprendre dans la saisie, et d'une carte contenant le texte et la flèche d'envoi. Le texte de la carte est cliquable et envoie lui aussi.

Le protocole demande par défaut au modèle d'écrire **les gestes entre astérisques et les paroles en texte simple**, dans la narration comme dans les choix, puisque c'est ce que l'application met en gris et en blanc. La case « Demander les gestes entre astérisques » dans les options du scénario (section Narration) retire cette consigne pour un scénario qui veut imposer son propre style, y compris dans la consigne par défaut des choix.

### Statistiques d'utilisation

Le bouton en forme d'histogramme, dans l'en-tête de la liste, ouvre les **tokens consommés par modèle**, selon trois périodes : *Session* (depuis l'ouverture de l'application, jusqu'à sa fermeture complète), *Jour* et *Mois*. Pour les deux dernières, les flèches parcourent l'historique ; la vue du mois ajoute un histogramme jour par jour. Chaque modèle affiche son total, ses tokens en entrée et en sortie, et son nombre de requêtes, sous le nom « Claude ». Les statistiques enregistrées autrefois pour un autre fournisseur restent affichées, sous son nom technique (par exemple « groq »).

L'usage est relevé à chaque requête réussie, narration comme mémoire, à partir du décompte renvoyé par Claude. La sortie comprend les tokens de réflexion, facturés comme de la sortie. Si une réponse arrive sans décompte, la requête est **estimée** avec le même calcul que la jauge, et la feuille le signale (« 3 requêtes sont estimées »). Les requêtes annulées ou en erreur sans texte ne comptent pas ; un refus de Claude, lui, compte, car l'API le facture (au moins l'entrée, et le texte déjà écrit s'il survient en cours de réponse).

La feuille affiche aussi un **coût estimé**, pour la période et par modèle. Les tarifs publics des modèles Claude sont intégrés (`js/cost.js`, vérifiés le 31 octobre 2026), cache compris : les tokens lus en cache sont comptés au tarif réduit (un dixième de l'entrée, un vingtième pour Opus 5.5 et Sonnet 5.5, un quarantième pour Fable 5.1), ceux écrits au tarif majoré (1,25 fois l'entrée, 2 fois avec le cache d'une heure). Pour un modèle absent de `js/cost.js`, « Ajouter un tarif » sous le modèle demande les prix en dollars par million de tokens (`entrée / sortie`, et en option le cache lu) ; `0 / 0` pour une offre gratuite. Le même bouton, « Tarif », remplace un tarif intégré, et un champ vide y revient. Un modèle sans tarif est signalé et n'est pas compté. Les tarifs étant publiés en dollars, « Devise » permet d'afficher en euros avec le taux de votre choix. C'est une estimation : votre facture fait foi. Haiku 5.5 coûte cinq fois plus quand le prompt dépasse 100 000 tokens (cache compris) : ces requêtes ont leur propre ligne, « claude-haiku-5-5 (prompt > 100 k) », comptée au tarif majoré. Quand Claude refuse une réponse et que le relais la confie à un autre modèle (voir « Refus »), elle est comptée pour le modèle qui a vraiment répondu. Les tarifs personnalisés et le taux sont gardés dans les réglages de l'appareil. Les statistiques enregistrées avant cette version n'ont pas le détail du cache : elles sont comptées au tarif plein de l'entrée.

**Plafond mensuel** (bouton de la feuille Statistiques) : un montant, dans la devise affichée, au-delà duquel l'application prévient. Une notification apparaît à 80 % puis à 100 % du plafond, une fois par mois et par seuil, avec un bouton « Voir » qui ouvre la vue du mois ; la feuille affiche en permanence la dépense du mois et sa jauge, qui passe en rouge une fois le plafond atteint. Le plafond ne bloque aucun envoi : il compte sur le coût estimé, donc seulement les modèles qui ont un tarif. Il est gardé en dollars, comme les tarifs, et converti à l'affichage. Le montant et le taux de change acceptent une unité ou des espaces (« 15 € », « 1 000 ») ; une saisie illisible est refusée au lieu d'effacer le réglage, et réenregistrer le même plafond ne refait pas partir les notifications du mois.

Les statistiques sont enregistrées sur l'appareil, dans un enregistrement à part des réglages, écrit avec un léger différé et à chaque mise en arrière-plan. Elles ne font partie ni de l'export en fichier ni de la sauvegarde en ligne, et ne se synchronisent donc pas entre appareils. Entre deux fenêtres de l'application ouvertes sur le même appareil (onglet et application installée), elles s'additionnent : chaque fenêtre n'écrit que ce qu'elle a compté depuis sa dernière lecture. Les réglages, eux, sont relus par les autres fenêtres à chaque enregistrement, pour qu'aucune ne réécrive une clé ou un tarif périmé. « Effacer » les remet à zéro, sans toucher aux histoires. Un jour et un modèle occupent une centaine d'octets : l'historique n'est pas purgé.

### Journal des appels

Pour comprendre où partent les tokens, cochez « Journal des appels » (Réglages, section « Compteurs et débit ») : l'application garde alors, sur l'appareil, les **100 dernières requêtes envoyées à Claude**, texte compris, avec leur type (tour, régénérer, indication, continuer, mémoire, relance du cache), le modèle qui a répondu, les tokens envoyés, lus et écrits en cache, la sortie, le coût estimé et la raison de fin, ou l'erreur. Le bouton « Journal des appels » de la feuille Statistiques les liste, du plus récent au plus ancien ; touchez un appel pour son détail :

- **Hors cache** : la part de l'entrée payée plein tarif.
- **Cache** (requêtes de narration) : le préfixe comparé à la requête réussie précédente de la même histoire. Trois cas : le cache a expiré (plus de 5 minutes, ou une heure, sans lecture ni relance), et tout le prompt est réécrit ; le préfixe est identique et seule la suite est nouvelle ; ou le journal nomme le premier bloc qui a changé (modèle ou effort, partie fixe du prompt, mémoire, ou tel message), à partir duquel tout a été réécrit en cache.
- **Composition** : partie fixe, mémoire, historique et fin de requête, en tokens estimés.
- **Fin de requête, hors cache** : le dernier message découpé en blocs (votre message, lorebook déclenché, fiches des personnages en scène, passages anciens, état précédent, indication, rappel des formats) avec leur taille. C'est là qu'on voit ce qui gagnerait à passer dans la partie fixe.
- **Requête complète**, telle qu'envoyée.

« Exporter » enregistre le journal en JSON (pour l'analyser ailleurs) et « Vider » l'efface. Avec la sauvegarde GitHub configurée, « Envoyer sur GitHub » dépose ce même fichier dans le dépôt de sauvegarde, sous `<dossier de sauvegarde>/journal/journal-AAAA-MM-JJ-HHMMSS.json` : un nouveau fichier à chaque envoi, que la synchronisation des histoires ignore (elle ne lit que la racine du dossier). Sinon, le journal reste sur l'appareil : il n'est ni synchronisé ni sauvegardé automatiquement, et la clé API n'y figure jamais. Une requête de narration pèse de quelques dizaines à quelques centaines de kilo-octets ; décochez la case une fois l'analyse faite.

### Repères dans le fil

Chaque message est horodaté à l'écriture. Quand plus de six heures ou un changement de jour séparent deux messages, une ligne discrète marque la coupure : une heure pour une reprise dans la journée, « hier », « aujourd'hui » ou la date pour un retour plus tardif. Les histoires écrites avant cette version n'ont pas d'horodatage et n'affichent donc aucune coupure tant qu'on ne les reprend pas.

En quittant une conversation, l'application retient le message en haut de l'écran et y revient à la réouverture, avec un bouton « Aller en bas ». Si vous étiez déjà en bas, rien n'est retenu.

### Pendant la génération

Au bout de trois secondes sans texte, le bloc en cours affiche « Réflexion… 12 s ». C'est surtout utile quand le streaming est coupé ou que le modèle raisonne avant de répondre : sans cela, rien ne bouge. Les messages d'état (pause de débit, mise à jour de la mémoire) s'affichent en pastille au bas du fil, par-dessus le texte, pour ne pas changer la hauteur de la zone de lecture ; seules les erreurs prennent leur place sous le fil. Un message d'état invisible, destiné aux lecteurs d'écran, annonce le début et la fin de la réponse, et l'auteur de chaque message est annoncé avant son texte.

Pendant l'écriture, les paragraphes terminés sont figés : seul le dernier est reconstruit à chaque rafraîchissement, au lieu de tout le texte reçu. Une longue réponse reste ainsi fluide sur un téléphone modeste. Dès que la réponse aborde son bloc d'état ou de choix, plus rien n'est figé, pour que ces blocs restent masqués. Le message définitif est ensuite rendu normalement. De même, le calcul du prompt qui alimente le compteur n'est refait que si quelque chose qui l'influence a changé ; l'envoi, lui, recalcule toujours tout.

## Personnages

Le bouton en forme de silhouettes, dans l'en-tête de la conversation, ouvre la fenêtre **Personnages** : une ligne par personnage du scénario, avec son portrait (sa première image, ou une pastille à son initiale), son nom et son résumé. Ceux qui sont nommés dans les six derniers messages passent en tête, avec l'étiquette « En scène », et le premier d'entre eux est déplié.

Toucher une ligne la déplie : la galerie de ses images (chacune s'ouvre en grand, avec le nom de l'expression tiré du nom de fichier) et **votre relation avec lui**, telle que la mémoire l'a retenue. Seul le résumé de la fiche (`résumé:`) est montré, jamais la fiche complète, qui est écrite pour l'IA et peut contenir des secrets.

En bas, **Personnes croisées** liste les relations mémorisées avec des gens qui n'ont pas de fiche, par exemple un aubergiste inventé par le modèle en cours de partie. Un scénario créé dans l'application, qui n'a pas de fiches, n'affiche que cette section.

Cette fenêtre ne coûte rien : elle n'interroge pas l'IA et ne change pas le prompt.

## Lecture

Section « Lecture » des Réglages (roue dentée de la liste, ou menu « … » de la conversation, puis Réglages). Ces réglages s'appliquent et s'enregistrent immédiatement, sans passer par « Enregistrer », et la ligne d'aperçu permet d'en juger, puisque la feuille floute la conversation derrière elle :

- **Taille du texte** de 14 à 30 px, **interlignage** de 1,4 à 2,1, **police du récit** (serif ou sans serif), **largeur de colonne** et **paragraphes**, avec aperçu. Les réglages sont conservés sur l'appareil.
- La largeur de colonne est une vraie mesure : elle vaut le nombre choisi multiplié par la taille du texte, donc agrandir le texte élargit la colonne et le nombre de caractères par ligne reste constant.
- **Paragraphes** : *Espacés* laisse un blanc entre les paragraphes, *Alinéa* les colle et décale la première ligne, comme dans un livre imprimé. Le récit est découpé en vrais paragraphes par l'application, l'espacement ne dépend donc plus des lignes vides écrites par le modèle. Les images portent une marge nulle : l'écart vient de leurs voisins, 3 px côté texte (qui s'ajoutent au demi-interligne de la ligne voisine) et 10 px entre deux images consécutives, pour qu'elles ne se touchent pas.
- **Défilement pendant la réponse** : par défaut, l'écran ne bouge pas pendant que l'IA écrit. À l'envoi, le fil descend une seule fois pour montrer votre message et l'indicateur de réflexion ; la réponse s'écrit ensuite en dessous, et le message définitif prend la place du texte provisoire sans décaler l'écran, images comprises. Le bouton flèche permet de descendre quand vous voulez. L'option « Suivre le texte pendant l'écriture de l'IA » rétablit le défilement automatique.
- **Mode lecture** (menu « … » de la conversation) : masque les boutons des messages, la saisie, les choix et les cartes d'état. Il reste l'en-tête et une barre flottante (lire ou mettre en pause, arrêter, A−, A+, quitter). Le mode lecture n'est pas conservé : il se désactive en quittant la conversation.
- **Lecture à voix haute** : un bouton haut-parleur sous chaque message lit ce message. En mode lecture, toucher un message lit la suite de l'histoire (réponses de l'IA seulement), et le bouton Lire de la barre démarre depuis le haut de l'écran. Le texte lu est nettoyé (sans astérisques, état ni choix) et `{{user}}` est remplacé par le nom du joueur.
- Réglages de la voix : choix de la voix (les voix françaises en premier), vitesse de 0,6 à 1,6, bouton pour écouter un exemple, et lecture automatique des nouvelles réponses.

Limites : la synthèse vocale est celle de l'appareil, donc les voix disponibles et leur qualité varient. Elle se met en pause en coupant puis en relisant le morceau en cours (phrase ou deux), ce qui fonctionne partout. Sur iPhone, le navigateur exige un premier toucher pour parler : la lecture automatique peut rester muette tant que vous n'avez pas lancé une lecture une fois.

## Prompt, cache et débit

Les Réglages sont groupés : clé API Claude, modèles, streaming et cache en haut, puis « Lecture », « Narration », « Compteurs et débit » et « GitHub et sauvegarde » dans des sections repliées.

À chaque envoi partent le prompt système, la mémoire et tous les messages que la mémoire n'a pas encore résumés (voir « Mémoire »).

### Placement dans le prompt et cache

Le cache de prompt de Claude réutilise le calcul d'un **préfixe exact**. Dès le premier caractère qui diffère, tout ce qui suit est recalculé, et payé plein tarif.

L'application range donc le prompt par volatilité croissante :

```
système  prompt du scénario, préambule, casting, fiches et lorebook « toujours »,
         codes d'images, protocole, avatar               ← fixe
         résumé, lignes récentes, souvenirs, relations, note   ← change par paliers
historique
queue    dernier message, lorebook déclenché, fiches en scène, passages anciens, état précédent, rappel
```

Le choix du niveau suit un arbitrage simple. Un bloc placé avant l'historique est gratuit les tours où il ne bouge pas, mais le tour où il change, il invalide aussi tout l'historique. Pour un bloc de C tokens qui change tous les K tours avec un historique de H tokens, le remonter vaut le coup si `(C + H) / K < C`.

La mémoire ne change que par paliers, surtout en début de séance (voir « API Claude ») : elle vient juste après la partie fixe, et les souvenirs partent tous (les plus récents, plafonnés par « Souvenirs injectés ») plutôt que triés par pertinence, pour qu'ils ne varient pas d'un tour à l'autre. Le lorebook et les fiches de personnages déclenchés par mots-clés changent bien plus souvent : ils restent en queue, où ils n'invalident rien. Seuls ceux qui ne changent jamais (`toujours`, ou tout un lorebook et des fiches modestes, voir « Fiches de personnages ») montent dans la partie fixe. L'état précédent et le rappel changent à chaque tour par nature.

Le compteur sous la conversation indique par exemple « ≈ 6 953 tokens envoyés (réel : 7 012) · 10 messages envoyés sur 16 », et une ligne « l'IA lit à partir d'ici » marque dans le fil le premier message envoyé tel quel : au-dessus, l'IA n'a plus que la mémoire.

Le compteur et la jauge de débit sont **masqués par défaut** : on lit une histoire, pas un tableau de bord. « Afficher les compteurs sous la conversation » (Réglages, section « Compteurs et débit ») les rend permanents. Masquée, la jauge réapparaît d'elle-même dans le cas où elle sert : un envoi qui doit attendre la minute suivante.

### API Claude

L'application appelle l'API native de Claude (`/v1/messages`). Renseignez « Clé API Claude » dans Réglages, avec une clé de la console Anthropic ; il n'y a pas d'offre gratuite. Modèle par défaut : `claude-sonnet-5-5` (`claude-haiku-5-5` coûte moins cher).

L'application pose trois marqueurs de cache :

1. après la partie fixe de la consigne (scénario, préambule, liste des personnages, fiches et lorebook `toujours`, codes d'images, protocole, avatar) : elle ne change jamais en cours de partie, et reste relue depuis le cache même quand la mémoire change ;
2. après la mémoire (résumé, lignes récentes, souvenirs, relations, note) ;
3. sur l'avant-dernier message, juste avant le dernier message qui porte le lorebook déclenché, les fiches en scène et l'état précédent.

Tout l'historique stable est ainsi relu depuis le cache à un dixième du prix, et seule la dernière paire message-réponse est écrite à chaque tour.

La mémoire garde toujours au moins 40 messages mot pour mot, et choisit son moment pour avancer, parce qu'une mise à jour réécrit tout le cache de la mémoire et de l'historique :

- **En début de séance**, quand le cache a expiré (rien envoyé pour cette histoire depuis 5 minutes, ou une heure avec « Garder le cache une heure »), le premier envoi réécrira tout le prompt de toute façon. La mémoire avance alors dès 50 messages en attente, jusqu'à n'en garder que 40, et la réécriture porte directement le prompt raccourci. Le résumé part dès l'ouverture de l'histoire, pendant que vous relisez ; si vous envoyez avant qu'il soit fini, l'envoi l'attend au plus 30 secondes (« Mise à jour de la mémoire avant l'envoi… », Arrêter coupe l'attente), puis part quand même. Le résumé, fait par le modèle de mémoire (Haiku 5.5 par défaut), coûte environ dix fois moins que ce qu'il évite de réécrire et de relire.
- **En cours de séance**, la mémoire n'avance qu'au-delà de 120 messages en attente : une longue séance peut donc se jouer sans aucune réécriture due à la mémoire.

Les résumés partent par appels de 20 messages. Sur une séance mesurée de 13 tours, la mise à jour en cours de jeu et la fenêtre de 70 messages au départ pesaient ensemble environ 20 % du coût. En contrepartie, l'IA voit 40 messages mot pour mot en début de séance (une vingtaine de tours), puis jusqu'à 120. Le cache dure 5 minutes, prolongées à chaque tour ; « Garder le cache une heure » (Réglages) l'allonge, avec une écriture plus chère. Il est réécrit quand la mémoire se met à jour, quand un ancien message est modifié ou après une pause plus longue que sa durée. Le compteur sous la conversation affiche les tokens « lus en cache » et « mis en cache » pour vérifier l'économie réelle.

**Maintien du cache pendant les pauses.** Lire une réponse puis écrire son tour dépasse souvent 5 minutes : le cache expirait, et le tour suivant réécrivait tout le prompt à 1,25 fois le prix d'entrée. Quand « Garder le cache au chaud pendant les pauses » est coché (Réglages, par défaut), l'application renvoie la dernière requête de narration avec `max_tokens: 0` environ 4 minutes 30 après son début : l'API relit le préfixe au tarif réduit (un dixième de l'entrée, un vingtième sur Opus 5.5), repousse l'échéance de 5 minutes et ne génère rien. Seul le dernier message, hors cache, est payé plein tarif. La relance part sans streaming (refusé avec `max_tokens: 0`) mais avec le même effort, qui fait partie du préfixe. Elle n'a lieu que tant que la conversation est ouverte et la page visible, au plus trois fois d'affilée (une vingtaine de minutes) sans nouvel envoi ; au-delà, mieux vaut laisser expirer. Elle est sans objet avec le cache d'une heure, qui reste préférable pour des pauses régulières de plus de 20 minutes. Les relances sont comptées dans les statistiques.

**Effort.** Sonnet 5.5 et les modèles récents réfléchissent avant de répondre, et cette réflexion, invisible, est facturée comme de la sortie. Réglages du scénario, section Génération : « Effort », **Faible par défaut**, Moyen ou Élevé, envoyé dans `output_config.effort`. Faible suffit le plus souvent pour un récit ; montez-le si l'histoire perd en cohérence. L'effort n'est envoyé qu'aux modèles qui le prennent en charge (Opus et Sonnet 4.6 et suivants, Opus 4.5, Haiku 5.5, Fable, Mythos) ; Haiku 4.5 et Sonnet 4.5 le refusent, l'application s'en abstient et la note le signale. Les résumés de mémoire partent toujours en effort faible.

**Changer l'effort en cours de partie** ne réécrit pas le cache avec Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 et Haiku 5.5. L'effort envoyé en tête de la requête reste celui du premier message envoyé ; le changement devient un court message d'effort glissé dans l'historique, juste avant le tour du joueur où il commence (fonction bêta `mid-conversation-output-config-2026-07-01`). L'histoire garde la liste de ses changements (`effLog`) pour les replacer au même endroit à chaque tour. Ils rejoignent l'effort de tête quand la mémoire se met à jour, qui réécrit le cache de toute façon. Changer l'effort puis régénérer la dernière réponse l'applique à cette réponse. Avec les autres modèles, l'effort change en tête de requête, ce qui réécrit le cache une fois.

**Refus.** Claude peut refuser d'écrire une réponse, y compris au milieu du texte, notamment sur des scènes très sombres. L'application l'affiche clairement (« Claude a refusé d'écrire cette réponse », avec le motif quand l'API le donne), ne garde pas le texte déjà reçu, qui n'est pas une réponse complète, et propose « Indication… » pour orienter la scène plutôt que de renvoyer la même requête, qui serait refusée de même. Pour la narration avec Fable 5.1, Opus 5.5, Opus 5 et Sonnet 5.5, l'application demande aussi le **relais** d'Anthropic (`fallbacks: "default"`, bêta `server-side-fallback-2026-07-01`) : une requête refusée est reprise côté serveur par un autre modèle choisi selon le motif. Avec Sonnet 5.5, seuls les refus « cybersécurité » et « développement d'IA » sont relayés ; les refus « contenu sensible », les plus probables en fiction, reviennent comme refus. Haiku 5.5 n'a pas de relais. Une requête qui porte un changement d'effort part sans relais, car le modèle de secours pourrait ne pas le prendre en charge.

**Mémoire sur Haiku 5.5.** Quand « Modèle pour la mémoire » est vide, les résumés partent vers `claude-haiku-5-5` (0,10 $ / 0,50 $ par million de tokens, une vingtaine de fois moins que Sonnet 5.5) plutôt que vers le modèle de narration. Renseigner le champ reprend la main.

**Version de l'API et échantillonnage.** L'application appelle Claude avec la version d'API `2026-10-21` (en-tête `anthropic-version`, constante `ANT_VERSION` dans `ai.js`). Dans cette version, `temperature`, `top_p` et `top_k` sont refusés (erreur 400) sur tous les modèles, même à leur valeur par défaut : l'application ne les envoie donc jamais. Conséquence avec Sonnet 4.6, Opus 4.6 et Haiku 4.5, les seuls modèles Claude qui acceptaient encore une température : ils écrivent désormais avec l'échantillonnage par défaut, et il n'existe pas de réglage de remplacement. Les autres changements de cette version (documents dans un message de l'IA, citations dans un message du joueur, champs de l'API d'administration) ne concernent pas l'application. Guide de migration : https://platform.claude.com/docs/en/api/migration-2026-10-21

Les appels partent directement du navigateur avec l'en-tête `anthropic-dangerous-direct-browser-access` : la clé reste sur l'appareil. Les en-têtes de débit `anthropic-ratelimit-*` alimentent la jauge, et une surcharge (529) est relancée comme les autres erreurs passagères (voir « Jauge de débit »), sans toucher à la jauge. Le résumé de mémoire demande du JSON par sa seule consigne, sans paramètre de l'API : la lecture tolérante du JSON, puis le format balisé, prennent le relais (voir « Mémoire »).

### Jauge de débit

Sous le compteur, une barre indique les tokens restants dans la minute en cours : « 2 400 / 8 000 tokens par minute · prochain tour dans ~7 s ». Elle passe en rouge quand le tour suivant ne tient pas dans ce qui reste.

Deux sources, dans cet ordre. Quand une réponse porte les en-têtes `anthropic-ratelimit-*`, la jauge part de leur chiffre exact et mémorise la limite. Entre deux réponses, elle ne recrédite que les tokens de vos propres requêtes qui viennent réellement de sortir de la fenêtre de soixante secondes, jamais un réapprovisionnement théorique. Sinon elle retombe sur une fenêtre glissante de soixante secondes calculée à partir des `usage` de vos propres requêtes, et le signale par « estimation locale ». Dans ce cas, renseignez « Tokens par minute » dans Réglages (section « Compteurs et débit ») pour lui donner un plafond ; la valeur se corrige toute seule dès qu'une réponse donne la limite.

Quand le tour suivant ne tient pas dans ce qui reste, l'application **attend d'elle-même** au lieu de partir dans une erreur de limite. Le décompte s'affiche sous la conversation (« envoi dans 55 s… »), rien n'est envoyé pendant ce temps, et le bouton d'arrêt annule l'attente et vous rend la main. Votre message reste dans la conversation, prêt à être renvoyé. L'attente s'applique aussi à la requête de mémoire, dont les tokens sont décomptés comme les autres.

Le compteur affiche aussi les tokens lus et mis en cache. C'est le moyen de vérifier que le préfixe stable du prompt est bien réutilisé.

Le suivi est tenu **par modèle**, parce que les limites le sont aussi : confier les résumés à un autre modèle lui donne son propre compteur, et la jauge de la narration n'en voit rien.

En cas de refus pour dépassement (429), l'application relance jusqu'à trois fois. Le délai est lu dans l'en-tête `retry-after`, à défaut 15, 30 puis 45 secondes, avec un minimum de 3 secondes et un plafond de 90. Le décompte est affiché pendant l'attente, y compris pour la requête de mémoire.

Les **erreurs passagères** sont relancées de la même façon, jusqu'à trois fois : surcharge ou panne de l'API (500, 502, 503, 504, 529) et coupure réseau avant toute réponse. L'attente double à chaque essai (2, 4 puis 8 secondes), sauf si l'API indique elle-même un délai (`retry-after`, plafonné à 60 secondes). Le message dit la cause (« Claude est surchargé ou en panne », « connexion perdue ») et le bouton d'arrêt annule l'attente. Ces erreurs ne touchent pas la jauge de débit, puisqu'elles ne disent rien de votre quota. Une erreur de requête (400, clé refusée…) n'est jamais relancée, et une coupure au milieu d'une réponse diffusée garde le texte reçu, que « Continuer » peut prolonger, plutôt que de tout redemander. Le délai maximal sans réponse repart de zéro après chaque attente.

Deux messages distincts selon l'origine de l'attente : « Pause pour respecter la limite de débit de Claude » quand l'application temporise d'elle-même, avant l'envoi, parce que le tour ne tiendrait pas dans ce qui reste de la minute ; « Claude a refusé l'envoi » quand l'API a réellement répondu 429. Après un refus, la jauge est remise à zéro le temps de l'attente, puis rétablie dès qu'une réponse passe.

Le décompte part de 3,4 caractères par token, puis **se calibre tout seul** : chaque réponse de Claude indique le nombre réel de tokens de l'entrée, et l'application ajuste son rapport caractères/token. La valeur courante s'affiche dans Réglages. Au bout de quelques messages, l'estimation colle au modèle que vous utilisez.

## Mémoire

La mémoire tient sur trois étages, du plus détaillé au plus condensé :

- **La fenêtre** : les derniers messages, envoyés mot pour mot.
- **Les lignes récentes** : une phrase par message sorti de la fenêtre, pour garder le détail immédiat sans payer le texte intégral. Les plus anciennes disparaissent au fur et à mesure, une fois absorbées par le résumé.
- **Le résumé** : le récit condensé de tout ce qui précède, plafonné pour ne pas gonfler avec le temps. Il est écrit en deux parties, « Événements » et « Situation actuelle » ; les souvenirs, les relations et l'objectif ont leurs propres champs et ne doivent pas y figurer. Quand il dépasse son plafond, il est coupé à la fin de la dernière phrase complète plutôt qu'au milieu d'un mot.

Chaque ligne récente renvoie au message qu'elle résume, ce qui permet au Sommaire d'y sauter. Si le modèle renvoie plus ou moins de lignes qu'il n'a reçu de messages, les lignes sont gardées sans ce lien, plutôt que de pointer vers de mauvais messages.

À côté, deux listes : les **souvenirs** (faits durables) et les **relations** (une ligne par personnage). Toutes les relations sont envoyées avec la mémoire, dans la partie qui reste en cache ; celle d'un personnage en scène est de plus répétée sous sa fiche quand celle-ci part en fin de requête. Les relations se consultent dans la fenêtre Personnages, pas dans la feuille Mémoire.

Les modèles reformulent : « Alice », « alice », « Alice, l'herboriste » désignent la même personne, et « la fiole est verte » revient sous la forme « La fiole verte est importante ». L'application rapproche donc les noms dont les mots se recouvrent, et les souvenirs dont le vocabulaire se recouvre à plus de 60 %. Dans les deux cas la formulation la plus récente remplace l'ancienne au lieu de s'y ajouter.

Les deux listes sont plafonnées : 12 relations, 60 souvenirs. Au-delà, les entrées les moins récemment mises à jour disparaissent, sauf les personnages qui ont une fiche dans `personnages/`, qui ne sont jamais évincés. Les figurants de passage finissent donc par sortir d'eux-mêmes. Le résumeur reçoit en plus la liste de ce qu'il connaît déjà, avec la consigne de reprendre les noms tels quels et de ne pas répéter les souvenirs acquis.

Certains modèles recopient pourtant ces sections dans le résumé, surtout quand ils décorent leurs intitulés (`**Souvenirs**`, `## Relations`). Comme le résumé est renvoyé au modèle à chaque mise à jour, l'erreur s'entretenait d'elle-même, et les mêmes souvenirs et relations partaient deux fois dans le prompt. L'application coupe désormais le résumé au premier intitulé Souvenirs, Relations, Lignes ou Objectif, y compris sous une forme qualifiée (« Lignes récentes », « Objectif actuel », « Souvenirs durables »…), et verse les souvenirs et relations trouvés dans leurs listes (les doublons sont fusionnés comme d'habitude) ; Lignes et Objectif sont simplement écartés. Cela s'applique à la réponse du modèle comme au résumé existant, qui est nettoyé à la prochaine mise à jour de la mémoire. Une phrase qui commence par « Relations tendues… » sans être un intitulé est laissée intacte.

Une relation enregistrée peut dater : la mémoire ne résume les messages qu'avec un retard de 40 à 120 messages (par lots de 20, voir « API Claude »), et l'IA lit pourtant la relation d'un personnage en scène en fin de prompt, juste avant d'écrire. Pour qu'elle ne l'emporte pas sur une évolution récente, cette ligne est envoyée sous la forme « Relation (état enregistré, peut dater ; les événements récents priment) : … », et le bloc `<relations>` de la mémoire porte la même mise en garde en tête. La liste complète ne change qu'à chaque mise à jour de la mémoire, comme le résumé : elle est donc relue depuis le cache sans le réécrire d'un tour à l'autre, quel que soit le personnage en scène.

Le résumé et les souvenirs restent modifiables à la main dans la feuille Mémoire. Les relations, elles, n'y figurent plus : elles sont mises à jour par le modèle et affichées en lecture seule dans la fenêtre Personnages. Enregistrer la feuille Mémoire ne les touche pas.

L'objectif courant ne vit pas dans la mémoire mais dans le panneau d'état, qui est mis à jour à chaque tour. Ajoutez simplement un champ `Objectif` à la liste.

Tout est régénéré par une requête de résumé lancée pendant que vous lisez la réponse précédente. Dans Réglages, « Modèle pour la mémoire » permet de confier ce travail à un modèle plus petit que celui de la narration.

Cette requête demande une réponse **en JSON**, par sa consigne seule, sans paramètre de l'API. La narration, elle, reste en texte balisé : le JSON empêcherait l'affichage au fil de l'eau et abîmerait l'écriture, alors que la mémoire n'est jamais affichée telle quelle et gagne beaucoup en fiabilité. Trois filets successifs : si la réponse n'est pas du JSON exploitable, l'application y cherche le format balisé ; après deux réponses JSON illisibles d'affilée, la mémoire passe au format balisé pour les requêtes suivantes, et la note des Réglages le signale ; si rien ne passe, la mémoire reste inchangée et l'essai reprend au tour suivant.

Avec un modèle **à raisonnement**, trois précautions. Le JSON est cherché à plusieurs endroits du texte, et non plus seulement à partir de la première accolade : un modèle qui cite le schéma dans sa réflexion (`{"resume": …}`) ne fait plus échouer la lecture. Une balise `</think>` isolée, sans balise ouvrante, est traitée comme la fin de la réflexion et tout ce qui la précède est écarté, ce qui vaut aussi pour la narration. Enfin, cette requête n'est pas diffusée, donc son délai maximal est de 5 minutes au lieu de 2. Si le modèle épuise sa limite de jetons en réfléchissant et ne répond rien, le message indique de choisir un modèle sans raisonnement dans « Modèle pour la mémoire ».

### Passages anciens

Le résumé perd forcément des détails : la couleur d'un objet, la phrase exacte d'un personnage, le nom d'une auberge. Quand la scène actuelle en reparle, l'application retrouve le vieux passage et en joint un extrait (600 caractères au plus) à votre message, dans un bloc `<passages_anciens>` qui prévient l'IA qu'il peut dater.

La recherche se fait sur l'appareil, sans requête supplémentaire : les mots de vos deux derniers messages (et de l'état) sont comparés à ceux des messages qui ne sont plus envoyés tels quels, parce que la mémoire les a déjà résumés. Un passage n'est retenu que s'il partage au moins deux mots avec la scène, dont un distinctif, c'est-à-dire présent dans un passage sur trois au plus : les mots courants (« pluie », « regard ») et les mots outils ne suffisent jamais. Les plus pertinents passent en premier, puis sont remis dans l'ordre du récit ; l'extrait est le paragraphe qui contient le plus de mots communs.

Le bloc part en queue, avec le lorebook déclenché : il n'invalide rien du cache, et ses tokens entrent dans le compteur comme le reste du dernier message. Réglages du scénario, section « Mémoire et lorebook » : « Passages anciens rappelés » (2 par défaut, 0 pour désactiver).

## Panneau d'état

L'IA peut suivre l'état du jeu (lieu, santé, argent, humeur…). À chaque réponse elle ajoute un bloc `<etat>` (masqué dans le texte) que l'application affiche dans un panneau sous le titre : deux pastilles repliées, tous les champs une fois ouvert, avec une barre pour les valeurs de la forme `72/100`. L'état précédent est renvoyé à l'IA à chaque tour pour assurer la cohérence.

Activation : menu « … » de la conversation, Réglages du scénario, section Narration, « Panneau d'état », puis la liste des champs (séparés par des virgules ou des lignes). Pour un scénario GitHub, un fichier `etat.md` (par exemple `Lieu, Santé (0/100), Argent, Humeur`) active le panneau par défaut.

## Repères dans la conversation

- **Limite de contexte** : une ligne « l'IA lit à partir d'ici » traverse le fil au premier message envoyé tel quel. Au-dessus, l'IA ne dispose que de la mémoire. C'est la version visible du compteur de tokens.
- **Sommaire** (menu « … ») : les scènes du récit dans l'ordre, une par lieu (le même découpage que les intertitres), sur toute l'histoire. Les scènes sont repliées : chacune affiche son lieu et son nombre de tours, et la scène en cours est soulignée. Toucher une scène l'ouvre (ou la referme) : elle montre alors sa première phrase, les lignes récentes de la mémoire qui la résument (24 au plus pour toute l'histoire, donc surtout pour les scènes récentes) et un bouton « Aller à cette scène ». Ce bouton ou une ligne mène au message, qui clignote à l'arrivée. Un lieu revisité apparaît deux fois, à sa place dans le récit. Sans champ « Lieu » dans l'état, le Sommaire reste la liste des lignes récentes.
- **Recherche dans l'histoire** (menu « … ») : cherche dans tous les messages, affiche un extrait autour de chaque occurrence et saute au message choisi, même s'il est au-delà des messages affichés.
- **Panneau d'état** : chaque valeur numérique affiche sa variation depuis le tour précédent (▲ +1, ▼ −4).
- **Images** : touchez une image pour l'ouvrir en plein écran.

## Gestes

- Toucher une suggestion l'envoie directement. Le crayon à sa droite la place dans la zone de saisie pour la modifier avant d'envoyer.
- Toucher un ancien message affiche ses actions ; le toucher à nouveau les masque.
- Balayer horizontalement la dernière réponse passe d'une variante à l'autre, comme les chevrons.
- Appui long (ou clic droit) sur « Régénérer » : régénérer avec une indication.

## Fonctions

- Réponses en streaming (avec diagnostic dans les réglages), trois suggestions de réponse (envoi direct ou crayon pour modifier), bouton annuler.
- Variantes de réponse (flèches ‹ ›) en régénérant, bouton « continuer » (double chevron) pour prolonger une réponse coupée.
- Modifier, copier ou supprimer à partir d'un message (feuille « … » sous le message). La suppression est immédiate, avec un bouton « Annuler » pendant 7 secondes tant que la conversation n'a pas changé. Les lignes récentes des messages supprimés sont retirées de la mémoire ; si la suppression touche des messages déjà résumés, la notification prévient que le résumé en garde la trace. Supprimer à partir du premier message recommence l'histoire ; pour un scénario GitHub, cette remise à zéro est synchronisée comme une modification (sans elle, une histoire GitHub vide n'est jamais synchronisée, et la version en ligne reviendrait).
- Modifier un message déjà résumé : sa ligne récente est retirée de la mémoire, et une notification prévient que le résumé garde la trace de l'ancienne version.
- Bifurquer à partir d'un message (même feuille) : une nouvelle histoire reprend jusque-là, l'originale reste intacte.
- Modifier et renvoyer un tour du joueur (même feuille) : la suite est remplacée par une nouvelle réponse, sans annulation possible ; la fenêtre l'annonce et conseille de bifurquer d'abord pour garder l'ancienne suite. Si le tour était déjà résumé, il repart tel quel et le résumé garde la trace de l'ancienne version.
- Régénérer avec une indication (« plus court », « fais parler Elias »…) : appui long ou clic droit sur « Régénérer », ou feuille « … » du dernier message. L'indication est ajoutée à la fin du dernier tour, dans la partie non mise en cache, pour cette réponse seulement : elle n'est pas enregistrée, et « Réessayer » la reprend.
- Après un échec d'envoi, le bouton « Réessayer » de la bande d'erreur relance la même demande (envoi, régénération ou continuation) sans doubler le tour.
- Une pastille « Réponse en cours ↓ » puis « Nouveau message ↓ » signale une réponse qui arrive sous l'écran pendant qu'on relit plus haut ; elle disparaît quand le début de la réponse devient visible.
- Rappel automatique de passages anciens quand la scène reparle d'un détail sorti de l'historique envoyé.
- Coût estimé par modèle et par période dans les statistiques, en dollars ou en euros.
- Le bouton stop (et la sortie de la conversation) conserve le texte déjà reçu, que « Continuer » peut prolonger.
- Mémoire à trois étages : résumé et souvenirs éditables (ajout et retrait à l'unité), lignes récentes consultables dans le Sommaire, note utilisateur (menu « … » de la conversation), et relations par personnage, consultables dans la fenêtre Personnages. Nombre de souvenirs injectés réglable (0 : aucun).
- Modèle distinct pour les résumés de mémoire (Haiku 5.5 par défaut).
- Modèle et effort par scénario (section Génération des réglages du scénario). Sans modèle, le scénario reprend celui des Réglages. Le modèle du scénario sert à garder un grand modèle pour les histoires qui le méritent et un petit, bien moins cher, pour les autres ; il compte pour les consignes de format automatiques, la jauge de débit et les statistiques.
- Coût des extras affiché sous les cases Choix et Panneau d'état (section Narration) : taille moyenne d'un bloc, part de la sortie et coût pour 100 réponses, mesurés sur les dernières réponses de l'histoire. Ces blocs sont réécrits par l'IA à chaque réponse et payés comme sortie : décochez ceux qui ne servent pas.
- Protocole de sortie centralisé, adapté au modèle, et préambule commun à tous les scénarios.
- Liste des modèles Claude disponibles (Réglages, Lister les modèles).
- Compteurs : estimation des tokens envoyés et jauge de débit sous la conversation (voir « Prompt, cache et débit »).
- Recherche dans la liste, export d'une histoire en `.md`, sauvegarde JSON (clés API exclues) avec rappel tous les 30 jours, synchronisation en ligne sur un dépôt GitHub privé.
- Bouton retour du téléphone géré, y compris pour fermer une feuille ouverte depuis la liste, fonctionnement hors ligne.

## Stockage sur l'appareil

Les messages sont rangés par paquets de 25 dans la base locale, et un enregistrement ne réécrit que les paquets qui ont changé : jouer un tour dans une longue histoire ne réécrit plus toute l'histoire. La couverture est stockée une seule fois, à part, et n'est réécrite que si elle change ; la liste ne charge que des informations légères. Les variantes d'une réponse (flèches ‹ ›) ne sont gardées que tant que cette réponse est la dernière : elles disparaissent dès que vous envoyez le message suivant. Les très anciennes bases (versions 1 à 3, une histoire d'un seul bloc) ne sont plus converties : tous les appareils sont passés au format actuel. Si un appareil resté très longtemps sans mise à jour affiche une liste vide, ses histoires sont encore dans l'ancien format : récupérez-les depuis la sauvegarde en ligne ou un export.

Si l'appareil manque de place, un enregistrement refusé par le navigateur est signalé comme une erreur (« Enregistrement impossible ») au lieu de bloquer l'envoi sur « Réponse en cours ».

Les images d'un scénario GitHub ne sont visibles que dans ce scénario : si vous changez d'histoire pendant un chargement, celui qui arrive en retard est ignoré.

## Sauvegarde en ligne

Les histoires restent d'abord sur l'appareil. La sauvegarde en ligne les copie dans un dossier (un fichier par histoire, un fichier par couverture et un index) et les synchronise entre vos appareils. Réglages, Sauvegarde en ligne (ou icône nuage de la liste).

Fonctionnement : à chaque synchronisation, l'application lit l'index distant, garde pour chaque scénario la version la plus récente, applique les suppressions, puis ne renvoie que les histoires modifiées. La couverture est dans un fichier à part, renvoyé seulement quand elle change ; l'index retient son empreinte. Tous vos appareils doivent utiliser cette version de l'application : une version antérieure lirait les histoires sans leur couverture. Rien n'est écrasé à l'aveugle. Si la même histoire a été jouée des deux côtés depuis la dernière synchronisation, la version la plus ancienne n'est pas perdue : elle est conservée à part sous le même nom suivi de « (conflit) », à vous de choisir laquelle garder. Quand l'appareil n'a pas encore d'historique de synchronisation pour une histoire (première synchronisation, autre dépôt, histoire importée) et que les deux versions diffèrent, on ne peut pas savoir laquelle prolonge l'autre : la plus ancienne est aussi gardée en copie « (conflit) ». Un fichier distant illisible n'est jamais remplacé. Les clés API ne sont pas sauvegardées. La synchronisation se lance à l'ouverture, en quittant une conversation, en quittant l'application et au toucher du nuage. Elle attend la fin d'une réponse en cours. Si elle rapporte une version plus récente de l'histoire ouverte, l'écran est rechargé avec cette version dès qu'elle est écrite, pour que le tour suivant ne l'écrase pas ; si l'histoire a été supprimée ailleurs, la conversation se ferme. Elle repose sur l'horloge des appareils : gardez-les à l'heure.

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
3. Dans l'application : service GitHub, dépôt `proprietaire/sauvegardes`, jeton, Enregistrer.

Le jeton est stocké en clair dans le navigateur de l'appareil, comme les clés API. Un jeton limité à un dépôt de sauvegarde ne donne accès à rien d'autre. Chaque synchronisation avec changement crée un commit dans ce dépôt. Pour que le dépôt ne grossisse pas sans fin, l'application compacte l'historique en un seul commit tous les 100 commits environ (les fichiers ne changent pas, seules les anciennes versions disparaissent, GitHub les nettoie ensuite à son rythme). Par sécurité, elle ne le fait que si le dépôt ne contient que la sauvegarde (plus un README, une licence ou des fichiers `.git*`) : si vous l'avez pointée vers un dépôt qui contient autre chose, l'historique n'est jamais touché. Une branche protégée contre la réécriture empêche aussi le compactage, sans gêner la synchronisation.

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
  rate.js           suivi du débit : en-têtes de Claude ou fenêtre locale
  prompt.js         assemblage du prompt : casting, mémoire, lorebook, estimation des tokens
  recall.js         rappel de passages anciens par mots distinctifs (sans DOM, testé unitairement)
  protocol.js       formats de sortie imposés par l'application (état, choix, images)
  ai.js             appel à l'API Claude (streaming) et résumé de mémoire
  format.js         mise en forme du texte (Markdown léger, images, choix, état)
  scene.js          scènes : choix du décor, détection de la transparence, placement du personnage
  read.js           lecture : taille du texte, mode lecture, lecture à voix haute
  cast.js           fenêtre Personnages
  view.js           conversation, affichage : messages, état, scènes, compteurs, en-tête, navigation
  send.js           conversation, envoi : appel au modèle, affichage progressif, maintien du cache, saisie
  chat.js           conversation, actions : ouverture, variantes, modification, suppression, bifurcation
  list.js           liste des scénarios : recherche, onglets, menu, création
  nav.js            navigation (bouton retour du téléphone)
  settings.js       réglages du scénario, mémoire, note, réglages IA, import
  backup.js         export, synchronisation GitHub
  merge.js          fusion des sauvegardes (sans DOM, testé unitairement)
  memory.js         mémoire longue : fusion des souvenirs et des relations
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
- **Pas d'import en boucle**, ni direct ni par un détour : `npm run build` refuse `backup.js → send.js → backup.js`. Les imports vont de l'interface vers les couches basses (`send.js` importe `backup.js`, jamais l'inverse ; dans la conversation, `chat.js` importe `send.js`, qui importe `view.js`). Quand une couche basse doit faire réagir l'interface, elle l'annonce par `emit()` de `bus.js` et l'interface s'abonne avec `on()`. Annonces actuelles : `open` (ouvrir une histoire, géré par `nav.js`), `settings:open` (feuille du scénario, `settings.js`), `list:stale` (redessiner la liste si elle est visible, `list.js`), `cur:remote` (histoire ouverte modifiée ou supprimée par la synchronisation, `chat.js`). `emit()` rend une promesse résolue quand toutes les réactions sont terminées.
- Pour tester en local, servez le dossier avec un serveur HTTP (`python3 -m http.server`), car les modules ne se chargent pas depuis `file://`.
- Quand vous ajoutez un fichier JavaScript dans `js/`, il est repris automatiquement par `npm run build` (service worker et `modulepreload`). Rien à déclarer à la main.
- Les numéros de version sont calculés à partir du contenu des fichiers par `npm run build`, lancé par le workflow à chaque déploiement. Ne les modifiez pas à la main.
- La logique sans DOM (fusion, validation, construction du prompt) doit rester testable : ajoutez un test dans `test/` quand vous la touchez.
- Les messages construits par `prompt.js` peuvent porter des repères internes (`cut` sur le message système : la fin de la partie fixe, que `toAnt` utilise pour placer les marqueurs de cache ; `effBefore` sur un message : un changement d'effort à glisser juste avant lui). Ils ne doivent jamais partir tels quels : `toAnt` construit ses propres blocs pour Claude. Le faux serveur Claude du test de bout en bout refuse toute la requête si un message porte un autre champ que `role`, `content` et `output_config`.

### Historique : autres fournisseurs

Avant de ne plus parler qu'à Claude, l'application parlait aussi aux fournisseurs compatibles OpenAI (Groq, Gemini, Mistral, OpenRouter), avec une limite de tokens, une température et un Top P réglables. Ce code est conservé dans le tag git `multi-ia`, posé sur le dernier commit qui le contient : `git checkout multi-ia` pour le consulter. Pour le remettre, il faudrait l'adapter au code actuel, qui a continué d'évoluer sans lui.

## Déploiement et dépannage

**Déployez toujours tous les fichiers ensemble**, y compris les nouveaux : `index.html`, `sw.js`, `manifest.json`, les icônes, `reparer.html`, `package.json`, les dossiers `css/`, `js/`, `tools/` et `test/`. L'application est découpée en modules : il suffit qu'un seul fichier manque ou ne soit pas à jour pour que rien ne démarre (page vide, boutons sans effet).

Protections intégrées :

- `npm run build` refuse de produire une version incohérente (identifiant dupliqué, sélecteur pointant dans le vide, import en boucle), et les tests unitaires puis de bout en bout tournent avant chaque déploiement : s'ils échouent, rien n'est publié.
- Si un fichier est introuvable, une alerte « L'application ne démarre pas correctement » nomme le fichier fautif et propose **Réparer**.
- Si la page et les scripts sont de versions différentes, une alerte « Mise à jour incomplète » le signale et l'application reste utilisable autant que possible.
- Le service worker refuse d'installer une nouvelle version dont un fichier manque, ou dont la page et les scripts reçus ne portent pas le même numéro de version (copies encore en cache chez l'hébergeur juste après un déploiement) : l'ancienne version continue de fonctionner et l'installation est retentée plus tard. Il télécharge les fichiers avec le numéro de version dans l'adresse, puis sert toujours ceux de son installation, sans les rafraîchir un par un : une version installée reste cohérente, même hors ligne.
- **Réparer** ne vide les caches que si le serveur répond vraiment. Hors ligne (ou derrière la page de connexion d'un Wi-Fi public), il se contente de recharger, pour ne pas rendre l'application inutilisable jusqu'au retour du réseau.
- Une nouvelle version ne prend jamais la main sous vos pieds. Elle s'installe en arrière-plan, puis une notification « Nouvelle version prête — Recharger » attend votre accord ; la page se recharge alors d'un bloc. C'est ce qui évite l'essentiel des « mises à jour incomplètes », où une page déjà ouverte se retrouvait à mélanger l'ancien HTML et les nouveaux scripts.

Si l'application ne répond plus malgré tout :

1. Vérifiez sur GitHub que tous les fichiers sont présents (ouvrez `js/read.js`, `js/boot.js`… dans votre dépôt) et que le déploiement est terminé.
2. Ouvrez `https://votre-adresse/reparer.html` et touchez **Réparer** : cela supprime les copies d'application en cache sur l'appareil puis rouvre l'application. **Vos histoires et vos réglages ne sont pas effacés.**
3. N'utilisez pas « Effacer les données du site » dans le navigateur : cela supprime aussi vos histoires stockées sur l'appareil (sauvegardez-les d'abord avec la synchronisation ou l'export).

## Politique de sécurité (CSP)

`index.html` contient une politique de sécurité qui limite les scripts à ceux de l'application et les connexions réseau aux deux services utilisés : `api.anthropic.com` (Claude) et `api.github.com`. Conséquence : pour ajouter un autre service, ajoutez son adresse à `connect-src` dans cette balise, sinon le navigateur bloquera les requêtes. Une erreur « Refused to connect » dans la console du navigateur indique ce cas.

## Streaming

Le texte s'affiche au fur et à mesure que Claude le diffuse. Réglages indique comment la dernière réponse est arrivée : diffusée en N morceaux, reçue d'un seul bloc ou streaming désactivé (case « Désactiver le streaming »). Les modèles « à raisonnement » réfléchissent avant de répondre : l'application affiche alors « Réflexion… » et le texte n'apparaît qu'ensuite.

## Sécurité

La clé API est stockée en clair dans le navigateur de l'appareil et envoyée uniquement à l'API de Claude. Ne l'utilisez pas sur un appareil partagé. Elle n'est jamais incluse dans les sauvegardes.
