// Les Profondeurs — Le Réseau runique (★★★★★)
// Une grille de dalles gravées de canaux. On tourne chaque dalle d'un quart de tour : il faut que
// l'énergie du Cœur atteigne toutes les dalles, sans canal ouvert dans le vide ni boucle.
// Le réseau est un arbre (aucune boucle), la solution est unique (vérifiée par un solveur), et les
// grilles que la simple déduction locale suffit à résoudre sont écartées.
(function () {
  'use strict';
  const { el } = Sceaux;
  const R = 10, C = 10, N = R * C;
  const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1]; // haut, droite, bas, gauche (bits 1, 2, 4, 8)
  const tourner = (m) => ((m << 1) | (m >> 3)) & 15; // un quart de tour dans le sens des aiguilles
  const TRAIT = ' ╵╶└╷│┌├╴┘─┴┐┤┬┼';
  const voisin = (i, d) => { const r = Math.floor(i / C) + DR[d], c = (i % C) + DC[d]; return r < 0 || c < 0 || r >= R || c >= C ? -1 : r * C + c; };
  function orientations(m) { const v = []; for (let k = 0, x = m; k < 4; k++, x = tourner(x)) if (!v.includes(x)) v.push(x); return v; }
  const degre = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);

  // Arbre couvrant aléatoire depuis le Cœur (Prim aléatoire), degré 3 au plus.
  function arbre(h, coeur) {
    const m = new Array(N).fill(0), pris = new Set([coeur]);
    const bord = [];
    const ajouter = (i) => { for (let d = 0; d < 4; d++) { const j = voisin(i, d); if (j >= 0 && !pris.has(j)) bord.push([i, d, j]); } };
    ajouter(coeur);
    while (pris.size < N) {
      const k = h.entier(0, bord.length - 1);
      const [i, d, j] = bord[k]; bord.splice(k, 1);
      if (pris.has(j) || degre(m[i]) >= 3) continue;
      m[i] |= 1 << d; m[j] |= 1 << ((d + 2) % 4); pris.add(j); ajouter(j);
    }
    return m;
  }

  // Déduction locale (cohérence d'arcs) : chaque orientation doit être compatible avec au moins une
  // orientation de chaque voisine, et deux bouts de ligne ne peuvent pas se relier entre eux.
  function deduire(types) {
    const dom = types.map(orientations);
    for (let change = true; change;) {
      change = false;
      for (let i = 0; i < N; i++) {
        const garde = dom[i].filter((o) => {
          for (let d = 0; d < 4; d++) {
            const j = voisin(i, d), b = (o >> d) & 1;
            if (j < 0) { if (b) return false; continue; }
            const bj = 1 << ((d + 2) % 4);
            if (!dom[j].some((p) => ((p & bj) ? 1 : 0) === b && !(b && degre(o) === 1 && degre(p) === 1))) return false;
          }
          return true;
        });
        if (garde.length < dom[i].length) { dom[i] = garde; change = true; }
      }
    }
    return dom;
  }

  // Compte les solutions (jusqu'à 2) : placement ligne par ligne, rejet des boucles au fil de l'eau,
  // puis vérification que tout est relié.
  function compter(types, dom) {
    const pose = new Array(N).fill(-1);
    let n = 0;
    const comp = Array.from({ length: N }, (x, i) => i);
    function chercher(i, comp) {
      if (n > 1) return;
      if (i === N) {
        const vu = new Set([0]), pile = [0];
        while (pile.length) { const a = pile.pop(); for (let d = 0; d < 4; d++) if (pose[a] >> d & 1) { const b = voisin(a, d); if (!vu.has(b)) { vu.add(b); pile.push(b); } } }
        if (vu.size === N) n++;
        return;
      }
      const r = Math.floor(i / C), c = i % C;
      for (const o of dom[i]) {
        if (r === 0 && (o & 1)) continue; if (r === R - 1 && (o & 4)) continue;
        if (c === 0 && (o & 8)) continue; if (c === C - 1 && (o & 2)) continue;
        const haut = r > 0 ? (pose[i - C] >> 2) & 1 : 0, gauche = c > 0 ? (pose[i - 1] >> 1) & 1 : 0;
        if (((o & 1) ? 1 : 0) !== haut || ((o >> 3) & 1) !== gauche) continue;
        if (degre(o) === 1 && ((haut && degre(pose[i - C]) === 1) || (gauche && degre(pose[i - 1]) === 1))) continue;
        if (haut && gauche && comp[i - C] === comp[i - 1]) continue; // boucle
        const nc = comp.slice();
        if (haut) { const a = nc[i - C]; for (let k = 0; k < N; k++) if (nc[k] === i) nc[k] = a; }
        if (gauche) { const a = nc[i - 1], b = nc[i]; for (let k = 0; k < N; k++) if (nc[k] === b) nc[k] = a; }
        pose[i] = o;
        chercher(i + 1, nc);
        pose[i] = -1;
      }
    }
    chercher(0, comp);
    return n;
  }

  function generer(h) {
    const coeur = Math.floor(R / 2) * C + Math.floor(C / 2);
    for (let essai = 0; ; essai++) {
      const sol = arbre(h, coeur);
      const types = sol.slice();
      const dom = deduire(types);
      // Très dur : au moins 34 dalles que la déduction locale ne tranche pas (seuil abaissé si rien ne vient).
      const indecises = dom.filter((d) => d.length > 1).length;
      const facile = indecises < (essai < 2000 ? 34 : essai < 4000 ? 26 : 18);
      if (facile) continue;
      if (compter(types, dom) !== 1) continue;
      // Départ mélangé : chaque dalle qui peut tourner commence dans une autre position.
      const depart = sol.map((m) => { const o = orientations(m).filter((x) => x !== m); return o.length ? h.choisir(o) : m; });
      return { sol, depart, coeur, dur: !facile };
    }
  }

  // Dalles reliées au Cœur par des canaux qui se correspondent.
  function allumees(etat, coeur) {
    const vu = new Set([coeur]), pile = [coeur];
    while (pile.length) {
      const a = pile.pop();
      for (let d = 0; d < 4; d++) {
        if (!(etat[a] >> d & 1)) continue;
        const b = voisin(a, d);
        if (b < 0 || !(etat[b] >> ((d + 2) % 4) & 1) || vu.has(b)) continue;
        vu.add(b); pile.push(b);
      }
    }
    return vu;
  }
  function resolu(etat, coeur) {
    for (let i = 0; i < N; i++) for (let d = 0; d < 4; d++) {
      const b = voisin(i, d), bit = etat[i] >> d & 1;
      if (b < 0 ? bit : bit !== (etat[b] >> ((d + 2) % 4) & 1)) return false;
    }
    return allumees(etat, coeur).size === N;
  }

  const SVG = 'http://www.w3.org/2000/svg';
  function dessinCanaux(m, coeur) {
    const s = document.createElementNS(SVG, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('class', 'canaux');
    const bouts = [[50, 0], [100, 50], [50, 100], [0, 50]];
    for (let d = 0; d < 4; d++) if (m >> d & 1) {
      const l = document.createElementNS(SVG, 'line');
      l.setAttribute('x1', 50); l.setAttribute('y1', 50); l.setAttribute('x2', bouts[d][0]); l.setAttribute('y2', bouts[d][1]);
      s.append(l);
    }
    const noeud = document.createElementNS(SVG, 'circle');
    noeud.setAttribute('cx', 50); noeud.setAttribute('cy', 50); noeud.setAttribute('r', coeur ? 20 : degre(m) === 1 ? 13 : 9);
    noeud.setAttribute('class', coeur ? 'coeur' : degre(m) === 1 ? 'bout' : 'noeud');
    s.append(noeud);
    return s;
  }

  function monter(zone, ctx) {
    const { sol, depart, coeur } = generer(ctx.hasard);
    const garde = ctx.memoire.lire();
    const etat = Array.isArray(garde) && garde.length === N && garde.every((m, i) => orientations(sol[i]).includes(m)) ? garde.slice() : depart.slice();
    let fini = false;
    const msg = el('p', { class: 'message' });
    const grille = el('div', { class: 'grille-reseau', role: 'grid', 'aria-label': 'Réseau runique' });
    const dalles = [];
    for (let i = 0; i < N; i++) {
      const b = el('button', { type: 'button', class: 'dalle-reseau' + (i === coeur ? ' est-coeur' : ''), onclick: () => tournerDalle(i) });
      dalles.push(b); grille.append(b);
    }
    function dessiner() {
      const lum = allumees(etat, coeur);
      dalles.forEach((b, i) => {
        b.replaceChildren(dessinCanaux(etat[i], i === coeur));
        b.classList.toggle('allumee', lum.has(i));
        b.setAttribute('aria-label', `Dalle ${Math.floor(i / C) + 1}-${(i % C) + 1}${lum.has(i) ? ', reliée au Cœur' : ''}`);
      });
      compteur.textContent = `Dalles reliées au Cœur : ${lum.size} / ${N}`;
    }
    function tournerDalle(i) {
      if (fini || orientations(sol[i]).length === 1) return;
      etat[i] = tourner(etat[i]);
      ctx.memoire.ecrire(etat);
      msg.className = 'message'; msg.textContent = '';
      dessiner();
      if (resolu(etat, coeur)) {
        fini = true; msg.className = 'message ok';
        msg.textContent = 'Les canaux s’embrasent d’un seul coup : le Réseau runique chante d’un bout à l’autre.';
        grille.classList.add('complet');
        setTimeout(ctx.reussir, 1500);
      }
    }
    const compteur = el('p', { class: 'centre doux' });

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Au cœur de la forteresse, un réseau de dalles gravées de canaux runiques s’est déréglé. Le Cœur (au centre) ne nourrit plus rien.' }),
        el('ul', {},
          el('li', { text: 'Touche une dalle pour la tourner d’un quart de tour (dans le sens des aiguilles d’une montre).' }),
          el('li', {}, 'Le réseau est réparé quand ', el('strong', { text: 'toutes les dalles sont reliées au Cœur' }), ', que ', el('strong', { text: 'chaque canal rejoint un canal voisin' }), ' (aucun ne s’ouvre dans le vide ou contre le bord), et qu’il n’y a ', el('strong', { text: 'aucune boucle' }), '.'),
          el('li', { text: 'Les dalles reliées au Cœur s’allument. Les petits ronds pleins marquent les bouts de canal (un seul canal).' }),
          el('li', { text: 'Il n’existe qu’une seule façon de tout réparer. La déduction simple ne suffira pas : il faudra aussi raisonner sur les boucles interdites et sur les morceaux qui resteraient isolés.' })),
        el('p', { text: 'Essais illimités. La position des dalles est gardée si tu quittes l’épreuve.' })),
      el('div', { class: 'cadre-reseau' }, grille),
      compteur,
      msg,
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'discret', text: '↺ Tout remélanger', onclick: () => { if (fini) return; for (let i = 0; i < N; i++) etat[i] = depart[i]; ctx.memoire.ecrire(etat); msg.textContent = ''; dessiner(); } })));
    dessiner();

    return {
      solution: () => {
        const lignes = [];
        for (let r = 0; r < R; r++) lignes.push(`Ligne ${r + 1} : ${sol.slice(r * C, r * C + C).map((m) => TRAIT[m]).join('')}`);
        return {
          reponse: lignes,
          pourquoi: [
            'Chaque caractère montre les canaux d’une dalle dans la bonne position (╵ vers le haut, ╶ vers la droite, ╷ vers le bas, ╴ vers la gauche, et leurs combinaisons). Le Cœur est au centre (ligne 6, 6e dalle).',
            'Un solveur a vérifié qu’aucune autre position des dalles ne relie tout le réseau sans canal ouvert ni boucle.',
            'Méthode : commencer par les bords (aucun canal ne peut pointer dehors) et les coins ; deux bouts de canal ne peuvent pas se faire face (ils formeraient un morceau isolé) ; une dalle droite (│ ou ─) n’a que deux positions ; et quand deux voisins sont déjà reliés par un autre chemin, les relier directement ferait une boucle.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'reseau', nom: 'Le Réseau runique', icone: '᛭', etoiles: 5, resume: 'Canaux à tourner', monter, souvenir: () => Sceaux.el('p', { class: 'murmure-souvenir', text: 'Le réseau est réparé, et pourtant, au centre, le Cœur n’a pas cessé : sous tes doigts, quelque chose continue de battre.' }) });
})();
