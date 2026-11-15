# Prompts d'images — Guilde des Bras Cassés

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style. Gabarits complets : `reference/images.md` du skill.

Les images actuelles sont des cartes encadrées en buste, sur un décor : elles s'affichent seules, sans décor derrière. Les planches ci-dessous les remplacent par des personnages en buste, détourés, en gardant les mêmes noms de fichiers (et donc les mêmes codes, que les histoires déjà jouées utilisent).

## Bloc de style (en tête de chaque prompt)

```
realistic anime style, contemporary Japanese animation feature film, stylized faces,
believable anatomy, realistic materials and lighting, soft painterly shading,
warm cozy palette, honey, brick red, worn leather browns, candlelight accents, comedic fantasy
```

Négatif : `chibi, flat cel shading, photorealistic, 3d render, text, watermark, signature, frame, border`

## Personnages (planches sur fond uni, puis découpe)

Une planche par série d'expressions, en une génération (même visage, même tenue). Trois expressions par planche au plus en 3:2 (1536 × 1024), quatre en 2:1 (2048 × 1024) ; au-delà, deux planches avec la première en image de référence. Puis :

1. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
2. la découper avec le script du skill, les noms dans l'ordre de gauche à droite (les noms existants, pour garder les codes) ;
3. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Gabarit :

```
[STYLE]. Character expression sheet: the same character shown [N] times side by side in a single row,
identical outfit, hairstyle, proportions, pose and lighting in every figure, only the facial expression changes,
from left to right: [EXPRESSIONS].
[DESCRIPTION],
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
facing the viewer at a slight three-quarter angle, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, evenly spaced with a wide empty gap between figures,
no figure touching or overlapping another,
isolated on a plain flat uniform [FOND], no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, soft even lighting from the left,
wide horizontal format [FORMAT].
```

`[FOND]` : `bright chroma-key green background (#00FF00)`, sauf pour un personnage qui porte du vert : `bright magenta background (#FF00FF)`.

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, captions, labels, grid lines, panels`

Expressions :

| Nom | `[EXPRESSIONS]` |
|---|---|
| neutre | calm neutral expression |
| joie | big joyful grin, bright eyes |
| surprise | surprised, eyebrows raised, mouth open |
| gene | embarrassed awkward smile, blushing, looking aside |
| peur | frightened, wide eyes, shoulders hunched |
| colere | angry, furrowed brows, clenched jaw |
| triste | sad, drooping eyes, lowered head |

### Brunot (fond vert)

`a 35-year-old skinny wizard, crooked round glasses, sparse beard, messy hair, oversized dark mage robe covered in scorch marks, a heavy spellbook clutched to his chest`

- planche 1, 3:2 : neutre, joie, surprise → `node skills/scenario-histoires/scripts/decouper.mjs planche-brunot-1.png "scenarios/La guilde des bras casses/personnages/brunot" bruno_neutre bruno_joie bruno_surprise`
- planche 2, 3:2 (deux figures) : gene, peur → `… bruno_gene bruno_peur`

### Maëlys (fond vert)

`a 28-year-old tall woman paladin, red hair tied back, dented patched plate armor, a cape slightly too short, a sword at her hip, heroic posture`

- planche 1 : neutre, joie, surprise → `… "scenarios/La guilde des bras casses/personnages/maelys" maelys_neutre maelys_joie maelys_surprise`
- planche 2 : colere, gene → `… maelys_colere maelys_gene`

### Pimprenelle (fond magenta : capuche verte)

`a 24-year-old petite young woman thief, short spiky black hair, green hood, daggers and many pockets on her belt, light leather clothes, sly half-smile`

- planche 1 : neutre, joie, surprise → `… "scenarios/La guilde des bras casses/personnages/pimprenelle" pimprenelle_neutre pimprenelle_joie pimprenelle_surprise`
- planche 2 : colere, gene → `… pimprenelle_colere pimprenelle_gene`

### Grumble (fond magenta : écailles vertes)

`a baby dragon the size of a large cat, dull green scales, tiny wings, red runny nose, big curious eyes, sitting upright` (remplacer « waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge » par « sitting upright, every figure fully visible from head to tail »)

- une planche 2:1 de quatre : neutre, joie, surprise, triste → `… "scenarios/La guilde des bras casses/personnages/grumble" grumble_neutre grumble_joie grumble_surprise grumble_triste`
