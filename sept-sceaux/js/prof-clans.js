// Les Profondeurs — Le Conseil des Clans (★★★★★)
// Énigme de type « Einstein » : cinq clans siègent côte à côte (sièges 1 à 5, de gauche à
// droite) ; chacun a un nom, un métier, une bannière, un animal emblème et une boisson, tous
// différents. Les indices sont générés depuis la solution, vérifiés par un solveur (solution
// unique), puis élagués : chacun est indispensable. Un peu plus d'indices qu'Einstein
// (et un carnet d'aide), mais pas beaucoup.
(function () {
  'use strict';
  const { el } = Sceaux;
  const N = 5;

  // Chaque catégorie : réserve de valeurs, groupe nominal (« le clan … »), prédicat (« … »).
  const CATEGORIES = [
    { nom: 'Clan', valeurs: ['Barbe-de-Fer', 'Poing-d’Airain', 'Marteau-Noir', 'Pierre-Grise', 'Forge-Ardente', 'Roc-Fendu', 'Cœur-de-Houille', 'Hache-d’Argent'],
      gn: (v) => `le clan ${v}`, pred: (v) => `est le clan ${v}` },
    { nom: 'Métier', valeurs: ['mineurs', 'brasseurs', 'forgerons', 'orfèvres', 'maçons', 'ingénieurs', 'bergers'],
      gn: (v) => `le clan des ${v}`, pred: (v) => `est celui des ${v}` },
    { nom: 'Bannière', valeurs: ['rouge', 'verte', 'bleue', 'noire', 'blanche', 'dorée', 'pourpre'],
      gn: (v) => `le clan à la bannière ${v}`, pred: (v) => `arbore la bannière ${v}` },
    { nom: 'Animal', valeurs: ['l’ours', 'le bouquetin', 'le corbeau', 'le loup', 'le sanglier', 'l’aigle', 'le blaireau'],
      gn: (v) => `le clan ${v.startsWith('l’') ? 'de ' + v : 'du ' + v.slice(3)}`, pred: (v) => `a ${v} pour emblème` },
    { nom: 'Boisson', valeurs: ['la bière brune', 'l’hydromel', 'l’eau de source', 'le vin de mousse', 'le lait de chèvre', 'la liqueur de gentiane'],
      gn: (v) => `le clan qui boit ${v.startsWith('la ') ? 'de la ' + v.slice(3) : v.startsWith('l’') ? 'de ' + v : 'du ' + v.slice(3)}`,
      pred: (v) => `boit ${v.startsWith('la ') ? 'de la ' + v.slice(3) : v.startsWith('l’') ? 'de ' + v : 'du ' + v.slice(3)}` }
  ];
  const C = CATEGORIES.length;
  const maj = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const du = (gn) => 'du ' + gn.slice(3); // « le clan … » → « du clan … »

  function permutations(t) {
    if (t.length <= 1) return [t];
    const r = [];
    t.forEach((x, i) => permutations(t.slice(0, i).concat(t.slice(i + 1))).forEach((p) => r.push([x].concat(p))));
    return r;
  }
  const PERMS = permutations([0, 1, 2, 3, 4]); // perm[valeur] = siège

  // Un indice : catégories concernées, test sur une solution partielle s[c][v] = siège.
  // Solveur : on fixe les catégories une à une (120 permutations chacune) et on vérifie
  // les indices dont toutes les catégories sont fixées. On s'arrête à `max` solutions.
  function compter(indices, max) {
    const s = new Array(C);
    // 1. Domaines : les indices sur une seule catégorie filtrent ses permutations d'emblée.
    const domaines = Array.from({ length: C }, (x, c) => {
      const unaires = indices.filter((i) => i.cats.every((k) => k === c));
      return PERMS.filter((p) => { s[c] = p; return unaires.every((i) => i.test(s)); });
    });
    // 2. Ordre : d'abord la catégorie la plus contrainte, puis celle la plus reliée aux déjà choisies.
    const ordre = [];
    while (ordre.length < C) {
      let meilleure = -1, score = -Infinity;
      for (let c = 0; c < C; c++) {
        if (ordre.includes(c)) continue;
        const liens = indices.filter((i) => i.cats.includes(c) && i.cats.some((k) => k !== c && ordre.includes(k))).length;
        const sc = liens * 1000 - domaines[c].length;
        if (sc > score) { score = sc; meilleure = c; }
      }
      ordre.push(meilleure);
    }
    // 3. Chaque indice est vérifié dès que sa dernière catégorie (dans cet ordre) est fixée.
    const rang = []; ordre.forEach((c, k) => { rang[c] = k; });
    const parNiveau = Array.from({ length: C }, () => []);
    indices.forEach((i) => { if (i.cats.some((k) => k !== i.cats[0])) parNiveau[Math.max(...i.cats.map((k) => rang[k]))].push(i); });
    let n = 0;
    (function rec(k) {
      if (n >= max) return;
      if (k === C) { n++; return; }
      const c = ordre[k];
      for (const p of domaines[c]) {
        s[c] = p;
        if (parNiveau[k].every((i) => i.test(s))) rec(k + 1);
        if (n >= max) return;
      }
    })(0);
    return n;
  }

  function generer(h) {
    const noms = CATEGORIES.map((cat) => h.melanger(cat.valeurs).slice(0, N));
    for (let essai = 0; ; essai++) {
      const sol = CATEGORIES.map(() => h.melanger([0, 1, 2, 3, 4]));
      const quiEst = (c, siege) => sol[c].indexOf(siege); // valeur de la catégorie c au siège
      const gn = (c, v) => CATEGORIES[c].gn(noms[c][v]);
      const cand = [];
      const ajoute = (type, cats, texte, test, poids) => cand.push({ type, cats, texte, test, poids });
      for (let a = 0; a < C; a++) for (let b = a + 1; b < C; b++) for (let siege = 0; siege < N; siege++) {
        const va = quiEst(a, siege), vb = quiEst(b, siege);
        ajoute('meme', [a, b], `${maj(gn(a, va))} ${CATEGORIES[b].pred(noms[b][vb])}.`, (s) => s[a][va] === s[b][vb], 3);
      }
      for (let c = 0; c < C; c++) for (const [siege, ou] of [[0, 'tout à gauche'], [2, 'au milieu'], [4, 'tout à droite']]) {
        const v = quiEst(c, siege);
        ajoute('place', [c], `${maj(gn(c, v))} siège ${ou}.`, (s) => s[c][v] === siege, 1);
      }
      for (let a = 0; a < C; a++) for (let b = 0; b < C; b++) for (let siege = 0; siege < N - 1; siege++) {
        const va = quiEst(a, siege), vb = quiEst(b, siege + 1);
        if (a === b && va === vb) continue;
        ajoute('gauche', [a, b], `${maj(gn(a, va))} siège juste à gauche ${du(gn(b, vb))}.`, (s) => s[a][va] + 1 === s[b][vb], 3);
        ajoute('voisin', [a, b], `${maj(gn(a, va))} siège à côté ${du(gn(b, vb))}.`, (s) => Math.abs(s[a][va] - s[b][vb]) === 1, 3);
      }
      // Ajout pondéré jusqu'à l'unicité (au plus 2 indices de place : sinon trop facile).
      const reserve = h.melanger(cand);
      const choisis = [];
      let places = 0;
      while (compter(choisis, 2) > 1 && reserve.length) {
        const total = reserve.reduce((t, x) => t + x.poids, 0);
        let r = h.reel() * total, k = 0;
        while ((r -= reserve[k].poids) > 0) k++;
        const i = reserve.splice(k, 1)[0];
        if (i.type === 'place' && places >= 2) continue;
        choisis.push(i);
        if (i.type === 'place') places++;
      }
      // Élagage : chaque indice restant est indispensable.
      for (const i of h.melanger(choisis.slice())) {
        const sans = choisis.filter((x) => x !== i);
        if (compter(sans, 2) === 1) choisis.splice(choisis.indexOf(i), 1);
      }
      // Difficulté visée : un peu en dessous d'Einstein (15 indices, 2 de place).
      if (choisis.length >= 14 && choisis.length <= 18) return { noms, sol, indices: h.melanger(choisis) };
      if (essai > 40) return { noms, sol, indices: h.melanger(choisis) };
    }
  }

  function monter(zone, ctx) {
    const { noms, sol, indices } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    const barres = Array.isArray(garde.barres) ? garde.barres : [];
    const carnet = Array.isArray(garde.carnet) ? garde.carnet : CATEGORIES.map(() => noms[0].map(() => new Array(N).fill(0)));
    const reponse = Array.isArray(garde.reponse) ? garde.reponse : CATEGORIES.map(() => new Array(N).fill(''));
    const memoriser = () => ctx.memoire.ecrire({ barres, carnet, reponse });
    // Marqueurs du carnet : vide, exclu, certain, hypothèse à tester, possible.
    const SIGNES = ['', '✗', '●', '?', '○'];

    // Indices : on peut les rayer quand on les a exploités.
    const liste = el('ol', { class: 'indices-clans' }, indices.map((i, k) => {
      const li = el('li', { class: barres.includes(k) ? 'raye' : '', text: i.texte, title: 'Touche pour rayer' });
      li.addEventListener('click', () => {
        const j = barres.indexOf(k);
        if (j >= 0) barres.splice(j, 1); else barres.push(k);
        li.classList.toggle('raye'); memoriser();
      });
      return li;
    }));

    // Carnet : pour chaque valeur, les sièges possibles (✗ exclu, ● certain).
    const grilles = CATEGORIES.map((cat, c) => {
      const t = el('table', { class: 'grille-logique' }, el('caption', { text: cat.nom }),
        el('tr', {}, el('th', {}), [1, 2, 3, 4, 5].map((n) => el('th', { scope: 'col', text: String(n) }))));
      noms[c].forEach((v, i) => t.append(el('tr', {}, el('th', { scope: 'row', text: v }),
        [0, 1, 2, 3, 4].map((siege) => {
          const b = el('button', {
            type: 'button', class: 'case c' + carnet[c][i][siege], text: SIGNES[carnet[c][i][siege]], 'aria-label': `${v}, siège ${siege + 1}`,
            onclick: () => { carnet[c][i][siege] = (carnet[c][i][siege] + 1) % SIGNES.length; b.textContent = SIGNES[carnet[c][i][siege]]; b.className = 'case c' + carnet[c][i][siege]; memoriser(); }
          });
          return el('td', {}, b);
        }))));
      return t;
    });

    // Registre : pour chaque siège, cinq menus.
    const sieges = el('div', { class: 'sieges' }, [0, 1, 2, 3, 4].map((siege) => el('div', { class: 'siege panneau' },
      el('h4', { text: `Siège ${siege + 1}` }),
      CATEGORIES.map((cat, c) => {
        const s = el('select', { 'aria-label': `${cat.nom}, siège ${siege + 1}`, onchange: () => { reponse[c][siege] = s.value; memoriser(); } },
          el('option', { value: '', text: cat.nom + '…' }), noms[c].map((v, i) => el('option', { value: String(i), text: v })));
        s.value = reponse[c][siege];
        return s;
      }))));

    const msg = el('p', { class: 'message' });
    const valider = el('button', {
      type: 'button', text: 'Présenter le plan du Conseil',
      onclick: () => {
        if (reponse.some((ligne) => ligne.includes(''))) { msg.className = 'message erreur'; msg.textContent = 'Le plan est incomplet : remplis les 25 cases.'; return; }
        const doublon = reponse.some((ligne) => new Set(ligne).size < N);
        if (doublon) { msg.className = 'message erreur'; msg.textContent = 'Une même valeur apparaît à deux sièges : chaque clan est unique.'; ctx.secouer(sieges); return; }
        const ok = reponse.every((ligne, c) => ligne.every((v, siege) => sol[c][+v] === siege));
        if (ok) { msg.className = 'message ok'; msg.textContent = 'Les cinq chefs se lèvent et frappent la table : le Conseil est au complet.'; setTimeout(ctx.reussir, 1200); return; }
        msg.className = 'message erreur';
        msg.textContent = 'Les chefs se regardent, perplexes : ce plan contredit au moins un indice.';
        ctx.secouer(sieges);
      }
    });

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Cinq clans nains siègent côte à côte au Conseil, du siège 1 (tout à gauche) au siège 5 (tout à droite). Chaque clan a un nom, un métier, une bannière, un animal emblème et une boisson préférée. Aucune valeur n’est partagée : il y a exactement un clan de chaque.' }),
        el('p', { text: 'Grâce aux indices, retrouve qui siège où, avec quoi. « Juste à gauche » veut dire au siège immédiatement à gauche ; « à côté » veut dire juste à gauche ou juste à droite. Tous les indices sont vrais, et un seul plan les respecte tous.' })),
      el('div', { class: 'panneau' },
        el('h3', { text: 'Les indices' }),
        el('p', { class: 'doux petit', text: 'Touche un indice pour le rayer quand tu l’as exploité.' }),
        liste),
      el('details', { class: 'carnet' },
        el('summary', { text: 'Ton carnet' }),
        el('p', { class: 'doux petit centre', text: 'Touche une case pour faire défiler : ✗ exclu → ● certain → ? hypothèse à tester → ○ possible → vide.' }),
        el('div', { class: 'grilles' }, grilles)),
      el('h3', { class: 'centre', text: 'Le plan du Conseil' }),
      sieges,
      msg,
      el('div', { class: 'actions' }, valider)
    );

    return {
      solution: () => ({
        reponse: [0, 1, 2, 3, 4].map((siege) => `Siège ${siege + 1} : ` + CATEGORIES.map((cat, c) => noms[c][sol[c].indexOf(siege)]).join(' · ')),
        pourquoi: [
          `Il y a ${indices.length} indices, tous indispensables : sans l’un d’eux, plusieurs plans seraient possibles (vérifié en essayant toutes les combinaisons).`,
          'Méthode : commencer par les indices de place (« tout à gauche », « au milieu », « tout à droite »), qui fixent des cases d’emblée. Puis les « juste à gauche », qui ne laissent que quatre positions possibles, et les indices « est / arbore / boit », qui relient deux valeurs sur le même siège.',
          'Dans le carnet, chaque ● posé permet de barrer toute sa ligne et sa colonne. Quand on bloque, il faut raisonner par cas : supposer une position, suivre les conséquences, et voir si un indice se retrouve contredit.',
          'Les indices « à côté » servent surtout à la fin, pour départager les dernières possibilités.'
        ]
      })
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'clans', nom: 'Le Conseil des Clans', icone: '⚖', etoiles: 5, resume: 'Logique', monter });
})();
