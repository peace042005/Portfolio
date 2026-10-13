/*
 * admin.js : le tableau de bord du portfolio.
 *
 * 1. On se connecte avec un jeton GitHub (gardé seulement dans cet onglet : sessionStorage).
 * 2. On lit contenu.json directement dans le dépôt GitHub.
 * 3. Des formulaires sont fabriqués automatiquement à partir du SCHEMA ci-dessous.
 * 4. « Enregistrer » envoie contenu.json (et les images choisies) au dépôt en UN SEUL commit.
 *    Vercel met alors le site à jour, et le robot GitHub refait le PDF.
 */
(function () {
  'use strict';

  /* =========================================================
     Réglages : le dépôt GitHub qui contient le portfolio
     ========================================================= */
  var DEPOT = { proprietaire: 'peace042005', nom: 'portfolio', branche: 'main' };
  var API = 'https://api.github.com/repos/' + DEPOT.proprietaire + '/' + DEPOT.nom;

  /* =========================================================
     Le SCHEMA : la liste des champs modifiables.
     Ajouter un champ ici suffit à le faire apparaître dans le tableau de bord
     (il faut ensuite l'afficher dans js/site.js).

     Types : texte, texteLong, email, url, choix, mots (liste de mots séparés par des virgules),
             textes (liste de paragraphes), image, fichier, objet (groupe de champs),
             liste (liste d'éléments que l'on peut ajouter, supprimer et déplacer).
     ========================================================= */
  var VIDE = 'Laisser vide pour ne rien afficher.';

  var SCHEMA = [
    { id: 'accueil', titre: 'Accueil', ancre: 'haut', champ: {
      cle: 'accueil', type: 'objet', champs: [
        { cle: 'nom', label: 'Nom', type: 'texte' },
        { cle: 'titre', label: 'Titre', type: 'texte', aide: 'Ex. : Développeuse web et mobile' },
        { cle: 'accroche', label: 'Phrase d\'accroche', type: 'texteLong' }
      ] } },

    { id: 'apropos', titre: 'À propos', ancre: 'apropos', champ: {
      cle: 'apropos', type: 'objet', champs: [
        { cle: 'photo', label: 'Photo', type: 'image', dossier: 'img/', aide: 'Format carré conseillé.' },
        { cle: 'paragraphes', label: 'Qui suis-je ? (paragraphes)', type: 'textes', ajouter: 'Ajouter un paragraphe' },
        { cle: 'qualites', label: 'Qualités', type: 'mots', aide: 'Séparées par des virgules.' },
        { cle: 'cv', label: 'CV (PDF)', type: 'fichier', accepte: 'application/pdf', cheminFixe: 'cv/CV_Marcella_Chanhoun.pdf',
          aide: 'Le nouveau fichier remplace l\'ancien.' },
        { cle: 'formations', label: 'Mes formations', type: 'liste', titreElement: 'intitule', ajouter: 'Ajouter une formation', champs: [
          { cle: 'periode', label: 'Période', type: 'texte', aide: 'Ex. : 2026 – 2027' },
          { cle: 'intitule', label: 'Intitulé', type: 'texte' },
          { cle: 'lieu', label: 'Établissement et ville', type: 'texte' }
        ] },
        { cle: 'veille', label: 'Ma veille informatique', type: 'texteLong' }
      ] } },

    { id: 'services', titre: 'Services', ancre: 'services', champ: {
      cle: 'services', type: 'liste', label: 'Mes services', titreElement: 'titre', ajouter: 'Ajouter un service', champs: [
        { cle: 'titre', label: 'Titre', type: 'texte' },
        { cle: 'description', label: 'Description', type: 'texteLong' }
      ] } },

    { id: 'competences', titre: 'Compétences', ancre: 'competences', champ: {
      cle: 'competences', type: 'liste', label: 'Catégories de compétences', titreElement: 'titre', ajouter: 'Ajouter une catégorie', champs: [
        { cle: 'titre', label: 'Catégorie', type: 'texte', aide: 'Ex. : Langages' },
        { cle: 'elements', label: 'Éléments', type: 'texte', aide: 'Ex. : PHP, JavaScript, Dart' }
      ] } },

    { id: 'experiences', titre: 'Expériences', ancre: 'competences', champ: {
      cle: 'experiences', type: 'liste', label: 'Expériences professionnelles', titreElement: 'poste', ajouter: 'Ajouter une expérience', champs: [
        { cle: 'periode', label: 'Période', type: 'texte', aide: 'Ex. : Mars – juin 2026' },
        { cle: 'poste', label: 'Poste', type: 'texte' },
        { cle: 'entreprise', label: 'Entreprise et ville', type: 'texte' },
        { cle: 'missions', label: 'Missions', type: 'textes', ajouter: 'Ajouter une mission' },
        { cle: 'technologies', label: 'Technologies', type: 'texte', aide: VIDE }
      ] } },

    { id: 'projets', titre: 'Projets', ancre: 'projets', champ: {
      cle: 'projets', type: 'liste', label: 'Projets', titreElement: 'titre', ajouter: 'Ajouter un projet', champs: [
        { cle: 'titre', label: 'Nom du projet', type: 'texte' },
        { cle: 'resume', label: 'Résumé (affiché sur la carte)', type: 'texteLong' },
        { cle: 'cadre', label: 'Cadre', type: 'texte', aide: 'Ex. : Projet universitaire (ENEAM). ' + VIDE },
        { cle: 'dates', label: 'Dates', type: 'texte', aide: VIDE },
        { cle: 'equipe', label: 'Équipe', type: 'texte', aide: 'Ex. : 4 personnes. ' + VIDE },
        { cle: 'role', label: 'Mon rôle', type: 'texteLong', aide: VIDE },
        { cle: 'fonctionnalites', label: 'Fonctionnalités', type: 'texteLong', aide: VIDE },
        { cle: 'defi', label: 'Défi et solution', type: 'texteLong', aide: VIDE },
        { cle: 'technologies', label: 'Technologies', type: 'texte' },
        { cle: 'format', label: 'Format des captures', type: 'choix', options: [['ecran', 'Écran d\'ordinateur'], ['telephone', 'Écran de téléphone']] },
        { cle: 'images', label: 'Captures d\'écran', type: 'liste', titreElement: 'alt', ajouter: 'Ajouter une capture',
          aide: 'La première sert d\'image sur la carte du projet.', champs: [
          { cle: 'src', label: 'Image', type: 'image', dossier: 'img/' },
          { cle: 'alt', label: 'Description de l\'image', type: 'texte', aide: 'Lue par les lecteurs d\'écran et les moteurs de recherche.' }
        ] },
        { cle: 'demo', label: 'Démo en ligne', type: 'objet', champs: [
          { cle: 'lien', label: 'Adresse de la démo', type: 'url', aide: VIDE },
          { cle: 'comptes', label: 'Comptes de test', type: 'liste', titreElement: 'libelle', ajouter: 'Ajouter une ligne', champs: [
            { cle: 'libelle', label: 'Libellé', type: 'texte', aide: 'Ex. : Mot de passe' },
            { cle: 'valeur', label: 'Valeur', type: 'texte' }
          ] },
          { cle: 'note', label: 'Petite note', type: 'texte', aide: VIDE }
        ] },
        { cle: 'liens', label: 'Liens vers le code', type: 'liste', titreElement: 'libelle', ajouter: 'Ajouter un lien',
          aide: 'Le premier lien devient le bouton « GitHub » de la carte.', champs: [
          { cle: 'libelle', label: 'Texte du lien', type: 'texte', aide: 'Ex. : Code source' },
          { cle: 'url', label: 'Adresse', type: 'url' }
        ] }
      ] } },

    { id: 'contact', titre: 'Contact', ancre: 'contact', champ: {
      cle: 'contact', type: 'objet', champs: [
        { cle: 'message', label: 'Petit message', type: 'texteLong' },
        { cle: 'email', label: 'Adresse e-mail', type: 'email', aide: 'Affichée sur le site.' },
        { cle: 'cleFormulaire', label: 'Clé du formulaire (Web3Forms)', type: 'texte',
          aide: 'Clé reçue par e-mail après inscription sur web3forms.com. Les messages du formulaire arrivent à l\'adresse utilisée pour l\'inscription. Cette clé peut être publique.' },
        { cle: 'confidentialite', label: 'Clause de confidentialité', type: 'texteLong' },
        { cle: 'liens', label: 'Liens', type: 'liste', titreElement: 'libelle', ajouter: 'Ajouter un lien',
          aide: 'Les liens GitHub et LinkedIn apparaissent aussi en icônes en haut du site.', champs: [
          { cle: 'libelle', label: 'Texte du lien', type: 'texte', aide: 'Ex. : LinkedIn' },
          { cle: 'url', label: 'Adresse', type: 'url' }
        ] }
      ] } },

    { id: 'pied', titre: 'Pied de page', ancre: 'contact', champ: {
      cle: 'piedDePage', label: 'Pied de page', type: 'texteLong', aide: 'Ville, langues, permis…' } }
  ];

  /* =========================================================
     État de l'application
     ========================================================= */
  var jeton = null;            // jeton GitHub de la session
  var contenu = null;          // le contenu en cours de modification
  var fichiers = {};           // fichiers choisis mais pas encore envoyés : { chemin: { base64, apercu } }
  var nonEnregistre = false;
  var sectionActive = SCHEMA[0];
  var ouverts = new WeakSet(); // éléments de liste dépliés (pour les garder ouverts après un redessin)
  var compteur = 0;            // sert à créer des identifiants uniques pour les champs

  var $ = function (id) { return document.getElementById(id); };

  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte != null) n.textContent = texte;
    return n;
  }

  /* =========================================================
     Communication avec GitHub
     ========================================================= */
  function github(chemin, options) {
    options = options || {};
    return fetch(API + chemin, {
      method: options.methode || 'GET',
      headers: {
        'Authorization': 'Bearer ' + jeton,
        'Accept': options.accept || 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: options.corps ? JSON.stringify(options.corps) : undefined,
      cache: 'no-store'
    }).then(function (r) {
      if (r.ok) return options.accept ? r.text() : r.json();
      var messages = {
        401: 'Jeton refusé : il est incorrect ou a expiré.',
        403: 'Ce jeton n\'a pas le droit de modifier le dépôt (droit « Contents : Read and write » manquant).',
        404: 'Dépôt ou fichier introuvable. Vérifie que le jeton donne accès au dépôt « ' + DEPOT.nom + ' ».',
        409: 'Le dépôt a changé pendant l\'enregistrement.',
        422: 'Le dépôt a changé pendant l\'enregistrement.'
      };
      var erreur = new Error(messages[r.status] || 'Erreur GitHub (' + r.status + ').');
      erreur.statut = r.status;
      throw erreur;
    });
  }

  // Lit contenu.json dans le dépôt (toujours la dernière version, pas celle du site en ligne).
  function lireContenu() {
    return github('/contents/contenu.json?ref=' + DEPOT.branche, { accept: 'application/vnd.github.raw+json' })
      .then(function (texte) { return JSON.parse(texte); });
  }

  // Envoie toutes les modifications en un seul commit (API « Git Data » de GitHub).
  function envoyer(message) {
    var dernierCommit;
    return github('/git/ref/heads/' + DEPOT.branche)
      .then(function (ref) {
        dernierCommit = ref.object.sha;
        return github('/git/commits/' + dernierCommit);
      })
      .then(function (commit) {
        // a) chaque fichier devient un « blob » (son contenu stocké chez GitHub)
        var envois = Object.keys(fichiers).map(function (chemin) {
          return github('/git/blobs', { methode: 'POST', corps: { content: fichiers[chemin].base64, encoding: 'base64' } })
            .then(function (b) { return { path: chemin, mode: '100644', type: 'blob', sha: b.sha }; });
        });
        envois.push(github('/git/blobs', { methode: 'POST', corps: { content: JSON.stringify(contenu, null, 2) + '\n', encoding: 'utf-8' } })
          .then(function (b) { return { path: 'contenu.json', mode: '100644', type: 'blob', sha: b.sha }; }));

        // b) on crée la nouvelle arborescence de fichiers, puis le commit
        return Promise.all(envois).then(function (arbre) {
          return github('/git/trees', { methode: 'POST', corps: { base_tree: commit.tree.sha, tree: arbre } });
        });
      })
      .then(function (arbre) {
        return github('/git/commits', { methode: 'POST', corps: { message: message, tree: arbre.sha, parents: [dernierCommit] } });
      })
      .then(function (nouveau) {
        // c) on fait avancer la branche main sur ce nouveau commit
        return github('/git/refs/heads/' + DEPOT.branche, { methode: 'PATCH', corps: { sha: nouveau.sha } });
      });
  }

  /* =========================================================
     Connexion
     ========================================================= */
  function demarrer() {
    jeton = sessionStorage.getItem('jeton-portfolio');
    if (!jeton) return montrerConnexion();
    lireContenu().then(ouvrirTableau).catch(function (err) {
      sessionStorage.removeItem('jeton-portfolio');
      montrerConnexion(err.message);
    });
  }

  function montrerConnexion(erreur) {
    $('tableau').hidden = true;
    $('connexion').hidden = false;
    $('erreur-connexion').textContent = erreur || '';
    $('jeton').focus();
  }

  $('form-connexion').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var bouton = ev.target.querySelector('button');
    jeton = $('jeton').value.trim();
    bouton.disabled = true;
    bouton.textContent = 'Connexion…';
    lireContenu().then(function (c) {
      sessionStorage.setItem('jeton-portfolio', jeton);
      $('jeton').value = '';
      ouvrirTableau(c);
    }).catch(function (err) {
      $('erreur-connexion').textContent = err.message;
    }).then(function () {
      bouton.disabled = false;
      bouton.textContent = 'Se connecter';
    });
  });

  $('bouton-deconnexion').addEventListener('click', function () {
    if (nonEnregistre && !confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')) return;
    sessionStorage.removeItem('jeton-portfolio');
    nonEnregistre = false;
    location.reload();
  });

  function ouvrirTableau(c) {
    contenu = c;
    fichiers = {};
    $('connexion').hidden = true;
    $('tableau').hidden = false;
    dessinerMenu();
    dessinerSection();
    mettreAJourApercu();
  }

  /* =========================================================
     Menu des sections et éditeur
     ========================================================= */
  function dessinerMenu() {
    var nav = $('sections');
    nav.innerHTML = '';
    SCHEMA.forEach(function (s) {
      var b = el('button', '', s.titre);
      b.type = 'button';
      b.setAttribute('aria-current', s === sectionActive ? 'page' : 'false');
      b.addEventListener('click', function () {
        sectionActive = s;
        dessinerMenu();
        dessinerSection();
        allerAncre();
      });
      nav.appendChild(b);
    });
  }

  function dessinerSection() {
    var zone = $('editeur');
    zone.innerHTML = '';
    zone.appendChild(el('h1', '', sectionActive.titre));
    zone.appendChild(champ(sectionActive.champ, contenu, true));
  }

  // Valeur vide adaptée au type (pour un nouvel élément de liste).
  function vide(def) {
    if (def.type === 'objet') {
      var o = {};
      def.champs.forEach(function (c) { o[c.cle] = vide(c); });
      return o;
    }
    if (def.type === 'liste' || def.type === 'textes' || def.type === 'mots') return [];
    if (def.type === 'choix') return def.options[0][0];
    return '';
  }

  // Fabrique l'éditeur d'un champ. « parent » est l'objet qui contient la valeur.
  function champ(def, parent, racine) {
    if (def.type === 'objet') return champObjet(def, parent, racine);
    if (def.type === 'liste') return champListe(def, parent);
    if (def.type === 'textes') return champTextes(def, parent);
    if (def.type === 'image' || def.type === 'fichier') return champFichier(def, parent);
    return champSimple(def, parent);
  }

  function etiquette(def, id) {
    var f = document.createDocumentFragment();
    if (def.label) {
      var l = el('label', 'etiquette', def.label);
      if (id) l.htmlFor = id;
      f.appendChild(l);
    }
    if (def.aide) f.appendChild(el('p', 'aide', def.aide));
    return f;
  }

  function champSimple(def, parent) {
    var bloc = el('div', 'champ');
    var id = 'champ-' + (++compteur);
    var saisie;

    if (def.type === 'texteLong') {
      saisie = el('textarea');
      saisie.rows = 4;
    } else if (def.type === 'choix') {
      saisie = el('select');
      def.options.forEach(function (o) {
        var opt = el('option', '', o[1]);
        opt.value = o[0];
        saisie.appendChild(opt);
      });
    } else {
      saisie = el('input');
      saisie.type = { email: 'email', url: 'url' }[def.type] || 'text';
    }
    saisie.id = id;

    if (def.type === 'mots') {
      saisie.value = (parent[def.cle] || []).join(', ');
    } else {
      saisie.value = parent[def.cle] == null ? vide(def) : parent[def.cle];
    }

    saisie.addEventListener('input', function () {
      parent[def.cle] = def.type === 'mots'
        ? saisie.value.split(',').map(function (m) { return m.trim(); }).filter(Boolean)
        : saisie.value;
      modifie();
    });

    bloc.appendChild(etiquette(def, id));
    bloc.appendChild(saisie);
    return bloc;
  }

  function champObjet(def, parent, racine) {
    if (!parent[def.cle] || typeof parent[def.cle] !== 'object') parent[def.cle] = vide(def);
    var objet = parent[def.cle];
    var bloc = el(racine ? 'div' : 'fieldset', racine ? 'groupe' : 'groupe cadre');
    if (def.label && !racine) bloc.appendChild(el('legend', '', def.label));
    if (def.aide) bloc.appendChild(el('p', 'aide', def.aide));
    def.champs.forEach(function (c) { bloc.appendChild(champ(c, objet)); });
    return bloc;
  }

  // Petits boutons « monter / descendre / supprimer » communs aux listes.
  function boutonsDeplacement(liste, index, redessiner, nom) {
    var zone = el('div', 'deplacer');
    [['↑', 'Monter', -1], ['↓', 'Descendre', 1]].forEach(function (b) {
      var bouton = el('button', 'petit', b[0]);
      bouton.type = 'button';
      bouton.title = b[1];
      bouton.setAttribute('aria-label', b[1] + ' : ' + nom);
      bouton.disabled = index + b[2] < 0 || index + b[2] >= liste.length;
      bouton.addEventListener('click', function (ev) {
        ev.preventDefault();
        var element = liste.splice(index, 1)[0];
        liste.splice(index + b[2], 0, element);
        modifie();
        redessiner();
      });
      zone.appendChild(bouton);
    });
    var suppr = el('button', 'petit danger', 'Supprimer');
    suppr.type = 'button';
    suppr.setAttribute('aria-label', 'Supprimer : ' + nom);
    suppr.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!confirm('Supprimer « ' + nom + ' » ?')) return;
      liste.splice(index, 1);
      modifie();
      redessiner();
    });
    zone.appendChild(suppr);
    return zone;
  }

  function champListe(def, parent) {
    if (!Array.isArray(parent[def.cle])) parent[def.cle] = [];
    var liste = parent[def.cle];
    var bloc = el('div', 'champ liste');
    bloc.appendChild(etiquette(def));
    var conteneur = el('div', 'elements');
    bloc.appendChild(conteneur);

    function nomDe(element, i) {
      return String(element[def.titreElement] || '').trim() || 'Élément ' + (i + 1);
    }

    function redessiner() {
      conteneur.innerHTML = '';
      if (!liste.length) conteneur.appendChild(el('p', 'aide', 'Aucun élément pour le moment.'));
      liste.forEach(function (element, i) {
        var carte = el('details', 'element');
        carte.open = ouverts.has(element);
        carte.addEventListener('toggle', function () {
          if (carte.open) ouverts.add(element); else ouverts.delete(element);
        });
        var resume = el('summary');
        var nom = el('span', 'nom', nomDe(element, i));
        resume.appendChild(nom);
        resume.appendChild(boutonsDeplacement(liste, i, redessiner, nomDe(element, i)));
        carte.appendChild(resume);

        var corps = el('div', 'corps');
        def.champs.forEach(function (c) { corps.appendChild(champ(c, element)); });
        // Le titre de l'élément suit ce qu'on tape.
        corps.addEventListener('input', function () { nom.textContent = nomDe(element, i); });
        carte.appendChild(corps);
        conteneur.appendChild(carte);
      });
    }

    var ajouter = el('button', 'btn btn-ghost ajouter', '+ ' + (def.ajouter || 'Ajouter'));
    ajouter.type = 'button';
    ajouter.addEventListener('click', function () {
      var nouveau = vide({ type: 'objet', champs: def.champs });
      liste.push(nouveau);
      ouverts.add(nouveau);
      modifie();
      redessiner();
      conteneur.lastChild.querySelector('input, textarea').focus();
    });

    redessiner();
    bloc.appendChild(ajouter);
    return bloc;
  }

  function champTextes(def, parent) {
    if (!Array.isArray(parent[def.cle])) parent[def.cle] = [];
    var liste = parent[def.cle];
    var bloc = el('div', 'champ textes');
    bloc.appendChild(etiquette(def));
    var conteneur = el('div', 'elements');
    bloc.appendChild(conteneur);

    function redessiner() {
      conteneur.innerHTML = '';
      liste.forEach(function (texte, i) {
        var ligne = el('div', 'ligne');
        var zone = el('textarea');
        zone.rows = 3;
        zone.value = texte;
        zone.setAttribute('aria-label', (def.label || 'Texte') + ' ' + (i + 1));
        zone.addEventListener('input', function () { liste[i] = zone.value; modifie(); });
        ligne.appendChild(zone);
        ligne.appendChild(boutonsDeplacement(liste, i, redessiner, 'texte ' + (i + 1)));
        conteneur.appendChild(ligne);
      });
    }

    var ajouter = el('button', 'btn btn-ghost ajouter', '+ ' + (def.ajouter || 'Ajouter'));
    ajouter.type = 'button';
    ajouter.addEventListener('click', function () {
      liste.push('');
      modifie();
      redessiner();
      conteneur.lastChild.querySelector('textarea').focus();
    });

    redessiner();
    bloc.appendChild(ajouter);
    return bloc;
  }

  /* ---------- Images et fichiers ---------- */

  // « Photo de moi (1).JPG » -> « photo-de-moi-1 »
  function nomPropre(nom) {
    return nom.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'fichier';
  }

  // Réduit une image trop grande (max 1600 px) et la convertit en JPEG : le site reste léger.
  function preparerImage(fichier) {
    return new Promise(function (ok, echec) {
      var img = new Image();
      img.onload = function () {
        var ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
        var toile = document.createElement('canvas');
        toile.width = Math.round(img.width * ratio);
        toile.height = Math.round(img.height * ratio);
        var ctx = toile.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, toile.width, toile.height);
        ctx.drawImage(img, 0, 0, toile.width, toile.height);
        URL.revokeObjectURL(img.src);
        ok(toile.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { echec(new Error('Cette image ne peut pas être lue.')); };
      img.src = URL.createObjectURL(fichier);
    });
  }

  function lireFichier(fichier) {
    return new Promise(function (ok) {
      var lecteur = new FileReader();
      lecteur.onload = function () { ok(lecteur.result); };
      lecteur.readAsDataURL(fichier);
    });
  }

  function champFichier(def, parent) {
    var bloc = el('div', 'champ fichier');
    var id = 'champ-' + (++compteur);
    bloc.appendChild(etiquette(def, id));

    var ligne = el('div', 'fichier-ligne');
    var vignette = el('div', 'vignette');
    var infos = el('div', 'infos');
    var chemin = el('code');
    var saisie = el('input');
    saisie.type = 'file';
    saisie.id = id;
    saisie.accept = def.accepte || 'image/*';
    var erreur = el('p', 'erreur');

    function afficher() {
      var valeur = parent[def.cle] || '';
      chemin.textContent = valeur || 'Aucun fichier';
      vignette.innerHTML = '';
      if (!valeur) return;
      var adresse = fichiers[valeur] ? fichiers[valeur].apercu : '../' + valeur;
      if (def.type === 'image') {
        var img = el('img');
        img.src = adresse;
        img.alt = '';
        vignette.appendChild(img);
      } else {
        var a = el('a', '', 'Ouvrir');
        a.href = adresse;
        a.target = '_blank';
        vignette.appendChild(a);
      }
    }

    saisie.addEventListener('change', function () {
      var f = saisie.files[0];
      erreur.textContent = '';
      if (!f) return;
      if (f.size > 15 * 1024 * 1024) { erreur.textContent = 'Fichier trop lourd (15 Mo maximum).'; return; }

      var preparation = def.type === 'image' ? preparerImage(f) : lireFichier(f);
      preparation.then(function (dataUrl) {
        var destination = def.cheminFixe ||
          (def.dossier || 'img/') + nomPropre(f.name) + (def.type === 'image' ? '.jpg' : '.' + f.name.split('.').pop().toLowerCase());
        fichiers[destination] = { base64: dataUrl.split(',')[1], apercu: dataUrl };
        parent[def.cle] = destination;
        afficher();
        modifie();
      }).catch(function (err) { erreur.textContent = err.message; });
    });

    infos.appendChild(chemin);
    infos.appendChild(saisie);
    infos.appendChild(erreur);
    ligne.appendChild(vignette);
    ligne.appendChild(infos);
    bloc.appendChild(ligne);
    afficher();
    return bloc;
  }

  /* =========================================================
     Modifications, aperçu et enregistrement
     ========================================================= */
  var minuterie;

  function modifie() {
    nonEnregistre = true;
    $('etat').textContent = 'Modifications non enregistrées';
    $('etat').className = 'etat attention';
    $('bouton-enregistrer').disabled = false;
    clearTimeout(minuterie);
    minuterie = setTimeout(mettreAJourApercu, 300);
  }

  // L'aperçu est le vrai site (../index.html) chargé dans un cadre.
  // On lui donne le contenu en cours, sans rien enregistrer.
  var cadre = $('apercu-iframe');

  function mettreAJourApercu() {
    var site = cadre.contentWindow;
    if (!contenu || !site || !site.afficherPortfolio) return;
    var images = {};
    Object.keys(fichiers).forEach(function (c) { images[c] = fichiers[c].apercu; });
    site.afficherPortfolio(contenu, images);
  }

  function allerAncre() {
    var doc = cadre.contentDocument;
    var cible = doc && doc.getElementById(sectionActive.ancre);
    if (cible) cible.scrollIntoView();
  }

  cadre.addEventListener('load', function () {
    mettreAJourApercu();
    allerAncre();
  });

  // Choix « Ordinateur / Téléphone » : le cadre garde sa vraie largeur et il est réduit à l'écran.
  var largeurApercu = 1280;
  function ajusterApercu() {
    var zone = $('apercu-cadre');
    var echelle = Math.min(1, zone.clientWidth / largeurApercu);
    cadre.style.width = largeurApercu + 'px';
    cadre.style.height = (zone.clientHeight / echelle) + 'px';
    cadre.style.transform = 'scale(' + echelle + ')';
  }
  document.querySelectorAll('.bascule button').forEach(function (b) {
    b.addEventListener('click', function () {
      largeurApercu = Number(b.dataset.largeur);
      document.querySelectorAll('.bascule button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      ajusterApercu();
    });
  });
  window.addEventListener('resize', ajusterApercu);
  new ResizeObserver(ajusterApercu).observe($('apercu-cadre'));

  // Sur petit écran, l'aperçu s'ouvre à la place de l'éditeur.
  $('bouton-apercu').addEventListener('click', function () {
    var actif = document.body.classList.toggle('voir-apercu');
    this.setAttribute('aria-pressed', actif);
    this.textContent = actif ? 'Modifier' : 'Aperçu';
    ajusterApercu();
  });

  // Quelques vérifications avant d'envoyer.
  function verifier() {
    var problemes = [];
    if (!String((contenu.accueil || {}).nom || '').trim()) problemes.push('Le nom est vide (section Accueil).');
    var email = String((contenu.contact || {}).email || '').trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problemes.push('L\'adresse e-mail de contact n\'est pas valide.');
    (contenu.projets || []).forEach(function (p, i) {
      if (!String(p.titre || '').trim()) problemes.push('Le projet n° ' + (i + 1) + ' n\'a pas de nom.');
    });
    return problemes;
  }

  $('bouton-enregistrer').addEventListener('click', function () {
    var bouton = this;
    var problemes = verifier();
    if (problemes.length) { alert('À corriger avant d\'enregistrer :\n\n- ' + problemes.join('\n- ')); return; }

    bouton.disabled = true;
    $('etat').textContent = 'Enregistrement…';
    $('etat').className = 'etat';

    var message = 'Mise à jour du portfolio depuis le tableau de bord';
    envoyer(message).catch(function (err) {
      // Si le robot PDF a enregistré entre-temps, on recommence une fois sur la nouvelle version.
      if (err.statut === 409 || err.statut === 422) return envoyer(message);
      throw err;
    }).then(function () {
      fichiers = {};
      nonEnregistre = false;
      $('etat').textContent = 'Enregistré : le site sera à jour dans 1 à 2 minutes, le PDF dans 3 à 4 minutes.';
      $('etat').className = 'etat ok';
    }).catch(function (err) {
      bouton.disabled = false;
      $('etat').textContent = 'Échec : ' + err.message;
      $('etat').className = 'etat erreur';
    });
  });

  // Prévient si on ferme la page avec des modifications non enregistrées.
  window.addEventListener('beforeunload', function (ev) {
    if (nonEnregistre) { ev.preventDefault(); ev.returnValue = ''; }
  });

  demarrer();
})();
