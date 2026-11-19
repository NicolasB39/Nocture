import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { IMG, codeOf, nz } from './regles.mjs';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node verifier.mjs "scenarios/Nom du scénario"');
  process.exit(2);
}

const err = [],
  warn = [],
  info = [];
const read = p => readFileSync(p, 'utf8');
const ls = p => (existsSync(p) ? readdirSync(p) : []);

const dims = p => {
  const b = readFileSync(p);
  try {
    if (b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
      return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b.slice(0, 3).toString('latin1') === 'GIF')
      return [b.readUInt16LE(6), b.readUInt16LE(8)];
    if (b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') {
      const t = b.slice(12, 16).toString('latin1');
      if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      if (t === 'VP8L') {
        const n = b.readUInt32LE(21);
        return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)];
      }
      return null;
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m))
          return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch (e) {}
  return null;
};
const alpha = p => {
  const b = readFileSync(p);
  try {
    if (b.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
      return b[25] === 4 || b[25] === 6 || b.includes('tRNS');
    if (b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') {
      const t = b.slice(12, 16).toString('latin1');
      if (t === 'VP8X') return (b[20] & 0x10) !== 0;
      if (t === 'VP8L') return ((b.readUInt32LE(21) >>> 28) & 1) === 1;
      return false;
    }
    if (b[0] === 0xff && b[1] === 0xd8) return false;
  } catch (e) {}
  return null;
};
const ratio = (p, want, label, tol = 0.06) => {
  const d = dims(p);
  if (!d) return info.push(`${label} : dimensions illisibles, vérifiez le format à la main`);
  const r = d[0] / d[1];
  if (Math.abs(r - want) / want > tol)
    warn.push(`${label} est en ${d[0]}×${d[1]} (${r.toFixed(2)}:1), attendu ${want.toFixed(2)}:1`);
};

const head = (t, names) => {
  const lines = t.split(/\r?\n/),
    re = new RegExp('^\\s*(' + names + ')\\s*(?::\\s*(.*))?$', 'i');
  const got = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) break;
    got[nz(m[1]).replace(/[-\s]/g, '')] = (m[2] || '').trim();
  }
  return { got, body: lines.slice(i).join('\n').trim() };
};

if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  console.error('dossier introuvable : ' + dir);
  process.exit(2);
}
const name = basename(dir);
if (/[:\\/]/.test(name)) err.push(`le nom du dossier contient un caractère risqué : ${name}`);

// --- systeme.md ---
const sysPath = join(dir, 'systeme.md');
if (!existsSync(sysPath)) err.push('systeme.md manquant : le scénario n’apparaîtra pas dans l’application');
else {
  const sys = read(sysPath);
  if (!sys.trim()) err.push('systeme.md est vide');
  for (const [pat, what] of [
    ['<choix>', 'le format des choix'],
    ['<etat>', "le format de l'état"],
    ['{{img::', 'la syntaxe des images']
  ])
    if (sys.includes(pat))
      err.push(`systeme.md redéfinit ${what} (« ${pat} ») : l’application s’en charge, retirez ces consignes`);
  if (sys.includes('{{char}}')) err.push('systeme.md utilise {{char}}, non reconnu : seul {{user}} existe');
  if (!/\{\{user\}\}/.test(sys)) warn.push('systeme.md ne mentionne jamais {{user}}');
  if (/CRITIQUE|\bJAMAIS\b|\bDOIT\b/.test(sys))
    warn.push('systeme.md emploie un ton d’alarme (CRITIQUE, JAMAIS, DOIT en capitales) : reformulez posément, avec la raison de chaque règle');
  if (/ast[ée]risques/i.test(sys))
    warn.push('systeme.md parle des astérisques : l’application fixe déjà la forme des paroles et du récit, retirez la consigne');
  if (/^\*[\p{L}«]/mu.test(sys))
    warn.push('systeme.md a du récit entre astérisques (un exemple de ton ?) : le narrateur l’imiterait, écrivez-le en texte simple');
  if (sys.length > 6000)
    warn.push(`systeme.md fait ${sys.length} caractères : déplacez ce qui est situationnel vers le lorebook`);
  if (sys.length < 600) warn.push(`systeme.md fait ${sys.length} caractères, c’est très court`);
  if (/\b\d{1,3}\s?%\s?(de )?chance|al[ée]atoire|lance[rz]? (un |les )?d[ée]/i.test(nz(sys)))
    warn.push('systeme.md semble demander du hasard chiffré : le modèle le simule mal');
}

if (existsSync(sysPath) && !/^#+\s*rythme/im.test(read(sysPath)))
  info.push('systeme.md sans section « Rythme » : rien ne dit ce que contient une journée ni qui agit hors champ');
for (const f of ['regles.md', 'inventaire.md', 'liens.md', 'intro.md'])
  if (existsSync(join(dir, f))) info.push(`${f} présent : mode ou introduction actifs (voir modes.md)`);

// --- etat.md ---
const etatPath = join(dir, 'etat.md');
if (existsSync(etatPath)) {
  const e = read(etatPath).trim();
  if (/<etat>/i.test(e)) err.push('etat.md contient un gabarit <etat> : n’y mettez que la liste des champs');
  const n = e.split(/[,\n]/).map(x => x.trim()).filter(Boolean).length;
  if (!n) err.push('etat.md est vide');
  // Heure ne coûte que quelques jetons et fait avancer le récit : elle ne compte pas dans la limite.
  else if (n - /(^|,)\s*heure\s*(,|$)/im.test(e) > 5) warn.push(`etat.md déclare ${n} champs : chacun est réécrit à chaque tour, visez 3 à 5 (plus Heure)`);
  else info.push(`etat.md : ${n} champ${n > 1 ? 's' : ''}`);
}

// --- avatar / cover ---
if (!existsSync(join(dir, 'avatar.md'))) info.push('pas d’avatar.md (optionnel)');
const cov = ls(dir).find(f => /^cover\./i.test(f) && IMG.test(f));
if (!cov) info.push('pas de cover (optionnel) : un visuel généré sera utilisé');
else ratio(join(dir, cov), 3 / 4, cov + ' (couverture)');

// --- personnages ---
const pdir = join(dir, 'personnages');
const chars = ls(pdir).filter(d => statSync(join(pdir, d)).isDirectory());
if (!chars.length) info.push('aucun personnage déclaré');
let fiches = 0;
// Codes d'images déjà pris (règles.mjs : comme l'application).
const taken = new Set();
for (const c of chars) {
  const files = ls(join(pdir, c));
  const imgs = files.filter(f => IMG.test(f));
  for (const i of imgs) taken.add(codeOf(c, i.replace(IMG, '')));
  const fp = join(pdir, c, 'fiche.md');
  for (const f of files)
    if (!IMG.test(f) && f !== 'fiche.md')
      warn.push(`personnages/${c}/${f} n’est ni une image ni fiche.md : ignoré`);
    else if (IMG.test(f) && /planche|sheet/i.test(f))
      warn.push(`personnages/${c}/${f} ressemble à une planche d’expressions : elle deviendrait une expression, sortez-la du dossier`);
  if (/^(decors?|lieux|ambiances?)$/.test(nz(c)) || (existsSync(fp) && /pas un personnage/.test(nz(read(fp))))) {
    warn.push(
      `personnages/${c} semble porter des décors : déplacez ses images dans decors/ (l’application les choisit seule) et supprimez ce dossier`
    );
    continue;
  }
  if (!existsSync(fp)) {
    if (imgs.length) info.push(`personnages/${c} : images seules, sans fiche.md`);
    else warn.push(`personnages/${c} est vide`);
    continue;
  }
  fiches++;
  const { got, body } = head(read(fp), 'r[ée]sum[ée]|toujours|mots[-\\s]?cl[ée]s');
  if (!got.resume)
    warn.push(`personnages/${c}/fiche.md sans « résumé: » : la ligne de casting sera tronquée depuis le texte`);
  else if (got.resume.length > 140)
    warn.push(`personnages/${c} : le résumé fait ${got.resume.length} caractères, il sera coupé à 140`);
  if (!body) err.push(`personnages/${c}/fiche.md n’a que des en-têtes, aucun contenu`);
  if (body.length > 2500)
    warn.push(`personnages/${c}/fiche.md fait ${body.length} caractères : lourd quand le personnage est en scène`);
  // Un personnage qui ne parle pas (un animal) a un « Exemple de réaction » à la place.
  if (!/exemple de r[ée](plique|action)/i.test(body))
    info.push(`personnages/${c}/fiche.md sans « Exemple de réplique » : la voix risque de se confondre avec les autres`);
  if (/<choix>|<etat>|\{\{img::/.test(body))
    err.push(`personnages/${c}/fiche.md redéfinit un format géré par l’application`);
  for (const i of imgs) {
    const code = codeOf(c, i.replace(IMG, ''));
    if (/[^a-z0-9_]/.test(code))
      info.push(`code d’image inhabituel : ${code} (espaces ou ponctuation dans le nom)`);
    const a = alpha(join(pdir, c, i)),
      d = dims(join(pdir, c, i));
    if (a === false)
      warn.push(`personnages/${c}/${i} n’a pas de transparence : affichée seule, sans décor ; livrez un PNG ou WebP détouré`);
    else if (a === null) info.push(`personnages/${c}/${i} : transparence non vérifiable, contrôlez-la à la main`);
    else if (d && d[0] > d[1])
      info.push(`personnages/${c}/${i} est en paysage (${d[0]}×${d[1]}) : un personnage se livre en vertical 2:3`);
  }
  if (!imgs.length) info.push(`personnages/${c} : aucune image`);
}

// --- monstres : images à plat, code monstre_<fichier>, sans fiche ---
const mdir = join(dir, 'monstres');
let monstres = 0;
// Les fichiers cachés (.gitkeep, qui garde le dossier vide dans Git) sont ignorés.
for (const f of ls(mdir).filter(f => !f.startsWith('.'))) {
  const code = codeOf('monstre', f.replace(IMG, ''));
  if (statSync(join(mdir, f)).isDirectory()) warn.push(`monstres/${f}/ : les sous-dossiers ne sont pas lus`);
  else if (!IMG.test(f)) warn.push(`monstres/${f} n’est pas une image : ignoré`);
  else if (taken.has(code)) warn.push(`monstres/${f} : le code ${code} est déjà pris (personnage ou autre format du même nom), image ignorée`);
  else {
    taken.add(code);
    monstres++;
    if (/[^a-z0-9_]/.test(code)) info.push(`code d’image inhabituel : ${code} (espaces ou ponctuation dans le nom)`);
  }
}

// --- décors ---
const ddir = join(dir, 'decors'),
  dfiles = ls(ddir),
  dimgs = dfiles.filter(f => IMG.test(f) && statSync(join(ddir, f)).isFile()),
  dkeys = new Map();
let hasDef = false;
for (const f of dfiles) {
  const fp = join(ddir, f);
  if (statSync(fp).isDirectory()) {
    warn.push(`decors/${f}/ : les sous-dossiers ne sont pas lus`);
    continue;
  }
  if (IMG.test(f)) {
    const stem = f.replace(IMG, '');
    ratio(fp, 16 / 9, `decors/${f}`);
    if (nz(stem) === 'defaut') {
      hasDef = true;
      continue;
    }
    const keys = [stem.replace(/[_-]+/g, ' ')];
    if (dfiles.includes(stem + '.md')) {
      const m = read(join(ddir, stem + '.md')).match(/^\s*mots[-\s]?cl[ée]s\s*:\s*(.*)$/im);
      if (!m) warn.push(`decors/${stem}.md n’a pas de ligne « Mots-clés : » : seul le nom du fichier sert de mot-clé`);
      else keys.push(...m[1].split(',').map(x => x.trim()).filter(Boolean));
    } else info.push(`decors/${f} : pas de ${stem}.md, seul « ${keys[0]} » sert de mot-clé`);
    for (const k of keys) {
      const b = nz(k).replace(/\*$/, '');
      if (b.length < 3) warn.push(`decors/${f} : le mot-clé « ${k} » est trop court, il déclenchera à tort`);
      const prev = dkeys.get(b);
      if (prev && prev !== f) info.push(`le mot-clé « ${k} » est partagé par decors/${prev} et decors/${f} : un seul sera choisi`);
      else dkeys.set(b, f);
    }
  } else if (f.endsWith('.md')) {
    if (!dimgs.some(x => x.replace(IMG, '') === f.slice(0, -3)))
      warn.push(`decors/${f} ne correspond à aucune image du même nom (casse comprise) : ignoré`);
  } else warn.push(`decors/${f} n’est ni une image ni un .md : ignoré`);
}
if (dimgs.length) {
  if (!hasDef) info.push('pas de decors/defaut : les lieux non prévus auront un fond généré');
  const ef = existsSync(etatPath) ? read(etatPath).split(/[,\n]/).map(x => nz(x.trim())) : [];
  if (!ef.some(x => /^(lieu|endroit|localisation|position)/.test(x)))
    warn.push('decors/ existe mais etat.md n’a pas de champ « Lieu » : le décor sera deviné d’après le texte');
} else if (chars.some(c => ls(join(pdir, c)).some(i => IMG.test(i) && alpha(join(pdir, c, i)))))
  info.push('personnages détourés mais pas de decors/ : ils seront posés sur un fond généré');

// --- lorebook ---
const ldir = join(dir, 'lorebook');
const entries = ls(ldir).filter(f => f.endsWith('.md'));
for (const f of ls(ldir))
  if (!f.endsWith('.md'))
    warn.push(`lorebook/${f} n’est pas un .md : ignoré` + (statSync(join(ldir, f)).isDirectory() ? ' (les sous-dossiers ne sont pas lus)' : ''));
const seen = new Map();
for (const f of entries) {
  const { got, body } = head(read(join(ldir, f)), 'mots[-\\s]?cl[ée]s|toujours|priorit[ée]');
  const keys = (got.motscles || '').split(',').map(x => x.trim()).filter(Boolean);
  const always = got.toujours !== undefined && !/^(non|false|0)$/i.test(got.toujours);
  if (!keys.length && !always)
    err.push(`lorebook/${f} n’a ni « mots-clés: » ni « toujours: oui » : l’entrée ne sera jamais injectée`);
  if (!body) err.push(`lorebook/${f} n’a que des en-têtes, aucun contenu`);
  if (body.length > 1500) warn.push(`lorebook/${f} fait ${body.length} caractères : scindez-le`);
  for (const k of keys) {
    const base = nz(k).replace(/\*$/, '');
    if (base.length < 3) warn.push(`lorebook/${f} : le mot-clé « ${k} » est trop court, il déclenchera à tort`);
    const prev = seen.get(base);
    if (prev) info.push(`le mot-clé « ${k} » est partagé par ${prev} et ${f}`);
    else seen.set(base, f);
  }
  if (always) info.push(`lorebook/${f} est en « toujours: oui » : il part à chaque tour`);
}

const out = (lbl, arr) => arr.forEach(x => console.log(lbl + ' ' + x));
console.log(
  `\n${name} — ${chars.length} personnage(s), ${fiches} fiche(s), ${dimgs.length} décor(s), ${monstres} monstre(s), ${entries.length} entrée(s) de lorebook\n`
);
out('ERREUR  ', err);
out('ATTENTION', warn);
out('note    ', info);
console.log(`\n${err.length} erreur(s), ${warn.length} avertissement(s).`);
process.exit(err.length ? 1 : 0);
