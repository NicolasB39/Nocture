# Prompts d'images — Académie Lumencia

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style.

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
warm palette, gold, ivory stone, deep navy, burgundy accents, medieval fantasy academy
```

Négatif commun : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border, deformed hands, extra fingers, revealing outfit, nudity`

## Personnages

Une seule planche par personnage : ses trois expressions côte à côte, en une génération, pour garder le même visage et la même tenue. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite (rien de coupé par les bords), les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
3. la découper avec le script du skill, qui retire aussi le fond vert, les noms dans l'ordre de gauche à droite :
   `node skills/scenario-histoires/scripts/decouper.mjs planche-lilia.png "scenarios/Lumencia Academy/personnages/Lilia" lilia_neutre lilia_sourire lilia_ferme`
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Gabarit (`[BASE]` et les trois expressions de chaque personnage ci-dessous, dans l'ordre neutre, sourire, ferme) :

```
[STYLE]. Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: [NEUTRE], [SOURIRE], [FERME].
[BASE],
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

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, captions, labels, grid lines, panels`

Les personnages qui ont déjà une image `neutre` peuvent garder la leur : la planche se génère alors avec cette image en référence, et seules `sourire` et `ferme` en sont gardées.

Uniformes : Chevaliers blanc et bleu marine, épaulière de cuir clair · Magie blanc et bordeaux, cape courte · Théologie blanc et or.

### Département des Chevaliers

**Lilia** — `a 20-year-old young woman, long crimson-red hair in a high ponytail, golden eyes, white and navy knight academy uniform with a light leather pauldron, practice longsword at her hip, calloused hands`
- neutre : `calm focused neutral expression`
- sourire : `bright open honest smile, eyes sparkling, slightly flushed from training`
- ferme : `closed-off guarded expression, jaw set, eyes narrowed and hard`

**Isabel** — `a 20-year-old young woman, straight black hair, golden eyes, immaculate white and navy knight academy uniform with a fine gold-trimmed collar, courtly posture`
- neutre : `poised neutral expression, chin slightly raised, assessing gaze`
- sourire : `playful smug smile, one eyebrow raised, a childish glint in her eyes`
- ferme : `cold haughty expression, half-lidded eyes, looking down at the viewer`

**Anastasia** — `a 22-year-old tall young woman, black hair, crimson-red eyes, white and navy knight uniform with a Student Council armband and short cape, sword at her hip, imposing presence`
- neutre : `dignified composed neutral expression, steady commanding gaze`
- sourire : `small controlled smile, warm but calculating`
- ferme : `stern authoritative expression, hard unblinking eyes`

**Sera** — `a 20-year-old young woman, short messy brown hair, blue eyes, worn white and navy knight academy uniform with visible mended patches, practical sword on her back`
- neutre : `tired neutral expression, flat unimpressed gaze`
- sourire : `rare lopsided sarcastic smile, one eyebrow raised`
- ferme : `prickly closed-off expression, scowling`

**Laris** — `a 20-year-old young woman, white hair pulled back neatly, crimson-red eyes, flawless white and navy knight academy uniform, rapier at her hip, upright rigid posture`
- neutre : `cool rational neutral expression, precise unblinking gaze`
- sourire : `faint reluctant smile, soft eyes`
- ferme : `cold shut-down expression, tight lips, a flicker of jealousy in her eyes`

### Département de Magie

**Rena** — `a small 20-year-old young woman, messy silver hair, half-closed violet eyes, oversized white and burgundy mage academy uniform with sleeves too long, a small staff held loosely, drowsy posture`
- neutre : `sleepy neutral expression, heavy eyelids`
- sourire : `soft sleepy smile, content eyes`
- ferme : `closed expression, eyes shut as if asleep, head slightly turned away`

**Sia** — `a 20-year-old young woman, shoulder-length pink hair, bright blue eyes, white and burgundy mage academy uniform, four small glowing elemental spirits (fire, water, wind, earth) floating close around her`
- neutre : `curious neutral expression, head slightly tilted`
- sourire : `wide cheerful smile, eyes shining, spirits glowing brighter`
- ferme : `quiet distant expression, eyes lowered, spirits dimmed`

**Lucia** — `a 21-year-old tall young woman, long silver hair, icy blue eyes, white and burgundy mage uniform with a Student Council badge, a heavy spellbook under her arm, elegant posture`
- neutre : `cool composed neutral expression, chin lifted`
- sourire : `thin mocking smile, one eyebrow arched`
- ferme : `irritated haughty expression, narrowed eyes, lips pressed in a hard line`

**Elise** — `a 21-year-old young woman, wavy golden-blonde hair, blue eyes, white and burgundy mage uniform with a white rose brooch, a porcelain teacup in her hand, graceful posture`
- neutre : `calm attentive neutral expression, listening gaze`
- sourire : `warm friendly smile, hint of mischief`
- ferme : `polite closed expression, smile gone, eyes alert and careful`

**Serena** — `a 20-year-old young woman, straight white hair, blue eyes, white and burgundy mage academy uniform, a notebook clasped to her chest, quiet reserved posture`
- neutre : `calm quiet neutral expression, gaze lowered`
- sourire : `shy tiny smile, eyes softening`
- ferme : `withdrawn closed expression, eyes down, shoulders curled inward`

**Chloe** — `a 20-year-old young woman, ginger-red hair, green eyes, white and burgundy mage uniform with a small coin purse and ledger on her belt, confident merchant posture`
- neutre : `alert neutral expression, appraising eyes`
- sourire : `polished commercial smile, slightly too sweet`
- ferme : `cunning cold expression, narrowed green eyes, a sly half-smile`

### Théologie

**Aria** — `a 22-year-old young woman, long white hair, pink eyes, flowing white and gold theologian robe, a faint warm healing light around her hands, serene posture`
- neutre : `gentle serene neutral expression, calm confident gaze`
- sourire : `soft compassionate smile, warm eyes`
- ferme : `calm stern expression, cool eyes, a chiding look`

**Mirabel** — `a 20-year-old young woman, wavy blonde hair, bright golden eyes, white and gold theology uniform, a blessed mace at her belt, lively posture`
- neutre : `bright attentive neutral expression, head slightly tilted`
- sourire : `mischievous teasing grin, sparkling eyes`
- ferme : `hurt serious expression, eyes shining with held-back tears, lips tight`

### Professeures

**Elena** — `a woman in her thirties, long wavy blue hair, golden eyes, elegant dark-blue mage professor robe, relaxed posture`
- neutre : `relaxed neutral expression, amused thoughtful gaze`
- sourire : `playful teasing smile, a glint in her golden eyes`
- ferme : `cool intellectual expression, eyebrow raised, evaluating gaze`

**Artemis** — `a woman in her thirties, short white hair, crimson-red eyes, a thin scar on her chin, plain navy training outfit with a leather belt, sword at her hip, straight military posture`
- neutre : `firm neutral expression, direct unwavering gaze`
- sourire : `faint rare smile, softened eyes`
- ferme : `stern severe expression, hard eyes, jaw clenched`

### Quatre Célestes

**Ethera** — `an ageless woman, long flowing white hair, violet eyes, long dark purple mage robe with silver embroidery, a few glowing pages floating around her, languid regal posture`
- neutre : `languid neutral expression, half-lidded all-seeing gaze`
- sourire : `knowing smile, eyes gleaming as if reading your thoughts`
- ferme : `bored arrogant expression, eyes narrowed, looking down`

**Emily** — `a woman in her thirties, shoulder-length silver hair, blue eyes, formal white and blue director's robe, a wrapped candy in her hand`
- neutre : `bright pleasant neutral expression, attentive eyes`
- sourire : `radiant playful smile`
- ferme : `suddenly serious expression, clear sharp blue eyes, no smile at all`

**Carne** — `a woman, silver hair, golden eyes, black and silver Imperial Guard commander uniform with a long coat, a slender ornate sword at her side, detached posture`
- neutre : `detached empty neutral expression, gaze resting on nothing`
- sourire : `faint sardonic smile, unreadable eyes`
- ferme : `chilling still expression, cold golden eyes, a lethal calm`

**Seriel** — `a woman, wavy blonde hair, green eyes, worn long travel coat over light armor, a stringless bow of condensed light in her hand, composed posture`
- neutre : `cool composed neutral expression, distant sharp gaze`
- sourire : `slight knowing smile, a trace of warmth in the green eyes`
- ferme : `cold intellectual expression, icy gaze`

## Décors

16/9 (1600 × 900), WebP, sans personnage, dans `decors/`. Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

Négatif en plus : `people, person, character, figure, silhouette, crowd, students, animals in the foreground`

- `cour` : `[STYLE]. Environment background, the honor courtyard of Lumencia Academy, pale ivory stone buildings with navy spires, a central fountain on the left, navy banners, paved ground, late afternoon golden light, [PARTIE COMMUNE]`
- `terrain` : `[STYLE]. Environment background, the knights' sand training ground of the academy, wooden dummies and weapon racks on the left, stone colonnades, packed sand floor, clear morning light, [PARTIE COMMUNE]`
- `amphitheatre` : `[STYLE]. Environment background, the magic department amphitheater, tiered wooden seats rising on the left, central stone stage, faint glowing magic circles in the air, tall arched windows, [PARTIE COMMUNE]`
- `bibliotheque` : `[STYLE]. Environment background, the great academy library, towering shelves and a spiral staircase on the left, floating lantern lights, dust motes in golden light, polished wooden floor, [PARTIE COMMUNE]`
- `dortoir` : `[STYLE]. Environment background, a corridor of the first-year dormitory, wooden doors with number plates along the left wall, warm wall lamps, worn stone floor, evening, [PARTIE COMMUNE]`
- `refectoire` : `[STYLE]. Environment background, the academy refectory, long wooden tables and benches, high vaulted stone ceiling, navy and burgundy banners, tall windows, midday light, [PARTIE COMMUNE]`
- `asterion` : `[STYLE]. Environment background, a market square in Asterion, the imperial capital, white stone houses with navy roofs, market stalls on the left, the imperial palace on a hill in the distance, cobblestones, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, the grounds of Lumencia Academy, a stone path between lawns and old trees, ivory buildings in the distance, soft neutral daylight, quiet, [PARTIE COMMUNE]`

## Couverture (3/4, sujet centré, 600 × 800)

```
[STYLE]. Key art for an interactive story: Lumencia Academy, a grand ivory stone academy with navy spires
on a hill above a medieval capital at golden hour, banners in the wind,
strong central composition, subject centered vertically and horizontally,
atmospheric, no text, no title, vertical 3:4 format.
```
