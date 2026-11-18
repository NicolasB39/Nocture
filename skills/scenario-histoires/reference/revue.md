# Relire un scénario

Lancer d'abord `node scripts/verifier.mjs "scenarios/<Nom>"`, qui attrape tout ce qui est mécanique. Le reste demande une lecture.

## Conflits de protocole

Chercher dans `systeme.md` : `<choix>`, `<etat>`, `{{img::`, « trois propositions », « fin de chaque réponse », « format suivant ». Chaque occurrence est une consigne qui fait doublon avec celle que l'application injecte. Même chose pour « entre astérisques » et pour les conseils généraux de narration (varier les tours, faire agir les PNJ, détails concrets), déjà dans le bloc « Narration » : ne garder que ce qui est propre au scénario. Les retirer, en déplaçant ce qui doit l'être vers `etat.md` ou vers les réglages du scénario.

## Budget

- `systeme.md` au-delà de 6 000 caractères : repérer ce qui ne concerne qu'un lieu, un personnage ou un moment, et le déplacer vers le lorebook ou une fiche.
- `etat.md` au-delà de cinq champs : chaque champ est réécrit à chaque tour.
- Fiches de plus de 2 500 caractères : vérifier qu'elles méritent leur poids quand le personnage est en scène.

## Déclenchement

- Chaque `fiche.md` a-t-elle un `résumé:` explicite ? Sinon l'application tronque la première ligne, souvent un titre Markdown inutile.
- Les mots-clés du lorebook sont-ils des mots que l'IA va réellement écrire ?
- Une entrée a-t-elle des mots-clés si courants qu'elle se déclenchera toujours ? La passer en `toujours: oui` ou la remonter dans le prompt système.
- Un personnage central est-il en `toujours: non` alors qu'il accompagne le joueur en permanence ? Le passer en `toujours: oui`.

## Fiction

- Le prompt redit-il ce que le bloc « Narration » de l'application envoie déjà (agentivité, anti-télépathie, personnages qui ne savent que ce qu'ils ont vu ou appris, ni adulation ni haine sans raison, personnages qui vivent sans le joueur, nouvelles par rumeur ou message, ellipse d'une journée sans enjeu) ? Retirer la redite, garder la nuance propre à l'histoire.
- Le ton des consignes est-il posé ? Repérer « CRITIQUE », « DIRECTIVE », « JAMAIS » ou « DOIT » en capitales : reformuler chaque règle calmement, avec sa raison. Un prompt alarmé donne une narration timide.
- Les PNJ importants ont-ils un but à eux (« Ce qu'il veut ») ? Sans lui, ils attendent le joueur au lieu d'agir.
- Est-il dit quelque part que les PNJ peuvent refuser, mentir ou être en désaccord ?
- Le scénario demande-t-il du hasard, des pourcentages ou des calculs ? À remplacer par des conditions explicites ou des paliers qualitatifs.
- La longueur de réponse est-elle cadrée ? Sans consigne, le modèle part trop long et le panneau d'état se fait couper.
- Y a-t-il une section **Rythme** qui dit ce que contient une journée, qui agit hors champ (personnages nommés) et comment l'heure avance ? C'est le premier remède à un récit qui piétine.
- Le scénario freine-t-il le rythme (« Pas de téléportation : décrivez le trajet », « Pas de saut de rythme ») ? À retirer : l'IA s'attarde déjà d'elle-même.
- Chaque fiche importante a-t-elle une `Exemple de réplique` ? Deux personnages pourraient-ils échanger leurs répliques ? Si oui, leurs voix se confondront en jeu.
- Le compagnon du joueur a-t-il la consigne de ne pas guider (avis donné une fois, puis il laisse choisir) ?
- `systeme.md` décrit-il des dés, un inventaire chiffré ou des jauges de relation ? À déplacer vers `regles.md`, `inventaire.md`, `liens.md` (voir `modes.md`).

## Images

- Les personnages sont-ils **détourés** (PNG ou WebP transparent), en buste coupé à la taille par le bas de l’image, avec des expressions bien distinctes ? Le vérificateur signale les images sans canal de transparence : elles s'affichent seules, sans décor.
- Les expressions d'un même personnage ont-elles le même cadrage, le même visage et la même tenue, et une posture qui change avec l'émotion ? Sinon, les régénérer en une seule planche (voir `images.md`).
- Reste-t-il une planche d'expressions dans `personnages/<Nom>/` ? Elle deviendrait une expression : la sortir du dossier.
- Reste-t-il un dossier de décors dans `personnages/` (`Decors`, `Lieux`…) ? Le déplacer dans `decors/` et supprimer sa fiche.
- Les décors sont-ils en 16/9, sans personnage, avec le sol jusqu'au bord bas, l'horizon vers le milieu et le tiers droit dégagé ?
- Les mots-clés des décors sont-ils les mots que l'IA écrira dans le champ Lieu ? Comparer avec les noms de lieux de `systeme.md` et du lorebook.
- `etat.md` contient-il `Lieu` ? Sans lui, le décor est deviné d'après le texte.
- Si le temps compte, `etat.md` contient-il `Jour` et `Heure` ? Sans heure, le narrateur étire les journées ; sans jour, l'inventaire ne baisse pas et la mémoire ne date rien.
- Y a-t-il un `decors/defaut` ? Sans lui, les lieux non prévus tombent sur un fond généré.
- Le style est-il homogène, anime réaliste, d'une image à l'autre ? Un même bloc de style en tête de tous les prompts (`images.md`) ?
- La couverture est-elle en 3/4 avec le sujet centré verticalement ?
- Chaque personnage important a-t-il au moins une expression neutre ?
