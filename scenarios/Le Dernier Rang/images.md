# Prompts d'images — Le Dernier Rang

Fichier ignoré par l'application. Chaque prompt est **complet** : le style, la description, le cadrage et les éléments à éviter sont dans un seul bloc, à copier d'un coup (sur GitHub, bouton de copie en haut à droite du bloc) et à coller tel quel dans ChatGPT ou Gemini. Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif.

Si le générateur accepte une image en entrée (ChatGPT, Gemini, Midjourney avec `--sref`), joindre une image dont le style plaît (un personnage d'un autre scénario, par exemple) et ajouter en tête du prompt : `Match the art style, rendering and lighting of the attached image, but draw a different character:`. C'est le moyen le plus sûr d'obtenir ce style, plus qu'une description. Sans image, Gemini dérive vers un style d'illustration de jeu occidental.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents
```

Inès, Dussault et Kaël ont déjà leurs trois expressions en buste (planches du 15 novembre 2026) : les prompts ci-dessous servent à les régénérer.

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite, les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur ;
3. la découper avec la commande donnée sous le prompt : l'outil retire le fond vert, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite ;
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

### Ines

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) tired but genuine half-smile, softened eyes; (3) closed guarded expression with jaw set and eyes narrowed.
A 26-year-old French woman healer, small and wiry, short choppy black hair, tired dark eyes, oversized olive tactical jacket, fingerless medical gloves stained with green, cargo trousers, worn hiking boots, small first-aid pouch on the belt,
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
body turned three-quarters toward the viewer, which keeps the shoulders narrow, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, each one fitting inside its own equal share of the image width,
both shoulders and upper arms of every figure entirely visible, with green background on both sides of them,
a wide green gap between figures and a green margin on the left and right edges of the image,
no figure touching or overlapping another,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format 3:2.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-ines.png "scenarios/Le Dernier Rang/personnages/Ines" Ines_neutre Ines_sourire Ines_ferme
```

### Dussault

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) polite faint smile that does not reach the eyes; (3) closed guarded expression with jaw set and eyes narrowed.
A 50-year-old tall lean French man, short grey hair, sharp features, immaculate grey three-piece suit, thin white scar across the back of his right hand, small paper notebook in breast pocket, polished black shoes,
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
body turned three-quarters toward the viewer, which keeps the shoulders narrow, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, each one fitting inside its own equal share of the image width,
both shoulders and upper arms of every figure entirely visible, with green background on both sides of them,
a wide green gap between figures and a green margin on the left and right edges of the image,
no figure touching or overlapping another,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format 3:2.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-dussault.png "scenarios/Le Dernier Rang/personnages/Dussault" dussault_neutre dussault_sourire dussault_ferme
```

### Kael

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) confident smirk, one corner of the mouth raised; (3) closed guarded expression with jaw set and eyes narrowed.
A 30-year-old athletic French man, blond hair slicked back, sleek matte black armor with silver trim and a small lily emblem on the chest, curved sword sheathed on his back, black boots,
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
body turned three-quarters toward the viewer, which keeps the shoulders narrow, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, each one fitting inside its own equal share of the image width,
both shoulders and upper arms of every figure entirely visible, with green background on both sides of them,
a wide green gap between figures and a green margin on the left and right edges of the image,
no figure touching or overlapping another,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format 3:2.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-kael.png "scenarios/Le Dernier Rang/personnages/Kael" kael_neutre kael_sourire kael_ferme
```

## Décors (16/9, sans personnage, tiers droit dégagé)

À enregistrer dans `decors/` sous le nom du titre, en WebP : `decors/chapelle.webp`.

### appartement

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, a cramped studio apartment in northeast Paris, unmade single bed, peeling wallpaper, stack of unpaid bills on a small table, window on the left with city lights, night, neon glow,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### agence

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, the vast glass lobby of a government agency tower in La Défense, polished stone floor, a large glowing measuring crystal on a pedestal on the left, daytime, cold diffuse light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### guilde

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, the grand hall of a Parisian private mansion turned elite guild headquarters, marble floor, black banners with a silver lily, chandelier, evening, warm golden light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### faille

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, a Paris street at dusk cordoned off with police barriers, a huge swirling blue portal floating above the cobblestones on the left, Haussmann buildings,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### donjon

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, ancient underground catacombs beneath Paris twisted by magic, stone corridors, glowing blue crystals in the walls, dim cold light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### chapelle

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, a half-flooded gothic chapel deep underground, black water covering the floor, a giant handless clock above the altar on the left, empty bronze-masked armor statues along the walls, cold blue glow,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### ville_figee

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, an empty frozen Paris boulevard under a blank white sky, all street clocks showing midnight, drifting grey ash, eerie silence,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### defaut

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Environment background, Paris rooftops at night with a faint blue portal glow on the horizon, quiet and neutral,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

## Couverture (3/4, sujet centré)

À enregistrer sous `cover.webp`, à la racine du scénario.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, dark urban palette, deep navy and charcoal, cold blue magical glow, sparse violet accents.
Key art for an interactive story: a lone hooded hunter seen from behind, standing before a huge swirling blue portal in a dark Paris street, faint glowing interface panel floating beside them,
strong central composition, subject centered vertically and horizontally,
atmospheric, no text, no title, vertical 3:4 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, title, logo.
```
