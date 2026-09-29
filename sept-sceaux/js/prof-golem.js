// Les Profondeurs — Le Golem de Pierre (★★★★★)
// On programme à l'avance un golem : ⬆ avancer, ↺ tourner à gauche, ↻ tourner à droite,
// ✦ frapper (active la rune sous lui), ⓟ appeler le sous-programme (qui peut s'appeler
// lui-même : c'est ainsi qu'on fait des boucles). Il doit frapper toutes les runes sans tomber.
// La salle est construite depuis un programme secret : une solution tient donc dans les cases
// données, et la trace complète est bien plus longue que les cases disponibles (il faut
// trouver la répétition). Plusieurs programmes peuvent réussir : tous sont acceptés.
(function () {
  'use strict';
  const { el } = Sceaux;
  const T = 8, PAS_MAX = 220;
  const ORDRES = { A: { signe: '⬆', nom: 'Avance' }, G: { signe: '↺', nom: 'Tourne à gauche' }, D: { signe: '↻', nom: 'Tourne à droite' }, F: { signe: '✦', nom: 'Frappe' }, P: { signe: 'ⓟ', nom: 'Sous-programme' } };
  const CAP = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // haut, droite, bas, gauche

  // Exécute principal + sous-programme. `sol(r,c)` dit si la case existe (sinon chute).
  // Renvoie la trace des actions ; s'arrête à PAS_MAX, à la chute, ou quand `fini()` est vrai.
  function executer(principal, sous, depart, sol, fini) {
    let r = depart.r, c = depart.c, cap = depart.cap, pas = 0;
    const trace = [];
    const pile = [{ prog: principal, i: 0 }];
    while (pile.length && pas < PAS_MAX) {
      const cadre = pile[pile.length - 1];
      if (cadre.i >= cadre.prog.length) { pile.pop(); continue; }
      const o = cadre.prog[cadre.i++];
      if (o === 'P') { if (pile.length > 60) break; pile.push({ prog: sous, i: 0 }); continue; }
      pas++;
      if (o === 'A') {
        r += CAP[cap][0]; c += CAP[cap][1];
        if (!sol(r, c)) { trace.push({ o, r, c, cap, chute: true }); return trace; }
      } else if (o === 'G') cap = (cap + 3) % 4;
      else if (o === 'D') cap = (cap + 1) % 4;
      trace.push({ o, r, c, cap });
      if (o === 'F' && fini && fini(trace)) return trace;
    }
    return trace;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      // Un programme secret : principal court, sous-programme qui boucle (s'appelle lui-même).
      const aleatoire = (n, sansP) => Array.from({ length: n }, () => h.choisir(sansP ? ['A', 'A', 'A', 'G', 'D', 'F'] : ['A', 'A', 'G', 'D', 'F']));
      const sous = aleatoire(h.entier(4, 6), true);
      if (h.reel() < 0.8) sous.push('P'); // récursion : la boucle
      const principal = aleatoire(h.entier(1, 3), true).concat(['P']);
      if (!sous.includes('F') || !sous.includes('A')) continue;
      // Exécution dans le vide infini, puis on garde la trace jusqu'à la dernière frappe utile.
      const trace = executer(principal, sous, { r: 0, c: 0, cap: 1 }, () => true);
      let dernier = -1; const runes = new Set();
      trace.forEach((t, k) => { if (t.o === 'F' && !runes.has(t.r + ',' + t.c)) { runes.add(t.r + ',' + t.c); dernier = k; } });
      if (runes.size < 5 || dernier < 0) continue;
      const utile = trace.slice(0, dernier + 1);
      const cases = new Set(['0,0', ...utile.map((t) => t.r + ',' + t.c)]);
      const lr = [...cases].map((x) => +x.split(',')[0]), lc = [...cases].map((x) => +x.split(',')[1]);
      const r0 = Math.min(...lr), c0 = Math.min(...lc);
      if (Math.max(...lr) - r0 >= T || Math.max(...lc) - c0 >= T) continue;
      // Trop facile si la trace tient presque dans les cases : il faut devoir trouver la boucle.
      if (utile.length < 2.2 * (principal.length + sous.length) || utile.length < 22) continue;
      const decale = (x) => { const [r, c] = x.split(',').map(Number); return (r - r0) * T + (c - c0); };
      const sols = new Set([...cases].map(decale));
      // Quelques dalles en plus, qui ne mènent nulle part (des pièges pour l'œil).
      const voisins = [];
      sols.forEach((i) => CAP.forEach(([dr, dc]) => { const r = Math.floor(i / T) + dr, c = (i % T) + dc; if (r >= 0 && c >= 0 && r < T && c < T && !sols.has(r * T + c)) voisins.push(r * T + c); }));
      h.melanger(voisins).slice(0, h.entier(3, 6)).forEach((i) => sols.add(i));
      return {
        sols, runes: new Set([...runes].map(decale)),
        depart: { r: -r0, c: -c0, cap: 1 },
        limites: { principal: principal.length + 1, sous: sous.length + 1 },
        secret: { principal, sous }, longueur: utile.length
      };
    }
  }

  function monter(zone, ctx) {
    const { sols, runes, depart, limites, secret, longueur } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    const prog = {
      principal: Array.isArray(garde.principal) ? garde.principal.filter((o) => ORDRES[o]).slice(0, limites.principal) : [],
      sous: Array.isArray(garde.sous) ? garde.sous.filter((o) => ORDRES[o]).slice(0, limites.sous) : []
    };
    let rangee = 'principal', enCours = null, fini = false;
    const memoriser = () => ctx.memoire.ecrire({ principal: prog.principal, sous: prog.sous });
    const existe = (r, c) => r >= 0 && c >= 0 && r < T && c < T && sols.has(r * T + c);

    // La salle
    const salle = el('div', { class: 'salle-golem', role: 'grid', 'aria-label': 'Salle du golem' });
    const cases = [];
    for (let i = 0; i < T * T; i++) {
      const c = el('div', { class: 'dalle-golem' + (sols.has(i) ? ' sol' : ' vide') + (runes.has(i) ? ' rune' : '') }, runes.has(i) ? el('span', { text: 'ᛉ' }) : null);
      cases.push(c); salle.append(c);
    }
    const golem = el('div', { class: 'golem', 'aria-label': 'Le golem' }, el('span', { class: 'corps' }, el('span', { class: 'yeux', text: '▲' })));
    salle.append(golem);
    function placer(p, animer) {
      golem.style.transitionDuration = animer ? '' : '0ms';
      golem.style.left = `${p.c * 100 / T}%`; golem.style.top = `${p.r * 100 / T}%`;
      golem.querySelector('.corps').style.transform = `rotate(${p.cap * 90}deg)`;
      golem.classList.toggle('tombe', !!p.chute);
    }
    function reinit() { cases.forEach((c) => c.classList.remove('allumee')); placer(depart, false); }

    // Le programme
    const rangees = {};
    const blocProgramme = el('div', { class: 'programme' });
    function dessinerProgramme() {
      blocProgramme.replaceChildren();
      for (const [cle, titre] of [['principal', 'Programme principal'], ['sous', 'Sous-programme ⓟ']]) {
        const ligne = el('div', { class: 'rangee-prog' + (rangee === cle ? ' active' : ''), onclick: () => { rangee = cle; dessinerProgramme(); } },
          el('span', { class: 'titre-rangee', text: `${titre} (${prog[cle].length}/${limites[cle]})` }),
          el('div', { class: 'cases-prog' }, Array.from({ length: limites[cle] }, (x, k) => {
            const o = prog[cle][k];
            return el('button', {
              type: 'button', class: 'case-prog' + (o ? ' pleine' : ''), text: o ? ORDRES[o].signe : '', 'aria-label': o ? `${ORDRES[o].nom} (retirer)` : 'Case vide',
              onclick: (ev) => { ev.stopPropagation(); if (enCours || !o) { rangee = cle; dessinerProgramme(); return; } prog[cle].splice(k, 1); memoriser(); rangee = cle; dessinerProgramme(); }
            });
          })));
        rangees[cle] = ligne;
        blocProgramme.append(ligne);
      }
    }
    const palette = el('div', { class: 'palette-golem' }, Object.entries(ORDRES).map(([k, v]) => el('button', {
      type: 'button', class: 'ordre', 'aria-label': v.nom, title: v.nom,
      onclick: () => { if (enCours || prog[rangee].length >= limites[rangee]) return; prog[rangee].push(k); memoriser(); dessinerProgramme(); }
    }, el('span', { class: 'signe', text: v.signe }), el('span', { class: 'nom', text: v.nom }))));

    const msg = el('p', { class: 'message' });
    const boutonLancer = el('button', { type: 'button', text: '▶ Lancer le golem', onclick: () => (enCours ? arreter() : lancer()) });
    function arreter() { if (enCours) { clearTimeout(enCours); enCours = null; } boutonLancer.textContent = '▶ Lancer le golem'; }
    function lancer() {
      if (fini) return;
      reinit(); msg.className = 'message'; msg.textContent = '';
      const allumees = new Set();
      const trace = executer(prog.principal, prog.sous, depart, existe, (t) => {
        const d = t[t.length - 1]; const i = d.r * T + d.c; if (runes.has(i)) allumees.add(i); return allumees.size === runes.size;
      });
      const vues = new Set();
      boutonLancer.textContent = '⏹ Arrêter';
      let k = 0;
      (function pas() {
        if (k >= trace.length) {
          enCours = null; boutonLancer.textContent = '▶ Lancer le golem';
          if (vues.size === runes.size) {
            fini = true; msg.className = 'message ok'; msg.textContent = 'La dernière rune s’embrase. Le golem s’immobilise et s’incline.';
            setTimeout(ctx.reussir, 1300);
          } else if (trace.length && trace[trace.length - 1].chute) {
            msg.className = 'message erreur'; msg.textContent = 'Le golem a marché dans le vide et s’écrase au fond du gouffre. Corrige son programme.';
          } else {
            msg.className = 'message erreur';
            msg.textContent = trace.length >= PAS_MAX ? 'Le golem tourne en rond sans fin : il manque une frappe, ou la boucle se répète mal.' : `Le programme est terminé, mais il reste ${runes.size - vues.size} rune${runes.size - vues.size > 1 ? 's' : ''} éteinte${runes.size - vues.size > 1 ? 's' : ''}.`;
          }
          return;
        }
        const t = trace[k++];
        placer(t, true);
        if (t.o === 'F') {
          golem.classList.remove('frappe'); void golem.offsetWidth; golem.classList.add('frappe');
          const i = t.r * T + t.c; if (runes.has(i)) { vues.add(i); cases[i].classList.add('allumee'); }
        }
        enCours = setTimeout(pas, t.chute ? 700 : 260);
      })();
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Un golem de pierre attend sur des dalles suspendues au-dessus du vide. Il doit frapper toutes les runes ᛉ de la salle. On ne le dirige pas : on écrit son programme à l’avance, puis on le lance.' }),
        el('ul', {},
          el('li', { text: '⬆ Avance d’une dalle (s’il n’y a pas de dalle, il tombe).' }),
          el('li', { text: '↺ / ↻ Tourne sur place d’un quart de tour, à gauche ou à droite.' }),
          el('li', { text: '✦ Frappe la dalle sous lui : une rune s’y allume.' }),
          el('li', { text: 'ⓟ Exécute tout le sous-programme, puis reprend là où il en était.' })),
        el('p', { text: `Le programme principal a ${limites.principal} cases, le sous-programme ${limites.sous}. C’est trop peu pour tout écrire à la main (le trajet demande environ ${longueur} actions) : il faut trouver ce qui se répète. Astuce : un sous-programme peut s’appeler lui-même (ⓟ à la fin du sous-programme), et le golem recommence alors en boucle, jusqu’à ce que toutes les runes soient allumées.` }),
        el('p', { text: 'Touche une rangée pour la choisir, puis les ordres pour la remplir. Touche un ordre déjà posé pour le retirer. Le golem regarde dans le sens de la flèche. Essais illimités.' })),
      el('div', { class: 'cadre-golem' }, salle),
      blocProgramme,
      palette,
      msg,
      el('div', { class: 'actions' }, boutonLancer,
        el('button', { type: 'button', class: 'discret', text: '✕ Effacer le programme', onclick: () => { if (enCours) return; prog.principal = []; prog.sous = []; memoriser(); dessinerProgramme(); reinit(); } })));
    dessinerProgramme();
    reinit();

    return {
      solution: () => ({
        reponse: [`Programme principal : ${secret.principal.map((o) => ORDRES[o].signe).join(' ')}`, `Sous-programme ⓟ : ${secret.sous.map((o) => ORDRES[o].signe).join(' ')}`],
        pourquoi: [
          `Ce programme frappe toutes les runes (c’est à partir de lui que la salle a été construite). D’autres programmes peuvent aussi réussir : le jeu les accepte tous.`,
          `Le trajet complet compte ${longueur} actions, mais les cases ne permettent d’en écrire que ${limites.principal + limites.sous} : il faut repérer le motif qui se répète le long du chemin et l’écrire une seule fois dans le sous-programme.`,
          'Le ⓟ à la fin du sous-programme le fait recommencer : c’est une boucle. Le golem s’arrête tout seul dès que la dernière rune est frappée.',
          'Méthode : suivre le chemin des dalles depuis le golem et noter les virages et les runes ; chercher le plus petit morceau qui, répété, redonne tout le chemin.'
        ]
      })
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'golem', nom: 'Le Golem de Pierre', icone: '🗿', etoiles: 5, resume: 'Programmation', monter });
})();
