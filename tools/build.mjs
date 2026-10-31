import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const js = readdirSync('js')
  .filter(f => f.endsWith('.js'))
  .sort();
const modules = js.filter(f => f !== 'boot.js' && f !== 'reparer.js');
const assets = [
  'index.html',
  'reparer.html',
  'manifest.json',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'icon-192-mask.png',
  'icon-512-mask.png',
  'css/style.css',
  'fonts/literata-r.woff2',
  'fonts/literata-i.woff2',
  ...js.map(f => 'js/' + f)
];

let html = readFileSync('index.html', 'utf8');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) throw new Error('id dupliqué dans index.html : ' + [...new Set(dup)].join(', '));
for (const [, f] of html.matchAll(/\sfor="([^"]+)"/g))
  if (!ids.includes(f)) throw new Error('label orphelin : for="' + f + '"');

const dlgIds = [...html.matchAll(/<dialog[^>]*\sid="([^"]+)"/g)].map(m => m[1]);
const css = readFileSync('css/style.css', 'utf8');
const hitsDialog = sel => {
  const last = sel.trim().split(/[\s>+~]+/).pop();
  if (/::?[a-z-]+$/.test(last) || last.includes('[open]')) return false;
  return /^dialog\b/.test(last) || dlgIds.some(i => last.startsWith('#' + i));
};
for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (!/(^|[;{\s])display\s*:/.test(body)) continue;
  for (const one of sel.split(','))
    if (hitsDialog(one))
      throw new Error(
        'règle « ' + one.trim() + ' » fixe display sur une feuille fermée : visez le sélecteur [open]'
      );
}

const DYN = ['live'];
for (const f of modules) {
  const src = readFileSync('js/' + f, 'utf8');
  for (const [, id] of src.matchAll(/\$\('#([A-Za-z0-9_-]+)'\)/g))
    if (!ids.includes(id) && !DYN.includes(id))
      throw new Error(`js/${f} vise #${id}, absent de index.html`);
}

// Pas d'import circulaire : un module d'en bas annonce par js/bus.js au lieu d'importer l'interface.
const deps = {};
for (const f of modules) {
  const src = readFileSync('js/' + f, 'utf8');
  deps[f] = [...src.matchAll(/\bfrom\s+'\.\/([\w-]+\.js)'|^import\s+'\.\/([\w-]+\.js)'/gm)].map(m => m[1] || m[2]);
}
const seen = new Set();
const walk = (f, path) => {
  const i = path.indexOf(f);
  if (i >= 0) throw new Error('import circulaire : ' + [...path.slice(i), f].join(' → '));
  if (seen.has(f)) return;
  for (const d of deps[f] || []) walk(d, [...path, f]);
  seen.add(f);
};
for (const f of modules) walk(f, []);

const RV = [/(<meta name="app-version" content=")[^"]*/, /(const VERSION = ')[^']*/];
const h = createHash('sha256');
for (const a of assets) {
  let b = readFileSync(a);
  if (/\.(html|js|css|json)$/.test(a)) {
    let t = b.toString('utf8');
    // Même version sous Windows (CRLF) qu'en CI (LF).
    t = t.replace(/\r\n/g, '\n');
    for (const r of RV) t = t.replace(r, '$1');
    b = Buffer.from(t);
  }
  h.update(b);
}
// Le service worker compte aussi, sans son nom de cache ni sa liste (réécrits plus bas) : modifié seul, il
// doit changer de cache, sinon une installation refusée effacerait celui du worker en place.
h.update(
  readFileSync('sw.js', 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/const C = '[^']*',\n {2}A = \[[\s\S]*?\n {2}\],/, '')
);
const V = h.digest('hex').slice(0, 10);

html = html.replace(
  /(<meta name="app-version" content=")[^"]*(">)/,
  (_, a, b) => a + V + b
);
html = html.replace(
  /<!--PRELOAD-->[\s\S]*?<!--\/PRELOAD-->/,
  '<!--PRELOAD-->\n' +
    modules.map(f => `<link rel="modulepreload" href="js/${f}">`).join('\n') +
    '\n<!--/PRELOAD-->'
);
writeFileSync('index.html', html);

// Fins de ligne du fichier gardées (CRLF sous Windows avec core.autocrlf) : sinon rien ne correspond.
const sw = readFileSync('sw.js', 'utf8'),
  nl = sw.includes('\r\n') ? '\r\n' : '\n',
  list = ["'./'", ...assets.map(a => `'${a}'`)].join(',' + nl + '    '),
  sw2 = sw.replace(
    /const C = '[^']*',\r?\n {2}A = \[[\s\S]*?\r?\n {2}\],/,
    `const C = 'nocturne-${V}',${nl}  A = [${nl}    ${list}${nl}  ],`
  );
if (sw2 === sw && !sw.includes(`'nocturne-${V}'`)) throw new Error('sw.js : liste des fichiers introuvable');
writeFileSync('sw.js', sw2);

writeFileSync(
  'js/main.js',
  readFileSync('js/main.js', 'utf8').replace(/const VERSION = '[^']*';/, `const VERSION = '${V}';`)
);

console.log('version', V, '·', assets.length, 'fichiers');
