// Les Profondeurs — Les Ponts de Pierre (★★★★)
// Hashi : des piliers numérotés au-dessus d'un gouffre. Il faut les relier par des ponts droits
// (horizontaux ou verticaux), au plus 2 entre deux piliers, sans croisement, pour que chaque
// pilier porte exactement son nombre de ponts et que tout soit relié en un seul ensemble.
// La carte est construite depuis une solution, puis un solveur vérifie qu'elle est unique.
(function () {
  'use strict';
  const { el, svg } = Sceaux;
  const T = 10;                      // plan de 10 × 10
  const LETTRES = 'ABCDEFGHIJ';
  const nomPilier = (p) => `${LETTRES[p.c]}${p.r + 1}`;

  // Arêtes possibles : chaque pilier voit le plus proche dans chaque direction.
  function aretesPossibles(piliers) {
    const ou = new Map(piliers.map((p, i) => [p.r * T + p.c, i]));
    const aretes = [];
    piliers.forEach((p, i) => {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        for (let k = 1; ; k++) {
          const r = p.r + dr * k, c = p.c + dc * k;
          if (r >= T || c >= T) break;
          const j = ou.get(r * T + c);
          if (j !== undefined) { aretes.push({ a: i, b: j, horiz: dr === 0 }); break; }
        }
      }
    });
    return aretes;
  }
  const croisent = (e, f, P) => {
    if (e.horiz === f.horiz) return false;
    const [h, v] = e.horiz ? [e, f] : [f, e];
    const hr = P[h.a].r, hc1 = Math.min(P[h.a].c, P[h.b].c), hc2 = Math.max(P[h.a].c, P[h.b].c);
    const vc = P[v.a].c, vr1 = Math.min(P[v.a].r, P[v.b].r), vr2 = Math.max(P[v.a].r, P[v.b].r);
    return vc > hc1 && vc < hc2 && hr > vr1 && hr < vr2;
  };
  function connexe(nb, aretes, x) {
    const vu = new Set([0]), pile = [0];
    while (pile.length) { const i = pile.pop(); aretes.forEach((e, k) => { if (!x[k]) return; const j = e.a === i ? e.b : e.b === i ? e.a : -1; if (j >= 0 && !vu.has(j)) { vu.add(j); pile.push(j); } }); }
    return vu.size === nb;
  }

  // Compte les solutions (jusqu'à `max`) par retour arrière avec bornes sur chaque pilier.
  function compter(piliers, aretes, max) {
    const nb = piliers.length, x = new Array(aretes.length).fill(0);
    const incid = piliers.map((p, i) => aretes.map((e, k) => (e.a === i || e.b === i ? k : -1)).filter((k) => k >= 0));
    const conflits = aretes.map((e, k) => aretes.map((f, l) => (croisent(e, f, piliers) ? l : -1)).filter((l) => l >= 0 && l !== k));
    let n = 0;
    const possible = (k) => {
      for (const i of [aretes[k].a, aretes[k].b]) {
        let somme = 0, capa = 0;
        for (const l of incid[i]) { if (l <= k) somme += x[l]; else if (!conflits[l].some((m) => m <= k && x[m])) capa += 2; }
        if (somme > piliers[i].n || somme + capa < piliers[i].n) return false;
      }
      return true;
    };
    (function rec(k) {
      if (n >= max) return;
      if (k === aretes.length) { if (connexe(nb, aretes, x)) n++; return; }
      for (const v of [0, 1, 2]) {
        if (v && conflits[k].some((m) => m < k && x[m])) break;
        x[k] = v;
        if (possible(k)) rec(k + 1);
        if (n >= max) break;
      }
      x[k] = 0;
    })(0);
    return n;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      const occupe = new Map(); // case → 'P' (pilier) ou 'H'/'V' (pont)
      const piliers = [{ r: h.entier(0, T - 1), c: h.entier(0, T - 1), n: 0 }];
      occupe.set(piliers[0].r * T + piliers[0].c, 'P');
      const ponts = [];
      const cible = h.entier(22, 28);
      for (let tour = 0; piliers.length < cible && tour < 1500; tour++) {
        const a = h.choisir(piliers);
        const [dr, dc] = h.choisir([[0, 1], [0, -1], [1, 0], [-1, 0]]);
        const d = h.entier(2, 5);
        const r = a.r + dr * d, c = a.c + dc * d;
        if (r < 0 || c < 0 || r >= T || c >= T || occupe.has(r * T + c)) continue;
        let libre = true;
        for (let k = 1; k < d && libre; k++) if (occupe.has((a.r + dr * k) * T + a.c + dc * k)) libre = false;
        if (!libre) continue;
        if ([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([ar, ac]) => occupe.get((r + ar) * T + c + ac) === 'P' && !(r + ar === a.r && c + ac === a.c))) continue;
        const b = { r, c, n: 0 };
        piliers.push(b); occupe.set(r * T + c, 'P');
        for (let k = 1; k < d; k++) occupe.set((a.r + dr * k) * T + a.c + dc * k, dr ? 'V' : 'H');
        const n = h.reel() < 0.45 ? 2 : 1;
        a.n += n; b.n += n;
        ponts.push([a, b, n]);
      }
      if (piliers.length < 20) continue;
      // Des boucles : ponts en plus entre piliers qui se voient, si le passage est libre.
      // Sans elles, la carte est un arbre et se déduit trop facilement de proche en proche.
      const idx = new Map(piliers.map((p, i) => [p, i]));
      const dejaRelies = new Set(ponts.map(([a, b]) => [idx.get(a), idx.get(b)].sort((u, v) => u - v).join('-')));
      for (const e of h.melanger(aretesPossibles(piliers))) {
        if (dejaRelies.has([e.a, e.b].sort((u, v) => u - v).join('-')) || h.reel() > 0.4) continue;
        const a = piliers[e.a], b = piliers[e.b];
        const cases = [];
        if (e.horiz) for (let c = Math.min(a.c, b.c) + 1; c < Math.max(a.c, b.c); c++) cases.push(a.r * T + c);
        else for (let r = Math.min(a.r, b.r) + 1; r < Math.max(a.r, b.r); r++) cases.push(r * T + a.c);
        if (cases.some((k) => occupe.has(k))) continue;
        cases.forEach((k) => occupe.set(k, e.horiz ? 'H' : 'V'));
        const n = h.reel() < 0.4 ? 2 : 1;
        a.n += n; b.n += n;
        ponts.push([a, b, n]);
      }
      const aretes = aretesPossibles(piliers);
      if (facile(piliers, aretes)) continue;           // se résout avec les règles simples : trop facile
      if (compter(piliers, aretes, 2) !== 1) continue; // une seule solution
      return { piliers, aretes };
    }
  }

  // Solveur « naïf » : bornes sur chaque pilier, croisements, deux « 1 » jamais reliés, deux « 2 »
  // jamais reliés par un double pont. S'il suffit à tout résoudre, la carte est trop facile.
  function facile(piliers, aretes) {
    const lo = aretes.map(() => 0), hi = aretes.map((e) => {
      const na = piliers[e.a].n, nb = piliers[e.b].n;
      if (na === 1 && nb === 1) return 0;
      if (na === 2 && nb === 2) return 1;
      return Math.min(2, na, nb);
    });
    const incid = piliers.map((p, i) => aretes.map((e, k) => (e.a === i || e.b === i ? k : -1)).filter((k) => k >= 0));
    for (let change = true; change;) {
      change = false;
      piliers.forEach((p, i) => {
        const sLo = incid[i].reduce((s, k) => s + lo[k], 0), sHi = incid[i].reduce((s, k) => s + hi[k], 0);
        for (const k of incid[i]) {
          const nLo = Math.max(lo[k], p.n - (sHi - hi[k])), nHi = Math.min(hi[k], p.n - (sLo - lo[k]));
          if (nLo !== lo[k] || nHi !== hi[k]) { lo[k] = nLo; hi[k] = nHi; change = true; }
        }
      });
      aretes.forEach((e, k) => {
        if (lo[k] > 0) aretes.forEach((f, l) => { if (hi[l] > 0 && croisent(e, f, piliers)) { hi[l] = 0; change = true; } });
      });
    }
    return aretes.every((e, k) => lo[k] === hi[k]);
  }

  function monter(zone, ctx) {
    const { piliers, aretes } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    const x = Array.isArray(garde.x) && garde.x.length === aretes.length ? garde.x : new Array(aretes.length).fill(0);
    let choisi = null, fini = false;
    const memoriser = () => ctx.memoire.ecrire({ x });
    const degre = (i) => aretes.reduce((s, e, k) => s + (e.a === i || e.b === i ? x[k] : 0), 0);
    const P = (i) => ({ x: piliers[i].c * 100 + 50, y: piliers[i].r * 100 + 50 });

    const plan = svg('svg', { viewBox: '0 0 1000 1040', class: 'plan-ponts', role: 'img', 'aria-label': 'Plan des piliers' });
    const msg = el('p', { class: 'message' });

    function dessiner() {
      plan.replaceChildren(svg('rect', { x: 0, y: 0, width: 1000, height: 1040, fill: '#0f0c0a', rx: 14 }));
      for (let c = 0; c < T; c++) plan.append(svg('text', { x: c * 100 + 50, y: 1030, class: 'coord', 'text-anchor': 'middle', text: LETTRES[c] }));
      aretes.forEach((e, k) => {
        const a = P(e.a), b = P(e.b);
        if (x[k]) {
          const decal = x[k] === 2 ? 9 : 0;
          const [ox, oy] = e.horiz ? [0, decal] : [decal, 0];
          plan.append(svg('line', { x1: a.x - ox, y1: a.y - oy, x2: b.x - ox, y2: b.y - oy, class: 'pont' }));
          if (x[k] === 2) plan.append(svg('line', { x1: a.x + ox, y1: a.y + oy, x2: b.x + ox, y2: b.y + oy, class: 'pont' }));
        }
        const zoneClic = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'zone-pont' });
        zoneClic.addEventListener('click', () => basculer(k));
        plan.append(zoneClic);
      });
      piliers.forEach((p, i) => {
        const d = degre(i);
        const g = svg('g', { class: 'pilier' + (d === p.n ? ' complet' : d > p.n ? ' trop' : '') + (choisi === i ? ' choisi' : ''), tabindex: 0, role: 'button', 'aria-label': `Pilier ${nomPilier(p)}, ${p.n} ponts, ${d} posés` },
          svg('circle', { cx: P(i).x, cy: P(i).y, r: 41 }),
          svg('text', { x: P(i).x, y: P(i).y + 15, 'text-anchor': 'middle', text: String(p.n) }));
        g.addEventListener('click', () => toucherPilier(i));
        plan.append(g);
      });
    }

    function basculer(k) {
      if (fini) return;
      const e = aretes[k];
      if (!x[k] && aretes.some((f, l) => x[l] && croisent(e, f, piliers))) {
        msg.className = 'message erreur'; msg.textContent = 'Impossible : ce pont croiserait un pont déjà posé.'; return;
      }
      x[k] = (x[k] + 1) % 3;
      choisi = null; msg.className = 'message'; msg.textContent = '';
      memoriser(); dessiner(); verifier();
    }
    function toucherPilier(i) {
      if (fini) return;
      if (choisi === null || choisi === i) { choisi = choisi === i ? null : i; dessiner(); return; }
      const k = aretes.findIndex((e) => (e.a === choisi && e.b === i) || (e.a === i && e.b === choisi));
      if (k < 0) { choisi = i; msg.className = 'message'; msg.textContent = 'Ces deux piliers ne se voient pas (pas alignés, ou un autre pilier est entre eux).'; dessiner(); return; }
      basculer(k);
    }
    function verifier() {
      if (piliers.every((p, i) => degre(i) === p.n) && connexe(piliers.length, aretes, x)) {
        fini = true;
        msg.className = 'message ok'; msg.textContent = 'Le dernier pont se pose : tous les piliers tiennent ensemble au-dessus du gouffre.';
        setTimeout(ctx.reussir, 1300);
      } else if (piliers.every((p, i) => degre(i) === p.n)) {
        msg.className = 'message erreur'; msg.textContent = 'Chaque pilier a son compte… mais ils forment plusieurs îlots séparés : tout doit être relié.';
      }
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Des piliers se dressent au-dessus d’un gouffre. Le nombre sur chaque pilier indique combien de ponts il doit porter, au total.' }),
        el('p', { text: 'Les ponts sont droits (horizontaux ou verticaux) et relient deux piliers qui se voient. Entre deux mêmes piliers, il y a au plus 2 ponts. Les ponts ne se croisent jamais. À la fin, tous les piliers doivent former un seul ensemble relié.' }),
        el('p', { text: 'Touche un pilier puis un autre pour poser un pont ; recommence pour le doubler, puis pour l’enlever. Tu peux aussi toucher directement un pont. Un pilier devient doré quand il a son compte, rouge s’il en a trop. Il n’existe qu’une seule solution.' })),
      el('div', { class: 'cadre-ponts' }, plan),
      msg,
      el('div', { class: 'actions' }, el('button', { type: 'button', class: 'discret', text: '✕ Retirer tous les ponts', onclick: () => { if (fini || !window.confirm('Retirer tous les ponts ?')) return; x.fill(0); memoriser(); dessiner(); } })));
    dessiner();
    verifier();

    return {
      solution: () => {
        const sol = new Array(aretes.length).fill(0);
        // Retrouve l'unique solution avec le même solveur.
        (function rec(k) {
          if (k === aretes.length) return connexe(piliers.length, aretes, sol);
          for (const v of [0, 1, 2]) {
            if (v && aretes.some((f, l) => l < k && sol[l] && croisent(aretes[k], f, piliers))) break;
            sol[k] = v;
            const ok = [aretes[k].a, aretes[k].b].every((i) => {
              let s = 0, capa = 0;
              aretes.forEach((e, l) => { if (e.a === i || e.b === i) { if (l <= k) s += sol[l]; else capa += 2; } });
              return s <= piliers[i].n && s + capa >= piliers[i].n;
            });
            if (ok && rec(k + 1)) return true;
          }
          sol[k] = 0;
          return false;
        })(0);
        return {
          reponse: ['Colonnes A à J (de gauche à droite), lignes 1 à 10 (de haut en bas).',
            ...aretes.map((e, k) => (sol[k] ? `${nomPilier(piliers[e.a])} — ${nomPilier(piliers[e.b])} : ${sol[k]} pont${sol[k] > 1 ? 's' : ''}` : null)).filter(Boolean)],
          pourquoi: [
            'Solution unique, vérifiée en essayant toutes les combinaisons de ponts possibles.',
            'Pour démarrer : un pilier qui ne voit qu’un seul voisin lui envoie tous ses ponts. Un « 8 » a forcément 2 ponts dans chacune des 4 directions ; un « 6 » qui n’a que 3 voisins aussi.',
            'Un pilier à 1 ne peut pas se lier à un autre pilier à 1 (ils resteraient isolés du reste), et deux « 2 » ne peuvent pas se relier par un double pont pour la même raison.',
            'Ensuite, les croisements interdits et l’obligation de tout relier éliminent les dernières possibilités.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'ponts', nom: 'Les Ponts de Pierre', icone: '⌗', etoiles: 4, resume: 'Logique', monter });
})();
