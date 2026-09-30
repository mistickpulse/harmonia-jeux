// Les Profondeurs — La Tapisserie effacée (★★★★)
// Picross : les nombres de chaque ligne et de chaque colonne donnent, dans l'ordre, la longueur
// des suites de cases tissées. Le motif (un blason symétrique) est généré pour le joueur et
// n'est accepté que s'il se résout entièrement par déduction, ligne après ligne : solution unique.
(function () {
  'use strict';
  const { el } = Sceaux;
  const N = 12;

  const indicesDe = (ligne) => {
    const r = []; let n = 0;
    ligne.forEach((v) => { if (v) n++; else if (n) { r.push(n); n = 0; } });
    if (n) r.push(n);
    return r.length ? r : [0];
  };

  // Déduction sur une ligne : essaie toutes les dispositions compatibles avec ce qu'on sait
  // (-1 inconnu, 0 vide, 1 tissé) et garde ce qui est commun à toutes. null = contradiction.
  function deduireLigne(indices, connu) {
    const blocs = indices[0] === 0 ? [] : indices;
    const n = connu.length;
    const peutPlein = new Array(n).fill(false), peutVide = new Array(n).fill(false);
    let trouve = false;
    const ligne = new Array(n).fill(0);
    (function placer(b, debut) {
      if (b === blocs.length) {
        for (let i = debut; i < n; i++) if (connu[i] === 1) return;
        trouve = true;
        for (let i = 0; i < n; i++) { const v = i < debut ? ligne[i] : 0; if (v) peutPlein[i] = true; else peutVide[i] = true; }
        return;
      }
      const reste = blocs.slice(b + 1).reduce((s, x) => s + x + 1, 0);
      for (let p = debut; p + blocs[b] + reste <= n; p++) {
        let ok = true;
        for (let i = debut; i < p && ok; i++) if (connu[i] === 1) ok = false;          // vides avant le bloc
        for (let i = p; i < p + blocs[b] && ok; i++) if (connu[i] === 0) ok = false;   // le bloc lui-même
        if (ok && p + blocs[b] < n && connu[p + blocs[b]] === 1) ok = false;           // séparateur
        if (!ok) { if (connu[p] === 1) break; continue; }
        for (let i = debut; i < p; i++) ligne[i] = 0;
        for (let i = p; i < p + blocs[b]; i++) ligne[i] = 1;
        if (p + blocs[b] < n) ligne[p + blocs[b]] = 0;
        placer(b + 1, Math.min(n, p + blocs[b] + 1));
        if (connu[p] === 1) break; // un bloc ne peut pas commencer après une case tissée connue
      }
    })(0, 0);
    if (!trouve) return null;
    return connu.map((v, i) => (v !== -1 ? v : peutPlein[i] && !peutVide[i] ? 1 : !peutPlein[i] && peutVide[i] ? 0 : -1));
  }

  // Résout toute la grille par passes successives. Renvoie le nombre de passes, ou -1.
  function resoudre(lignes, colonnes) {
    const g = Array.from({ length: N }, () => new Array(N).fill(-1));
    for (let passe = 1; passe < 60; passe++) {
      let change = false;
      for (let r = 0; r < N; r++) {
        const d = deduireLigne(lignes[r], g[r]); if (!d) return -1;
        d.forEach((v, c) => { if (g[r][c] !== v) { g[r][c] = v; change = true; } });
      }
      for (let c = 0; c < N; c++) {
        const d = deduireLigne(colonnes[c], g.map((l) => l[c])); if (!d) return -1;
        d.forEach((v, r) => { if (g[r][c] !== v) { g[r][c] = v; change = true; } });
      }
      if (g.every((l) => l.every((v) => v !== -1))) return passe;
      if (!change) return -1;
    }
    return -1;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      // Moitié gauche au hasard, lissée (pour des formes pleines), puis miroir : un blason.
      let m = Array.from({ length: N }, () => Array.from({ length: N / 2 }, () => (h.reel() < 0.52 ? 1 : 0)));
      for (let it = 0; it < 1; it++) {
        m = m.map((l, r) => l.map((v, c) => {
          let s = 0;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < N && cc >= 0 && cc < N / 2) s += m[rr][cc]; else if (cc === N / 2) s += m[rr] ? m[rr][N / 2 - 1] : 0;
          }
          return s >= 6 ? 1 : s <= 2 ? 0 : v;
        }));
      }
      const sol = m.map((l) => l.concat(l.slice().reverse()));
      const densite = sol.flat().filter(Boolean).length / (N * N);
      if (densite < 0.38 || densite > 0.66) continue;
      const lignes = sol.map(indicesDe);
      const colonnes = [...Array(N).keys()].map((c) => indicesDe(sol.map((l) => l[c])));
      const passes = resoudre(lignes, colonnes);
      // Soluble par déduction, et pas trop vite (sinon trop facile).
      if (passes >= 7 || (passes >= 5 && essai > 1500) || (passes > 0 && essai > 3000)) return { sol, lignes, colonnes, passes };
    }
  }

  function monter(zone, ctx) {
    const { sol, lignes, colonnes, passes } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    // 0 vide, 1 tissé, 2 croix (sûrement vide)
    let g = Array.isArray(garde.g) && garde.g.length === N ? garde.g : Array.from({ length: N }, () => new Array(N).fill(0));
    const memoriser = () => ctx.memoire.ecrire({ g });
    let fini = false;

    const table = el('div', { class: 'tapisserie', style: `--n:${N}` });
    const cases = [];
    const ttLignes = [], ttCols = [];
    table.append(el('div', { class: 'coin' }));
    colonnes.forEach((ind, c) => { const d = el('div', { class: 'indice-col' }, ind.map((x) => el('span', { text: String(x) }))); ttCols.push(d); table.append(d); });
    for (let r = 0; r < N; r++) {
      const d = el('div', { class: 'indice-ligne' }, lignes[r].map((x) => el('span', { text: String(x) }))); ttLignes.push(d); table.append(d);
      cases.push([]);
      for (let c = 0; c < N; c++) {
        const b = el('div', { class: 'maille', 'data-r': r, 'data-c': c, role: 'button', 'aria-label': `Ligne ${r + 1}, colonne ${c + 1}` });
        cases[r].push(b); table.append(b);
      }
    }

    function peindre(r, c, v) { g[r][c] = v; const b = cases[r][c]; b.className = 'maille' + (v === 1 ? ' tisse' : v === 2 ? ' croix' : ''); b.textContent = v === 2 ? '×' : ''; }
    function verifierLignes() {
      for (let r = 0; r < N; r++) ttLignes[r].classList.toggle('fait', indicesDe(g[r].map((v) => v === 1)).join() === lignes[r].join());
      for (let c = 0; c < N; c++) ttCols[c].classList.toggle('fait', indicesDe(g.map((l) => l[c] === 1)).join() === colonnes[c].join());
      if (g.every((l, r) => l.every((v, c) => (v === 1) === (sol[r][c] === 1)))) {
        fini = true;
        table.classList.add('revelee');
        msg.className = 'message ok'; msg.textContent = 'Les derniers fils se tendent : le blason des Anciens réapparaît sur la tapisserie.';
        setTimeout(ctx.reussir, 1600);
      }
    }
    g.forEach((l, r) => l.forEach((v, c) => peindre(r, c, v)));

    // Toucher / cliquer : fait défiler vide → tissé → croix. En glissant, on applique le même état.
    let peinture = null;
    const caseSous = (ev) => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t && t.classList && t.classList.contains('maille') ? t : null; };
    table.addEventListener('pointerdown', (ev) => {
      const t = ev.target.closest('.maille'); if (!t || fini) return;
      ev.preventDefault();
      const r = +t.dataset.r, c = +t.dataset.c;
      peinture = mode === 'croix' ? (g[r][c] === 2 ? 0 : 2) : (g[r][c] + 1) % 3;
      if (mode === 'tisser' && g[r][c] === 0) peinture = 1;
      peindre(r, c, peinture);
    });
    table.addEventListener('pointermove', (ev) => {
      if (peinture === null) return;
      const t = caseSous(ev); if (!t) return;
      const r = +t.dataset.r, c = +t.dataset.c;
      if (g[r][c] !== peinture) peindre(r, c, peinture);
    });
    const lacher = () => { if (peinture === null) return; peinture = null; memoriser(); verifierLignes(); };
    window.addEventListener('pointerup', lacher);
    table.addEventListener('pointercancel', lacher);

    let mode = 'tisser';
    const boutonMode = el('button', { type: 'button', class: 'discret', onclick: () => { mode = mode === 'tisser' ? 'croix' : 'tisser'; majMode(); } });
    const majMode = () => { boutonMode.textContent = mode === 'tisser' ? 'Mode : tisser ■ (touche pour poser des croix ×)' : 'Mode : croix × (touche pour tisser ■)'; boutonMode.classList.toggle('mode-marquer', mode === 'croix'); };
    majMode();

    const msg = el('p', { class: 'message' });
    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: `Le temps a effacé un blason tissé sur cette tapisserie de ${N} × ${N} mailles. Les tisserands ont laissé des nombres au bord : pour chaque ligne (à gauche) et chaque colonne (en haut), ils donnent, dans l’ordre, la longueur des suites de mailles tissées. Entre deux suites, il y a au moins une maille vide. Un 0 veut dire que la ligne est vide.` }),
        el('p', { text: 'Exemple : « 3 1 » sur une ligne veut dire trois mailles tissées côte à côte, puis au moins un vide, puis une maille tissée seule.' }),
        el('p', { text: 'Touche une maille pour la tisser ■, touche encore pour y poser une croix × (sûrement vide), encore pour l’effacer. Tu peux glisser pour en remplir plusieurs. Les nombres d’une ligne pâlissent quand elle correspond. Le motif se trouve par pure déduction, sans jamais deviner, et il n’y en a qu’un.' })),
      el('div', { class: 'actions' }, boutonMode,
        el('button', { type: 'button', class: 'discret', text: '✕ Tout effacer', onclick: () => { if (fini || !window.confirm('Effacer toute la tapisserie ?')) return; g.forEach((l, r) => l.forEach((v, c) => peindre(r, c, 0))); memoriser(); verifierLignes(); } })),
      el('div', { class: 'cadre-tapisserie' }, table),
      msg);
    verifierLignes();

    return {
      solution: () => ({
        reponse: ['■ = maille tissée, · = vide', ...sol.map((l, r) => `Ligne ${r + 1} : ${l.map((v) => (v ? '■' : '·')).join('')}`)],
        pourquoi: [
          `Ce blason se retrouve sans jamais deviner, en ${passes} tours de déduction sur toutes les lignes et colonnes (vérifié par un solveur) : il n’a donc qu’une solution.`,
          'Les grands nombres d’abord : une suite de 8 dans une ligne de 12 recouvre forcément les 4 mailles du milieu, quelle que soit sa place. C’est la technique du chevauchement.',
          'Une ligne à 0 est entièrement vide ; une ligne dont les nombres et les espaces remplissent tout (ex. « 5 6 » : 5 + 1 + 6 = 12) est entièrement déterminée.',
          'Ensuite, chaque croix posée dans une colonne raccourcit les possibilités des lignes qui la croisent, et inversement : on alterne lignes et colonnes jusqu’au bout.'
        ]
      })
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'tapisserie', nom: 'La Tapisserie effacée', icone: '▦', etoiles: 4, resume: 'Picross', monter, souvenir: () => Sceaux.el('p', { class: 'murmure-souvenir', text: 'Maintenant que la tapisserie est entière, tu remarques un détail : tout au centre, les tisserands avaient brodé un cœur de pierre.' }) });
})();
