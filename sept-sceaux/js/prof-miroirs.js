// Les Profondeurs — Les Miroirs du Chant (★★★★★)
// Un cristal chantant lance un rayon. On fait basculer des miroirs (/ ou \) pour qu'il frappe tous
// les cristaux-cibles sans toucher un cristal fêlé (piège). Des prismes fixes dédoublent le rayon,
// des miroirs scellés ne bougent pas, les murs l'arrêtent. Toutes les combinaisons de miroirs sont
// essayées : une seule allume toutes les cibles sans toucher de piège.
(function () {
  'use strict';
  const { el } = Sceaux;
  const T = 9;
  const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1]; // haut, droite, bas, gauche
  const OBLIQUE = [1, 0, 3, 2]; // « / » : haut ↔ droite, bas ↔ gauche
  const CONTRE = [3, 2, 1, 0];  // « \ » : haut ↔ gauche, bas ↔ droite

  // Lance le rayon. `pos` : index → orientation (0 = /, 1 = \) des miroirs mobiles.
  function lancer(salle, pos, arretPiege) {
    const { cases, source } = salle;
    const vus = new Set(), allume = new Set(), segments = [];
    const touches = new Set();
    let piege = -1;
    const pile = [[source.i, source.d]];
    while (pile.length) {
      let [i, d] = pile.pop();
      for (;;) {
        const r = Math.floor(i / T) + DR[d], c = (i % T) + DC[d];
        if (r < 0 || c < 0 || r >= T || c >= T) { segments.push([i, d, 'bord']); break; }
        const j = r * T + c, k = j * 4 + d;
        if (vus.has(k)) { segments.push([i, d, j]); break; }
        vus.add(k);
        segments.push([i, d, j]);
        const t = cases[j];
        if (t === 'mur' || t === 'source') { segments[segments.length - 1][2] = 'mur'; break; }
        if (t === 'piege') { piege = j; if (arretPiege) return { allume, piege, touches, segments }; break; }
        if (t === 'cible') allume.add(j);
        if (t === 'mobile') { touches.add(j); d = (pos[j] ? CONTRE : OBLIQUE)[d]; }
        else if (t === '/') d = OBLIQUE[d];
        else if (t === '\\') d = CONTRE[d];
        else if (t === 'prisme') { touches.add(j); pile.push([j, (d + 1) % 4]); d = (d + 3) % 4; }
        i = j;
      }
    }
    return { allume, piege, touches, segments };
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      const cases = new Array(T * T).fill('');
      const libres = () => cases.map((t, i) => (t ? -1 : i)).filter((i) => i >= 0);
      // Source sur un bord, tournée vers l'intérieur.
      const cote = h.entier(0, 3), k = h.entier(1, T - 2);
      const si = [k, k * T + T - 1, (T - 1) * T + k, k * T][cote];
      const source = { i: si, d: (cote + 2) % 4 };
      cases[si] = 'source';
      const poser = (type, n) => { const l = h.melanger(libres()); for (let a = 0; a < n; a++) cases[l[a]] = type; };
      poser('mur', h.entier(6, 9)); poser('/', 1); poser('\\', 1);
      // Construction le long du rayon : chaque pièce est posée sur une case que le rayon éclaire déjà,
      // et on la retire si elle prive une pièce précédente du rayon.
      const salle = { cases, source };
      const pos = {};
      const mobiles = [];
      const nbMobiles = h.entier(12, 14);
      let prismes = 0, rate = 0;
      while ((mobiles.length < nbMobiles || prismes < 2) && rate < 60) {
        const r = lancer(salle, pos, false);
        const choix = [...new Set(r.segments.map((x) => x[2]).filter((j) => typeof j === 'number' && !cases[j]))];
        if (!choix.length) break;
        const j = h.choisir(choix);
        const type = prismes < 2 && (mobiles.length >= 3 * (prismes + 1) || h.reel() < 0.15) ? 'prisme' : 'mobile';
        cases[j] = type; if (type === 'mobile') pos[j] = h.entier(0, 1);
        const apres = lancer(salle, pos, false).touches;
        if ([...mobiles, j].some((m) => !apres.has(m)) || (type === 'prisme' ? prismes + 1 : prismes) + mobiles.length + (type === 'mobile' ? 1 : 0) !== apres.size) {
          cases[j] = ''; delete pos[j]; rate++; continue;
        }
        if (type === 'prisme') prismes++; else mobiles.push(j);
      }
      if (mobiles.length < nbMobiles || prismes < 2) continue;
      const res = lancer(salle, pos, false);
      const eclaires = new Set(res.segments.map((s) => s[2]).filter((j) => typeof j === 'number' && !cases[j]));
      const eclairesL = [...eclaires];
      if (eclairesL.length < 12) continue;
      const cibles = h.melanger(eclairesL).slice(0, h.entier(6, 7));
      cibles.forEach((j) => { cases[j] = 'cible'; });
      // Pièges : des cases que la solution évite, mais que d'autres réglages touchent souvent.
      const frequence = new Map();
      for (let a = 0; a < 200; a++) {
        const p = {}; for (const m of mobiles) p[m] = h.entier(0, 1);
        for (const s of lancer(salle, p, false).segments) if (typeof s[2] === 'number' && !cases[s[2]] && !eclaires.has(s[2])) frequence.set(s[2], (frequence.get(s[2]) || 0) + 1);
      }
      const pieges = [...frequence.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map((e) => e[0]);
      if (pieges.length < 4) continue;
      pieges.forEach((j) => { cases[j] = 'piege'; });
      // Unicité : on essaie toutes les combinaisons.
      let n = 0;
      const essaiPos = {};
      for (let masque = 0; masque < (1 << mobiles.length) && n < 2; masque++) {
        mobiles.forEach((m, b) => { essaiPos[m] = (masque >> b) & 1; });
        const r = lancer(salle, essaiPos, true);
        if (r.piege < 0 && r.allume.size === cibles.length) n++;
      }
      if (n !== 1) continue;
      const depart = {}; for (const m of mobiles) depart[m] = h.entier(0, 1);
      if (mobiles.every((m) => depart[m] === pos[m])) depart[mobiles[0]] ^= 1;
      return { salle, mobiles, sol: pos, depart, cibles };
    }
  }

  const SVG = 'http://www.w3.org/2000/svg';
  const centre = (i) => [(i % T) * 10 + 5, Math.floor(i / T) * 10 + 5];

  function monter(zone, ctx) {
    const { salle, mobiles, sol, depart, cibles } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    const pos = {}; for (const m of mobiles) pos[m] = garde[m] === 0 || garde[m] === 1 ? garde[m] : depart[m];
    let fini = false;
    const msg = el('p', { class: 'message' });
    const compteur = el('p', { class: 'centre doux' });
    const grille = el('div', { class: 'grille-miroirs' });
    const boutons = {};
    const glyphes = { mur: '', source: '◈', prisme: '◇', cible: '✧', piege: '✶', '/': '╱', '\\': '╲' };
    salle.cases.forEach((t, i) => {
      if (t === 'mobile') {
        const b = el('button', { type: 'button', class: 'case-miroir mobile', 'aria-label': 'Miroir mobile', onclick: () => basculer(i) });
        boutons[i] = b; grille.append(b);
      } else {
        grille.append(el('div', { class: 'case-miroir' + (t ? ' ' + ({ '/': 'fixe', '\\': 'fixe' }[t] || t) : '') }, t && glyphes[t] ? el('span', { text: glyphes[t] }) : null));
      }
    });
    const rayon = document.createElementNS(SVG, 'svg');
    rayon.setAttribute('viewBox', '0 0 90 90'); rayon.setAttribute('class', 'rayon-miroirs');
    grille.append(rayon);
    const cellules = [...grille.children];

    function dessiner() {
      for (const m of mobiles) { boutons[m].textContent = pos[m] ? '╲' : '╱'; }
      const r = lancer(salle, pos, true);
      rayon.replaceChildren();
      for (const [i, d, j] of r.segments) {
        const [x1, y1] = centre(i);
        let x2, y2;
        if (typeof j === 'number') { [x2, y2] = centre(j); if (salle.cases[j] === 'piege' || j === 'mur') { x2 = (x1 + x2) / 2; y2 = (y1 + y2) / 2; } }
        else { x2 = x1 + DC[d] * 5; y2 = y1 + DR[d] * 5; }
        const l = document.createElementNS(SVG, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        rayon.append(l);
      }
      if (r.piege >= 0) { const [x, y] = centre(r.piege); const c = document.createElementNS(SVG, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 4); c.setAttribute('class', 'eclat-piege'); rayon.append(c); }
      cibles.forEach((j) => cellules[j].classList.toggle('allumee', r.allume.has(j)));
      salle.cases.forEach((t, j) => { if (t === 'piege') cellules[j].classList.toggle('brise', j === r.piege); });
      compteur.textContent = `Cristaux éveillés : ${r.allume.size} / ${cibles.length}`;
      return r;
    }
    function basculer(i) {
      if (fini) return;
      pos[i] ^= 1; ctx.memoire.ecrire(pos);
      const r = dessiner();
      msg.className = 'message'; msg.textContent = '';
      if (r.piege >= 0) { msg.className = 'message erreur'; msg.textContent = 'Le rayon frappe un cristal fêlé : il se brise et absorbe le Chant.'; }
      else if (r.allume.size === cibles.length) {
        fini = true; msg.className = 'message ok';
        msg.textContent = 'Tous les cristaux chantent ensemble : la salle entière résonne.';
        grille.classList.add('complet');
        setTimeout(ctx.reussir, 1500);
      }
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Dans la salle des Miroirs, un cristal chantant ◈ lance un rayon de lumière. Il faut éveiller tous les cristaux ✧ en même temps.' }),
        el('ul', {},
          el('li', { text: 'Touche un miroir mobile (case claire) pour le faire basculer entre ╱ et ╲. Le rayon rebondit dessus à angle droit.' }),
          el('li', { text: 'Les miroirs scellés (cases sombres) ne bougent pas. Les murs arrêtent le rayon.' }),
          el('li', { text: 'Un prisme ◇ dédouble le rayon : il repart des deux côtés, à gauche et à droite de sa course.' }),
          el('li', { text: 'Le rayon traverse les cristaux ✧ qu’il éveille. Mais s’il touche un cristal fêlé ✶, celui-ci se brise et absorbe tout.' }),
          el('li', {}, 'Il faut que ', el('strong', { text: 'tous les cristaux ✧ soient éveillés au même moment, sans toucher aucun cristal fêlé' }), '. Une seule position des miroirs y parvient.')),
        el('p', { text: 'Essais illimités. La position des miroirs est gardée si tu quittes l’épreuve.' })),
      el('div', { class: 'cadre-miroirs' }, grille),
      compteur,
      msg,
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'discret', text: '↺ Remettre les miroirs', onclick: () => { if (fini) return; for (const m of mobiles) pos[m] = depart[m]; ctx.memoire.ecrire(pos); msg.textContent = ''; dessiner(); } })));
    dessiner();

    return {
      solution: () => {
        const lignes = [];
        for (let r = 0; r < T; r++) {
          const l = [];
          for (let c = 0; c < T; c++) { const i = r * T + c; if (salle.cases[i] === 'mobile') l.push(`${c + 1}e case : ${sol[i] ? '╲' : '╱'}`); }
          if (l.length) lignes.push(`Ligne ${r + 1} : ${l.join(', ')}`);
        }
        return {
          reponse: lignes,
          pourquoi: [
            `Les ${mobiles.length} miroirs mobiles, ligne par ligne (cases comptées depuis la gauche). Avec ces positions, le rayon passe par tous les miroirs mobiles et les deux prismes, éveille les ${cibles.length} cristaux et évite tous les cristaux fêlés.`,
            `Les ${2 ** mobiles.length} positions possibles des miroirs ont toutes été essayées : c’est la seule qui réussit.`,
            'Méthode : partir de la source et suivre le rayon miroir après miroir ; se demander d’où le rayon doit arriver sur chaque cristal ✧, et remonter ; les prismes imposent de gérer deux rayons à la fois.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'miroirs', nom: 'Les Miroirs du Chant', icone: '◈', etoiles: 5, resume: 'Rayons et prismes', monter });
})();
