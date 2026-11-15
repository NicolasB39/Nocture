# Prompts de génération d'images

Trois sortes d'images, trois gabarits : les personnages (détourés), les décors (vides), la couverture. Les prompts sont en anglais, que tous les générateurs comprennent mieux ; les explications restent en français.

## Le bloc de style, commun à tout le scénario

La cohérence compte plus que la qualité d'une image isolée. Écrivez une fois pour toutes un bloc de style et collez-le **tel quel** en tête de chaque prompt du scénario. Seule la palette change d'un scénario à l'autre.

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
[PALETTE : ex. muted cold palette, slate blue and grey, warm lamplight accents]
```

Négatif commun (champ « negative prompt », ou `--no` selon l'outil) :

```
chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border
```

Gardez le bloc de style et les prompts du scénario dans un fichier `images.md` à la racine du scénario : l'application l'ignore, et il permet de régénérer une image des mois plus tard dans le même style.

## Personnages : détourés, en buste

L'application pose chaque personnage sur le décor du lieu courant. Dans la conversation, elle le place elle-même sur la ligne des 2/3 à droite, la taille au bas de la scène, le buste sur presque toute sa hauteur ; dans la fenêtre Personnages, elle le centre. Elle mesure la silhouette sur l'image : l'image doit donc contenir **le personnage seul, centré, sur fond transparent**, et rien d'autre.

### Gabarit

```
[BLOC DE STYLE].
Waist-up portrait of [PERSONNAGE : âge, silhouette, vêtements, signes distinctifs],
facing the viewer at a slight three-quarter angle, [EXPRESSION], strong readable facial expression,
cut at the waist by the bottom edge of the image, head near the top with a small margin, centered horizontally with a margin on the left and right,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

Négatif, en plus du négatif commun :

```
background scenery, ground, cast shadow, cropped head, full body, legs, multiple characters, props touching the edges
```

Les points qui comptent :

- **En buste, coupé à la taille par le bas de l'image**, la tête près du haut. Le visage est grand : une émotion se lit d'un coup d'œil, même sur un téléphone. L'application pose le bas de l'image au bas de la scène, où elle se fond ; un buste qui ne touche pas le bas flotterait. Un animal fait exception : entier, assis, il se pose de la même façon.
- **Expressions marquées**, à la manière de l'anime : sourcils, bouche et regard nettement différents d'une expression à l'autre. Une expression trop retenue ne se distingue pas de la neutre.
- **Fond uni, puis détourage.** La plupart des générateurs ne savent pas produire de transparence : demandez un fond **vert d'incrustation** uni (#00FF00), comme au cinéma. Aucun personnage n'a cette couleur : rien ne se confond avec le fond, ni une chemise blanche, ni des cheveux gris, ni une armure argentée, ce qui arrivait avec un fond gris. Pour une planche, `scripts/decouper.mjs` retire le vert lui-même, reflet vert des bords compris ; pour une image isolée, retirez-le avec un outil de détourage (remove.bg, `rembg`, l'éditeur). Si le personnage porte du vert vif (un esprit de la forêt, une robe émeraude), demandez un fond magenta (`#FF00FF`) : le script détoure n'importe quel fond uni vif. Si votre générateur propose une sortie transparente, utilisez-la directement.
- **Pas d'ombre portée au sol** : détourée, elle devient une tache flottante sur le décor.
- **Lumière venant de la gauche**, comme dans le gabarit des décors : un personnage éclairé de l'autre côté que son décor se voit tout de suite.
- **Format vertical 2:3**, par exemple 1024 × 1536. L'application s'adapte à d'autres proportions puisqu'elle mesure la silhouette, mais un même format pour tout le scénario garde les personnages à la même échelle.

Export : **PNG ou WebP avec transparence**. Un JPG ne peut pas être transparent : l'image serait affichée seule, en pleine largeur, sans décor derrière. Vérifiez le bord du détourage sur fond sombre : un liseré clair autour des cheveux se verra sur tous les décors nocturnes.

### Expressions : une seule planche par personnage

Toutes les expressions d'un personnage se génèrent **en une seule image** : le même personnage répété côte à côte, une expression par silhouette, de gauche à droite. Une seule génération garde le visage, la coiffure, la tenue et la lumière identiques ; des générations séparées dérivent toujours un peu. Quand l'IA passe de `maren_neutre` à `maren_sourire`, seul le visage doit bouger.

Gabarit de la planche :

```
[BLOC DE STYLE].
Character expression sheet: the same character shown [N] times side by side in a single row,
identical outfit, hairstyle, proportions, pose and lighting in every figure, only the facial expression changes,
from left to right: [EXPRESSION 1], [EXPRESSION 2], [EXPRESSION 3].
[PERSONNAGE : âge, silhouette, vêtements, signes distinctifs],
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
facing the viewer at a slight three-quarter angle, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, evenly spaced with a wide empty gap between figures,
a green margin on the left and right edges of the image, no figure cut by the side edges,
no figure touching or overlapping another,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format [FORMAT].
```

Négatif, en plus du négatif commun :

```
different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, full body, legs, cropped head, captions, labels, grid lines, panels
```

Format selon le nombre d'expressions, pour que chaque silhouette garde assez de hauteur :

| Expressions | `[FORMAT]` | Exemple |
|---|---|---|
| 3 | 3:2 | 1536 × 1024 |
| 4 | 2:1 | 2048 × 1024 |
| 5 ou 6 | deux planches de 3 | — |

Au-delà de quatre, les silhouettes deviennent trop petites : faites deux planches avec le même prompt, la même graine ou la première planche en image de référence.

Puis, dans l'ordre :

1. **Vérifier la planche** : même visage et même tenue partout, chaque buste coupé par le bas de l’image, expressions bien distinctes, têtes séparées par du fond. Des bustes qui se touchent par les épaules passent : le script les sépare là où le fond descend le plus bas ; des visages ou des bras qui se chevauchent, non. Sinon, régénérer.
2. **Garder le PNG d'origine**, téléchargé depuis le générateur, plutôt qu'une capture ou une image recollée dans une conversation : chaque recompression laisse un halo autour des silhouettes. Le script ne lit que le PNG ; exportez en PNG un WebP ou un JPG. Inutile de détourer : le script s'en charge.
3. **Découper et détourer** :

   ```
   node scripts/decouper.mjs planche-maren.png "scenarios/<Nom>/personnages/Maren" neutre sourire ferme
   ```

   Les noms suivent l'ordre des silhouettes, de gauche à droite. Le script écrit une image par nom, PNG vertical 2:3, personnage centré avec une petite marge, et rend le fond transparent. Le détourage part des bords sur la couleur du fond, retire aussi le fond enfermé (entre un bras et le corps, entre deux mèches) et adoucit le contour. Sur un fond vert, il retire en plus le reflet vert des bords ; sur un fond gris (anciennes planches), il rogne le halo clair que la compression laisse autour des silhouettes, sans toucher une chemise ou une trousse claires. Une planche déjà détourée garde sa transparence ; `--garder-fond` découpe sans détourer. S'il ne trouve pas autant de silhouettes que de noms (deux personnages qui se touchent), il coupe en parts égales et le signale : vérifiez, ou régénérez avec plus d'espace. S'il retire peu de fond, le fond n'était sans doute pas uni : il le signale.
4. **Vérifier chaque image** sur fond sombre (liseré clair autour des cheveux), puis convertir en WebP si possible : un PNG détouré pèse souvent plus d'un mégaoctet.
5. **Ranger la planche hors du dossier du personnage** : toute image de `personnages/<Nom>/` devient une expression. Gardez-la hors du scénario, ou dans `planches/` à la racine du scénario, que l'application ignore.

Pour ajouter une expression plus tard, régénérez une planche avec la première en image de référence, plutôt qu'une image isolée.

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `sourire` | warm, genuine smile, softened eyes |
| `ferme` | closed, guarded expression, jaw set, eyes narrowed |
| `colere` | restrained anger, furrowed brows, tense mouth |
| `triste` | quiet sadness, lowered gaze |
| `surprise` | surprised, eyebrows raised, lips parted |

Trois expressions suffisent pour commencer : neutre, une positive, une fermée.

Le gabarit du personnage seul, plus haut, reste utile pour régénérer une seule expression ou pour un personnage qui n'en a qu'une.

## Décors : vides, en 16/9, la place du personnage réservée

Le décor sert de fond à des personnages ajoutés par-dessus. Il doit donc être **vide**, et laisser de la place à droite, où l'application pose le personnage. Il s'affiche en **16/9**, un plan large qui prend peu de place dans le fil : le personnage y occupe environ 90 % de la hauteur.

### Gabarit

```
[BLOC DE STYLE].
Environment background, [LIEU : description, époque, matériaux], [HEURE ET MÉTÉO],
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

Négatif, en plus du négatif commun :

```
people, person, character, figure, silhouette, crowd, animals in the foreground
```

Les points qui comptent :

- **Aucun personnage**, même au loin : un passant peint dans le décor se retrouve à côté de chaque personnage posé dessus.
- **Caméra à hauteur de taille, horizon vers le milieu** : le buste, haut comme presque toute la scène, a la taille au bord bas. Un horizon placé au milieu tombe à hauteur de poitrine, comme si la caméra était face à lui ; un horizon très haut ou très bas donnerait une plongée qui ne colle pas au personnage.
- **Tiers droit dégagé** : c'est là que se tient le personnage. Un élément fort à cet endroit (une porte, une lampe) se retrouve caché derrière lui.
- **Formes lisibles, peu de détails** : la scène est petite sur un téléphone. Les détails fins disparaissent, les grandes masses de lumière et de couleur passent.
- **L'essentiel dans la bande centrale** : la pastille ronde de la fenêtre Personnages recadre le décor en carré, au centre.
- **Format 16:9**, par exemple 1600 × 900 (ou 1280 × 720), en WebP.

Pour une variante (nuit, tempête), générez le même lieu avec le même prompt en ne changeant que `[HEURE ET MÉTÉO]`, et donnez-lui ses propres mots-clés (voir `decors.md`).

## Couverture : 3/4, sujet centré

```
[BLOC DE STYLE].
Key art for an interactive story: [SUJET : le lieu emblématique, éventuellement un personnage],
strong central composition, subject centered vertically and horizontally,
atmospheric, no text, no title, vertical 3:4 format.
```

La couverture est recadrée en 3/4, 16/10 et 16/9 selon l'endroit : tout ce qui compte doit tenir au centre. 600 × 800 en WebP suffit.

## Réglages selon l'outil

| Outil | Format | Négatif |
|---|---|---|
| Midjourney | `--ar 3:2` (planche), `--ar 2:3`, `--ar 16:9`, `--ar 3:4` | `--no` suivi de la liste |
| Stable Diffusion, Flux, ComfyUI | largeur × hauteur (1536 × 1024 pour une planche, 1024 × 1536, 1600 × 900) | champ négatif |
| ChatGPT, Gemini, outils sans réglage | écrire « wide horizontal format 3:2 », « vertical 2:3 », « widescreen 16:9 » dans le prompt, comme dans les gabarits ; ChatGPT propose aussi le format paysage 1536 × 1024 | écrire « without … » dans le prompt |

## Exemple complet : Le Phare d'Arvor

Bloc de style :

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
muted cold palette, slate blue and grey, warm lamplight accents
```

Planche de Maren, découpée en `personnages/Maren/neutre.png`, `sourire.png` et `ferme.png` :

```
[BLOC DE STYLE].
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions, pose and lighting in every figure, only the facial expression changes,
from left to right: calm neutral expression, warm genuine smile with softened eyes, closed guarded expression with jaw set.
A 60-year-old Breton herbalist woman, short and sturdy,
grey hair tied back, sap-stained hands, thick wool cardigan over a dark work dress,
canvas apron with pockets, rubber boots,
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
facing the viewer at a slight three-quarter angle, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, evenly spaced with a wide empty gap between figures,
a green margin on the left and right edges of the image, no figure cut by the side edges,
no figure touching or overlapping another,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format 3:2.
```

```
node scripts/decouper.mjs planche-maren.png "scenarios/Le Phare d'Arvor/personnages/Maren" neutre sourire ferme
```

`decors/phare.webp` :

```
[BLOC DE STYLE].
Environment background, the watch room at the top of an old granite lighthouse in Brittany,
brass instruments, logbook on a wooden desk, curved windows overlooking the sea,
November dusk, overcast sky, last light on the water,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```
