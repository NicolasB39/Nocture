import { on } from './bus.js';
import { raw, setBody, split } from './format.js';
import { showList } from './list.js';
import { cutChapters, cutLines } from './memory.js';
import { conflicts } from './protocol.js';
import { readPos, setReading, speakFrom, speakMsg, stopSpeech } from './read.js';
import { loadCtx, TERR } from './scenarios.js';
import { zoomScene } from './scene.js';
import { ask, regen, regenHint, sessionSum } from './send.js';
import { app, ctx } from './state.js';
import { forkOf, getOne, save } from './store.js';
import { $, dlg, err, fit, LS, plain, smooth, toast, uid, vt } from './util.js';
import { render } from './view.js';

// Conversation : ouverture d'une histoire et actions sur les messages (variantes, modification,
// suppression, bifurcation, menus).
export async function openScenario(id) {
  stopSpeech();
  setReading(false);
  app.cur = await getOne(id);
  if (!app.cur) {
    showList();
    return;
  }
  app.LIM = 50;
  const n0 = app.cur.messages.length,
    back = Math.min(+LS.get('pos:' + id) || 0, n0 - 2);
  while (back > 0 && n0 - app.LIM > back) app.LIM += 50;
  await loadCtx();
  const cf = conflicts(app.cur.remote ? ctx.system : app.cur.system);
  const warn = cf.length
    ? 'Le prompt système redéfinit ' + cf.join(', ') + " : l'application s'en charge, retirez ces consignes."
    : '';
  const bad =
    app.cur.remote && !ctx.system
      ? 'Prompt introuvable : vérifiez scenarios/' + app.cur.folder + '/systeme.md'
      : app.cur.remote && TERR
        ? 'GitHub indisponible (' + TERR + ') : fiches, images et lorebooks peuvent manquer.'
        : '';
  // Ouverture : la couverture de la carte glisse jusqu'à l'en-tête (transition de vue partagée).
  const src = [...document.querySelectorAll('#items .ttl')]
      .find(b => b.dataset.id == id)
      ?.closest('.item')
      ?.querySelector('.cv, .art'),
    hd = $('#chat header');
  if (src && !$('#list').hidden) src.style.viewTransitionName = 'hcov';
  await vt(() => {
    if (src) src.style.viewTransitionName = '';
    hd.style.viewTransitionName = src ? 'hcov' : '';
    $('#list').hidden = true;
    $('#chat').hidden = false;
    err(bad || warn, !!bad);
    $('#inp').value = LS.get('draft:' + id) || '';
    fit();
    render(true);
  });
  setTimeout(() => (hd.style.viewTransitionName = ''), 600);
  // Début de séance avec Claude : la mémoire avance pendant la relecture, avant le premier envoi.
  sessionSum(app.cur);
  if (back > 0) {
    const e = document.querySelector('#msgs .m[data-i="' + back + '"]');
    if (e) {
      e.scrollIntoView({ block: 'start' });
      toast('Reprise là où vous en étiez', {
        label: 'Aller en bas',
        fn: () => {
          const m = $('#msgs');
          m.scrollTo({ top: m.scrollHeight, behavior: smooth() });
        }
      });
    }
  }
}
// Rend true si la version distante (de date u) est bien installée. Sinon backup.js garde le conflit pour la
// synchronisation suivante : pendant une réponse (le texte en cours se figerait, et la fin de l'envoi
// enregistrerait l'ancienne version par-dessus), ou quand une écriture locale l'a déjà remplacée en base.
on('cur:remote', async (k, u) => {
  const id = app.cur?.id;
  if (!id) return false;
  if (k == 'deleted') {
    toast('Cette histoire a été supprimée sur un autre appareil');
    $('#back').click();
    return true;
  }
  if (app.busy) return false;
  const c = await getOne(id);
  if (!c || c.updated !== u || app.cur?.id != id || app.busy) return false;
  app.cur = c;
  render();
  toast('Histoire mise à jour depuis un autre appareil');
  return true;
});
async function delFrom(i) {
  stopSpeech();
  const c = app.cur,
    upto = c.mem.upto,
    lines = c.mem.lines || [],
    chapters = c.mem.chapters,
    removed = c.messages.splice(i);
  c.mem.upto = Math.min(upto, i);
  c.mem.lines = cutLines(lines, i);
  c.mem.chapters = cutChapters(chapters, i);
  // Histoire GitHub vidée pour recommencer : à synchroniser quand même (syncable, merge.js).
  const r0 = c.reset;
  if (!i && c.remote) c.reset = Date.now();
  await save();
  render(true);
  toast(
    (removed.length > 1 ? removed.length + ' messages supprimés' : 'Message supprimé') +
      (i < upto ? ' · le résumé de la mémoire en garde la trace' : ''),
    {
      label: 'Annuler',
      fn: async () => {
        if (app.cur !== c || c.messages.length !== i) {
          toast('Annulation impossible : la conversation a changé');
          return;
        }
        c.messages.push(...removed);
        c.mem.upto = upto;
        c.mem.lines = lines;
        c.mem.chapters = chapters;
        c.reset = r0;
        await save();
        render(true);
      }
    }
  );
}
// Modifier un tour du joueur et relancer : la suite est remplacée par une nouvelle réponse.
async function resendFrom(i, t) {
  const c = app.cur;
  if (!t || app.busy || c.messages[i]?.role != 'user') return;
  stopSpeech();
  const upto = c.mem.upto,
    n = c.messages.splice(i + 1).length,
    pv = c.messages[i - 1];
  // Le tour modifié doit repartir tel quel : il sort du résumé s'il y était déjà.
  c.mem.upto = Math.min(upto, i);
  c.mem.lines = cutLines(c.mem.lines || [], i);
  c.mem.chapters = cutChapters(c.mem.chapters, i);
  if (pv?.alts) {
    delete pv.alts;
    delete pv.ai;
  }
  Object.assign(c.messages[i], { content: t, t: Date.now() });
  // Verrou jusqu'à ask() : un second Renvoyer pendant l'enregistrement relancerait un tour en double.
  app.busy = true;
  try {
    await save();
  } finally {
    app.busy = false;
  }
  render(true);
  if (n || i < upto)
    toast(
      (n > 1 ? n + ' messages remplacés' : n ? 'Réponse remplacée' : 'Tour renvoyé') +
        (i < upto ? ' · le résumé de la mémoire garde la trace de l’ancienne version' : '')
    );
  ask();
}
const after = i => app.cur.messages.length - 1 - i;
async function forkFrom(i) {
  const s = app.cur,
    name = await dlg('Bifurquer d’ici', {
      m: 'Une nouvelle histoire reprend jusqu’à ce message. Celle-ci reste intacte.',
      v: s.name + ' (bifurcation)',
      ok: 'Créer'
    });
  if (!name?.trim() || app.cur !== s) return;
  stopSpeech();
  readPos(s.id);
  const c = forkOf(s, i, name.trim(), uid());
  await save(c);
  await openScenario(c.id);
  toast(
    'Bifurcation créée' +
      (s.mem.upto > i + 1 ? ' · le résumé de la mémoire raconte aussi la suite : relisez-le (… › Mémoire et note)' : '')
  );
}
const useAlt = (m, k) => {
  m.ai = k;
  setBody(m, m.alts[k]);
};
async function swipe(d) {
  stopSpeech();
  const m = app.cur.messages.at(-1);
  useAlt(m, (m.ai + d + m.alts.length) % m.alts.length);
  await save();
  render(true);
}
$('#msgs').onclick = e => {
  const sc = e.target.closest('.scn');
  if (sc) {
    zoomScene(sc);
    return;
  }
  const b = e.target.closest('button');
  if (!b) {
    const m = e.target.closest('.m[data-i]');
    if (app.reading && m) speakFrom(+m.dataset.i);
    // Au toucher, faute de survol : toucher un ancien message affiche ses actions.
    else if (m && !m.classList.contains('last') && !getSelection()?.toString()) {
      const on = !m.classList.contains('sel');
      for (const x of $('#msgs').querySelectorAll(':scope > .m.sel')) x.classList.remove('sel');
      m.classList.toggle('sel', on);
    }
    return;
  }
  if (b.classList.contains('more')) {
    const m = $('#msgs'),
      h = m.scrollHeight,
      y = m.scrollTop;
    app.LIM += 50;
    render();
    m.scrollTop = y + m.scrollHeight - h;
    return;
  }
  if (b.matches('.stc, .stl')) {
    const open = LS.get('stOpen') != '1';
    LS.set('stOpen', open ? '1' : '0');
    for (const s of $('#msgs').querySelectorAll('.st')) {
      s.classList.toggle('open', open);
      for (const x of s.querySelectorAll('.stc, .stl')) x.setAttribute('aria-expanded', String(open));
    }
    // Le bouton touché disparaît : le focus passe à celui qui le remplace dans le même panneau.
    b.closest('.st')?.querySelector(open ? '.stl' : '.stc')?.focus();
    return;
  }
  const row = b.closest('.chr');
  if (row) {
    const t = row.querySelector('.cht').dataset.t;
    if (b.classList.contains('che')) {
      $('#inp').value = t;
      fit();
      $('#inp').focus();
    } else if (!app.busy) {
      $('#inp').value = t;
      $('#send').click();
    }
    return;
  }
  const a = b.dataset.a,
    i = +b.dataset.i;
  if (a == 'v') {
    speakMsg(i);
    return;
  }
  if (a == 'm') {
    const last = i == app.cur.messages.length - 1;
    app.actI = i;
    $('#maw').hidden = app.cur.messages[i].role != 'user';
    $('#mar').hidden = !last;
    $('#dma').showModal();
    return;
  }
  if (app.busy) return;
  if (a == 'r') {
    if (lpFired) lpFired = false;
    else regen();
  } else if (a == 'k') ask(null, true);
  else swipe(a == 'p' ? -1 : 1);
};
// Appui long (ou clic droit) sur Régénérer : régénérer avec une indication.
let lpT = 0,
  lpFired = false;
$('#msgs').addEventListener('pointerdown', e => {
  lpFired = false;
  if (e.button || !e.target.closest('button[data-a="r"]')) return;
  lpT = setTimeout(() => {
    lpFired = true;
    regenHint();
  }, 500);
});
for (const t of ['pointerup', 'pointerleave', 'pointercancel'])
  $('#msgs').addEventListener(t, () => clearTimeout(lpT));
$('#msgs').addEventListener('contextmenu', e => {
  if (!e.target.closest('button[data-a="r"]')) return;
  e.preventDefault();
  clearTimeout(lpT);
  lpFired = e.pointerType == 'touch' || lpFired;
  regenHint();
});
$('#dec').onclick = () => $('#de').close();
$('#des').onclick = async () => {
  if (app.editRe) {
    $('#de').close();
    resendFrom(app.editI, $('#et').value.trim());
    return;
  }
  const c = app.cur,
    i = app.editI,
    m = c.messages[i],
    p = split($('#et').value),
    old = m.content !== p.content && i < c.mem.upto;
  setBody(m, p);
  if (m.alts) m.alts[m.ai] = p;
  // Message déjà résumé : sa ligne récente racontait l'ancienne version, et le résumé la garde.
  if (old) c.mem.lines = (c.mem.lines || []).filter(l => l.i !== i);
  await save();
  render();
  $('#de').close();
  if (old) toast('Message modifié · le résumé de la mémoire garde la trace de l’ancienne version : relisez-le (… › Mémoire et note)');
};
$('#dpic').onclick = () => $('#dpic').close();
$('#dpic').addEventListener('close', () => {
  $('#dpic').querySelector('.scn')?.remove();
  $('#dpici').hidden = false;
});
$('#damc').onclick = () => $('#dma').close();
$('#mac').onclick = () => {
  $('#dma').close();
  navigator.clipboard
    ?.writeText(plain(app.cur.messages[app.actI].content, app.cur.pname))
    .then(() => toast('Message copié'))
    .catch(() => toast('Copie impossible'));
};
// Flèche haut dans le champ vide (au clavier) : modifier et renvoyer le dernier tour du joueur.
$('#inp').addEventListener('keydown', e => {
  if (e.key != 'ArrowUp' || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || $('#inp').value || app.busy) return;
  const i = app.cur.messages.findLastIndex(m => m.role == 'user');
  if (i < 0) return;
  e.preventDefault();
  app.actI = i;
  editOpen(true);
});
const editOpen = re => {
  $('#dma').close();
  if (app.busy) return;
  const i = (app.editI = app.actI),
    n = after(i);
  app.editRe = re;
  $('#hde').textContent = re ? 'Modifier et renvoyer' : 'Modifier le message';
  $('#des').textContent = re ? 'Renvoyer' : 'Enregistrer';
  $('#den').textContent = !re
    ? ''
    : n
      ? (n > 1 ? 'Les ' + n + ' messages suivants seront remplacés' : 'La réponse suivante sera remplacée') +
        ' par une nouvelle réponse. Pour garder l’ancienne suite, bifurquez d’abord depuis ce message.'
      : 'L’IA répondra à la nouvelle version.';
  $('#den').hidden = !re;
  $('#et').value = raw(app.cur.messages[i]);
  $('#de').showModal();
};
$('#mae').onclick = () => editOpen(false);
$('#maw').onclick = () => editOpen(true);
$('#mar').onclick = () => {
  $('#dma').close();
  regenHint();
};
$('#mad').onclick = () => {
  $('#dma').close();
  if (!app.busy) delFrom(app.actI);
};
$('#mab').onclick = () => {
  $('#dma').close();
  if (!app.busy) forkFrom(app.actI);
};
let px, py, pel;
$('#msgs').addEventListener('pointerdown', e => {
  const m = e.target.closest('.m[data-i]');
  if (m && !e.target.closest('button') && app.cur?.messages.at(-1)?.alts?.length > 1) {
    pel = +m.dataset.i == app.cur.messages.length - 1 ? m : null;
    px = e.clientX;
    py = e.clientY;
  }
});
$('#msgs').addEventListener('pointerup', e => {
  if (!pel || app.busy) {
    pel = null;
    return;
  }
  const dx = e.clientX - px,
    dy = e.clientY - py;
  pel = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) swipe(dx < 0 ? 1 : -1);
});
$('#msgs').addEventListener('pointercancel', () => {
  pel = null;
});
