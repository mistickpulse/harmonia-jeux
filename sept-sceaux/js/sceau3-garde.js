// Sceau III — La Relève de la Garde (★★★)
// Grille logique : 5 gardes, 5 postes, 5 heures de relève. Les indices sont générés
// pour que la solution soit unique, puis élagués (aucun indice inutile).
// Le joueur dispose d'un carnet (deux grilles à cocher) et remplit le registre.
(function () {
  'use strict';
  const { el } = Sceaux;

  const GARDES = ['Brom', 'Hilda', 'Torvi', 'Durna', 'Kelgar', 'Ulfa', 'Grisa', 'Balek'];
  const POSTES = [
    { le: 'la Porte', du: 'de la Porte', court: 'Porte' },
    { le: 'le Rempart', du: 'du Rempart', court: 'Rempart' },
    { le: 'la Tour', du: 'de la Tour', court: 'Tour' },
    { le: 'le Puits', du: 'du Puits', court: 'Puits' },
    { le: 'la Forge', du: 'de la Forge', court: 'Forge' },
    { le: "l'Arsenal", du: "de l'Arsenal", court: 'Arsenal' },
    { le: 'les Geôles', du: 'des Geôles', court: 'Geôles' }
  ];
  const HEURES = ['18h', '20h', '22h', 'minuit', '2h'];
  const N = 5;
  const aH = (h) => (h === 3 ? 'à minuit' : `à ${HEURES[h]}`);
  const ECART = ['', 'deux heures', 'quatre heures', 'six heures', 'huit heures'];

  function permutations(t) {
    if (t.length <= 1) return [t];
    const r = [];
    t.forEach((x, i) => permutations(t.slice(0, i).concat(t.slice(i + 1))).forEach((p) => r.push([x].concat(p))));
    return r;
  }
  const PERMS = permutations([0, 1, 2, 3, 4]);
  let TOUTES = null; // les 14 400 registres possibles { p, h }
  function toutes() {
    if (!TOUTES) { TOUTES = []; for (const p of PERMS) for (const h of PERMS) TOUTES.push({ p, h }); }
    return TOUTES;
  }

  // ---------- Génération des indices ----------
  function indicesVrais(sol, g, P) {
    const gp = (s, x) => s.p.indexOf(x); // garde qui tient le poste x
    const c = [];
    const ajoute = (type, texte, test, poids) => c.push({ type, texte, test, poids });
    for (let x = 0; x < N; x++) {
      for (let q = 0; q < N; q++) {
        if (sol.p[x] === q) ajoute('direct', `${g[x]} garde ${P[q].le}.`, (s) => s.p[x] === q, 1);
        else ajoute('non', `${g[x]} ne garde pas ${P[q].le}.`, (s) => s.p[x] !== q, 3);
      }
      for (let h = 0; h < N; h++) {
        if (sol.h[x] === h) ajoute('direct', `${g[x]} prend la relève ${aH(h)}.`, (s) => s.h[x] === h, 1);
        else ajoute('non', `${g[x]} ne prend pas la relève ${aH(h)}.`, (s) => s.h[x] !== h, 3);
      }
      for (let y = 0; y < N; y++) {
        if (y !== x && sol.h[x] < sol.h[y]) ajoute('rel', `${g[x]} prend la relève avant ${g[y]}.`, (s) => s.h[x] < s.h[y], 6);
      }
      for (let q = 0; q < N; q++) {
        const autre = gp(sol, q);
        if (autre === x) continue;
        const d = sol.h[x] - sol.h[autre];
        if (d > 0) ajoute('rel', `${g[x]} prend la relève ${ECART[d]} après le garde ${P[q].du}.`, (s) => { const a = gp(s, q); return a !== x && s.h[x] - s.h[a] === d; }, 8);
        if (Math.abs(d) === 1) ajoute('rel', `${g[x]} et le garde ${P[q].du} se relaient l'un après l'autre.`, (s) => { const a = gp(s, q); return a !== x && Math.abs(s.h[x] - s.h[a]) === 1; }, 7);
        for (let r = q + 1; r < N; r++) {
          // Les deux postes sont cités dans un ordre fixe : l'ordre ne trahit pas le bon.
          if (sol.p[x] === q || sol.p[x] === r) ajoute('ou', `${g[x]} garde soit ${P[q].le}, soit ${P[r].le}.`, (s) => s.p[x] === q || s.p[x] === r, 5);
        }
      }
    }
    for (let q = 0; q < N; q++) {
      for (let h = 0; h < N; h++) {
        const x = gp(sol, q);
        if (sol.h[x] !== h) ajoute('non', `Le garde ${P[q].du} ne prend pas la relève ${aH(h)}.`, (s) => s.h[gp(s, q)] !== h, 3);
      }
      const x = gp(sol, q);
      if (sol.h[x] > 0 && sol.h[x] < N - 1) ajoute('rel', `Le garde ${P[q].du} n'est ni le premier ni le dernier à prendre la relève.`, (s) => { const k = s.h[gp(s, q)]; return k > 0 && k < N - 1; }, 5);
      for (let r = 0; r < N; r++) {
        if (r !== q && sol.h[gp(sol, q)] < sol.h[gp(sol, r)]) ajoute('rel', `Le garde ${P[q].du} prend la relève avant celui ${P[r].du}.`, (s) => s.h[gp(s, q)] < s.h[gp(s, r)], 6);
      }
    }
    return c;
  }

  function tirerPondere(h, liste) {
    const total = liste.reduce((a, c) => a + c.poids, 0);
    let r = h.reel() * total;
    for (let i = 0; i < liste.length; i++) { r -= liste[i].poids; if (r <= 0) return i; }
    return liste.length - 1;
  }

  function generer(h) {
    const g = h.melanger(GARDES).slice(0, N);
    const P = h.melanger(POSTES).slice(0, N);
    const sol = { p: h.melanger([0, 1, 2, 3, 4]), h: h.melanger([0, 1, 2, 3, 4]) };
    const reserve = indicesVrais(sol, g, P);
    let restants = toutes();
    const choisis = [];
    let directs = 0;
    while (restants.length > 1 && reserve.length) {
      const i = tirerPondere(h, reserve);
      const c = reserve.splice(i, 1)[0];
      if (c.type === 'direct' && directs >= 1) continue; // au plus un indice direct : sinon trop facile
      const filtres = restants.filter(c.test);
      if (filtres.length === restants.length) continue;   // n'apporte rien
      restants = filtres;
      choisis.push(c);
      if (c.type === 'direct') directs++;
    }
    // Élagage : on retire tout indice dont on peut se passer.
    for (const c of h.melanger(choisis.slice())) {
      const sans = choisis.filter((d) => d !== c);
      if (toutes().filter((s) => sans.every((d) => d.test(s))).length === 1) choisis.splice(choisis.indexOf(c), 1);
    }
    return { g, P, sol, indices: h.melanger(choisis) };
  }

  // Raisonnement : on applique les indices en commençant par les plus forts, et on note
  // ce qui devient certain à chaque étape.
  function deduire(g, P, indices) {
    let restants = toutes();
    const connu = { p: new Array(N).fill(false), h: new Array(N).fill(false) };
    const etapes = [];
    const aFaire = indices.slice();
    while (aFaire.length) {
      let meilleur = 0, taille = Infinity;
      aFaire.forEach((c, i) => { const n = restants.filter(c.test).length; if (n < taille) { taille = n; meilleur = i; } });
      const c = aFaire.splice(meilleur, 1)[0];
      restants = restants.filter(c.test);
      const faits = [];
      for (let x = 0; x < N; x++) {
        if (!connu.p[x] && restants.every((s) => s.p[x] === restants[0].p[x])) { connu.p[x] = true; faits.push(`${g[x]} garde ${P[restants[0].p[x]].le}`); }
        if (!connu.h[x] && restants.every((s) => s.h[x] === restants[0].h[x])) { connu.h[x] = true; faits.push(`${g[x]} prend la relève ${aH(restants[0].h[x])}`); }
      }
      etapes.push({ indice: c.texte, reste: restants.length, faits });
    }
    return etapes;
  }

  function monter(zone, ctx) {
    const { g, P, sol, indices } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    // Carnet : deux grilles (postes, heures) ; 0 vide, 1 croix, 2 point.
    const carnet = {
      p: Array.isArray(garde.p) ? garde.p : g.map(() => new Array(N).fill(0)),
      h: Array.isArray(garde.h) ? garde.h : g.map(() => new Array(N).fill(0))
    };
    const reponse = { p: Array.isArray(garde.rp) ? garde.rp : new Array(N).fill(''), h: Array.isArray(garde.rh) ? garde.rh : new Array(N).fill('') };
    const memoriser = () => ctx.memoire.ecrire({ p: carnet.p, h: carnet.h, rp: reponse.p, rh: reponse.h });

    const SIGNES = ['', '✗', '●'];
    function grille(titre, cle, colonnes) {
      const t = el('table', { class: 'grille-logique' });
      t.append(el('caption', { text: titre }));
      t.append(el('tr', {}, el('th', {}), colonnes.map((c) => el('th', { scope: 'col', text: c }))));
      g.forEach((nom, x) => {
        t.append(el('tr', {}, el('th', { scope: 'row', text: nom }),
          colonnes.map((c, j) => {
            const b = el('button', {
              type: 'button', class: 'case c' + carnet[cle][x][j], 'aria-label': `${nom}, ${c}`, text: SIGNES[carnet[cle][x][j]],
              onclick: () => {
                carnet[cle][x][j] = (carnet[cle][x][j] + 1) % 3;
                b.textContent = SIGNES[carnet[cle][x][j]];
                b.className = 'case c' + carnet[cle][x][j];
                memoriser();
              }
            });
            return el('td', {}, b);
          })));
      });
      return t;
    }

    const registre = el('table', { class: 'registre' },
      el('tr', {}, el('th', { text: 'Garde' }), el('th', { text: 'Poste' }), el('th', { text: 'Relève' })),
      g.map((nom, x) => el('tr', {},
        el('th', { scope: 'row', text: nom }),
        el('td', {}, choix(P.map((q) => q.court), 'p', x, 'Poste de ' + nom)),
        el('td', {}, choix(HEURES, 'h', x, 'Heure de ' + nom)))));
    function choix(options, cle, x, label) {
      const s = el('select', {
        'aria-label': label,
        onchange: () => { reponse[cle][x] = s.value; memoriser(); }
      }, el('option', { value: '', text: '—' }), options.map((o, i) => el('option', { value: String(i), text: o })));
      s.value = reponse[cle][x];
      return s;
    }

    const msg = el('p', { class: 'message' });
    const signer = el('button', {
      type: 'button', text: 'Signer le registre',
      onclick: () => {
        const ok = g.every((_, x) => reponse.p[x] === String(sol.p[x]) && reponse.h[x] === String(sol.h[x]));
        if (ok) { msg.className = 'message ok'; msg.textContent = 'Le sceau reconnaît l’écriture du capitaine.'; setTimeout(ctx.reussir, 800); return; }
        const vides = g.some((_, x) => reponse.p[x] === '' || reponse.h[x] === '');
        msg.className = 'message erreur';
        msg.textContent = vides ? 'Le registre est incomplet.' : 'L’encre s’efface : ce tableau de service est faux.';
        ctx.secouer(registre);
      }
    });

    zone.append(
      el('p', { class: 'consigne', text: 'Cloué sur la porte, un tableau de service à moitié arraché. Cinq gardes, cinq postes, cinq relèves d’une nuit. Il ne reste que des notes du capitaine.' }),
      el('div', { class: 'panneau notes-capitaine' },
        el('h3', { text: 'Notes du capitaine' }),
        el('p', { class: 'doux petit', text: `Relèves de la nuit : ${HEURES.join(', ')}. Chaque garde tient un seul poste et prend une seule relève.` }),
        el('ol', {}, indices.map((c) => el('li', { text: c.texte })))),
      el('details', { class: 'carnet', open: true },
        el('summary', { text: 'Ton carnet (touche une case : ✗, puis ●, puis vide)' }),
        el('div', { class: 'grilles' }, grille('Postes', 'p', P.map((q) => q.court)), grille('Relèves', 'h', HEURES))),
      el('h3', { class: 'centre', text: 'Le registre' }),
      registre,
      msg,
      el('div', { class: 'actions' }, signer)
    );

    return {
      solution: () => {
        const etapes = deduire(g, P, indices);
        return {
          reponse: g.map((nom, x) => `${nom} : ${P[sol.p[x]].le}, relève ${aH(sol.h[x])}`),
          pourquoi: [
            'Chaque garde a un seul poste et une seule relève : dès qu’une case est certaine, elle exclut toute sa ligne et toute sa colonne. On applique les notes en commençant par les plus fortes :',
            ...etapes.map((e, i) => `${i + 1}. « ${e.indice} » ${e.faits.length ? '→ on en déduit : ' + e.faits.join(' ; ') + '.' :'→ ne tranche rien seul, mais élimine des possibilités.'}` +
              (e.reste === 1 ? ' Il ne reste qu’une possibilité.' : '')),
            'Chaque note est nécessaire : sans l’une d’elles, il y aurait plusieurs solutions.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrer({ numero: 3, monter });
})();
