import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { hit429, note, reset, status, wait } from '../js/rate.js';
import { S } from '../js/state.js';

const hdr = o => ({ get: k => (k in o ? o[k] : null) });

const M = 'modele-test';
beforeEach(() => {
  S.tpm = 0;
  S.tpms = {};
  reset();
});

test('sans en-tête ni réglage, pas de jauge', () => {
  assert.equal(status(M), null);
});

test('les en-têtes de Claude font foi et mémorisent la limite', () => {
  note(
    hdr({
      'anthropic-ratelimit-input-tokens-limit': '8000',
      'anthropic-ratelimit-input-tokens-remaining': '2000',
      'anthropic-ratelimit-requests-remaining': '49'
    }),
    { prompt_tokens: 2100, completion_tokens: 500, prompt_tokens_details: { cached_tokens: 1700 } },
    M,
    true
  );
  const s = status(M);
  assert.equal(s.src, 'api');
  assert.equal(s.lim, 8000);
  assert.ok(s.rem >= 2000 && s.rem < 2100);
  assert.equal(S.tpms[M], 8000);
});

test('en-têtes absents : repli sur la fenêtre glissante locale', () => {
  S.tpm = 8000;
  note(hdr({}), { total_tokens: 2600 }, M);
  const s = status(M);
  assert.equal(s.src, 'local');
  assert.equal(s.rem, 8000 - 2600);
});

test('wait vaut zéro tant que le tour tient dans le reste', () => {
  S.tpm = 8000;
  note(hdr({}), { total_tokens: 2000 }, M);
  assert.equal(wait(3000, M), 0);
  assert.ok(wait(7000, M) > 0);
});

test('un tour plus gros que la limite entière ne fait pas attendre pour rien', () => {
  S.tpm = 8000;
  assert.equal(wait(9000, M), 0);
});

test('le total consommé agrège entrée et sortie', () => {
  S.tpm = 10000;
  note(hdr({}), { prompt_tokens: 1000, completion_tokens: 500 }, M);
  assert.equal(status(M).rem, 8500);
});

test('chaque modèle a son propre compteur', () => {
  S.tpm = 8000;
  note(hdr({}), { total_tokens: 5000 }, 'narration');
  note(hdr({}), { total_tokens: 500 }, 'memoire');
  assert.equal(status('narration').rem, 3000);
  assert.equal(status('memoire').rem, 7500);
});

test('un 429 ne fausse plus la jauge une fois l’envoi passé sans en-têtes', () => {
  S.tpm = 8000;
  hit429(M, 1000);
  assert.ok(wait(3500, M) > 0);
  note(hdr({}), { total_tokens: 1200 }, M, true);
  assert.equal(wait(3500, M), 0);
});

test('la jauge ne recrédite pas de tokens qui n’ont pas quitté la fenêtre', () => {
  note(
    hdr({ 'anthropic-ratelimit-input-tokens-limit': '8000', 'anthropic-ratelimit-input-tokens-remaining': '2000' }),
    { total_tokens: 1200 },
    M,
    true
  );
  const a = status(M).rem;
  const t0 = Date.now();
  while (Date.now() - t0 < 60) {}
  const b = status(M).rem;
  assert.equal(a, b, 'rien ne revient tant que rien ne sort de la fenêtre');
  assert.ok(a <= 2000);
});
