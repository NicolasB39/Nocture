import { effortOk, memModel } from './ai.js';
import { on } from './bus.js';
import { jump, render, tk } from './view.js';
import { PRICES, money, priceOf } from './cost.js';
import { fr } from './format.js';
import { draw, showList } from './list.js';
import { effortSet, extrasOf, statOn } from './prompt.js';
import { DEFAULT_FIELDS, conflicts, modelOf } from './protocol.js';
import { fillLec, setReading } from './read.js';
import { reset as rlReset } from './rate.js';
import { tocOf } from './scene.js';
import { TERR, coverOf, getTree, loadCtx } from './scenarios.js';
import { API, S, app, ctx } from './state.js';
import { clean, put, save, saveSet } from './store.js';
import { $, LS, dlg, el, ic, num, nz, pickAccent, toast } from './util.js';

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
// Couleur d'accent du scénario ; vide : celle de l'appli.
const ACC0 = '#e8b45c';
let ACC = '';
const accView = () => {
  $('#sacc').value = ACC || ACC0;
  $('#sacx').hidden = !ACC;
  $('#sacn').textContent = ACC
    ? 'Liseré de vos tours, numéros des choix, lettrine et bouton d’envoi prennent cette couleur dans cette histoire.'
    : 'Couleur de l’appli. Choisissez-en une, ou tirez-la de la couverture.';
};
$('#sacc').oninput = () => {
  ACC = $('#sacc').value.toLowerCase();
  accView();
};
$('#sacx').onclick = () => {
  ACC = '';
  accView();
};
$('#saca').onclick = async () => {
  const src = COVER || coverOf(app.cur);
  if (!src) {
    toast('Pas de couverture pour cette histoire');
    return;
  }
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = Object.assign(document.createElement('canvas'), { width: 32, height: 32 }),
      g = c.getContext('2d');
    g.drawImage(img, 0, 0, 32, 32);
    const h = pickAccent(g.getImageData(0, 0, 32, 32).data);
    if (!h) throw new Error('image trop sombre');
    ACC = h;
    accView();
  } catch (e) {
    toast('Impossible de lire la couverture');
  }
};
export function openSc() {
  const c = app.cur.remote ? ctx : app.cur;
  ACC = app.cur.accent || '';
  accView();
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
  $('#scv').hidden = !!app.cur.remote;
  COVER = app.cur.cover || '';
  cvView();
  $('#smx').value = app.cur.maxTok || '';
  $('#smm').value = app.cur.memN ?? '';
  $('#srcl').value = app.cur.recallN ?? '';
  $('#sld').value = app.cur.loreDepth || '';
  $('#slm').value = app.cur.loreMax || '';
  $('#sch').checked = !app.cur.noChoices;
  $('#sfb').checked = !!app.cur.fullBody;
  $('#sgs').checked = !app.cur.noStyle;
  $('#scp').value = app.cur.choicePrompt || '';
  $('#sst').checked = statOn(app.cur);
  $('#sstf').value = app.cur.statFields || '';
  $('#sstf').placeholder = ctx.stat || DEFAULT_FIELDS;
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
  if (!$('#ds').open) $('#ds').showModal();
}
on('settings:open', openSc);
$('#simr').onclick = async () => {
  await getTree(true);
  await loadCtx();
  openSc();
  render();
};
$('#mo').onclick = () => $('#dmn').showModal();
$('#dmnc').onclick = () => $('#dmn').close();
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
// Mémoire telle qu'à l'ouverture de la feuille : une mise à jour faite entre-temps (summarize, ai.js) ne doit
// pas être écrasée par la copie affichée.
let MO = null;
const memOpen = () => {
  const m = app.cur.mem;
  MO = { c: app.cur, summary: m.summary, memories: m.memories, upto: m.upto };
  $('#msu').value = m.summary;
  MM = [...m.memories];
  $('#mmi').value = '';
  memView();
};
$('#mb').onclick = () => {
  $('#dmn').close();
  memOpen();
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
  const m = app.cur.mem;
  if (MO.c !== app.cur || m.summary !== MO.summary || m.memories !== MO.memories || m.upto !== MO.upto) {
    // Feuille par-dessus la feuille Mémoire : un toast resterait dessous. Le texte saisi reste en place tant
    // qu'on ne choisit pas de relire.
    if (
      await dlg('Mémoire mise à jour entre-temps', {
        m: 'Vos modifications ne sont pas enregistrées. « Relire » affiche la nouvelle version et remplace votre texte : copiez-le d’abord si besoin.',
        ok: 'Relire',
        no: 'Garder mon texte'
      })
    )
      memOpen();
    return;
  }
  m.summary = $('#msu').value;
  m.memories = MM;
  await save();
  render();
  $('#dm').close();
};
$('#nt').onclick = () => {
  $('#dmn').close();
  $('#nti').value = app.cur.note || '';
  $('#dn').showModal();
};
$('#dnc').onclick = () => $('#dn').close();
$('#dns').onclick = async () => {
  app.cur.note = $('#nti').value;
  await save();
  $('#dn').close();
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
  app.cur.accent = ACC;
  app.cur.maxTok = +$('#smx').value || 0;
  effortSet(app.cur, $('#sef').value);
  app.cur.model = $('#smo').value.trim();
  app.cur.memN = num('#smm');
  app.cur.recallN = num('#srcl');
  app.cur.loreDepth = +$('#sld').value || 0;
  app.cur.loreMax = +$('#slm').value || 0;
  app.cur.noChoices = !$('#sch').checked;
  app.cur.fullBody = $('#sfb').checked;
  app.cur.noStyle = !$('#sgs').checked;
  app.cur.noPre = $('#spre').checked;
  app.cur.choicePrompt = $('#scp').value.trim();
  app.cur.stat = $('#sst').checked;
  app.cur.statFields = $('#sstf').value.trim();
  await save();
  render();
  $('#ds').close();
};
const streamInfo = () => {
  const x = app.stream;
  if (!x) return 'Aucune réponse reçue pour le moment dans cette session.';
  const sec = (x.ms / 1000).toFixed(1).replace('.', ',');
  if (x.mode == 'off') return 'Dernière réponse : le streaming est désactivé dans ces réglages.';
  if (x.chunks < 4)
    return (
      'Dernière réponse : diffusée en ' +
      x.chunks +
      (x.chunks > 1 ? ' morceaux' : ' morceau') +
      ' seulement (' +
      sec +
      ' s). Le modèle envoie de gros morceaux ou a réfléchi avant de répondre.'
    );
  return 'Dernière réponse : diffusée en ' + x.chunks + ' morceaux (' + sec + ' s).';
};
function openCfg() {
  $('#ck').value = S.key || '';
  $('#cm').value = S.model || '';
  $('#cm').placeholder = API.m;
  $('#cmm').value = S.memModel || '';
  $('#cmm').placeholder = memModel();
  $('#cwa').checked = S.warm !== false;
  $('#cn').checked = !!S.noStream;
  $('#cch').checked = !!S.c1h;
  $('#cjr').checked = !!S.journal;
  fillLec();
  $('#cst').textContent = streamInfo();
  $('#crp').value = S.repo || '';
  $('#cpre').value = S.pre || '';
  $('#cpr').value = S.proto || '';
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
$('#mlr').onclick = () => {
  $('#dmn').close();
  setReading(true);
};
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
  try {
    const d = JSON.parse(await f.text());
    const a = (Array.isArray(d.scenarios) ? d.scenarios : []).map(clean).filter(Boolean);
    if (
      !a.length ||
      !(await dlg('Importer ' + a.length + ' scénario(s) ?', {
        m: 'Ceux qui ont le même identifiant seront remplacés.',
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
    dlg('Fichier invalide');
  }
};
$('#dcc').onclick = () => $('#dc').close();
$('#dcs').onclick = async () => {
  if ($('#cm').value.trim() !== (S.model || '')) rlReset();
  S.key = $('#ck').value.trim();
  S.model = $('#cm').value.trim();
  S.memModel = $('#cmm').value.trim();
  S.noStream = $('#cn').checked;
  S.c1h = $('#cch').checked;
  S.warm = $('#cwa').checked;
  const rp = $('#crp').value.trim();
  if (rp !== (S.repo || '')) LS.del('tree');
  S.repo = rp;
  S.pre = $('#cpre').value.trim();
  S.proto = $('#cpr').value;
  S.counters = $('#ctc').checked;
  S.journal = $('#cjr').checked;
  await saveSet();
  $('#dc').close();
  if (app.cur) tk();
  else draw();
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
  const r = app.cur.messages
    .map((m, i) => ({ m, i }))
    .filter(x => nz(x.m.content).includes(q))
    .slice(-60)
    .reverse();
  $('#srn').textContent = r.length
    ? r.length + (r.length > 1 ? ' messages trouvés.' : ' message trouvé.')
    : 'Aucun résultat.';
  $('#srl').replaceChildren(
    ...r.map(x =>
      hit(x.m.role, SNIP(x.m.content, q), () => {
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
// Sommaire : les scènes du récit (lieu, tours), repliées ; ouverte, une scène montre sa première phrase, les
// lignes de la mémoire qui la résument et un bouton pour y aller. Sans lieu dans l'état, la liste des lignes
// récentes, comme avant.
$('#msm').onclick = () => {
  $('#dmn').close();
  const L = app.cur.mem.lines || [],
    T = tocOf(app.cur.messages, L, app.cur.pname?.trim() || ''),
    go = i => () => {
      $('#dsm').close();
      if (i >= 0) jump(i);
    },
    line = x => el('button', { class: 'sli', onclick: go(x.i) }, fr(x.t)),
    // Toucher l'en-tête ouvre ou referme la scène.
    fold = (cls, head, ...body) => {
      const h = el('button', { class: 'sch', 'aria-expanded': 'false' }, ...head),
        g = el('div', { class: cls }, h, el('div', { class: 'scb' }, ...body));
      h.onclick = () => h.setAttribute('aria-expanded', String(g.classList.toggle('open')));
      return g;
    };
  $('#smn').textContent = T
    ? 'Une entrée par lieu, dans l’ordre du récit. Touchez une scène pour l’ouvrir.'
    : 'Une ligne par message déjà résumé. Touchez pour y aller. Avec un champ « Lieu » dans le panneau d’état, le sommaire se range par scènes.';
  if (T) {
    const loose = L.filter(x => x.i < 0),
      G = T.map(s =>
        fold(
          'scg' + (s.cur ? ' cur' : ''),
          [
            el('span', { class: 'sct' }, fr(s.lieu || (s.k ? 'Scène sans lieu' : 'Début')), el('span', { class: 'scv' })),
            el('span', {
              class: 'scm',
              text: s.turns + (s.turns > 1 ? ' tours' : ' tour') + (s.cur ? ' · en cours' : '')
            })
          ],
          s.preview && el('p', { class: 'scx', text: fr(s.preview) }),
          s.lines.length && el('div', { class: 'scl' }, s.lines.map(line)),
          el('button', { class: 'scgo', onclick: go(s.from) }, 'Aller à cette scène')
        )
      );
    if (loose.length)
      G.push(
        fold('scg', [el('span', { class: 'sct' }, 'Autres lignes', el('span', { class: 'scv' }))], el('div', { class: 'scl' }, loose.map(line)))
      );
    $('#sml').replaceChildren(...G);
  } else
    $('#sml').replaceChildren(
      ...(L.length
        ? L.map(x => hit('assistant', x.t, go(x.i)))
        : [el('p', { class: 'note', text: 'Le sommaire se remplit à mesure que la mémoire résume les messages.' })])
    );
  $('#dsm').showModal();
  $('#sml .scg.cur')?.scrollIntoView({ block: 'nearest' });
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
          c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        res(c.toDataURL('image/webp', 0.75));
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
