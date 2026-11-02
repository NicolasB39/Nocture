// Navigateur minimal pour charger les modules de l'application sous Node : à importer avant eux. Un test qui
// construit des éléments remplace document par le sien ensuite. localStorage garde ce qu'on y écrit.
const L = new Map();
globalThis.document = { createElement: () => ({}), querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
globalThis.matchMedia = () => ({ matches: false });
globalThis.localStorage = {
  getItem: k => L.get(k) ?? null,
  setItem: (k, v) => L.set(k, String(v)),
  removeItem: k => L.delete(k)
};
