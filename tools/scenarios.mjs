// Vérifie tous les scénarios avec le vérificateur du skill ; échoue si l'un d'eux a une erreur (la CI ne publie pas).
// Les avertissements sont comptés, pas bloquants.
//
//   npm run scenarios
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

let bad = 0;
for (const d of readdirSync('scenarios', { withFileTypes: true }).filter(e => e.isDirectory())) {
  const r = spawnSync(process.execPath, ['skills/scenario-histoires/scripts/verifier.mjs', 'scenarios/' + d.name], { encoding: 'utf8' });
  const last = r.stdout.trim().split('\n').at(-1);
  console.log(`${r.status ? 'ÉCHEC' : 'ok   '} ${d.name} : ${last}`);
  if (r.status) (bad++, console.log(r.stdout + r.stderr));
}
process.exit(bad ? 1 : 0);
