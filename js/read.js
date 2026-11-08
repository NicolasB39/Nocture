import { emit } from './bus.js';
import { S } from './state.js';
import { saveSet } from './store.js';
import { $, LS } from './util.js';

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

export const visibleStart = () => {
  const m = $('#msgs'),
    top = m.getBoundingClientRect().top,
    els = [...m.querySelectorAll('.m')],
    el = els.find(e => e.getBoundingClientRect().bottom > top + 24) || els.at(-1);
  return el ? +el.dataset.i : 0;
};

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
  $('#lfb').checked = !!S.fullBody;
}
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
// Cadrage des personnages : la conversation ouverte se redessine (view.js écoute « lecture »).
$('#lfb').onchange = () => {
  S.fullBody = $('#lfb').checked;
  saveSet();
  emit('lecture');
};
