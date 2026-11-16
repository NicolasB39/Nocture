// Classes de css/style.css que ni le HTML ni le JavaScript ne nomment : candidates à retirer, à vérifier à la main
// (une classe construite par morceaux, comme 'v' + n, n'apparaît pas en entier).
//
//   npm run css
import { readFileSync, readdirSync } from 'node:fs';

const css = readFileSync('css/style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const src = [
  ...readdirSync('js').map(f => readFileSync('js/' + f, 'utf8')),
  readFileSync('index.html', 'utf8'),
  readFileSync('reparer.html', 'utf8')
].join('\n');
const used = new Set(src.match(/[\w-]+/g));
const classes = [...new Set([...css.matchAll(/\.(-?[a-z_][\w-]*)/gi)].map(m => m[1]))];
// Variantes de couleur des visuels générés : 'art v' + (teinte % 4) (list.js, scene.js, nav.js).
const built = c => /^v\d$/.test(c);
const dead = classes.filter(c => !used.has(c) && !built(c));
console.log(dead.length ? `${dead.length} classe(s) sans usage apparent : ${dead.join(' ')}` : 'Aucune classe CSS sans usage apparent.');
