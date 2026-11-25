# Prompts d'images — Guilde des Bras Cassés

Fichier ignoré par l'application. Chaque prompt est **complet** : le style, la description, le cadrage et les éléments à éviter sont dans un seul bloc, à copier d'un coup (sur GitHub, bouton de copie en haut à droite du bloc) et à coller tel quel dans ChatGPT ou Gemini. Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif.

Si le générateur accepte une image en entrée (ChatGPT, Gemini, Midjourney avec `--sref`), joindre une image dont le style plaît (un personnage d'un autre scénario, par exemple) et ajouter en tête du prompt : `Match the art style, rendering and lighting of the attached image, but draw a different character:`. C'est le moyen le plus sûr d'obtenir ce style, plus qu'une description. Sans image, Gemini dérive vers un style d'illustration de jeu occidental.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy
```

Les images actuelles sont des cartes encadrées en buste, sur un décor : elles s'affichent seules, sans décor derrière. Les planches ci-dessous les remplacent par des personnages en buste, détourés, sous les mêmes noms de fichiers (donc les mêmes codes, que les histoires déjà jouées utilisent).

## Personnages (planches en buste, puis découpe)

Les expressions d'un personnage se génèrent côte à côte sur une planche : même visage, même tenue, même lumière. Trois expressions au plus par planche en 3:2 (1536 × 1024), quatre en 2:1 (2048 × 1024) ; au-delà, une deuxième planche avec la première en image de référence. Fond vert d'incrustation uni (#00FF00), magenta (#FF00FF) pour un personnage qui porte du vert. Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite, les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur ;
3. la découper avec la commande donnée sous le prompt : l'outil retire le fond, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite (les noms existants, pour garder les codes) ;
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

### Brunot

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) big joyful grin, bright eyes; (3) surprised, eyebrows raised, mouth open.
A 35-year-old skinny wizard, crooked round glasses, sparse beard, messy hair, oversized dark mage robe covered in scorch marks, a heavy spellbook clutched to his chest,
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
node tools/planche.mjs planche-brunot.png "scenarios/La guilde des bras casses/personnages/brunot" bruno_neutre bruno_joie bruno_surprise
```

### Brunot (suite)

Joindre la première planche de Brunot (ou une de ses images découpées) au générateur : le prompt commence par demander de la prendre pour référence, ce qui garde le même visage et la même tenue.

```
Use the attached expression sheet as the reference for this character: same face, hairstyle, outfit, colors and art style, only new expressions and poses.
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 2 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) embarrassed awkward smile, blushing, looking aside; (2) frightened, wide eyes, shoulders hunched.
A 35-year-old skinny wizard, crooked round glasses, sparse beard, messy hair, oversized dark mage robe covered in scorch marks, a heavy spellbook clutched to his chest,
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
node tools/planche.mjs planche-brunot-2.png "scenarios/La guilde des bras casses/personnages/brunot" bruno_gene bruno_peur
```

### Maëlys

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) big joyful grin, bright eyes; (3) surprised, eyebrows raised, mouth open.
A 28-year-old tall woman paladin, red hair tied back, dented patched plate armor, a cape slightly too short, a sword at her hip, heroic posture,
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
node tools/planche.mjs planche-maelys.png "scenarios/La guilde des bras casses/personnages/maelys" maelys_neutre maelys_joie maelys_surprise
```

### Maëlys (suite)

Joindre la première planche de Maëlys (ou une de ses images découpées) au générateur : le prompt commence par demander de la prendre pour référence, ce qui garde le même visage et la même tenue.

```
Use the attached expression sheet as the reference for this character: same face, hairstyle, outfit, colors and art style, only new expressions and poses.
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 2 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) angry, furrowed brows, clenched jaw; (2) embarrassed awkward smile, blushing, looking aside.
A 28-year-old tall woman paladin, red hair tied back, dented patched plate armor, a cape slightly too short, a sword at her hip, heroic posture,
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
node tools/planche.mjs planche-maelys-2.png "scenarios/La guilde des bras casses/personnages/maelys" maelys_colere maelys_gene
```

### Pimprenelle

Fond magenta : sa capuche est verte.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) big joyful grin, bright eyes; (3) surprised, eyebrows raised, mouth open.
A 24-year-old petite young woman thief, short spiky black hair, green hood, daggers and many pockets on her belt, light leather clothes, sly half-smile,
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
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, magenta rim light, magenta reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-pimprenelle.png "scenarios/La guilde des bras casses/personnages/pimprenelle" pimprenelle_neutre pimprenelle_joie pimprenelle_surprise
```

### Pimprenelle (suite)

Joindre la première planche de Pimprenelle (ou une de ses images découpées) au générateur : le prompt commence par demander de la prendre pour référence, ce qui garde le même visage et la même tenue.

```
Use the attached expression sheet as the reference for this character: same face, hairstyle, outfit, colors and art style, only new expressions and poses.
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 2 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) angry, furrowed brows, clenched jaw; (2) embarrassed awkward smile, blushing, looking aside.
A 24-year-old petite young woman thief, short spiky black hair, green hood, daggers and many pockets on her belt, light leather clothes, sly half-smile,
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
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, magenta rim light, magenta reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-pimprenelle-2.png "scenarios/La guilde des bras casses/personnages/pimprenelle" pimprenelle_colere pimprenelle_gene
```

### Grumble

Fond magenta : ses écailles sont vertes. Quatre expressions sur une planche 2:1 (2048 × 1024) ; dragon assis, entier de la tête à la queue.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy.
Character expression sheet: the same character shown 4 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) big joyful grin, bright eyes; (3) surprised, eyebrows raised, mouth open; (4) sad, drooping eyes, lowered head.
A baby dragon the size of a large cat, dull green scales, tiny wings, red runny nose, big curious eyes, sitting upright,
every figure fully visible from head to tail,
body turned three-quarters toward the viewer, which keeps the shoulders narrow, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, each one fitting inside its own equal share of the image width,
both shoulders and upper arms of every figure entirely visible, with magenta background on both sides of them,
a wide magenta gap between figures and a magenta margin on the left and right edges of the image,
no figure touching or overlapping another,
isolated on a plain flat uniform bright magenta chroma-key background (#FF00FF), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format 2:1.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, magenta rim light, magenta reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-grumble.png "scenarios/La guilde des bras casses/personnages/grumble" grumble_neutre grumble_joie grumble_surprise grumble_triste
```
