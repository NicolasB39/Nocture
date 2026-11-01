import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { hit429, last, note, reset, status, wait } from '../js/rate.js';

const hdr = o => ({ get: k => (k in o ? o[k] : null) });
const lim = (l, r) => hdr({ 'anthropic-ratelimit-input-tokens-limit': String(l), 'anthropic-ratelimit-input-tokens-remaining': String(r) });
const u = (i, read = 0, write = 0, out = 0) => ({ in: i, out, read, write });

const M = 'modele-test';
beforeEach(() => reset());

test('sans en-tête, pas de jauge', () => {
  note(hdr({}), u(2600), M);
  assert.equal(status(M), null);
  assert.equal(wait(3000, M), 0);
});

test('les en-têtes de Claude font foi ; le cache lu ne compte pas dans la limite', () => {
  note(
    hdr({
      'anthropic-ratelimit-input-tokens-limit': '8000',
      'anthropic-ratelimit-input-tokens-remaining': '2000',
      'anthropic-ratelimit-requests-remaining': '49'
    }),
    u(2100, 1700, 50, 500),
    M,
    true
  );
  const s = status(M);
  assert.equal(s.lim, 8000);
  assert.equal(s.req, 49);
  assert.ok(s.rem >= 2000 - 400 && s.rem <= 2000);
  assert.deepEqual({ ...last }, { cached: 1700, wrote: 50 });
});

test('wait vaut zéro tant que le tour tient dans le reste ; un tour plus gros que la limite n’attend pas', () => {
  note(lim(8000, 5000), u(0), M);
  assert.equal(wait(3000, M), 0);
  assert.ok(wait(7000, M) > 0);
  assert.equal(wait(9000, M), 0);
});

test('chaque modèle a sa propre jauge', () => {
  note(lim(8000, 3000), u(0), 'narration');
  note(lim(4000, 3500), u(0), 'memoire');
  assert.equal(status('narration').rem, 3000);
  assert.equal(status('memoire').rem, 3500);
});

test('un 429 vide la jauge jusqu’à la réponse suivante', () => {
  note(lim(8000, 8000), u(0), M);
  hit429(M, 1000);
  assert.ok(wait(3500, M) > 0);
  note(hdr({}), u(1200), M, true);
  assert.equal(status(M), null, 'sans en-tête, plus de jauge plutôt qu’une jauge fausse');
  note(lim(8000, 6800), u(0), M);
  assert.equal(wait(3500, M), 0);
});

test('la jauge ne recrédite pas de tokens qui n’ont pas quitté la fenêtre', () => {
  note(lim(8000, 2000), u(1200), M, true);
  const a = status(M).rem;
  const t0 = Date.now();
  while (Date.now() - t0 < 60) {}
  assert.equal(status(M).rem, a, 'rien ne revient tant que rien ne sort de la fenêtre');
  assert.ok(a <= 2000);
});
