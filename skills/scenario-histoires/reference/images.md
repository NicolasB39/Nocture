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

## Personnages : détourés, centrés, en pied

L'application pose chaque personnage sur le décor du lieu courant. Dans la conversation, elle le place elle-même sur la ligne des 2/3 à droite, pieds en bas de la scène ; dans la fenêtre Personnages, elle le centre. Elle mesure la silhouette sur l'image : l'image doit donc contenir **le personnage seul, centré, sur fond transparent**, et rien d'autre.

### Gabarit

```
[BLOC DE STYLE].
Full-body portrait of [PERSONNAGE : âge, silhouette, vêtements, signes distinctifs],
standing, facing the viewer at a slight three-quarter angle, [EXPRESSION], arms relaxed,
entire figure visible from head to feet, centered in the frame with a small margin on every side,
isolated on a plain flat uniform light grey background, no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

Négatif, en plus du négatif commun :

```
background scenery, ground, cast shadow, cropped head, cropped feet, multiple characters, props touching the edges
```

Les points qui comptent :

- **En pied, de la tête aux pieds.** L'application aligne le bas de la silhouette sur le bas de la scène : des pieds coupés donnent un personnage qui flotte coupé à mi-jambe.
- **Fond uni, puis détourage.** La plupart des générateurs ne savent pas produire de transparence : demandez un fond gris clair uni. Pour une planche, `scripts/decouper.mjs` le retire lui-même ; pour une image isolée, retirez-le avec un outil de détourage (remove.bg, `rembg`, l'éditeur). Si votre générateur propose une sortie transparente, utilisez-la directement. Pour un personnage vêtu de blanc ou de gris clair (chemise, armure argentée, cheveux blancs), demandez plutôt un fond uni d’une couleur qu’il ne porte pas (« plain flat uniform pale green background ») : le script détoure n’importe quel fond uni, et un vêtement trop proche du fond risquerait d’être percé.
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
standing, facing the viewer at a slight three-quarter angle, arms relaxed close to the body,
every figure fully visible from head to feet, same height, evenly spaced with a wide empty gap between figures,
no figure touching or overlapping another,
isolated on a plain flat uniform light grey background, no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format [FORMAT].
```

Négatif, en plus du négatif commun :

```
different outfits, different characters, overlapping figures, cropped feet, cropped head, captions, labels, grid lines, panels
```

Format selon le nombre d'expressions, pour que chaque silhouette garde assez de hauteur :

| Expressions | `[FORMAT]` | Exemple |
|---|---|---|
| 3 | 3:2 | 1536 × 1024 |
| 4 | 2:1 | 2048 × 1024 |
| 5 ou 6 | deux planches de 3 | — |

Au-delà de quatre, les silhouettes deviennent trop petites : faites deux planches avec le même prompt, la même graine ou la première planche en image de référence.

Puis, dans l'ordre :

1. **Vérifier la planche** : même visage et même tenue partout, pieds visibles, silhouettes séparées par un vrai vide. Sinon, régénérer.
2. **L'exporter en PNG** si le générateur a donné un WebP ou un JPG (le script ne lit que le PNG). Inutile de la détourer : le script s'en charge.
3. **Découper et détourer** :

   ```
   node scripts/decouper.mjs planche-maren.png "scenarios/<Nom>/personnages/Maren" neutre sourire ferme
   ```

   Les noms suivent l'ordre des silhouettes, de gauche à droite. Le script écrit une image par nom, PNG vertical 2:3, personnage centré avec une petite marge, et rend le fond transparent. Le détourage part des bords sur le gris uni, retire aussi le gris enfermé (entre un bras et le corps, entre deux mèches) et adoucit le contour pour éviter un liseré gris autour des cheveux ; un objet clair texturé (une trousse, un col) reste. Une planche déjà détourée garde sa transparence ; `--garder-fond` découpe sans détourer. S'il ne trouve pas autant de silhouettes que de noms (deux personnages qui se touchent), il coupe en parts égales et le signale : vérifiez, ou régénérez avec plus d'espace. S'il retire peu de fond, le fond n'était sans doute pas uni : il le signale.
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
- **Caméra à hauteur de taille, horizon vers le milieu, sol jusqu'au bord bas** : le personnage, haut comme presque toute la scène, est posé pieds au bord bas. Un horizon placé au milieu tombe à sa taille, ce qui est naturel ; le sol doit descendre jusqu'au bord pour qu'il ait l'air de s'y tenir. Un horizon très haut le ferait flotter.
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
standing, facing the viewer at a slight three-quarter angle, arms relaxed close to the body,
every figure fully visible from head to feet, same height, evenly spaced with a wide empty gap between figures,
no figure touching or overlapping another,
isolated on a plain flat uniform light grey background, no floor, no cast shadow, no props,
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
