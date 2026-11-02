// Page de réparation : la même réparation que le bouton de l'application (repair, boot.js), avec sa vérification
// du réseau. Pas d'application à démarrer ici : __started évite l'alerte « Le démarrage n'a pas abouti ».
(function () {
  window.__started = true;
  var s = document.getElementById('st');
  document.getElementById('go').onclick = function () {
    s.textContent = 'Réparation en cours…';
    window.__boot.repair(function (done) {
      if (!done) {
        s.textContent = "Serveur injoignable : rien n'a été vidé. Réessayez une fois connecté.";
        return;
      }
      s.textContent = "Réparation terminée. Ouverture de l'application…";
      setTimeout(function () {
        location.href = './';
      }, 900);
    });
  };
})();
