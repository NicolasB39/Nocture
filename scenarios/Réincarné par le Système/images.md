# Prompts d'images — Réincarné par le Système

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style. Gabarits complets : `reference/images.md` du skill.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (fond vert uni, puis détourage ; PNG ou WebP transparent, vertical 2:3)

Partie commune, à la suite de chaque description :

```
standing, facing the viewer at a slight three-quarter angle, [EXPRESSION], arms relaxed,
entire figure visible from head to feet, centered in the frame with a small margin on every side,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

- `Misa` : `[STYLE]. Full-body portrait of a young adult woman, 163 cm, long blonde hair, green eyes, long red cape, brown trousers, black boots, [PARTIE COMMUNE]`
- `Jasmine` : `[STYLE]. Full-body portrait of a young adult woman, 173 cm, lean agile build, medium-length black hair with bangs, red eyes, fitted discreet all-black outfit, [PARTIE COMMUNE]`
- `Amane` : `[STYLE]. Full-body portrait of a young adult woman, 160 cm, long red hair with bangs, blue eyes, black witch cape and black witch hat, black trousers, white shirt underneath, [PARTIE COMMUNE]`
- `Biro` : `[STYLE]. Full-body portrait of a young adult man, 185 cm, tall and strongly built, short brown hair, blue eyes, white tank top, black trousers, [PARTIE COMMUNE]`

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `sourire` | warm, genuine smile, softened eyes |
| `ferme` | closed, guarded expression, jaw set, eyes narrowed |

Négatif en plus : `background scenery, ground, cast shadow, cropped head, cropped feet, multiple characters`

Deimos n'a pas d'image : voix intérieure, et dragon trop grand pour un portrait en pied.

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

- `vallee` — `Mots-clés : vallée, plaine, campement` : `[STYLE]. Environment background, a wide green valley between steep hills, grass and scattered boulders, a dirt track winding into the distance, clear morning, [PARTIE COMMUNE]`
- `route` — `Mots-clés : route, chemin, sentier, calèche` : `[STYLE]. Environment background, a dirt road crossing open countryside, low stone walls, a few trees, afternoon, [PARTIE COMMUNE]`
- `ville` — `Mots-clés : ville, ville marchande, marché, rue, place, château` : `[STYLE]. Environment background, a busy fantasy merchant town street, timber and stone houses, market stalls on the left, a large castle on a hill in the distance, sunny day, [PARTIE COMMUNE]`
- `guilde` — `Mots-clés : guilde, hall de la guilde, comptoir, salle des quêtes` : `[STYLE]. Environment background, the main hall of an adventurers' guild, wooden counter, quest board covered with papers on the left, stone floor, warm lamplight, [PARTIE COMMUNE]`
- `auberge` — `Mots-clés : auberge, taverne, salle commune, chambre` : `[STYLE]. Environment background, the common room of a cozy fantasy inn, long wooden tables, stone fireplace on the left, hanging lanterns, evening, [PARTIE COMMUNE]`
- `ruines` — `Mots-clés : ruines, ruine*, donjon, caverne` : `[STYLE]. Environment background, ancient overgrown stone ruins with broken arches, faint glowing runes on the left, dusk light, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, fantasy countryside with hills and a distant forest under a soft sky, quiet and neutral, [PARTIE COMMUNE]`

Négatif en plus : `people, person, character, figure, silhouette, crowd`

## Couverture (3/4, sujet centré)

```
[STYLE]. Key art for an interactive story: a lone figure seen from behind standing in a vast green valley at dawn,
glowing runes floating in the air, a castle town far away, a huge dragon silhouette in the clouds,
strong central composition, subject centered vertically and horizontally, atmospheric, no text, no title, vertical 3:4 format.
```
