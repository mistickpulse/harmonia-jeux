// Les Profondeurs — Les Lanternes (★★★★)
// Akari : une galerie de 10 × 10 avec des piliers (certains numérotés). Une lanterne éclaire sa
// ligne et sa colonne jusqu'au premier pilier. Il faut tout éclairer, sans qu'une lanterne en
// éclaire une autre ; un pilier numéroté touche exactement ce nombre de lanternes (côtés seulement).
// Construit depuis une solution ; les nombres sont ajoutés jusqu'à l'unicité, puis élagués.
(function () {
  'use strict';
  const { el } = Sceaux;
  const T = 10;
  const COTES = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const dans = (r, c) => r >= 0 && c >= 0 && r < T && c < T;

  // Pour chaque case libre : les cases qu'elle voit (même ligne/colonne, sans pilier entre).
  function visibilites(murs) {
    return Array.from({ length: T * T }, (x, i) => {
      if (murs.has(i)) return [];
      const r = Math.floor(i / T), c = i % T, v = [];
      for (const [dr, dc] of COTES) for (let k = 1; ; k++) {
        const rr = r + dr * k, cc = c + dc * k;
        if (!dans(rr, cc) || murs.has(rr * T + cc)) break;
        v.push(rr * T + cc);
      }
      return v;
    });
  }
  const voisinsCotes = (i) => COTES.map(([dr, dc]) => [Math.floor(i / T) + dr, (i % T) + dc]).filter(([r, c]) => dans(r, c)).map(([r, c]) => r * T + c);

  // Compte les solutions (jusqu'à `max`) : on choisit la case non éclairée qui a le moins
  // de candidates pour l'éclairer, et on essaie chacune (les précédentes étant interdites).
  function compter(murs, nombres, max) {
    const vis = visibilites(murs);
    const libres = [...Array(T * T).keys()].filter((i) => !murs.has(i));
    const etat = new Int8Array(T * T); // 0 inconnu, 1 lanterne, -1 interdit
    const lumiere = new Int16Array(T * T);
    let n = 0;
    const compteMur = (m) => { let l = 0, possibles = 0; for (const v of voisinsCotes(m)) { if (murs.has(v)) continue; if (etat[v] === 1) l++; else if (etat[v] === 0 && !lumiere[v]) possibles++; } return [l, possibles]; };
    const nombresOk = (fin) => {
      for (const [m, k] of nombres) { const [l, p] = compteMur(m); if (l > k || l + p < k || (fin && l !== k)) return false; }
      return true;
    };
    function poser(i, s) { etat[i] = 1; lumiere[i]++; vis[i].forEach((v) => lumiere[v]++); s.push(i); }
    function oter(s) { const i = s.pop(); etat[i] = 0; lumiere[i]--; vis[i].forEach((v) => lumiere[v]--); }
    (function rec() {
      if (n >= max) return;
      let cible = -1, meilleures = null;
      for (const i of libres) {
        if (lumiere[i]) continue;
        const cand = [i, ...vis[i]].filter((k) => etat[k] === 0 && !lumiere[k]);
        if (!cand.length) return; // case impossible à éclairer
        if (!meilleures || cand.length < meilleures.length) { cible = i; meilleures = cand; if (cand.length === 1) break; }
      }
      if (cible < 0) { if (nombresOk(true)) n++; return; }
      const interdites = [];
      for (const k of meilleures) {
        const pile = [];
        poser(k, pile);
        if (nombresOk(false)) rec();
        oter(pile);
        if (n >= max) break;
        etat[k] = -1; interdites.push(k); // les solutions suivantes n'utilisent pas k pour éclairer la cible
      }
      interdites.forEach((k) => { etat[k] = 0; });
    })();
    return n;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      const murs = new Set(h.melanger([...Array(T * T).keys()]).slice(0, h.entier(18, 24)));
      const vis = visibilites(murs);
      // Une solution : lanternes posées au hasard tant qu'il reste des cases sombres.
      const lanternes = new Set(), eclaire = new Set();
      for (const i of h.melanger([...Array(T * T).keys()])) {
        if (murs.has(i) || eclaire.has(i)) continue;
        lanternes.add(i); eclaire.add(i); vis[i].forEach((v) => eclaire.add(v));
      }
      const valeur = (m) => voisinsCotes(m).filter((v) => lanternes.has(v)).length;
      // Nombres : on en révèle jusqu'à l'unicité, puis on retire ceux qui ne servent à rien.
      const reserve = h.melanger([...murs]);
      const nombres = [];
      while (compter(murs, nombres, 2) > 1 && reserve.length) { const m = reserve.pop(); nombres.push([m, valeur(m)]); }
      if (compter(murs, nombres, 2) !== 1) continue;
      for (const x of h.melanger(nombres.slice())) {
        const sans = nombres.filter((y) => y !== x);
        if (compter(murs, sans, 2) === 1) nombres.splice(nombres.indexOf(x), 1);
      }
      if (nombres.length < 5 && essai < 60) continue; // trop peu d'appuis : souvent frustrant
      return { murs, nombres: new Map(nombres), lanternes };
    }
  }

  // Petit schéma d'exemple : L lanterne, e dalle éclairée, . dalle sombre, x point, ■ pilier, 0-4 pilier numéroté.
  function exemple(lignes, texte) {
    const grille = lignes.map((l) => l.split(' '));
    const g = el('div', { class: 'mini-galerie', style: `grid-template-columns: repeat(${grille[0].length}, 26px)` });
    grille.flat().forEach((ch) => {
      if (/[0-4■]/.test(ch)) g.append(el('div', { class: 'pilier-galerie', text: ch === '■' ? '' : ch }));
      else g.append(el('div', { class: 'dalle' + (ch === 'L' ? ' lanterne eclairee' : ch === 'e' ? ' eclairee' : ch === 'x' ? ' point' : ''), text: ch === 'L' ? '✺' : ch === 'x' ? '·' : '' }));
    });
    return el('div', { class: 'exemple-lanterne' }, g, el('p', { class: 'petit', text: texte }));
  }

  function monter(zone, ctx) {
    const { murs, nombres, lanternes } = generer(ctx.hasard);
    const vis = visibilites(murs);
    const garde = ctx.memoire.lire() || {};
    const pose = Array.isArray(garde.pose) && garde.pose.length === T * T ? garde.pose : new Array(T * T).fill(0); // 0 vide, 1 lanterne, 2 point
    const memoriser = () => ctx.memoire.ecrire({ pose });
    let fini = false;

    const galerie = el('div', { class: 'galerie', role: 'grid', 'aria-label': 'Galerie à éclairer' });
    const msg = el('p', { class: 'message' });

    function dessiner() {
      galerie.replaceChildren();
      const lumiere = new Array(T * T).fill(0);
      pose.forEach((p, i) => { if (p === 1) { lumiere[i]++; vis[i].forEach((v) => lumiere[v]++); } });
      for (let i = 0; i < T * T; i++) {
        if (murs.has(i)) {
          const k = nombres.get(i);
          let classe = 'pilier-galerie';
          if (k !== undefined) {
            const l = voisinsCotes(i).filter((v) => pose[v] === 1).length;
            classe += l === k ? ' ok' : l > k ? ' trop' : '';
          }
          galerie.append(el('div', { class: classe, text: k !== undefined ? String(k) : '', 'aria-label': k !== undefined ? `Pilier ${k}` : 'Pilier' }));
          continue;
        }
        const conflit = pose[i] === 1 && vis[i].some((v) => pose[v] === 1);
        const b = el('button', {
          type: 'button', class: 'dalle' + (lumiere[i] ? ' eclairee' : '') + (pose[i] === 1 ? ' lanterne' : '') + (conflit ? ' conflit' : '') + (pose[i] === 2 ? ' point' : ''),
          text: pose[i] === 1 ? '✺' : pose[i] === 2 ? '·' : '', 'aria-label': pose[i] === 1 ? 'Lanterne' : lumiere[i] ? 'Dalle éclairée' : 'Dalle sombre',
          onclick: () => { if (fini) return; pose[i] = (pose[i] + 1) % 3; memoriser(); dessiner(); verifier(); },
          oncontextmenu: (ev) => { ev.preventDefault(); if (fini) return; pose[i] = pose[i] === 2 ? 0 : 2; memoriser(); dessiner(); }
        });
        galerie.append(b);
      }
    }
    function verifier() {
      const lumiere = new Array(T * T).fill(0);
      pose.forEach((p, i) => { if (p === 1) { lumiere[i]++; vis[i].forEach((v) => lumiere[v]++); } });
      const toutEclaire = [...Array(T * T).keys()].every((i) => murs.has(i) || lumiere[i]);
      const aucunConflit = pose.every((p, i) => p !== 1 || !vis[i].some((v) => pose[v] === 1));
      const nombresOk = [...nombres].every(([m, k]) => voisinsCotes(m).filter((v) => pose[v] === 1).length === k);
      if (toutEclaire && aucunConflit && nombresOk) {
        fini = true;
        msg.className = 'message ok'; msg.textContent = 'La dernière ombre recule : toute la galerie baigne dans la lumière des lanternes.';
        setTimeout(ctx.reussir, 1300);
      } else if (toutEclaire) {
        msg.className = 'message erreur';
        msg.textContent = !aucunConflit ? 'Tout est éclairé… mais des lanternes s’éblouissent l’une l’autre (en rouge).' : 'Tout est éclairé… mais un pilier numéroté n’a pas son compte.';
      } else { msg.className = 'message'; msg.textContent = ''; }
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Une galerie plongée dans le noir, coupée de piliers. Pose des lanternes sur les dalles pour que toute la galerie soit éclairée.' }),
        el('p', { text: 'Une lanterne éclaire sa propre dalle et toutes celles de sa ligne et de sa colonne, jusqu’au premier pilier (ou au bord). Deux lanternes ne doivent jamais s’éclairer l’une l’autre. Un pilier portant un nombre touche exactement ce nombre de lanternes par ses côtés (pas en diagonale) ; un pilier sans nombre, on ne sait pas.' }),
        el('p', { text: 'Touche une dalle : lanterne ✺, puis point · (« sûrement pas de lanterne ici »), puis vide. Clic droit sur ordinateur pour poser directement un point. Les nombres satisfaits passent au doré, ceux qui en ont trop au rouge. Il n’existe qu’une seule solution.' }),
        el('h4', { class: 'titre-exemples', text: 'Exemples' }),
        el('div', { class: 'exemples-lanternes' },
          exemple(['L e e ■ .'], 'La lumière part dans les 4 directions et s’arrête au premier pilier : la dernière dalle, derrière le pilier, reste sombre.'),
          exemple(['. x .', 'x 0 x', '. x .'], 'Un pilier « 0 » ne touche aucune lanterne : ses 4 voisines (côtés) portent un point. Elles devront être éclairées par des lanternes plus lointaines. Les diagonales ne comptent pas.'),
          exemple(['e L e', 'L 3 L', 'e x e'],'Un pilier « 3 » : trois de ses quatre voisines portent une lanterne. Contre un bord ou un autre pilier, un « 3 » ou un « 2 » peut n’avoir qu’une seule façon de se remplir.'),
          exemple(['L e e e e', 'e . . 1 .', 'e e e L e'],'Le piège : la lanterne en haut éclaire toute la première ligne. La dalle au-dessus du « 1 » est donc éclairée : on ne peut plus y poser de lanterne (deux lanternes se verraient). Le « 1 » doit prendre sa lanterne ailleurs, ici en dessous. Un rayon peut ainsi « fermer » une voisine d’un pilier.'))),
      el('div', { class: 'cadre-galerie' }, galerie),
      msg,
      el('div', { class: 'actions' }, el('button', { type: 'button', class: 'discret', text: '✕ Tout effacer', onclick: () => { if (fini || !window.confirm('Retirer toutes les lanternes et tous les points ?')) return; pose.fill(0); memoriser(); dessiner(); verifier(); } })));
    dessiner(); verifier();

    return {
      solution: () => {
        const lignes = [];
        for (let r = 0; r < T; r++) {
          let t = '';
          for (let c = 0; c < T; c++) { const i = r * T + c; t += murs.has(i) ? (nombres.has(i) ? nombres.get(i) : '■') : lanternes.has(i) ? '✺' : '·'; t += ' '; }
          lignes.push(`Ligne ${r + 1} : ${t.trim()}`);
        }
        return {
          reponse: ['✺ = lanterne, · = dalle sans lanterne, ■ ou chiffre = pilier.', ...lignes],
          pourquoi: [
            `${lanternes.size} lanternes. Solution unique, vérifiée en essayant toutes les possibilités ; chaque nombre affiché est indispensable.`,
            'Pour démarrer : un « 4 » a une lanterne de chaque côté ; un « 0 » n’en a aucune (pose des points autour) ; un « 3 » contre un bord a ses trois côtés libres garnis.',
            'Une dalle qui ne peut être éclairée que par une seule autre case (elle-même comprise) désigne où poser une lanterne.',
            'Chaque lanterne posée rend interdites toutes les dalles qu’elle éclaire : les points s’accumulent et les dernières cases sombres se trahissent.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'lanternes', nom: 'Les Lanternes', icone: '✺', etoiles: 4, resume: 'Logique', monter });
})();
