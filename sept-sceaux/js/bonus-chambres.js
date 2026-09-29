// Bonus — Les Chambres Fortes (★★★★)
// Démineur sans hasard : une grille de salles, certaines piégées. Chaque salle ouverte indique
// combien de salles piégées la touchent (diagonales comprises). La grille n'est acceptée que si
// un solveur peut tout ouvrir par déduction pure, depuis l'entrée, sans jamais deviner.
(function () {
  'use strict';
  const { el } = Sceaux;
  const L = 9, H = 9, PIEGES = 16;
  const voisins = (i) => {
    const r = Math.floor(i / L), c = i % L, v = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < H && cc >= 0 && cc < L) v.push(rr * L + cc);
    }
    return v;
  };
  const VOISINS = Array.from({ length: L * H }, (x, i) => voisins(i));

  // Ouvre une salle et, si elle ne touche aucun piège, toutes ses voisines (en cascade).
  function ouvrir(i, pieges, ouvertes) {
    const pile = [i];
    while (pile.length) {
      const k = pile.pop();
      if (ouvertes.has(k)) continue;
      ouvertes.add(k);
      if (VOISINS[k].every((v) => !pieges.has(v))) VOISINS[k].forEach((v) => { if (!ouvertes.has(v)) pile.push(v); });
    }
  }

  // Solveur par déduction : règles simples + règle des sous-ensembles. Renvoie le nombre
  // d'étapes s'il ouvre tout, sinon -1 (il faudrait deviner).
  // `deja` : salles déjà ouvertes par le joueur (pour vérifier la suite après un passage de 8run0).
  function resoudre(pieges, depart, deja) {
    const ouvertes = new Set(deja || []), marques = new Set();
    ouvrir(depart, pieges, ouvertes);
    let etapes = 0;
    for (;;) {
      let change = false;
      const contraintes = [];
      for (const k of ouvertes) {
        const inconnues = VOISINS[k].filter((v) => !ouvertes.has(v) && !marques.has(v));
        if (!inconnues.length) continue;
        const reste = VOISINS[k].filter((v) => pieges.has(v)).length - VOISINS[k].filter((v) => marques.has(v)).length;
        if (reste === 0) { inconnues.forEach((v) => ouvrir(v, pieges, ouvertes)); change = true; }
        else if (reste === inconnues.length) { inconnues.forEach((v) => marques.add(v)); change = true; }
        else contraintes.push({ inconnues, reste });
      }
      if (!change) {
        for (const a of contraintes) {
          for (const b of contraintes) {
            if (a === b || a.inconnues.length >= b.inconnues.length) continue;
            if (!a.inconnues.every((v) => b.inconnues.includes(v))) continue;
            const diff = b.inconnues.filter((v) => !a.inconnues.includes(v));
            const r = b.reste - a.reste;
            if (r === 0) { diff.forEach((v) => ouvrir(v, pieges, ouvertes)); change = true; }
            else if (r === diff.length) { diff.forEach((v) => marques.add(v)); change = true; }
            if (change) break;
          }
          if (change) break;
        }
      }
      if (!change) break;
      etapes++;
    }
    return ouvertes.size === L * H - PIEGES ? etapes : -1;
  }

  function generer(h) {
    for (let essai = 0; ; essai++) {
      const depart = h.entier(0, L * H - 1);
      const interdit = new Set([depart, ...VOISINS[depart]]);
      const libres = h.melanger([...Array(L * H).keys()].filter((i) => !interdit.has(i)));
      const pieges = new Set(libres.slice(0, PIEGES));
      const etapes = resoudre(pieges, depart);
      // Assez de déductions pour que ce soit une vraie épreuve, mais toujours sans hasard.
      if (etapes >= 12 || (etapes >= 0 && essai > 300)) return { depart, pieges, etapes };
    }
  }

  function monter(zone, ctx) {
    const { depart, pieges: origine, etapes } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    // La ronde de 8run0 déplace les pièges : on garde leur position actuelle.
    let pieges = new Set(Array.isArray(garde.pieges) && garde.pieges.length === PIEGES ? garde.pieges : [...origine]);
    const compte = (i) => VOISINS[i].filter((v) => pieges.has(v)).length;
    let ouvertes = new Set(Array.isArray(garde.ouvertes) ? garde.ouvertes.filter((i) => !pieges.has(i)) : []);
    let marques = new Set(Array.isArray(garde.marques) ? garde.marques : []);
    if (!ouvertes.size) ouvrir(depart, pieges, ouvertes);
    let pas = garde.pas | 0;          // salles ouvertes depuis le dernier passage de 8run0
    let ronde = garde.ronde | 0;      // nombre de passages
    let position = Number.isInteger(garde.position) ? garde.position : depart; // où se tient 8run0
    let mode = 'ouvrir';
    let fige = false;
    const memoriser = () => ctx.memoire.ecrire({ ouvertes: [...ouvertes], marques: [...marques], pieges: [...pieges], pas, ronde, position });

    // Toutes les RYTHME salles ouvertes, 8run0 déplace un piège vers une salle fermée. Le plan doit
    // rester soluble par déduction depuis la situation du joueur ; sinon il passe sans rien toucher.
    // On préfère un déplacement qui change des chiffres visibles (c'est tout l'intérêt).
    const RYTHME = 8;
    function passage8run0() {
      ronde++;
      const h = Sceaux.hasard(ctx.code + ':ronde:' + ronde);
      const avant = new Map([...ouvertes].map((i) => [i, compte(i)]));
      const fermees = [...Array(L * H).keys()].filter((i) => !ouvertes.has(i) && !pieges.has(i) && i !== depart);
      const essais = [];
      for (const t of pieges) for (const u of fermees) essais.push([t, u]);
      const visible = (t, u) => [...VOISINS[t], ...VOISINS[u]].some((v) => ouvertes.has(v));
      const ordre = h.melanger(essais).sort((a, b) => visible(b[0], b[1]) - visible(a[0], a[1]));
      for (const [t, u] of ordre.slice(0, 400)) {
        const nouveaux = new Set(pieges); nouveaux.delete(t); nouveaux.add(u);
        if (resoudre(nouveaux, depart, ouvertes) >= 0) {
          pieges = nouveaux;
          position = u;
          return [...ouvertes].filter((i) => compte(i) !== avant.get(i));
        }
      }
      return null; // aucun déplacement sûr : il passe son chemin
    }

    const grille = el('div', { class: 'chambres', role: 'grid', 'aria-label': 'Plan des chambres fortes' });
    const jeton = el('img', { class: 'jeton-8run0', src: 'img/8run0.png', alt: '8run0, le gardien de la ronde' });
    const compteur = el('p', { class: 'compteur' });
    const msg = el('p', { class: 'message' });
    const boutonMode = el('button', { type: 'button', class: 'discret', onclick: () => { mode = mode === 'ouvrir' ? 'marquer' : 'ouvrir'; dessiner(); } });

    function dessiner(declenche, changees) {
      grille.replaceChildren();
      for (let i = 0; i < L * H; i++) {
        const ouverte = ouvertes.has(i), marquee = marques.has(i);
        const n = ouverte ? compte(i) : 0;
        const b = el('button', {
          type: 'button', class: 'salle' + (ouverte ? ' ouverte n' + n : '') + (marquee ? ' marquee' : '') + (i === declenche ? ' piege' : '') + (i === depart ? ' entree' : '') + (changees && changees.includes(i) ? ' changee' : ''),
          text: i === declenche ? '✹' : ouverte ? (n || '') : marquee ? '⚑' : '',
          'aria-label': ouverte ? `Salle ouverte, ${n} piège${n > 1 ? 's' : ''} autour` : marquee ? 'Salle marquée comme piégée' : 'Salle fermée',
          onclick: () => agir(i, mode),
          oncontextmenu: (ev) => { ev.preventDefault(); agir(i, 'marquer'); }
        });
        // Appui long sur téléphone = marquer.
        let minuterie = null;
        b.addEventListener('touchstart', () => { minuterie = setTimeout(() => { minuterie = 'fait'; agir(i, 'marquer'); }, 450); }, { passive: true });
        b.addEventListener('touchend', (ev) => { if (minuterie === 'fait') ev.preventDefault(); else clearTimeout(minuterie); minuterie = null; });
        grille.append(b);
      }
      // Le jeton de 8run0, posé sur la salle où il se tient.
      jeton.style.left = `${(position % L) * 100 / L}%`;
      jeton.style.top = `${Math.floor(position / L) * 100 / H}%`;
      grille.append(jeton);
      const reste = RYTHME - pas;
      compteur.textContent = `Pièges : ${PIEGES} · marqués : ${marques.size} · 8run0 repasse dans ${reste} coup${reste > 1 ? 's' : ''}`;
      boutonMode.textContent = mode === 'ouvrir' ? 'Mode : ouvrir une salle (touche pour passer en « marquer »)' : 'Mode : marquer un piège ⚑ (touche pour passer en « ouvrir »)';
      boutonMode.classList.toggle('mode-marquer', mode === 'marquer');
    }

    function agir(i, action) {
      if (fige || ouvertes.has(i)) return;
      if (action === 'marquer') {
        if (marques.has(i)) marques.delete(i); else marques.add(i);
        memoriser(); dessiner(); return;
      }
      if (marques.has(i)) return; // une salle marquée ne s'ouvre pas par erreur
      if (pieges.has(i)) {
        fige = true;
        dessiner(i);
        msg.className = 'message erreur';
        msg.textContent = 'La rune de garde s’embrase ! Les chambres se referment : tout est à recommencer depuis l’entrée.';
        ctx.secouer(grille);
        setTimeout(() => {
          // Tout revient au plan d'origine, 8run0 compris.
          pieges = new Set(origine); pas = 0; ronde = 0; position = depart;
          ouvertes = new Set(); marques = new Set(); ouvrir(depart, pieges, ouvertes);
          fige = false; memoriser(); dessiner();
        }, 1800);
        return;
      }
      ouvrir(i, pieges, ouvertes);
      msg.className = 'message'; msg.textContent = '';
      if (ouvertes.size === L * H - PIEGES) {
        memoriser(); dessiner();
        fige = true;
        msg.className = 'message ok'; msg.textContent = 'La dernière salle s’ouvre sur le coffre : aucun piège n’a joué, et 8run0 s’incline.';
        setTimeout(ctx.reussir, 1200);
        return;
      }
      // La ronde : 8run0 avance d'une salle à chaque coup, et réécrit une rune tous les RYTHME coups.
      pas++;
      const pres = VOISINS[position].filter((v) => !pieges.has(v));
      if (pres.length) position = pres[Math.floor(Math.random() * pres.length)];
      let changees = null;
      if (pas >= RYTHME) {
        pas = 0;
        changees = passage8run0();
        msg.className = 'message ronde';
        msg.textContent = changees === null
          ? '8run0 passe, observe le plan… et repart sans rien toucher.'
          : changees.length
            ? `8run0 passe et réécrit une rune : ${changees.length} chiffre${changees.length > 1 ? 's ont' : ' a'} changé (en doré). Tes marques ⚑ sont-elles toujours justes ?`
            : '8run0 passe et déplace une rune, loin des salles ouvertes… Tes marques ⚑ sont-elles toujours justes ?';
      }
      memoriser(); dessiner(null, changees);
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve' },
        el('h3', { text: 'La règle' }),
        el('p', { text: `Ce plan montre ${L * H} salles ; ${PIEGES} d’entre elles cachent une rune de garde. Tu entres par la salle marquée d’un liseré doré, déjà ouverte avec ses voisines.` }),
        el('p', { text: 'Chaque salle ouverte affiche un chiffre : le nombre de salles piégées qui la touchent, en comptant les diagonales (jusqu’à 8 voisines). Une salle vide ne touche aucun piège.' }),
        el('p', { text: 'Ouvre toutes les salles sans piège. Marque ⚑ celles dont tu es sûr qu’elles sont piégées (bouton de mode, appui long sur téléphone, clic droit sur ordinateur). Ouvrir un piège referme tout.' }),
        el('p', {}, el('img', { class: 'portrait-8run0', src: 'img/8run0.png', alt: '' }),
          el('strong', { text: 'La ronde de 8run0. ' }),
          `Le gardien silencieux arpente les chambres. Tous les ${RYTHME} coups, il déplace une rune de garde vers une autre salle fermée : les chiffres autour peuvent changer (ils brillent alors en doré), et une salle que tu avais marquée ⚑ peut ne plus être piégée. Il ne touche jamais une salle déjà ouverte, et s’arrange toujours pour que le plan reste soluble par déduction, sans jamais avoir à parier.`)),
      compteur,
      el('div', { class: 'actions' }, boutonMode),
      el('div', { class: 'cadre-chambres' }, grille),
      msg
    );
    dessiner();

    return {
      solution: () => {
        const lignes = [];
        for (let r = 0; r < H; r++) {
          let t = '';
          for (let c = 0; c < L; c++) { const i = r * L + c; t += pieges.has(i) ? '✹ ' : i === depart ? '◎ ' : '· '; }
          lignes.push(`Ligne ${r + 1} : ${t.trim()}`);
        }
        return {
          reponse: ['✹ = piège, · = salle sûre, ◎ = entrée.', ...lignes],
          pourquoi: [
            `Ce plan se résout sans deviner, en ${etapes} vagues de déductions (vérifié par un solveur).`,
            'Règle 1 : si un chiffre a déjà autant de voisines marquées ⚑ que sa valeur, toutes ses autres voisines fermées sont sûres.',
            'Règle 2 : si un chiffre a exactement autant de voisines fermées que sa valeur, elles sont toutes piégées.',
            'Règle 3 (quand on bloque) : comparer deux chiffres voisins. Si les salles fermées autour de l’un sont toutes aussi autour de l’autre, la différence de leurs valeurs dit combien de pièges se cachent dans les salles en plus.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrerBonus({
    id: 'chambres', titre: 'Les Chambres Fortes',
    description: 'Un démineur sans hasard, 81 salles, 16 pièges… et 8run0 qui fait sa ronde en déplaçant les runes.',
    resume: (reussi) => (reussi ? 'Réussi ✓' : null),
    monter
  });
})();
