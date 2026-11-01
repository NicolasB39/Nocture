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
    t.finished.catch(() => {});
    return t.updateCallbackDone;
  } catch (e) {
    fn();
    return Promise.resolve();
  }
};
// Couleur d'accent d'un scénario : les variables CSS qu'elle remplace (null : celles de l'appli). Le texte posé
// sur l'accent passe en clair si la couleur est sombre.
const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const accentVars = h => {
  if (!/^#[0-9a-f]{6}$/i.test(h || '')) return null;
  const [r, g, b] = rgbOf(h),
    a = x => 'rgba(' + r + ', ' + g + ', ' + b + ', ' + x + ')',
    lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return { '--ac': h, '--acs': a(0.13), '--act': a(0.16), '--acb': a(0.45), '--on': lum > 0.5 ? '#0a0a0b' : '#ffffff' };
};
// Accent tiré d'une image (pixels RGBA) : la moyenne des pixels les plus vifs, éclaircie pour rester lisible
// sur le fond sombre.
export const pickAccent = px => {
  const c = [];
  for (let i = 0; i + 3 < px.length; i += 4) {
    const [r, g, b, al] = [px[i], px[i + 1], px[i + 2], px[i + 3]],
      mx = Math.max(r, g, b),
      mn = Math.min(r, g, b);
    if (al < 128 || mx < 60) continue;
    c.push({ r, g, b, s: ((mx - mn) / mx) * (mx / 255) });
  }
  if (!c.length) return '';
  c.sort((x, y) => y.s - x.s);
  const top = c.slice(0, Math.max(1, Math.ceil(c.length / 10))),
    avg = k => top.reduce((a, x) => a + x[k], 0) / top.length;
  let [r, g, b] = [avg('r'), avg('g'), avg('b')].map(x => x / 255);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    l = (mx + mn) / 2,
    s = mx == mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
  if (mx != mn)
    h = mx == r ? (g - b) / (mx - mn) + (g < b ? 6 : 0) : mx == g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
  h /= 6;
  s = Math.max(s, 0.45);
  l = Math.min(Math.max(l, 0.62), 0.78);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s,
    p = 2 * l - q,
    hue = t => {
      t = (t + 1) % 1;
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    };
  return (
    '#' +
    [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
  );
};
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const plain = (t, nm) =>
  t
    .replace(/<choix>[\s\S]*?(?:<\/choix>|$)/gi, '')
    .replace(/<etat>[\s\S]*?(?:<\/etat>|$)/gi, '')
    .replace(/\{\{img::[^}]*\}\}/g, '')
    .replace(/\{\{user\}\}/gi, nm?.trim() || 'Joueur')
    .trim();
export const err = (t, bad, a) => {
  const e = $('#err');
  e.textContent = t;
  e.className = t && bad ? 'e' : '';
  if (t && a) {
    const b = document.createElement('button');
    b.textContent = a.label;
    b.onclick = () => {
      err('');
      a.fn();
    };
    e.append(b);
  }
};
export const num = s => ($(s).value === '' ? null : +$(s).value);
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
export const toast = (t, a) => {
  const e = $('#toast');
  e.textContent = t;
  if (a) {
    const b = document.createElement('button');
    b.textContent = a.label;
    b.onclick = () => {
      e.hidden = true;
      clearTimeout(toastT);
      a.fn();
    };
    e.append(b);
  }
  e.hidden = false;
  clearTimeout(toastT);
  if (a?.keep) return;
  toastT = setTimeout(
    () => {
      e.hidden = true;
    },
    a ? 7000 : 2600
  );
};
