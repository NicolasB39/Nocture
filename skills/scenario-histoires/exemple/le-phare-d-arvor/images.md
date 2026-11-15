# Prompts d'images — Le Phare d'Arvor

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style. Gabarits complets : `reference/images.md` du skill.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
muted cold palette, slate blue and grey, warm lamplight accents
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (fond vert uni, puis détourage ; PNG ou WebP transparent, vertical 2:3)

Maren — une herboriste bretonne de soixante ans :

```
[STYLE]. Waist-up portrait of a 60-year-old Breton herbalist woman, short and sturdy,
grey hair tied back, sap-stained hands, thick wool cardigan over a dark work dress,
canvas apron with pockets, rubber boots,
facing the viewer at a slight three-quarter angle, [EXPRESSION], strong readable facial expression,
cut at the waist by the bottom edge of the image, head near the top with a small margin, centered horizontally with a margin on the left and right,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

Ozenn — le gardien du port :

```
[STYLE]. Waist-up portrait of a 60-year-old Breton harbour keeper, tall with sagging shoulders,
weathered face, short grey beard, faded blue fisherman's smock he wears in every season, dark trousers,
heavy work boots,
facing the viewer at a slight three-quarter angle, [EXPRESSION], strong readable facial expression,
cut at the waist by the bottom edge of the image, head near the top with a small margin, centered horizontally with a margin on the left and right,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `sourire` | warm, genuine smile, softened eyes |
| `ferme` | closed, guarded expression, jaw set, eyes narrowed |
| `colere` | restrained anger, furrowed brows, tense mouth |

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, multiple characters`

## Décors (16/9, sans personnage, tiers droit dégagé)

Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

- `phare` : `[STYLE]. Environment background, the watch room at the top of an old granite lighthouse in Brittany, brass instruments, logbook on a wooden desk, curved windows overlooking the sea, November dusk, overcast sky, last light on the water, [PARTIE COMMUNE]`
- `port` : `[STYLE]. Environment background, a small Breton fishing harbour, granite quay, moored wooden boats, a modest café with a lit window on the left, November afternoon, low grey sky, wet stones, [PARTIE COMMUNE]`
- `digue` : `[STYLE]. Environment background, a narrow stone causeway crossing wet sand and seaweed at low tide toward a rocky point, distant lighthouse on the left, November, wind, pale cold light, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, the Breton coast in November, granite rocks and grey sea under a low sky, quiet and neutral, [PARTIE COMMUNE]`

Négatif en plus : `people, person, character, figure, silhouette, crowd`

## Couverture (3/4, sujet centré)

```
[STYLE]. Key art for an interactive story: an old granite lighthouse on a rocky point at dusk,
its light just switching on, black reef rocks in the sea, strong central composition,
subject centered vertically and horizontally, atmospheric, no text, no title, vertical 3:4 format.
```
