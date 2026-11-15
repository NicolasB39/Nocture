# Lorebook

## À quoi ça sert

Le prompt système part en entier à chaque tour. Le lorebook, non : une entrée n'est injectée que lorsqu'un de ses mots-clés apparaît dans les derniers messages. C'est l'outil qui permet d'avoir un monde dense sans payer sa densité à chaque fois.

Tout ce qui ne concerne qu'un lieu, un objet, une faction, un secret ou un moment précis appartient au lorebook.

## Choisir les mots-clés

C'est la seule difficulté réelle. Une entrée avec de mauvais mots-clés ne se déclenche jamais, ou se déclenche tout le temps.

- **Prenez les mots que l'IA elle-même va écrire**, pas ceux que vous avez en tête. Pour une entrée sur la tempête, « tempête », « vent », « houle » valent mieux que « événement climatique ».
- **Plusieurs formulations** : le nom propre, le surnom, la périphrase. `mots-clés: la Veuve, le récif noir, les trois pointes`
- **Le joker `*`** pour couvrir les familles de mots : `brume*` déclenche sur brume, brumes, brumeux. Sans étoile, le mot doit être entier.
- **Les accents et la casse n'ont pas d'importance** : `sirène` déclenche sur « Sirene » et « SIRÈNE ».
- **Évitez les mots trop courants** comme « phare » dans une histoire de phare : l'entrée sera injectée en permanence, autant la mettre en `toujours: oui` ou dans le prompt système.

Un mot-clé qui figure dans un champ du panneau d'état se déclenche à chaque tour tant que la valeur ne change pas, puisque l'état est relu. Pratique pour une entrée liée à un lieu : mettez le nom du lieu dans `Lieu`.

## Priorité et plafond

Le scénario peut plafonner le nombre d'entrées injectées par tour. Quand le plafond mord, les `priorité:` les plus hautes passent en premier. Donnez une priorité explicite aux entrées structurantes, laissez le reste à zéro.

## Déclencheurs conditionnels

Le lorebook est le bon endroit pour les événements à retardement, parce que la règle n'arrive que quand elle devient pertinente.

```markdown
mots-clés: jetée, quai, embarcadère
priorité: 3

SI [Lieu : la jetée] ET [Jour : 5] ET [Corne : non sonnée]
ALORS [Déclencher : la marée noire remonte]

Tant que la condition n'est pas remplie, ne mentionnez rien d'anormal sur la jetée.
```

## Longueur

400 à 1 200 caractères par entrée. Au-delà, c'est probablement deux entrées.
