# Prompts d'images — Le Phare d'Arvor

Fichier ignoré par l'application. Chaque prompt est complet : à copier d'un bloc et à coller tel quel dans le générateur (ChatGPT, Gemini). Pour Midjourney ou Stable Diffusion, déplacer la ligne « Avoid: » dans `--no` ou dans le champ négatif. Gabarits : `reference/images.md` du skill.

Bloc de style, en tête de chaque prompt (rappelé pour en écrire de nouveaux) :

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents
```

## Personnages (une planche par personnage, fond vert, puis découpe)

### Maren

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, warm genuine smile with softened eyes, closed guarded expression with jaw set, eyes narrowed.
A 60-year-old Breton herbalist woman, short and sturdy, grey hair tied back, sap-stained hands, thick wool cardigan over a dark work dress, canvas apron with pockets,
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
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node scripts/decouper.mjs planche-maren.png "scenarios/Le Phare d'Arvor/personnages/Maren" neutre sourire ferme
```

### Ozenn

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, closed guarded expression, arms crossed, eyes narrowed, restrained anger, furrowed brows, tense mouth.
A 60-year-old Breton harbour keeper, tall with sagging shoulders, weathered face, short grey beard, faded blue fisherman's smock he wears in every season, dark trousers,
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
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, full body, legs, cropped head, captions, labels, grid lines, panels.
```

Découpe :

```
node scripts/decouper.mjs planche-ozenn.png "scenarios/Le Phare d'Arvor/personnages/Ozenn" neutre ferme colere
```

## Décors (16/9, sans personnage, tiers droit dégagé)

À enregistrer dans `decors/` sous le nom du titre, en WebP.

### phare

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Environment background, the watch room at the top of an old granite lighthouse in Brittany, brass instruments, logbook on a wooden desk, curved windows overlooking the sea, November dusk, overcast sky, last light on the water,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd.
```

### port

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Environment background, a small Breton fishing harbour, granite quay, moored wooden boats, a modest café with a lit window on the left, November afternoon, low grey sky, wet stones,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd.
```

### digue

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Environment background, a narrow stone causeway crossing wet sand and seaweed at low tide toward a rocky point, distant lighthouse on the left, November, wind, pale cold light,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd.
```

### defaut

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Environment background, the Breton coast in November, granite rocks and grey sea under a low sky, quiet and neutral,
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, people, person, character, figure, silhouette, crowd.
```

## Couverture (3/4, sujet centré)

À enregistrer sous `cover.webp`.

```
realistic anime style, contemporary Japanese animation feature film, stylized faces, believable anatomy, realistic materials and lighting, soft painterly shading, muted cold palette, slate blue and grey, warm lamplight accents.
Key art for an interactive story: an old granite lighthouse on a rocky point at dusk,
its light just switching on, black reef rocks in the sea, strong central composition,
subject centered vertically and horizontally, atmospheric, no text, no title, vertical 3:4 format.
Avoid: chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, title, logo.
```
