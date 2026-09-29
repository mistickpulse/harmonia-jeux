// Les Profondeurs — Les Glaces du Col (★★★★★)
// Une caverne gelée : le voyageur glisse en ligne droite jusqu'à heurter un rocher ou la paroi.
// Il faut ramasser tous les cristaux (en passant dessus) puis s'arrêter sur la sortie.
// Pièges de la glace : tremplins (saut par-dessus une case), portails runiques (paire),
// neige (arrêt net), courants (changent la direction), glace fragile (une seule traversée,
// puis crevasse). Chaque caverne est explorée entièrement : on ne garde que celles qui ont
// UN SEUL chemin le plus court, assez long, et qui oblige à se servir de plusieurs pièges.
(function () {
  'use strict';
  const { el } = Sceaux;
  const T = 9, CRISTAUX = 4, MARGE = 3;
  const DIRS = { haut: [-1, 0, '↑'], bas: [1, 0, '↓'], gauche: [0, -1, '←'], droite: [0, 1, '→'] };
  const hors = (r, c) => r < 0 || c < 0 || r >= T || c >= T;

  // Glisse depuis p. `brise` : masque des glaces fragiles déjà effondrées.
  // Renvoie { arret, visites, etapes, brise, types } ou null (pas de mouvement, ou boucle).
  function glisser(monde, p, nom, brise) {
    const { rochers, special } = monde;
    let [dr, dc] = DIRS[nom];
    let b = brise, pos = p, attente = -1;
    const depart = special.get(p);
    if (depart && depart.type === 'fragile') b |= 1 << depart.k; // on quitte une glace fragile : elle cède
    const bloque = (i) => { if (rochers.has(i)) return true; const s = special.get(i); return !!(s && s.type === 'fragile' && (b & (1 << s.k))); };
    const visites = [], etapes = [], types = new Set();
    // Effet de la case où l'on vient d'entrer : 'stop', 'suite' (on continue à glisser).
    const effet = () => {
      const s = special.get(pos);
      if (!s) return 'suite';
      types.add(s.type);
      if (s.type === 'neige') return 'stop';
      if (s.type === 'fleche') { [dr, dc] = DIRS[s.d]; return 'suite'; }
      if (s.type === 'fragile') { attente = s.k; return 'suite'; }
      if (s.type === 'portail') { pos = s.vers; visites.push(pos); etapes.push({ cell: pos, mode: 'portail' }); return 'suite'; }
      if (s.type === 'tremplin') {
        const r = Math.floor(pos / T) + 2 * dr, c = (pos % T) + 2 * dc;
        if (hors(r, c) || bloque(r * T + c)) return 'stop';
        pos = r * T + c; visites.push(pos); etapes.push({ cell: pos, mode: 'saut' });
        return effet(); // la case d'atterrissage a peut-être son propre effet
      }
      return 'suite';
    };
    for (let garde = 0; ; garde++) {
      if (garde > 120) return null; // la glace tourne en rond
      const r = Math.floor(pos / T) + dr, c = (pos % T) + dc;
      if (hors(r, c) || bloque(r * T + c)) break;
      if (attente >= 0) { b |= 1 << attente; attente = -1; } // on quitte une glace fragile traversée
      pos = r * T + c; visites.push(pos); etapes.push({ cell: pos, mode: 'glisse' });
      if (effet() === 'stop') break;
    }
    if (!etapes.length) return null;
    return { arret: pos, visites, etapes, brise: b, types };
  }

  // Plus court chemin sur (position, cristaux ramassés, glaces effondrées), avec comptage.
  function resoudre(monde, depart, sortie, cristaux) {
    const tous = (1 << cristaux.length) - 1;
    const bit = new Map(cristaux.map((c, i) => [c, 1 << i]));
    const cle = (p, m, b) => (p * 16 + m) * 4 + b;
    const k0 = cle(depart, 0, 0);
    const prec = new Map([[k0, null]]), niveau = new Map([[k0, 0]]), facons = new Map([[k0, 1]]);
    let front = [[depart, 0, 0]];
    for (let prof = 0; front.length && prof < 40; prof++) {
      const but = front.find(([p, m]) => p === sortie && m === tous);
      if (but) {
        const kb = cle(...but);
        const coups = [];
        for (let k = kb; prec.get(k); k = prec.get(k).de) coups.unshift(prec.get(k).dir);
        coups.unique = facons.get(kb) === 1;
        return coups;
      }
      const suiv = [];
      for (const [p, m, b] of front) {
        const ici = cle(p, m, b);
        for (const nom of Object.keys(DIRS)) {
          const g = glisser(monde, p, nom, b);
          if (!g) continue;
          let m2 = m; g.visites.forEach((x) => { if (bit.has(x)) m2 |= bit.get(x); });
          const k = cle(g.arret, m2, g.brise);
          if (!niveau.has(k)) { niveau.set(k, prof + 1); prec.set(k, { de: ici, dir: nom }); facons.set(k, facons.get(ici)); suiv.push([g.arret, m2, g.brise]); }
          else if (niveau.get(k) === prof + 1) facons.set(k, facons.get(k) + facons.get(ici));
        }
      }
      front = suiv;
    }
    return null;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      const cases = h.melanger([...Array(T * T).keys()]);
      const rochers = new Set(cases.slice(0, h.entier(9, 13)));
      const libres = cases.filter((i) => !rochers.has(i));
      const depart = libres[0];
      const bords = libres.filter((i) => i !== depart && (i < T || i >= T * (T - 1) || i % T === 0 || i % T === T - 1));
      if (!bords.length) continue;
      const sortie = h.choisir(bords);
      const reste = libres.filter((i) => i !== depart && i !== sortie);
      const cristaux = reste.slice(0, CRISTAUX);
      const pieges = reste.slice(CRISTAUX);
      const special = new Map();
      let k = 0;
      const prendre = () => pieges[k++];
      for (let n = 0; n < 2; n++) special.set(prendre(), { type: 'tremplin' });
      const pa = prendre(), pb = prendre();
      special.set(pa, { type: 'portail', vers: pb }); special.set(pb, { type: 'portail', vers: pa });
      for (let n = 0; n < 2; n++) special.set(prendre(), { type: 'neige' });
      for (let n = 0; n < 2; n++) special.set(prendre(), { type: 'fleche', d: h.choisir(Object.keys(DIRS)) });
      for (let n = 0; n < 2; n++) special.set(prendre(), { type: 'fragile', k: n });
      const monde = { rochers, special };
      const coups = resoudre(monde, depart, sortie, cristaux);
      if (!coups || !coups.unique) continue;
      // Quels pièges le chemin le plus court utilise-t-il vraiment ?
      let p = depart, b = 0; const utilises = new Set();
      coups.forEach((d) => { const g = glisser(monde, p, d, b); g.types.forEach((t) => utilises.add(t)); p = g.arret; b = g.brise; });
      const assez = utilises.size >= 4 && coups.length >= 15;
      const tolere = essai > 6000 && utilises.size >= 4 && coups.length >= 12;
      if (assez || tolere) return { monde, depart, sortie, cristaux, coups, utilises };
    }
  }

  const NOMS_PIEGES = { tremplin: 'tremplins', portail: 'portails', neige: 'neige', fleche: 'courants', fragile: 'glace fragile' };

  function monter(zone, ctx) {
    const { monde, depart, sortie, cristaux, coups: optimum, utilises } = generer(ctx.hasard);
    const { rochers, special } = monde;
    const limite = optimum.length + MARGE;
    const garde = ctx.memoire.lire() || {};
    let historique = Array.isArray(garde.historique) ? garde.historique.filter((d) => DIRS[d]) : [];
    let fini = false, enMouvement = false;
    const memoriser = () => ctx.memoire.ecrire({ historique });

    // Rejoue l'historique depuis le départ.
    function situation() {
      let p = depart, b = 0; const pris = new Set();
      historique.forEach((d) => { const g = glisser(monde, p, d, b); if (!g) return; g.visites.forEach((x) => { if (cristaux.includes(x)) pris.add(x); }); p = g.arret; b = g.brise; });
      return { p, pris, b };
    }

    const plan = el('div', { class: 'caverne', role: 'grid', 'aria-label': 'Caverne gelée' });
    const casesEl = [];
    for (let i = 0; i < T * T; i++) {
      const s = special.get(i);
      let classe = rochers.has(i) ? 'roc' : i === sortie ? 'sortie' : 'glace';
      let contenu = null;
      if (i === sortie) contenu = el('span', { class: 'rune-sortie', text: 'ᛟ' });
      else if (s) {
        classe += ' piege ' + s.type;
        contenu = el('span', { class: 'signe', text: s.type === 'tremplin' ? '⤴' : s.type === 'portail' ? 'ᛝ' : s.type === 'neige' ? '❄' : s.type === 'fleche' ? DIRS[s.d][2] : '' });
      }
      const c = el('div', { class: 'case-glace ' + classe }, contenu);
      casesEl.push(c);
      plan.append(c);
    }
    const pos = (i) => ({ left: `${(i % T) * 100 / T}%`, top: `${Math.floor(i / T) * 100 / T}%` });
    const jetonsCristaux = cristaux.map((c) => { const j = el('div', { class: 'cristal-glace', 'aria-hidden': 'true' }); Object.assign(j.style, pos(c)); plan.append(j); return j; });
    const voyageur = el('div', { class: 'voyageur-glace', 'aria-label': 'Le voyageur' }, el('span', { text: 'ᚱ' }));
    plan.append(voyageur);
    const compteur = el('p', { class: 'compteur' });
    const msg = el('p', { class: 'message' });

    function majCases(b) {
      special.forEach((s, i) => { if (s.type === 'fragile') casesEl[i].classList.toggle('crevasse', !!(b & (1 << s.k))); });
    }
    function majCompteur(nbPris) {
      compteur.textContent = `Glissades : ${historique.length} / ${limite} · Cristaux : ${nbPris} / ${CRISTAUX}`;
      compteur.classList.toggle('alerte', historique.length >= limite - 1);
    }
    function dessiner() {
      const { p, pris, b } = situation();
      voyageur.style.transitionDuration = '0ms';
      voyageur.classList.remove('glisse', 'saut', 'teleporte');
      Object.assign(voyageur.style, pos(p));
      void voyageur.offsetWidth;
      jetonsCristaux.forEach((j, k) => j.classList.toggle('pris', pris.has(cristaux[k])));
      majCases(b);
      majCompteur(pris.size);
    }

    // Animation : glissades droites (durée selon la distance), sauts, passages de portail.
    function animer(etapes, depart0, pris, fin) {
      const segments = [];
      let prec = depart0;
      etapes.forEach((e) => {
        const dern = segments[segments.length - 1];
        const delta = e.cell - prec;
        if (e.mode === 'glisse' && dern && dern.mode === 'glisse' && dern.delta === delta) dern.cells.push(e.cell);
        else segments.push({ mode: e.mode, delta, cells: [e.cell] });
        prec = e.cell;
      });
      let nbPris = pris.size;
      const ramasser = (cells) => cells.forEach((x) => {
        const idx = cristaux.indexOf(x);
        if (idx >= 0 && !pris.has(x)) { pris.add(x); jetonsCristaux[idx].classList.add('pris'); nbPris++; majCompteur(nbPris); }
      });
      (function suivant(k) {
        if (k === segments.length) { fin(); return; }
        const s = segments[k];
        const cible = s.cells[s.cells.length - 1];
        if (s.mode === 'portail') {
          voyageur.classList.add('teleporte');
          setTimeout(() => {
            voyageur.style.transitionDuration = '0ms'; Object.assign(voyageur.style, pos(cible)); void voyageur.offsetWidth;
            voyageur.classList.remove('teleporte'); ramasser(s.cells);
            setTimeout(() => suivant(k + 1), 180);
          }, 170);
          return;
        }
        const duree = s.mode === 'saut' ? 340 : Math.max(160, s.cells.length * 95);
        voyageur.classList.toggle('saut', s.mode === 'saut');
        voyageur.classList.toggle('glisse', s.mode === 'glisse');
        voyageur.style.transitionDuration = duree + 'ms';
        Object.assign(voyageur.style, pos(cible));
        setTimeout(() => { ramasser(s.cells); voyageur.classList.remove('saut'); suivant(k + 1); }, duree + 20);
      })(0);
    }

    function jouer(d) {
      if (fini || enMouvement) return;
      const avant = situation();
      const g = glisser(monde, avant.p, d, avant.b);
      if (!g) {
        msg.className = 'message'; msg.textContent = 'Impossible de glisser par là (rocher, paroi, crevasse… ou un courant qui tourne en rond).';
        voyageur.classList.remove('bute'); void voyageur.offsetWidth; voyageur.classList.add('bute');
        return;
      }
      historique.push(d); memoriser(); msg.className = 'message'; msg.textContent = '';
      enMouvement = true;
      voyageur.classList.remove('arrive');
      majCompteur(avant.pris.size);
      majCases(avant.b | (special.get(avant.p) && special.get(avant.p).type === 'fragile' ? 1 << special.get(avant.p).k : 0));
      animer(g.etapes, avant.p, new Set(avant.pris), () => {
        enMouvement = false;
        voyageur.classList.remove('glisse');
        voyageur.classList.add('arrive');
        majCases(g.brise);
        apres();
      });
    }

    function apres() {
      const s = situation();
      majCompteur(s.pris.size);
      if (s.p === sortie && s.pris.size === CRISTAUX) {
        fini = true;
        msg.className = 'message ok'; msg.textContent = 'Les quatre cristaux chantent dans ta sacoche : tu franchis la sortie du col.';
        setTimeout(ctx.reussir, 1300);
      } else if (historique.length >= limite) {
        fini = true;
        msg.className = 'message erreur'; msg.textContent = 'Tes forces t’abandonnent sur la glace : trop de glissades. Retour à l’entrée du col.';
        ctx.secouer(plan);
        setTimeout(() => { historique = []; fini = false; memoriser(); dessiner(); msg.textContent = ''; }, 1800);
      }
    }

    // Clavier (flèches) et balayage au doigt.
    const clavier = (ev) => {
      if (!plan.isConnected) { window.removeEventListener('keydown', clavier); return; }
      const d = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }[ev.key];
      if (d) { ev.preventDefault(); jouer(d); }
    };
    window.addEventListener('keydown', clavier);
    let x0 = null, y0 = null;
    plan.addEventListener('touchstart', (ev) => { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
    plan.addEventListener('touchend', (ev) => {
      if (x0 === null) return;
      const dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
      jouer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'droite' : 'gauche') : (dy > 0 ? 'bas' : 'haut'));
    });

    const legende = (classe, signe, texte) => el('li', {}, el('span', { class: 'case-glace glace piege ' + classe + ' mini' }, el('span', { class: 'signe', text: signe })), texte);
    const fleche = (d, t) => el('button', { type: 'button', class: 'bouton-fleche', 'aria-label': 'Glisser vers ' + d, text: t, onclick: () => jouer(d) });
    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Le col est une caverne entièrement gelée. Sur la glace, impossible de s’arrêter : le voyageur (le médaillon ᚱ) glisse tout droit jusqu’à heurter un rocher ou la paroi.' }),
        el('p', { text: `Ramasse les ${CRISTAUX} cristaux violets (il suffit de passer dessus), puis arrête-toi exactement sur l’arche runique ᛟ. Tu disposes de ${limite} glissades au plus ; au-delà, retour à l’entrée. Un seul chemin le plus court existe, et il est serré.` }),
        el('p', {}, el('strong', { text: 'Mais la glace du col est étrange :' })),
        el('ul', { class: 'legende-glace' },
          legende('tremplin', '⤴', 'Tremplin : tu sautes par-dessus la case suivante (même un rocher) et tu continues à glisser. Si l’atterrissage est bloqué, tu t’arrêtes sur le tremplin.'),
          legende('portail', 'ᛝ', 'Portails runiques : entrer dans l’un te fait ressortir par l’autre, et tu continues dans la même direction.'),
          legende('neige', '❄', 'Neige : elle t’arrête net.'),
          legende('fleche', '→', 'Courant : il te dévie dans le sens de sa flèche, sans t’arrêter.'),
          legende('fragile', '', 'Glace fragile (fissurée) : elle ne supporte qu’un seul passage. Dès que tu la quittes, elle s’effondre en crevasse, infranchissable.')),
        el('p', { text: 'Glisse avec les flèches ci-dessous, les flèches du clavier, ou en balayant le plan du doigt. « Annuler » reprend la dernière glissade (et répare la glace qu’elle avait brisée).' })),
      compteur,
      el('div', { class: 'cadre-caverne' }, plan),
      el('div', { class: 'croix-fleches' }, el('span'), fleche('haut', '↑'), el('span'), fleche('gauche', '←'), fleche('bas', '↓'), fleche('droite', '→')),
      msg,
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'discret', text: '↶ Annuler la dernière glissade', onclick: () => { if (fini || enMouvement || !historique.length) return; historique.pop(); memoriser(); msg.textContent = ''; dessiner(); } }),
        el('button', { type: 'button', class: 'discret', text: '↺ Recommencer', onclick: () => { if (fini || enMouvement) return; historique = []; memoriser(); msg.textContent = ''; dessiner(); } })));
    dessiner();

    return {
      solution: () => ({
        reponse: [`Le seul chemin le plus court : ${optimum.length} glissades.`, optimum.map((d) => DIRS[d][2]).join(' ')],
        pourquoi: [
          `Ce chemin est le plus court possible, et c’est le seul de cette longueur (vérifié en explorant toutes les positions, tous les ordres de ramassage et tous les états de la glace fragile). La limite est de ${limite} glissades.`,
          `Il oblige à se servir de : ${[...utilises].map((t) => NOMS_PIEGES[t]).join(', ')}.`,
          'Penser à l’envers : depuis quelles cases peut-on glisser jusqu’à la sortie et s’y arrêter ? Les tremplins et les portails permettent d’atteindre des zones autrement fermées ; la neige et les rochers servent d’arrêts.',
          'Attention à l’ordre : une glace fragile traversée trop tôt devient une crevasse qui peut fermer le seul passage vers un cristal.'
        ]
      })
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'glaces', nom: 'Les Glaces du Col', icone: '❄', etoiles: 5, resume: 'Planification', monter });
})();
