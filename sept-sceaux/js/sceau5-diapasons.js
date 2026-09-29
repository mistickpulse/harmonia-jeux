// Sceau V — Le Chant des Diapasons (★★★★)
// 1. Douze diapasons identiques (gamme chromatique), dans le désordre : les ranger du plus grave au plus aigu,
//    à l'oreille. La plaque dit combien sont à leur place (pour qu'on puisse progresser).
// 2. Une fois rangés, ils jouent une mélodie qu'il faut reproduire note pour note.
// Son synthétisé (Web Audio), aucun fichier à charger.
(function () {
  'use strict';
  const { el } = Sceaux;

  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛞ', 'ᛟ'];
  const NOMS_NOTES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const NB = 12; // gamme chromatique complète : un diapason par demi-ton, de Do à Si

  // ---------- L'Hymne de la Montagne ----------
  // Mélodie lente et grave, façon chant de moines. Pour la changer, il suffit de modifier
  // cette ligne : « note:durée » séparés par des espaces, notes de Do à Si sur une octave
  // (dièses # ou bémols b acceptés : Do# = Réb, Mib, Sol#…), durée en temps.
  // Outil d'essai privé : Notes/mini-jeux/recompenses/essai-hymne.html
  const HYMNE_TEXTE = 'Do:2 Ré:1 Mib:1 Ré:1 Fa:1 Mib:1 Ré:1 Do:2 Sol:2 La:1 Sib:1 La:1 Fa:1 La:1 Sol:3 Do:1 Mib:1 Fa:1 Ré:1 Do:1 Mib:1 Ré:1 Do:1 Ré:1 Do:3';
  const TEMPS = 750; // durée d'un temps, en millisecondes
  const DEMI_TONS = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
  function lireNote(nom) {
    const m = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/^(do|re|mi|fa|sol|la|si)(#|♯|b|♭)?$/);
    if (!m) throw new Error('Note inconnue dans l’hymne : ' + nom);
    return (DEMI_TONS[m[1]] + (m[2] === '#' || m[2] === '♯' ? 1 : m[2] ? -1 : 0) + 12) % 12;
  }
  const HYMNE = HYMNE_TEXTE.trim().split(/\s+/).map((x) => { const [n, d] = x.split(':'); return [lireNote(n), Number(d) || 1]; });
  const LONGUEUR_CHANT = HYMNE.length;

  // ---------- Son ----------
  let audio = null;
  function contexte() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function frapper(freq) {
    const ac = contexte();
    if (!ac) return;
    const t = ac.currentTime;
    const sortie = ac.createGain();
    sortie.gain.setValueAtTime(0.0001, t);
    sortie.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    sortie.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    sortie.connect(ac.destination);
    [[1, 1], [2, 0.12], [3, 0.03]].forEach(([mult, vol]) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      g.gain.value = vol;
      o.connect(g).connect(sortie);
      o.start(t);
      o.stop(t + 2.3);
    });
  }

  function generer(h) {
    // Gamme chromatique transposée au hasard (départ de Sol grave à Do) : chaque code entend d'autres hauteurs.
    const tonique = h.entier(-5, 0); // en demi-tons depuis Do4
    const notes = [...Array(NB).keys()].map((d) => {
      const k = tonique + d;
      return { k, freq: 261.63 * Math.pow(2, k / 12), rune: null };
    });
    const runes = h.melanger(RUNES).slice(0, NB);
    notes.forEach((n, i) => { n.rune = runes[i]; });
    let depart;
    do { depart = h.melanger([...Array(NB).keys()]); } while (depart.every((n, i) => n === i)); // indices de notes, de gauche à droite
    const chant = HYMNE.map(([demiTon]) => demiTon);
    const durees = HYMNE.map(([, t]) => t);
    return { notes, depart, chant, durees };
  }
  const nomNote = (k) => NOMS_NOTES[((k % 12) + 12) % 12] + (k < 0 ? ' grave' : k >= 12 ? ' aigu' : '');

  function monter(zone, ctx) {
    const { notes, depart, chant, durees } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    let rangee = Array.isArray(garde.rangee) && garde.rangee.length === NB && [...garde.rangee].sort((a, b) => a - b).join() === [...Array(NB).keys()].join()
      ? garde.rangee : depart.slice();
    let range = !!garde.range && rangee.every((n, i) => n === i);
    let choisi = null;       // position sélectionnée pour un échange
    // Partition du joueur pendant la phase du chant : les notes frappées s'y ajoutent une à une.
    // Elle se corrige (retirer la dernière, tout effacer) et se présente quand il le veut :
    // une erreur ne fait jamais tout recommencer.
    let saisie = Array.isArray(garde.saisie) ? garde.saisie.filter((n) => n >= 0 && n < NB).slice(0, 60) : [];
    let enJeu = false;       // mélodie en cours de lecture
    const memoriser = () => ctx.memoire.ecrire({ rangee, range, saisie });

    const scene = el('div', { class: 'diapasons' });
    const barre = el('div', { class: 'progres-chant', 'aria-live': 'polite' });
    const msg = el('p', { class: 'message' });
    const actions = el('div', { class: 'actions' });

    function vibrer(pos) {
      const d = scene.children[pos];
      if (!d) return;
      d.classList.remove('vibre'); void d.offsetWidth; d.classList.add('vibre');
    }
    function jouer(pos) { frapper(notes[rangee[pos]].freq); vibrer(pos); }

    function dessiner() {
      scene.replaceChildren();
      rangee.forEach((n, pos) => {
        const diapason = el('div', { class: 'diapason' + (choisi === pos ? ' choisi' : '') },
          el('button', {
            type: 'button', class: 'frapper', 'aria-label': `Frapper le diapason ${pos + 1}`,
            onclick: () => frapperDiapason(pos)
          }, el('span', { class: 'branches', 'aria-hidden': 'true' }), el('span', { class: 'rune', text: notes[n].rune })),
          range ? null : el('button', {
            type: 'button', class: 'echanger discret', 'aria-label': `Déplacer le diapason ${pos + 1}`, text: '⇄',
            onclick: () => echanger(pos)
          }));
        scene.append(diapason);
      });
      barre.replaceChildren();
      if (range) {
        barre.append(
          el('p', { class: 'doux petit centre', text: `Ta partition (${saisie.length} note${saisie.length > 1 ? 's' : ''}) : touche les diapasons pour ajouter des notes.` }),
          el('div', { class: 'partition' }, saisie.length
            ? saisie.map((n, i) => el('span', { class: 'note-partition', title: `Note ${i + 1}` }, el('small', { text: String(i + 1) }), notes[n].rune))
            : el('span', { class: 'doux petit', text: '…vide…' })),
          el('div', { class: 'actions' },
            el('button', { type: 'button', class: 'discret', text: '⌫ Retirer la dernière', disabled: !saisie.length, onclick: () => { saisie.pop(); memoriser(); msg.textContent = ''; dessiner(); } }),
            el('button', { type: 'button', class: 'discret', text: '✕ Tout effacer', disabled: !saisie.length, onclick: () => { saisie = []; memoriser(); msg.textContent = ''; dessiner(); } }),
            el('button', { type: 'button', class: 'discret', text: '♪ Écouter ta partition', disabled: !saisie.length, onclick: ecouterPartition })));
      }
      actions.replaceChildren(el('button', { type: 'button', class: 'discret', text: range ? '♪ Écouter le Chant' : '♪ Écouter la rangée', onclick: range ? ecouterChant : ecouterRangee }));
      actions.append(range
        ? el('button', { type: 'button', text: 'Présenter le Chant', disabled: !saisie.length, onclick: presenterChant })
        : el('button', { type: 'button', text: 'Présenter la rangée', onclick: verifier }));
    }

    function frapperDiapason(pos) {
      if (enJeu) return;
      jouer(pos);
      if (!range) return;
      // Phase 2 : la note s'ajoute à la partition du joueur.
      saisie.push(rangee[pos]);
      memoriser();
      msg.className = 'message'; msg.textContent = '';
      dessiner();
    }

    function presenterChant() {
      if (enJeu) return;
      if (saisie.length === LONGUEUR_CHANT && saisie.every((n, i) => n === chant[i])) {
        msg.className = 'message ok'; msg.textContent = 'Les douze voix s’accordent. La pierre vibre avec elles.';
        setTimeout(ctx.reussir, 1400);
        return;
      }
      let justes = 0;
      while (justes < saisie.length && justes < LONGUEUR_CHANT && saisie[justes] === chant[justes]) justes++;
      msg.className = 'message erreur';
      const pl = justes > 1 ? 's' : '';
      if (justes === saisie.length && saisie.length < LONGUEUR_CHANT) {
        msg.textContent = `Les ${justes} première${pl} note${pl} ${justes > 1 ? 'sont justes' : 'est juste'}… mais le Chant n’est pas fini. Il manque encore des notes.`;
      } else {
        msg.textContent = justes === 0 ? 'Dès la première note, le Chant sonne faux.' : `Les ${justes} première${pl} note${pl} ${justes > 1 ? 'sont justes' : 'est juste'}, puis le Chant se brise.`;
      }
      ctx.secouer(barre);
    }
    function ecouterPartition() {
      if (enJeu || !saisie.length) return;
      sequence(saisie.map((n) => rangee.indexOf(n)), saisie.map(() => 600));
    }

    function echanger(pos) {
      if (choisi === null) { choisi = pos; }
      else if (choisi === pos) { choisi = null; }
      else { [rangee[choisi], rangee[pos]] = [rangee[pos], rangee[choisi]]; choisi = null; memoriser(); msg.textContent = ''; }
      dessiner();
    }

    // Joue une suite de positions ; durees[i] = durée de la note i (en ms).
    function sequence(positions, durees) {
      enJeu = true;
      let t = 0;
      positions.forEach((pos, i) => {
        setTimeout(() => jouer(pos), t);
        t += durees[i];
      });
      setTimeout(() => { enJeu = false; }, t);
    }
    function ecouterRangee() { if (!enJeu) sequence([...Array(NB).keys()], new Array(NB).fill(650)); }
    function ecouterChant() {
      if (enJeu) return;
      sequence(chant.map((n) => rangee.indexOf(n)), durees.map((d) => d * TEMPS));
    }

    function verifier() {
      const bien = rangee.filter((n, i) => n === i).length;
      if (bien === NB) {
        range = true; memoriser();
        msg.className = 'message ok';
        msg.textContent = 'Les diapasons sont en ordre. D’eux-mêmes, ils entonnent l’Hymne de la Montagne… Recompose-le : chaque diapason touché ajoute sa note à ta partition.';
        dessiner();
        setTimeout(ecouterChant, 900); // l'hymne se joue tout seul une première fois
        return;
      }
      msg.className = 'message erreur';
      msg.textContent = bien === 0 ? 'Aucun diapason n’est à sa place.' : bien === 1 ? 'Un seul diapason est à sa place.' : `${bien} diapasons sont à leur place.`;
      ctx.secouer(scene);
    }

    zone.append(
      el('p', { class: 'consigne', text: 'Douze diapasons de bronze, tous semblables. Une plaque : « Range-nous du plus grave au plus aigu, de gauche à droite, et le Chant te dira quoi frapper. »' }),
      el('p', { class: 'doux centre petit', text: '🔊 Monte le son (un casque aide beaucoup). Touche un diapason pour l’entendre ; touche ⇄ sous deux diapasons pour les échanger.' }),
      scene,
      barre,
      msg,
      actions
    );
    dessiner();

    return {
      solution: () => ({
        reponse: [
          ['Ordre, du plus grave au plus aigu : ', notes.map((n) => n.rune).join('  ')],
          ['L’Hymne de la Montagne à rejouer : ', chant.map((n) => notes[n].rune).join(' → ')]
        ],
        pourquoi: [
          'Les diapasons ne se distinguent qu’au son. Leurs notes, du plus grave au plus aigu :',
          notes.map((n) => `${n.rune} = ${nomNote(n.k)}`).join(' · ') + '.',
          'Ils forment une gamme chromatique complète : chaque diapason n’est séparé de son voisin que d’un demi-ton, l’écart le plus fin possible. C’est tout le piège.',
          'Méthode : comparer les diapasons deux par deux, poser d’abord le plus grave et le plus aigu, puis s’aider de la plaque, qui dit combien sont à leur place.',
          'Une fois rangés, ils jouent d’eux-mêmes l’Hymne de la Montagne, un chant lent et grave.',
          `Pour le rejouer, frapper de gauche à droite les positions : ${chant.map((n) => n + 1).join(' - ')} (1 = le plus grave). Le joueur compose sa partition note par note (retirer la dernière, tout effacer, réécouter), puis la présente ; la plaque dit combien de notes sont justes depuis le début. Le rythme n’est pas jugé.`
        ]
      })
    };
  }

  Sceaux.enregistrer({ numero: 5, monter });
})();
