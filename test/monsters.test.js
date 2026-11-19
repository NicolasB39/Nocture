import './stub.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCtx } from '../js/scenarios.js';
import { IMG, app, ctx } from '../js/state.js';

test('monstres/ : codes monstre_<fichier>, à plat, sans prendre le code d’un personnage', async () => {
  const b = 'scenarios/S/',
    tree = [
      b + 'systeme.md',
      b + 'personnages/Monstre/noye.webp',
      b + 'monstres/noye.webp',
      b + 'monstres/Anguille Géante.webp',
      b + 'monstres/monstre_crabe.png',
      b + 'monstres/sous/cerf.webp',
      b + 'monstres/notes.md'
    ];
  globalThis.fetch = async u => (u == 'index.json' ? { ok: true, json: async () => tree } : { ok: true, text: async () => '' });
  app.cur = { remote: true, folder: 'S' };
  await loadCtx();
  // Le personnage garde monstre_noye, le monstre du même code est écarté. Le préfixe n'est pas doublé, les
  // sous-dossiers et les fichiers qui ne sont pas des images sont ignorés.
  assert.deepEqual(ctx.monsters, ['monstre_anguille géante', 'monstre_crabe']);
  assert.equal(IMG.monstre_noye, encodeURI(b + 'personnages/Monstre/noye.webp'));
  assert.equal(IMG.monstre_anguille_geante, encodeURI(b + 'monstres/Anguille Géante.webp'));
  assert.equal(IMG.monstre_crabe, encodeURI(b + 'monstres/monstre_crabe.png'));
});
