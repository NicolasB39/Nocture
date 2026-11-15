# Décors

Un personnage détouré s'affiche en scène : un décor en fond, le personnage posé dessus. **C'est l'application qui choisit le décor, pas l'IA.** L'IA ne reçoit ni la liste des décors ni leurs codes, écrit librement, et cela ne coûte aucun token.

## Le dossier

```
scenarios/<Nom>/
  decors/
    phare.webp
    phare.md          ← facultatif : les mots-clés
    port.webp
    port.md
    port_nuit.webp    ← variante, avec ses propres mots-clés
    port_nuit.md
    defaut.webp       ← facultatif : le fond quand rien ne correspond
```

- Images acceptées : `.webp`, `.png`, `.jpg`, `.jpeg`, `.gif`, directement dans `decors/` (les sous-dossiers ne sont pas lus).
- Format **16/9** (1600 × 900, ou 1280 × 720), sans personnage. Voir `images.md` pour le prompt de génération.
- `defaut.webp` (ou `.png`…) n'est jamais choisi par mot-clé : c'est le repli. Sans lui, l'application génère un fond aux couleurs du scénario. Il n'y a donc jamais de vide.

**Ne mettez plus de décors dans `personnages/`.** L'ancienne méthode, un faux personnage `personnages/Decors/` dont l'IA insérait les images, fait doublon : l'IA afficherait un décor seul, et l'application le poserait par-dessus un autre décor. Déplacez ces images dans `decors/` et supprimez le dossier.

## Le fichier de mots-clés

`phare.md`, à côté de `phare.webp` :

```
Mots-clés : phare, salle de veille, galerie, lanterne
```

- Une seule ligne compte, celle qui commence par `Mots-clés :` (`mots cles`, `motsclés` sont acceptés). Le reste du fichier est ignoré : vous pouvez y noter le prompt qui a servi à générer l'image.
- Sans fichier `.md`, le nom de l'image sert de mot-clé : `port.webp` répond à « port ». Les tirets et tirets bas valent des espaces : `salle_commune.webp` répond à « salle commune ».
- Mêmes règles que le lorebook : accents et majuscules ignorés, mot entier (« port » ne répond pas à « portail »), `chapelle*` pour accepter les suffixes.

## Comment l'application choisit

1. Elle lit le champ **Lieu** du panneau d'état (ou un champ nommé « Endroit », « Localisation », « Position »).
2. Sans ce champ, ou tant qu'il n'a pas de valeur, elle cherche les mots-clés dans le texte du message et du précédent.
3. Si plusieurs décors correspondent, **le mot-clé le plus long l'emporte** : « port de nuit » passe avant « port ».
4. Si aucun ne correspond : `defaut`, puis le fond généré.

Chaque message garde le décor de son moment : relire une ancienne scène montre l'ancien décor.

## Bien faire correspondre lieux et décors

Les mots-clés sont comparés à **ce que l'IA écrit** dans le champ Lieu. Le plus sûr est donc de :

- mettre `Lieu` dans `etat.md` ;
- nommer les lieux dans `systeme.md` et le lorebook avec les mots que vous mettez en mots-clés (« le port », « la salle de veille ») : l'IA reprend les noms qu'on lui donne ;
- prévoir les synonymes probables dans les mots-clés : `port, quai, bistrot, criée`.

Pour une variante d'heure ou de météo, le mot doit apparaître **dans le lieu** lui-même : l'application ne lit pas les autres champs. `port_nuit.md` avec `Mots-clés : port de nuit, quai de nuit` ne répondra que si l'IA écrit « Port (de nuit) » ou « Quai de nuit ». Si l'histoire alterne souvent jour et nuit, il est plus simple de garder un seul décor par lieu, dans une lumière neutre.

## Combien de décors

Un par lieu où l'histoire revient souvent, plus `defaut`. Les lieux de passage tombent sur `defaut` sans dommage. Cinq à huit décors couvrent la plupart des scénarios.

## Un plan large, pas un tableau

Le décor s'affiche en 16/9, un plan large qui prend peu de place entre deux paragraphes. Composez-le comme un plan de cinéma : le sol descend jusqu'au bord bas, l'horizon est vers le milieu, le tiers droit est calme. Le personnage, qui fait presque toute la hauteur, s'y tient sur la ligne des 2/3 à droite.
