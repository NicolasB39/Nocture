# Prompts d'images — Le Dernier Rang

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
2. la découper avec le script du skill, qui retire aussi le fond vert, les noms dans l'ordre de gauche à droite :
   `node skills/scenario-histoires/scripts/decouper.mjs planche-ines.png "scenarios/Le Dernier Rang/personnages/Ines" Ines_neutre Ines_sourire Ines_ferme`
3. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Gabarit, à la suite du bloc de style :

```
[STYLE]. Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions, pose and lighting in every figure, only the facial expression changes,
from left to right: calm neutral expression, [SOURIRE], closed guarded expression with jaw set and eyes narrowed.
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

- `Ines` : `a 26-year-old French woman healer, small and wiry, short choppy black hair, tired dark eyes, oversized olive tactical jacket, fingerless medical gloves stained with green, cargo trousers, worn hiking boots, small first-aid pouch on the belt` · `[SOURIRE]` : `tired but genuine half-smile, softened eyes`
- `Dussault` : `a 50-year-old tall lean French man, short grey hair, sharp features, immaculate grey three-piece suit, thin white scar across the back of his right hand, small paper notebook in breast pocket, polished black shoes` · `[SOURIRE]` : `polite faint smile that does not reach the eyes`
- `Kael` : `a 30-year-old athletic French man, blond hair slicked back, sleek matte black armor with silver trim and a small lily emblem on the chest, curved sword sheathed on his back, black boots` · `[SOURIRE]` : `confident smirk, one corner of the mouth raised`

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, captions, labels, grid lines, panels`

Inès et Dussault ont leurs trois expressions en buste (planches du 15 novembre 2026). Kaël est encore en pied : planche à refaire en buste.

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
