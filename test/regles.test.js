import './stub.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { loadCtx } from '../js/scenarios.js';
import { app, ctx } from '../js/state.js';
import { ikey as appKey } from '../js/util.js';
import { IMG, codeOf, ikey } from '../skills/scenario-histoires/scripts/regles.mjs';

// Le vérificateur du skill recopie les règles de nommage de l'application (il doit rester autonome) : sur chaque
// scénario du dépôt, il doit trouver exactement les codes d'images que l'application propose à l'IA.
test('vérificateur et application donnent les mêmes codes d’images sur tous les scénarios', async () => {
  const tree = execFileSync('git', ['-c', 'core.quotepath=off', 'ls-files', 'scenarios'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  globalThis.fetch = async u => (u == 'index.json' ? { ok: true, json: async () => tree } : { ok: true, text: async () => '' });
  const folders = [...new Set(tree.map(p => p.split('/')[1]))];
  assert.ok(folders.length > 3);
  for (const s of folders) {
    const want = [];
    for (const p of tree) {
      const [, f, kind, a, b] = p.split('/');
      if (f != s || !IMG.test(p)) continue;
      if (kind == 'personnages' && b && !p.split('/')[5]) want.push(codeOf(a, b.replace(IMG, '')));
      else if (kind == 'monstres' && a && !b) want.push(codeOf('monstre', a.replace(IMG, '')));
    }
    app.cur = { remote: true, folder: s };
    await loadCtx();
    assert.deepEqual(ctx.images.map(i => appKey(i.code)).sort(), want.sort(), s);
  }
  assert.equal(ikey('  Anguille Géante.v2 '), appKey('  Anguille Géante.v2 '), 'même normalisation');
});
