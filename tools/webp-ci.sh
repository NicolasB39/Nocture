#!/usr/bin/env bash
# Images PNG des scénarios → WebP, à la publication (.github/workflows/index.yml, étape webp), pour les images
# téléversées sur GitHub. Sans npm ni navigateur : cwebp, des paquets signés d'Ubuntu, seul outil lancé pendant
# que l'étape a le droit d'écrire dans le dépôt. Comme tools/webp.mjs : qualité 88, plus grand côté ramené à
# 1920 px, PNG retirés ; les codes d'images ne changent pas (l'application lit le nom sans l'extension).
# Les fichiers convertis sont préparés pour le commit (git add / git rm), que l'étape suivante enregistre.
# DRY=1 : affiche seulement ce qui serait fait.
set -euo pipefail
mapfile -d '' files < <(git ls-files -z -- ':(icase)scenarios/*.png')
if [ ${#files[@]} -eq 0 ]; then
  echo 'Aucune image PNG dans scenarios/.'
  exit 0
fi
if [ -z "${DRY:-}" ] && ! command -v cwebp > /dev/null; then
  sudo apt-get update -q
  sudo apt-get install -y -q webp
fi
for f in "${files[@]}"; do
  w=0 h=0
  read -r w h < <(file -b "$f" | sed -nE 's/.*, ([0-9]+) x ([0-9]+),.*/\1 \2/p') || true
  r=()
  if [ "${w:-0}" -gt 1920 ] || [ "${h:-0}" -gt 1920 ]; then
    if [ "$w" -ge "$h" ]; then r=(-resize 1920 0); else r=(-resize 0 1920); fi
  fi
  o="${f%.*}.webp"
  echo "$f (${w}×${h}) → $o ${r[*]:-}"
  [ -n "${DRY:-}" ] && continue
  cwebp -quiet -q 88 -alpha_q 100 "${r[@]}" "$f" -o "$o"
  git rm -q "$f"
  git add "$o"
done
