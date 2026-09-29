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

  // ---------- Stockage (peut échouer : navigation privée, cookies bloqués) ----------
  const PREFIXE = 'sept-sceaux:v1:';
  function lire(cle) {
    try { const v = localStorage.getItem(PREFIXE + cle); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function ecrire(cle, val) {
    try { localStorage.setItem(PREFIXE + cle, JSON.stringify(val)); } catch (e) { /* tant pis */ }
  }
  function effacer(cle) {
    try { localStorage.removeItem(PREFIXE + cle); } catch (e) { /* tant pis */ }
  }

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
    a.replaceChildren(...noeuds);
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
    for (let n = 1; n <= 6; n++) {
      const r = etat.resolus[n];
      liste.append(el('span', { class: 'fragment' + (r ? '' : ' vide'), text: r ? r.fragment : '·' }));
    }

    afficher(
      el('div', { class: 'entete' },
        el('span', { class: 'code', text: etat.mj ? 'Code MJ' : 'Porte scellée' }),
        el('button', { class: 'discret', type: 'button', text: 'Changer de code', onclick: () => ecranCode() })
      ),
      el('h1', { text: 'La Porte' }),
      el('p', { class: 'consigne', text: 'Brise les sceaux un par un. Chacun laisse tomber un fragment de pierre : garde-les, le dernier sceau les réclame.' }),
      porte,
      el('div', { class: 'fragments' }, el('h3', { text: 'Fragments' }), liste),
      etat.mj ? el('div', { class: 'actions' }, el('button', {
        class: 'discret', type: 'button', text: 'MJ : remettre la partie à zéro',
        onclick: () => { etat.resolus = {}; effacer('partie:' + etat.code); ecranPorte(); }
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
      mj: etat.mj,
      reussir: () => briser(n),
      // Bloque un bouton quelques secondes après une erreur (contre l'essai au hasard).
      penalite: (bouton, secondes, message) => {
        const texte = bouton.textContent;
        let reste = secondes;
        bouton.disabled = true;
        const tic = () => {
          if (reste <= 0) { bouton.disabled = false; bouton.textContent = texte; return; }
          bouton.textContent = `${message || 'Patience'}… ${reste}`;
          reste--; setTimeout(tic, 1000);
        };
        tic();
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
      zone.append(el('p', { class: 'consigne', text: 'Ce sceau est déjà brisé. Son fragment est à toi.' }),
        el('div', { class: 'fragment', style: 'margin:0 auto;width:72px;height:84px;font-size:2.4rem', text: etat.resolus[n].fragment }));
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
    const fragment = S.fragmentDu(etat.code, n);
    etat.resolus[n] = { fragment };
    sauver();
    const voile = el('div', { class: 'brisure', role: 'dialog', 'aria-label': 'Sceau brisé' },
      el('div', { class: 'contenu' },
        el('h2', { text: 'Le sceau se brise' }),
        el('p', { class: 'doux', text: 'Un éclat de pierre roule à tes pieds.' }),
        el('div', { class: 'fragment', text: fragment }),
        el('button', { type: 'button', text: 'Retour à la porte', onclick: () => { voile.remove(); ecranPorte(); } })
      ));
    document.body.append(voile);
  }

  // Fragment de chaque sceau : une rune, toutes différentes pour un même code
  // (le sceau VII demandera de les remettre dans le bon ordre).
  const RUNES_FRAGMENTS = ['ᛟ', 'ᛞ', 'ᛉ', 'ᛝ', 'ᚠ', 'ᛗ', 'ᚦ', 'ᛒ', 'ᛏ', 'ᚱ', 'ᛇ', 'ᚷ'];
  S.fragmentDu = (code, n) => S.hasard(code + ':fragments').melanger(RUNES_FRAGMENTS)[n - 1];

  document.addEventListener('DOMContentLoaded', () => ecranCode());
})();
