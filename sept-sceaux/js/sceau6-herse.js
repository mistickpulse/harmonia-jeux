// Sceau VI — La Herse (★★★★)
// Blocs coulissants (type Rush Hour) : faire sortir la clé par l'ouverture de droite.
// Chaque pièce ne glisse que dans son sens. Nombre de coups limité : au-delà, la herse
// retombe et tout revient au départ (essais illimités).
// Les grilles ont été générées et résolues hors ligne (solution minimale connue).
(function () {
  'use strict';
  const { el } = Sceaux;

  // 36 caractères, ligne par ligne : 'o' vide, 'A' la clé (ligne 3), autres lettres = caisses.
  const GRILLES = [
    ['oDDoGMKoEEGMKoAAGFBBJooFINJCCoINHHLL', 16],
    ['ooIGooooIGEoAAoKEDHHoKEDLBFoCCLBFoJJ', 16],
    ['KKHHoLoCCCFLAAMDFoJJMDFIGBBBoIGNNoEE', 21],
    ['oBBBMMLLGKKDAAGooDoooCoHIEECJHIFFoJo', 19],
    ['DDDoIIoGGoBHFMAABHFMEEEoKooJCCKLLJoo', 17],
    ['DBBBJLDoooJLEoAAJoEIGooHEIGFFHKKCCoH', 19],
    ['JJJooooLLLoFAAHoIFBoHoIKBGGEEKBCCDDo', 16],
    ['ooBBBKEEoFFKIAAoLJIooCLJIoDCGGooDHHH', 16],
    ['EEooHHNNDDDooAAIoCLFFIoCLoJBBKMMJGGK', 18],
    ['MDDoKoMoHFKBAAHFoBEECooJoICLLJoIGGGo', 16],
    ['HHLLLGoCCoJGooAAJoDKKKoFDMEIIFoMEoBB', 16],
    ['oooHHoKLLECoKAAECoBDDECIBoFJJIooFGGG', 16],
    ['BoDIIEBoDNMEAALNMoFFLGGKoCCCoKoJJHHH', 20],
    ['NNLLLMGoBBKMGAAoKICCoFFIoJEDDooJEoHH', 17],
    ['BGooCCBGooDHLGAADHLEEoDHooFKJJIIFKoo', 20],
    ['GoIIDDGBBCooAAKCoFooKCoFJJJoEFoHHoEo', 17],
    ['FFoHHoooLLGEAAoCGEBJJCMIBNDCMIoNDKKK', 19],
    ['GGoooIoCCCEIAABoEMLoBJoMLHHJFFDDoKKo', 21],
    ['KIIGGLKoBooLAABHooCJJHoFCooDDFCoEEoo', 16],
    ['DDIIooLLooKGEoAAKGEHCCKoEHBFFFJJBooo', 17],
    ['HoEENNHoBIIoAABoGKJoLLGKJDCCCMoDFFFM', 19],
    ['oKooFFoKCLHMAACLHMoDDBBGIoEEoGIJJJNN', 16],
    ['oLGGCCoLJJooAADooBHoDKEBHIIKEFMMMooF', 18],
    ['FFFKKoooGooIAAGooIoCCELoHBBELDHJJooD', 22],
    ['JFNGBBJFNGIMoAAoIMKoLLoDKHHHoDKEEoCC', 19],
    ['BBBoJJooFFoIAAGooIDoGLHKDMMLHKoCCoEE', 19],
    ['LNFFKKLNoBMDAAoBMDEoCCCoEoGoIIHHGJJo', 17],
    ['DDDCHKFooCHKFAACoLJJGoILoBGoIooBEEEo', 17]
  ];
  const MARGE = 10; // coups autorisés au-delà de la solution minimale

  function pieces(s) {
    const m = {};
    for (let i = 0; i < 36; i++) if (s[i] !== 'o') (m[s[i]] = m[s[i]] || []).push(i);
    return Object.entries(m).map(([c, cases]) => ({ c, cases, h: cases.length > 1 && cases[1] - cases[0] === 1 }));
  }
  // Déplace la pièce c de k cases (négatif = gauche/haut) si c'est possible, sinon null.
  function deplacer(s, c, k) {
    const p = pieces(s).find((x) => x.c === c);
    if (!p || k === 0) return null;
    const pas = p.h ? 1 : 6;
    const dir = Math.sign(k);
    for (let j = 1; j <= Math.abs(k); j++) {
      const tete = dir < 0 ? p.cases[0] - pas * j : p.cases[p.cases.length - 1] + pas * j;
      if (tete < 0 || tete >= 36) return null;
      if (p.h && Math.floor(tete / 6) !== Math.floor(p.cases[0] / 6)) return null;
      if (s[tete] !== 'o') return null;
    }
    const t = s.split('');
    p.cases.forEach((i) => { t[i] = 'o'; });
    p.cases.forEach((i) => { t[i + k * pas] = c; });
    return t.join('');
  }
  function bornes(s, c) {
    let min = 0, max = 0;
    while (deplacer(s, c, min - 1)) min--;
    while (deplacer(s, c, max + 1)) max++;
    return [min, max];
  }
  const resolu = (s) => s[17] === 'A';

  // Solution la plus courte (recherche en largeur), pour le panneau du MJ.
  function resoudre(depart) {
    const prec = new Map([[depart, null]]);
    let front = [depart];
    while (front.length) {
      const suiv = [];
      for (const s of front) {
        if (resolu(s)) {
          const chemin = [];
          for (let x = s; prec.get(x); x = prec.get(x).de) chemin.unshift(prec.get(x).coup);
          return chemin;
        }
        // Voisins : chaque pièce glisse case par case dans ses deux sens tant que c'est libre.
        for (const p of pieces(s)) {
          const pas = p.h ? 1 : 6;
          for (const dir of [-1, 1]) {
            for (let j = 1; ; j++) {
              const tete = dir < 0 ? p.cases[0] - pas * j : p.cases[p.cases.length - 1] + pas * j;
              if (tete < 0 || tete >= 36 || s[tete] !== 'o') break;
              if (p.h && Math.floor(tete / 6) !== Math.floor(p.cases[0] / 6)) break;
              const t = s.split('');
              p.cases.forEach((i) => { t[i] = 'o'; });
              p.cases.forEach((i) => { t[i + dir * j * pas] = p.c; });
              const u = t.join('');
              if (!prec.has(u)) { prec.set(u, { de: s, coup: { c: p.c, k: dir * j, h: p.h } }); suiv.push(u); }
            }
          }
        }
      }
      front = suiv;
    }
    return [];
  }

  function monter(zone, ctx) {
    const [depart, minimum] = ctx.hasard.choisir(GRILLES);
    const limite = minimum + MARGE;
    const garde = ctx.memoire.lire() || {};
    let etat = typeof garde.etat === 'string' && garde.etat.length === 36 ? garde.etat : depart;
    let coups = garde.coups | 0;
    let derniere = garde.derniere || null; // pièce du dernier coup (deux glissements d'affilée = un coup)
    let fini = false;
    const memoriser = () => ctx.memoire.ecrire({ etat, coups, derniere });

    const plateau = el('div', { class: 'plateau', role: 'group', 'aria-label': 'Grille de la herse' });
    const compteur = el('p', { class: 'compteur' });
    const msg = el('p', { class: 'message' });

    function dessiner() {
      plateau.replaceChildren(el('div', { class: 'sortie', 'aria-hidden': 'true' }));
      for (const p of pieces(etat)) {
        const l = p.cases[0] % 6, r = Math.floor(p.cases[0] / 6);
        const larg = p.h ? p.cases.length : 1, haut = p.h ? 1 : p.cases.length;
        const b = el('button', {
          type: 'button', class: 'bloc' + (p.c === 'A' ? ' cle' : '') + (p.h ? ' horizontal' : ' vertical'),
          style: `left:${l * 100 / 6}%;top:${r * 100 / 6}%;width:${larg * 100 / 6}%;height:${haut * 100 / 6}%`,
          'aria-label': p.c === 'A' ? 'La clé' : 'Caisse ' + p.c,
          text: p.c === 'A' ? '🗝' : p.c
        });
        b.addEventListener('pointerdown', (ev) => saisir(ev, b, p));
        b.addEventListener('keydown', (ev) => clavier(ev, p));
        plateau.append(b);
      }
      compteur.textContent = `Coups : ${coups} / ${limite}`;
      compteur.classList.toggle('alerte', coups >= limite - 3);
    }

    function jouer(c, k) {
      const t = deplacer(etat, c, k);
      if (!t) return false;
      etat = t;
      if (derniere !== c) coups++;
      derniere = c;
      memoriser();
      dessiner();
      if (resolu(etat)) {
        fini = true;
        plateau.querySelector('.cle')?.classList.add('sort');
        msg.className = 'message ok'; msg.textContent = 'La clé glisse sous la herse. Les chaînes se tendent : elle remonte.';
        setTimeout(ctx.reussir, 1200);
      } else if (coups > limite) {
        fini = true;
        msg.className = 'message erreur'; msg.textContent = 'Trop de coups : la herse retombe dans un fracas, tout revient au départ.';
        ctx.secouer(plateau);
        setTimeout(recommencer, 1500);
      }
      return true;
    }
    function recommencer() {
      etat = depart; coups = 0; derniere = null; fini = false;
      memoriser(); dessiner();
    }

    // Glisser au doigt ou à la souris
    function saisir(ev, b, p) {
      if (fini) return;
      ev.preventDefault();
      try { b.setPointerCapture(ev.pointerId); } catch (e) { /* suivi quand même via le bouton */ }
      const taille = plateau.clientWidth / 6;
      const [min, max] = bornes(etat, p.c);
      const x0 = ev.clientX, y0 = ev.clientY;
      let k = 0;
      const bouger = (e) => {
        const d = (p.h ? e.clientX - x0 : e.clientY - y0) / taille;
        const v = Math.max(min, Math.min(max, d));
        k = Math.round(v);
        b.style.transform = p.h ? `translateX(${v * taille}px)` : `translateY(${v * taille}px)`;
      };
      const lacher = () => {
        b.removeEventListener('pointermove', bouger);
        b.removeEventListener('pointerup', lacher);
        b.removeEventListener('pointercancel', lacher);
        b.style.transform = '';
        if (k) jouer(p.c, k); else b.focus();
      };
      b.addEventListener('pointermove', bouger);
      b.addEventListener('pointerup', lacher);
      b.addEventListener('pointercancel', lacher);
    }
    // Au clavier : flèches
    function clavier(ev, p) {
      if (fini) return;
      const sens = { ArrowLeft: p.h ? -1 : 0, ArrowRight: p.h ? 1 : 0, ArrowUp: p.h ? 0 : -1, ArrowDown: p.h ? 0 : 1 }[ev.key];
      if (!sens) return;
      ev.preventDefault();
      if (jouer(p.c, sens)) plateau.querySelector(`[aria-label="${p.c === 'A' ? 'La clé' : 'Caisse ' + p.c}"]`)?.focus();
    }

    zone.append(
      el('p', { class: 'consigne', text: 'Sous la herse, un passage encombré de caisses et de chariots. La clé doit sortir par l’ouverture, à droite. Chaque pièce ne glisse que dans le sens de sa longueur.' }),
      el('p', { class: 'doux centre petit', text: 'Fais glisser les pièces du doigt ou à la souris (ou au clavier : flèches). Plusieurs glissements d’affilée de la même pièce comptent pour un seul coup.' }),
      compteur,
      el('div', { class: 'cadre-plateau' }, plateau),
      msg,
      el('div', { class: 'actions' }, el('button', { type: 'button', class: 'discret', text: '↺ Recommencer', onclick: () => { if (!fini) recommencer(); } }))
    );
    dessiner();

    return {
      solution: () => {
        const chemin = resoudre(depart);
        const nom = (c) => (c === 'A' ? 'la clé' : 'la caisse ' + c);
        const sensTxt = (m) => (m.h ? (m.k > 0 ? 'vers la droite' : 'vers la gauche') : (m.k > 0 ? 'vers le bas' : 'vers le haut'));
        const bloquants = [...new Set(depart.slice(12, 18).split('').filter((c, i) => c !== 'o' && c !== 'A' && 12 + i > depart.lastIndexOf('A')))];
        return {
          reponse: chemin.map((m, i) => `${i + 1}. ${nom(m.c)} : ${Math.abs(m.k)} case${Math.abs(m.k) > 1 ? 's' : ''} ${sensTxt(m)}`),
          pourquoi: [
            `Au départ, ${bloquants.length ? 'la ligne de la clé est barrée par ' + bloquants.map(nom).join(', ') : 'la ligne de la clé est libre, mais les pièces se gênent'} : ${bloquants.length > 1 ? 'ces pièces ne peuvent' : 'cette pièce ne peut'} bouger qu’après avoir fait de la place au-dessus ou au-dessous.`,
            'Toute la difficulté est là : chaque caisse qui libère le passage en bloque une autre, et il faut souvent reculer une pièce pour en avancer une autre.',
            `Cette solution est la plus courte possible : ${chemin.length} coups (calculée en essayant toutes les positions). La limite du sceau est de ${limite} coups ; au-delà, la herse retombe.`
          ]
        };
      }
    };
  }

  Sceaux.enregistrer({ numero: 6, monter });
})();
