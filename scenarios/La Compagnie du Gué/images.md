# Prompts d'images — La Compagnie du Gué

Fichier ignoré par l'application. Chaque prompt est **complet** : le style, la description, le cadrage et les éléments à éviter sont dans un seul bloc, à copier d'un coup (sur GitHub, bouton de copie en haut à droite du bloc) et à coller tel quel dans ChatGPT ou Gemini. Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif.

Si le générateur accepte une image en entrée (ChatGPT, Gemini, Midjourney avec `--sref`), joindre une image dont le style plaît (un personnage d'un autre scénario, par exemple) et ajouter en tête du prompt : `Match the art style, rendering and lighting of the attached image, but draw a different character:`. C'est le moyen le plus sûr d'obtenir ce style, plus qu'une description. Sans image, Gemini dérive vers un style d'illustration de jeu occidental.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents
```

Codes des expressions : `<personnage>_<expression>` (`berthe_joie`, `fenouil_surprise`, `anselme_neutre`…). Fenouil porte un gilet vert : sa planche se fait sur fond magenta.

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00), magenta (#FF00FF) pour Fenouil. Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite, les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur ;
3. la découper avec la commande donnée sous le prompt : l'outil retire le fond, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite ;
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

### Berthe

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine laugh, softened eyes; (3) surprised, eyebrows raised, lips parted.
A 40-year-old very tall and broad woman, former blacksmith, muscular arms, blond braid coiled on her head, gentle face, chainmail patched with pink thread over a leather apron, a large blacksmith hammer hanging at her belt, sturdy boots,
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
node tools/planche.mjs planche-berthe.png "scenarios/La Compagnie du Gué/personnages/Berthe" berthe_neutre berthe_joie berthe_surprise
```

### Fenouil

Gilet vert : planche sur fond magenta (#FF00FF), que la découpe retire aussi.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine laugh, softened eyes; (3) surprised, eyebrows raised, lips parted.
A halfling man, about 1.1 metres tall, curly red hair, mischievous grin, oversized feathered hat, green waistcoat with many bulging pockets, short cloak, bare hairy feet,
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
body turned three-quarters toward the viewer, which keeps the shoulders narrow, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, each one fitting inside its own equal share of the image width,
both shoulders and upper arms of every figure entirely visible, with magenta background on both sides of them,
a wide magenta gap between figures and a magenta margin on the left and right edges of the image,
no figure touching or overlapping another,
isolated on a plain flat uniform bright magenta chroma-key background (#FF00FF), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format 3:2.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, magenta rim light, magenta reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-fenouil.png "scenarios/La Compagnie du Gué/personnages/Fenouil" fenouil_neutre fenouil_joie fenouil_surprise
```

### Anselme

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine laugh, softened eyes; (3) surprised, eyebrows raised, lips parted.
A 19-year-old thin young monk, crooked tonsure, brown hooded robe slightly too long, rope belt, a satchel of remedies across the body, a small prayer book in hand, earnest worried face, sandals,
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
node tools/planche.mjs planche-anselme.png "scenarios/La Compagnie du Gué/personnages/Anselme" anselme_neutre anselme_joie anselme_surprise
```

### Gontran

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine laugh, softened eyes; (3) surprised, eyebrows raised, lips parted.
A 55-year-old round rosy-cheeked merchant, waxed moustache, felt hat, fur-lined coat too warm for the season, a big ring of keys at his belt, polished shoes,
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
node tools/planche.mjs planche-gontran.png "scenarios/La Compagnie du Gué/personnages/Gontran" gontran_neutre gontran_joie gontran_surprise
```

### Isaure

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine laugh, softened eyes; (3) surprised, eyebrows raised, lips parted.
A 16-year-old girl, short brown hair roughly cut, bright clever eyes, stable boy clothes that look too clean, very straight noble posture, a hidden ring on a cord,
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
node tools/planche.mjs planche-isaure.png "scenarios/La Compagnie du Gué/personnages/Isaure" isaure_neutre isaure_joie isaure_surprise
```

### Rocaille

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine laugh, softened eyes; (3) surprised, eyebrows raised, lips parted.
A 70-year-old small wiry grandmother bandit leader, grey bun, wool shawl, clay pipe in her mouth, a crossbow taller than her slung on her back, sharp knowing eyes,
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
node tools/planche.mjs planche-rocaille.png "scenarios/La Compagnie du Gué/personnages/Rocaille" rocaille_neutre rocaille_joie rocaille_surprise
```

## Décors (16/9, sans personnage, tiers droit dégagé)

À enregistrer dans `decors/` sous le nom du titre, en WebP : `decors/auberge.webp`.

### auberge

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, courtyard of a cosy medieval riverside inn, timber frame building with a painted sign, two covered wagons and wooden crates on the left, morning light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### route

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, a dirt road winding through rolling green borderland hills, a milestone on the left, distant castles on both horizons, sunny afternoon,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### bac

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, a wide fast river with a wooden ferry raft tied to a rope crossing, a ferryman hut on the left bank, reeds, bright day,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### peage

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, a small shabby castle gatehouse with a toll barrier across the road, faded banners, a wooden toll booth on the left, afternoon,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### foret

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, a narrow road through a dense old forest, mossy trunks, a fallen tree across the path on the left, shafts of sunlight,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### col

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, a mountain pass road with switchbacks along a cliff edge, scattered rocks and scree on the left, a small shepherd hut, white city towers far away, clear sky,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### campement

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, a roadside camp at dusk, a crackling campfire, two wagons and tethered horses on the left, first stars, warm firelight,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### hautcastel

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, the bright courtyard of a white medieval palace on a hill, banners, flower beds, a grand staircase on the left, festive afternoon,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### defaut

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Environment background, open medieval countryside road at golden hour, fields and a lone tree,
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
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, bright adventurous medieval palette, golden daylight, meadow greens, warm ochre roads, cheerful saturated accents.
Key art for an interactive story: a small band of four mercenaries escorting a covered wagon across a sunny borderland road,
a towering blacksmith woman, a halfling with a feathered hat, a young monk struggling on his horse, a leader in front,
a huge round cheese visible in the wagon, white castle towers in the distance,
strong central composition, subject centered vertically and horizontally,
cheerful adventurous atmosphere, no text, no title, vertical 3:4 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, title, logo.
```
