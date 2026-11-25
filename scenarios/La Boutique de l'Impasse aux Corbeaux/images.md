# Prompts d'images — La Boutique de l'Impasse aux Corbeaux

Fichier ignoré par l'application. Chaque prompt est **complet** : le style, la description, le cadrage et les éléments à éviter sont dans un seul bloc, à copier d'un coup (sur GitHub, bouton de copie en haut à droite du bloc) et à coller tel quel dans ChatGPT ou Gemini. Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif.

Si le générateur accepte une image en entrée (ChatGPT, Gemini, Midjourney avec `--sref`), joindre une image dont le style plaît (un personnage d'un autre scénario, par exemple) et ajouter en tête du prompt : `Match the art style, rendering and lighting of the attached image, but draw a different character:`. C'est le moyen le plus sûr d'obtenir ce style, plus qu'une description. Sans image, Gemini dérive vers un style d'illustration de jeu occidental.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth
```

Codes des expressions : `<personnage>_<expression>` (`corvin_neutre`, `aelis_sourire`, `gaudry_ferme`…). Brindille, la chatte, a sa propre planche, entière et assise.

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite, les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur ;
3. la découper avec la commande donnée sous le prompt : l'outil retire le fond, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite ;
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

### Corvin

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A 65-year-old tall thin medieval antique dealer, short trimmed white beard, round silver-rimmed spectacles, long burgundy waistcoat over a cream linen shirt, dark breeches, polished buckled shoes, a brass magnifying glass hanging on a cord around his neck,
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
node tools/planche.mjs planche-corvin.png "scenarios/La Boutique de l'Impasse aux Corbeaux/personnages/Corvin" corvin_neutre corvin_sourire corvin_ferme
```

### Aelis

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A 19-year-old short plump young woman, freckles, chestnut hair in a tight braid, plain grey novice robe of a temple with a rope belt, muddy wooden clogs, a leather satchel stuffed with papers across her body,
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
node tools/planche.mjs planche-aelis.png "scenarios/La Boutique de l'Impasse aux Corbeaux/personnages/Aelis" aelis_neutre aelis_sourire aelis_ferme
```

### Gaudry

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A 40-year-old round clean-shaven man, red hair slicked down, blue and gold medieval merchant guild livery, polished black waxed-leather gloves, a thick ledger held under one arm,
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
node tools/planche.mjs planche-gaudry.png "scenarios/La Boutique de l'Impasse aux Corbeaux/personnages/Gaudry" gaudry_neutre gaudry_sourire gaudry_ferme
```

### Vauquelin

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A 55-year-old broad-shouldered powerful man, short silver hair, strong jaw, long midnight-blue velvet coat with fur collar, gold signet ring engraved with a ship, rich leather boots,
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
node tools/planche.mjs planche-vauquelin.png "scenarios/La Boutique de l'Impasse aux Corbeaux/personnages/Vauquelin" vauquelin_neutre vauquelin_sourire vauquelin_ferme
```

### Ysolde

Ysolde n'apparaît que dans les échos : une seule image suffit, `ysolde_neutre` ; les deux autres sont facultatives.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: (1) calm neutral expression; (2) warm, genuine smile, softened eyes; (3) closed, guarded expression, jaw set, eyes narrowed.
A 78-year-old small wiry old woman, white bun held by a pencil, spectacles pushed up on her forehead, scorched leather work apron over a dark wool dress, sleeves rolled up, sharp amused eyes,
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
node tools/planche.mjs planche-ysolde.png "scenarios/La Boutique de l'Impasse aux Corbeaux/personnages/Ysolde" ysolde_neutre ysolde_sourire ysolde_ferme
```

### Brindille

La chatte : une planche à elle, chaque silhouette entière et assise.

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Character expression sheet: the same thin grey cat shown 3 times side by side in a single row,
rough fur, a notched left ear and amber eyes, identical lighting, a different posture for each mood (head, ears, tail),
from left to right: (1) calm, unblinking stare; (2) eyes half-closed, relaxed, content; (3) ears flattened, tail puffed, wary.
Sitting upright, facing the viewer at a slight three-quarter angle,
every animal fully visible from ears to tail, evenly spaced with a wide empty gap between them,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, soft even lighting from the left, wide horizontal format 3:2.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, background scenery, ground, cast shadow, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, panel borders, captions, labels, grid lines, panels.
```

Découpe :

```
node tools/planche.mjs planche-brindille.png "scenarios/La Boutique de l'Impasse aux Corbeaux/personnages/Brindille" brindille_neutre brindille_contente brindille_mefiante
```

## Décors (16/9, sans personnage, tiers droit dégagé)

À enregistrer dans `decors/` sous le nom du titre, en WebP : `decors/echoppe.webp`.

### echoppe

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, interior of a small medieval repair shop, a long scarred wooden workbench with tools on the left, shelves of stopped clocks and wrapped objects, a narrow wooden staircase at the back, a closed back door, soft afternoon light through a small window,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### arriere-boutique

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, a windowless medieval storeroom, tall wooden shelves of objects wrapped in grey cloth with paper labels, one empty shelf space in the middle, a single candle on a stool, dust in the air,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### impasse

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, a narrow medieval cobbled dead-end alley under a low stone archway, four half-timbered houses, a repair shop with blue shutters at the far end, an old linden tree with crows' nests, puddles with red and blue dye streaks, light drizzle, late afternoon,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### marche

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, a medieval market square under patched canvas awnings, stalls of amulets, potion bottles and trinkets, a stone well on the left, morning light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### quais

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, medieval river harbour quays, wooden cargo ships moored on the left, barrels and crates, wide estuary in the distance, evening mist rising from the water,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### temple

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, interior of a quiet medieval temple, pale stone pillars, rows of candles, a tall tower window with a glowing lantern far above, a raised wooden judges' bench on the left,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### guilde

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, grand hall of a medieval merchants' guild, dark wood panelling, a long counting table with scales and ledgers on the left, blue and gold banners with a ship emblem, tall windows,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### antiquaire

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, cluttered medieval antique shop, old furniture, globes, paintings and suits of armour on the left, a tea set on a small table, warm lamplight,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd, animals in the foreground.
```

### defaut

```
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Environment background, a medieval port town street at dusk, half-timbered houses, mist rolling from the river, warm windows,
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
high-quality Japanese anime illustration, modern anime game key visual, semi-realistic anime proportions, beautiful detailed face, large detailed anime eyes with bright reflections and colored irises, fine delicate lineart, rich painterly shading with smooth gradients, glossy highlights on hair, soft rim light, cinematic lighting, warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth.
Key art for an interactive story: the blue-shuttered repair shop at the end of a misty medieval alley,
warm light in the window, a thin grey cat sitting on the doorstep, crows on the hanging sign,
a young woman seen from behind holding an old key,
strong central composition, subject centered vertically and horizontally,
atmospheric, no text, no title, vertical 3:4 format.
Avoid: chibi, flat cel shading, western cartoon, western fantasy game art, pixel art, thick outlines, flat colors, photorealistic, 3d render, text, watermark, signature, frame, border, title, logo.
```
