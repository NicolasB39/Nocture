# Prompts d'images — La Compagnie du Gué

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour générer les images puis les régénérer dans le même style.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (fond gris uni, puis détourage ; PNG ou WebP transparent, vertical 2:3)

Partie commune, à la suite de chaque description :

```
standing, facing the viewer at a slight three-quarter angle, [EXPRESSION], arms relaxed,
entire figure visible from head to feet, centered in the frame with a small margin on every side,
isolated on a plain flat uniform light grey background, no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

Négatif en plus : `background scenery, ground, cast shadow, cropped head, cropped feet, multiple characters`

- `Berthe` : `[STYLE]. Full-body portrait of a 40-year-old very tall and broad woman, former blacksmith, muscular arms, blond braid coiled on her head, gentle face, chainmail patched with pink thread over a leather apron, a large blacksmith hammer hanging at her belt, sturdy boots, [PARTIE COMMUNE]`
- `Fenouil` : `[STYLE]. Full-body portrait of a halfling man, about 1.1 metres tall, curly red hair, mischievous grin, oversized feathered hat, green waistcoat with many bulging pockets, short cloak, bare hairy feet, [PARTIE COMMUNE]`
- `Anselme` : `[STYLE]. Full-body portrait of a 19-year-old thin young monk, crooked tonsure, brown hooded robe slightly too long, rope belt, a satchel of remedies across the body, a small prayer book in hand, earnest worried face, sandals, [PARTIE COMMUNE]`
- `Gontran` : `[STYLE]. Full-body portrait of a 55-year-old round rosy-cheeked merchant, waxed moustache, felt hat, fur-lined coat too warm for the season, a big ring of keys at his belt, polished shoes, [PARTIE COMMUNE]`
- `Isaure` : `[STYLE]. Full-body portrait of a 16-year-old girl, short brown hair roughly cut, bright clever eyes, stable boy clothes that look too clean, very straight noble posture, a hidden ring on a cord, [PARTIE COMMUNE]`
- `Rocaille` : `[STYLE]. Full-body portrait of a 70-year-old small wiry grandmother bandit leader, grey bun, wool shawl, clay pipe in her mouth, a crossbow taller than her slung on her back, sharp knowing eyes, [PARTIE COMMUNE]`

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

- `auberge` : `[STYLE]. Environment background, courtyard of a cosy medieval riverside inn, timber frame building with a painted sign, two covered wagons and wooden crates on the left, morning light, [PARTIE COMMUNE]`
- `route` : `[STYLE]. Environment background, a dirt road winding through rolling green borderland hills, a milestone on the left, distant castles on both horizons, sunny afternoon, [PARTIE COMMUNE]`
- `bac` : `[STYLE]. Environment background, a wide fast river with a wooden ferry raft tied to a rope crossing, a ferryman hut on the left bank, reeds, bright day, [PARTIE COMMUNE]`
- `peage` : `[STYLE]. Environment background, a small shabby castle gatehouse with a toll barrier across the road, faded banners, a wooden toll booth on the left, afternoon, [PARTIE COMMUNE]`
- `foret` : `[STYLE]. Environment background, a narrow road through a dense old forest, mossy trunks, a fallen tree across the path on the left, shafts of sunlight, [PARTIE COMMUNE]`
- `col` : `[STYLE]. Environment background, a mountain pass road with switchbacks along a cliff edge, scattered rocks and scree on the left, a small shepherd hut, white city towers far away, clear sky, [PARTIE COMMUNE]`
- `campement` : `[STYLE]. Environment background, a roadside camp at dusk, a crackling campfire, two wagons and tethered horses on the left, first stars, warm firelight, [PARTIE COMMUNE]`
- `hautcastel` : `[STYLE]. Environment background, the bright courtyard of a white medieval palace on a hill, banners, flower beds, a grand staircase on the left, festive afternoon, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, open medieval countryside road at golden hour, fields and a lone tree, [PARTIE COMMUNE]`

## Couverture (3/4, sujet centré, 600 × 800)

```
[STYLE]. Key art for an interactive story: a small band of four mercenaries escorting a covered wagon across a sunny borderland road,
a towering blacksmith woman, a halfling with a feathered hat, a young monk struggling on his horse, a leader in front,
a huge round cheese visible in the wagon, white castle towers in the distance, strong central composition,
subject centered vertically and horizontally, cheerful adventurous atmosphere, no text, no title, vertical 3:4 format.
```
