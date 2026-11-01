import { chat, keepWarm, lastTurn, lastWarmable, SUM_START, summarize, waitMsg, WARM_AT } from './ai.js';
import { sync } from './backup.js';
import { face } from './cast.js';
import { costOf, priceOf } from './cost.js';
import { fr, keepImgs, lieuTag, liveText, paintLive, setBody, split } from './format.js';
import { buildInfo, inScene } from './prompt.js';
import { modelOf } from './protocol.js';
import { autoRead, stopSpeech } from './read.js';
import { decorNow } from './scene.js';
import { app, S } from './state.js';
import { save } from './store.js';
import { $, dlg, el, err, fit, LS } from './util.js';
import { liveEnd, liveScene, newShow, render, tail, unseen } from './view.js';

// Envoi d'un tour : appel au modèle, affichage progressif, erreurs, maintien du cache, zone de saisie.
export async function regenHint() {
  if (app.busy || $('#dq').open) return;
  const h = await dlg('Régénérer avec une indication', {
    m: 'Pour cette réponse seulement : l’indication n’est pas gardée dans l’histoire.',
    v: '',
    ph: 'Plus court, plus sombre, fais parler Elias…',
    ok: 'Régénérer'
  });
  if (h !== null && !app.busy) regen(h);
}
// Début de séance : le cache de Claude a expiré (rien envoyé ni relancé pour cette histoire depuis sa durée de
// vie), le premier envoi réécrira donc tout le prompt. C'est le moment de faire avancer la mémoire jusqu'à
// SUM_KEEP messages gardés (summarize, ai.js) : la réécriture porte directement le prompt raccourci, et la mise à
// jour ne coûte qu'un appel au modèle de mémoire. Lancé à l'ouverture de l'histoire ; l'envoi l'attend au plus
// SUM_WAIT. HOT : dernière requête de narration ou relance du cache par histoire, pendant cette visite.
const HOT = new Map(),
  SUM_WAIT = 30000;
const cold = (s, old) => {
  const t = Math.max(HOT.get(s.id) || 0, old?.t || 0, s.messages.findLast(m => m.role == 'assistant')?.t || 0);
  return Date.now() - t > (S.c1h ? 3600e3 : 300e3);
};
export const sessionSum = (s, old) =>
  s.messages.length - s.mem.upto >= SUM_START && cold(s, old)
    ? summarize(s, true)
    : null;
function setBusy(b) {
  app.busy = b;
  $('#send').hidden = b;
  $('#stop').hidden = !b;
  err('');
}
export async function ask(old, cont, hint) {
  const s = app.cur,
    again = cont ? () => ask(null, true) : old ? () => regen(hint) : () => ask(null, false, hint),
    // Réessayer n'a de sens que si le fil finit encore comme au départ : tour du joueur à envoyer, ou
    // réponse à continuer (le joueur a pu supprimer ou modifier des messages entre-temps).
    still = cont ? () => s.messages.at(-1)?.role == 'assistant' : old ? () => true : () => s.messages.at(-1)?.role == 'user';
  if (!S.key) {
    if (old) s.messages.push(old);
    render();
    err("Ajoutez une clé API dans les réglages IA (menu « … » en haut).", 1);
    return;
  }
  setBusy(true);
  warmStop();
  $('#gst').textContent = 'Réponse en cours.';
  const t0 = Date.now();
  let msg = '',
    refused = false,
    cut = false,
    part = false,
    raf = 0,
    pend = ['', false],
    dl = decorNow(s.messages),
    lieu = '';
  const z = { fl: 0, fn: 0, ft: '' },
    // Attente : le personnage en scène « réfléchit », sur des lignes fantômes. Un seul nœud, réutilisé à
    // chaque image, pour ne pas recharger l'avatar.
    who = inScene(s.messages.slice(-6))[0],
    wt = el(
      'div',
      { class: 'wt' },
      el('div', { class: 'wth' }, who && face(who), el('span', { class: 'act' })),
      el('div', { class: 'wts', 'aria-hidden': 'true' }, el('i'), el('i'), el('i'))
    );
  const paint = () => {
    raf = 0;
    if (app.cur !== s || !pend) return;
    const [t, th] = pend;
    const m = $('#msgs');
    let e = document.querySelector('#live');
    if (!e) {
      const end = m.scrollHeight - m.scrollTop - m.clientHeight < 80;
      e = el('div', { class: 'm assistant', id: 'live' }, el('div', { class: 'b' }));
      $('#mfoot').before(e);
      if (end) m.scrollTop = m.scrollHeight;
    }
    // Lieu annoncé en tête : la scène s'installe avant le texte (intertitre, lettrine, décor).
    const lt = !cont && lieuTag(t);
    if (lt && lt != lieu) dl = liveScene((lieu = lt));
    const v = liveText(t.trim()),
      sec = Math.round((Date.now() - t0) / 1000);
    if (!v)
      wt.querySelector('.act').textContent =
        (who ? fr(who.name + ' réfléchit…') : 'Réflexion…') + (sec > 2 || th ? ' ' + sec + ' s' : '');
    paintLive(e.firstChild, v, z, v ? null : wt, dl);
    if (S.follow && m.scrollHeight - m.scrollTop - m.clientHeight < 200)
      m.scrollTop = m.scrollHeight;
    m.dispatchEvent(new Event('scroll'));
    if (unseen(e)) newShow('Réponse en cours');
  };
  const live = (t, th) => {
    pend = [t, th];
    if (!raf) raf = requestAnimationFrame(paint);
  };
  paint();
  const tick = setInterval(() => {
    if (!pend[0] && !raf) paint();
  }, 1000);
  try {
    const ac = (app.ctl = new AbortController()),
      sp = sessionSum(s, old);
    // Début de séance : la mémoire avance d'abord (au plus SUM_WAIT ; Arrêter coupe l'attente).
    if (sp) {
      err('Mise à jour de la mémoire avant l’envoi…');
      await Promise.race([
        sp,
        new Promise(r => {
          setTimeout(r, SUM_WAIT);
          ac.signal.addEventListener('abort', r, { once: true });
        })
      ]);
      if (app.cur === s) err('');
    }
    HOT.set(s.id, Date.now());
    const info = buildInfo(s, cont, hint);
    const r = await chat(info.msgs, {
      max: +s.maxTok || 0,
      ac,
      od: S.noStream ? null : live,
      model: modelOf(s),
      effort: s.effort || 'low',
      effBase: info.effort,
      primary: true,
      kind: cont ? 'continuer' : hint ? 'indication' : old ? 'régénérer' : 'tour',
      sid: s.id,
      onWait: (w, why) => {
        if (app.cur !== s) return;
        if (w) {
          const t = waitMsg(w, why);
          err(t.charAt(0).toUpperCase() + t.slice(1));
        } else {
          err('');
          live('');
        }
      }
    });
    app.stream = { mode: S.noStream ? 'off' : r.mode, chunks: r.chunks, ms: r.ms };
    const out = r.t;
    cut = r.cut;
    part = !!r.partial;
    const p2 = split(out);
    // Rien à raconter (réponse arrêtée juste après l'annonce du lieu, ou réduite à l'état) : un message vide
    // ferait refuser les tours suivants. Échec, avec Réessayer, et l'ancienne réponse remise en place.
    if (!cont && !p2.content) throw new Error('réponse vide : aucun texte de récit reçu');
    if (cont) {
      const m = s.messages.at(-1);
      setBody(m, { ...p2, content: m.content.trimEnd() + (/^[\s.,;:!?…»)]/.test(p2.content) ? '' : ' ') + p2.content });
      if (m.alts) m.alts[m.ai] = { content: m.content, choices: m.choices, state: m.state };
    } else {
      const base = old?.role == 'assistant' ? old.alts || [{ content: old.content, choices: old.choices, state: old.state }] : null,
        al = base ? [...base, p2].slice(-10) : null;
      s.messages.push(
        al
          ? { role: 'assistant', ...p2, alts: al, ai: al.length - 1, t: Date.now() }
          : { role: 'assistant', ...p2, t: Date.now() }
      );
    }
    old = null;
    await save(s);
  } catch (e) {
    msg = e.message;
    // Refus : renvoyer la même requête serait refusé de même ; on propose de reformuler ou d'orienter la scène.
    refused = !!e.refusal;
    if (refused)
      msg += cont ? '. Régénérez la réponse, ou reformulez votre tour.' : '. Reformulez votre tour, ou orientez la scène avec une indication.';
    if (old) s.messages.push(old);
    // Un résumé fini pendant le tour n'a rien enregistré (persist, ai.js) : on le fait ici.
    await save(s).catch(() => {});
  }
  // Coût du tour, refus compris (facturé) ; rien si la requête n'a pas abouti.
  const lt = lastTurn();
  app.turn = lt && { id: s.id, e: lt.e, cost: costOf(lt.e, priceOf(lt.key)) };
  clearInterval(tick);
  cancelAnimationFrame(raf);
  pend = null;
  liveEnd();
  const lv = document.querySelector('#live');
  setBusy(false);
  if (app.cur === s) {
    err(
      msg ||
        (part
          ? 'Réponse interrompue : le texte reçu est conservé. Continuez (double chevron) ou régénérez.'
          : cut
            ? 'Réponse coupée par la longueur maximale. Augmentez-la dans les réglages du scénario, continuez ou régénérez.'
            : ''),
      !!msg,
      msg &&
        (!refused
          ? {
              label: 'Réessayer',
              fn: () => {
                if (!app.busy && app.cur === s && still()) again();
              }
            }
          : !cont && {
              label: 'Indication…',
              fn: () => {
                if (!app.busy && app.cur === s && still()) regenHint();
              }
            })
    );
    $('#gst').textContent = msg ? 'Échec : ' + msg : 'Réponse reçue.';
    // Repère : le message juste avant la réponse (en général le tour du joueur). Le rendu final peut retirer
    // des messages par le haut (longue histoire : seuls les app.LIM derniers sont affichés), une position de
    // défilement absolue ferait alors sauter l'écran vers la fin ; on garde ce message à sa place.
    let an = lv?.previousElementSibling;
    while (an && !an.matches('.m[data-i]')) an = an.previousElementSibling;
    const m = $('#msgs'),
      y = m.scrollTop,
      ai = an?.dataset.i,
      at = an?.getBoundingClientRect().top,
      // Position de la réponse à l'écran, et son intertitre s'il était déjà là (lieu annoncé en tête).
      top = lv?.getBoundingClientRect().top,
      had = !!lv?.previousElementSibling?.matches('.scene');
    render(S.follow);
    const fin = lv && !msg && m.querySelector(':scope > .m[data-i="' + (s.messages.length - 1) + '"]');
    if (fin) keepImgs(lv, fin);
    lv?.remove();
    const sc = fin?.previousElementSibling,
      nsc = !!sc?.matches('.scene') && !had;
    if (!S.follow) {
      m.scrollTop = y;
      const a2 = ai != null && m.querySelector(':scope > .m[data-i="' + ai + '"]');
      if (a2) m.scrollTop += Math.round(a2.getBoundingClientRect().top - at);
      // Lieu connu seulement à la fin : l'intertitre arrive en fondu au-dessus de la réponse, et le défilement
      // compense sa hauteur pour que le texte en cours de lecture ne bouge pas. Sa hauteur seule : le message
      // du joueur, qui n'est plus le dernier, raccourcit aussi (barre d'actions rangée à côté de la bulle), et
      // caler la réponse sur sa place d'avant ferait descendre tout le fil d'autant.
      if (nsc && top < m.getBoundingClientRect().bottom)
        m.scrollTop += fin.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    }
    if (nsc) sc.classList.add('in');
    if (!msg && unseen(tail())) newShow('Nouveau message');
    else $('#newm').hidden = true;
    if (!msg && !cont) autoRead(s.messages.length - 1);
  } else lv?.remove();
  if (!msg) {
    warmN = 0;
    warmArm(s);
    summarize(s);
  }
  if (app.cur !== s && LS.get('bkd')) sync();
}
// Maintien du cache Claude pendant les pauses (keepWarm, ai.js) : une relance peu avant l'échéance des
// 5 minutes, au plus WARM_N d'affilée sans nouvel envoi (une vingtaine de minutes), seulement tant que la
// conversation est ouverte et la page visible. Inutile avec le cache d'une heure.
const WARM_N = 3;
let warmT = 0,
  warmN = 0,
  warmS = null;
function warmStop() {
  clearTimeout(warmT);
  warmT = 0;
}
function warmArm(s) {
  warmStop();
  warmS = s;
  const L = lastWarmable();
  if (!L || S.warm === false || S.c1h || warmN >= WARM_N) return;
  const age = Date.now() - L.at;
  if (age >= 295000) return;
  warmT = setTimeout(async () => {
    warmT = 0;
    if (app.busy || app.cur !== s || $('#chat').hidden || document.hidden) return;
    warmN++;
    if (await keepWarm()) {
      HOT.set(s.id, Date.now());
      warmArm(s);
    }
  }, Math.max(0, WARM_AT - age));
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && warmS && app.cur === warmS && !warmT && !app.busy) warmArm(warmS);
});
export async function regen(hint) {
  if (app.busy) return;
  stopSpeech();
  const old = app.cur.messages.at(-1)?.role == 'assistant' ? app.cur.messages.pop() : null;
  render(true);
  ask(old, false, hint);
}
$('#send').onclick = async () => {
  const t = $('#inp').value.trim();
  if (!t || app.busy) return;
  // Verrou posé avant l'enregistrement : un double toucher pendant l'attente enverrait deux fois le tour.
  app.busy = true;
  try {
    stopSpeech();
    $('#inp').value = '';
    fit();
    LS.del('draft:' + app.cur.id);
    const pv = app.cur.messages.at(-1);
    if (pv?.alts) {
      delete pv.alts;
      delete pv.ai;
    }
    app.cur.messages.push({ role: 'user', content: t, t: Date.now() });
    await save();
  } finally {
    app.busy = false;
  }
  render(true);
  ask();
};
$('#stop').onclick = () => app.ctl?.abort('stop');
$('#inp').oninput = () => {
  LS.set('draft:' + app.cur.id, $('#inp').value);
  fit();
};
$('#inp').onkeydown = e => {
  if (e.key == 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches) {
    e.preventDefault();
    $('#send').click();
  }
};
$('#ast').onclick = () => {
  const t = $('#inp'),
    a = t.selectionStart,
    b = t.selectionEnd,
    v = t.value;
  t.value = v.slice(0, a) + '*' + v.slice(a, b) + '*' + v.slice(b);
  t.focus();
  t.setSelectionRange(a + 1, b + 1);
  t.dispatchEvent(new Event('input'));
};
