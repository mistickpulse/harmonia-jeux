// Moteur des Sept Sceaux : code personnel, porte, navigation, sauvegarde.
// Chaque sceau s'enregistre avec Sceaux.enregistrer({ numero, monter(zone, ctx) }).
(function () {
  'use strict';

  const S = (window.Sceaux = { liste: [] });

  const SCEAUX = [
    { nom: 'Le Cadran des Rois', etoiles: 1 },
    { nom: 'Les Engrenages', etoiles: 2 },
    { nom: 'La Relève de la Garde', etoiles: 3 },
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
  // Demande au navigateur de ne pas vider ce stockage quand il manque de place.
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* facultatif */ }

  async function sha256(txt) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
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
        etat = { code, mj: !!trouve.mj, resolus: partie.resolus || {} };
        ecranPorte();
      }
    }, champ, el('button', { type: 'submit', text: 'Poser la main sur la porte' }), msg);

    afficher(el('section', { class: 'accueil' },
      el('h1', { text: 'Les Sept Sceaux' }),
      el('p', { class: 'intro', text: "Une porte de chambre forte naine, fermée par sept sceaux. Chacun garde une énigme, et chacune est plus cruelle que la précédente. Derrière la porte, un parchemin porte ton nom." }),
      el('p', { class: 'doux', text: 'Entre le code que le MJ t’a confié.' }),
      form
    ));
    champ.focus();
  }

  // ---------- Écran 2 : la porte ----------
  function disponible(n) { return n === 1 || !!etat.resolus[n - 1]; }

  function ecranPorte() {
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
        el('span', { class: 'medaillon', text: brise ? brise.fragment : ROMAINS[i] }),
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
          type: 'button', class: 'fragment', text: r.fragment, 'aria-label': `Éclat ${r.fragment} : lire la gravure`,
          onclick: () => { lecture.textContent = `${r.fragment} (${S.ECLAT_DE[n - 1]}) : « ${S.ordreDuMaitre(etat.code).gravures[n - 1]} »`; }
        })
        : el('span', { class: 'fragment vide', text: '·' }));
    }

    afficher(
      el('div', { class: 'entete' },
        el('span', { class: 'code', text: etat.mj ? 'Code MJ' : 'Porte scellée' }),
        el('button', { class: 'discret', type: 'button', text: 'Changer de code', onclick: () => ecranCode() })
      ),
      el('h1', { text: 'La Porte' }),
      el('p', { class: 'consigne', text: 'Brise les sceaux un par un. Chacun laisse tomber un éclat de pierre gravé : garde-les, le dernier sceau les réclame.' }),
      porte,
      el('div', { class: 'fragments' }, el('h3', { text: 'Éclats' }),
        Object.keys(etat.resolus).length ? el('p', { class: 'doux petit', text: 'Touche un éclat pour lire la gravure au dos.' }) : null,
        liste, lecture),
      etat.mj ? el('div', { class: 'actions' }, el('button', {
        class: 'discret', type: 'button', text: 'MJ : remettre la partie à zéro',
        onclick: () => {
          etat.resolus = {};
          effacer('partie:' + etat.code);
          SCEAUX.forEach((s, i) => effacer(`encours:${etat.code}:${i + 1}`));
          ecranPorte();
        }
      })) : null
    );
  }

  // ---------- Écran 3 : un sceau ----------
  function ecranSceau(n) {
    const def = S.liste[n - 1];
    const info = SCEAUX[n - 1];
    const zone = el('div', { class: 'zone-sceau' });
    const graine = etat.code + ':sceau' + n;

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
      secouer: (noeud) => { noeud.classList.remove('secousse'); void noeud.offsetWidth; noeud.classList.add('secousse'); }
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
        n <= 6 ? el('div', { class: 'fragment', style: 'margin:0 auto;width:72px;height:84px;font-size:2.4rem', text: etat.resolus[n].fragment }) : null,
        n <= 6 ? el('p', { class: 'gravure', text: '« ' + S.ordreDuMaitre(etat.code).gravures[n - 1] + ' »' }) : null));
      return;
    }
    const api = def.monter(zone, ctx) || {};
    if (api.solution) app().append(accesSolution(n, api.solution));
  }

  // ---------- Solution (pour le MJ) ----------
  // Un code par sceau (empreintes dans config.solutions) ouvre un panneau latéral :
  // la solution de l'énigme telle que ce joueur la voit, et pourquoi c'est la bonne.
  function accesSolution(n, solution) {
    const bloc = el('div', { class: 'acces-solution' });
    const panneau = () => {
      const s = solution();
      const volet = el('aside', { class: 'volet-solution', 'aria-label': 'Solution du sceau' },
        el('div', { class: 'entete' },
          el('h3', { text: 'Solution · Sceau ' + ROMAINS[n - 1] }),
          el('button', { class: 'discret', type: 'button', 'aria-label': 'Fermer', text: '✕', onclick: () => volet.remove() })),
        el('h4', { text: 'La réponse' }),
        el('ul', {}, s.reponse.map((l) => el('li', {}, l))),
        el('h4', { text: 'Pourquoi' }),
        s.pourquoi.map((l) => el('p', {}, l)));
      document.querySelector('.volet-solution')?.remove();
      app().append(volet);
    };
    const ouvrir = () => { ecrire('solution:' + n, true); panneau(); };

    if (etat.mj || lire('solution:' + n)) {
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
        if (empreinte && empreinte === window.SCEAUX_CONFIG.solutions[n]) { form.remove(); bloc.append(el('button', { class: 'discret', type: 'button', text: '🗝 Voir la solution', onclick: ouvrir })); ouvrir(); return; }
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
    const voile = el('div', { class: 'brisure', role: 'dialog', 'aria-label': 'Sceau brisé' },
      el('div', { class: 'contenu' }, contenu,
        el('button', { type: 'button', text: 'Retour à la porte', onclick: () => { voile.remove(); ecranPorte(); } })));
    document.body.append(voile);
  }

  // Fragment de chaque sceau : une rune, toutes différentes pour un même code
  // (le sceau VII demandera de les remettre dans le bon ordre).
  const RUNES_FRAGMENTS = ['ᛟ', 'ᛞ', 'ᛉ', 'ᛝ', 'ᚠ', 'ᛗ', 'ᚦ', 'ᛒ', 'ᛏ', 'ᚱ', 'ᛇ', 'ᚷ'];
  S.fragmentDu = (code, n) => S.hasard(code + ':fragments').melanger(RUNES_FRAGMENTS)[n - 1];

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
  document.addEventListener('DOMContentLoaded', () => {
    ecranCode();
    if (!lire('dernier')) return;
    const form = document.querySelector('.accueil form');
    if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
})();
