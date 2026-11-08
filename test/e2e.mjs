import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const T = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
};
const srv = createServer(async (q, r) => {
  const p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (p == '/__blank') return r.end('<!doctype html><title>x</title>');
  try {
    const b = await readFile(join(process.cwd(), normalize(p == '/' ? '/index.html' : p)));
    r.writeHead(200, { 'Content-Type': T[extname(p)] || 'application/octet-stream' }).end(b);
  } catch {
    r.writeHead(404).end();
  }
}).listen(0);
const base = 'http://localhost:' + srv.address().port;

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
// Comme la vraie API : un message qui porte un champ inconnu (un repère interne, cut ou effBefore) fait refuser
// la requête.
const FIELDS = ['role', 'content'];
const strict = q => {
  const i = (JSON.parse(q.postData() || '{}').messages || []).findIndex(m => Object.keys(m).some(k => !FIELDS.includes(k)));
  return i < 0
    ? null
    : route =>
        route.fulfill({
          status: 400,
          headers: { ...CORS, 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'messages.' + i + ' : champ inconnu' } })
        });
};
const wait = ms => new Promise(r => setTimeout(r, ms));
// Attente d'une condition dans la page. page.waitForFunction recompose son prédicat avec eval dans la
// page dès qu'il doit patienter, ce que la politique de sécurité de l'appli (script-src sans
// 'unsafe-eval') refuse. page.evaluate passe par le protocole du navigateur, hors CSP : on interroge
// donc la page à intervalles, et les tests tournent sous la CSP réelle.
const until = async (page, fn, arg, timeout = 20000) => {
  const end = Date.now() + timeout;
  while (!(await page.evaluate(fn, arg))) {
    if (Date.now() > end) throw new Error('délai dépassé en attendant : ' + String(fn).slice(0, 120));
    await wait(50);
  }
};
const story = n =>
  Array.from({ length: n }, () => '*Il lève les yeux.* La pluie tombe sur la ville, lente et grise, et personne ne parle.').join('\n\n') +
  '\n\n<choix>\n1. *Je recule.* Non.\n2. *J’avance.* Oui.\n3. *J’attends.* Peut-être.\n</choix>';
const antSSE = t =>
  [
    { type: 'message_start', message: { usage: { input_tokens: 40, cache_read_input_tokens: 3000, cache_creation_input_tokens: 120, output_tokens: 1 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    ...t.match(/[\s\S]{1,200}/g).map(c => ({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: c } })),
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 300 } },
    { type: 'message_stop' }
  ]
    .map(e => 'event: ' + e.type + '\ndata: ' + JSON.stringify(e) + '\n\n')
    .join('');

const GH = new Map(),
  ghLog = [];
let sha = 0;
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
// Sauvegarde existante, faite depuis un autre appareil : une histoire absente de celui-ci.
GH.set('histoires-backup/index.json', {
  text: JSON.stringify({ v: 2, saved: 5000, items: [{ id: 'zz', name: 'Distante', updated: 5000, remote: false, n: 1, cv: '' }], tomb: {} }),
  sha: 's0'
});
GH.set('histoires-backup/zz.json', {
  text: JSON.stringify({ id: 'zz', name: 'Distante', updated: 5000, messages: [{ role: 'user', content: 'Bonjour distant' }], cv: '' }),
  sha: 's00'
});
const github = async route => {
  const q = route.request();
  if (q.method() == 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  const m = new URL(q.url()).pathname.match(/^\/repos\/me\/bk\/contents\/(.+)$/);
  const json = (status, o) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(o) });
  if (!m) return json(404, { message: 'Not Found' });
  const p = decodeURI(m[1]);
  if (q.method() == 'GET') {
    const f = GH.get(p);
    if (f) return json(200, { encoding: 'base64', content: b64(f.text), sha: f.sha });
    const kids = [...GH.keys()].filter(k => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/'));
    return kids.length
      ? json(200, kids.map(k => ({ name: k.slice(p.length + 1), type: 'file', sha: GH.get(k).sha })))
      : json(404, { message: 'Not Found' });
  }
  const b = JSON.parse(q.postData() || '{}'),
    f = GH.get(p);
  if (f && b.sha !== f.sha) return json(409, { message: 'conflict' });
  ghLog.push(q.method() + ' ' + p);
  if (q.method() == 'DELETE') {
    GH.delete(p);
    return json(200, {});
  }
  GH.set(p, { text: Buffer.from(b.content, 'base64').toString('utf8'), sha: 's' + ++sha });
  return json(200, { content: { sha: 's' + sha } });
};

let delay = 0,
  antReq = null,
  pg = null,
  antFail = false,
  antN = 0;
// PW_CHANNEL=msedge (ou chrome) : navigateur déjà installé, sans le Chromium de Playwright.
const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
const errors = [];
const watch = pg => pg.on('pageerror', e => errors.push(e.message));
const step = async (name, fn) => {
  await fn();
  console.log('ok -', name);
};

try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  pg = await ctx.newPage();
  watch(pg);
  await ctx.route('https://api.github.com/**', github);
  await ctx.route('https://api.anthropic.com/**', async route => {
    const q = route.request();
    if (q.method() == 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const bad = strict(q);
    if (bad) return bad(route);
    antN++;
    antReq = { h: q.headers(), b: JSON.parse(q.postData()) };
    if (antFail)
      return route.fulfill({
        status: 400,
        headers: { ...CORS, 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'Requête refusée (test)' } })
      });
    await wait(delay);
    route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'text/event-stream', 'anthropic-ratelimit-input-tokens-limit': '30000', 'anthropic-ratelimit-input-tokens-remaining': '29000' },
      body: antSSE(story(5))
    });
  });
  const done = () => pg.waitForSelector('#send:not([hidden])', { timeout: 20000 });
  const send = async t => {
    const n = await pg.locator('#msgs .m.assistant').count();
    await pg.fill('#inp', t);
    await pg.click('#send');
    await until(
      pg,
      n => document.querySelectorAll('#msgs .m.assistant').length > n && !document.querySelector('#send').hidden,
      n
    );
    await wait(200);
  };
  // Histoire locale (scénario hors GitHub, comme après un import) : ouverte, avec sa feuille de réglages.
  const newLocal = async name => {
    await pg.evaluate(async n => {
      const s = { id: 'loc' + Date.now(), name: n, updated: Date.now(), system: 'Nous jouons une enquête.', avatar: '', messages: [] };
      await (await import('/js/store.js')).put(s);
      await (await import('/js/bus.js')).emit('open', s.id);
    }, name);
    await pg.waitForSelector('#chat:not([hidden])');
    await pg.click('#mo');
    await pg.click('#sc');
    await pg.waitForSelector('#ds[open]');
  };

  await step('démarrage sans erreur', async () => {
    await pg.goto(base + '/index.html');
    await until(pg, () => window.__started);
    assert.equal(await pg.evaluate(() => (window.__missing ? window.__missing.size : 0)), 0);
  });

  await step('retour Android : ferme la feuille sans quitter la liste', async () => {
    await pg.click('#cfg');
    assert.ok(await pg.evaluate(() => document.querySelector('#dc').open));
    await pg.evaluate(() => history.back());
    await until(pg, () => !document.querySelector('#dc').open);
    assert.ok(await pg.isVisible('#list'));
    await pg.click('#cfg');
    await pg.click('#dcc');
    await wait(150);
    assert.ok(!(await pg.evaluate(() => history.state?.d)));
  });

  await step('toast au-dessus d’une feuille ouverte ; le toast permanent revient après un passager', async () => {
    await pg.click('#cfg');
    const top = await pg.evaluate(async () => {
      const { toast } = await import('/js/util.js');
      toast('Version', { keep: 1, label: 'Recharger', fn() {} });
      toast('Passager');
      const t = document.querySelector('#toast'),
        r = t.getBoundingClientRect();
      return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('#toast') === t;
    });
    assert.ok(top, 'le toast n’est pas sous la feuille');
    assert.match(await pg.textContent('#toast'), /Passager/);
    await until(pg, () => /Version/.test(document.querySelector('#toast').textContent), null, 5000);
    assert.ok(
      await pg.evaluate(() => {
        const t = document.querySelector('#toast');
        return t.closest('dialog') && t.parentNode.lastElementChild !== t;
      }),
      'le toast ne prend pas la place de la barre du bas'
    );
    await pg.click('#dcc');
    await until(pg, () => {
      const t = document.querySelector('#toast');
      return !t.closest('dialog:not([open])') && t.matches(':popover-open') && /Version/.test(t.textContent);
    }, null, 3000);
    await pg.click('#toast button');
    assert.ok(await pg.evaluate(() => document.querySelector('#toast').hidden));
  });

  await step('envoi, réponse et choix', async () => {
    await pg.click('#cfg');
    await pg.fill('#ck', 'k');
    await pg.evaluate(() => (document.querySelector('#ctc').checked = true));
    await pg.click('#dcs');
    await newLocal('Test');
    await pg.fill('#sint', 'Une nuit de tempête.\n- Je frappe à la porte.\n- J\'observe la plage.');
    await pg.click('#dss');
    await pg.waitForSelector('#ds', { state: 'hidden' });
    // Histoire vide : titre, accroche et débuts proposés.
    assert.equal(await pg.textContent('.intro .ith'), 'Test');
    assert.match(await pg.textContent('.intro .itp'), /Une nuit de tempête/);
    assert.deepEqual(await pg.locator('.intro .cht .chx').allTextContents(), ['Je frappe à la porte.', 'J’observe la plage.']);
    await send('Bonjour');
    assert.equal(await pg.locator('.intro').count(), 0, 'l’introduction disparaît au premier tour');
    await send('Je regarde autour de moi.');
    assert.equal(await pg.locator('#msgs .m.assistant').count(), 2);
    assert.ok((await pg.locator('.ch').count()) > 0);
    assert.deepEqual(await pg.locator('.ch .chn').allTextContents(), ['1', '2', '3']);
    assert.equal(await pg.locator('.ch .chr').first().locator('button').count(), 2, 'envoyer et modifier');
  });

  await step('affichage progressif identique au rendu complet', async () => {
    const bad = await pg.evaluate(async () => {
      const { body, paintLive } = await import('/js/format.js');
      const t =
        '*Il entre.* La porte grince.\n\n> Une voix : « Qui va là ? »\n\n---\n\n{{img::inconnue}}\n\nElle **recule**, _lentement_.\nPuis se tait.\n\nFin.\n\n<etat>\nLieu: Hall\n</etat>\n\n<choix>\n1. *Je salue.* Bonsoir.\n</choix>';
      const b = document.createElement('div'),
        z = { fl: 0, fn: 0, ft: '' },
        ref = document.createElement('div'),
        out = [];
      for (let i = 1; i <= t.length; i += 1 + (i % 7)) {
        const v = t.slice(0, i);
        paintLive(b, v, z, null);
        ref.replaceChildren(...body(v));
        if (b.innerHTML !== ref.innerHTML) out.push(i);
      }
      return { out, frozen: z.fl };
    });
    assert.deepEqual(bad.out, []);
    assert.ok(bad.frozen > 0);
  });

  await step('l’écran ne bouge pas pendant la réponse', async () => {
    delay = 3500;
    await pg.evaluate(() => {
      window.T = [];
      window.iv = setInterval(() => {
        const u = [...document.querySelectorAll('#msgs .m.user')].at(-1);
        if (u) T.push(Math.round(u.getBoundingClientRect().top));
      }, 50);
    });
    await pg.fill('#inp', 'J’avance.');
    await pg.click('#send');
    await wait(400);
    await pg.evaluate(() => (T.length = 0));
    // Attente : sans personnage en scène, « Réflexion… » sur des lignes fantômes.
    assert.match(await pg.textContent('#live .wt .act'), /^Réflexion…/);
    assert.equal(await pg.locator('#live .wts i').count(), 3);
    await done();
    await wait(500);
    const tops = await pg.evaluate(() => (clearInterval(iv), [...new Set(T)]));
    delay = 0;
    assert.equal(tops.length, 1, 'positions : ' + tops);
  });

  // Longue histoire : seuls les app.LIM derniers messages sont affichés, et le plus ancien sort par le haut
  // quand la réponse arrive. Fenêtre réduite à 4 pour le provoquer avec peu de messages.
  await step('longue histoire : l’écran ne bouge pas quand un message sort par le haut', async () => {
    delay = 2500;
    await pg.evaluate(async () => {
      (await import('/js/state.js')).app.LIM = 4;
      window.T = [];
      window.iv = setInterval(() => {
        const u = [...document.querySelectorAll('#msgs .m.user')].at(-1);
        if (u) T.push(Math.round(u.getBoundingClientRect().top));
      }, 50);
    });
    await pg.fill('#inp', 'J’attends.');
    await pg.click('#send');
    await wait(400);
    const first = await pg.evaluate(() => document.querySelector('#msgs .m[data-i]').dataset.i);
    await pg.evaluate(() => (T.length = 0));
    await done();
    await wait(500);
    const r = await pg.evaluate(async () => {
      clearInterval(iv);
      const out = { tops: [...new Set(T)], first: document.querySelector('#msgs .m[data-i]').dataset.i };
      (await import('/js/state.js')).app.LIM = 50;
      (await import('/js/view.js')).render();
      return out;
    });
    delay = 0;
    assert.notEqual(r.first, first, 'un message est bien sorti par le haut');
    // Calage sur un élément : positions fractionnaires, défilement arrondi au pixel selon le navigateur.
    assert.ok(Math.max(...r.tops) - Math.min(...r.tops) <= 1, 'positions : ' + r.tops);
  });

  const db = () =>
    pg.evaluate(async () => {
      const st = await import('/js/store.js');
      const a = (await st.getAll()).find(x => x.name == 'Test');
      return (await st.getOne(a.id)).messages.map(m => (m.alts ? m.alts.length : 0));
    });
  await step('les variantes ne restent que sur le dernier message', async () => {
    await pg.locator('#msgs .m[data-i] [aria-label="Régénérer"]').last().click();
    await done();
    await pg.waitForSelector('.a .n');
    assert.equal((await db()).at(-1), 2);
    await send('Je continue.');
    assert.deepEqual((await db()).filter(Boolean), []);
  });

  const msgsOf = () =>
    pg.evaluate(async () => {
      const st = await import('/js/store.js');
      const a = (await st.getAll()).find(x => x.name == 'Test');
      return (await st.getOne(a.id)).messages.map(m => [m.role, m.content]);
    });
  // Certaines relances partent après une écriture en base : on attend la requête, puis la fin de la réponse.
  const answered = async n0 => {
    const end = Date.now() + 20000;
    while (antN <= n0) {
      if (Date.now() > end) throw new Error('aucune requête partie');
      await wait(50);
    }
    await until(pg, () => !document.querySelector('#send').hidden);
    await wait(200);
  };
  await step('erreur : le bouton Réessayer relance sans doubler le tour', async () => {
    antFail = true;
    const users = await pg.locator('#msgs .m.user[data-i]').count();
    await pg.fill('#inp', 'Je tente.');
    await pg.click('#send');
    await pg.waitForSelector('#err.e button');
    assert.equal(await pg.textContent('#err.e button'), 'Réessayer');
    antFail = false;
    const n0 = antN;
    await pg.click('#err.e button');
    await answered(n0);
    assert.equal(await pg.textContent('#err'), '');
    assert.equal(await pg.locator('#msgs .m.user[data-i]').count(), users + 1);
    assert.equal((await msgsOf()).at(-1)[0], 'assistant');
  });

  await step('régénérer avec une indication (clic droit) : envoyée une fois, jamais enregistrée', async () => {
    const n0 = antN;
    await pg.locator('#msgs .m[data-i] [aria-label="Régénérer"]').last().click({ button: 'right' });
    await pg.waitForSelector('#dq[open]');
    await pg.fill('#dqi', 'plus court');
    await pg.click('#dqo');
    await answered(n0);
    const last = antReq.b.messages.at(-1).content;
    assert.match(last, /<indication>[\s\S]*plus court/);
    assert.ok(!JSON.stringify(await msgsOf()).includes('indication'));
    assert.equal(await pg.textContent('.a .n'), '2/2');
    const n1 = antN;
    await pg.locator('#msgs .m[data-i] [aria-label="Régénérer"]').last().click();
    await answered(n1);
    assert.ok(!antReq.b.messages.at(-1).content.includes('<indication>'), 'l’indication ne reste pas');
  });

  await step('modifier et renvoyer un tour : la suite est remplacée', async () => {
    const before = await msgsOf(),
      i = before.map(m => m[0]).lastIndexOf('user');
    // Les actions d'un ancien message n'apparaissent qu'au survol (ou au toucher).
    const old = pg.locator('#msgs .m[data-i="' + i + '"]');
    await pg.mouse.move(0, 0);
    await wait(250);
    assert.equal(await old.locator('.a').evaluate(e => getComputedStyle(e).opacity), '0');
    await old.locator('.b').hover();
    // La barre apparaît à côté de la bulle, jamais sur le texte.
    const [bb, ab] = await Promise.all([old.locator('.b').boundingBox(), old.locator('.a').boundingBox()]);
    assert.ok(ab.x + ab.width <= bb.x, 'barre à gauche de la bulle : ' + JSON.stringify({ bb, ab }));
    await old.locator('[aria-label="Autres actions"]').click();
    assert.ok(await pg.isVisible('#maw'));
    await pg.click('#maw');
    assert.match(await pg.textContent('#den'), /réponse suivante sera remplacée/);
    assert.equal(await pg.textContent('#des'), 'Renvoyer');
    await pg.fill('#et', 'Je tente autre chose.');
    const n0 = antN;
    await pg.click('#des');
    await answered(n0);
    const after = await msgsOf();
    assert.equal(after.length, before.length);
    assert.deepEqual(after[i], ['user', 'Je tente autre chose.']);
    assert.ok(antReq.b.messages.at(-1).content.startsWith('Je tente autre chose.'));
    // Le menu d'une réponse ne propose pas « Modifier et renvoyer ».
    await pg.locator('#msgs .m.assistant[data-i] [aria-label="Autres actions"]').last().click();
    assert.ok(!(await pg.isVisible('#maw')));
    await pg.click('#damc');
  });

  await step('pastille « Nouveau message » quand la réponse arrive hors de vue', async () => {
    delay = 2500;
    await pg.fill('#inp', 'Je remonte lire.');
    await pg.click('#send');
    await wait(300);
    await pg.evaluate(() => (document.querySelector('#msgs').scrollTop = 0));
    await until(pg, () => !document.querySelector('#newm').hidden);
    assert.match(await pg.textContent('#newm'), /Réponse en cours/);
    await until(pg, () => !document.querySelector('#send').hidden);
    delay = 0;
    await wait(200);
    assert.match(await pg.textContent('#newm'), /Nouveau message/);
    await pg.click('#newm');
    await until(pg, () => document.querySelector('#newm').hidden);
  });

  await step('Claude : en-têtes, marqueurs de cache et compteur', async () => {
    await pg.click('#mo');
    await pg.click('#cfg2');
    assert.ok(await pg.isVisible('#cch'));
    await pg.fill('#ck', 'sk-test');
    await pg.click('#dcs');
    await pg.waitForSelector('#dc', { state: 'hidden' });
    await send('Je parle à Claude.');
    const { h, b } = antReq;
    assert.equal(h['x-api-key'], 'sk-test');
    assert.equal(h['anthropic-version'], '2026-10-21');
    for (const k of ['temperature', 'top_p', 'top_k']) assert.ok(!(k in b), k + ' envoyé à Claude');
    assert.equal(h['anthropic-dangerous-direct-browser-access'], 'true');
    assert.equal(b.model, 'claude-sonnet-5-5');
    // Relais en cas de refus, avec son en-tête bêta.
    assert.equal(b.fallbacks, 'default');
    assert.equal(h['anthropic-beta'], 'server-side-fallback-2026-07-01');
    assert.ok(b.system.length >= 1 && b.system[0].cache_control?.type == 'ephemeral' && b.system.at(-1).cache_control);
    assert.ok(
      [...b.system, ...b.messages.flatMap(m => (Array.isArray(m.content) ? m.content : []))].filter(x => x.cache_control).length <= 4
    );
    assert.equal(b.messages[0].role, 'user');
    assert.equal(b.messages.at(-2).content[0].cache_control.type, 'ephemeral');
    assert.equal(typeof b.messages.at(-1).content, 'string');
    assert.ok(b.messages.every((m, i) => !i || m.role !== b.messages[i - 1].role));
    const tk = await pg.textContent('#tk');
    assert.match(tk, /lus en cache/);
    assert.match(tk, /mis en cache/);
    // Pastille courte avec le coût du tour ; le détail s'ouvre en la touchant.
    assert.match(await pg.textContent('#tk .tks'), /tokens · [\d,]+ \$ ce tour/);
    assert.ok(!(await pg.isVisible('#tk .tkl')));
    await pg.click('#tk .tks');
    assert.ok(await pg.isVisible('#tk .tkl'));
    await pg.click('#tk .tkl');
    assert.ok(await pg.isVisible('#tk .tks'));
    assert.match(await pg.locator('#msgs .m.assistant[data-i]').last().textContent(), /pluie/);
    // Statistiques : la part de l'entrée lue et écrite en cache est affichée.
    await pg.evaluate(async () => (await import('/js/statview.js')).openStats('session'));
    assert.match(await pg.textContent('#usv'), /dont [\d\s  ]+ lus en cache, [\d\s  ]+ mis en cache/);
    await pg.click('#usc');
  });

  await step('journal des appels : requêtes gardées, cache relu, fin de requête détaillée', async () => {
    await pg.click('#mo');
    await pg.click('#cfg2');
    await pg.evaluate(() => (document.querySelector('#cjr').checked = true));
    await pg.click('#dcs');
    await pg.waitForSelector('#dc', { state: 'hidden' });
    await send('Premier tour journalisé.');
    await send('Second tour journalisé.');
    await pg.evaluate(async () => (await import('/js/statview.js')).openStats('session'));
    await pg.click('#usj');
    await pg.waitForSelector('#djr[open]');
    await until(pg, () => document.querySelectorAll('#jrl .scg').length >= 2);
    assert.match(await pg.textContent('#jrl .scg .sct'), /tour · sonnet-5-5/);
    assert.match(await pg.textContent('#jrl .scg .scm'), /lus en cache/);
    await pg.click('#jrl .scg .sch');
    // Détail lu à l'ouverture, avec les requêtes complètes.
    await until(pg, () => !/Lecture…/.test(document.querySelector('#jrl .scg .scb').textContent));
    const d = await pg.textContent('#jrl .scg .scb');
    assert.match(d, /préfixe identique/);
    assert.match(d, /Dernier message du joueur/);
    const raw = await pg.evaluate(async () => {
      const st = await import('/js/store.js');
      return JSON.stringify([await st.getCalls(), await st.getCallBody((await st.getCalls()).at(-1).k)]);
    });
    assert.ok(raw.includes('Second tour journalisé.'), 'requête gardée en entier');
    assert.ok(!raw.includes('sk-test'), 'jamais la clé API');
    // Au-delà de 100 appels, les plus anciens partent, requête comprise.
    const kept = await pg.evaluate(async () => {
      const st = await import('/js/store.js');
      const k0 = (await st.getCalls())[0].k;
      for (let i = 0; i < 101; i++) await st.addCall({ t: i, kind: 'test', body: { i } });
      const c = await st.getCalls();
      return [c.length, c[0].t, await st.getCallBody(c[0].k), (await st.getCallBody(k0)) ?? null];
    });
    assert.deepEqual(kept, [100, 1, { i: 1 }, null]);
    await pg.evaluate(async () => (await import('/js/store.js')).clearCalls());
    await pg.click('#jrc');
    await pg.click('#usc');
  });

  const syncDone =() => until(pg, () => !document.querySelector('#sy').classList.contains('spin'));
  await step('synchronisation : envoi des histoires locales, réception de la distante', async () => {
    await pg.click('#back');
    await pg.waitForSelector('#list:not([hidden])');
    await pg.click('#cfg');
    await pg.click('summary:has-text("GitHub et sauvegarde")');
    await pg.click('#bko');
    await pg.check('#bp');
    await pg.fill('#bgr', 'me/bk');
    await pg.fill('#bgt', 'tok');
    await pg.click('#bkv');
    await wait(300);
    await syncDone();
    const files = [...GH.keys()].sort();
    assert.ok(files.includes('histoires-backup/index.json'), files.join(' '));
    assert.ok(files.includes('histoires-backup/zz.json'));
    const idx = JSON.parse(GH.get('histoires-backup/index.json').text);
    assert.equal(idx.v, 2);
    assert.ok(idx.items.some(x => x.name == 'Test'));
    assert.ok(idx.items.some(x => x.name == 'Distante'));
    await pg.waitForSelector('text=Distante');
  });

  await step('synchronisation : seuls les fichiers modifiés sont envoyés', async () => {
    ghLog.length = 0;
    await pg.click('#sy');
    await wait(300);
    await syncDone();
    assert.deepEqual(ghLog, []);
    await pg.locator('.menu').first().click();
    await pg.click('#mr');
    await pg.fill('#dqi', 'Renommée');
    await pg.click('#dqo');
    await wait(200);
    await pg.click('#sy');
    await wait(300);
    await syncDone();
    assert.equal(ghLog.length, 2, ghLog.join(', '));
    assert.ok(ghLog.includes('PUT histoires-backup/index.json'));
  });

  await step('synchronisation : la couverture part à part, une seule fois', async () => {
    await newLocal('Couv');
    await pg.setInputFiles('#scvf', {
      name: 'c.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNk+M/AwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==', 'base64')
    });
    await pg.waitForSelector('#scvi:not([hidden])');
    await pg.click('#dss');
    await pg.click('#back');
    await pg.waitForSelector('#list:not([hidden])');
    await wait(300);
    await syncDone();
    const cv = [...GH.keys()].filter(x => x.endsWith('.cover.json'));
    assert.equal(cv.length, 1, [...GH.keys()].join(', '));
    const f = cv[0].replace('.cover.json', '.json'),
      d = JSON.parse(GH.get(f).text);
    assert.ok(!('cover' in d) && d.cv, 'histoire sans couverture intégrée');
    assert.match(JSON.parse(GH.get(cv[0]).text).d, /^data:image\/webp/);
    ghLog.length = 0;
    await pg.click('[aria-label="Options de Couv"]');
    await pg.click('#mr');
    await pg.fill('#dqi', 'Couv 2');
    await pg.click('#dqo');
    await wait(200);
    await pg.click('#sy');
    await wait(300);
    await syncDone();
    assert.deepEqual(ghLog.sort(), ['PUT ' + f, 'PUT histoires-backup/index.json'].sort());
  });

  await step('journal des appels : envoi sur GitHub, ignoré par la synchronisation', async () => {
    await pg.evaluate(async () => (await import('/js/store.js')).addCall({ t: Date.now(), kind: 'tour', sid: 'x', body: { messages: [{ role: 'user', content: 'Envoyé sur GitHub.' }] } }));
    await pg.click('#usb');
    await pg.waitForSelector('#dus[open]');
    await pg.click('#usj');
    await pg.waitForSelector('#jrg:not([hidden])');
    await pg.click('#jrg');
    await until(pg, () => document.querySelector('#jrg').textContent == 'Envoyer sur GitHub' && !document.querySelector('#jrg').disabled);
    const k = [...GH.keys()].find(x => /^histoires-backup\/journal\/journal-[\d-]+\.json$/.test(x));
    assert.ok(k, 'fichier envoyé : ' + [...GH.keys()].join(', '));
    assert.equal(JSON.parse(GH.get(k).text).calls.at(-1).body.messages[0].content, 'Envoyé sur GitHub.');
    await pg.click('#jrc');
    await pg.click('#usc');
    ghLog.length = 0;
    await pg.click('#sy');
    await syncDone();
    assert.ok(!ghLog.some(x => x.includes('journal')), 'la synchronisation ne touche pas au journal : ' + ghLog.join(', '));
    assert.ok(GH.has(k));
  });

  await step('décors : scène aux 2/3, décor du moment, repli et fenêtre Personnages', async () => {
    const c3 = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' }),
      p3 = await c3.newPage();
    watch(p3);
    await p3.goto(base + '/__blank');
    const png = async (w, h, kind) =>
      Buffer.from(
        (
          await p3.evaluate(
            ([w, h, kind]) => {
              const c = document.createElement('canvas');
              c.width = w;
              c.height = h;
              const g = c.getContext('2d');
              if (kind != 'cut') {
                g.fillStyle = kind == 'flat' ? '#345' : kind;
                g.fillRect(0, 0, w, h);
              }
              if (kind == 'cut' || kind == 'flat') {
                g.fillStyle = '#c84';
                g.beginPath();
                g.ellipse(w / 2, h * 0.525, w * 0.2, h * 0.425, 0, 0, 7);
                g.fill();
              }
              return c.toDataURL('image/png');
            },
            [w, h, kind]
          )
        ).split(',')[1],
        'base64'
      );
    const F = {
      'scenarios/demo/systeme.md': 'Narrateur.',
      'scenarios/demo/personnages/Alice/alice.png': await png(100, 200, 'cut'),
      'scenarios/demo/personnages/Bob/bob.png': await png(100, 200, 'flat'),
      'scenarios/demo/decors/taverne.png': await png(800, 450, '#a33'),
      'scenarios/demo/decors/taverne.md': 'Mots-clés : auberge, comptoir',
      'scenarios/demo/decors/defaut.png': await png(800, 450, '#33a'),
      'scenarios/nu/systeme.md': 'Narrateur.',
      'scenarios/nu/personnages/Alice/alice.png': await png(100, 200, 'cut')
    };
    await c3.route(base + '/index.json', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.keys(F)) })
    );
    await c3.route(base + '/scenarios/**', r => {
      const p = decodeURI(new URL(r.request().url()).pathname.slice(1)),
        b = F[p];
      return b == null
        ? r.fulfill({ status: 404 })
        : r.fulfill({ status: 200, contentType: p.endsWith('.png') ? 'image/png' : 'text/plain; charset=utf-8', body: b });
    });
    const R = [];
    await c3.route('https://api.anthropic.com/**', r =>
      r.request().method() == 'OPTIONS'
        ? r.fulfill({ status: 204, headers: CORS })
        : (strict(r.request()) || (x => x.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/event-stream' }, body: antSSE(R.shift() || 'Fin.') })))(r)
    );
    const say = async (t, r) => {
      R.push(r);
      const n = await p3.locator('#msgs .m.assistant[data-i]').count();
      await p3.fill('#inp', t);
      await p3.click('#send');
      await until(
        p3,
        n => document.querySelectorAll('#msgs .m.assistant[data-i]').length > n && !document.querySelector('#send').hidden,
        n
      );
      await wait(200);
    };
    const last = async kind => {
      const l = p3.locator('#msgs .m[data-i] .scn').last();
      await l.scrollIntoViewIfNeeded();
      await p3.waitForSelector('#msgs .m[data-i]:last-of-type .scn.' + kind + ', #msgs .m[data-i] .scn.' + kind);
      return p3.evaluate(() => {
        const s = [...document.querySelectorAll('#msgs .m[data-i] .scn')].at(-1),
          r = s.getBoundingClientRect(),
          i = s.querySelector('.chr').getBoundingClientRect(),
          d = s.querySelector('.dec');
        return {
          cut: s.classList.contains('cut'),
          flat: s.classList.contains('flat'),
          dec: d.querySelector('img')?.getAttribute('src') || (d.classList.contains('art') ? 'généré' : ''),
          decShown: getComputedStyle(d).display != 'none',
          ratio: r.width / r.height,
          full: Math.abs(r.width - document.querySelector('#msgs').clientWidth) < 2,
          hfrac: (i.height * 0.85) / r.height,
          cx: (i.left + i.width / 2 - r.left) / r.width,
          feet: i.top + i.height * 0.95 - r.bottom,
          head: (i.top + i.height * 0.1 - r.top) / r.height
        };
      });
    };
    await p3.goto(base + '/index.html');
    await until(p3, () => window.__started);
    await p3.click('#cfg');
    await p3.fill('#ck', 'k');
    await p3.click('#dcs');
    await p3.waitForSelector('#dc', { state: 'hidden' });
    await p3.click('.ttl:text-is("demo")');
    await p3.waitForSelector('#chat:not([hidden])');

    await say('J’entre.', 'Elle sourit.\n\n{{img::alice_alice}}\n\nLe comptoir brille.\n\n<etat>\nLieu: Auberge du Pont\n</etat>');
    let g = await last('cut');
    assert.match(g.dec, /decors\/taverne\.png$/, 'décor par mot-clé');
    // L'image réellement utilisée par la feuille de style : une adresse relative y serait résolue depuis css/.
    assert.equal(
      await p3.evaluate(() => getComputedStyle(document.querySelector('#chat header.dk'), '::before').backgroundImage),
      'url("' + base + '/scenarios/demo/decors/taverne.png")',
      'en-tête teinté par le décor du moment'
    );
    assert.equal(await p3.locator('#msgs .m.lt').count(), 1, 'lettrine sur la première réponse');
    assert.ok(Math.abs(g.ratio - 16 / 9) < 0.05, 'format de la scène : ' + g.ratio);
    assert.ok(g.full, 'scène pleine largeur');
    assert.equal(await p3.textContent('#msgs .m[data-i="1"] .scn .scap'), 'Auberge du Pont');
    // Cadrage aux genoux par défaut : silhouette à 130 % de la hauteur, haut de la silhouette à 3 %.
    assert.ok(Math.abs(g.hfrac - 1.3) < 0.03, 'hauteur du personnage : ' + g.hfrac);
    assert.ok(Math.abs(g.head - 0.03) < 0.01, 'haut de la silhouette à ' + g.head);
    assert.ok(Math.abs(g.cx - 2 / 3) < 0.02, 'centre à ' + g.cx);
    // Réglage de lecture (Réglages de l'application) : en pied, 90 % de la hauteur, pieds au bas de l'image,
    // appliqué tout de suite.
    await p3.click('#mo');
    await p3.click('#cfg2');
    await p3.waitForSelector('#dc[open]');
    await p3.click('#dc summary:has-text("Lecture")');
    await p3.check('#lfb');
    await p3.click('#dcc');
    await p3.waitForSelector('#dc', { state: 'hidden' });
    g = await last('cut');
    assert.ok(Math.abs(g.hfrac - 0.9) < 0.03, 'en pied, hauteur du personnage : ' + g.hfrac);
    assert.ok(Math.abs(g.feet) < 2, 'en pied, pieds à ' + g.feet + ' px du bas');

    await say('Qui est là ?', 'Bob arrive.\n\n{{img::bob_bob}}');
    g = await last('flat');
    assert.ok(g.flat && !g.decShown, 'image non détourée affichée seule');
    await p3.waitForSelector('#pe.pea .pav');
    assert.match(await p3.getAttribute('#pe', 'aria-label'), /Personnages en scène : .*Bob/, 'Bob en scène dans l’en-tête');

    // Lieu annoncé en tête de réponse : lu pendant l'affichage, jamais montré.
    await say('Je pars.', '<lieu>Volcan</lieu>\n\nUn volcan gronde.\n\n{{img::alice_alice}}\n\n<etat>\nLieu: Volcan\n</etat>');
    assert.doesNotMatch(await p3.textContent('#msgs'), /<\/?lieu/, 'balise <lieu> invisible');
    g = await last('cut');
    assert.match(g.dec, /decors\/defaut\.png$/, 'lieu inconnu : fond par défaut');
    assert.deepEqual(
      await p3.locator('#msgs .m.lt').evaluateAll(es => es.map(e => +e.dataset.i)),
      [1, 5],
      'lettrine au changement de lieu, pas à chaque réponse'
    );
    assert.deepEqual(await p3.locator('#msgs .scene').allTextContents(), ['Auberge du Pont', 'Volcan'], 'intertitres de lieu');
    // Sommaire en frise : une entrée par lieu, la dernière en cours ; toucher une scène mène au récit.
    await p3.click('#mo');
    await p3.click('#msm');
    await p3.waitForSelector('#dsm[open]');
    assert.deepEqual(await p3.locator('#sml .tln .tll').allTextContents(), ['Auberge du Pont', 'Volcan']);
    assert.match(await p3.textContent('#sml .tln.cur'), /Volcan · 1 tours*Vous êtes ici/);
    assert.equal(await p3.locator('#sml .tln.cur').count(), 1, 'une seule scène en cours');
    await p3.locator('#sml .tln').first().click();
    await p3.waitForSelector('#dsm', { state: 'hidden' });
    assert.equal(
      await p3.evaluate(() => document.querySelector('#msgs .scene + .m')?.dataset.i),
      '0',
      'la première scène s’annonce en tête du récit'
    );
    assert.match(
      await p3.locator('#msgs .m[data-i] .scn .dec img').first().getAttribute('src'),
      /taverne\.png$/,
      'l’ancienne scène garde son décor'
    );

    // Chapitres : titres au-dessus des scènes dans le Sommaire, relus et corrigés dans la feuille Mémoire.
    await p3.evaluate(async () => {
      const { app } = await import('/js/state.js');
      app.cur.mem.chapters = [{ t: 'L’auberge', s: 'Arrivée à l’auberge.', upto: 4 }];
    });
    await p3.click('#mo');
    await p3.click('#msm');
    await p3.waitForSelector('#dsm[open]');
    assert.deepEqual(await p3.locator('#sml .chh .chk').allTextContents(), ['Chapitre 1', 'Chapitre 2 · en cours']);
    assert.equal(await p3.textContent('#sml .chi'), 'L’auberge');
    await p3.click('#sml .chm');
    assert.equal(await p3.textContent('#sml .chm'), 'Replier', 'le résumé du chapitre s’ouvre en entier');
    await p3.click('#dsmc');
    await p3.click('#mo');
    await p3.click('#mb');
    await p3.waitForSelector('#dm[open]');
    assert.equal(await p3.inputValue('#mch .chp input'), 'L’auberge');
    assert.equal(await p3.textContent('#msul'), 'Résumé du chapitre en cours');
    await p3.fill('#mch .chp textarea', 'Corrigé.');
    await p3.click('#dms');
    await p3.waitForSelector('#dm', { state: 'hidden' });
    assert.equal(await p3.evaluate(async () => (await import('/js/state.js')).app.cur.mem.chapters[0].s), 'Corrigé.');

    await p3.locator('#msgs .m[data-i] .scn').first().click();
    await p3.waitForSelector('#dpic[open] .scn.big');
    await p3.click('#dpic');
    await p3.waitForSelector('#dpic', { state: 'hidden' });
    await wait(100);
    assert.equal(await p3.locator('#dpic .scn').count(), 0);

    await p3.click('#pe');
    await p3.waitForSelector('#dpe[open] .pav.scn.av.cut');
    await p3.waitForSelector('#dpe[open] .pav.scn.av.flat');
    const av = await p3.evaluate(() => {
      const s = document.querySelector('#dpe .pav.scn.cut'),
        r = s.getBoundingClientRect(),
        i = s.querySelector('.chr').getBoundingClientRect();
      return (i.left + i.width / 2 - r.left) / r.width;
    });
    assert.ok(Math.abs(av - 0.5) < 0.03, 'pastille centrée : ' + av);
    await p3.click('#pec');

    await p3.click('#back');
    await p3.waitForSelector('#list:not([hidden])');
    await p3.click('.ttl:text-is("nu")');
    await p3.waitForSelector('#chat:not([hidden])');
    await say('Bonjour.', 'Elle attend.\n\n{{img::alice_alice}}');
    g = await last('cut');
    assert.equal(g.dec, 'généré', 'scénario sans décor : fond généré');
    await c3.close();
  });

  assert.deepEqual(errors, []);
  console.log('tous les tests de bout en bout sont passés');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
  if (pg)
    try {
      await pg.screenshot({ path: 'e2e-echec.png' });
      console.error(
        'état :',
        await pg.evaluate(() => ({
          err: document.querySelector('#err')?.textContent,
          tk: document.querySelector('#tk')?.textContent,
          ouvertes: [...document.querySelectorAll('dialog[open]')].map(d => d.id),
          histoire: history.state,
          envoi: !document.querySelector('#send')?.hidden
        }))
      );
    } catch {}
} finally {
  await browser.close();
  srv.close();
}
