// Les Profondeurs — Le Registre chiffré (sous-boss, ★★★★★)
// Chiffre de Vigenère (« chiffre des scribes de Karak-Durn ») : une clé de 7 à 9 lettres, un long
// rapport d'archiviste, aucune formule connue. Ouvert à tout moment : sans aide, il faut le casser
// à l'analyse (répétitions, fréquences par colonne). Chacune des 9 autres épreuves réussies donne un
// indice, du plus fort (Conseil des Clans) au plus faible. Le texte déchiffré donne le code d'accès
// à l'Énigme des Profondeurs.
(function () {
  'use strict';
  const { el } = Sceaux;
  const CLES = ['PLATINE', 'MERCURE', 'GRANITE', 'BASALTE', 'MITHRIL', 'ARDOISE', 'CALCAIRE', 'AMETHYSTE', 'MALACHITE', 'CORNALINE', 'TURQUOISE',
    'EMERAUDE', 'DIAMANT', 'PORPHYRE', 'ALBATRE', 'HEMATITE', 'MAGNETITE', 'ANTIMOINE'];
  // Graine propre au Registre, choisie pour que les 9 codes actuels aient tous une clé et un code
  // d’accès différents (à revérifier si l’on ajoute un joueur).
  const SEL = 'r27';
  const tirage = (code) => Sceaux.hasard(code + ':registre:' + SEL);
  const MOTS_A = ['CENDRE', 'GIVRE', 'OMBRE', 'BRUME', 'SILEX', 'ABIME', 'AURORE', 'ORAGE', 'ECUME', 'SOUFRE'];
  const MOTS_B = ['ECHO', 'SERMENT', 'VEILLE', 'SILENCE', 'LUEUR', 'MURMURE', 'SOMMEIL', 'PRESAGE', 'RELIQUE', 'VERTIGE'];
  const OUVERTURES = ['JOURNAL DE L ARCHIVISTE DE GRAVATHOR', 'NOTES SECRETES DU GARDIEN DES ARCHIVES', 'RAPPORT DE L ARCHIVISTE AU CONSEIL DE GRAVATHOR'];
  const RECITS = [
    'LES GALERIES SOUS LA CITE DESCENDENT BIEN PLUS BAS QUE NE LE DISENT LES CARTES',
    'LES MINEURS DU TROISIEME PUITS JURENT AVOIR ENTENDU UN CHANT MONTER DE LA ROCHE',
    'NUL NE SAIT QUI A GRAVE LES RUNES DES PREMIERES PORTES',
    'LES GARDIENS DES ECLUSES ONT REFUSE DE DESCENDRE APRES LA DERNIERE CRUE',
    'LE CONSEIL DES CLANS A ORDONNE DE SCELLER LES ACCES LES PLUS PROFONDS',
    'CEUX QUI SONT REVENUS PARLENT DE MIROIRS QUI CHANTENT DANS LE NOIR',
    'UN GOLEM DE PIERRE VEILLE ENCORE SUR LA SALLE DES RUNES',
    'LES LANTERNES DU VIEUX PONT S ALLUMENT PARFOIS TOUTES SEULES'
  ];
  const FIN = 'QUE LE CHANT GARDE CE SECRET';
  const A = 65;
  const lettre = (x) => String.fromCharCode(A + ((x % 26) + 26) % 26);
  const val = (ch) => ch.charCodeAt(0) - A;
  const estLettre = (ch) => ch >= 'A' && ch <= 'Z';
  const normaliser = (t) => t.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const eme = (n) => (n === 1 ? '1re' : `${n}e`);

  // Chiffre (sens = 1) ou déchiffre (sens = -1). La clé n'avance que sur les lettres ; une lettre de
  // clé inconnue (« ? ») donne « · » au déchiffrement.
  function vigenere(texte, cle, sens) {
    if (!cle.length) return texte;
    let n = 0;
    return texte.split('').map((ch) => {
      if (!estLettre(ch)) return ch;
      const k = cle[n++ % cle.length];
      return estLettre(k) ? lettre(val(ch) + sens * val(k)) : '·';
    }).join('');
  }

  function generer(h) {
    const cle = h.choisir(CLES);
    const code = [h.choisir(MOTS_A), h.choisir(MOTS_B)];
    const recits = h.melanger(RECITS.slice()).slice(0, 5);
    const phraseCode = `LE CODE QUI OUVRE L ENIGME DES PROFONDEURS EST ${code[0]} ${code[1]}`;
    const phrases = [h.choisir(OUVERTURES), ...recits.slice(0, 3), phraseCode, ...recits.slice(3), FIN];
    const clair = phrases.join('. ') + '.';
    const chiffre = vigenere(clair, cle, 1);
    const mots = clair.replace(/[.]/g, '').split(' ');

    // Les indices, du plus fort au plus faible.
    const positions = h.melanger(Array.from({ length: cle.length }, (x, i) => i));
    const quatre = positions.slice(0, 4).sort((a, b) => a - b);
    const une = positions[4];
    const motsCode = new Set(code);
    const candidats = mots.map((m, i) => ({ m, i })).filter((x) => x.m.length >= 7 && !motsCode.has(x.m) && x.i > 5 && x.m !== 'PROFONDEURS');
    const repere = h.choisir(candidats);
    const indices = {
      clans: `Quatre lettres du mot-clé, à leur place : ${cle.split('').map((l, i) => (quatre.includes(i) ? l : '▢')).join(' ')}`,
      golem: `Le ${repere.i + 1}e mot du texte (en comptant chaque mot, même les petits comme « L » ou « A ») est « ${repere.m} ».`,
      ecluses: `Le mot-clé est le nom d’une pierre ou d’un métal, et il compte ${cle.length} lettres.`,
      lanternes: `Le texte se termine par les mots « ${FIN.split(' ').slice(-3).join(' ')} ».`,
      tapisserie: `La ${eme(une + 1)} lettre du mot-clé est ${cle[une]}.`,
      miroirs: 'Le mot « PROFONDEURS » apparaît dans le texte, juste avant le code d’accès.',
      ponts: 'Quand un même groupe de lettres chiffrées revient plusieurs fois, la distance entre deux apparitions est souvent un multiple de la longueur du mot-clé (outil « Répétitions »).',
      glaces: 'Toutes les lettres chiffrées par la même lettre du mot-clé sont décalées d’un seul bloc : dans chacune de ces colonnes, la lettre la plus fréquente est sans doute un E (outil « Fréquences »).',
      reseau: 'Le code d’accès est écrit en toutes lettres : deux mots, qu’on peut donner séparés par un espace ou par un tiret.'
    };
    return { cle, code, clair, chiffre, indices };
  }

  const ORDRE = [
    ['clans', 'Le Conseil des Clans'], ['golem', 'Le Golem de Pierre'], ['ecluses', 'Les Écluses'],
    ['lanternes', 'Les Lanternes'], ['tapisserie', 'La Tapisserie effacée'], ['miroirs', 'Les Miroirs du Chant'],
    ['ponts', 'Les Ponts de Pierre'], ['glaces', 'Les Glaces du Col'], ['reseau', 'Le Réseau runique']
  ];

  // Groupes de lettres chiffrées qui se répètent, et distance entre leurs apparitions.
  function repetitions(lettres) {
    const vus = new Map(), res = [];
    for (let n = 5; n >= 3; n--) {
      for (let i = 0; i + n <= lettres.length; i++) {
        const g = lettres.slice(i, i + n);
        if (!vus.has(g)) vus.set(g, []);
        vus.get(g).push(i);
      }
    }
    const pris = new Set();
    for (const [g, pos] of [...vus.entries()].sort((a, b) => b[0].length - a[0].length)) {
      if (pos.length < 2 || [...pris].some((p) => p.includes(g))) continue;
      pris.add(g);
      res.push({ g, d: pos.slice(1).map((p, k) => p - pos[k]) });
    }
    return res.slice(0, 10);
  }
  function facteurs(n) { const f = []; for (let p = 2; n > 1; p++) while (n % p === 0) { f.push(p); n /= p; } return f.join(' × '); }

  function monter(zone, ctx) {
    const { chiffre, indices, code } = generer(tirage(ctx.code));
    const lettres = chiffre.split('').filter(estLettre).join('');
    const garde = ctx.memoire.lire() || {};
    let fini = false;

    // Indices obtenus
    const listeIndices = el('ol', { class: 'indices-registre' }, ORDRE.map(([id, nom]) => (ctx.faites[id]
      ? el('li', { class: 'obtenu' }, el('span', { class: 'source', text: nom }), el('span', { text: indices[id] }))
      : el('li', { class: 'verrouille' }, el('span', { class: 'source', text: nom }), el('span', { text: `🔒 Réussis cette épreuve pour obtenir cet indice.` })))));
    const nbIndices = ORDRE.filter(([id]) => ctx.faites[id]).length;

    // Lecture avec une clé
    const essai = el('pre', { class: 'lecture-registre' });
    const champCle = el('input', { type: 'text', class: 'champ-cle', placeholder: 'Mot-clé (« ? » = lettre inconnue)', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Mot-clé à essayer', value: garde.cle || '' });
    const cleEssayee = () => normaliser(champCle.value).replace(/[^A-Z?]/g, '');
    function lire() {
      const k = cleEssayee();
      essai.textContent = k ? vigenere(chiffre, k, -1) : '(tape un mot-clé pour lire le rapport avec ; mets « ? » pour une lettre que tu ne connais pas encore)';
      essai.classList.toggle('vide', !k);
      ctx.memoire.ecrire({ ...(ctx.memoire.lire() || {}), cle: champCle.value });
    }
    champCle.addEventListener('input', lire);

    // Soustracteur
    const sousChiffre = el('input', { type: 'text', class: 'champ-sous', placeholder: 'Lettres chiffrées', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Lettres chiffrées' });
    const sousClair = el('input', { type: 'text', class: 'champ-sous', placeholder: 'Lettres claires devinées', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Lettres claires devinées' });
    const sousResultat = el('p', { class: 'resultat-sous' });
    function soustraire() {
      const c = normaliser(sousChiffre.value).split('').filter(estLettre), p = normaliser(sousClair.value).split('').filter(estLettre);
      const n = Math.min(c.length, p.length);
      sousResultat.textContent = n ? 'Lettres du mot-clé : ' + Array.from({ length: n }, (x, i) => lettre(val(c[i]) - val(p[i]))).join(' ') : '';
    }
    sousChiffre.addEventListener('input', soustraire); sousClair.addEventListener('input', soustraire);

    // Répétitions
    const blocRep = el('div', { class: 'outil-resultat' });
    const boutonRep = el('button', { type: 'button', class: 'discret', text: 'Chercher les répétitions', onclick: () => {
      const r = repetitions(lettres);
      blocRep.replaceChildren(r.length ? el('ul', {}, r.map((x) => el('li', { text: `« ${x.g} » revient : distance ${x.d.map((d) => `${d} (${facteurs(d)})`).join(', ')}` }))) : el('p', { text: 'Aucune répétition trouvée.' }));
    } });

    // Fréquences par colonne
    const blocFreq = el('div', { class: 'outil-resultat' });
    function frequences(L) {
      const lignes = [];
      for (let k = 0; k < L; k++) {
        const compte = new Array(26).fill(0);
        for (let i = k; i < lettres.length; i += L) compte[val(lettres[i])]++;
        const top = compte.map((n, i) => ({ n, i })).sort((a, b) => b.n - a.n).slice(0, 3);
        lignes.push(el('tr', {}, el('td', { text: `${k + 1}` }), el('td', { text: top.map((t) => `${lettre(t.i)} (${t.n})`).join('  ') })));
      }
      blocFreq.replaceChildren(
        el('table', { class: 'table-freq' },
          el('thead', {}, el('tr', {}, el('th', { text: 'Col.' }), el('th', { text: 'Lettres les plus fréquentes' }))),
          el('tbody', {}, lignes)));
    }
    const choixLongueur = el('div', { class: 'choix-longueur' }, el('span', { text: 'Longueur du mot-clé supposée : ' }),
      Array.from({ length: 11 }, (x, i) => el('button', { type: 'button', class: 'discret', text: `${i + 2}`, onclick: () => frequences(i + 2) })));

    // Réponse
    const champReponse = el('input', { type: 'text', placeholder: 'Code d’accès', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Code d’accès à l’Énigme des Profondeurs' });
    const msg = el('p', { class: 'message' });
    let tentatives = 0;
    function valider(ev) {
      ev.preventDefault();
      if (fini) return;
      const r = normaliser(champReponse.value).replace(/[^A-Z]/g, '');
      if (!r) return;
      if (r === code.join('')) {
        fini = true; msg.className = 'message ok';
        msg.textContent = `Le registre se referme de lui-même. Ton code d’accès : ${code.join('-')}. Il t’ouvre dès maintenant la porte de l’Énigme des Profondeurs. Envoie-le tout de suite au MJ : si tu es le premier, c’est toi qui ouvres l’Énigme pour tout le monde, et la grande récompense sera pour toi si elle est résolue. Ensuite, aidez-vous : l’Énigme se résout ensemble.`;
        setTimeout(ctx.reussir, 6000);
      } else {
        tentatives++; ctx.secouer(champReponse);
        msg.className = 'message erreur';
        msg.textContent = `Ce n’est pas le code d’accès caché dans le rapport (essai ${tentatives}).`;
      }
    }

    zone.append(
      el('div', { class: 'panneau consigne-epreuve sous-boss' },
        el('h3', { text: 'La règle' }),
        el('p', { text: 'Voici le dernier obstacle avant l’Énigme des Profondeurs. L’archiviste de Gravathor a chiffré son rapport avec le chiffre des scribes de Karak-Durn. Le rapport cache ton code d’accès à l’Énigme.' }),
        el('p', {}, 'Cette fois, ', el('strong', { text: 'aucune formule connue' }), ', et un long mot-clé. Chaque autre épreuve des Profondeurs réussie te donne un indice ; plus l’épreuve est dure, plus l’indice est précieux. On peut aussi tenter de casser le chiffre sans aide, avec les outils de l’atelier.'),
        el('ul', {},
          el('li', { text: 'Chaque lettre vaut un décalage : A = 0, B = 1, C = 2… Z = 25.' }),
          el('li', { text: 'On écrit un mot-clé sous le texte, en le répétant autant qu’il faut. Chaque lettre du texte est avancée du décalage de la lettre du mot-clé placée dessous (après Z, on repart à A).' }),
          el('li', {}, 'Exemple avec le mot-clé ', el('strong', { text: 'CLE' }), ' : ', el('code', { text: 'NAIN' }), ' → N+C = P, A+L = L, I+E = M, N+C = P → ', el('code', { text: 'PLMP' }), '. Pour déchiffrer, on recule au lieu d’avancer.'),
          el('li', { text: 'Seules les lettres comptent : espaces et ponctuation sont laissés tels quels, et le mot-clé n’avance pas dessus.' }))),
      el('div', { class: 'panneau' },
        el('h3', { text: `Tes indices (${nbIndices} / 9)` }),
        listeIndices),
      el('div', { class: 'panneau registre' },
        el('h3', { text: 'Le rapport chiffré' }),
        el('pre', { class: 'texte-chiffre', text: chiffre })),
      el('div', { class: 'panneau atelier' },
        el('h3', { text: 'L’atelier du scribe' }),
        el('p', { class: 'doux', text: 'Lire le rapport avec un mot-clé :' }),
        champCle, essai,
        el('p', { class: 'doux', text: 'Le soustracteur (lettre chiffrée − lettre claire = lettre du mot-clé) :' }),
        el('div', { class: 'soustracteur' }, sousChiffre, sousClair), sousResultat,
        el('p', { class: 'doux', text: 'Répétitions : les groupes de lettres chiffrées qui reviennent, et leurs distances.' }),
        boutonRep, blocRep,
        el('p', { class: 'doux', text: 'Fréquences : choisis une longueur de mot-clé, le texte est découpé en colonnes (une par lettre du mot-clé).' }),
        choixLongueur, blocFreq),
      el('form', { class: 'form-mot', onsubmit: valider }, champReponse, el('button', { type: 'submit', text: 'Donner le code d’accès' })),
      msg);
    lire();

    return {
      solution: () => {
        const g = generer(tirage(ctx.code));
        return {
          reponse: [`Code d’accès à l’Énigme : ${g.code.join('-')}`, `Mot-clé du rapport : ${g.cle}`],
          pourquoi: [
            `Avec le mot-clé ${g.cle}, le rapport se lit : « ${g.clair} »`,
            'Méthode sans indice : l’outil « Répétitions » montre des distances qui ont presque toutes la longueur du mot-clé comme diviseur commun ; l’outil « Fréquences » avec cette longueur donne la lettre la plus fréquente de chaque colonne : en supposant que c’est un E, le soustracteur donne presque tout le mot-clé ; on corrige les dernières lettres à la main en lisant le texte.'
          ]
        };
      }
    };
  }

  // Une fois le Registre réussi, le code reste affiché quand on revient.
  function souvenir(ctx) {
    const { code } = generer(tirage(ctx.code));
    return el('div', { class: 'panneau souvenir-registre' },
      el('p', { text: 'Ton code d’accès à l’Énigme des Profondeurs :' }),
      el('p', { class: 'code-registre', text: code.join('-') }),
      el('p', { class: 'doux', text: 'Envoie-le au MJ si ce n’est pas déjà fait : le premier à lui parvenir ouvre l’Énigme pour tout le monde. Ensuite, l’Énigme se résout ensemble.' }));
  }

  // Code d’accès à l’Énigme des Profondeurs pour un code joueur (lu par l’Énigme).
  Sceaux.codeRegistre = (code) => generer(tirage(code)).code.join('');
  Sceaux.codeRegistreLisible = (code) => generer(tirage(code)).code.join('-');

  Sceaux.enregistrerEpreuve({ id: 'registre', nom: 'Le Registre chiffré', icone: '📜', etoiles: 5, rang: 'sous-boss', resume: 'Ouvre l’Énigme des Profondeurs pour tous', monter, souvenir });
})();
