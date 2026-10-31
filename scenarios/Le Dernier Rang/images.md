# Prompts d'images — Le Dernier Rang

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents
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

- `Ines` : `[STYLE]. Full-body portrait of a 26-year-old French woman healer, small and wiry, short choppy black hair, tired dark eyes, oversized olive tactical jacket, fingerless medical gloves stained with green, cargo trousers, worn hiking boots, small first-aid pouch on the belt, [PARTIE COMMUNE]`
- `Dussault` : `[STYLE]. Full-body portrait of a 50-year-old tall lean French man, short grey hair, sharp features, immaculate grey three-piece suit, thin white scar across the back of his right hand, small paper notebook in breast pocket, polished black shoes, [PARTIE COMMUNE]`
- `Kael` : `[STYLE]. Full-body portrait of a 30-year-old athletic French man, blond hair slicked back, confident half-smile, sleek matte black armor with silver trim and a small lily emblem on the chest, curved sword sheathed on his back, black boots, [PARTIE COMMUNE]`

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `sourire` | warm, genuine smile, softened eyes (pour Kaël : confident smirk) |
| `ferme` | closed, guarded expression, jaw set, eyes narrowed |

Négatif en plus : `background scenery, ground, cast shadow, cropped head, cropped feet, multiple characters`

## Décors (16/9, sans personnage, tiers droit dégagé)

Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

- `appartement` : `[STYLE]. Environment background, a cramped studio apartment in northeast Paris, unmade single bed, peeling wallpaper, stack of unpaid bills on a small table, window on the left with city lights, night, neon glow, [PARTIE COMMUNE]`
- `agence` : `[STYLE]. Environment background, the vast glass lobby of a government agency tower in La Défense, polished stone floor, a large glowing measuring crystal on a pedestal on the left, daytime, cold diffuse light, [PARTIE COMMUNE]`
- `guilde` : `[STYLE]. Environment background, the grand hall of a Parisian private mansion turned elite guild headquarters, marble floor, black banners with a silver lily, chandelier, evening, warm golden light, [PARTIE COMMUNE]`
- `faille` : `[STYLE]. Environment background, a Paris street at dusk cordoned off with police barriers, a huge swirling blue portal floating above the cobblestones on the left, Haussmann buildings, [PARTIE COMMUNE]`
- `donjon` : `[STYLE]. Environment background, ancient underground catacombs beneath Paris twisted by magic, stone corridors, glowing blue crystals in the walls, dim cold light, [PARTIE COMMUNE]`
- `chapelle` : `[STYLE]. Environment background, a half-flooded gothic chapel deep underground, black water covering the floor, a giant handless clock above the altar on the left, empty bronze-masked armor statues along the walls, cold blue glow, [PARTIE COMMUNE]`
- `ville_figee` : `[STYLE]. Environment background, an empty frozen Paris boulevard under a blank white sky, all street clocks showing midnight, drifting grey ash, eerie silence, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, Paris rooftops at night with a faint blue portal glow on the horizon, quiet and neutral, [PARTIE COMMUNE]`

Négatif en plus : `people, person, character, figure, silhouette, crowd`

## Couverture (3/4, sujet centré)

```
[STYLE]. Key art for an interactive story: a lone hooded hunter seen from behind, standing before a huge
swirling blue portal in a dark Paris street, faint glowing interface panel floating beside them,
strong central composition, subject centered vertically and horizontally, atmospheric,
no text, no title, vertical 3:4 format.
```
