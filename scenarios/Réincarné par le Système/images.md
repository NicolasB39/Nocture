# Prompts d'images — Réincarné par le Système

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style. Gabarits complets : `reference/images.md` du skill.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (une planche par personnage sur fond vert, puis découpe)

Une seule planche par personnage : ses expressions côte à côte, dans l'ordre du tableau ci-dessous, en une génération (même visage, même tenue). Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni. Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite (rien de coupé par les bords), les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
3. la découper avec le script du skill, qui retire aussi le fond, les noms dans l'ordre de gauche à droite :
   `node skills/scenario-histoires/scripts/decouper.mjs planche-misa.png "scenarios/Réincarné par le Système/personnages/Misa" misa_neutre misa_sourire misa_ferme`
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Gabarit, `[DESCRIPTION]` pris dans la liste ci-dessous :

```
[STYLE]. Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: [les trois expressions du tableau, dans l'ordre].
[DESCRIPTION],
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

- `Misa` : `a young adult woman, 163 cm, long blonde hair, green eyes, long red cape, brown trousers, black boots`
- `Jasmine` : `a young adult woman, 173 cm, lean agile build, medium-length black hair with bangs, red eyes, fitted discreet all-black outfit`
- `Amane` : `a young adult woman, 160 cm, long red hair with bangs, blue eyes, black witch cape and black witch hat, black trousers, white shirt underneath`
- `Biro` : `a young adult man, 185 cm, tall and strongly built, short brown hair, blue eyes, white tank top, black trousers`

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `sourire` | warm, genuine smile, softened eyes |
| `ferme` | closed, guarded expression, jaw set, eyes narrowed |

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, captions, labels, grid lines, panels`

Deimos n'a pas d'image : voix intérieure, et dragon trop grand pour un portrait.

## Décors (16/9, sans personnage, tiers droit dégagé)

Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

Chaque décor est un fichier `decors/<nom>.webp` avec son `decors/<nom>.md` ; créez le `.md` en même temps que l'image (un `.md` sans image est ignoré).

- `vallee` — `Mots-clés : vallée, plaine, campement` : `[STYLE]. Environment background, a wide green valley between steep hills, grass and scattered boulders, a dirt track winding into the distance, clear morning`
- `route` — `Mots-clés : route, chemin, sentier, calèche` : `[STYLE]. Environment background, a dirt road crossing open countryside, low stone walls, a few trees, afternoon`
- `ville` — `Mots-clés : ville, ville marchande, marché, rue, place, château` : `[STYLE]. Environment background, a busy fantasy merchant town street, timber and stone houses, market stalls on the left, a large castle on a hill in the distance, sunny day`
- `guilde` — `Mots-clés : guilde, hall de la guilde, comptoir, salle des quêtes` : `[STYLE]. Environment background, the main hall of an adventurers' guild, wooden counter, quest board covered with papers on the left, stone floor, warm lamplight`
- `auberge` — `Mots-clés : auberge, taverne, salle commune, chambre` : `[STYLE]. Environment background, the common room of a cozy fantasy inn, long wooden tables, stone fireplace on the left, hanging lanterns, evening`
- `ruines` — `Mots-clés : ruines, ruine*, donjon, caverne` : `[STYLE]. Environment background, ancient overgrown stone ruins with broken arches, faint glowing runes on the left, dusk light`
- `defaut` : `[STYLE]. Environment background, fantasy countryside with hills and a distant forest under a soft sky, quiet and neutral`

Négatif en plus : `people, person, character, figure, silhouette, crowd`

## Couverture (3/4, sujet centré)

```
[STYLE]. Key art for an interactive story: a lone figure seen from behind standing in a vast green valley at dawn,
glowing runes floating in the air, a castle town far away, a huge dragon silhouette in the clouds,
strong central composition, subject centered vertically and horizontally, atmospheric, no text, no title, vertical 3:4 format.
```
