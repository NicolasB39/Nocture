import { effortOk, memModel } from './ai.js';
import { jump, render, tk } from './view.js';
import { PRICES, money, priceOf } from './cost.js';
import { rulesOf } from './dice.js';
import { fr } from './format.js';
import { draw, renameStory, showList } from './list.js';
import { extrasOf, statOn } from './prompt.js';
import { DEFAULT_CHOICE, DEFAULT_FIELDS, conflicts, modelOf } from './protocol.js';
import { fillLec } from './read.js';
import { tocOf } from './scene.js';
import { TERR, getTree, loadCtx } from './scenarios.js';
import { API, S, app, ctx, playerName } from './state.js';
import { clean, put, save, saveSet } from './store.js';
import { $, LS, dlg, el, ic, nz, plain } from './util.js';

const EFF_NOTE = $('#sefn').textContent;
// Modèle et effort du scénario : la note dit ce qui partira vraiment avec le modèle saisi.
const genNotes = () => {
  const def = S.model || API.m,
    m = $('#smo').value.trim() || def;
  $('#smo').placeholder = def;
  $('#sefn').textContent = EFF_NOTE + (!effortOk(m) ? ' ' + m + ' ne prend pas ce réglage en charge : rien n’est envoyé.' : '');
};
$('#smo').oninput = genNotes;
// Ce que coûtent les choix et l'état, mesuré sur les dernières réponses de l'histoire.
const extrasNote = () => {
  const x = extrasOf(app.cur.messages),
    e = $('#sxc');
  if (!x) {
    e.textContent =
      "Les choix et l'état sont réécrits par l'IA à chaque réponse et payés comme sortie. Leur coût s'affichera ici après quelques réponses.";
    return;
  }
  if (!x.ch && !x.st) {
    e.textContent = 'Ni choix ni état dans les dernières réponses : rien à payer en plus.';
    return;
  }
  const pr = priceOf(modelOf()),
    per = pr ? (x.avg * pr[1]) / 1e6 : null,
    tk = v => Math.round(v) + (Math.round(v) > 1 ? ' tokens' : ' token');
  e.textContent =
    'Sur les ' +
    x.n +
    ' dernières réponses : ' +
    [x.ch && 'un bloc de choix ≈ ' + tk(x.ch), x.st && 'un bloc d’état ≈ ' + tk(x.st)].filter(Boolean).join(', ') +
    ', réécrits à chaque réponse, soit ' +
    Math.round(x.share * 100) +
    ' % de la sortie' +
    (per != null ? ' (≈ ' + money(per * 100, S.fx) + ' pour 100 réponses)' : '') +
    '. Décochez ce qui ne vous sert pas.';
};
export function openSc() {
  const c = app.cur.remote ? ctx : app.cur;
  $('#smo').value = app.cur.model || '';
  $('#sef').value = app.cur.effort || '';
  genNotes();
  extrasNote();
  $('#ssys').value = c.system;
  $('#sav').value = c.avatar;
  $('#sint').value = c.intro || '';
  $('#ssys').readOnly = $('#sav').readOnly = $('#sint').readOnly = !!app.cur.remote;
  const cf = conflicts(c.system);
  $('#scw').hidden = !cf.length;
  $('#scw').textContent = cf.length
    ? 'Ce prompt redéfinit ' +
      cf.join(', ') +
      " : l'application s'en charge désormais. Retirez ces consignes pour éviter que l'IA reçoive deux versions du même format."
    : '';
  $('#spre').checked = !!app.cur.noPre;
  $('#snm').value = app.cur.pname || '';
  $('#snm').placeholder = S.pname?.trim() ? S.pname.trim() + ' (nom par défaut)' : '';
  $('#scv').hidden = !!app.cur.remote;
  COVER = app.cur.cover || '';
  cvView();
  $('#sch').checked = !app.cur.noChoices;
  $('#scp').value = app.cur.choicePrompt || '';
  $('#scp').placeholder = DEFAULT_CHOICE;
  // Sans préambule commun, rien à ignorer.
  $('#spre').closest('label').hidden = !S.pre?.trim();
  $('#sst').checked = statOn(app.cur);
  $('#sstf').value = app.cur.statFields || '';
  $('#sstf').placeholder = ctx.stat || DEFAULT_FIELDS;
  imgView();
  if (!$('#ds').open) $('#ds').showModal();
}
// Images détectées du scénario GitHub (section de la feuille Réglages de l'histoire).
function imgView() {
  const im = ctx.images;
  $('#simw').hidden = !app.cur.remote;
  $('#simn').textContent =
    (im.length
      ? im.length + (im.length > 1 ? ' images détectées.' : ' image détectée.')
      : 'Aucune image détectée dans personnages/<Nom>/.') + (TERR ? ' Index : ' + TERR + '.' : '');
  $('#simg').replaceChildren(
    ...im.map(i =>
      el(
        'figure',
        null,
        el('img', { src: i.url, alt: '', loading: 'lazy', decoding: 'async' }),
        el('figcaption', { text: i.code })
      )
    )
  );
}
// Recharger l'index : seuls les champs venus de GitHub sont relus ; ce que vous avez saisi dans la feuille reste.
$('#simr').onclick = async () => {
  await getTree(true);
  await loadCtx();
  if (app.cur.remote) {
    $('#ssys').value = ctx.system;
    $('#sav').value = ctx.avatar;
    $('#sint').value = ctx.intro || '';
  }
  imgView();
  render();
};
$('#mo').onclick = () => {
  $('#mnew').hidden = !app.cur.messages.length;
  $('#msh').hidden = !rulesOf(app.cur).length;
  $('#dmn').showModal();
};
$('#dmnc').onclick = () => $('#dmn').close();
$('#mren').onclick = async () => {
  $('#dmn').close();
  if (await renameStory(app.cur.id)) render();
};
$('#sc').onclick = () => {
  $('#dmn').close();
  openSc();
};
let MM = [];
const memView = () => {
  $('#mml').replaceChildren(
    ...(MM.length
      ? MM.map((t, i) =>
          el(
            'span',
            { class: 'chip2' },
            t,
            el(
              'button',
              {
                'aria-label': 'Retirer',
                onclick: () => {
                  MM.splice(i, 1);
                  memView();
                }
              },
              ic('x', 14)
            )
          )
        )
      : [el('p', { class: 'note', text: 'Aucun souvenir pour le moment.' })])
  );
};
let MC = [];
// Chapitres clos : titre et résumé modifiables.
const chView = () =>
  $('#mch').replaceChildren(
    ...(MC.length
      ? MC.map((c, i) =>
          el(
            'div',
            { class: 'chp' },
            el(
              'div',
              { class: 'row l' },
              el('input', { 'aria-label': 'Titre du chapitre ' + (i + 1), value: c.t, oninput: e => (c.t = e.target.value) }),
              el(
                'button',
                {
                  'aria-label': 'Retirer le chapitre ' + (i + 1),
                  onclick: () => {
                    MC.splice(i, 1);
                    chView();
                  }
                },
                ic('x', 14)
              )
            ),
            el('textarea', { 'aria-label': 'Résumé du chapitre ' + (i + 1), text: c.s, oninput: e => (c.s = e.target.value) })
          )
        )
      : [el('p', { class: 'note', text: 'Aucun chapitre clos. Un chapitre se clôt de lui-même quand un arc s’achève ou qu’un nouveau commence, après 60 messages résumés au moins.' })])
  );
// Mémoire telle qu'à l'ouverture de la feuille : une mise à jour faite entre-temps (summarize, ai.js) ne doit
// pas être écrasée par la copie affichée.
let MO = null;
const memOpen = () => {
  const m = app.cur.mem;
  MO = { c: app.cur, summary: m.summary, memories: m.memories, chapters: m.chapters, upto: m.upto };
  MC = (m.chapters || []).map(c => ({ ...c }));
  chView();
  $('#msul').textContent = MC.length ? 'Résumé du chapitre en cours' : "Résumé de l'histoire";
  $('#msu').value = m.summary;
  MM = [...m.memories];
  $('#mmi').value = '';
  memView();
};
// La note se remplit ici et non dans memOpen : relire la mémoire mise à jour ailleurs ne doit pas effacer la
// note en cours d'écriture. MN : la note à l'ouverture, pour voir si un autre appareil l'a changée depuis.
let MN = '';
$('#mb').onclick = () => {
  $('#dmn').close();
  memOpen();
  $('#nti').value = MN = app.cur.note || '';
  $('#dm').showModal();
};
$('#mma').onclick = () => {
  const v = $('#mmi').value.trim();
  if (!v) return;
  MM.push(v);
  $('#mmi').value = '';
  memView();
};
$('#dmc').onclick = () => $('#dm').close();
$('#dms').onclick = async () => {
  const m = app.cur.mem,
    nt = $('#nti').value,
    // Note changée sur un autre appareil depuis l'ouverture : on ne l'écrase pas sans l'avoir montrée.
    away = (app.cur.note || '') !== MN;
  if (MO.c !== app.cur || m.summary !== MO.summary || m.memories !== MO.memories || m.chapters !== MO.chapters || m.upto !== MO.upto) {
    // La note ne dépend pas du résumé : elle s'enregistre quand même, sauf si elle a changé ailleurs.
    const kept = !away && nt !== MN;
    if (kept) {
      app.cur.note = MN = nt;
      await save();
    }
    // Feuille par-dessus la feuille Mémoire : un toast resterait dessous. Le texte saisi reste en place tant
    // qu'on ne choisit pas de relire.
    if (
      await dlg('Mémoire mise à jour entre-temps', {
        m:
          'Vos modifications de la mémoire ne sont pas enregistrées' +
          (kept ? ' (la note, si)' : '') +
          '. « Relire » affiche la nouvelle version et remplace votre texte' +
          (away ? ', note comprise, changée sur un autre appareil' : '') +
          ' : copiez-le d’abord si besoin.',
        ok: 'Relire',
        no: 'Garder mon texte'
      })
    ) {
      memOpen();
      if (away) $('#nti').value = MN = app.cur.note || '';
    }
    return;
  }
  m.summary = $('#msu').value;
  m.memories = MM;
  m.chapters = MC.map(c => ({ ...c, t: c.t.trim() || 'Sans titre' }));
  app.cur.note = nt;
  await save();
  render();
  $('#dm').close();
};
$('#dsc').onclick = () => $('#ds').close();
$('#dss').onclick = async () => {
  if (!app.cur.remote) {
    app.cur.system = $('#ssys').value;
    app.cur.avatar = $('#sav').value;
    app.cur.intro = $('#sint').value.trim();
  }
  app.cur.pname = $('#snm').value.trim();
  app.cur.cover = COVER;
  app.cur.effort = $('#sef').value;
  app.cur.model = $('#smo').value.trim();
  app.cur.noChoices = !$('#sch').checked;
  app.cur.noPre = $('#spre').checked;
  app.cur.choicePrompt = $('#scp').value.trim();
  app.cur.stat = $('#sst').checked;
  app.cur.statFields = $('#sstf').value.trim();
  await save();
  render();
  $('#ds').close();
};
function openCfg() {
  $('#ck').value = S.key || '';
  $('#cm').value = S.model || '';
  $('#cm').placeholder = API.m;
  $('#cmm').value = S.memModel || '';
  $('#cmm').placeholder = memModel();
  $('#cwa').checked = S.warm !== false;
  $('#cch').checked = !!S.c1h;
  $('#cjr').checked = !!S.journal;
  fillLec();
  $('#crp').value = S.repo || '';
  $('#cpre').value = S.pre || '';
  $('#cpn').value = S.pname || '';
  $('#ctc').checked = !!S.counters;
  $('#sto').textContent = '';
  Promise.all([
    navigator.storage?.estimate?.() || null,
    navigator.storage?.persisted?.() ?? null
  ])
    .then(([e, p]) => {
      if (!e) return;
      const mo = x => (x / 1048576).toFixed(1).replace('.', ',') + ' Mo';
      $('#sto').textContent =
        'Sur cet appareil : ' +
        mo(e.usage || 0) +
        (e.quota ? ' utilisés sur ' + mo(e.quota) + ' disponibles' : ' utilisés') +
        ' · conservation accordée par le navigateur : ' +
        (p ? 'oui' : 'non, les données peuvent être effacées si l’espace manque') +
        '.';
    })
    .catch(() => {});
  $('#dc').showModal();
}
$('#cfg').onclick = openCfg;
$('#akb').onclick = openCfg;
$('#cfg2').onclick = () => {
  $('#dmn').close();
  openCfg();
};
// Modèles proposés dans les champs Modèle : ceux dont le tarif est connu (cost.js) ; un autre se tape à la main.
$('#cml').replaceChildren(
  ...Object.keys(PRICES)
    .filter(m => !m.includes(' '))
    .map(m => el('option', { value: m }))
);
$('#im').onclick = () => $('#imf').click();
$('#imf').onchange = async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  let d;
  try {
    d = JSON.parse(await f.text());
  } catch (x) {
    return dlg('Fichier invalide');
  }
  // Passé la lecture du fichier, une panne vient de l'enregistrement : le message le dit.
  try {
    const a = (Array.isArray(d?.scenarios) ? d.scenarios : []).map(clean).filter(Boolean),
      // Modèle et effort choisis par l'histoire : ils décident du coût de chaque tour, le dire avant d'importer.
      own = [...new Set(a.flatMap(x => [x.model, x.effort && 'effort ' + x.effort]).filter(Boolean))];
    if (!a.length) return dlg('Aucune histoire dans ce fichier');
    if (
      !(await dlg('Importer ' + a.length + (a.length > 1 ? ' histoires ?' : ' histoire ?'), {
        m:
          'Celles qui ont le même identifiant seront remplacées.' +
          (own.length ? ' Réglages propres à ces histoires : ' + own.join(', ') + ' (modifiables dans leurs réglages).' : ''),
        ok: 'Importer'
      }))
    )
      return;
    // Date d'origine gardée (une vieille sauvegarde ne doit pas passer pour la version la plus récente),
    // mais repère « vu » oublié : si la version en ligne diffère, la synchronisation suivante garde l'une
    // des deux en copie « (conflit) » au lieu d'écraser l'autre. Histoire supprimée puis restaurée : datée
    // juste après sa marque de suppression, sinon elle serait de nouveau effacée.
    for (const x of a) {
      const tb = S.tomb?.[x.id];
      if (tb) {
        x.updated = Math.max(x.updated, tb + 1);
        delete S.tomb[x.id];
      }
      if (S.bkSeen) delete S.bkSeen[x.id];
      await put(x);
    }
    await saveSet();
    $('#dc').close();
    showList();
  } catch (x) {
    dlg('Import interrompu', { m: x?.message || String(x) });
  }
};
$('#dcc').onclick = () => $('#dc').close();
$('#dcs').onclick = async () => {
  S.key = $('#ck').value.trim();
  S.model = $('#cm').value.trim();
  S.memModel = $('#cmm').value.trim();
  S.c1h = $('#cch').checked;
  S.warm = $('#cwa').checked;
  const rp = $('#crp').value.trim();
  if (rp !== (S.repo || '')) LS.del('tree');
  S.repo = rp;
  S.pre = $('#cpre').value.trim();
  S.pname = $('#cpn').value.trim();
  S.counters = $('#ctc').checked;
  S.journal = $('#cjr').checked;
  await saveSet();
  $('#dc').close();
  // Le nom par défaut peut changer le texte affiché ({{user}}) : la conversation se redessine.
  if (app.cur) {
    render();
    tk();
  } else draw();
};

const SNIP = (t, q) => {
  const i = nz(t).indexOf(q);
  if (i < 0) return t.slice(0, 90);
  const a = Math.max(0, i - 30);
  return (a ? '…' : '') + t.slice(a, i + q.length + 60).trim() + '…';
};
const hit = (role, text, onGo) =>
  el(
    'button',
    { class: 'hit', onclick: onGo },
    el('span', { class: 'who', text: role == 'user' ? 'Joueur' : 'Récit' }),
    el('span', { text })
  );
function srRun() {
  const q = nz($('#sri').value.trim());
  if (q.length < 2) {
    $('#srn').textContent = 'Saisissez au moins deux caractères.';
    $('#srl').replaceChildren();
    return;
  }
  const nm = playerName(app.cur);
  const r = app.cur.messages
    .map((m, i) => ({ m, i, t: plain(m.content, nm) }))
    .filter(x => nz(x.t).includes(q))
    .slice(-60)
    .reverse();
  $('#srn').textContent = r.length
    ? r.length + (r.length > 1 ? ' messages trouvés.' : ' message trouvé.')
    : 'Aucun résultat.';
  $('#srl').replaceChildren(
    ...r.map(x =>
      hit(x.m.role, SNIP(x.t, q), () => {
        $('#dsr').close();
        jump(x.i);
      })
    )
  );
}
$('#mf').onclick = () => {
  $('#dmn').close();
  $('#sri').value = '';
  $('#srn').textContent = '';
  $('#srl').replaceChildren();
  $('#dsr').showModal();
  $('#sri').focus();
};
let srT;
$('#sri').oninput = () => {
  clearTimeout(srT);
  srT = setTimeout(srRun, 180);
};
$('#dsrc').onclick = () => $('#dsr').close();
// Sommaire : une frise des scènes du récit (lieu, tours) sous le titre de leur chapitre ; toucher une scène y
// mène. Un chapitre clos montre la première ligne de son résumé, en entier avec « Lire ». Sans lieu dans l'état,
// la liste des lignes récentes de la mémoire.
$('#msm').onclick = () => {
  $('#dmn').close();
  const L = app.cur.mem.lines || [],
    T = tocOf(app.cur.messages),
    // Titres des chapitres, chacun avant la première scène (ou ligne) qui suit son début ; le dernier est celui
    // en cours.
    C = app.cur.mem.chapters || [],
    H = C.length ? [...C.map((c, k) => ({ from: k ? C[k - 1].upto : 0, t: c.t, s: c.s })), { from: C.at(-1).upto }] : [];
  let hk = 0;
  const heads = i => {
      const h = [];
      for (; hk < H.length && H[hk].from <= i; hk++) {
        const c = H[hk],
          n = 'Chapitre ' + (hk + 1);
        if (!c.t) {
          h.push(el('div', { class: 'chh' }, el('p', { class: 'chk', text: n + ' · en cours' })));
          continue;
        }
        const s = el('p', { class: 'chs', text: c.s }),
          more = el('button', { class: 'chm', 'aria-expanded': 'false' }, 'Lire');
        more.onclick = () => {
          const o = s.classList.toggle('open');
          more.setAttribute('aria-expanded', String(o));
          more.textContent = o ? 'Replier' : 'Lire';
        };
        h.push(el('div', { class: 'chh' }, el('p', { class: 'chk', text: n }), el('p', { class: 'chi', text: c.t }), ...(c.s ? [s, more] : [])));
      }
      return h;
    },
    go = i => () => {
      $('#dsm').close();
      if (i >= 0) jump(i);
    },
    // Scène de la frise : lieu et tours ; la dernière, en cours, est marquée.
    node = s =>
      el(
        'button',
        { class: 'tln' + (s.cur ? ' cur' : ''), onclick: go(s.from) },
        el('span', { class: 'tll', text: fr(s.lieu || (s.k ? 'Scène sans lieu' : 'Début')) }),
        el('span', { class: 'tlm', text: ' · ' + s.turns + (s.turns > 1 ? ' tours' : ' tour') }),
        s.cur ? el('span', { class: 'tlh', text: 'Vous êtes ici' }) : null
      );
  $('#sml').classList.toggle('tl', !!T);
  $('#smn').textContent = T
    ? 'Une ligne par lieu, dans l’ordre du récit. Touchez une scène pour y aller.'
    : 'Une ligne par message déjà résumé. Touchez pour y aller. Avec un champ « Lieu » dans le panneau d’état, le sommaire se range par scènes.';
  if (T)
    // Titre d'un chapitre devant la scène où il commence, même si elle a commencé avant lui.
    $('#sml').replaceChildren(...T.flatMap((s, j) => [...heads(j + 1 < T.length ? T[j + 1].from - 1 : Infinity), node(s)]));
  else
    $('#sml').replaceChildren(
      ...(L.length
        ? L.flatMap((x, j) => [
            ...(x.i >= 0 ? heads((L.slice(j + 1).find(y => y.i >= 0)?.i ?? Infinity) - 1) : []),
            hit('assistant', x.t, go(x.i))
          ])
        : [el('p', { class: 'note', text: 'Le sommaire se remplit à mesure que la mémoire résume les messages.' })])
    );
  $('#dsm').showModal();
  $('#sml .tln.cur')?.scrollIntoView({ block: 'nearest' });
};
$('#dsmc').onclick = () => $('#dsm').close();

const shrink = f =>
  new Promise(res => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const w = Math.min(600, im.width),
          h = Math.round((im.height * w) / im.width),
          c = document.createElement('canvas'),
          g = c.getContext('2d');
        c.width = w;
        c.height = h;
        g.drawImage(im, 0, 0, w, h);
        const u = c.toDataURL('image/webp', 0.75);
        if (u.startsWith('data:image/webp')) return res(u);
        // Safari n'encode pas le WebP et rendrait un PNG plusieurs fois plus lourd : JPEG, sans transparence,
        // sur le fond de l'application plutôt que sur du noir.
        g.fillStyle = '#0a0a0b';
        g.fillRect(0, 0, w, h);
        g.drawImage(im, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', 0.8));
      };
      im.onerror = () => res('');
      im.src = r.result;
    };
    r.onerror = () => res('');
    r.readAsDataURL(f);
  });
let COVER = '';
const cvView = () => {
  $('#scvi').hidden = !COVER;
  $('#scvi').src = COVER || '';
  $('#scvx').hidden = !COVER;
  $('#scva').textContent = COVER ? 'Changer' : 'Choisir une image';
};
$('#scva').onclick = () => $('#scvf').click();
$('#scvx').onclick = () => {
  COVER = '';
  cvView();
};
$('#scvf').onchange = async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const d = await shrink(f);
  if (!d) {
    dlg('Image illisible');
    return;
  }
  COVER = d;
  cvView();
};
