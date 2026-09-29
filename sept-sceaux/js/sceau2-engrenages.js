// Sceau II — Les Engrenages (★★)
// Relier la manivelle au verrou en remplissant quatre axes avec les pièces de la
// réserve, pour que le verrou tourne dans le bon sens et à la bonne vitesse.
// Ce qu'il faut comprendre :
//  - deux roues dentées qui s'engrènent tournent en sens inverse ;
//  - une poulie, reliée par courroie, garde le sens ;
//  - une roue simple ne change pas la vitesse finale (roue folle) : seules les
//    roues doubles, et leur sens de montage, la changent.
(function () {
  'use strict';
  const { el, svg } = Sceaux;

  const TAILLES = [8, 12, 16, 24, 32];
  const NB_AXES = 4;
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);

  // Une pièce montée : { type, a (entrée), b (sortie) }
  function entreeSortie(p, retourne) {
    return p.type === 'double' && retourne ? { e: p.b, s: p.a } : { e: p.a, s: p.b };
  }
  const inverse = (p) => p.type !== 'poulie';

  // Vitesse (fraction) et sens de chaque élément : manivelle, axes, verrou.
  function calculer(C, L, montage) {
    let num = 1, den = 1, sens = 1, sortie = C;
    const res = [{ num, den, sens }];
    for (const m of montage) {
      if (!m) return { res, casse: true };
      const { e, s } = entreeSortie(m.piece, m.retourne);
      num *= sortie; den *= e;
      if (inverse(m.piece)) sens = -sens;
      const g = pgcd(num, den); num /= g; den /= g;
      res.push({ num, den, sens });
      sortie = s;
    }
    num *= sortie; den *= L; sens = -sens;
    const g = pgcd(num, den); num /= g; den /= g;
    res.push({ num, den, sens });
    return { res, casse: false };
  }

  function nouvellePiece(h, type) {
    if (type === 'double') {
      const [a, b] = h.melanger(TAILLES).slice(0, 2);
      return { type, a, b };
    }
    const t = h.choisir(TAILLES);
    return { type, a: t, b: t };
  }

  function generer(h) {
    for (;;) {
      const C = h.choisir([12, 16, 24]);
      const L = h.choisir([8, 12, 16, 24]);
      const types = h.melanger(['double', 'poulie', 'roue', h.choisir(['double', 'roue', 'poulie'])]);
      const solution = types.map((t) => nouvellePiece(h, t));
      const { res } = calculer(C, L, solution.map((piece) => ({ piece, retourne: false })));
      const f = res[res.length - 1];
      if (f.num === f.den || f.num > 6 || f.den > 6) continue;
      // Interdit que la manivelle et le verrou suffisent (des roues simples feraient l'affaire).
      if (C * f.den === L * f.num) continue;
      const leurres = [nouvellePiece(h, 'double'), nouvellePiece(h, h.choisir(['roue', 'poulie'])), nouvellePiece(h, h.choisir(['double', 'roue', 'poulie']))];
      // Les roues doubles de la réserve sont présentées dans un sens au hasard.
      const tous = h.melanger(solution.concat(leurres));
      const retournees = tous.map((p) => p.type === 'double' && h.reel() < 0.5);
      const reserve = tous.map((p, i) => (retournees[i] ? { type: p.type, a: p.b, b: p.a } : p));
      // Où trouver chaque pièce de la solution dans la réserve, et faut-il la retourner.
      const soluce = solution.map((p) => { const i = tous.indexOf(p); return { index: i, retourner: retournees[i] }; });
      return { C, L, cible: f, reserve, soluce };
    }
  }

  // ---------- Dessin ----------
  const rayon = (t) => 12 + t * 0.95;
  function roueDentee(t, r, couleur) {
    const pts = [];
    const ri = r - 6;
    for (let i = 0; i < t; i++) {
      const a0 = (i / t) * 2 * Math.PI, pas = (2 * Math.PI) / t;
      [[ri, 0], [r, 0.2], [r, 0.5], [ri, 0.7]].forEach(([rr, f]) => {
        const a = a0 + f * pas;
        pts.push((rr * Math.cos(a)).toFixed(1) + ',' + (rr * Math.sin(a)).toFixed(1));
      });
    }
    return svg('g', {},
      svg('polygon', { points: pts.join(' '), fill: couleur, stroke: '#1a1511', 'stroke-width': 1.5 }),
      svg('circle', { r: ri * 0.55, fill: 'none', stroke: '#1a1511', 'stroke-width': 1.2, opacity: 0.6 }),
      svg('line', { x1: 0, y1: -ri + 3, x2: 0, y2: ri * 0.3, stroke: '#1a1511', 'stroke-width': 2, opacity: 0.55 }));
  }
  function poulie(t) {
    const r = rayon(t) - 4;
    return svg('g', {},
      svg('circle', { r, fill: '#8a7456', stroke: '#1a1511', 'stroke-width': 1.5 }),
      svg('circle', { r: r - 5, fill: 'none', stroke: '#3d3226', 'stroke-width': 3 }),
      svg('line', { x1: 0, y1: -r + 6, x2: 0, y2: r * 0.3, stroke: '#1a1511', 'stroke-width': 2, opacity: 0.55 }));
  }
  function dessinPiece(p, retourne) {
    if (p.type === 'poulie') return poulie(p.a);
    if (p.type === 'roue') return roueDentee(p.a, rayon(p.a), '#b48a4a');
    const { e, s } = entreeSortie(p, retourne);
    const [grand, petit] = e >= s ? [[e, '#b48a4a'], [s, '#8fa3ad']] : [[s, '#8fa3ad'], [e, '#b48a4a']];
    return svg('g', {}, roueDentee(grand[0], rayon(grand[0]), grand[1]), roueDentee(petit[0], rayon(petit[0]) * 0.62, petit[1]));
  }
  // Rayon dessiné de la roue de sortie d'une pièce montée (pour tendre une courroie).
  function rayonSortie(m) {
    const { e, s } = entreeSortie(m.piece, m.retourne);
    if (m.piece.type === 'poulie') return rayon(s) - 4;
    return m.piece.type === 'double' && s < e ? rayon(s) * 0.62 : rayon(s);
  }
  function libelle(p, retourne) {
    if (p.type === 'roue') return `Roue ${p.a}`;
    if (p.type === 'poulie') return `Poulie ${p.a}`;
    const { e, s } = entreeSortie(p, retourne);
    return `Double ${e} › ${s}`;
  }
  const fraction = (n) => (n === 1 ? 'un tour' : `${n} tours`);

  function monter(zone, ctx) {
    const h = ctx.hasard;
    const { C, L, cible, reserve, soluce } = generer(h);
    const montage = new Array(NB_AXES).fill(null); // { index, piece, retourne }
    let choixReserve = null;
    let choixAxe = null;
    let anime = false;

    // Horizontal sur ordinateur, vertical sur téléphone (étiquettes à droite des roues).
    const etroit = window.matchMedia('(max-width: 560px)');
    const disposition = () => etroit.matches
      ? { W: 340, HT: 600, c: (i) => ({ x: 70, y: 62 + i * 96 }), et: (i) => ({ x: 140, y: 58 + i * 96, a: 'start' }), zc: (i) => ({ x: 0, y: 14 + i * 96, w: 340, h: 96 }), dx: 1, dy: 0 }
      : { W: 600, HT: 190, c: (i) => ({ x: 50 + i * 100, y: 92 }), et: (i) => ({ x: 50 + i * 100, y: 166, a: 'middle' }), zc: (i) => ({ x: i * 100, y: 0, w: 100, h: 190 }), dx: 0, dy: 1 };
    const scene = svg('svg', { class: 'mecanisme', role: 'img', 'aria-label': 'Mécanisme à engrenages' });
    const rotors = []; // groupe tournant de chaque élément (0 = manivelle, 1..4 = axes, 5 = verrou)
    etroit.addEventListener('change', () => { if (scene.isConnected && !anime) dessiner(); });

    function dessiner() {
      const D = disposition();
      scene.setAttribute('viewBox', `0 0 ${D.W} ${D.HT}`);
      scene.replaceChildren();
      rotors.length = 0;
      scene.append(svg('rect', { x: 0, y: 0, width: D.W, height: D.HT, rx: 10, fill: '#17130f' }));
      const a = D.c(0), b = D.c(5);
      scene.append(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#2e261d', 'stroke-width': 6 }));
      // courroies
      montage.forEach((m, i) => {
        if (!m || m.piece.type !== 'poulie') return;
        const rp = i === 0 ? rayon(C) : montage[i - 1] ? rayonSortie(montage[i - 1]) : null;
        if (rp === null) return;
        const r = rayon(m.piece.a) - 4;
        const p = D.c(i), q = D.c(i + 1);
        [-1, 1].forEach((s) => scene.append(svg('line', {
          x1: p.x + s * rp * D.dx, y1: p.y + s * rp * D.dy, x2: q.x + s * r * D.dx, y2: q.y + s * r * D.dy,
          stroke: '#5a4632', 'stroke-width': 4, 'stroke-linecap': 'round'
        })));
      });
      const element = (k, contenu, texte, sousTexte, cliquable, i) => {
        const { x, y } = D.c(k);
        const tour = svg('g', { class: 'rotor' }, contenu);
        rotors.push(tour);
        const g = svg('g', { transform: `translate(${x},${y})` }, tour);
        g.append(svg('circle', { r: 4, fill: '#1a1511' }));
        scene.append(g);
        const e = D.et(k);
        scene.append(svg('text', { x: e.x, y: e.y, 'text-anchor': e.a, class: 'etiquette', text: texte }));
        if (sousTexte) scene.append(svg('text', { x: e.x, y: e.y + 20, 'text-anchor': e.a, class: 'etiquette douce', text: sousTexte }));
        if (cliquable) {
          const z = D.zc(k);
          const zoneClic = svg('rect', {
            x: z.x, y: z.y, width: z.w, height: z.h, fill: 'transparent', class: 'zone-axe' + (choixAxe === i ? ' choisi' : ''),
            tabindex: 0, role: 'button', 'aria-label': `Axe ${i + 1}`
          });
          zoneClic.addEventListener('click', () => cliquerAxe(i));
          zoneClic.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cliquerAxe(i); } });
          scene.append(zoneClic);
        }
      };
      // manivelle
      const man = svg('g', {}, roueDentee(C, rayon(C), '#b48a4a'),
        svg('line', { x1: 0, y1: 0, x2: 0, y2: -rayon(C) - 10, stroke: '#e8c275', 'stroke-width': 5, 'stroke-linecap': 'round' }),
        svg('circle', { cx: 0, cy: -rayon(C) - 12, r: 6, fill: '#e8c275' }));
      element(0, man, 'Manivelle', `${C} dents`, false);
      for (let i = 0; i < NB_AXES; i++) {
        const m = montage[i];
        if (m) element(i + 1, dessinPiece(m.piece, m.retourne), libelle(m.piece, m.retourne), m.piece.type === 'double' ? 'entrée › sortie' : '', true, i);
        else element(i + 1, svg('circle', { r: 30, fill: 'none', stroke: '#4a3e30', 'stroke-width': 2, 'stroke-dasharray': '6 5' }), `Axe ${i + 1}`, 'vide', true, i);
      }
      const verrou = svg('g', {}, roueDentee(L, rayon(L), '#8fa3ad'),
        svg('rect', { x: -7, y: -rayon(L) - 14, width: 14, height: 16, rx: 3, fill: '#c0513f' }));
      element(5, verrou, 'Verrou', `${L} dents`, false);
    }

    // ---------- Réserve ----------
    const zoneReserve = el('div', { class: 'reserve' });
    function dessinerReserve() {
      zoneReserve.replaceChildren();
      reserve.forEach((p, idx) => {
        const utilisee = montage.some((m) => m && m.index === idx);
        const vignette = svg('svg', { viewBox: '-50 -50 100 100', width: 44, height: 44, 'aria-hidden': 'true' }, dessinPiece(p, false));
        zoneReserve.append(el('button', {
          type: 'button', class: 'piece' + (choixReserve === idx ? ' choisie' : ''), disabled: utilisee || anime,
          onclick: () => cliquerReserve(idx)
        }, vignette, el('span', { text: libelle(p, false) })));
      });
    }

    const actionsAxe = el('div', { class: 'actions actions-axe' });
    function dessinerActions() {
      actionsAxe.replaceChildren();
      if (choixAxe === null || !montage[choixAxe]) return;
      const m = montage[choixAxe];
      if (m.piece.type === 'double') actionsAxe.append(el('button', { type: 'button', class: 'discret', text: '⇄ Retourner la roue double', onclick: () => { m.retourne = !m.retourne; tout(); } }));
      actionsAxe.append(el('button', { type: 'button', class: 'discret', text: '✕ Retirer', onclick: () => { montage[choixAxe] = null; choixAxe = null; tout(); } }));
    }

    function tout() { dessiner(); dessinerReserve(); dessinerActions(); }

    function cliquerReserve(idx) {
      if (anime) return;
      if (choixAxe !== null && !montage[choixAxe]) { poser(choixAxe, idx); return; }
      choixReserve = choixReserve === idx ? null : idx;
      choixAxe = null;
      tout();
    }
    function cliquerAxe(i) {
      if (anime) return;
      if (choixReserve !== null) { poser(i, choixReserve); return; }
      choixAxe = choixAxe === i ? null : i;
      tout();
    }
    function poser(i, idx) {
      montage[i] = { index: idx, piece: reserve[idx], retourne: false };
      choixReserve = null;
      choixAxe = i;
      msg.textContent = '';
      tout();
    }

    // ---------- La manivelle ----------
    const msg = el('p', { class: 'message' });
    const bouton = el('button', {
      type: 'button', text: 'Tourner la manivelle',
      onclick: () => {
        if (anime) return;
        const calc = calculer(C, L, montage);
        const tours = cible.den; // tours de manivelle demandés
        const duree = Math.min(900 * tours + 600, 5000);
        anime = true; choixAxe = null; choixReserve = null; tout();
        bouton.disabled = true;
        const t0 = performance.now();
        const n = calc.res.length;
        const final = calc.casse ? null : calc.res[n - 1];
        const pas = (t) => {
          const k = Math.min((t - t0) / duree, 1);
          const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          calc.res.forEach((r, i) => {
            const deg = ease * tours * 360 * r.sens * (r.num / r.den);
            rotors[i].setAttribute('transform', `rotate(${deg.toFixed(2)})`);
          });
          if (final) msg.textContent = `Verrou : ${(ease * tours * final.num / final.den).toFixed(1)} tour(s) vers la ${final.sens > 0 ? 'droite' : 'gauche'}`;
          if (k < 1) { requestAnimationFrame(pas); return; }
          anime = false;
          conclure(calc);
        };
        msg.className = 'message';
        if (document.hidden) pas(t0 + duree); // onglet en arrière-plan : résultat immédiat
        else requestAnimationFrame(pas);
      }
    });

    function conclure(calc) {
      bouton.disabled = false;
      dessinerReserve();
      if (calc.casse) {
        msg.className = 'message erreur';
        msg.textContent = 'La chaîne est rompue : un axe est vide, le mouvement se perd.';
        return;
      }
      const f = calc.res[calc.res.length - 1];
      if (f.num === cible.num && f.den === cible.den && f.sens === cible.sens) {
        msg.className = 'message ok';
        msg.textContent = 'Le pêne glisse hors de la gâche.';
        setTimeout(ctx.reussir, 900);
        return;
      }
      msg.className = 'message erreur';
      msg.textContent = `Le verrou a fait ${fractionTxt(f)} vers la ${f.sens > 0 ? 'droite' : 'gauche'}. Il se rebloque.`;
      ctx.secouer(scene);
      ctx.penalite(bouton, 3, 'Le mécanisme se réarme');
    }
    const fractionTxt = (f) => {
      const v = (cible.den * f.num) / f.den;
      return Number.isInteger(v) ? fraction(v) : `${String(+v.toFixed(2)).replace('.', ',')} tours`;
    };

    const sensCible = cible.sens > 0 ? 'vers la droite' : 'vers la gauche';
    zone.append(
      el('p', { class: 'consigne', text: 'Derrière une trappe, un mécanisme nain. Quatre axes vides séparent la manivelle du verrou.' }),
      el('p', { class: 'devise' },
        '« Pour ', el('strong', { text: fraction(cible.den) }), ' de manivelle vers la droite, le verrou fera ',
        el('strong', { text: fraction(cible.num) + ' ' + sensCible }), '. Ni plus, ni moins. »'),
      scene,
      actionsAxe,
      el('h3', { class: 'centre', text: 'Réserve' }),
      el('p', { class: 'doux centre petit', text: 'Touche une pièce, puis un axe. Touche une pièce posée pour la retourner ou la retirer.' }),
      zoneReserve,
      el('details', { class: 'regles panneau' },
        el('summary', { text: 'Ce que dit la plaque du mécanisme' }),
        el('ul', {},
          el('li', { text: 'La manivelle tourne vers la droite.' }),
          el('li', { text: 'Deux roues dentées qui se touchent tournent en sens inverse.' }),
          el('li', { text: 'Une poulie est entraînée par une courroie : elle tourne dans le même sens que la pièce qui la précède.' }),
          el('li', { text: 'Plus une roue a peu de dents, plus elle tourne vite.' }),
          el('li', { text: 'Une roue double porte deux roues sur le même axe : elle reçoit le mouvement par son entrée et le transmet par sa sortie.' }),
          el('li', { text: 'Le verrou est une roue dentée : il tourne en sens inverse de la dernière pièce.' })
        )),
      msg,
      el('div', { class: 'actions' }, bouton)
    );
    tout();

    return { solution: () => expliquer(C, L, cible, reserve, soluce) };
  }

  // Solution trouvée par le générateur, et le raisonnement qui y mène.
  // (D'autres montages peuvent marcher : le jeu accepte tout montage qui donne le bon résultat.)
  function expliquer(C, L, cible, reserve, soluce) {
    const frac = (n, d) => { const g = pgcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; };
    const montees = soluce.map(({ index, retourner }) => ({ piece: reserve[index], retourne: retourner }));
    const reponse = montees.map((m, i) => {
      const dansReserve = libelle(m.piece, false);
      return m.retourne
        ? `Axe ${i + 1} : ${dansReserve}, à retourner (${libelle(m.piece, true)})`
        : `Axe ${i + 1} : ${dansReserve}`;
    });

    const doubles = montees.filter((m) => m.piece.type === 'double').map((m) => entreeSortie(m.piece, m.retourne));
    const nbInverse = montees.filter((m) => inverse(m.piece)).length;
    const inversions = nbInverse + 1;
    let num = C, den = L;
    doubles.forEach(({ e, s }) => { num *= s; den *= e; });

    const pourquoi = [
      `La vitesse. La manivelle a ${C} dents, le verrou ${L} : seuls, ils donneraient ${frac(C, L)} tour de verrou par tour de manivelle.`,
      'Une roue simple ou une poulie ne change pas la vitesse finale : ce qu’elle reçoit d’un côté, elle le rend de l’autre (roue folle). Seules les roues doubles la changent, en multipliant par sortie ÷ entrée.',
      ...doubles.map(({ e, s }) => `Double ${e} › ${s} : × ${frac(s, e)}.`),
      `Total : ${[frac(C, L), ...doubles.map(({ e, s }) => frac(s, e))].join(' × ')} = ${frac(num, den)}, soit ${fraction(cible.num)} de verrou pour ${fraction(cible.den)} de manivelle.`,
      `Le sens. Chaque roue dentée (simple ou double) inverse le sens ; une poulie le garde ; le verrou, roue dentée, l’inverse aussi. Ici : ${nbInverse} pièce${nbInverse > 1 ? 's' : ''} dentée${nbInverse > 1 ? 's' : ''} + le verrou = ${inversions} inversions, un nombre ${inversions % 2 ? 'impair : le verrou tourne à l’inverse de la manivelle, vers la gauche' : 'pair : le verrou tourne comme la manivelle, vers la droite'}.`,
      'D’autres montages peuvent marcher : le jeu accepte tout montage qui donne la bonne vitesse et le bon sens.'
    ];
    return { reponse, pourquoi };
  }

  Sceaux.enregistrer({ numero: 2, monter });
})();
