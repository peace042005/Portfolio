/*
 * site.js : remplit le portfolio à partir de contenu.json.
 *
 * Principe : index.html contient des zones vides marquées data-zone="...".
 * Ce script lit contenu.json, fabrique le HTML de chaque zone et l'insère.
 * Règle du modèle : un champ vide n'est pas affiché.
 *
 * La fonction afficher() est aussi appelée par le dashboard pour l'aperçu en direct.
 */
(function () {
  'use strict';

  // Fichiers choisis dans le dashboard mais pas encore enregistrés (aperçu uniquement).
  // Clé : chemin du fichier (ex. "img/photo.jpg"), valeur : adresse temporaire de l'image.
  var fichiersApercu = {};

  /* ---------- Petits outils ---------- */

  // Protège le texte avant de l'insérer dans le HTML : un « < » tapé dans le dashboard
  // reste un caractère et ne devient pas une balise.
  function e(texte) {
    return String(texte == null ? '' : texte).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Comme e(), mais refuse les liens dangereux du type « javascript: ».
  function lien(adresse) {
    var a = String(adresse || '').trim();
    return /^(javascript|data|vbscript):/i.test(a) ? '#' : e(a);
  }

  // Adresse d'une image : la version temporaire si on est dans l'aperçu, sinon le fichier.
  function source(chemin) {
    if (fichiersApercu[chemin]) return e(fichiersApercu[chemin]); // image de l'aperçu (adresse « data: » créée par le dashboard)
    return lien(chemin);
  }

  // Vrai si la valeur contient quelque chose (texte non vide, liste non vide…).
  function rempli(v) {
    if (Array.isArray(v)) return v.some(rempli);
    if (v && typeof v === 'object') return Object.keys(v).some(function (k) { return rempli(v[k]); });
    return String(v == null ? '' : v).trim() !== '';
  }

  // Applique une fonction à chaque élément d'une liste et colle les morceaux de HTML.
  function chaque(liste, fabrique) {
    return (liste || []).filter(rempli).map(fabrique).join('');
  }

  // N'affiche le HTML que si la valeur est remplie.
  function si(valeur, html) {
    return rempli(valeur) ? html : '';
  }

  function remplir(zone, html) {
    document.querySelectorAll('[data-zone="' + zone + '"]').forEach(function (el) { el.innerHTML = html; });
  }

  /* ---------- Fabrication de chaque section ---------- */

  function accueil(a) {
    var mots = String(a.nom || '').trim().split(' ');
    var nom = e(mots.shift()) + (mots.length ? '<br>' + e(mots.join(' ')) : '');
    return '<h1>' + nom + '</h1>' +
      si(a.titre, '<p class="titre">' + e(a.titre) + '</p>') +
      si(a.accroche, '<p class="lede">' + e(a.accroche) + '</p>') +
      si([a.disponibilite, a.disponibiliteDate],
        '<p class="dispo">' + e(a.disponibilite) + ' <strong>' + e(a.disponibiliteDate) + '</strong></p>') +
      '<div class="actions">' +
        '<a class="btn btn-main" href="#contact">Me contacter</a>' +
        '<a class="btn btn-ghost" href="#projets">Voir mes projets</a>' +
      '</div>';
  }

  function qui(p, nom) {
    return si(p.photo, '<img class="photo" src="' + source(p.photo) + '" alt="Photo de ' + e(nom) + '" width="160" height="160">') +
      chaque(p.paragraphes, function (t) { return '<p>' + e(t) + '</p>'; }) +
      si(p.qualites, '<ul class="qualites">' + chaque(p.qualites, function (q) { return '<li>' + e(q) + '</li>'; }) + '</ul>');
  }

  function boiteCv(p) {
    if (!rempli(p.cv)) return '';
    return '<p>Mon CV à jour, au format PDF.</p>' +
      '<a class="btn btn-main" href="' + source(p.cv) + '" download>Télécharger mon CV</a>';
  }

  function formation(f) {
    return '<li><span class="quand">' + e(f.periode) + '</span>' +
      '<div><strong>' + e(f.intitule) + '</strong>' + si(f.lieu, '<span>' + e(f.lieu) + '</span>') + '</div></li>';
  }

  function service(s, i) {
    return '<article class="service"><span class="num">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<h3>' + e(s.titre) + '</h3>' + si(s.description, '<p>' + e(s.description) + '</p>') + '</article>';
  }

  function competence(c) {
    return '<div><h4>' + e(c.titre) + '</h4><p>' + e(c.elements) + '</p></div>';
  }

  function experience(x) {
    return '<li class="carte experience">' +
      '<span class="quand">' + e(x.periode) + '</span>' +
      '<div><h4>' + e(x.poste) + '</h4>' + si(x.entreprise, '<p class="lieu">' + e(x.entreprise) + '</p>') +
      si(x.missions, '<ul>' + chaque(x.missions, function (m) { return '<li>' + e(m) + '</li>'; }) + '</ul>') +
      si(x.technologies, '<p class="stack">' + e(x.technologies) + '</p>') +
      '</div></li>';
  }

  // Le bloc « Démo en ligne » avec les comptes de test.
  function demo(d) {
    if (!rempli(d)) return '';
    return '<div class="acces"><div class="etat">Démo en ligne</div>' +
      si(d.comptes, '<dl>' + chaque(d.comptes, function (c) {
        return '<dt>' + e(c.libelle) + '</dt><dd>' + e(c.valeur) + '</dd>' +
          '<button class="copier" type="button" data-copier="' + e(c.valeur) + '">Copier</button>';
      }) + '</dl>') +
      si(d.lien, '<p class="lien-demo"><a href="' + lien(d.lien) + '" target="_blank" rel="noopener">Ouvrir la démo</a> <span>' + e(d.lien) + '</span></p>') +
      si(d.note, '<p class="note">' + e(d.note) + '</p>') +
      '</div>';
  }

  // Le contenu complet d'un projet : affiché dans la fenêtre « Voir détail »,
  // et directement dans la page pour la version PDF.
  function detailProjet(p) {
    return '<div class="detail">' +
      si([p.cadre, p.dates, p.equipe], '<dl class="contexte">' +
        si(p.cadre, '<dt>Cadre</dt><dd>' + e(p.cadre) + '</dd>') +
        si(p.dates, '<dt>Dates</dt><dd>' + e(p.dates) + '</dd>') +
        si(p.equipe, '<dt>Équipe</dt><dd>' + e(p.equipe) + '</dd>') + '</dl>') +
      si(p.role, '<p><b>Mon rôle :</b> ' + e(p.role) + '</p>') +
      si(p.fonctionnalites, '<p><b>Fonctionnalités :</b> ' + e(p.fonctionnalites) + '</p>') +
      si(p.defi, '<div class="defi"><h4>Défi et solution</h4><p>' + e(p.defi) + '</p></div>') +
      si(p.technologies, '<p class="stack"><b>Technologies :</b> ' + e(p.technologies) + '</p>') +
      demo(p.demo) +
      si(p.liens, '<p class="liens">' + chaque(p.liens, function (l) {
        return '<a href="' + lien(l.url) + '" target="_blank" rel="noopener">' + e(l.libelle || l.url) + '</a>';
      }) + '</p>') +
      si(p.images, '<div class="captures ' + (p.format === 'telephone' ? 'tel' : '') + '">' + chaque(p.images, function (img) {
        return '<img src="' + source(img.src) + '" alt="' + e(img.alt) + '" loading="lazy">';
      }) + '</div>') +
      '</div>';
  }

  function carteProjet(p, i) {
    var image = (p.images || []).filter(function (img) { return rempli(img.src); })[0];
    var github = (p.liens || []).filter(function (l) { return rempli(l.url); })[0];
    return '<article class="carte projet ' + (p.format === 'telephone' ? 'format-tel' : '') + '">' +
      si(image, '<div class="vignette"><img src="' + source(image && image.src) + '" alt="' + e(image && image.alt) + '" loading="lazy"></div>') +
      '<div class="projet-corps">' +
        '<h3>' + e(p.titre) + '</h3>' +
        si(p.resume, '<p>' + e(p.resume) + '</p>') +
        si(p.technologies, '<p class="stack">' + e(p.technologies) + '</p>') +
        '<div class="projet-actions">' +
          '<button class="btn btn-main" type="button" data-detail="' + i + '">Voir détail</button>' +
          si(github, '<a class="btn btn-ghost" href="' + lien(github && github.url) + '" target="_blank" rel="noopener">GitHub</a>') +
        '</div>' +
        detailProjet(p) +
      '</div></article>';
  }

  function coordonnees(c) {
    return si(c.email, '<a class="mail" href="mailto:' + e(c.email) + '">' + e(c.email) + '</a>') +
      '<div class="autres">' + chaque(c.liens, function (l) {
        return '<a href="' + lien(l.url) + '" target="_blank" rel="noopener">' + e(l.libelle) + '</a>';
      }) + '</div>';
  }

  /* ---------- Affichage complet ---------- */

  function afficher(c, apercu) {
    fichiersApercu = apercu || {};
    var a = c.accueil || {}, p = c.apropos || {}, ct = c.contact || {};

    remplir('marque', e(a.nom));
    remplir('accueil', accueil(a));
    remplir('qui', qui(p, a.nom));
    remplir('cv', boiteCv(p));
    remplir('formations', chaque(p.formations, formation));
    remplir('veille', si(p.veille, '<p>' + e(p.veille) + '</p>'));
    remplir('services', chaque(c.services, service));
    remplir('competences', chaque(c.competences, competence));
    remplir('experiences', chaque(c.experiences, experience));
    remplir('projets', (c.projets || []).map(carteProjet).join(''));
    remplir('contact-message', e(ct.message));
    remplir('confidentialite', e(ct.confidentialite));
    remplir('coordonnees', coordonnees(ct));
    remplir('pied', e(c.piedDePage));

    // Le formulaire envoie les messages à l'adresse e-mail du contenu (service FormSubmit).
    var form = document.querySelector('[data-zone="formulaire"]');
    if (form) form.action = 'https://formsubmit.co/' + encodeURIComponent(ct.email || '');

    // Cache les sections vides (ex. aucun service saisi).
    ['services', 'competences', 'projets'].forEach(function (id) {
      var vide = !rempli(c[id]) && !(id === 'competences' && rempli(c.experiences));
      document.getElementById(id).hidden = vide;
      var menu = document.querySelector('nav a[href="#' + id + '"]');
      if (menu) menu.parentNode.hidden = vide;
    });

    // Signal pour le robot PDF : la page est prête.
    document.documentElement.setAttribute('data-pret', 'oui');
  }

  // Rendue accessible au dashboard (aperçu en direct).
  window.afficherPortfolio = afficher;

  /* ---------- Interactions ---------- */

  // Menu mobile
  var bouton = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  bouton.addEventListener('click', function () {
    var ouvert = menu.classList.toggle('ouvert');
    bouton.setAttribute('aria-expanded', ouvert);
  });
  menu.addEventListener('click', function (ev) {
    if (ev.target.tagName === 'A') {
      menu.classList.remove('ouvert');
      bouton.setAttribute('aria-expanded', 'false');
    }
  });

  var fenetre = document.getElementById('detail');

  // Un seul écouteur pour toute la page : il gère les boutons « Copier » et « Voir détail »,
  // même ceux ajoutés après coup.
  document.addEventListener('click', function (ev) {
    var copier = ev.target.closest('[data-copier]');
    if (copier && navigator.clipboard) {
      navigator.clipboard.writeText(copier.getAttribute('data-copier')).then(function () {
        copier.textContent = 'Copié';
        setTimeout(function () { copier.textContent = 'Copier'; }, 1500);
      });
    }

    var voir = ev.target.closest('[data-detail]');
    if (voir) {
      var carte = voir.closest('.projet');
      fenetre.querySelector('#detail-titre').textContent = carte.querySelector('h3').textContent;
      fenetre.querySelector('.detail-corps').innerHTML = carte.querySelector('.detail').innerHTML;
      fenetre.showModal();
    }

    // Fermer la fenêtre : bouton « Fermer » ou clic sur le fond sombre.
    if (ev.target.closest('.fermer') || ev.target === fenetre) fenetre.close();
  });

  /* ---------- Chargement du contenu ---------- */

  // Dans l'aperçu du tableau de bord, c'est le tableau de bord qui fournit le contenu.
  if (window.frameElement && window.frameElement.id === 'apercu-iframe') return;

  fetch('contenu.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (c) { afficher(c); })
    .catch(function () {
      remplir('accueil', '<p>Le contenu du portfolio n\'a pas pu être chargé.</p>');
    });
})();
