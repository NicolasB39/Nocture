// Règles de nommage reprises de l'application (js/util.js nz et ikey, js/scenarios.js codeOf), recopiées ici pour
// que le skill reste autonome. test/regles.test.js vérifie qu'elles donnent les mêmes codes d'images que
// l'application sur tous les scénarios du dépôt : une règle changée d'un seul côté y est vue.
export const IMG = /\.(webp|png|jpe?g|gif)$/i;
export const nz = s =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
export const ikey = s =>
  nz(s)
    .replace(/[\s_.\-]+/g, '_')
    .replace(/^_+|_+$/g, '');
// Code d'une image : préfixe_fichier (dossier du personnage, ou « monstre »), sans doubler un préfixe que le fichier
// porte déjà.
export const codeOf = (n, f) => (ikey(f).startsWith(ikey(n) + '_') ? '' : ikey(n) + '_') + ikey(f);
