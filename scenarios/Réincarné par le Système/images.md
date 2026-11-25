# Prompts d'images — Réincarné par le Système

Fichier ignoré par l'application. Chaque prompt est **complet** : le style, la description, le cadrage et les éléments à éviter sont dans un seul bloc, à copier d'un coup (sur GitHub, bouton de copie en haut à droite du bloc) et à coller tel quel dans ChatGPT ou Gemini. Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif.

Si le générateur accepte une image en entrée (ChatGPT, Gemini, Midjourney avec `--sref`), joindre une image dont le style plaît (un personnage d'un autre scénario, par exemple) et ajouter en tête du prompt : `Match the art style, rendering and lighting of the attached image, but draw a different character:`. C'est le moyen le plus sûr d'obtenir ce style, plus qu'une description. Sans image, Gemini dérive vers un style d'illustration de jeu occidental.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents
```

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite (rien de coupé par les bords), les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
3. la découper avec la commande donnée sous le prompt : l'outil retire le fond vert, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite ;
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Deimos n'a pas d'image : voix intérieure, et dragon trop grand pour un portrait.

### Misa

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A young adult woman, 163 cm, long blonde hair, green eyes, long red cape, brown trousers, black boots,
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
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-misa.png "scenarios/Réincarné par le Système/personnages/Misa" misa_neutre misa_sourire misa_ferme
```

### Jasmine

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A young adult woman, 173 cm, lean agile build, medium-length black hair with bangs, red eyes, fitted discreet all-black outfit,
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
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-jasmine.png "scenarios/Réincarné par le Système/personnages/Jasmine" jasmine_neutre jasmine_sourire jasmine_ferme
```

### Amane

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A young adult woman, 160 cm, long red hair with bangs, blue eyes, black witch cape and black witch hat, black trousers, white shirt underneath,
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
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-amane.png "scenarios/Réincarné par le Système/personnages/Amane" amane_neutre amane_sourire amane_ferme
```

### Biro

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A young adult man, 185 cm, tall and strongly built, short brown hair, blue eyes, white tank top, black trousers,
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
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-biro.png "scenarios/Réincarné par le Système/personnages/Biro" biro_neutre biro_sourire biro_ferme
```

## Décors (16/9, sans personnage, tiers droit dégagé)

À enregistrer dans `decors/` sous le nom du titre, en WebP : `decors/vallee.webp`. Chaque décor a aussi son `decors/<nom>.md` avec ses mots-clés (rappelés sous chaque titre) ; créez le `.md` en même temps que l'image (un `.md` sans image est ignoré).

### vallee

Mots-clés : vallée, plaine, campement

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, a wide green valley between steep hills, grass and scattered boulders, a dirt track winding into the distance, clear morning,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### route

Mots-clés : route, chemin, sentier, calèche

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, a dirt road crossing open countryside, low stone walls, a few trees, afternoon,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### ville

Mots-clés : ville, ville marchande, marché, rue, place, château

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, a busy fantasy merchant town street, timber and stone houses, market stalls on the left, a large castle on a hill in the distance, sunny day,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### guilde

Mots-clés : guilde, hall de la guilde, comptoir, salle des quêtes

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, the main hall of an adventurers' guild, wooden counter, quest board covered with papers on the left, stone floor, warm lamplight,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### auberge

Mots-clés : auberge, taverne, salle commune, chambre

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, the common room of a cozy fantasy inn, long wooden tables, stone fireplace on the left, hanging lanterns, evening,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### ruines

Mots-clés : ruines, ruine*, donjon, caverne

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, ancient overgrown stone ruins with broken arches, faint glowing runes on the left, dusk light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### defaut

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Environment background, fantasy countryside with hills and a distant forest under a soft sky, quiet and neutral,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

## Couverture (3/4, sujet centré)

À enregistrer sous `cover.webp`, à la racine du scénario (600 × 800).

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, vivid adventure fantasy palette, warm golden daylight, deep blue skies, rich greens, glowing magical accents.
Key art for an interactive story: a lone figure seen from behind standing in a vast green valley at dawn,
glowing runes floating in the air, a castle town far away, a huge dragon silhouette in the clouds,
strong central composition, subject centered vertically and horizontally,
atmospheric, no text, no title, vertical 3:4 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, title, logo.
```
