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
  const T = 9, PAS_MAX = 320;
  const ORDRES = {
    A: { signe: '⬆', nom: 'Avance' }, S: { signe: '⤒', nom: 'Saute' }, G: { signe: '↺', nom: 'Tourne à gauche' }, D: { signe: '↻', nom: 'Tourne à droite' },
    F: { signe: '✦', nom: 'Frappe' }, P: { signe: 'ⓟ', nom: 'Sous-programme ⓟ' }, Q: { signe: 'ⓠ', nom: 'Sous-programme ⓠ' }
  };
  const CAP = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // haut, droite, bas, gauche

  // Exécute { principal, sous, sous2 }. `sol(r,c)` dit si la dalle existe (sinon chute).
  // ⤒ saute par-dessus la case suivante (qui peut être vide) et atterrit deux cases plus loin.
  // Renvoie la trace ; s’arrête à PAS_MAX, à la chute, ou quand `fini()` est vrai.
  function executer(progs, depart, sol, fini) {
    let r = depart.r, c = depart.c, cap = depart.cap, pas = 0;
    const trace = [];
    const pile = [{ prog: progs.principal, i: 0 }];
    while (pile.length && pas < PAS_MAX) {
      const cadre = pile[pile.length - 1];
      if (cadre.i >= cadre.prog.length) { pile.pop(); continue; }
      const o = cadre.prog[cadre.i++];
      if (o === 'P' || o === 'Q') { if (pile.length > 80) break; pile.push({ prog: o === 'P' ? progs.sous : progs.sous2, i: 0 }); continue; }
      pas++;
      if (o === 'A' || o === 'S') {
        const n = o === 'S' ? 2 : 1;
        r += CAP[cap][0] * n; c += CAP[cap][1] * n;
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
      // Programme secret : le principal appelle ⓟ plusieurs fois, ⓟ appelle ⓠ deux fois : des répétitions imbriquées.
      const aleatoire = (n) => Array.from({ length: n }, () => h.choisir(['A', 'A', 'A', 'S', 'G', 'D', 'F', 'F']));
      const sous2 = aleatoire(h.entier(2, 4));
      const sous = aleatoire(h.entier(1, 3));
      sous.splice(h.entier(0, sous.length), 0, 'Q');
      sous.splice(h.entier(0, sous.length), 0, 'Q'); // ⓟ appelle deux fois ⓠ : boucle dans la boucle
      const principal = aleatoire(h.entier(0, 1));
      for (let n = h.entier(3, 4); n > 0; n--) principal.push('P');
      const progs = { principal, sous, sous2 };
      const tout = [...principal, ...sous, ...sous2];
      if (!tout.includes('F') || !tout.includes('S') || !tout.includes('A')) continue;
      const trace = executer(progs, { r: 0, c: 0, cap: 1 }, () => true);
      let dernier = -1; const runes = new Set();
      trace.forEach((t, k) => { if (t.o === 'F' && !runes.has(t.r + ',' + t.c)) { runes.add(t.r + ',' + t.c); dernier = k; } });
      if (runes.size < 7 || dernier < 0) continue;
      const utile = trace.slice(0, dernier + 1);
      const nbCases = principal.length + sous.length + sous2.length;
      // Très dur : au moins 34 actions, et près de 3 fois le nombre de cases disponibles.
      if (utile.length < 34 || utile.length < 2.8 * nbCases) continue;
      const cases = new Set(['0,0', ...utile.map((t) => t.r + ',' + t.c)]);
      // Cases survolées par les sauts : elles doivent rester des trous (sinon le saut ne sert à rien).
      const survol = new Set();
      utile.forEach((t) => { if (t.o === 'S') survol.add((t.r - CAP[t.cap][0]) + ',' + (t.c - CAP[t.cap][1])); });
      const trous = [...survol].filter((x) => !cases.has(x));
      if (!trous.length) continue;
      const lr = [...cases].map((x) => +x.split(',')[0]), lc = [...cases].map((x) => +x.split(',')[1]);
      const r0 = Math.min(...lr), c0 = Math.min(...lc);
      if (Math.max(...lr) - r0 >= T || Math.max(...lc) - c0 >= T) continue;
      const decale = (x) => { const [r, c] = x.split(',').map(Number); return (r - r0) * T + (c - c0); };
      const sols = new Set([...cases].map(decale));
      const interdits = new Set(trous.map(decale));
      // Quelques dalles en plus, qui ne mènent nulle part (jamais sur un trou à sauter).
      const voisins = [];
      sols.forEach((i) => CAP.forEach(([dr, dc]) => { const r = Math.floor(i / T) + dr, c = (i % T) + dc; const k = r * T + c; if (r >= 0 && c >= 0 && r < T && c < T && !sols.has(k) && !interdits.has(k)) voisins.push(k); }));
      h.melanger(voisins).slice(0, h.entier(3, 6)).forEach((i) => sols.add(i));
      return {
        sols, runes: new Set([...runes].map(decale)),
        depart: { r: -r0, c: -c0, cap: 1 },
        limites: { principal: principal.length, sous: sous.length, sous2: sous2.length }, // aucune marge
        secret: progs, longueur: utile.length
      };
    }
  }

  function monter(zone, ctx) {
    const { sols, runes, depart, limites, secret, longueur } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    const prog = {
      principal: Array.isArray(garde.principal) ? garde.principal.filter((o) => ORDRES[o]).slice(0, limites.principal) : [],
      sous: Array.isArray(garde.sous) ? garde.sous.filter((o) => ORDRES[o]).slice(0, limites.sous) : [],
      sous2: Array.isArray(garde.sous2) ? garde.sous2.filter((o) => ORDRES[o]).slice(0, limites.sous2) : []
    };
    let rangee = 'principal', enCours = null, fini = false;
    const memoriser = () => ctx.memoire.ecrire({ principal: prog.principal, sous: prog.sous, sous2: prog.sous2 });
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
      if (p.o === 'S') { golem.classList.remove('saute'); void golem.offsetWidth; golem.classList.add('saute'); }
    }
    function reinit() { cases.forEach((c) => c.classList.remove('allumee')); placer(depart, false); }

    // Le programme
    const rangees = {};
    const blocProgramme = el('div', { class: 'programme' });
    function dessinerProgramme() {
      blocProgramme.replaceChildren();
      for (const [cle, titre] of [['principal', 'Programme principal'], ['sous', 'Sous-programme ⓟ'], ['sous2', 'Sous-programme ⓠ']]) {
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
      const trace = executer(prog, depart, existe, (t) => {
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
          el('li', { text: '⤒ Saute par-dessus la case devant lui (même un trou) et atterrit deux cases plus loin.' }),
          el('li', { text: 'ⓟ / ⓠ Exécute tout le sous-programme correspondant, puis reprend là où il en était. Un sous-programme peut appeler l’autre, ou s’appeler lui-même.' })),
        el('p', { text: `Cases disponibles : ${limites.principal} pour le principal, ${limites.sous} pour ⓟ, ${limites.sous2} pour ⓠ, et pas une de plus. Le trajet demande environ ${longueur} actions : il faut trouver les motifs qui se répètent, et des répétitions imbriquées : le principal peut appeler ⓟ plusieurs fois, et ⓟ appeler ⓠ plusieurs fois. Le golem s’arrête tout seul dès que la dernière rune est frappée.` }),
        el('p', { text: 'Touche une rangée pour la choisir, puis les ordres pour la remplir. Touche un ordre déjà posé pour le retirer. Le golem regarde dans le sens de la flèche. Essais illimités.' })),
      el('div', { class: 'cadre-golem' }, salle),
      blocProgramme,
      palette,
      msg,
      el('div', { class: 'actions' }, boutonLancer,
        el('button', { type: 'button', class: 'discret', text: '✕ Effacer le programme', onclick: () => { if (enCours) return; prog.principal = []; prog.sous = []; prog.sous2 = []; memoriser(); dessinerProgramme(); reinit(); } })));
    dessinerProgramme();
    reinit();

    return {
      solution: () => ({
        reponse: [`Programme principal : ${secret.principal.map((o) => ORDRES[o].signe).join(' ')}`, `Sous-programme ⓟ : ${secret.sous.map((o) => ORDRES[o].signe).join(' ')}`, `Sous-programme ⓠ : ${secret.sous2.map((o) => ORDRES[o].signe).join(' ')}`],
        pourquoi: [
          `Ce programme frappe toutes les runes (c’est à partir de lui que la salle a été construite). D’autres programmes peuvent aussi réussir : le jeu les accepte tous.`,
          `Le trajet complet compte ${longueur} actions, mais les cases ne permettent d’en écrire que ${limites.principal + limites.sous + limites.sous2} : il faut repérer le motif qui se répète le long du chemin et l’écrire une seule fois dans le sous-programme.`,
          'Les répétitions sont imbriquées : le principal appelle ⓟ plusieurs fois, et chaque ⓟ appelle ⓠ plusieurs fois. Le golem s’arrête tout seul dès que la dernière rune est frappée.',
          'Méthode : suivre le chemin des dalles depuis le golem et noter les virages et les runes ; chercher le plus petit morceau qui, répété, redonne tout le chemin.'
        ]
      })
    };
  }

  Sceaux.enregistrerEpreuve({ id: 'golem', nom: 'Le Golem de Pierre', icone: '🗿', etoiles: 5, resume: 'Programmation', monter });
})();
