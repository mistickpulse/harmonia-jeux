// Sceau V — Le Chant des Diapasons (★★★★)
// 1. Sept diapasons identiques, dans le désordre : les ranger du plus grave au plus aigu,
//    à l'oreille. La plaque dit combien sont à leur place (pour qu'on puisse progresser).
// 2. Une fois rangés, ils jouent une mélodie qu'il faut reproduire note pour note.
// Son synthétisé (Web Audio), aucun fichier à charger.
(function () {
  'use strict';
  const { el } = Sceaux;

  const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛞ', 'ᛟ'];
  const NOMS_NOTES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const NB = 7;
  const LONGUEUR_CHANT = 9;

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
    // 7 notes distinctes entre Do4 et Ré5, avec au moins deux paires à un demi-ton (les pièges).
    for (;;) {
      const demiTons = h.melanger([...Array(15).keys()]).slice(0, NB).sort((a, b) => a - b);
      let serrees = 0;
      for (let i = 1; i < NB; i++) if (demiTons[i] - demiTons[i - 1] === 1) serrees++;
      if (serrees < 2) continue;
      const notes = demiTons.map((k) => ({ k, freq: 261.63 * Math.pow(2, k / 12), rune: null }));
      const runes = h.melanger(RUNES).slice(0, NB);
      notes.forEach((n, i) => { n.rune = runes[i]; });
      const depart = h.melanger([...Array(NB).keys()]);           // indices de notes, de gauche à droite
      if (depart.every((n, i) => n === i)) continue;
      const chant = [];
      while (chant.length < LONGUEUR_CHANT) {
        const n = h.entier(0, NB - 1);
        if (chant[chant.length - 1] !== n) chant.push(n);
      }
      return { notes, depart, chant };
    }
  }
  const nomNote = (k) => NOMS_NOTES[k % 12] + (k >= 12 ? ' aigu' : '');

  function monter(zone, ctx) {
    const { notes, depart, chant } = generer(ctx.hasard);
    const garde = ctx.memoire.lire() || {};
    let rangee = Array.isArray(garde.rangee) && garde.rangee.length === NB && [...garde.rangee].sort().join() === [...Array(NB).keys()].join()
      ? garde.rangee : depart.slice();
    let range = !!garde.range && rangee.every((n, i) => n === i);
    let choisi = null;       // position sélectionnée pour un échange
    let saisie = [];         // notes frappées pendant la phase du chant
    let enJeu = false;       // mélodie en cours de lecture
    const memoriser = () => ctx.memoire.ecrire({ rangee, range });

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
        for (let i = 0; i < LONGUEUR_CHANT; i++) barre.append(el('span', { class: 'point' + (i < saisie.length ? ' fait' : '') }));
      }
      actions.replaceChildren(el('button', { type: 'button', class: 'discret', text: range ? '♪ Écouter le Chant' : '♪ Écouter la rangée', onclick: range ? ecouterChant : ecouterRangee }));
      if (!range) actions.append(el('button', { type: 'button', text: 'Présenter la rangée', onclick: verifier }));
    }

    function frapperDiapason(pos) {
      if (enJeu) return;
      jouer(pos);
      if (!range) return;
      // Phase 2 : reproduire le chant.
      const attendu = chant[saisie.length];
      if (rangee[pos] === attendu) {
        saisie.push(attendu);
        if (saisie.length === LONGUEUR_CHANT) {
          msg.className = 'message ok'; msg.textContent = 'Les sept voix s’accordent. La pierre vibre avec elles.';
          dessiner();
          setTimeout(ctx.reussir, 1400);
          return;
        }
        msg.className = 'message'; msg.textContent = '';
      } else {
        saisie = [];
        msg.className = 'message erreur'; msg.textContent = 'Une fausse note : le Chant se brise. Recommence depuis le début.';
      }
      dessiner();
    }

    function echanger(pos) {
      if (choisi === null) { choisi = pos; }
      else if (choisi === pos) { choisi = null; }
      else { [rangee[choisi], rangee[pos]] = [rangee[pos], rangee[choisi]]; choisi = null; memoriser(); msg.textContent = ''; }
      dessiner();
    }

    function sequence(positions, pas) {
      enJeu = true;
      positions.forEach((pos, i) => setTimeout(() => {
        jouer(pos);
        if (i === positions.length - 1) setTimeout(() => { enJeu = false; }, pas);
      }, i * pas));
    }
    function ecouterRangee() { if (!enJeu) sequence([...Array(NB).keys()], 650); }
    function ecouterChant() {
      if (enJeu) return;
      saisie = []; dessiner();
      sequence(chant.map((n) => rangee.indexOf(n)), 620);
    }

    function verifier() {
      const bien = rangee.filter((n, i) => n === i).length;
      if (bien === NB) {
        range = true; memoriser();
        msg.className = 'message ok';
        msg.textContent = 'Les diapasons sont en ordre. La plaque s’illumine : écoute le Chant, puis rejoue-le.';
        dessiner();
        return;
      }
      msg.className = 'message erreur';
      msg.textContent = bien === 0 ? 'Aucun diapason n’est à sa place.' : bien === 1 ? 'Un seul diapason est à sa place.' : `${bien} diapasons sont à leur place.`;
      ctx.secouer(scene);
    }

    zone.append(
      el('p', { class: 'consigne', text: 'Sept diapasons de bronze, tous semblables. Une plaque : « Range-nous du plus grave au plus aigu, de gauche à droite, et le Chant te dira quoi frapper. »' }),
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
          ['Le Chant à rejouer : ', chant.map((n) => notes[n].rune).join(' → ')]
        ],
        pourquoi: [
          'Les diapasons ne se distinguent qu’au son. Leurs notes, du plus grave au plus aigu :',
          notes.map((n) => `${n.rune} = ${nomNote(n.k)}`).join(' · ') + '.',
          `Les pièges : ${notes.filter((n, i) => i > 0 && n.k - notes[i - 1].k === 1).map((n) => { const i = notes.indexOf(n); return `${notes[i - 1].rune} et ${n.rune}`; }).join(', ')} ne sont séparés que d’un demi-ton, l’écart le plus fin possible.`,
          'Méthode : comparer les diapasons deux par deux, poser d’abord le plus grave et le plus aigu, puis s’aider de la plaque, qui dit combien sont à leur place.',
          `Une fois la rangée en ordre, le Chant se rejoue en frappant, de gauche à droite, les positions : ${chant.map((n) => n + 1).join(' - ')} (1 = le plus grave).`
        ]
      })
    };
  }

  Sceaux.enregistrer({ numero: 5, monter });
})();
