// Moteur des Sept Sceaux : code personnel, porte, navigation, sauvegarde.
// Chaque sceau s'enregistre avec Sceaux.enregistrer({ numero, monter(zone, ctx) }).
(function () {
  'use strict';

  const S = (window.Sceaux = { liste: [] });

  const SCEAUX = [
    { nom: 'Le Cadran des Rois', etoiles: 1 },
    { nom: 'Les Engrenages', etoiles: 2 },
    { nom: 'La Relève de la Garde', etoiles: 4 }, // plus dure que les autres (demande du MJ)
    { nom: "L'Inscription", etoiles: 3 },
    { nom: 'Le Chant des Diapasons', etoiles: 4 },
    { nom: 'La Herse', etoiles: 4 },
    { nom: 'Le Sceau du Maître', etoiles: 5 }
  ];
  const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  S.SCEAUX = SCEAUX;
  S.ROMAINS = ROMAINS;

  // ---------- Hasard déterministe (même code = mêmes énigmes) ----------
  function cyrb53(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 >>> 0) ^ (h2 & 0x1fffff);
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  S.hasard = function (graine) {
    const r = mulberry32(cyrb53(graine));
    const h = {
      reel: r,
      entier: (a, b) => a + Math.floor(r() * (b - a + 1)),
      choisir: (t) => t[Math.floor(r() * t.length)],
      melanger: (t) => {
        const a = t.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }
    };
    return h;
  };

  // ---------- Stockage ----------
  // Double sauvegarde pour ne jamais perdre la progression : stockage local du
  // navigateur ET cookie (un an). Si l'un est effacé ou bloqué, l'autre prend le relais.
  // Chaque accès est protégé : navigation privée ou cookies bloqués ne cassent rien.
  const PREFIXE = 'sept-sceaux:v1:';
  const CHEMIN = location.pathname.replace(/[^/]*$/, '');
  const nomCookie = (cle) => encodeURIComponent(PREFIXE + cle);
  function lireCookie(cle) {
    try {
      const nom = nomCookie(cle) + '=';
      const c = document.cookie.split('; ').find((x) => x.startsWith(nom));
      return c ? decodeURIComponent(c.slice(nom.length)) : null;
    } catch (e) { return null; }
  }
  function ecrireCookie(cle, texte, age) {
    try {
      document.cookie = `${nomCookie(cle)}=${encodeURIComponent(texte)}; max-age=${age}; path=${CHEMIN}; SameSite=Lax` +
        (location.protocol === 'https:' ? '; Secure' : '');
    } catch (e) { /* tant pis */ }
  }
  function lire(cle) {
    let v = null;
    try { v = localStorage.getItem(PREFIXE + cle); } catch (e) { /* on tente le cookie */ }
    if (v == null) v = lireCookie(cle);
    try { return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function ecrire(cle, val) {
    const texte = JSON.stringify(val);
    try { localStorage.setItem(PREFIXE + cle, texte); } catch (e) { /* tant pis */ }
    ecrireCookie(cle, texte, 60 * 60 * 24 * 365);
  }
  function effacer(cle) {
    try { localStorage.removeItem(PREFIXE + cle); } catch (e) { /* tant pis */ }
    ecrireCookie(cle, '', 0);
  }
  function effacerPrefixe(debut) {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIXE + debut)) localStorage.removeItem(k);
      }
    } catch (e) { /* tant pis */ }
    try {
      const nom = encodeURIComponent(PREFIXE + debut);
      document.cookie.split('; ').map((c) => c.split('=')[0]).filter((n) => n.startsWith(nom))
        .forEach((n) => { document.cookie = `${n}=; max-age=0; path=${CHEMIN}`; });
    } catch (e) { /* tant pis */ }
  }
  // Demande au navigateur de ne pas vider ce stockage quand il manque de place.
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* facultatif */ }

  S.sha256 = (txt) => sha256(txt);
  // Décode un texte gardé en base64 (pour ne pas laisser certains secrets lisibles dans le code source).
  S.voile = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
  async function sha256(txt) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------- Récompenses chiffrées ----------
  // Trois paliers : parchemin personnel (sceau II), lambeaux de la phrase commune (sceau IV),
  // secret final (sceau VII). Déchiffrés avec une clé tirée du code du joueur (voir
  // recompenses.js, généré depuis le coffre privé). null = encore scellé par le MJ.
  const PALIERS = [
    { sceau: 2, cle: 'perso', titre: 'Ton parchemin' },
    { sceau: 4, cle: 'milieu', titre: 'Lambeaux d’une phrase' },
    { sceau: 7, cle: 'final', titre: 'Le lutrin de pierre' }
  ];
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function recompense(cle) {
    const r = (window.SCEAUX_RECOMPENSES || {})[etat.empreinte];
    const bloc = r && r[cle];
    if (!bloc) return null;
    const brute = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('sept-sceaux:recompense:' + etat.code));
    const k = await crypto.subtle.importKey('raw', brute, 'AES-GCM', false, ['decrypt']);
    const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(bloc.iv) }, k, b64(bloc.ct));
    return JSON.parse(new TextDecoder().decode(clair));
  }
  // Remplit un conteneur avec la récompense d'un palier (asynchrone : déchiffrement).
  function afficherRecompense(palier, conteneur) {
    conteneur.replaceChildren(el('p', { class: 'doux petit', text: 'Le sceau de cire se brise…' }));
    recompense(palier.cle).then((v) => {
      if (v == null) {
        conteneur.replaceChildren(el('p', { class: 'scelle', text: 'Le cachet de cire est encore intact : le MJ y met la dernière main. Reviens plus tard, il s’ouvrira de lui-même.' }));
      } else if (palier.cle === 'milieu') {
        conteneur.replaceChildren(
          el('p', { class: 'consigne-collective' },
            el('strong', { text: 'Énigme collective. ' }),
            'Ces lambeaux ne sont qu’une partie d’une seule phrase, partagée entre tous les porteurs des sceaux : chacun n’en a reçu que deux. ',
            el('strong', { text: 'Note-les précieusement' }),
            ', puis mettez vos lambeaux en commun à la table pour reconstituer la phrase ensemble. Les chiffres I à IV donnent l’ordre.'),
          ...v.map((m) => el('p', { class: 'lambeau' }, el('span', { class: 'numero-lambeau', text: m.numero }), m.texte)));
      } else {
        conteneur.replaceChildren(el('p', { class: 'texte-parchemin', text: v }));
      }
    }).catch(() => {
      conteneur.replaceChildren(el('p', { class: 'message erreur', text: 'Le parchemin est illisible. Recharge la page, ou préviens le MJ.' }));
    });
  }
  function carteParchemin(palier) {
    if (palier.cle === 'final') return carteLutrin();
    const corps = el('div', { class: 'corps-parchemin' });
    afficherRecompense(palier, corps);
    return el('section', { class: 'parchemin' }, el('h3', { text: palier.titre }), corps);
  }

  // ---------- Le lutrin de pierre : le jet de D20 final ----------
  // Accessible seulement quand les sept sceaux sont brisés. Un seul jet par joueur (retenu) :
  // 1 = échec critique (rien) ; 2 à 12 = phrase tronquée ; 13 et plus = phrase complète.
  const DD = 13;
  const toutBrise = () => [1, 2, 3, 4, 5, 6, 7].every((n) => etat.resolus[n]);
  const cleDe = () => 'de:' + etat.code;
  function verdict(v) {
    if (v === 1) return { nom: 'Échec critique', classe: 'critique-echec' };
    if (v === 20) return { nom: 'Réussite critique', classe: 'critique-reussite' };
    return v >= DD ? { nom: 'Réussite', classe: 'reussite' } : { nom: 'Échec', classe: 'echec' };
  }
  function carteLutrin() {
    const jet = lire(cleDe());
    return el('section', { class: 'lutrin-carte' },
      el('h3', { text: 'Le lutrin de pierre' }),
      el('p', { text: jet ? `Tu as lancé le dé : ${jet.valeur}. ${verdict(jet.valeur).nom}.` : 'Derrière la porte, un dernier parchemin repose sur un lutrin. Le lire demande un peu de chance…' }),
      el('button', { type: 'button', text: jet ? 'Revoir le lutrin' : '🎲 Approcher du lutrin', onclick: ecranDe }));
  }

  // Dé à vingt faces vu de face, façon Baldur's Gate 3.
  function dessinDe() {
    const H = [[0, -95], [82, -47.5], [82, 47.5], [0, 95], [-82, 47.5], [-82, -47.5]];
    const T = [[0, -58], [50, 29], [-50, 29]];
    const p = (pts) => pts.map((x) => x.join(',')).join(' ');
    const trait = (a, b) => S.svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
    const nombre = S.svg('text', { x: 0, y: 12, 'text-anchor': 'middle', class: 'de-nombre', text: '20' });
    const svgDe = S.svg('svg', { viewBox: '-105 -105 210 210', class: 'de-svg', 'aria-hidden': 'true' },
      S.svg('defs', {}, S.svg('radialGradient', { id: 'faceDe', cx: '50%', cy: '35%', r: '70%' },
        S.svg('stop', { offset: '0%', 'stop-color': '#4b3a5c' }), S.svg('stop', { offset: '100%', 'stop-color': '#16101d' }))),
      S.svg('polygon', { points: p(H), class: 'de-contour' }),
      S.svg('g', { class: 'de-aretes' },
        S.svg('polygon', { points: p(T), class: 'de-face' }),
        trait(T[0], H[0]), trait(T[0], H[1]), trait(T[0], H[5]),
        trait(T[1], H[1]), trait(T[1], H[2]), trait(T[1], H[3]),
        trait(T[2], H[5]), trait(T[2], H[4]), trait(T[2], H[3])),
      nombre);
    return { svgDe, nombre };
  }

  function ecranDe() {
    if (!toutBrise() && !etat.mj) { ecranPorte(); return; }
    const deja = lire(cleDe());
    const { svgDe, nombre } = dessinDe();
    const bouton = el('button', { type: 'button', class: 'de-bouton', 'aria-label': 'Lancer le dé' }, svgDe);
    const bandeau = el('div', { class: 'de-bandeau', 'aria-live': 'polite' });
    const texte = el('div', { class: 'de-texte' });
    const aide = el('p', { class: 'doux centre', text: 'Touche le dé pour le lancer. Un seul jet : le destin ne se relance pas.' });

    function reveler(v, anime) {
      const r = verdict(v);
      nombre.textContent = String(v);
      bouton.className = 'de-bouton pose ' + r.classe;
      bandeau.replaceChildren(el('span', { class: 'de-verdict ' + r.classe, text: r.nom }));
      aide.remove();
      const suite = () => {
        if (v === 1) {
          texte.replaceChildren(el('p', { class: 'de-echec-critique', text: 'Les runes du lutrin s’éteignent une à une. Le parchemin tombe en poussière avant que tu aies pu en lire un seul mot.' }),
            el('p', { class: 'doux', text: 'Échec critique… Le destin est cruel. Tes compagnons ont peut-être eu plus de chance que toi.' }));
          return;
        }
        texte.replaceChildren(el('p', { class: 'doux petit', text: 'Le parchemin se déroule…' }));
        recompense('final').then((f) => {
          if (!f) { texte.replaceChildren(el('p', { class: 'doux', text: 'Le parchemin est encore scellé : le MJ y met la dernière main.' })); return; }
          const reussi = v >= DD;
          remplir(texte, el('p', { class: 'de-phrase' + (reussi ? '' : ' tronquee'), text: reussi ? f.complete : f.partielle }),
            reussi ? null : el('p', { class: 'doux', text: 'Le parchemin s’effrite avant la fin de la phrase… Un autre porteur des sceaux a peut-être lu la suite.' }));
        }).catch(() => texte.replaceChildren(el('p', { class: 'message erreur', text: 'Le parchemin est illisible. Préviens le MJ.' })));
      };
      if (anime) setTimeout(suite, 700); else suite();
    }

    let lance = false;
    bouton.addEventListener('click', () => {
      if (lance || lire(cleDe())) return;
      lance = true;
      const tirage = new Uint32Array(1);
      crypto.getRandomValues(tirage);
      const v = (tirage[0] % 20) + 1;
      ecrire(cleDe(), { valeur: v, date: Date.now() }); // retenu tout de suite : recharger ne relance pas
      bouton.classList.add('roule');
      const clignote = setInterval(() => { nombre.textContent = String(1 + Math.floor(Math.random() * 20)); }, 70);
      setTimeout(() => { clearInterval(clignote); bouton.classList.remove('roule'); reveler(v, true); }, 1900);
    });

    afficher(
      el('div', { class: 'entete' },
        el('button', { class: 'discret', type: 'button', text: '← La porte', onclick: ecranPorte }),
        etat.mj ? el('button', { class: 'discret', type: 'button', text: 'MJ : effacer le jet', onclick: () => { effacer(cleDe()); ecranDe(); } }) : null),
      el('section', { class: 'ecran-de' },
        el('p', { class: 'de-type', text: 'Jet d’Intelligence · Histoire' }),
        el('p', { class: 'de-dd-titre', text: 'Difficulté' }),
        el('div', { class: 'de-dd' }, el('strong', { text: String(DD) })),
        bouton, bandeau, aide, texte)
    );
    if (deja) reveler(deja.valeur, false);
  }

  // ---------- Tableau du MJ : ce que chaque joueur recevra ----------
  function ecranTableau() {
    const corps = el('div', { class: 'tableau-mj' }, el('p', { class: 'doux', text: 'Déchiffrement…' }));
    afficher(
      el('div', { class: 'entete' }, el('button', { class: 'discret', type: 'button', text: '← La porte', onclick: ecranPorte })),
      el('h1', { text: 'Tableau du MJ' }),
      el('p', { class: 'consigne', text: 'Visible uniquement avec le code MJ. Ce que chaque joueur trouve derrière les sceaux II, IV et VII.' }),
      corps);
    recompense('tableau').then((t) => {
      if (!t) { corps.replaceChildren(el('p', { text: 'Aucun tableau trouvé : relancer le script de chiffrement.' })); return; }
      remplir(corps,
        ...t.joueurs.map((j) => el('section', { class: 'fiche-mj' },
          el('h3', {}, j.personnage, el('span', { class: 'code-mj', text: j.code })),
          el('p', {}, el('strong', { text: 'Sceau II : ' }), j.perso || '(encore scellé)'),
          el('p', {}, el('strong', { text: 'Sceau IV : ' }), j.morceaux.map((m) => `${m.numero}. ${m.texte}`).join('  ·  ')))),
        t.final ? el('section', { class: 'fiche-mj' },
          el('h3', { text: 'Sceau VII : le lutrin (commun)' }),
          el('p', {}, el('strong', { text: `D20, DD ${DD}. ` }), '1 : échec critique, rien ne s’affiche. 2 à 12 : phrase tronquée. 13 et plus : phrase complète.'),
          el('p', {}, el('strong', { text: 'Tronquée : ' }), t.final.partielle),
          el('p', {}, el('strong', { text: 'Complète : ' }), t.final.complete)) : null);
    }).catch(() => corps.replaceChildren(el('p', { class: 'message erreur', text: 'Déchiffrement impossible.' })));
  }
  const normaliser = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // ---------- Petit utilitaire DOM ----------
  function el(tag, attrs, ...enfants) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const e of enfants.flat()) if (e != null) n.append(e);
    return n;
  }
  S.el = el;
  // Remplace le contenu d'un nœud en ignorant les emplacements vides (sinon « null » s'affiche).
  const remplir = (noeud, ...enfants) => noeud.replaceChildren(...enfants.flat().filter((x) => x != null));
  S.svg = function (tag, attrs, ...enfants) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null) continue;
      if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const e of enfants.flat()) if (e != null) n.append(e);
    return n;
  };

  S.enregistrer = (def) => { S.liste[def.numero - 1] = def; };

  // ---------- État du joueur ----------
  let etat = null; // { code, mj, resolus: { n: { fragment } } }
  const app = () => document.getElementById('app');
  function sauver() { ecrire('partie:' + etat.code, { resolus: etat.resolus }); }

  function afficher(...noeuds) {
    const a = app();
    a.replaceChildren(...noeuds.filter((x) => x != null)); // un emplacement vide ne doit pas s'afficher « null »
    window.scrollTo(0, 0);
  }

  // ---------- Écran 1 : le code personnel ----------
  // La prière dite au début de chaque partie (monologue de départ du MJ).
  const PRIERE = [
    'Le vent souffle à travers les vallées et les cités, portant avec lui des fragments d’un chant oublié. Il ne s’impose pas, il se cache, se laisse deviner… Mais il attend. Un signe, un pas en avant, une volonté qui brise le silence. Écoutez bien, car c’est à vous de réveiller l’écho endormi.',
    'Ce n’est pas une mélodie figée, ni un simple vestige du passé. C’est un murmure vivant, un fil ténu entre hier et demain. Chaque pierre, chaque feuille frissonne sous ses fréquences, effleurée par la mémoire d’un monde qui refuse de s’éteindre.',
    'Une question murmurée à l’ombre des étoiles. Et peut-être que la réponse apparaîtra.'
  ];
  // Indice de l’Énigme des Profondeurs : cinq lettres de la prière, réparties sur tout le texte,
  // sont très légèrement dorées et épellent C, O, E, U, R.
  function prierePointee() {
    const cibles = [];
    const total = PRIERE.join('').length;
    let depuis = 0;
    [...'coeur'].forEach((l, k) => {
      let i = Math.max(depuis, Math.floor(total * (k + 0.4) / 5));
      const texte = PRIERE.join('');
      while (i < total && texte[i] !== l) i++;
      cibles.push(i); depuis = i + 1;
    });
    let base = 0;
    return PRIERE.map((p) => {
      const morceaux = [];
      let dernier = 0;
      for (const c of cibles) if (c >= base && c < base + p.length) {
        morceaux.push(p.slice(dernier, c - base), el('span', { class: 'lettre-pointee', text: p[c - base] }));
        dernier = c - base + 1;
      }
      morceaux.push(p.slice(dernier));
      base += p.length;
      return el('p', {}, morceaux);
    });
  }
  // Les trois secrets du coffre, annoncés avant d'entrer (sans rien dévoiler de leur contenu).
  const SECRETS = [
    { etoiles: 1, titre: 'Le premier secret', quand: 'Après le sceau II', texte: 'Un secret qui ne parle que de toi.' },
    { etoiles: 2, titre: 'Le deuxième secret', quand: 'Après le sceau IV', texte: 'Un secret partagé : chacun n’en détient qu’une part. Il faudra vous réunir.' },
    { etoiles: 3, titre: 'Le troisième secret', quand: 'Après les sept sceaux', texte: 'Le plus lourd de tous. Il faudra aussi un peu de chance.' }
  ];
  function ecranCode(erreur) {
    const champ = el('input', {
      type: 'text', id: 'code', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      placeholder: 'TON-CODE', 'aria-label': 'Code personnel', value: lire('dernier') || ''
    });
    const msg = el('p', { class: 'message erreur', text: erreur || '' });
    const form = el('form', {
      onsubmit: async (ev) => {
        ev.preventDefault();
        const code = normaliser(champ.value);
        if (!code) return;
        let empreinte;
        try { empreinte = await sha256(code); } catch (e) {
          msg.textContent = "Ton navigateur refuse le chiffrement. Ouvre le jeu depuis son adresse https.";
          return;
        }
        const trouve = window.SCEAUX_CONFIG.codes.find((c) => c.h === empreinte);
        if (!trouve) {
          msg.textContent = "La pierre reste froide. Ce code n'ouvre rien.";
          form.classList.remove('secousse'); void form.offsetWidth; form.classList.add('secousse');
          return;
        }
        ecrire('dernier', champ.value.toUpperCase().trim());
        const partie = lire('partie:' + code) || { resolus: {} };
        etat = { code, empreinte, mj: !!trouve.mj, resolus: partie.resolus || {} };
        ecranPorte();
      }
    }, champ, el('button', { type: 'submit', text: 'Poser la main sur la porte' }), msg);

    afficher(el('section', { class: 'accueil' },
      el('a', { class: 'retour-accueil', href: '../index.html', text: '← Retour à l’accueil' }),
      el('h1', { text: 'Les Sept Sceaux' }),
      el('blockquote', { class: 'priere' }, prierePointee()),
      el('p', { class: 'intro', text: 'Une porte de chambre forte naine, fermée par sept sceaux. Chacun garde une énigme, et chacune est plus cruelle que la précédente. Ce coffre-fort magique renferme trois secrets.' }),
      el('ol', { class: 'secrets' }, SECRETS.map((s) => el('li', { class: 'secret' },
        el('span', { class: 'etoiles-secret', 'aria-label': `${s.etoiles} étoile${s.etoiles > 1 ? 's' : ''}`, text: '★'.repeat(s.etoiles) }),
        el('span', { class: 'titre-secret', text: s.titre }),
        el('span', { class: 'quand', text: s.quand }),
        el('span', { class: 'doux petit', text: s.texte })))),
      el('p', { class: 'doux', text: 'Entre le code que le MJ t’a confié.' }),
      form
    ));
    champ.focus({ preventScroll: true }); // la page reste en haut : la prière se lit d'abord
    window.scrollTo(0, 0);
  }

  // ---------- Écran 2 : la porte ----------
  function disponible(n) { return n === 1 || !!etat.resolus[n - 1]; }

  // Onglets de la porte : les sept sceaux (par défaut) et les jeux bonus, ouverts à tout moment.
  function ecranPorte(onglet) {
    if (onglet === 'bonus') { afficher(entetePorte('bonus'), ...contenuBonus()); return; }
    if (onglet === 'profondeurs') { afficher(entetePorte('profondeurs'), ...contenuProfondeurs()); return; }
    const porte = el('div', { class: 'porte' });
    SCEAUX.forEach((s, i) => {
      const n = i + 1;
      const brise = etat.resolus[n];
      const pret = !!S.liste[i];
      const ouvert = !brise && pret && (disponible(n) || etat.mj);
      const classe = brise ? 'brise' : ouvert ? 'ouvert' : 'ferme';
      const etatTxt = brise ? 'Brisé' : !pret ? 'En préparation' : ouvert ? 'À briser' : 'Scellé';
      porte.append(el('button', {
        class: 'sceau ' + classe, type: 'button', disabled: classe === 'ferme',
        'aria-label': `Sceau ${ROMAINS[i]}, ${s.nom}, ${etatTxt}`,
        onclick: () => ecranSceau(n)
      },
        el('span', { class: 'medaillon', text: brise ? eclat(n) : ROMAINS[i] }),
        el('span', { class: 'nom', text: s.nom }),
        el('span', { class: 'etoiles', text: '★'.repeat(s.etoiles) }),
        el('span', { class: 'etat', text: etatTxt })
      ));
    });

    const liste = el('div', { class: 'liste' });
    const lecture = el('p', { class: 'gravure', 'aria-live': 'polite' });
    for (let n = 1; n <= 6; n++) {
      const r = etat.resolus[n];
      liste.append(r
        ? el('button', {
          type: 'button', class: 'fragment', text: eclat(n), 'aria-label': `Éclat ${eclat(n)} : lire la gravure`,
          onclick: () => { lecture.textContent = `${eclat(n)} (${S.ECLAT_DE[n - 1]}) : « ${S.ordreDuMaitre(etat.code).gravures[n - 1]} ». Au dos, une lettre minuscule : ${S.voile('ViBJIEIgUiBBIE5U').split(' ')[n - 1]}.`; }
        })
        : el('span', { class: 'fragment vide', text: '·' }));
    }

    afficher(
      entetePorte('sceaux'),
      toutBrise() ? carteLutrin() : null,
      barreSecrets(),
      el('p', { class: 'consigne', text: 'Brise les sceaux un par un. Chacun laisse tomber un éclat de pierre gravé : garde-les, le dernier sceau les réclame.' }),
      porte,
      el('div', { class: 'fragments' }, el('h3', { text: 'Éclats' }),
        Object.keys(etat.resolus).length ? el('p', { class: 'doux petit', text: 'Touche un éclat pour lire la gravure au dos.' }) : null,
        liste, lecture),
      el('div', { class: 'parchemins' },
        el('h3', { text: 'Parchemins' }),
        (() => {
          const restants = PALIERS.filter((p) => !etat.resolus[p.sceau]).map((p) => ROMAINS[p.sceau - 1]);
          if (!restants.length) return null;
          const texte = restants.length === 1
            ? `Un parchemin dort encore derrière le sceau ${restants[0]}.`
            : `Des parchemins dorment derrière les sceaux ${restants.join(', ').replace(/, ([^,]*)$/, ' et $1')}.`;
          return el('p', { class: 'doux petit centre', text: texte });
        })(),
        PALIERS.filter((p) => etat.resolus[p.sceau] && p.cle !== 'final').map(carteParchemin)),
      el('div', { class: 'actions recommencer' }, el('button', {
        class: 'discret', type: 'button', text: etat.mj ? 'MJ : remettre la partie à zéro (jet du dé compris)' : '↺ Recommencer les épreuves',
        onclick: () => {
          const question = etat.mj
            ? 'Remettre toute la partie du code MJ à zéro, jet du dé compris ?'
            : 'Recommencer les sept épreuves depuis le début ?\n\nTous les sceaux se refermeront. Ton jet de dé au lutrin, lui, reste acquis : le destin ne se relance pas.';
          if (!window.confirm(question)) return;
          etat.resolus = {};
          effacer('partie:' + etat.code);
          SCEAUX.forEach((s, i) => effacer(`encours:${etat.code}:${i + 1}`));
          if (etat.mj) effacer(cleDe());
          ecranPorte();
        }
      }))
    );
  }

  function entetePorte(onglet) {
    const bouton = (id, texte) => el('button', {
      type: 'button', role: 'tab', class: 'onglet' + (onglet === id ? ' actif' : ''), 'aria-selected': onglet === id ? 'true' : 'false',
      text: texte, onclick: () => { if (onglet !== id) ecranPorte(id); }
    });
    return el('div', {},
      el('div', { class: 'entete' },
        el('span', { class: 'code', text: etat.mj ? 'Code MJ' : 'Porte scellée' }),
        el('button', { class: 'discret', type: 'button', text: 'Changer de code', onclick: () => ecranCode() })),
      el('h1', { text: 'La Porte' }),
      etat.mj ? el('div', { class: 'actions barre-mj' },
        el('button', { type: 'button', class: 'discret', text: '📜 Tableau du MJ : ce que reçoit chaque joueur', onclick: ecranTableau }),
        el('button', { type: 'button', class: 'discret', text: '🎲 Tester le lutrin', onclick: ecranDe })) : null,
      el('div', { class: 'onglets', role: 'tablist' }, bouton('sceaux', 'Les Sept Sceaux'), bouton('profondeurs', '⛏ Les Profondeurs'), bouton('bonus', '✦ Bonus')));
  }

  // ---------- Onglet Les Profondeurs : épreuves difficiles, dans l'ordre qu'on veut ----------
  // Chaque épreuve s'enregistre avec Sceaux.enregistrerEpreuve({ id, nom, etoiles, resume, monter(zone, ctx) }).
  // Son énigme dépend du code du joueur (graine code:prof:id). Réussie, elle laisse un fragment
  // de l'énigme finale (à venir).
  S.epreuves = [];
  // Tant que l’énigme finale n’est pas prête, les joueurs voient les épreuves sans pouvoir y entrer
  // (le code MJ, lui, garde l’accès pour tester). Passer à true pour ouvrir les Profondeurs.
  const PROFONDEURS_OUVERTES = true;
  // Épreuves annoncées mais pas encore écrites : cases vides, fermées.
  // Date limite des Profondeurs : samedi 10/10/2026 à 23h59 (heure de Paris). Passé ce moment,
  // les épreuves se referment pour les joueurs.
  const FIN_PROFONDEURS = new Date('2026-10-10T23:59:00+02:00');
  const tempsEcoule = () => Date.now() >= FIN_PROFONDEURS.getTime();
  function compteARebours() {
    const temps = el('p', { class: 'temps-restant' });
    const bloc = el('div', { class: 'compte-a-rebours' },
      el('p', { class: 'titre-avert', text: '⏳ Le temps presse' }),
      el('p', { text: 'Les épreuves des Profondeurs doivent être finies avant le samedi 10 octobre à 23h59. Passé ce moment, les Profondeurs se refermeront.' }),
      temps);
    const maj = () => {
      const reste = FIN_PROFONDEURS.getTime() - Date.now();
      if (reste <= 0) { temps.textContent = 'Le temps est écoulé : les Profondeurs se sont refermées.'; return false; }
      const j = Math.floor(reste / 864e5), h = Math.floor(reste / 36e5) % 24, m = Math.floor(reste / 6e4) % 60, sec = Math.floor(reste / 1e3) % 60;
      const deux = (x) => String(x).padStart(2, '0');
      temps.textContent = `${j} j  ${deux(h)} h  ${deux(m)} min  ${deux(sec)} s`;
      return true;
    };
    maj();
    const minuteur = setInterval(() => { if (!bloc.isConnected || !maj()) clearInterval(minuteur); }, 1000);
    return bloc;
  }
  // Quand le MJ ouvre l’Énigme à tous (config : enigme.ouverteATous), elle échappe au verrou
  // PROFONDEURS_OUVERTES, mais pas à la date limite : tout le défi s’arrête au début de la campagne.
  const enigmePourTous = (e) => e.id === 'enigme' && !!(window.SCEAUX_CONFIG.enigme || {}).ouverteATous && !tempsEcoule();
  const PROFONDEURS_A_VENIR = [];
  S.enregistrerEpreuve = (def) => { S.epreuves.push(def); };
  const cleProfondeurs = () => 'profondeurs:' + etat.code;
  const reussites = () => lire(cleProfondeurs()) || {};
  // La « carotte » : ce que le MJ attend des joueurs, et ce qu’ils peuvent gagner.
  function panneauRecompenses() {
    const don = (icone, titre, ...texte) => el('li', { class: 'don' }, el('span', { class: 'icone-don', text: icone }), el('span', {}, el('strong', { text: titre }), ' ', ...texte));
    return el('details', { class: 'panneau recompenses-profondeurs', open: true },
      el('summary', { text: '🏆 Ce qui vous attend au fond des Profondeurs' }),
      el('h4', { text: 'Ce que le MJ attend de vous' }),
      el('ol', { class: 'etapes' },
        el('li', {}, el('strong', { text: 'Chacun pour soi, d’abord.' }), ' Réussis les épreuves des Profondeurs : chacune te donne un indice pour le Registre chiffré. Tes épreuves ne sont pas celles des autres.'),
        el('li', {}, el('strong', { text: 'Déchiffre le Registre.' }), ' Il cache ton code d’accès personnel à l’Énigme des Profondeurs.'),
        el('li', {}, el('strong', { text: 'Le premier qui y parvient envoie aussitôt son code d’accès au MJ.' }), ' C’est lui qui ouvre la porte : le MJ ouvre alors l’Énigme à tout le monde.'),
        el('li', {}, el('strong', { text: 'Ensuite, tous ensemble.' }), ' L’Énigme est la même pour tous. Mettez vos indices en commun, cherchez partout sur le site, parlez-vous : seul, personne n’y arrivera.'),
        el('li', {}, el('strong', { text: 'Chacun entre la réponse.' }), ' Qui donne la bonne réponse reçoit son code final personnel : envoie-le au MJ, c’est la preuve que tu as participé.'),
        el('li', {}, el('strong', { text: 'Avant le samedi 10 octobre à 23h59.' }), ' Au début de la campagne, les Profondeurs se referment pour de bon.')),
      el('h4', { text: 'Pour celui qui a ouvert la porte : un don des Profondeurs, au choix' }),
      el('ul', { class: 'dons' },
        don('✨', 'Intervention divine.', 'Une fois, changer le cours du destin sur un instant : un coup de pouce divin au moment où tout bascule.'),
        don('🔥', 'Transcendance doublée.', 'Ton maximum de points de Transcendance (tes points ', el('strong', { text: 'MAX' }), ') est doublé : tu pourras lancer bien plus souvent tes sorts de Transcendance.'),
        don('💎', 'Un objet unique.', 'Une pierre venue des Profondeurs, liée à une compétence hors combat de ton choix : cette compétence est ', el('u', { text: 'toujours' }), ' lancée avec avantage.')),
      el('p', { class: 'doux petit', text: 'Un seul don, à choisir. Et seulement si l’Énigme est résolue avant la fin : celui qui ouvre la porte a donc tout intérêt à aider les autres.' }),
      el('h4', { text: 'Pour tous ceux qui auront collaboré à résoudre l’Énigme' }),
      el('ul', { class: 'dons' }, don('⭐', '+10 points de Transcendance MAX', 'pour chaque voyageur qui a aidé les autres et participé à la résolution de l’Énigme, sans avoir ouvert la porte : ton maximum de points de Transcendance augmente de 10.')));
  }
  function confirmer(titre, texte, surOui) {
    const voile = el('div', { class: 'brisure confirmation', role: 'dialog', 'aria-modal': 'true', 'aria-label': titre });
    const fermer = () => voile.remove();
    voile.append(el('div', { class: 'contenu' },
      el('h2', { text: titre }),
      el('p', { class: 'doux', text: texte }),
      el('div', { class: 'actions' },
        el('button', { type: 'button', text: 'Oui', onclick: () => { fermer(); surOui(); } }),
        el('button', { type: 'button', class: 'discret', text: 'Non', onclick: fermer }))));
    voile.addEventListener('click', (ev) => { if (ev.target === voile) fermer(); });
    document.body.append(voile);
    voile.querySelector('.discret').focus();
  }
  function recommencerProfondeurs() {
    confirmer('Recommencer les Profondeurs ?',
      'Toutes tes épreuves des Profondeurs seront remises à zéro : épreuves réussies, indices obtenus, parties en cours, Registre chiffré et Énigme. Tes sceaux et tes Bonus ne bougent pas. Les énigmes, elles, restent les mêmes.',
      () => {
        effacer(cleProfondeurs());
        effacerPrefixe(`prof-encours:${etat.code}:`);
        effacerPrefixe(`prof-garde:${etat.code}:`);
        ecranPorte('profondeurs');
      });
  }
  function contenuProfondeurs() {
    const faites = reussites();
    const simples = S.epreuves.filter((e) => !e.rang);
    const nbIndices = simples.filter((e) => faites[e.id]).length;
    const carte = (e) => {
      const ouverte = (PROFONDEURS_OUVERTES && !tempsEcoule()) || etat.mj || enigmePourTous(e);
      const classe = faites[e.id] ? 'brise' : ouverte ? 'ouvert' : 'ferme';
      const reussi = e.rang ? 'Réussie' : 'Indice obtenu';
      return el('button', {
        // Une épreuve réussie reste consultable même fermée (ses souvenirs servent d’indices à l’Énigme).
        type: 'button', class: 'sceau ' + classe + (e.rang ? ' ' + e.rang : ''), disabled: !ouverte && !faites[e.id], onclick: () => ecranEpreuve(e),
        'aria-label': `${e.nom}, ${faites[e.id] ? reussi : ouverte ? 'à faire' : 'pas encore ouverte'}`
      },
        el('span', { class: 'medaillon', text: faites[e.id] ? '✓' : e.icone || '⛏' }),
        el('span', { class: 'nom', text: e.nom }),
        el('span', { class: 'etoiles', text: '★'.repeat(e.etoiles) }),
        el('span', { class: 'etat', text: faites[e.id] ? reussi : ouverte ? e.resume : tempsEcoule() ? 'Refermée' : 'Pas encore ouverte' }));
    };
    return [
      el('div', { class: 'avertissement-profondeurs' },
        el('p', { class: 'titre-avert', text: '⚠ Épreuves très difficiles' }),
        el('p', { text: 'Sous la porte s’ouvrent les Profondeurs. Ces épreuves sont bien plus dures que les sceaux : certaines demanderont des heures, du papier, et beaucoup de patience. Jusqu’au Registre chiffré, chacun joue seul : tes épreuves ne sont pas celles des autres.' }),
        el('p', {}, 'Le premier voyageur qui déchiffre le Registre ouvre l’Énigme des Profondeurs pour tout le monde. Si l’Énigme est ensuite résolue, c’est lui qui recevra ',
          el('strong', { text: 'une récompense spéciale en jeu, vraiment, vraiment précieuse.' })),
        el('p', { class: 'murmure-cache', text: 'Les nains ne l’appellent pas l’Entité.' })),
      panneauRecompenses(),
      compteARebours(),
      PROFONDEURS_OUVERTES && !tempsEcoule() ? null : el('p', { class: 'centre doux', text: etat.mj
        ? 'Les Profondeurs sont fermées aux joueurs (énigme finale pas prête ou temps écoulé). Le MJ, lui, peut entrer.'
        : tempsEcoule() ? 'Les Profondeurs se sont refermées.' : 'Les Profondeurs ne sont pas encore ouvertes. Reviens plus tard…' }),
      el('section', { class: 'etage' },
        el('h3', { class: 'titre-etage', text: 'I. Les épreuves' }),
        el('p', { class: 'centre doux', text: `Chacune réussie te donne un indice pour le Registre chiffré. Plus l’épreuve est dure, plus l’indice est précieux. Indices obtenus : ${nbIndices} / ${simples.length}` }),
        el('div', { class: 'porte grille-3' }, simples.map(carte).concat(PROFONDEURS_A_VENIR.map((nom) => el('button', { type: 'button', class: 'sceau ferme', disabled: true, 'aria-label': `${nom}, en préparation` },
          el('span', { class: 'medaillon', text: '?' }),
          el('span', { class: 'nom', text: nom }),
          el('span', { class: 'etat', text: 'En préparation' })))))),
      el('div', { class: 'descente', 'aria-hidden': 'true', text: '▼' }),
      el('section', { class: 'etage etage-sous-boss' },
        el('h3', { class: 'titre-etage', text: 'II. Le gardien de la porte' }),
        el('p', { class: 'centre doux', text: 'Le sous-boss. Ouvert à tout moment, chacun le sien. Tes indices t’aident à le déchiffrer, et le premier qui y parvient ouvre l’Énigme pour tous.' }),
        el('div', { class: 'porte porte-seule' }, S.epreuves.filter((e) => e.rang === 'sous-boss').map(carte))),
      el('div', { class: 'descente', 'aria-hidden': 'true', text: '▼' }),
      el('section', { class: 'etage etage-boss' },
        el('h3', { class: 'titre-etage', text: 'III. Le cœur des Profondeurs' }),
        el('p', { class: 'centre doux', text: 'Le boss final. Une seule question, la même pour tous : on la résout ensemble.' }),
        el('div', { class: 'porte porte-seule' }, S.epreuves.filter((e) => e.rang === 'boss').map(carte))),
      el('p', { class: 'centre' }, el('button', { type: 'button', class: 'discret', text: '↺ Recommencer les épreuves', onclick: recommencerProfondeurs }))
    ];
  }
  function ecranEpreuve(e) {
    const fermee = (!PROFONDEURS_OUVERTES || tempsEcoule()) && !etat.mj && !enigmePourTous(e);
    if (fermee && !reussites()[e.id]) { ecranPorte('profondeurs'); return; }
    const zone = el('div', { class: 'zone-sceau' });
    const faites = reussites();
    const ctx = {
      hasard: S.hasard(etat.code + ':prof:' + e.id),
      code: etat.code,
      mj: etat.mj,
      // Mémoire qui survit à la réussite (ex. : la réponse de l’Énigme, pour réafficher le code final).
      garde: { lire: () => lire(`prof-garde:${etat.code}:${e.id}`), ecrire: (v) => ecrire(`prof-garde:${etat.code}:${e.id}`, v) },
      faites, // épreuves des Profondeurs déjà réussies (le Registre en tire ses indices)
      memoire: { lire: () => lire(`prof-encours:${etat.code}:${e.id}`), ecrire: (v) => ecrire(`prof-encours:${etat.code}:${e.id}`, v) },
      secouer: (noeud) => { noeud.classList.remove('secousse'); void noeud.getBoundingClientRect(); noeud.classList.add('secousse'); },
      reussir: () => {
        const f = reussites(); f[e.id] = true; ecrire(cleProfondeurs(), f);
        effacer(`prof-encours:${etat.code}:${e.id}`);
        const voile = el('div', { class: 'brisure', role: 'dialog', 'aria-label': 'Épreuve réussie' },
          el('div', { class: 'contenu' },
            el('h2', { text: 'Épreuve réussie' }),
            el('p', { class: 'doux', text: `${e.nom} : les Profondeurs te laissent passer.` }),
            el('button', { type: 'button', text: 'Retour aux Profondeurs', onclick: () => { voile.remove(); ecranPorte('profondeurs'); } })));
        document.body.append(voile);
      }
    };
    afficher(
      el('div', { class: 'entete' },
        el('button', { class: 'discret', type: 'button', text: '← Les Profondeurs', onclick: () => ecranPorte('profondeurs') }),
        etat.mj && !faites[e.id] ? el('button', { class: 'discret', type: 'button', text: 'MJ : passer', onclick: ctx.reussir }) : null,
        faites[e.id] && !fermee ? el('button', { class: 'discret', type: 'button', text: '↺ Rejouer', onclick: () => { const f = reussites(); delete f[e.id]; ecrire(cleProfondeurs(), f); ecranEpreuve(e); } }) : null),
      el('div', { class: 'titre-sceau' },
        el('div', { class: 'numero', text: 'LES PROFONDEURS · ' + '★'.repeat(e.etoiles) }),
        el('h2', { text: e.nom })),
      zone);
    if (faites[e.id]) {
      if (e.souvenir) zone.append(e.souvenir(ctx));
      zone.append(el('p', { class: 'consigne', text: fermee ? 'Tu as déjà réussi cette épreuve.' : 'Tu as déjà réussi cette épreuve. Tu peux la rejouer si tu veux (ta réussite est conservée tant que tu ne cliques pas sur « Rejouer »).' }));
      return;
    }
    const api = e.monter(zone, ctx) || {};
    if (api.solution) {
      app().append(accesSolution(0, api.solution, {
        titre: e.nom, attendu: (window.SCEAUX_CONFIG.solutionsProfondeurs || {})[e.id], id: 'prof-' + e.id
      }));
    }
  }

  // ---------- Onglet Bonus : jeux ouverts à tout moment ----------
  S.bonus = [];
  S.enregistrerBonus = (def) => { S.bonus.push(def); };
  function contenuBonus() {
    if (!S.bonus.length) return [el('p', { class: 'consigne', text: 'Aucun jeu bonus pour l’instant.' })];
    return [el('p', { class: 'consigne', text: 'Des jeux en plus, ouverts à tout moment, que tu aies brisé les sceaux ou non.' }),
      el('div', { class: 'cartes-bonus' }, S.bonus.map((b) => {
        const meilleur = lire(`bonus:${etat.code}:${b.id}:meilleur`);
        return el('section', { class: 'carte-bonus' },
          el('h3', { text: b.titre }),
          el('p', { class: 'doux', text: b.description }),
          meilleur != null && b.resume ? el('p', { class: 'petit', text: b.resume(meilleur) }) : null,
          el('button', { type: 'button', text: 'Jouer', onclick: () => ecranBonus(b) }));
      }))];
  }
  function ecranBonus(b) {
    const zone = el('div', { class: 'zone-bonus' });
    const cle = `bonus:${etat.code}:${b.id}`;
    afficher(
      el('div', { class: 'entete' }, el('button', { class: 'discret', type: 'button', text: '← Les bonus', onclick: () => ecranPorte('bonus') })),
      el('div', { class: 'titre-sceau' }, el('div', { class: 'numero', text: 'BONUS' }), el('h2', { text: b.titre })),
      zone);
    const api = b.monter(zone, {
      code: etat.code,
      mj: etat.mj,
      hasard: S.hasard(etat.code + ':bonus:' + b.id),
      memoire: { lire: () => lire(cle), ecrire: (v) => ecrire(cle, v), effacer: () => effacer(cle) },
      meilleur: { lire: () => lire(cle + ':meilleur'), ecrire: (v) => ecrire(cle + ':meilleur', v) },
      retour: () => ecranPorte('bonus'),
      secouer: (noeud) => { noeud.classList.remove('secousse'); void noeud.getBoundingClientRect(); noeud.classList.add('secousse'); },
      // Jeux bonus « à réussir » (ex. les Chambres Fortes) : on retient la réussite, on rejoue à volonté.
      reussir: () => {
        ecrire(cle + ':meilleur', true);
        effacer(cle);
        const voile = el('div', { class: 'brisure', role: 'dialog', 'aria-label': 'Réussi' },
          el('div', { class: 'contenu' },
            el('h2', { text: 'Réussi !' }),
            el('p', { class: 'doux', text: `${b.titre} : bravo.` }),
            el('button', { type: 'button', text: 'Retour aux bonus', onclick: () => { voile.remove(); ecranPorte('bonus'); } })));
        document.body.append(voile);
      }
    }) || {};
    if (api.solution) {
      app().append(accesSolution(0, api.solution, {
        titre: b.titre, attendu: (window.SCEAUX_CONFIG.solutionsBonus || {})[b.id], id: 'bonus-' + b.id
      }));
    }
  }

  // ---------- Les secrets déjà obtenus, accessibles d'un bouton ----------
  const SECRETS_PORTE = [
    { etoiles: 1, sceau: 2, palier: 'perso' },
    { etoiles: 2, sceau: 4, palier: 'milieu' },
    { etoiles: 3, sceau: 7, palier: 'final' }
  ];
  function barreSecrets() {
    return el('div', { class: 'barre-secrets' },
      el('span', { class: 'titre-barre', text: 'Tes secrets' }),
      SECRETS_PORTE.map((s) => {
        const ouvert = !!etat.resolus[s.sceau];
        return el('button', {
          type: 'button', class: 'bouton-secret' + (ouvert ? '' : ' verrouille'), disabled: !ouvert,
          'aria-label': ouvert ? `Relire le secret ${'★'.repeat(s.etoiles)}` : `Secret ${'★'.repeat(s.etoiles)} : se débloque après le sceau ${ROMAINS[s.sceau - 1]}`,
          onclick: () => ouvrirSecret(s)
        }, el('span', { class: 'etoiles-secret', text: '★'.repeat(s.etoiles) }),
          el('span', { class: 'petit', text: ouvert ? 'Relire' : `🔒 Sceau ${ROMAINS[s.sceau - 1]}` }));
      }));
  }
  function ouvrirSecret(s) {
    if (s.palier === 'final') { ecranDe(); return; } // le troisième secret se relit au lutrin
    const palier = PALIERS.find((p) => p.cle === s.palier);
    const voile = el('div', { class: 'brisure', role: 'dialog', 'aria-label': 'Secret' },
      el('div', { class: 'contenu' },
        el('p', { class: 'etoiles-secret grand', text: '★'.repeat(s.etoiles) }),
        carteParchemin(palier),
        el('button', { type: 'button', text: 'Fermer', onclick: () => voile.remove() })));
    voile.addEventListener('click', (ev) => { if (ev.target === voile) voile.remove(); });
    document.body.append(voile);
  }

  // ---------- Écran 3 : un sceau ----------
  function ecranSceau(n) {
    const def = S.liste[n - 1];
    const info = SCEAUX[n - 1];
    const zone = el('div', { class: 'zone-sceau' });
    // Énigme partagée entre plusieurs joueurs (config.graines) ou propre à ce code.
    const commune = ((window.SCEAUX_CONFIG.graines || {})[etat.empreinte] || {})[n];
    const graine = (commune ? 'commune:' + commune : etat.code) + ':sceau' + n;

    const ctx = {
      hasard: S.hasard(graine),
      code: etat.code,
      mj: etat.mj,
      reussir: () => briser(n),
      // Travail en cours sur ce sceau (positions, pièces posées…), pour reprendre là où on s'était arrêté.
      // Essais illimités (décision de Fabian) : aucun blocage après une erreur.
      memoire: {
        lire: () => lire(`encours:${etat.code}:${n}`),
        ecrire: (v) => ecrire(`encours:${etat.code}:${n}`, v)
      },
      // getBoundingClientRect force le recalcul aussi sur un dessin SVG (offsetWidth n'y existe pas),
      // sinon la secousse ne se rejoue pas au deuxième échec.
      secouer: (noeud) => { noeud.classList.remove('secousse'); void noeud.getBoundingClientRect(); noeud.classList.add('secousse'); }
    };

    const barre = el('div', { class: 'entete' },
      el('button', { class: 'discret', type: 'button', text: '← La porte', onclick: ecranPorte }),
      etat.mj && !etat.resolus[n] ? el('button', { class: 'discret', type: 'button', text: 'MJ : passer', onclick: ctx.reussir }) : null
    );

    afficher(barre,
      el('div', { class: 'titre-sceau' },
        el('div', { class: 'numero', text: 'SCEAU ' + ROMAINS[n - 1] + ' · ' + '★'.repeat(info.etoiles) }),
        el('h2', { text: info.nom })
      ),
      zone
    );

    if (etat.resolus[n]) {
      zone.append(el('div', {}, el('p', { class: 'consigne', text: 'Ce sceau est déjà brisé.' + (n <= 6 ? ' Son éclat est à toi.' : '') }),
        n <= 6 ? el('div', { class: 'fragment', style: 'margin:0 auto;width:72px;height:84px;font-size:2.4rem', text: eclat(n) }) : null,
        n <= 6 ? el('p', { class: 'gravure', text: '« ' + S.ordreDuMaitre(etat.code).gravures[n - 1] + ' »' }) : null));
      return;
    }
    const api = def.monter(zone, ctx) || {};
    if (api.solution) app().append(accesSolution(n, api.solution));
  }

  // ---------- Solution (pour le MJ) ----------
  // Un code par sceau (empreintes dans config.solutions) ouvre un panneau latéral :
  // la solution de l'énigme telle que ce joueur la voit, et pourquoi c'est la bonne.
  function accesSolution(n, solution, opts) {
    // opts (épreuves des Profondeurs) : { titre, attendu (empreinte de la clé), id (mémoire) }.
    const o = opts || { titre: 'Sceau ' + ROMAINS[n - 1], attendu: window.SCEAUX_CONFIG.solutions[n], id: n };
    const bloc = el('div', { class: 'acces-solution' });
    const panneau = () => {
      const s = solution();
      const volet = el('aside', { class: 'volet-solution', 'aria-label': 'Solution du sceau' },
        el('div', { class: 'entete' },
          el('h3', { text: 'Solution · ' + o.titre }),
          el('button', { class: 'discret', type: 'button', 'aria-label': 'Fermer', text: '✕', onclick: () => volet.remove() })),
        el('h4', { text: 'La réponse' }),
        el('ul', {}, s.reponse.map((l) => el('li', {}, l))),
        el('h4', { text: 'Pourquoi' }),
        s.pourquoi.map((l) => el('p', {}, l)));
      document.querySelector('.volet-solution')?.remove();
      app().append(volet);
    };
    // La clé entrée n'est retenue que pour CE joueur et CE sceau (jamais pour les autres codes).
    const cleMemoire = `solution:${etat.code}:${o.id}`;
    const ouvrir = () => { if (!etat.mj) ecrire(cleMemoire, true); panneau(); };

    // Code MJ : accès direct. Code joueur : il faut la clé du gardien de ce sceau.
    if (etat.mj || lire(cleMemoire)) {
      bloc.append(el('button', { class: 'discret', type: 'button', text: '🗝 Voir la solution', onclick: ouvrir }));
      return bloc;
    }
    const champ = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Clé du gardien', placeholder: 'Clé du gardien' });
    const form = el('form', {
      class: 'form-solution',
      onsubmit: async (ev) => {
        ev.preventDefault();
        let empreinte = '';
        try { empreinte = await sha256(normaliser(champ.value)); } catch (e) { /* voir ecranCode */ }
        if (empreinte && empreinte === o.attendu) { form.remove(); bloc.append(el('button', { class: 'discret', type: 'button', text: '🗝 Voir la solution', onclick: ouvrir })); ouvrir(); return; }
        champ.value = '';
        form.classList.remove('secousse'); void form.offsetWidth; form.classList.add('secousse');
      }
    }, champ, el('button', { class: 'discret', type: 'submit', text: 'OK' }));
    const lien = el('button', { class: 'lien-gardien', type: 'button', text: 'Clé du gardien', onclick: () => { lien.remove(); bloc.append(form); champ.focus(); } });
    bloc.append(lien);
    return bloc;
  }

  function briser(n) {
    const fragment = n <= 6 ? S.fragmentDu(etat.code, n) : '✦';
    etat.resolus[n] = { fragment };
    sauver();
    effacer(`encours:${etat.code}:${n}`);
    const contenu = n <= 6
      ? [el('h2', { text: 'Le sceau se brise' }),
        el('p', { class: 'doux', text: 'Un éclat de pierre roule à tes pieds.' }),
        el('div', { class: 'fragment', text: fragment }),
        el('p', { class: 'doux petit', text: 'Au dos, une gravure :' }),
        el('p', { class: 'gravure', text: '« ' + S.ordreDuMaitre(etat.code).gravures[n - 1] + ' »' })]
      : [el('h2', { text: 'La porte s’ouvre' }),
        el('p', { class: 'doux', text: 'Les sept sceaux sont brisés. La pierre glisse sans un bruit.' })];
    const palier = PALIERS.find((p) => p.sceau === n && p.cle !== 'final');
    if (palier) contenu.push(el('p', { class: 'doux', text: 'Un parchemin roulé glisse hors du sceau.' }), carteParchemin(palier));
    if (n === 7) contenu.push(el('p', { class: 'doux', text: 'Derrière, sur un lutrin de pierre, repose un dernier parchemin. Le lire demandera un peu de chance…' }));
    const voile = el('div', { class: 'brisure', role: 'dialog', 'aria-label': 'Sceau brisé' },
      el('div', { class: 'contenu' }, contenu,
        n === 7 && toutBrise()
          ? el('button', { type: 'button', text: '🎲 Approcher du lutrin', onclick: () => { voile.remove(); ecranDe(); } })
          : el('button', { type: 'button', text: 'Retour à la porte', onclick: () => { voile.remove(); ecranPorte(); } })));
    document.body.append(voile);
  }

  // Fragment de chaque sceau : une rune, toutes différentes pour un même code
  // (le sceau VII demandera de les remettre dans le bon ordre).
  const RUNES_FRAGMENTS = ['ᛟ', 'ᛞ', 'ᛉ', 'ᛝ', 'ᚠ', 'ᛗ', 'ᚦ', 'ᛒ', 'ᛏ', 'ᚱ', 'ᛇ', 'ᚷ'];
  S.fragmentDu = (code, n) => S.hasard(code + ':fragments').melanger(RUNES_FRAGMENTS)[n - 1];
  // Symbole de l'éclat d'un sceau : toujours recalculé depuis le code (jamais lu dans la
  // sauvegarde), pour qu'une donnée abîmée ne fausse pas la porte ni le sceau VII.
  const eclat = (n) => (n <= 6 ? S.fragmentDu(etat.code, n) : '✦');

  // ---------- L'ordre du Maître (sceau VII) ----------
  // Chaque éclat porte au dos une gravure sur l'ordre dans lequel la montagne les a forgés.
  // Les six gravures (une par éclat) sont tirées jusqu'à ce que l'ordre soit unique.
  const ECLAT_DE = ['l’éclat du Cadran', 'l’éclat des Engrenages', 'l’éclat de la Relève', 'l’éclat de l’Inscription', 'l’éclat des Diapasons', 'l’éclat de la Herse'];
  const PERMS6 = (function perms(t) {
    if (t.length <= 1) return [t];
    const r = [];
    t.forEach((x, i) => perms(t.slice(0, i).concat(t.slice(i + 1))).forEach((p) => r.push([x].concat(p))));
    return r;
  })([0, 1, 2, 3, 4, 5]).map((ordre) => { const pos = []; ordre.forEach((f, i) => { pos[f] = i; }); return pos; });
  const cacheOrdre = {};
  S.ordreDuMaitre = function (code) {
    if (cacheOrdre[code]) return cacheOrdre[code];
    const h = S.hasard(code + ':ordre');
    const runes = [1, 2, 3, 4, 5, 6].map((n) => S.fragmentDu(code, n));
    const NOMBRES = ['', 'Un éclat fut forgé', 'Deux éclats furent forgés', 'Trois éclats furent forgés', 'Quatre éclats furent forgés'];
    for (let essai = 0; ; essai++) {
      const ordre = h.melanger([0, 1, 2, 3, 4, 5]); // ordre[i] = éclat forgé en i-ème
      const pos = []; ordre.forEach((f, i) => { pos[f] = i; });
      // Désignation d'un autre éclat : par sa rune, ou par le sceau d'où il vient.
      const nom = (g) => (h.reel() < 0.5 ? runes[g] : ECLAT_DE[g]);
      const gravures = [0, 1, 2, 3, 4, 5].map((f) => {
        const vraies = [];
        const ajoute = (texte, test, poids, cible = -1) => vraies.push({ texte, test, poids, cible });
        for (let g = 0; g < 6; g++) {
          if (g === f) continue;
          const d = pos[f] - pos[g];
          if (d === 1) ajoute(`Je fus forgé juste après ${nom(g)}.`, (p) => p[f] - p[g] === 1, 4, g);
          if (d === -1) ajoute(`Je fus forgé juste avant ${nom(g)}.`, (p) => p[f] - p[g] === -1, 4, g);
          if (d > 1) ajoute(`Je fus forgé après ${nom(g)}.`, (p) => p[f] > p[g], 3, g);
          if (d < -1) ajoute(`Je fus forgé avant ${nom(g)}.`, (p) => p[f] < p[g], 3, g);
          if (Math.abs(d) >= 2) ajoute(`${NOMBRES[Math.abs(d) - 1]} entre ${nom(g)} et moi.`, (p) => Math.abs(p[f] - p[g]) === Math.abs(d), 4, g);
        }
        if (pos[f] > 0 && pos[f] < 5) ajoute('Je ne fus ni le premier ni le dernier forgé.', (p) => p[f] > 0 && p[f] < 5, 2);
        if (pos[f] <= 2) ajoute('Je fus parmi les trois premiers forgés.', (p) => p[f] <= 2, 2);
        if (pos[f] >= 3) ajoute('Je fus parmi les trois derniers forgés.', (p) => p[f] >= 3, 2);
        if (pos[f] === 0) ajoute('Je fus le premier forgé.', (p) => p[f] === 0, 1);
        if (pos[f] === 5) ajoute('Je fus le dernier forgé.', (p) => p[f] === 5, 1);
        const total = vraies.reduce((a, v) => a + v.poids, 0);
        let r = h.reel() * total;
        return vraies.find((v) => (r -= v.poids) <= 0) || vraies[vraies.length - 1];
      });
      // Deux éclats ne se citent jamais l'un l'autre (sinon deux gravures disent la même chose),
      // l'ordre doit être unique, et chaque gravure doit être indispensable.
      const croisees = gravures.some((g, f) => g.cible >= 0 && gravures[g.cible].cible === f);
      const compte = (liste) => PERMS6.filter((p) => liste.every((g) => g.test(p))).length;
      const bon = !croisees && compte(gravures) === 1 && gravures.every((g) => compte(gravures.filter((x) => x !== g)) > 1);
      if (bon || essai > 20000) {
        return (cacheOrdre[code] = { runes, ordre, gravures: gravures.map((g) => g.texte), tests: gravures.map((g) => g.test), PERMS6 });
      }
    }
  };
  S.ECLAT_DE = ECLAT_DE;

  // Au retour sur le site, on rouvre directement la porte du dernier code utilisé.
  try { history.scrollRestoration = 'manual'; } catch (e) { /* ancien navigateur */ }
  document.addEventListener('DOMContentLoaded', () => {
    // Ancienne mémoire des clés, commune à tous les codes : on l'oublie.
    for (let n = 1; n <= 7; n++) effacer('solution:' + n);
    ecranCode();
    if (!lire('dernier')) return;
    const form = document.querySelector('.accueil form');
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
})();
