let toastT;
const PRIM = {
  value: '',
  checked: false,
  hidden: false,
  open: false,
  disabled: false,
  readOnly: false,
  textContent: '',
  innerHTML: '',
  innerText: '',
  className: ''
};
const stub = new Proxy(function () {}, {
  get: (_, k) =>
    k in PRIM ? PRIM[k] : k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : stub,
  set: () => true,
  apply: () => stub
});
export const $ = s => {
  const e = document.querySelector(s);
  if (e) return e;
  (window.__missing ??= new Set()).add(s);
  return stub;
};
const NS = 'http://www.w3.org/2000/svg';
export const el = (t, p, ...c) => {
  const e = document.createElement(t);
  for (const k in p || {}) {
    const v = p[k];
    if (v == null || v === false) continue;
    if (k == 'class') e.className = v;
    else if (k == 'text') e.textContent = v;
    else if (k == 'data') for (const d in v) e.dataset[d] = v[d];
    else if (k.startsWith('on')) e[k] = v;
    else if (k in e && typeof e[k] == 'boolean') e[k] = !!v;
    else e.setAttribute(k, v);
  }
  // Enfants absents ignorés, y compris le 0 d'un « liste.length && … » : un nombre s'écrit avec text.
  for (const x of c.flat(9)) if (x != null && x !== false && x !== 0) e.append(x);
  return e;
};
export const ic = (n, s) => {
  const e = document.createElementNS(NS, 'svg'),
    u = document.createElementNS(NS, 'use');
  e.setAttribute('class', 'i' + (n == 'logo' ? ' logo' : ''));
  e.setAttribute('aria-hidden', 'true');
  if (s) {
    e.style.width = s + 'px';
    e.style.height = s + 'px';
  }
  u.setAttribute('href', '#i-' + n);
  e.append(u);
  return e;
};
export const hue = s => {
  let x = 0;
  for (const c of s) x = (x * 31 + c.charCodeAt(0)) % 360;
  return x;
};
export const ago = t => {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return "à l'instant";
  if (m < 60) return 'il y a ' + m + ' min';
  const h = Math.round(m / 60);
  if (h < 24) return 'il y a ' + h + ' h';
  const d = Math.round(h / 24);
  return d == 1
    ? 'hier'
    : d < 30
      ? 'il y a ' + d + ' j'
      : new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
// Initiale d'un nom, emoji compris : le premier caractère entier, pas la moitié d'une paire UTF-16.
export const initial = s => ([...(s || '').trim()][0] || '?').toUpperCase();
// Défilement doux, sauf si l'appareil demande moins d'animations.
export const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
export const LS = {
  get: k => {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
  del: k => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
};
export const dlg = (t, { m = '', v = null, ok = 'OK', no = 'Annuler', ph = '' } = {}) =>
  new Promise(res => {
    const d = $('#dq'),
      i = $('#dqi');
    $('#dqt').textContent = t;
    $('#dqm').textContent = m;
    $('#dqm').hidden = !m;
    i.hidden = v === null;
    i.value = v ?? '';
    i.placeholder = ph;
    $('#dqo').textContent = ok;
    $('#dqc').textContent = no;
    let r = null;
    $('#dqo').onclick = () => {
      r = v === null ? true : i.value;
      d.close();
    };
    $('#dqc').onclick = () => d.close();
    d.onclose = () => res(r);
    d.showModal();
    if (v !== null) i.focus();
  });
export const vt = fn => {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fn();
    return Promise.resolve();
  }
  try {
    const t = document.startViewTransition(fn);
    // Transition sautée (deux changements d'écran rapprochés) : ready est rejetée, sans conséquence.
    t.ready.catch(() => {});
    t.finished.catch(() => {});
    return t.updateCallbackDone;
  } catch (e) {
    fn();
    return Promise.resolve();
  }
};
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// Balise des jets de dés (dice.js) : une demande du narrateur (« Adresse, difficile ») ou un résultat lancé par
// l'application (« … : 14 + 2 = 16, réussite », reconnu à ses deux-points suivis d'un nombre ; « Adresse :
// difficile » reste une demande).
export const JET = /<jet>([^<]*)<\/jet>/gi;
export const isRoll = x => /:\s*[-−]?\d/.test(x);
// Texte enregistré sans images, jets en clair (le résultat entre parenthèses, la demande retirée) : ce que lit le
// modèle de mémoire, qui garde {{user}}.
export const bare = t =>
  t.replace(/\{\{img::[^}]*\}\}/g, '').replace(JET, (m, x) => (isRoll(x) ? '(Jet : ' + x.trim() + ')' : ''));
// Texte enregistré (choix et état déjà à part, split) en texte simple, avec le nom du joueur.
export const plain = (t, nm) =>
  bare(t)
    .replace(/\{\{user\}\}/gi, nm?.trim() || 'Joueur')
    .trim();
export const err = (t, bad, a) => {
  const e = $('#err');
  e.textContent = t;
  e.className = t && bad ? 'e' : '';
  if (t && a)
    e.append(
      el('button', {
        text: a.label,
        onclick: () => {
          err('');
          a.fn();
        }
      })
    );
};
export const fit = () => {
  const i = $('#inp');
  i.style.height = 'auto';
  i.style.height = Math.min(i.scrollHeight, 140) + 'px';
};
export const nz = s =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export const ikey = s =>
  nz(s)
    .replace(/[\s_.\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
// Fichier à garder : partagé sur mobile, téléchargé ailleurs (ou si le partage échoue). false si le partage est
// annulé.
export const saveFile = async f => {
  const dl = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1e4);
  };
  try {
    if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f] });
    else dl();
  } catch (e) {
    if (e.name == 'AbortError') return false;
    dl();
  }
  return true;
};
// Toast permanent (a.keep, l'offre de nouvelle version) : un toast passager le recouvre puis le laisse revenir.
let keep = null;
// Le toast est un popover, au premier plan même au-dessus d'une feuille ouverte. Affiché, il est rangé en tête
// de la dernière feuille ouverte : hors d'elle, une feuille modale rendrait son bouton inactif, et en dernier
// il prendrait la place de la barre du bas. Caché, il revient dans la page ; si sa feuille se ferme pendant
// qu'il est affiché, il passe dans la feuille ouverte suivante ou dans la page.
const pop = (e, on) => {
  e.hidden = !on;
  try {
    if (e.matches(':popover-open')) e.hidePopover();
    const d = on && [...document.querySelectorAll('dialog[open]')].at(-1);
    if (d) {
      d.prepend(e);
      d.addEventListener('close', () => e.hidden || pop(e, true), { once: true });
    } else document.body.append(e);
    if (on) e.showPopover();
  } catch (x) {}
};
export const toast = (t, a) => {
  const e = $('#toast');
  if (a?.keep) keep = [t, a];
  const end = () => {
    clearTimeout(toastT);
    if (keep && !a?.keep) toast(...keep);
    else pop(e, false);
  };
  e.textContent = t;
  if (a)
    e.append(
      el('button', {
        text: a.label,
        onclick: () => {
          if (a.keep) keep = null;
          end();
          a.fn();
        }
      })
    );
  pop(e, true);
  clearTimeout(toastT);
  if (!a?.keep) toastT = setTimeout(end, a ? 7000 : 2600);
};
