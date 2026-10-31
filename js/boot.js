(function () {
  var probs = [];
  var box = null;
  // Hors ligne, vider les caches et retirer le service worker rendrait l'application inutilisable jusqu'au
  // retour du réseau : on vérifie d'abord que le serveur répond (le vrai sw.js, pas la page d'un portail
  // Wi-Fi), sinon simple rechargement.
  function repair() {
    return fetch('sw.js', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.text() : '';
      })
      .then(
        function (t) {
          return t.indexOf("'nocturne-") >= 0 ? clear() : location.reload();
        },
        function () {
          location.reload();
        }
      );
  }
  function clear() {
    var tasks = [];
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
      tasks.push(
        navigator.serviceWorker.getRegistrations().then(function (rs) {
          return Promise.all(
            rs.map(function (r) {
              return r.unregister();
            })
          );
        })
      );
    if (window.caches)
      tasks.push(
        caches.keys().then(function (ks) {
          return Promise.all(
            ks.map(function (k) {
              return caches.delete(k);
            })
          );
        })
      );
    return Promise.all(tasks).then(
      function () {
        location.reload();
      },
      function () {
        location.reload();
      }
    );
  }
  function btn(label, primary, fn) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText =
      'flex:1;padding:12px;border:0;border-radius:14px;font:600 15px system-ui,sans-serif;cursor:pointer;' +
      (primary ? 'background:#e8b45c;color:#0a0a0b' : 'background:#3b3b47;color:#f2f2ee');
    b.onclick = fn;
    return b;
  }
  function render() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', render, { once: true });
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('role', 'alert');
      box.style.cssText =
        'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;padding:16px;border-radius:18px;background:#17171d;color:#f2f2ee;border:1px solid #ff6b6b;font:15px/1.5 system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.6);max-height:75vh;overflow:auto';
      document.body.appendChild(box);
    }
    box.textContent = '';
    var fatal = probs.some(function (x) {
      return !x.soft;
    });
    var t = document.createElement('b');
    t.textContent = fatal ? "L'application ne démarre pas correctement" : 'Mise à jour incomplète';
    t.style.cssText = 'display:block;margin-bottom:6px;font-size:16px';
    box.appendChild(t);
    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 8px;color:#b6b6bf;font-size:14px';
    p.textContent = fatal
      ? 'Un fichier est manquant ou ne correspond pas aux autres (déploiement incomplet ou cache périmé). Vos histoires ne sont pas effacées.'
      : "Les fichiers de l'application ne sont pas tous de la même version : certaines fonctions peuvent manquer. Vos histoires ne sont pas effacées.";
    box.appendChild(p);
    var ul = document.createElement('ul');
    ul.style.cssText =
      'margin:0 0 12px;padding-left:18px;color:#ff9b9b;font-size:13px;word-break:break-all';
    probs.slice(0, 6).forEach(function (x) {
      var li = document.createElement('li');
      li.textContent = x.m;
      ul.appendChild(li);
    });
    box.appendChild(ul);
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px';
    row.appendChild(btn('Réparer', true, repair));
    row.appendChild(
      btn('Recharger', false, function () {
        location.reload();
      })
    );
    box.appendChild(row);
  }
  function add(m, soft) {
    if (
      !probs.some(function (x) {
        return x.m == m;
      })
    )
      probs.push({ m: m, soft: !!soft });
    render();
  }
  window.addEventListener(
    'error',
    function (e) {
      var t = e.target;
      if (t && (t.tagName == 'SCRIPT' || t.tagName == 'LINK')) {
        add('Fichier introuvable : ' + (t.src || t.href).split('/').slice(-2).join('/'));
      } else if (e.message && !window.__started) {
        add(e.message + (e.filename ? ' (' + e.filename.split('/').slice(-2).join('/') + ')' : ''));
      }
    },
    true
  );
  window.__boot = {
    warn: function (m) {
      add(m, true);
    },
    fail: function (m) {
      add(m, false);
    },
    repair: repair
  };
  setTimeout(function () {
    if (!window.__started) add("Le démarrage n'a pas abouti.");
    else if (window.__missing && window.__missing.size)
      add(
        'Éléments de page introuvables : ' + Array.from(window.__missing).slice(0, 6).join(', '),
        true
      );
  }, 6000);
})();
