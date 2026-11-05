# Prompts d'images — La Boutique de l'Impasse aux Corbeaux

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour générer les images puis les régénérer dans le même style.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
warm muted medieval palette, ochre, rust and weathered wood, indigo dye accents, candlelight warmth
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

Négatif en plus : `background scenery, ground, cast shadow, cropped head, cropped feet, multiple characters`

- `Corvin` : `[STYLE]. Full-body portrait of a 65-year-old tall thin medieval antique dealer, short trimmed white beard, round silver-rimmed spectacles, long burgundy waistcoat over a cream linen shirt, dark breeches, polished buckled shoes, a brass magnifying glass hanging on a cord around his neck, [PARTIE COMMUNE]`
- `Aelis` : `[STYLE]. Full-body portrait of a 19-year-old short plump young woman, freckles, chestnut hair in a tight braid, plain grey novice robe of a temple with a rope belt, muddy wooden clogs, a leather satchel stuffed with papers across her body, [PARTIE COMMUNE]`
- `Gaudry` : `[STYLE]. Full-body portrait of a 40-year-old round clean-shaven man, red hair slicked down, blue and gold medieval merchant guild livery, polished black waxed-leather gloves, a thick ledger held under one arm, [PARTIE COMMUNE]`
- `Vauquelin` : `[STYLE]. Full-body portrait of a 55-year-old broad-shouldered powerful man, short silver hair, strong jaw, long midnight-blue velvet coat with fur collar, gold signet ring engraved with a ship, rich leather boots, [PARTIE COMMUNE]`
- `Ysolde` : `[STYLE]. Full-body portrait of a 78-year-old small wiry old woman, white bun held by a pencil, spectacles pushed up on her forehead, scorched leather work apron over a dark wool dress, sleeves rolled up, sharp amused eyes, [PARTIE COMMUNE]` (pour les échos ; une seule image suffit)

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm neutral expression |
| `sourire` | warm, genuine smile, softened eyes |
| `ferme` | closed, guarded expression, jaw set, eyes narrowed |

Codes obtenus : `corvin_neutre`, `aelis_sourire`, `gaudry_ferme`, etc.

### Brindille (la chatte)

```
[STYLE]. Full-body portrait of a thin grey cat with rough fur, a notched left ear and amber eyes,
sitting upright, facing the viewer at a slight three-quarter angle, [EXPRESSION],
entire animal visible from ears to tail, centered in the frame with a small margin on every side,
isolated on a plain flat uniform light grey background, no floor, no cast shadow, no props,
soft even lighting from the left, vertical 2:3 format.
```

| Fichier | `[EXPRESSION]` |
|---|---|
| `neutre` | calm, unblinking stare |
| `contente` | eyes half-closed, relaxed, content |
| `mefiante` | ears flattened, tail puffed, wary |

## Décors (16/9, sans personnage, tiers droit dégagé)

Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

Négatif en plus : `people, person, character, figure, silhouette, crowd, animals in the foreground`

- `echoppe` : `[STYLE]. Environment background, interior of a small medieval repair shop, a long scarred wooden workbench with tools on the left, shelves of stopped clocks and wrapped objects, a narrow wooden staircase at the back, a closed back door, soft afternoon light through a small window, [PARTIE COMMUNE]`
- `arriere-boutique` : `[STYLE]. Environment background, a windowless medieval storeroom, tall wooden shelves of objects wrapped in grey cloth with paper labels, one empty shelf space in the middle, a single candle on a stool, dust in the air, [PARTIE COMMUNE]`
- `impasse` : `[STYLE]. Environment background, a narrow medieval cobbled dead-end alley under a low stone archway, four half-timbered houses, a repair shop with blue shutters at the far end, an old linden tree with crows' nests, puddles with red and blue dye streaks, light drizzle, late afternoon, [PARTIE COMMUNE]`
- `marche` : `[STYLE]. Environment background, a medieval market square under patched canvas awnings, stalls of amulets, potion bottles and trinkets, a stone well on the left, morning light, [PARTIE COMMUNE]`
- `quais` : `[STYLE]. Environment background, medieval river harbour quays, wooden cargo ships moored on the left, barrels and crates, wide estuary in the distance, evening mist rising from the water, [PARTIE COMMUNE]`
- `temple` : `[STYLE]. Environment background, interior of a quiet medieval temple, pale stone pillars, rows of candles, a tall tower window with a glowing lantern far above, a raised wooden judges' bench on the left, [PARTIE COMMUNE]`
- `guilde` : `[STYLE]. Environment background, grand hall of a medieval merchants' guild, dark wood panelling, a long counting table with scales and ledgers on the left, blue and gold banners with a ship emblem, tall windows, [PARTIE COMMUNE]`
- `antiquaire` : `[STYLE]. Environment background, cluttered medieval antique shop, old furniture, globes, paintings and suits of armour on the left, a tea set on a small table, warm lamplight, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, a medieval port town street at dusk, half-timbered houses, mist rolling from the river, warm windows, [PARTIE COMMUNE]`

## Couverture (3/4, sujet centré, 600 × 800)

```
[STYLE]. Key art for an interactive story: the blue-shuttered repair shop at the end of a misty medieval alley,
warm light in the window, a thin grey cat sitting on the doorstep, crows on the hanging sign,
a young woman seen from behind holding an old key, strong central composition,
subject centered vertically and horizontally, atmospheric, no text, no title, vertical 3:4 format.
```
