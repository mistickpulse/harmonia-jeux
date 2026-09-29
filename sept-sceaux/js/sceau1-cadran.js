// Sceau I — Le Cadran des Rois (★)
// Quatre anneaux portent les mêmes huit runes. Une devise désigne, par énigmes,
// ce que la flèche doit montrer sur chaque anneau. La tablette ne traduit que
// sept runes : la huitième se déduit par élimination.
(function () {
  'use strict';
  const { el, svg } = Sceaux;

  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ'];
  const SENS = [
    { mot: 'Hache', k: 'celle qui fend le chêne' },
    { mot: 'Montagne', k: 'le toit du monde, que nul ne soulève' },
    { mot: 'Feu', k: 'le loup rouge qui dévore le bois' },
    { mot: 'Eau', k: 'le chemin qui ne garde aucune trace' },
    { mot: 'Marteau', k: 'le poing de fer du forgeron' },
    { mot: 'Couronne', k: 'le cercle qui pèse sur un seul front' },
    { mot: 'Étoile', k: 'l’une des mille qui guident les marins' },
    { mot: 'Clé', k: 'celle qui ouvre sans frapper' },
    { mot: 'Bouclier', k: 'le mur que l’on porte au bras' },
    { mot: 'Serpent', k: 'celui qui marche sans pieds' },
    { mot: 'Pierre', k: 'l’os de la terre' },
    { mot: 'Vent', k: 'le voyageur qu’on entend sans jamais le voir' },
    { mot: 'Lune', k: 'la lanterne pâle qui change de visage' },
    { mot: 'Or', k: 'le métal qui ne rouille jamais' },
    { mot: 'Corbeau', k: 'le messager noir des champs de bataille' },
    { mot: 'Ours', k: 'le dormeur de l’hiver' }
  ];
  const ANNEAUX = [ // rayon intérieur, rayon extérieur
    [152, 196], [108, 152], [64, 108], [20, 64]
  ];
  const TEINTES = ['#3a3026', '#2f271f', '#3a3026', '#2f271f'];

  function monter(zone, ctx) {
    const h = ctx.hasard;
    const sens = h.melanger(SENS).slice(0, 8);      // sens[i] ↔ runes[i]
    const runes = h.melanger(RUNES).slice(0, 8);
    const cibles = h.melanger([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4); // sens voulu par anneau
    const cachee = cibles[h.entier(0, 3)];          // absente de la tablette
    const ordres = cibles.map(() => h.melanger([0, 1, 2, 3, 4, 5, 6, 7]));
    const pos = ordres.map((ordre, i) => {          // case sous la flèche
      let p; do { p = h.entier(0, 7); } while (ordre[p] === cibles[i]);
      return p;
    });
    // Reprise : positions laissées par le joueur lors de sa dernière visite.
    const garde = ctx.memoire.lire();
    if (garde && Array.isArray(garde.pos) && garde.pos.length === 4) garde.pos.forEach((p, i) => { pos[i] = ((p | 0) % 8 + 8) % 8; });
    const angle = pos.map((p) => -p * 45);          // angle cumulé (pas de saut à 360°)

    // --- La devise ---
    const k = cibles.map((c) => sens[c].k);
    const devise = el('p', { class: 'devise' },
      '« Du cercle extérieur jusqu’au cœur, que la flèche désigne ',
      el('strong', { text: k[0] }), ', puis ', el('strong', { text: k[1] }),
      ', puis ', el('strong', { text: k[2] }), ' ; et, au cœur, ', el('strong', { text: k[3] }), '. »');

    // --- Le cadran ---
    const groupes = [];
    const textes = [];
    const cadran = svg('svg', { viewBox: '0 0 400 400', class: 'cadran', role: 'img', 'aria-label': 'Cadran à quatre anneaux' });
    cadran.append(svg('circle', { cx: 200, cy: 200, r: 198, fill: '#1a1511', stroke: '#6b5638', 'stroke-width': 3 }));
    ANNEAUX.forEach(([ri, re], i) => {
      const g = svg('g', { class: 'anneau' });
      g.append(svg('circle', { cx: 200, cy: 200, r: (ri + re) / 2, fill: 'none', stroke: TEINTES[i], 'stroke-width': re - ri - 2 }));
      g.append(svg('circle', { cx: 200, cy: 200, r: re - 1, fill: 'none', stroke: '#6b5638', 'stroke-width': 1.5 }));
      const rm = (ri + re) / 2;
      textes[i] = [];
      ordres[i].forEach((s, j) => {
        const a = (-90 + j * 45) * Math.PI / 180;
        const x = 200 + rm * Math.cos(a), y = 200 + rm * Math.sin(a);
        const t = svg('text', {
          x: x.toFixed(2), y: y.toFixed(2), class: 'rune-cadran', 'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-size': i === 3 ? 20 : 26, text: runes[s]
        });
        textes[i].push(t);
        g.append(t);
        // rayons de séparation
        const b = (-90 + j * 45 + 22.5) * Math.PI / 180;
        g.append(svg('line', {
          x1: 200 + ri * Math.cos(b), y1: 200 + ri * Math.sin(b), x2: 200 + re * Math.cos(b), y2: 200 + re * Math.sin(b),
          stroke: '#1a1511', 'stroke-width': 2
        }));
      });
      groupes.push(g);
      cadran.append(g);
    });
    groupes.forEach((g, i) => poser(i, angle[i]));
    cadran.append(svg('circle', { cx: 200, cy: 200, r: 18, fill: '#6b5638' }));
    // La flèche, en haut
    cadran.append(svg('path', { d: 'M200 46 L186 18 L214 18 Z', fill: '#e8c275', stroke: '#1a1511', 'stroke-width': 2 }));
    cadran.append(svg('rect', { x: 186, y: 4, width: 28, height: 196, fill: '#e8c275', opacity: 0.08 }));

    // Angle affiché (animé) de chaque anneau ; les runes restent droites.
    const affiche = angle.slice();
    function poser(i, a) {
      groupes[i].setAttribute('transform', `rotate(${a.toFixed(2)} 200 200)`);
      textes[i].forEach((t) => t.setAttribute('transform', `rotate(${(-a).toFixed(2)} ${t.getAttribute('x')} ${t.getAttribute('y')})`));
    }
    function animer(i) {
      const depart = affiche[i], arrivee = angle[i], t0 = performance.now();
      if (document.hidden) { affiche[i] = arrivee; poser(i, arrivee); return; } // pas d'animation en arrière-plan
      const pas = (t) => {
        const k = Math.min((t - t0) / 300, 1);
        affiche[i] = depart + (arrivee - depart) * (1 - Math.pow(1 - k, 3));
        poser(i, affiche[i]);
        if (k < 1 && angle[i] === arrivee) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }
    function tourner(i, pas) {
      pos[i] = (pos[i] - pas + 8) % 8;
      angle[i] += pas * 45;
      animer(i);
      ctx.memoire.ecrire({ pos });
      msg.className = 'message'; msg.textContent = ''; // nouvel essai : on efface l'échec précédent
    }

    // Toucher un anneau le fait tourner d'un cran dans le sens des aiguilles d'une montre.
    cadran.addEventListener('click', (ev) => {
      const pt = cadran.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const p = pt.matrixTransform(cadran.getScreenCTM().inverse());
      const d = Math.hypot(p.x - 200, p.y - 200);
      const i = ANNEAUX.findIndex(([ri, re]) => d >= ri && d < re);
      if (i >= 0) tourner(i, 1);
    });

    // Boutons (précision au doigt, et sens inverse)
    const NOMS = ['Extérieur', 'Deuxième', 'Troisième', 'Cœur'];
    const commandes = el('div', { class: 'commandes-cadran' },
      NOMS.map((nom, i) => el('div', { class: 'commande' },
        el('button', { class: 'discret', type: 'button', 'aria-label': `Tourner l'anneau ${nom} vers la gauche`, text: '↺', onclick: () => tourner(i, -1) }),
        el('span', { text: nom }),
        el('button', { class: 'discret', type: 'button', 'aria-label': `Tourner l'anneau ${nom} vers la droite`, text: '↻', onclick: () => tourner(i, 1) })
      )));

    // --- La tablette ---
    const tablette = el('div', { class: 'tablette' });
    h.melanger([0, 1, 2, 3, 4, 5, 6, 7]).forEach((s) => {
      tablette.append(s === cachee
        ? el('div', { class: 'entree effacee' }, el('span', { class: 'rune', text: '?' }), el('span', { text: 'effacé' }))
        : el('div', { class: 'entree' }, el('span', { class: 'rune', text: runes[s] }), el('span', { text: sens[s].mot })));
    });

    const msg = el('p', { class: 'message' });
    let essais = 0;
    const valider = el('button', {
      type: 'button', text: 'Tourner la poignée',
      onclick: () => {
        const ok = pos.every((p, i) => ordres[i][p] === cibles[i]);
        if (ok) { msg.className = 'message ok'; msg.textContent = 'Un déclic sourd traverse la pierre.'; setTimeout(ctx.reussir, 700); return; }
        essais++;
        msg.className = 'message erreur';
        msg.textContent = `La poignée refuse de tourner.${essais > 1 ? ` (essai ${essais})` : ''} Tourne les anneaux et réessaie.`;
        ctx.secouer(cadran);
      }
    });

    zone.append(
      el('p', { class: 'consigne', text: 'Gravée au-dessus de la serrure, une devise. Touche un anneau pour le faire tourner.' }),
      devise,
      el('div', { class: 'disposition-cadran' },
        el('div', { class: 'bloc-cadran' }, cadran, commandes),
        el('div', { class: 'panneau bloc-tablette' },
          el('h3', { text: 'Tablette de traduction' }),
          el('p', { class: 'doux petit', text: 'Une vieille tablette, fendue. Une ligne est illisible.' }),
          tablette)
      ),
      msg,
      el('div', { class: 'actions' }, valider)
    );

    const rune = (s) => el('span', { class: 'rune', text: runes[s] });
    return {
      solution: () => ({
        reponse: cibles.map((c, i) => [`${NOMS[i]} : `, rune(c), ` (${sens[c].mot})`]),
        pourquoi: [
          'La devise se lit du cercle extérieur vers le cœur : chaque énigme désigne un mot, et la tablette donne la rune de ce mot.',
          ...cibles.map((c, i) => c === cachee
            ? [`${NOMS[i]} : « ${sens[c].k} », c’est ${sens[c].mot.toLowerCase()}. Ce mot n’est pas sur la tablette : c’est la ligne effacée. Chaque anneau porte les huit mêmes runes et la tablette en traduit sept ; la seule rune de l’anneau absente de la tablette est donc `, rune(c), '.']
            : [`${NOMS[i]} : « ${sens[c].k} », c’est ${sens[c].mot.toLowerCase()}, donc `, rune(c), ' d’après la tablette.']),
          'Il faut amener ces quatre runes sous la flèche, puis tourner la poignée.'
        ]
      })
    };
  }

  Sceaux.enregistrer({ numero: 1, monter });
})();
