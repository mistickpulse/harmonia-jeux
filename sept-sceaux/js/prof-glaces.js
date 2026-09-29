// Les Profondeurs — Les Glaces du Col (★★★★)
// Une caverne gelée : le voyageur glisse en ligne droite jusqu'à heurter un rocher ou la paroi.
// Il faut ramasser tous les cristaux (on les ramasse en passant dessus) puis s'arrêter sur la
// sortie. Chaque caverne est explorée entièrement (recherche en largeur) : on connaît le chemin
// le plus court, et le nombre de glissades est limité à ce minimum + une petite marge.
(function () {
  'use strict';
  const { el } = Sceaux;
  const T = 9, CRISTAUX = 4, MARGE = 3;
  const DIRS = { haut: [-1, 0, '↑'], bas: [1, 0, '↓'], gauche: [0, -1, '←'], droite: [0, 1, '→'] };

  // Glisse depuis `p` : renvoie la case d'arrêt et les cases traversées.
  function glisser(rochers, p, [dr, dc]) {
    let r = Math.floor(p / T), c = p % T;
    const chemin = [];
    for (;;) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= T || cc >= T || rochers.has(rr * T + cc)) break;
      r = rr; c = cc; chemin.push(r * T + c);
    }
    return { arret: r * T + c, chemin };
  }

  // Plus court chemin : état = (position, cristaux déjà ramassés).
  function resoudre(rochers, depart, sortie, cristaux) {
    const tous = (1 << cristaux.length) - 1;
    const bit = new Map(cristaux.map((c, i) => [c, 1 << i]));
    const cle = (p, m) => p * 64 + m;
    const prec = new Map([[cle(depart, 0), null]]);
    const niveau = new Map([[cle(depart, 0), 0]]);
    const facons = new Map([[cle(depart, 0), 1]]); // nombre de plus courts chemins jusqu'à chaque état
    let front = [[depart, 0]];
    for (let prof = 0; front.length; prof++) {
      const but = front.find(([p, m]) => p === sortie && m === tous);
      if (but) {
        const k0 = cle(but[0], but[1]);
        const coups = [];
        for (let k = k0; prec.get(k); k = prec.get(k).de) coups.unshift(prec.get(k).dir);
        coups.unique = facons.get(k0) === 1;
        return coups;
      }
      const suiv = [];
      for (const [p, m] of front) {
        const ici = cle(p, m);
        for (const [nom, d] of Object.entries(DIRS)) {
          const { arret, chemin } = glisser(rochers, p, d);
          if (arret === p) continue;
          let m2 = m; chemin.forEach((x) => { if (bit.has(x)) m2 |= bit.get(x); });
          const k = cle(arret, m2);
          if (!niveau.has(k)) { niveau.set(k, prof + 1); prec.set(k, { de: ici, dir: nom }); facons.set(k, facons.get(ici)); suiv.push([arret, m2]); }
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
      const rochers = new Set(cases.slice(0, h.entier(11, 16)));
      const libres = cases.filter((i) => !rochers.has(i));
      const depart = libres[0];
      const bords = libres.filter((i) => i !== depart && (i < T || i >= T * (T - 1) || i % T === 0 || i % T === T - 1));
      if (!bords.length) continue;
      const sortie = h.choisir(bords);
      const cristaux = libres.filter((i) => i !== depart && i !== sortie).slice(0, CRISTAUX);
      const coups = resoudre(rochers, depart, sortie, cristaux);
      // Un seul chemin le plus court (solution unique), et assez long.
      if (coups && coups.unique && (coups.length >= 14 || (coups.length >= 11 && essai > 3000))) return { rochers, depart, sortie, cristaux, coups };
    }
  }

  function monter(zone, ctx) {
    const { rochers, depart, sortie, cristaux, coups: optimum } = generer(ctx.hasard);
    const limite = optimum.length + MARGE;
    const garde = ctx.memoire.lire() || {};
    let historique = Array.isArray(garde.historique) ? garde.historique.filter((d) => DIRS[d]) : []; // glissades jouées
    let fini = false;
    const memoriser = () => ctx.memoire.ecrire({ historique });

    // Rejoue l'historique depuis le départ pour connaître la situation.
    function situation() {
      let p = depart; const pris = new Set();
      historique.forEach((d) => { const g = glisser(rochers, p, DIRS[d]); g.chemin.forEach((x) => { if (cristaux.includes(x)) pris.add(x); }); p = g.arret; });
      return { p, pris };
    }

    // Le décor est construit une fois ; le voyageur et les cristaux sont posés par-dessus,
    // en position absolue, pour pouvoir glisser en continu d'une case à l'autre.
    const plan = el('div', { class: 'caverne', role: 'grid', 'aria-label': 'Caverne gelée' });
    for (let i = 0; i < T * T; i++) {
      const classe = rochers.has(i) ? 'roc' : i === sortie ? 'sortie' : 'glace';
      plan.append(el('div', { class: 'case-glace ' + classe }, i === sortie ? el('span', { class: 'rune-sortie', text: 'ᛟ' }) : null));
    }
    const pos = (i) => ({ left: `${(i % T) * 100 / T}%`, top: `${Math.floor(i / T) * 100 / T}%` });
    const jetonsCristaux = cristaux.map((c) => {
      const j = el('div', { class: 'cristal-glace', 'aria-hidden': 'true' });
      Object.assign(j.style, pos(c));
      plan.append(j);
      return j;
    });
    const voyageur = el('div', { class: 'voyageur-glace', 'aria-label': 'Le voyageur' }, el('span', { text: 'ᚱ' }));
    plan.append(voyageur);
    const compteur = el('p', { class: 'compteur' });
    const msg = el('p', { class: 'message' });
    let enMouvement = false;

    // Sans animation (au départ, après « annuler » ou « recommencer »).
    function dessiner() {
      const { p, pris } = situation();
      voyageur.style.transitionDuration = '0ms';
      Object.assign(voyageur.style, pos(p));
      void voyageur.offsetWidth;
      jetonsCristaux.forEach((j, k) => j.classList.toggle('pris', pris.has(cristaux[k])));
      majCompteur(pris.size);
    }
    function majCompteur(nbPris) {
      compteur.textContent = `Glissades : ${historique.length} / ${limite} · Cristaux : ${nbPris} / ${CRISTAUX}`;
      compteur.classList.toggle('alerte', historique.length >= limite - 1);
    }

    function jouer(d) {
      if (fini || enMouvement) return;
      const { p, pris } = situation();
      const g = glisser(rochers, p, DIRS[d]);
      if (g.arret === p) {
        msg.className = 'message'; msg.textContent = 'Un rocher, ou la paroi : impossible de glisser par là.';
        voyageur.classList.remove('bute'); void voyageur.offsetWidth; voyageur.classList.add('bute');
        return;
      }
      historique.push(d); memoriser(); msg.className = 'message'; msg.textContent = '';
      // La glissade : durée selon la distance, freinage en fin de course, traînée de givre.
      const duree = Math.max(220, g.chemin.length * 95);
      enMouvement = true;
      voyageur.classList.remove('arrive');
      voyageur.classList.add('glisse', DIRS[d][0] ? 'vertical' : 'horizontal');
      voyageur.style.transitionDuration = duree + 'ms';
      Object.assign(voyageur.style, pos(g.arret));
      let nbPris = pris.size;
      g.chemin.forEach((x, k) => {
        const idx = cristaux.indexOf(x);
        if (idx < 0 || pris.has(x)) return;
        setTimeout(() => { jetonsCristaux[idx].classList.add('pris', 'eclat'); nbPris++; majCompteur(nbPris); }, duree * Math.pow((k + 1) / g.chemin.length, 1.6) * 0.9);
      });
      majCompteur(nbPris);
      setTimeout(() => {
        enMouvement = false;
        voyageur.classList.remove('glisse', 'vertical', 'horizontal');
        voyageur.classList.add('arrive');
        apres();
      }, duree + 30);
    }

    function apres() {
      const s = situation();
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

    const fleche = (d, t) => el('button', { type: 'button', class: 'fleche', 'aria-label': 'Glisser vers ' + d, text: t, onclick: () => jouer(d) });
    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: `Le col est une caverne entièrement gelée. Sur la glace, impossible de s’arrêter : le voyageur (le médaillon ᚱ) glisse tout droit jusqu’à heurter un rocher ou la paroi.` }),
        el('p', { text: `Ramasse les ${CRISTAUX} cristaux violets (il suffit de passer dessus), puis arrête-toi exactement sur l’arche runique ᛟ, la sortie du col. Tu disposes de ${limite} glissades au plus ; au-delà, tu retournes à l’entrée. Le chemin le plus court existe, et il est serré.` }),
        el('p', { text: 'Glisse avec les flèches ci-dessous, les flèches du clavier, ou en balayant le plan du doigt. « Annuler » reprend la dernière glissade.' })),
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
          `Ce chemin est le plus court possible, et c’est le seul de cette longueur (vérifié en explorant toutes les positions et tous les ordres de ramassage). La limite est de ${limite} glissades.`,
          'Sur la glace, on ne choisit pas où s’arrêter : il faut donc penser à l’envers. Partir de la sortie : depuis quelles cases peut-on glisser jusqu’à elle et s’y arrêter ? Puis remonter.',
          'Un cristal au milieu d’une ligne se ramasse en le traversant : inutile de s’y arrêter.',
          'Les rochers isolés servent d’arrêts : ce sont eux qui permettent de changer de direction là où on le veut.'
        ]
      })
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'glaces', nom: 'Les Glaces du Col', icone: '❄', etoiles: 4, resume: 'Planification', monter });
})();
