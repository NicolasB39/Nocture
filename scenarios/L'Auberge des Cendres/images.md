# Prompts d'images — L'Auberge des Cendres

Fichier ignoré par l'application. Chaque prompt est **complet** : le style, la description, le cadrage et les éléments à éviter sont dans un seul bloc, à copier d'un coup (sur GitHub, bouton de copie en haut à droite du bloc) et à coller tel quel dans ChatGPT ou Gemini. Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif.

Si le générateur accepte une image en entrée (ChatGPT, Gemini, Midjourney avec `--sref`), joindre une image dont le style plaît (un personnage d'un autre scénario, par exemple) et ajouter en tête du prompt : `Match the art style, rendering and lighting of the attached image, but draw a different character:`. C'est le moyen le plus sûr d'obtenir ce style, plus qu'une description. Sans image, Gemini dérive vers un style d'illustration de jeu occidental.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows
```

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite, les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur ;
3. la découper avec la commande donnée sous le prompt : l'outil retire le fond vert, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite ;
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

### Ysolde

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, proud smug grin, chin raised, eyes half closed with confidence, sulking pout, cheeks puffed, arms crossed, looking away.
A 19-year-old petite mage girl, messy short red hair, slightly singed eyebrows, oversized pointed witch hat with a scorched brim, black and purple mage robe, gnarled wooden staff topped with a red crystal held close to her body,
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
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-ysolde.png "scenarios/L'Auberge des Cendres/personnages/Ysolde" ysolde_neutre ysolde_sourire ysolde_ferme
```

### Pervenche

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, warm serene smile, hands joined in front of her chest, firm disapproving look, lips pressed, one hand raised as if to stop someone.
A 25-year-old tall gentle priestess, long blond braid over one shoulder, round cheeks, white and blue priestess robe with beer stains, water-drop pendant, a tavern apron tied over the robe,
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
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-pervenche.png "scenarios/L'Auberge des Cendres/personnages/Pervenche" pervenche_neutre pervenche_sourire pervenche_ferme
```

### Brokk

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, polite little bow, one gauntlet on his chest, head tilted kindly, solemn battle stance, shoulders squared, gauntlet gripping the sword hilt at his side.
A huge knight more than two metres tall in dented black full plate armour, closed great helm with a narrow visor slit, the face never visible, round shield strapped on his back, a tavern towel hanging from his belt,
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
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-brokk.png "scenarios/L'Auberge des Cendres/personnages/Brokk" brokk_neutre brokk_sourire brokk_ferme
```

### Gaudine

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, sweet grandmotherly smile, eyes creased with kindness, cold businesslike stare over her glasses, tapping the ledger with one finger.
A very old female dwarf, short and broad-shouldered with sturdy arms, wrinkled kind face, long white braids tied with copper rings, small round glasses on the tip of her nose, red wool shawl over a dark dress, a thick leather-bound ledger held against her chest,
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
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-gaudine.png "scenarios/L'Auberge des Cendres/personnages/Gaudine" gaudine_neutre gaudine_sourire gaudine_ferme
```

### Fenouil

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, cheeky grin, winking, thumb up, worried frown, biting her pencil, shoulders hunched.
A female elf carpenter who looks 30 years old, an adult woman, tall and wiry, small tool scars on her forearms, long pointed elf ears sticking out from under a cap worn askew, freckles, auburn hair tied up in a messy bun, a pencil behind each ear, rolled-up shirt sleeves, well-stocked tool belt, small slate tablet held in one hand,
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
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-fenouil.png "scenarios/L'Auberge des Cendres/personnages/Fenouil" fenouil_neutre fenouil_sourire fenouil_ferme
```

### Corvin

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, oily condescending smile, hands rubbing together, cold contemptuous sneer, eyes narrowed, chin raised.
A tall slender ageless male elf innkeeper, long silver hair in a low ponytail, long pointed ears with gold rings, refined haughty face, golden brocade waistcoat over a white silk shirt, rings on every finger,
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
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-corvin.png "scenarios/L'Auberge des Cendres/personnages/Corvin" corvin_neutre corvin_sourire corvin_ferme
```

## Décors (16/9, sans personnage, tiers droit dégagé)

À enregistrer dans `decors/` sous le nom du titre, en WebP : `decors/cuisine.webp`.

### ruines

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, the burnt ruins of a small medieval village inn, charred beams, a half-collapsed stone chimney still standing, a tarp stretched as a makeshift shelter, ashes on the floor, morning after the fire, thin smoke, pale autumn light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### salle_commune

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, the common room of a medieval village inn being rebuilt, fresh pale wood beams beside old blackened ones, long wooden tables and benches, a bar counter with barrels on the left, warm hearth light in the evening,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### cuisine

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, the kitchen of a medieval inn, big stone hearth with a hanging cauldron, copper pots, strings of onions and herbs, a flour-covered wooden table, warm firelight,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### cave

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, a vaulted stone cellar under an inn, wine and beer barrels, rubble piled in a corner, at the back a section of newer bricked-up wall, a single lantern, cold blue shadows,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### grand_place

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, the small main square of a medieval village, a wooden quest board under a little roof covered with paper notices on the left, a stone well in the center, half-timbered houses, autumn morning,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### foret

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, a deep ancient forest, very tall trees, cold mist between the trunks, a narrow path, pale ghostly oak trees with white bark, autumn leaves, dim light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### sanglier_dore

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, the luxurious common room of a rival inn, gilded wooden decor, a stuffed golden boar head above a big fireplace on the left, red velvet benches, polished tables, evening,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### defaut

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Environment background, a quiet medieval village at the edge of a misty forest, thatched and half-timbered houses, a dirt road leading to a mountain pass, autumn, soft neutral light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

## Monstres (scène complète en 16/9, avec fond)

À enregistrer dans `monstres/` sous le nom du titre : `monstres/loup.webp` donne le code `monstre_loup`. Les combats sont sérieux : les monstres font peur, pas rire.

### loup

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Monster illustration: a pack leader grey wolf, lean and scarred, yellow eyes, lips pulled back over its fangs, low to the ground, about to lunge, in a misty forest path at dusk,
the monster large and fully visible in the center of the frame,
dramatic lighting, strong silhouette readable on a phone screen, tense and threatening mood, not cute, not comical,
no people, no humans, no text, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, humans, cute, cartoonish, comical.
```

### sanglier_cendre

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Monster illustration: a monstrous boar the size of an ox, charred black hide cracked with glowing embers, smoke rising from its back, huge tusks, charging, in a trampled wheat field at the edge of a forest at dusk,
the monster large and fully visible in the center of the frame,
dramatic lighting, strong silhouette readable on a phone screen, tense and threatening mood, not cute, not comical,
no people, no humans, no text, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, humans, cute, cartoonish, comical.
```

### ronces

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Monster illustration: a mass of living thorny brambles rising like a coiled serpent, thick vines with long black thorns, reaching out, in around a pale ghost oak tree in a dark misty forest,
the monster large and fully visible in the center of the frame,
dramatic lighting, strong silhouette readable on a phone screen, tense and threatening mood, not cute, not comical,
no people, no humans, no text, widescreen cinematic 16:9 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, humans, cute, cartoonish, comical.
```

## Couverture (3/4, sujet centré)

À enregistrer sous `cover.webp`, à la racine du scénario.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm cosy atmosphere, warm autumn palette, honey and amber tones, soft hearth light, cool blue-grey shadows.
Key art for an interactive story: a small half-rebuilt medieval village inn at dusk, fresh pale beams beside charred black ones,
warm light in the windows, a wooden sign without letters, smoke from a new chimney, misty forest behind,
strong central composition, subject centered vertically and horizontally,
atmospheric, cosy and hopeful, no text, no title, vertical 3:4 format.
Avoid: chibi, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, title, logo, letters.
```
