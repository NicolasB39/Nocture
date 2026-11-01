// Claude seul : les autres fournisseurs (Groq, Gemini, Mistral, OpenRouter) restent dans le tag git multi-ia.
// Clé, modèles et statistiques restent rangés sous k.
export const API = { k: 'claude', u: 'https://api.anthropic.com/v1', m: 'claude-sonnet-5-5' };
export const S = { keys: {}, models: {} };
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
