// Sceau IV — L'Inscription (★★★)
// Une phrase gravée dans un alphabet runique inconnu (une rune = une lettre).
// Une tablette brisée en traduit quelques-unes ; le reste se déduit (fréquences,
// petits mots, motifs). La phrase donne le mot qui ouvre le sceau.
(function () {
  'use strict';
  const { el } = Sceaux;

  const GLYPHES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ', 'ᚩ', 'ᚳ', 'ᛠ', 'ᛡ', 'ᚣ', 'ᛣ'];
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const TEXTES = [
    ['SOUS LA MONTAGNE DORMENT LES ROIS DE PIERRE. ILS VEILLENT SUR CEUX QUI FRAPPENT A LEUR PORTE AVEC PATIENCE.', 'ENCLUME'],
    ['LE FER SE TORD, LA PIERRE SE FEND, MAIS LA PAROLE DONNEE NE SE BRISE JAMAIS, NI PAR LE FEU NI PAR LE TEMPS.', 'SERMENT'],
    ['NUL NE TRAVERSE LA HALLE DES ANCETRES SANS SALUER LE FEU QUI BRULE AU CENTRE DEPUIS LE PREMIER ROI.', 'BRASIER'],
    ['QUAND LA MONTAGNE CHANTE, LE SAGE SE TAIT ET ECOUTE. LE FOU PARLE ET SE PERD DANS LES GALERIES.', 'SILENCE'],
    ['LE MINEUR SUIT LA VEINE JUSQU AU COEUR DE LA ROCHE, ET LA ROCHE LUI REND SA LUMIERE AU CENTUPLE.', 'LANTERNE'],
    ['TROIS CLES OUVRENT LE COFFRE DU ROI : LA PATIENCE, LA RUSE ET LA FORCE DU BRAS QUI FRAPPE JUSTE.', 'MARTEAU'],
    ['LES GRANDS PORTAILS NE CEDENT PAS A LA HACHE, MAIS A LA VOIX DE CEUX QUI SAVENT LES ECOUTER.', 'GRANITE'],
    ['CHAQUE PIERRE DE CETTE CITE PORTE LE NOM DE CELUI QUI LA TAILLA. ELLES SE SOUVIENNENT DE TOUT.', 'CISEAU']
  ];
  const FIN = ' LE MOT QUI OUVRE CE SCEAU EST ';
  const normaliser = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

  function generer(h) {
    const [debut, mot] = h.choisir(TEXTES);
    const clair = debut + FIN + mot + '.';
    const glyphes = h.melanger(GLYPHES).slice(0, 26);
    const chiffre = {}; // lettre → rune
    ALPHABET.split('').forEach((l, i) => { chiffre[l] = glyphes[i]; });
    // La tablette traduit 5 lettres présentes, jamais le E (trop facile par les fréquences).
    const presentes = [...new Set(clair.replace(/[^A-Z]/g, '').split(''))].filter((l) => l !== 'E');
    const connues = h.melanger(presentes).slice(0, 5);
    return { clair, mot, chiffre, connues };
  }

  function monter(zone, ctx) {
    const { clair, mot, chiffre, connues } = generer(ctx.hasard);
    const dechiffre = {}; // rune → lettre
    for (const [l, r] of Object.entries(chiffre)) dechiffre[r] = l;
    const garde = ctx.memoire.lire() || {};
    const choix = {}; // rune → lettre proposée par le joueur
    connues.forEach((l) => { choix[chiffre[l]] = l; });
    if (garde.choix) for (const [r, l] of Object.entries(garde.choix)) if (dechiffre[r] && !connues.includes(dechiffre[r])) choix[r] = l;
    let reponse = garde.reponse || '';
    let runeActive = null;
    const memoriser = () => {
      const libre = {};
      for (const [r, l] of Object.entries(choix)) if (!connues.includes(dechiffre[r])) libre[r] = l;
      ctx.memoire.ecrire({ choix: libre, reponse });
    };

    // ---------- L'inscription ----------
    const inscription = el('div', { class: 'inscription', role: 'group', 'aria-label': 'Inscription runique' });
    const cases = []; // { rune, lettre (élément) }
    clair.split(' ').forEach((motClair) => {
      const bloc = el('span', { class: 'mot-runique' });
      motClair.split('').forEach((c) => {
        if (/[A-Z]/.test(c)) {
          const rune = chiffre[c];
          const lettre = el('span', { class: 'lettre' });
          const b = el('button', {
            type: 'button', class: 'glyphe', 'aria-label': 'Rune ' + rune,
            onclick: () => selectionner(rune)
          }, el('span', { class: 'rune', text: rune }), lettre);
          cases.push({ rune, b, lettre });
          bloc.append(b);
        } else {
          bloc.append(el('span', { class: 'ponctuation', text: c }));
        }
      });
      inscription.append(bloc, ' ');
    });

    function rafraichir() {
      cases.forEach(({ rune, b, lettre }) => {
        lettre.textContent = choix[rune] || '·';
        b.classList.toggle('connue', connues.includes(dechiffre[rune]));
        b.classList.toggle('active', rune === runeActive);
      });
      dessinerClavier();
      memoriser();
    }

    // ---------- Le clavier ----------
    const clavier = el('div', { class: 'clavier-runes' });
    function dessinerClavier() {
      clavier.replaceChildren();
      if (!runeActive) {
        clavier.append(el('p', { class: 'doux centre petit', text: 'Touche une rune de l’inscription pour lui attribuer une lettre.' }));
        return;
      }
      const verrouillee = connues.includes(dechiffre[runeActive]);
      clavier.append(el('p', { class: 'centre' },
        'Rune ', el('span', { class: 'rune grande', text: runeActive }),
        verrouillee ? ' : traduite par la tablette.' : ' : quelle lettre ?'));
      if (verrouillee) return;
      const utilisees = {};
      for (const [r, l] of Object.entries(choix)) utilisees[l] = r;
      const grille = el('div', { class: 'touches' });
      ALPHABET.split('').forEach((l) => {
        const prise = utilisees[l] && utilisees[l] !== runeActive;
        const figee = prise && connues.includes(l);
        grille.append(el('button', {
          type: 'button', class: 'touche' + (choix[runeActive] === l ? ' choisie' : '') + (prise ? ' prise' : ''),
          disabled: figee, text: l, 'aria-label': 'Lettre ' + l,
          onclick: () => {
            if (prise) delete choix[utilisees[l]]; // une lettre ne peut servir qu'à une rune
            choix[runeActive] = l;
            rafraichir();
          }
        }));
      });
      grille.append(el('button', { type: 'button', class: 'touche effacer', text: '⌫', 'aria-label': 'Effacer', onclick: () => { delete choix[runeActive]; rafraichir(); } }));
      clavier.append(grille);
    }
    function selectionner(rune) {
      runeActive = runeActive === rune ? null : rune;
      rafraichir();
    }

    // ---------- La tablette et les comptes ----------
    const comptes = {};
    clair.replace(/[^A-Z]/g, '').split('').forEach((c) => { comptes[chiffre[c]] = (comptes[chiffre[c]] || 0) + 1; });
    const frequences = Object.entries(comptes).sort((a, b) => b[1] - a[1]);

    // ---------- La réponse ----------
    const champ = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Le mot qui ouvre le sceau', placeholder: 'Le mot…', value: reponse });
    champ.addEventListener('input', () => { reponse = champ.value; memoriser(); });
    const msg = el('p', { class: 'message' });
    const form = el('form', {
      class: 'form-mot',
      onsubmit: (ev) => {
        ev.preventDefault();
        if (normaliser(champ.value) === mot) { msg.className = 'message ok'; msg.textContent = 'Les runes s’embrasent une à une.'; setTimeout(ctx.reussir, 800); return; }
        msg.className = 'message erreur';
        msg.textContent = 'La pierre ne répond pas à ce mot.';
        ctx.secouer(form);
      }
    }, champ, el('button', { type: 'submit', text: 'Prononcer le mot' }));

    zone.append(
      el('p', { class: 'consigne', text: 'Sur le linteau, une inscription dans un alphabet que personne ne lit plus. Chaque rune est toujours la même lettre.' }),
      inscription,
      clavier,
      el('div', { class: 'aides' },
        el('div', { class: 'panneau' },
          el('h3', { text: 'Tablette brisée' }),
          el('p', { class: 'doux petit', text: 'Seules quelques lignes ont survécu.' }),
          el('ul', { class: 'liste-runes' }, connues.map((l) => el('li', {}, el('span', { class: 'rune', text: chiffre[l] }), ' = ' + l)))),
        el('div', { class: 'panneau' },
          el('h3', { text: 'Runes gravées' }),
          el('p', { class: 'doux petit', text: 'Combien de fois chaque rune apparaît.' }),
          el('ul', { class: 'liste-runes frequences' }, frequences.map(([r, n]) => el('li', {}, el('span', { class: 'rune', text: r }), ' ×' + n))))),
      form,
      msg
    );
    rafraichir();

    return {
      solution: () => {
        const utiles = [...new Set(clair.replace(/[^A-Z]/g, '').split(''))].sort();
        const top = frequences[0];
        return {
          reponse: [`Le mot : ${mot}`, `L’inscription : « ${clair} »`],
          pourquoi: [
            ['La tablette donne d’emblée : ', connues.map((l) => `${chiffre[l]} = ${l}`).join(', '), '.'],
            ['La rune la plus fréquente, ', el('span', { class: 'rune', text: top[0] }), ` (×${top[1]}), est presque toujours le E en français : c’est bien ${dechiffre[top[0]]}.`],
            'Les petits mots se devinent vite une fois quelques lettres posées : LE, LA, DE, ET, SE, QUI… et la fin de la phrase suit un motif régulier : « LE MOT QUI OUVRE CE SCEAU EST … ».',
            'Chaque lettre trouvée se reporte partout où la rune apparaît, ce qui débloque les mots voisins.',
            ['L’alphabet complet de ce joueur : ', utiles.map((l) => `${chiffre[l]} = ${l}`).join(' · '), '.']
          ]
        };
      }
    };
  }

  Sceaux.enregistrer({ numero: 4, monter });
})();
