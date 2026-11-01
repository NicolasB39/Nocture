// API Claude et modèle de narration par défaut.
export const API = { u: 'https://api.anthropic.com/v1', m: 'claude-sonnet-5-5' };
export const S = { key: '', model: '' };
export const ctx = { system: '', avatar: '', chars: [], lore: [], images: [], stat: '', decors: [], decorDef: '', intro: '' };
export const IMG = {};
export const app = {
  cur: null,
  menuId: null,
  editI: null,
  actI: null,
  busy: false,
  ctl: null,
  LIM: 50,
  FIL: 'all',
  stream: null,
  reading: false,
  pt: 0
};
