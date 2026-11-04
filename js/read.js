import { emit } from './bus.js';
import { S, app, playerName } from './state.js';
import { saveSet } from './store.js';
import { $, LS, el, ic, plain, toast } from './util.js';

const ok = typeof speechSynthesis != 'undefined' && typeof SpeechSynthesisUtterance != 'undefined';
export const ttsOk = ok;
const T = { q: [], pos: 0, run: 0, state: 'idle', msg: -1, u: null };
const FS = [14, 30];

export const applyFs = () => {
  const d = document.documentElement.style;
  d.setProperty('--fs', (S.fs || 17) + 'px');
  d.setProperty('--lh', S.lh || 1.7);
  d.setProperty('--cw', Math.min(1200, (S.cw || 45) * (S.fs || 17)) + 'px');
  d.setProperty('--rf', S.ff == 'sans' ? 'var(--sans)' : 'var(--ser)');
  d.setProperty('--pg', S.pm == 'in' ? '0em' : '0.7em');
  d.setProperty('--pin', S.pm == 'in' ? '1.4em' : '0');
};
const fsLabel = () => {
  $('#lfv').textContent = (S.fs || 17) + ' px';
  $('#lfs').value = S.fs || 17;
};
const setFs = n => {
  S.fs = Math.max(FS[0], Math.min(FS[1], n));
  applyFs();
  fsLabel();
  saveSet();
};
export const readPos = id => {
  if (!id || $('#chat').hidden) return;
  const m = $('#msgs'),
    i = m.scrollHeight - m.scrollTop - m.clientHeight < 80 ? 0 : visibleStart();
  if (i > 0) LS.set('pos:' + id, i);
  else LS.del('pos:' + id);
};

const speakable = t =>
  plain(t, playerName(app.cur))
    .replace(/<[^>]*>/g, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_]+/g, '')
    .trim();
const pieces = s => (s.length > 240 ? s.match(/[^,;:]+[,;:]?\s*/g) || [s] : [s]);
const chunks = t => {
  const out = [];
  for (const p of t.split(/\n+/)) {
    let cur = '';
    for (const s of p.match(/[^.!?…]+[.!?…]*\s*/g) || [])
      for (const x of pieces(s)) {
        if (cur && (cur + x).length > 200) {
          out.push(cur.trim());
          cur = '';
        }
        cur += x;
      }
    if (cur.trim()) out.push(cur.trim());
  }
  return out;
};
const items = idx =>
  idx.flatMap(i => chunks(speakable(app.cur.messages[i]?.content || '')).map(t => ({ m: i, t })));
const voice = () => {
  const vs = speechSynthesis.getVoices();
  return (
    vs.find(v => v.voiceURI == S.tts?.voice) ||
    vs.find(v => v.lang?.toLowerCase().startsWith('fr')) ||
    null
  );
};

const mark = (i, scroll) => {
  T.msg = i;
  document
    .querySelectorAll('#msgs .m')
    .forEach(e => e.classList.toggle('speaking', +e.dataset.i === i));
  document
    .querySelectorAll('#msgs [data-a="v"]')
    .forEach(b => b.classList.toggle('on', +b.dataset.i === i && T.state != 'idle'));
  if (scroll && i >= 0)
    document.querySelector('#msgs .m[data-i="' + i + '"]')?.scrollIntoView({ block: 'nearest' });
};
export const refreshSpeech = () => {
  if (T.state != 'idle') mark(T.msg);
};
function ttsUI() {
  const idle = T.state == 'idle',
    pl = T.state == 'play';
  $('#tts').hidden = idle || app.reading;
  $('#rbar').hidden = !app.reading;
  $('#rpp').hidden = $('#rst').hidden = !ok;
  for (const id of ['#tpp', '#rpp']) {
    $(id).replaceChildren(ic(pl ? 'pause' : 'play', 20));
    $(id).setAttribute(
      'aria-label',
      pl ? 'Mettre en pause' : T.state == 'paused' ? 'Reprendre la lecture' : 'Lire à voix haute'
    );
  }
  $('#rst').disabled = idle;
}
function next() {
  if (T.state != 'play') return;
  if (T.pos >= T.q.length) {
    T.state = 'idle';
    T.q = [];
    mark(-1);
    ttsUI();
    return;
  }
  const it = T.q[T.pos],
    id = T.run,
    u = new SpeechSynthesisUtterance(it.t),
    v = voice();
  if (it.m !== T.msg) mark(it.m, true);
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else u.lang = 'fr-FR';
  u.rate = S.tts?.rate || 1;
  u.onend = () => {
    if (id == T.run && T.state == 'play') {
      T.pos++;
      next();
    }
  };
  u.onerror = e => {
    if (id != T.run || e.error == 'canceled' || e.error == 'interrupted') return;
    T.pos++;
    next();
  };
  // Gardé en référence : sur Chrome, un énoncé que plus rien ne retient peut être libéré en pleine lecture, et
  // son onend ne vient jamais.
  T.u = u;
  speechSynthesis.speak(u);
}
function stop() {
  T.run++;
  T.state = 'idle';
  T.q = [];
  speechSynthesis.cancel();
  mark(-1);
  ttsUI();
}
function start(list) {
  if (!ok) return;
  const was = T.state != 'idle';
  stop();
  if (!list.length) return;
  T.q = list;
  T.pos = 0;
  T.state = 'play';
  ttsUI();
  if (was) setTimeout(next, 80);
  else next();
}
const pause = () => {
  T.state = 'paused';
  T.run++;
  speechSynthesis.cancel();
  ttsUI();
};
const resume = () => {
  T.state = 'play';
  T.run++;
  ttsUI();
  next();
};
export const stopSpeech = () => {
  if (ok && T.state != 'idle') stop();
};
export function speakMsg(i) {
  if (T.state != 'idle' && T.msg === i) stopSpeech();
  else start(items([i]));
}
export function speakFrom(i) {
  const idx = [];
  app.cur.messages.forEach((m, j) => {
    if (j >= i && m.role == 'assistant') idx.push(j);
  });
  start(items(idx));
}
export function autoRead(i) {
  if (S.tts?.auto && app.cur?.messages[i]) start(items([i]));
}
export function setReading(on) {
  const was = app.reading;
  app.reading = !!on;
  $('#chat').classList.toggle('reading', app.reading);
  ttsUI();
  if (app.reading && !was && ok) toast('Touchez un message pour lire à partir de là');
}
export const visibleStart = () => {
  const m = $('#msgs'),
    top = m.getBoundingClientRect().top,
    els = [...m.querySelectorAll('.m')],
    el = els.find(e => e.getBoundingClientRect().bottom > top + 24) || els.at(-1);
  return el ? +el.dataset.i : 0;
};

const tts = () => (S.tts ??= { voice: '', rate: 1, auto: false });
function fillVoices() {
  if (!ok) return;
  const vs = speechSynthesis.getVoices(),
    fr = vs.filter(v => v.lang?.toLowerCase().startsWith('fr')),
    rest = vs.filter(v => !fr.includes(v)),
    sel = $('#lvo');
  sel.replaceChildren(
    el('option', { value: '', text: 'Automatique (français)' }),
    ...[...fr, ...rest].map(v =>
      el('option', { value: v.voiceURI, text: v.name + ' (' + v.lang + ')' })
    )
  );
  sel.value = S.tts?.voice || '';
  if (sel.value !== (S.tts?.voice || '')) sel.value = '';
}
const lhLabel = () => {
  $('#llv').textContent = (S.lh || 1.7).toFixed(2);
  $('#lcv').textContent = (S.cw || 45) + ' em';
};
export function fillLec() {
  fsLabel();
  lhLabel();
  $('#llh').value = S.lh || 1.7;
  $('#lcw').value = S.cw || 45;
  $('#lff').value = S.ff || 'ser';
  $('#lpm').value = S.pm || 'sp';
  $('#lfo').checked = !!S.follow;
  $('#lfb').checked = !!S.fullBody;
  $('#ltt').hidden = !ok;
  if (ok) {
    fillVoices();
    const t = S.tts || {};
    $('#lra').value = t.rate || 1;
    $('#lrv').textContent = (t.rate || 1).toFixed(1) + '×';
    $('#lau').checked = !!t.auto;
  }
}
if (ok) speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
$('#lfs').oninput = () => {
  S.fs = +$('#lfs').value;
  applyFs();
  fsLabel();
};
$('#lfs').onchange = () => saveSet();
$('#llh').oninput = () => {
  S.lh = +$('#llh').value;
  applyFs();
  lhLabel();
};
$('#lcw').oninput = () => {
  S.cw = +$('#lcw').value;
  applyFs();
  lhLabel();
};
$('#llh').onchange = $('#lcw').onchange = () => saveSet();
$('#lff').onchange = () => {
  S.ff = $('#lff').value;
  applyFs();
  saveSet();
};
$('#lpm').onchange = () => {
  S.pm = $('#lpm').value;
  applyFs();
  saveSet();
};
$('#lfm').onclick = () => setFs((S.fs || 17) - 1);
$('#lfp').onclick = () => setFs((S.fs || 17) + 1);
$('#rm').onclick = () => setFs((S.fs || 17) - 1);
$('#rp').onclick = () => setFs((S.fs || 17) + 1);
$('#rx').onclick = () => setReading(false);
$('#lfo').onchange = () => {
  S.follow = $('#lfo').checked;
  saveSet();
};
// Cadrage des personnages : la conversation ouverte se redessine (view.js écoute « lecture »).
$('#lfb').onchange = () => {
  S.fullBody = $('#lfb').checked;
  saveSet();
  emit('lecture');
};
$('#lvo').onchange = () => {
  tts().voice = $('#lvo').value;
  saveSet();
};
$('#lra').oninput = () => {
  tts().rate = +$('#lra').value;
  $('#lrv').textContent = (+$('#lra').value).toFixed(1) + '×';
};
$('#lra').onchange = () => saveSet();
$('#lau').onchange = () => {
  tts().auto = $('#lau').checked;
  saveSet();
};
$('#ltest').onclick = () => start([{ m: -1, t: 'Voici un exemple de lecture à voix haute.' }]);
$('#rpp').onclick = () => {
  if (T.state == 'play') pause();
  else if (T.state == 'paused') resume();
  else speakFrom(visibleStart());
};
$('#tpp').onclick = () => (T.state == 'play' ? pause() : resume());
$('#rst').onclick = stopSpeech;
$('#tst').onclick = stopSpeech;
ttsUI();
