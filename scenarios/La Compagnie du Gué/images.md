# Prompts d'images — La Compagnie du Gué

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour générer les images puis les régénérer dans le même style.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (une planche par personnage sur fond vert, puis découpe)

Une seule planche par personnage : ses expressions côte à côte, dans l'ordre du tableau ci-dessous, en une génération (même visage, même tenue). Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni. Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite (rien de coupé par les bords), les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
3. la découper avec le script du skill, qui retire aussi le fond, les noms dans l'ordre de gauche à droite :
   `node skills/scenario-histoires/scripts/decouper.mjs planche-berthe.png "scenarios/La Compagnie du Gué/personnages/Berthe" berthe_neutre berthe_joie berthe_surprise`
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Gabarit, `[DESCRIPTION]` pris dans la liste ci-dessous :

```
[STYLE]. Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions, pose and lighting in every figure, only the facial expression changes,
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

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, captions, labels, grid lines, panels`

- `Berthe` : `a 40-year-old very tall and broad woman, former blacksmith, muscular arms, blond braid coiled on her head, gentle face, chainmail patched with pink thread over a leather apron, a large blacksmith hammer hanging at her belt, sturdy boots`
- `Fenouil` : `a halfling man, about 1.1 metres tall, curly red hair, mischievous grin, oversized feathered hat, green waistcoat with many bulging pockets, short cloak, bare hairy feet` (gilet vert : planche sur fond magenta, `bright magenta background (#FF00FF)` à la place du vert)
- `Anselme` : `a 19-year-old thin young monk, crooked tonsure, brown hooded robe slightly too long, rope belt, a satchel of remedies across the body, a small prayer book in hand, earnest worried face, sandals`
- `Gontran` : `a 55-year-old round rosy-cheeked merchant, waxed moustache, felt hat, fur-lined coat too warm for the season, a big ring of keys at his belt, polished shoes`
- `Isaure` : `a 16-year-old girl, short brown hair roughly cut, bright clever eyes, stable boy clothes that look too clean, very straight noble posture, a hidden ring on a cord`
- `Rocaille` : `a 70-year-old small wiry grandmother bandit leader, grey bun, wool shawl, clay pipe in her mouth, a crossbow taller than her slung on her back, sharp knowing eyes`

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `joie` | warm, genuine laugh, softened eyes |
| `surprise` | surprised, eyebrows raised, lips parted |

Codes obtenus : `berthe_joie`, `fenouil_surprise`, `anselme_neutre`, etc.

## Décors (16/9, sans personnage, tiers droit dégagé)

Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

Négatif en plus : `people, person, character, figure, silhouette, crowd, animals in the foreground`

- `auberge` : `[STYLE]. Environment background, courtyard of a cosy medieval riverside inn, timber frame building with a painted sign, two covered wagons and wooden crates on the left, morning light`
- `route` : `[STYLE]. Environment background, a dirt road winding through rolling green borderland hills, a milestone on the left, distant castles on both horizons, sunny afternoon`
- `bac` : `[STYLE]. Environment background, a wide fast river with a wooden ferry raft tied to a rope crossing, a ferryman hut on the left bank, reeds, bright day`
- `peage` : `[STYLE]. Environment background, a small shabby castle gatehouse with a toll barrier across the road, faded banners, a wooden toll booth on the left, afternoon`
- `foret` : `[STYLE]. Environment background, a narrow road through a dense old forest, mossy trunks, a fallen tree across the path on the left, shafts of sunlight`
- `col` : `[STYLE]. Environment background, a mountain pass road with switchbacks along a cliff edge, scattered rocks and scree on the left, a small shepherd hut, white city towers far away, clear sky`
- `campement` : `[STYLE]. Environment background, a roadside camp at dusk, a crackling campfire, two wagons and tethered horses on the left, first stars, warm firelight`
- `hautcastel` : `[STYLE]. Environment background, the bright courtyard of a white medieval palace on a hill, banners, flower beds, a grand staircase on the left, festive afternoon`
- `defaut` : `[STYLE]. Environment background, open medieval countryside road at golden hour, fields and a lone tree`

## Couverture (3/4, sujet centré, 600 × 800)

```
[STYLE]. Key art for an interactive story: a small band of four mercenaries escorting a covered wagon across a sunny borderland road,
a towering blacksmith woman, a halfling with a feathered hat, a young monk struggling on his horse, a leader in front,
a huge round cheese visible in the wagon, white castle towers in the distance, strong central composition,
subject centered vertically and horizontally, cheerful adventurous atmosphere, no text, no title, vertical 3:4 format.
```
