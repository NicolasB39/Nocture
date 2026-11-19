# Prompts d'images — Entre deux Fleuves

Fichier ignoré par l'application. Il garde le bloc de style et les prompts, pour régénérer une image dans le même style.

## Bloc de style (en tête de chaque prompt)

```
dark fantasy manhwa illustration style, polished anime key art, sharp expressive faces with luminous detailed eyes,
crisp black ink linework, hard cel shading with deep shadows, glossy highlights on hair and eyes, high contrast,
dramatic lighting, vivid neon magic effects that glow against the dark (glowing runes, sparks, light trails, floating particles),
dusky city palette, deep navy and charcoal shadows, saturated accents of river teal, copper and violet, warm lamplight
```

Négatif : `chibi, pastel colors, soft blurry shading, washed-out colors, photorealistic, 3d render, text, watermark, signature, frame, border`

Ce style est plus sombre et plus contrasté que celui des autres scénarios : gardez-le pour toutes les images de celui-ci, personnages, décors et couverture, pour qu'elles restent cohérentes entre elles.

Chaque personnage porte une petite touche de magie lumineuse (fils, runes, ombres, gouttes), qui donne l'éclat du style. Sur une planche, elle reste près des mains ou de l'épaule : un effet qui déborde vers la silhouette voisine empêche la découpe. Aucune n'est verte, pour ne pas disparaître avec le fond d'incrustation.

## Personnages (une planche par personnage, puis découpe)

Les trois expressions d'un personnage se génèrent en une seule image, côte à côte : même visage, même tenue, même lumière. Format paysage 3:2 (1536 × 1024), fond vert d'incrustation uni (#00FF00). Puis :

1. vérifier la planche : chaque personnage en buste, coupé à la taille par le bas de l'image, une marge de fond à gauche et à droite (rien de coupé par les bords), les têtes séparées par du fond, des expressions bien distinctes ; sinon, régénérer ;
2. garder le PNG d'origine téléchargé depuis le générateur (pas une image recollée dans une conversation, recompressée) ;
3. la découper avec l'outil du dépôt, qui retire le fond vert, montre un aperçu sur fond sombre et écrit les WebP, les noms dans l'ordre de gauche à droite :
   `node tools/planche.mjs planche-margaux.png "scenarios/Entre deux Fleuves/personnages/Margaux" neutre sourire ferme`
4. ne pas laisser la planche dans le dossier du personnage (elle deviendrait une expression).

Gabarit, à la suite du bloc de style :

```
[STYLE]. Character expression sheet: the same character shown 3 times side by side in a single row,
identical outfit, hairstyle, proportions and lighting in every figure,
a different upper-body pose and gesture for each emotion (head tilt, shoulders, arms, hands), matching the facial expression,
arms and hands kept close to the figure, never reaching into the next figure,
from left to right: calm neutral expression, [SOURIRE], [FERME].
[DESCRIPTION],
waist-up portrait, every figure cut at the waist by the bottom edge of the image, head near the top edge,
body turned three-quarters toward the viewer, which keeps the shoulders narrow, large detailed face,
strong exaggerated anime facial expressions that read at a glance,
every figure the same size, each one fitting inside its own equal share of the image width,
both shoulders and upper arms of every figure entirely visible, with green background on both sides of them,
a wide green gap between figures and a green margin on the left and right edges of the image,
no figure touching or overlapping another,
isolated on a plain flat uniform bright chroma-key green background (#00FF00), no floor, no cast shadow, no props,
no text, no labels, no frames or dividing lines, strong key light from the left with deep shadows on the right side,
wide horizontal format 3:2.
```

- `Margaux` : `a 29-year-old French woman civil servant, slim, dark brown hair in a tight bun with one loose strand, round glasses, navy blue skirt suit, crooked ID badge on the lapel, a pen tucked behind her ear, a small glowing pale-blue square rune hovering above one palm` · `[SOURIRE]` : `flustered blushing smile, eyes looking aside` · `[FERME]` : `stern disapproving look over her glasses, lips pressed`
- `Gilles` : `a 54-year-old broad-shouldered French craftsman, salt-and-pepper beard, thin thread-like scars on his forearms, blue work jacket with rolled sleeves, leather apron, reading glasses pushed up on his forehead, glowing golden threads wound around his fingers` · `[SOURIRE]` : `big warm laugh, eyes crinkled` · `[FERME]` : `grim frown, heavy brows lowered, arms crossed`
- `Lena` : `a 24-year-old French woman, chestnut bob haircut with one copper-dyed strand, defiant green eyes, black motorcycle jacket over a knitted workshop sweater, spools of glowing copper thread on her belt, plasters on her fingertips, a taut glowing copper thread between her hands` · `[SOURIRE]` : `cocky grin, chin raised` · `[FERME]` : `pouting, cheeks slightly red, looking away`
- `Iris` : `a 31-year-old tall French woman, messy curly black hair tied in a loose low bun with strands falling out, tired eyes with dark circles, long grey coat over a black turtleneck, ink-stained fingers, an old pocket watch in hand, a small glowing violet glyph circle near her shoulder` · `[SOURIRE]` : `smug knowing half-smile, one eyebrow raised` · `[FERME]` : `cold condescending stare, head tilted back`
- `Jo` : `a 27-year-old French woman, black hair braided with red strands, eyebrow piercing, oversized black leather jacket, fingerless gloves, a bulging belt bag, wisps of dark purple shadow curling around her hands` · `[SOURIRE]` : `wide mischievous grin, winking` · `[FERME]` : `annoyed glare, mouth twisted, hand on her hip`
- `Lucienne` : `a 68-year-old short and stout French woman, cropped white hair, strong forearms, red-checkered apron over a dark dress, a star-shaped scar on the back of her neck` · `[SOURIRE]` : `gentle motherly smile, eyes half-closed` · `[FERME]` : `quiet severe look that would silence a room`
- `Ondine` : `a young woman who looks 26, long black hair always slightly wet, pale skin, grey-blue eyes, half-open black wetsuit over an oversized pale sweatshirt, a shell necklace, a few glowing blue water droplets floating around her fingers` · `[SOURIRE]` : `soft dreamy smile, head tilted with curiosity` · `[FERME]` : `distant sad expression, eyes lowered, a faint cold mist around her hands`

Négatif en plus : `background scenery, ground, cast shadow, cropped head, full body, legs, different outfits, different characters, overlapping figures, green rim light, green reflections on the character, figures cut by the side edges, cropped shoulders, cropped arms, panel borders, captions, labels, grid lines, panels`

## Décors (16/9, sans personnage, tiers droit dégagé)

Partie commune, à la suite de chaque description :

```
no people, no characters, empty scene, camera at waist height, horizon line near the middle of the frame,
floor or ground running from the horizon all the way down to the bottom edge of the image,
main elements on the left and center, the right third kept calm and uncluttered for a figure to stand in,
bold readable shapes, low detail density, clear depth with foreground, midground and background,
light coming from the left, widescreen cinematic 16:9 format.
```

- `appartement` : `[STYLE]. Environment background, a small two-room apartment in an old French city building, wooden floor, sofa with a blanket, kitchenette, tall window on the left overlooking a river at dusk, [PARTIE COMMUNE]`
- `bureau` : `[STYLE]. Environment background, the lobby of a former prefecture turned government breach office, marble floor, numbered service counters, queue barriers, a large glowing measuring crystal on a pedestal on the left, daytime, [PARTIE COMMUNE]`
- `bouchon` : `[STYLE]. Environment background, a traditional French bistro, red-checkered tablecloths, moleskin benches, a zinc counter on the left, a chalkboard menu, warm evening light, [PARTIE COMMUNE]`
- `atelier` : `[STYLE]. Environment background, an old silk-weaving workshop on a hillside, tall windows, wooden looms on the left, glowing threads stretched under the ceiling, a long wooden table, afternoon light, [PARTIE COMMUNE]`
- `observatoire` : `[STYLE]. Environment background, the dome room of an old astronomical observatory on a hill, brass telescope on the left, blackboards covered in glyphs, papers everywhere, night sky through the open dome, [PARTIE COMMUNE]`
- `vieille_ville` : `[STYLE]. Environment background, a covered stone passage between old Renaissance courtyards, vaulted ceiling, worn stone steps, a single lantern on the left, dim evening light, [PARTIE COMMUNE]`
- `quais` : `[STYLE]. Environment background, stone river quays of a French city, a wide river on the left with a stone bridge in the distance, plane trees, the water dangerously high, golden dusk, [PARTIE COMMUNE]`
- `breche` : `[STYLE]. Environment background, a city square cordoned off with police tape, a swirling glowing portal hovering above the cobblestones on the left, old buildings, overcast day, [PARTIE COMMUNE]`
- `cour_des_eaux` : `[STYLE]. Environment background, a sunken marble city under luminous murky water, flooded plazas and palace columns, drifting light rays, teal glow, [PARTIE COMMUNE]`
- `cour_des_forges` : `[STYLE]. Environment background, a plain of cold blast furnaces under an ash-grey sky, idle conveyor chains, rusted iron and dull orange embers, [PARTIE COMMUNE]`
- `cour_des_racines` : `[STYLE]. Environment background, a skyless warm forest growing through the ruins of a city, giant roots over broken streets, floating spores, dark green gloom, [PARTIE COMMUNE]`
- `defaut` : `[STYLE]. Environment background, a French city at the confluence of two rivers seen from a hillside at dusk, bridges and rooftops, a faint portal glow on the horizon, [PARTIE COMMUNE]`

Négatif en plus : `people, person, character, figure, silhouette, crowd`

## Monstres (scène complète en 16/9, avec fond)

À ranger dans `monstres/` sous le nom indiqué : `monstres/noye.webp` donne le code `monstre_noye`. Une image à fond plein s'affiche seule, en pleine largeur.

Partie commune, à la suite de chaque description :

```
the monster large and fully visible in the center of the frame,
dramatic lighting, strong silhouette readable on a phone screen,
no people, no humans, no text, widescreen cinematic 16:9 format.
```

Cour des Eaux :
- `noye` : `[STYLE]. Monster illustration: a drowned humanoid with pale bloated skin, white glowing eyes, long black hair and torn clothes dripping water, reaching forward, rising from flooded stone stairs under a city bridge at night, teal glow, [PARTIE COMMUNE]`
- `anguille` : `[STYLE]. Monster illustration: a giant eel as long as a tram, black glistening skin with glowing teal lines, jaws wide open, bursting out of a dark river beside stone quays, spray and droplets, [PARTIE COMMUNE]`
- `crabe` : `[STYLE]. Monster illustration: a huge mud crab the size of a car, shell crusted with river mud, shells and rusted bicycles, raised claws, in a flooded underground parking, dim teal light reflecting on the water, [PARTIE COMMUNE]`

Cour des Forges :
- `automate` : `[STYLE]. Monster illustration: a tall cast-iron automaton with a furnace glowing in its open chest, riveted plates, heavy hammer arm raised, in a street with torn-up tram rails, orange embers and ash, [PARTIE COMMUNE]`
- `chien_scories` : `[STYLE]. Monster illustration: a hound made of cooling slag and molten cracks, glowing orange eyes, snarling, crouched to leap, in an abandoned metal workshop, sparks in the air, [PARTIE COMMUNE]`
- `ouvrier` : `[STYLE]. Monster illustration: a faceless worker of dull grey iron in a scorched work overall, smooth blank face, holding a giant wrench, standing still and calculating, on a cold blast-furnace plain under an ash sky, [PARTIE COMMUNE]`

Cour des Racines :
- `ronce` : `[STYLE]. Monster illustration: a writhing mass of living brambles with thorns like daggers and a pulsing dark green heart, lashing out, overgrowing a ruined public garden, floating spores, [PARTIE COMMUNE]`
- `cerf` : `[STYLE]. Monster illustration: a towering stag made of bark and roots, antlers like dead branches with glowing violet fungi, hollow eyes, in a skyless forest growing through city ruins, [PARTIE COMMUNE]`
- `spores` : `[STYLE]. Monster illustration: a drifting swarm of glowing violet spores forming a vague giant face, inside an abandoned overgrown building, beams of dim light, eerie and silent, [PARTIE COMMUNE]`

Négatif en plus : `people, person, human, character, crowd, multiple monsters`

## Couverture (3/4, sujet centré)

```
[STYLE]. Key art for an interactive story: a French city built where two rivers meet, seen at dusk,
the rivers glowing teal and rising over the quays, a glowing portal above the central bridge,
a young woman with wet black hair standing on the bridge railing, seen from behind,
strong central composition, subject centered vertically and horizontally,
atmospheric, no text, no title, vertical 3:4 format.
```
