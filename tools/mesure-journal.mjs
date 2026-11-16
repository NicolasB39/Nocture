// Mesure la dernière séance d'un journal d'appels exporté par l'application (Journal des appels › Exporter).
//
//   node tools/mesure-journal.mjs journal.json [--toutes]
//
// Le journal garde les 100 derniers appels, souvent de plusieurs séances : sans --toutes, seuls les appels qui suivent
// la dernière pause de plus d'une heure comptent. La réponse d'un tour se lit dans l'historique de l'appel suivant
// (la dernière réponse de la séance manque donc). Les choix ne sont pas dans le journal.
import { readFileSync } from 'node:fs';

const [file, opt] = process.argv.slice(2);
if (!file) {
  console.error('Usage : node tools/mesure-journal.mjs journal.json [--toutes]');
  process.exit(1);
}
let calls = JSON.parse(readFileSync(file, 'utf8')).calls;
if (opt !== '--toutes') {
  let cut = 0;
  for (let i = 1; i < calls.length; i++) if (calls[i].t - calls[i - 1].t > 3600e3) cut = i;
  calls = calls.slice(cut);
}
const txt = m => (typeof m.content == 'string' ? m.content : m.content.map(p => p.text || '').join('\n'));
const etat = u => {
  const m = u.match(/<etat_precedent>\s*<etat>([\s\S]*?)<\/etat>/),
    o = {};
  for (const l of m ? m[1].split('\n') : []) {
    const k = l.match(/^\s*([^:]+):\s*(.*)$/);
    if (k) o[k[1].trim()] = k[2].trim();
  }
  return o;
};
const words = s => s.split(/\s+/).filter(Boolean).length;
const tours = calls.filter(c => c.kind == 'tour' || c.kind == 'continuer');
const rows = tours.map((c, n) => {
  const u = txt(c.body.messages.at(-1)),
    next = tours[n + 1]?.body.messages;
  return {
    user: u.split(/\n\n<(?:passages_anciens|etat_precedent|inventaire_actuel|liens)/)[0].trim(),
    before: etat(u),
    after: next ? etat(txt(next.at(-1))) : {},
    resp: next && next.length >= 2 ? txt(next.at(-2)).replace(/\{\{[^}]*\}\}/g, '').trim() : null,
    effort: c.body.output_config?.effort || '-',
    out: c.e?.[1] || 0
  };
});
const R = rows.filter(r => r.resp);
const day = r => (r.before.Jour || '?').split(/[,(—–]/)[0].trim();
const t0 = new Date(calls[0].t).toLocaleString('fr-FR'),
  model = [...new Set(calls.map(c => c.key))].join(', ');
console.log(`Séance du ${t0} : ${rows.length} tours, ${calls.filter(c => c.kind == 'mémoire').length} appels mémoire, ${model}`);
console.log(`Effort : ${[...new Set(rows.map(r => r.effort))].join(', ')} ; sortie moyenne ${Math.round(rows.reduce((s, r) => s + r.out, 0) / rows.length)} tokens`);

// Rythme : tours par jour et par lieu (une scène = une suite de tours au même lieu).
console.log('\n# Rythme');
for (const d of [...new Set(rows.map(day))]) {
  const rs = rows.filter(r => day(r) == d),
    lieux = [];
  for (const r of rs) {
    const l = (r.before.Lieu || '?').split(',')[0];
    if (lieux.at(-1)?.[0] !== l) lieux.push([l, 0]);
    lieux.at(-1)[1]++;
  }
  console.log(`Jour ${d} : ${rs.length} tours, ${rs[0].before.Heure || '?'} → ${(rs.at(-1).after.Heure || rs.at(-1).before.Heure) ?? '?'}`);
  console.log('   ' + lieux.map(([l, n]) => `${l} (${n})`).join(' › '));
}

// Joueur et jets.
console.log('\n# Joueur et jets');
const isJet = u => /^<jet>/.test(u);
const libres = rows.filter(r => r.user && !isJet(r.user) && !/^\*|^«/.test(r.user));
console.log(`Messages : ${rows.filter(r => isJet(r.user)).length} jets, ${libres.length} écrits sans geste ni réplique, ${rows.length} en tout`);
rows.forEach((r, n) => {
  if (!isJet(r.user)) return;
  const ask = rows[n - 1]?.resp;
  console.log(`   tour ${n} : ${r.user.replace(/<\/?jet>/g, '')} (demande en ${ask ? words(ask) : '?'} mots)`);
});

// Personnages et images.
console.log('\n# Personnages');
const names = {};
// Un nom propre se reconnaît au milieu d'une phrase, après un mot en minuscules.
for (const r of R) for (const m of r.resp.matchAll(/(?<=\p{Ll},? )(\p{Lu}\p{Ll}+)/gu)) names[m[1]] = (names[m[1]] || 0) + 1;
const fiches = Object.entries(names).filter(([n, k]) => k >= 5 && R.filter(r => r.resp.includes(n)).length >= 3);
console.log(fiches.sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n]) => `${n} : ${R.filter(r => r.resp.includes(n)).length} réponses`).join(' ; '));

// Style.
console.log('\n# Style');
const W = R.map(r => words(r.resp)).sort((a, b) => a - b);
console.log(`Réponses : ${R.length}, médiane ${W[W.length >> 1]} mots (de ${W[0]} à ${W.at(-1)})`);
const comme = R.map(r => (r.resp.match(/\bcomme\b/gi) || []).length);
console.log(`« comme » : ${comme.reduce((s, x) => s + x, 0)}, dans ${comme.filter(Boolean).length} réponses, 2 ou plus dans ${comme.filter(x => x > 1).length}`);
const sents = r => r.split(/(?<=[.!?…»*\]])\s+/).map(s => s.replace(/[*«»]/g, '').trim()).filter(s => s.length > 3);
const STOP = new Set('dans avec pour vous votre elle elles ils sont plus sans sous cette entre comme mais tout tous rien encore même puis vers chez leur leurs avant après depuis contre fait était avait'.split(' '));
const kw = s => new Set((s.toLowerCase().match(/\p{L}{4,}/gu) || []).filter(w => !STOP.has(w)));
const ends = R.map(r => sents(r.resp).at(-1) || '');
const echo = ends.map((e, i) => (i < 2 ? [] : [...kw(e)].filter(w => kw(ends[i - 1]).has(w) || kw(ends[i - 2]).has(w))));
console.log(`Fins qui reprennent un mot des deux fins précédentes : ${echo.filter(x => x.length).length} sur ${Math.max(0, ends.length - 2)}`);
for (const [i, w] of echo.entries()) if (w.length) console.log(`   ${i} [${w.join(', ')}] ${ends[i].slice(0, 100)}`);
const gest = {};
for (const r of R)
  for (const m of r.resp.matchAll(/\b(\p{Lu}\p{Ll}+) (ne \p{Ll}+ pas|\p{Ll}+ \p{Ll}+)/gu)) gest[m[1] + ' ' + m[2]] = (gest[m[1] + ' ' + m[2]] || 0) + 1;
console.log('Gestes répétés : ' + Object.entries(gest).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([g, n]) => `${g} (${n})`).join(' ; '));
const tri = {};
for (const r of R) {
  const w = r.resp.toLowerCase().match(/\p{L}+/gu) || [],
    seen = new Set();
  for (let i = 0; i + 2 < w.length; i++) {
    const t = w.slice(i, i + 3);
    if (t.filter(x => x.length >= 4).length < 2) continue;
    const k = t.join(' ');
    if (!seen.has(k)) seen.add(k), (tri[k] = (tri[k] || 0) + 1);
  }
}
console.log('Expressions dans 5 réponses ou plus : ' + Object.entries(tri).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([g, n]) => `${g} (${n})`).join(' ; '));
const notes = R.filter(r => /^Lieu:|\[Situation/m.test(r.resp)).length;
console.log(`Réponses avec un état ou une note de jeu recopiés dans le récit : ${notes}`);

// Heures citées dans le récit, à comparer au panneau.
console.log('\n# Heures du récit');
const H = /[^.!?»\n]*(?:\b\d{1,2}\s?h\s?\d{0,2}\b|\bminuit\b|\bmidi\b|\bil reste [^.]*heures?\b)[^.!?«\n]*/gi;
rows.forEach((r, n) => {
  const hits = r.resp?.replace(/^\s*\p{L}[^:\n]*:.*$/gmu, '').match(H);
  if (hits && r.after.Heure) console.log(`   tour ${n}, panneau ${r.after.Heure} : ${hits.map(s => s.trim().slice(0, 90)).join(' | ')}`);
});

// Mémoire.
console.log('\n# Mémoire');
const sys = tours.at(-1).body.system.map(s => s.text).join('\n');
const sit = (sys.match(/Situation actuelle : ([\s\S]*?)\n<\/previous_history>/) || [])[1] || '';
const items = ((sys.match(/<long_term_memory>([\s\S]*?)<\/long_term_memory>/) || [])[1] || '').split('\n').filter(l => l.startsWith('- '));
console.log(`Situation : ${sit.length} caractères ; souvenirs : ${items.length}, dont ${items.filter(l => /^- Jour\s*\d/i.test(l)).length} datés « Jour N : »`);
console.log('   ' + sit.slice(0, 300));
