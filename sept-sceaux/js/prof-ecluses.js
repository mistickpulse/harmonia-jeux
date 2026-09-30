// Les Profondeurs — Les Écluses (★★★★★)
// Quatre cuves de tailles différentes, un système fermé (ni source ni vidange) : on ne peut que
// verser une cuve dans une autre, jusqu'à ce que la première soit vide ou la seconde pleine.
// La vanne s'ouvre quand DEUX cuves contiennent en même temps une quantité exacte, et le
// mécanisme ne supporte que le nombre minimal de manœuvres (calculé par parcours en largeur).
(function () {
  'use strict';
  const { el } = Sceaux;
  const NOMS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚱ'];
  const NB = 4;

  const cle = (e) => e.join(',');
  function verser(e, cap, i, j) {
    if (i === j || !e[i] || e[j] === cap[j]) return null;
    const q = Math.min(e[i], cap[j] - e[j]);
    const f = e.slice(); f[i] -= q; f[j] += q;
    return f;
  }

  // Parcours en largeur depuis l'état initial : distance, nombre de plus courts chemins, parent.
  function explorer(cap, depart) {
    const info = new Map([[cle(depart), { e: depart, d: 0, n: 1, p: null, m: null }]]);
    let front = [depart];
    while (front.length) {
      const suivant = [];
      for (const e of front) {
        const a = info.get(cle(e));
        for (let i = 0; i < NB; i++) for (let j = 0; j < NB; j++) {
          const f = verser(e, cap, i, j); if (!f) continue;
          const k = cle(f), b = info.get(k);
          if (!b) { info.set(k, { e: f, d: a.d + 1, n: a.n, p: cle(e), m: [i, j] }); suivant.push(f); }
          else if (b.d === a.d + 1) b.n += a.n;
        }
      }
      front = suivant;
    }
    return info;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      const cap = [];
      while (cap.length < NB) { const c = h.entier(4, 19); if (!cap.includes(c)) cap.push(c); }
      const depart = cap.map((c) => h.entier(0, c));
      if (depart.filter((x) => x > 0).length < 2) continue;
      const info = explorer(cap, depart);
      // Objectif : deux cuves (i, j) avec des quantités (a, b) ; distance = premier état qui l'atteint.
      const objectifs = new Map();
      for (const s of info.values()) {
        for (let i = 0; i < NB; i++) for (let j = i + 1; j < NB; j++) {
          const k = `${i}:${j}:${s.e[i]}:${s.e[j]}`, o = objectifs.get(k);
          if (!o || s.d < o.d) objectifs.set(k, { i, j, a: s.e[i], b: s.e[j], d: s.d, n: s.n, etats: [s] });
          else if (s.d === o.d) { o.n += s.n; o.etats.push(s); }
        }
      }
      // Très dur : au moins 14 manœuvres et au plus 6 suites aussi courtes (on relâche un peu si rien ne vient).
      const minCoups = essai < 300 ? 14 : 13, maxChemins = essai < 300 ? 6 : 12;
      const bons = [...objectifs.values()].filter((o) => o.d >= minCoups && o.n <= maxChemins && o.a > 0 && o.b > 0 && o.a < cap[o.i] && o.b < cap[o.j] && o.a !== o.b
        && o.a !== depart[o.i] && o.b !== depart[o.j]);
      if (!bons.length) { if (essai > 2000) throw new Error('écluses introuvables'); continue; }
      // Le plus dur : la plus grande distance, puis le moins de chemins les plus courts.
      bons.sort((x, y) => y.d - x.d || x.n - y.n);
      const o = bons[0];
      const chemin = [];
      for (let s = o.etats[0]; s.p !== null; s = info.get(s.p)) chemin.unshift(s.m);
      return { cap, depart, objectif: o, chemin };
    }
  }

  function monter(zone, ctx) {
    const { cap, depart, objectif, chemin } = generer(ctx.hasard);
    const LIMITE = objectif.d;
    const garde = ctx.memoire.lire();
    let coups = [];
    let etat = depart.slice();
    if (Array.isArray(garde)) for (const m of garde) {
      const f = Array.isArray(m) ? verser(etat, cap, m[0], m[1]) : null;
      if (!f || coups.length >= LIMITE) break;
      etat = f; coups.push(m);
    }
    let choisie = null, fini = false;
    const hauteurMax = Math.max(...cap);
    const atteint = () => etat[objectif.i] === objectif.a && etat[objectif.j] === objectif.b;

    const cuves = cap.map((c, k) => {
      const eau = el('div', { class: 'eau-ecluse' });
      const reperes = el('div', { class: 'reperes-ecluse' }, Array.from({ length: c - 1 }, (x, n) => el('span', { style: `bottom:${(n + 1) * 100 / c}%` })));
      const cible = k === objectif.i || k === objectif.j
        ? el('div', { class: 'cible-ecluse', style: `bottom:${(k === objectif.i ? objectif.a : objectif.b) * 100 / c}%` }) : null;
      const quantite = el('span', { class: 'quantite-ecluse' });
      const bouton = el('button', {
        type: 'button', class: 'cuve-ecluse', 'aria-label': `Cuve ${NOMS[k]}, contenance ${c}`,
        onclick: () => toucher(k)
      },
        el('span', { class: 'rune-ecluse', text: NOMS[k] }),
        el('div', { class: 'verre-ecluse', style: `height:${Math.round(40 + 60 * c / hauteurMax)}%` }, eau, reperes, cible),
        quantite,
        el('span', { class: 'contenance-ecluse', text: `contient ${c}` }));
      return { bouton, eau, quantite };
    });
    const compteur = el('p', { class: 'centre doux' });
    const msg = el('p', { class: 'message' });

    function dessiner() {
      cuves.forEach((v, k) => {
        v.eau.style.height = `${etat[k] * 100 / cap[k]}%`;
        v.quantite.textContent = `${etat[k]} / ${cap[k]}`;
        v.bouton.classList.toggle('choisie', choisie === k);
        v.bouton.classList.toggle('objectif', k === objectif.i || k === objectif.j);
      });
      compteur.textContent = `Manœuvres : ${coups.length} / ${LIMITE}`;
    }
    function toucher(k) {
      if (fini) return;
      msg.className = 'message'; msg.textContent = '';
      if (choisie === null) {
        if (!etat[k]) { msg.className = 'message erreur'; msg.textContent = `La cuve ${NOMS[k]} est vide : rien à verser.`; return; }
        choisie = k; dessiner(); return;
      }
      if (choisie === k) { choisie = null; dessiner(); return; }
      if (coups.length >= LIMITE) {
        choisie = null; dessiner(); ctx.secouer(zone);
        msg.className = 'message erreur'; msg.textContent = 'Le mécanisme est bloqué : plus aucune manœuvre possible. Annule ou recommence.'; return;
      }
      const f = verser(etat, cap, choisie, k);
      if (!f) { msg.className = 'message erreur'; msg.textContent = `La cuve ${NOMS[k]} est déjà pleine.`; choisie = null; dessiner(); return; }
      coups.push([choisie, k]); etat = f; choisie = null;
      ctx.memoire.ecrire(coups);
      dessiner();
      verifier();
    }
    function verifier() {
      if (atteint()) {
        fini = true; msg.className = 'message ok';
        msg.textContent = 'Un grondement sourd : la vanne pivote, et l’eau s’engouffre dans l’écluse.';
        setTimeout(ctx.reussir, 1300);
      } else if (coups.length >= LIMITE) {
        ctx.secouer(zone);
        msg.className = 'message erreur';
        msg.textContent = 'Le mécanisme s’est bloqué, et la vanne reste close. Annule des manœuvres ou recommence.';
      }
    }
    function annuler() {
      if (fini || !coups.length) return;
      coups.pop(); etat = depart.slice();
      for (const m of coups) etat = verser(etat, cap, m[0], m[1]);
      choisie = null; ctx.memoire.ecrire(coups); msg.className = 'message'; msg.textContent = ''; dessiner();
    }
    function recommencer() {
      if (fini) return;
      coups = []; etat = depart.slice(); choisie = null; ctx.memoire.ecrire(coups); msg.className = 'message'; msg.textContent = ''; dessiner();
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Sous la forteresse, quatre cuves de bronze alimentent une écluse. L’eau ne se crée ni ne se perd : on peut seulement verser une cuve dans une autre.' }),
        el('ul', {},
          el('li', { text: 'Touche une cuve, puis celle où verser. L’eau coule jusqu’à ce que la première soit vide, ou que la seconde soit pleine : on ne peut pas s’arrêter entre les deux.' }),
          el('li', {}, 'La vanne s’ouvre quand, ', el('strong', { text: `au même moment, la cuve ${NOMS[objectif.i]} contient exactement ${objectif.a} et la cuve ${NOMS[objectif.j]} exactement ${objectif.b}` }), '. Les traits dorés marquent ces niveaux.'),
          el('li', {}, 'Le vieux mécanisme ne supporte que ', el('strong', { text: `${LIMITE} manœuvres` }), ' : c’est le plus petit nombre possible. Pas une de trop.')),
        el('p', { text: 'Essais illimités : « Annuler » défait la dernière manœuvre, « Recommencer » remet l’eau comme au départ. Un papier et un crayon aident beaucoup.' })),
      el('div', { class: 'salle-ecluses' }, cuves.map((v) => v.bouton)),
      compteur,
      msg,
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'discret', text: '↶ Annuler', onclick: annuler }),
        el('button', { type: 'button', class: 'discret', text: '↺ Recommencer', onclick: recommencer })));
    dessiner();
    if (coups.length) verifier();

    return {
      solution: () => {
        let e = depart.slice();
        const etapes = chemin.map(([i, j], n) => {
          e = verser(e, cap, i, j);
          return `${n + 1}. ${NOMS[i]} → ${NOMS[j]}   (${e.map((x, k) => `${NOMS[k]} ${x}`).join(' · ')})`;
        });
        return {
          reponse: etapes,
          pourquoi: [
            `Départ : ${depart.map((x, k) => `${NOMS[k]} ${x}/${cap[k]}`).join(' · ')}. But : ${NOMS[objectif.i]} = ${objectif.a} et ${NOMS[objectif.j]} = ${objectif.b} en même temps.`,
            `Un ordinateur a essayé toutes les suites de manœuvres possibles : il en faut au moins ${LIMITE}, et celle-ci y arrive en ${LIMITE}. ${objectif.n > 1 ? `Il existe ${objectif.n} suites aussi courtes ; le jeu accepte toutes celles qui arrivent au but.` : 'C’est la seule suite aussi courte.'}`,
            'Méthode : chercher en partant de la fin. Quelle cuve peut « mesurer » la quantité voulue (une cuve pleine versée dans une cuve partiellement remplie, une différence de contenances) ? Puis remonter vers l’état de départ.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'ecluses', nom: 'Les Écluses', icone: '⚱', etoiles: 5, resume: 'Transvasements', monter });
})();
