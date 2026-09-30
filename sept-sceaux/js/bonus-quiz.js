// Bonus — L'Épreuve de la Mémoire : quiz sur la saison 1 d'Harmonia.
// Questions validées par le MJ (tirées des notes de séance, rien de secret).
// Une question par écran, réponse corrigée aussitôt, score et titre à la fin.
// Partie en cours et meilleur score sauvegardés ; rejouable à volonté.
(function () {
  'use strict';
  const { el } = Sceaux;
  // Remplit un nœud en ignorant les emplacements vides (sinon « null » s'affiche).
  const remplir = (noeud, ...enfants) => noeud.replaceChildren(...enfants.flat().filter((x) => x != null));

  // [catégorie, question, bonne réponse, leurre, leurre, leurre]
  const QUESTIONS = [
    ['Les compagnons', 'Qui s’est coupé le bras ?', 'Kagé', 'Anoer', 'Varynor', 'Larian'],
    ['Les compagnons', 'À qui Kagé a-t-il confié son bras ?', '8run0', 'Koma', 'Sorra', 'Lord Valcaris'],
    ['Les compagnons', 'Où est rangé ce bras ?', 'Dans une boîte sous le lit de Kagé', 'Dans le coffre de Mnémarèse', 'Dans la roulotte de Larian', 'Dans la citadelle de Braem-Valor'],
    ['Les compagnons', 'Quel serment a prêté Larian ?', 'Chasteté', 'Silence', 'Courage', 'Pauvreté'],
    ['Les compagnons', 'Quel serment a prêté Kagé ?', 'Ne plus être lâche', 'Chasteté', 'Ne plus mentir', 'Ne jamais fuir un combat naval'],
    ['Les compagnons', 'Que perd celui qui rompt son serment ?', 'Un membre', 'Un souvenir', 'Sa transcendance', 'Un œil'],
    ['Les compagnons', 'De quel mal Varynor est-il atteint ?', 'La sève noire', 'La peste grise', 'Le mal des profondeurs', 'La fièvre du Chant'],
    ['Les compagnons', 'Comment Varynor a-t-il attrapé ce mal ?', 'En se coupant avec la lame de la vieille', 'En buvant une potion', 'Mordu par une créature', 'Au contact du coffre'],
    ['Les compagnons', 'Comment s’appelle l’âne de Larian ?', 'Serge', 'Bruno', 'Gribouille', 'Kamot'],
    ['Les compagnons', 'Qu’adore manger Serge ?', 'Les betteraves', 'Les carottes', 'Le foin des nains', 'Les pommes'],
    ['Les compagnons', 'Pourquoi Larian ne connaît-il pas l’histoire de son âne ?', 'Il ne parle pas aux animaux', 'L’âne est muet', 'Il l’a volé', 'Il l’a oubliée'],
    ['Les compagnons', 'Comment s’appelle la grenouille de Telissandre ?', 'Gribouille', 'Serge', 'Croâ', 'Mnémarèse'],
    ['Les compagnons', 'Pour quoi Koma a-t-il pris Kagé en s’endormant ?', 'Un doudou', 'Son père', 'Un oreiller', 'Un gros chat'],
    ['Les compagnons', 'Qu’est devenue la tête de Koma ?', 'Une tête de feuilles et de branches', 'Une tête de pierre', 'Une tête de lézard', 'Une tête de brume'],
    ['Les compagnons', 'Dans la vision du futur, que portait Koma ?', 'Des écailles de dragon vert émeraude', 'Une armure naine', 'Une couronne de ronces', 'Un masque d’argent'],
    ['Les compagnons', 'Quel animal Kagé a-t-il absorbé au Refuge Déphasé ?', 'Un lézard', 'Un rat', 'Un corbeau', 'Un serpent'],
    ['Les compagnons', 'Quelle potion a bue Ravok chez l’alchimiste ?', 'Le Philtre du Geste Augmenté', 'Le Sérum de la Flottaison', 'Le Philtre des Pas Silencieux', 'L’Essence de l’Esprit Astral'],
    ['Les compagnons', 'Quel effet a eu la potion de Varynor ?', 'Ses cheveux s’animent', 'Il flotte', 'Il s’endort toutes les 15 minutes', 'Il tombe au hasard'],
    ['Les compagnons', 'Qui s’endort toutes les 15 minutes après sa potion ?', 'Telissandre', 'Koma', 'Lyria', 'Larian'],
    ['Les compagnons', 'Quel souvenir Kagé a-t-il oublié ?', 'Qu’il a été rejeté par son village', 'Le nom de sa mère', 'Comment se battre', 'Son premier amour'],
    ['Les compagnons', 'Combien de coups de fouet a reçus Anoer ?', '3', '1', '5', '10'],
    ['Les personnages croisés', 'Quel noble a invité le groupe à un dîner mystérieux ?', 'Lord Valcaris', 'Seron Acierclerc', 'Alessio Marvius', 'Drazil'],
    ['Les personnages croisés', 'Quel est le pseudo du chef du Cercle des Veilleurs ?', 'Drazil', 'Veulg', 'Météore', 'Sorra'],
    ['Les personnages croisés', 'Quel est le pseudo de Lord Valcaris dans le Cercle ?', 'Veulg', 'Drazil', 'Maneki', 'A.G.'],
    ['Les personnages croisés', 'Quel est le pseudo de Kagé dans le Cercle ?', 'Maneki', 'Veulg', 'Tigre', 'Sorra'],
    ['Les personnages croisés', 'Quel désagrément cause la bague de l’Ordre ?', 'Elle fait mal au doigt la nuit et ne s’enlève pas', 'Elle brûle au soleil', 'Elle chuchote', 'Elle rend muet'],
    ['Les personnages croisés', 'Sous quel pseudo attend-on le coffre dans la capitale naine ?', 'Sorra', 'Météore', 'Drazil', 'Mina'],
    ['Les personnages croisés', 'Qui est « Météore » ?', 'Un nain transcendant, tatoué jusqu’à l’épaule', 'Une elfe du Cercle', 'Un dragonborn', 'Le commandant du train'],
    ['Les personnages croisés', 'Comment s’appelle l’alliée naine de la Fée BD ?', 'Mina Frappeforte', 'Hulda Tonnebrune', 'Brenna Forgeclair', 'Sorra'],
    ['Les personnages croisés', 'Quel est le nom complet de « A.G. » ?', 'Alix Gontran', 'Aelys Gorvan', 'Alessio Gontran', 'Anoer Galvan'],
    ['Les personnages croisés', 'Qui a promis un maître d’armes à Anoer ?', 'Seron Acierclerc', 'Lord Valcaris', 'Le comte', 'Drazil'],
    ['Les personnages croisés', 'Qui est le boss du laboratoire vaincu dans la vision ?', 'Zeyrion', 'Drazil', 'Le kraken', 'Alessio Marvius'],
    ['Les grands moments', 'Quel culte le groupe a-t-il vaincu à Valperce ?', 'Les Arches du Renouveau', 'La Branche Obsidienne', 'Les Lueurs Vaines', 'Le Cercle des Veilleurs'],
    ['Les grands moments', 'Quel monstre ont-ils vaincu avant d’arriver à Tréfange ?', 'Un kraken', 'Un dragon', 'Un golem', 'Une hydre'],
    ['Les grands moments', 'Où se trouve le premier cristal d’Aelys Vhorian ?', 'Au cœur de la citadelle de Braem-Valor', 'Dans le Refuge Déphasé', 'Sous Gravathor', 'À Valperce'],
    ['Les grands moments', 'Depuis combien de temps Aelys a-t-il disparu ?', '98 ans', '50 ans', '200 ans', '1 000 ans'],
    ['Les grands moments', 'À quelle fréquence est la sphère d’apprentissage du G4RD13N ?', '166 Hz', '440 Hz', '999 Hz', '7 Hz'],
    ['Les grands moments', 'Qu’a fait Kagé devant le monolithe ?', 'Ses besoins', 'Une prière', 'Un serment', 'Il l’a brisé'],
    ['Les grands moments', 'Quelle faction a attaqué le Train Frelon ?', 'La Branche Obsidienne', 'Les Arches du Renouveau', 'Le Cercle des Veilleurs', 'Les Lueurs Vaines']
  ];
  // Indice de l’Énigme des Profondeurs : cette question n’apparaît qu’une fois l’Énigme ouverte à tous.
  if ((window.SCEAUX_CONFIG.enigme || {}).ouverteATous) QUESTIONS.push(JSON.parse(Sceaux.voile('WyJMZXMgUHJvZm9uZGV1cnMiLCJDb21tZW50IGxlcyBuYWlucyBub21tZW50LWlscyBjZSBxdWkgYmF0IHNvdXMgbGEgcGllcnJlID8iLCJMZSBDxZN1ciBWaWJyYW50IiwiTGUgU291ZmZsZSBBbmNpZW4iLCJMYSBGb3JnZSBNdWV0dGUiLCJMZSBEb3JtZXVyIl0=')));
  const N = QUESTIONS.length;
  const TITRES = [
    [0, 'Voyageur égaré', 'Harmonia t’a-t-elle seulement vu passer ?'],
    [13, 'Barde de passage', 'Tu connais les refrains, pas encore les couplets.'],
    [23, 'Chroniqueur', 'Ta mémoire vaut un bon carnet de route.'],
    [31, 'Archiviste du Chant', 'Peu de détails t’échappent.'],
    [37, 'Gardien de la Mémoire', 'Rien ne se perd tant que tu t’en souviens.']
  ];
  const titre = (score) => TITRES.filter(([min]) => score >= min).pop();

  const melanger = (t) => {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const nouvellePartie = () => ({ ordres: QUESTIONS.map(() => melanger([0, 1, 2, 3])), choix: [] });

  function monter(zone, ctx) {
    let partie = ctx.memoire.lire();
    const valide = partie && Array.isArray(partie.ordres) && partie.ordres.length === N && Array.isArray(partie.choix);

    function accueil() {
      const meilleur = ctx.meilleur.lire();
      const enCours = valide && partie.choix.length > 0 && partie.choix.length < N;
      remplir(zone, 
        el('p', { class: 'consigne', text: `${N} questions sur tout ce que vous avez vécu dans Harmonia : vos compagnons, les personnages croisés, les grands moments. Une seule réponse juste à chaque fois.` }),
        meilleur != null ? el('p', { class: 'centre' }, 'Ton meilleur score : ', el('strong', { text: `${meilleur} / ${N}` }), ` · ${titre(meilleur)[1]}`) : null,
        el('div', { class: 'actions' },
          enCours ? el('button', { type: 'button', text: `Reprendre (question ${partie.choix.length + 1})`, onclick: question }) : null,
          el('button', { type: 'button', class: enCours ? 'discret' : '', text: enCours ? 'Recommencer à zéro' : 'Commencer', onclick: () => { partie = nouvellePartie(); ctx.memoire.ecrire(partie); question(); } })));
    }

    function question() {
      const i = partie.choix.length;
      if (i >= N) { fin(); return; }
      const [categorie, texte, ...reponses] = QUESTIONS[i];
      const ordre = partie.ordres[i];
      const suite = el('div', { class: 'actions' });
      const correction = el('p', { class: 'message' });
      const boutons = ordre.map((k) => el('button', {
        type: 'button', class: 'reponse', text: reponses[k],
        onclick: () => {
          if (partie.choix.length !== i) return; // déjà répondu
          partie.choix.push(k);
          ctx.memoire.ecrire(partie);
          boutons.forEach((b, j) => {
            b.disabled = true;
            if (ordre[j] === 0) b.classList.add('juste');
            else if (ordre[j] === k) b.classList.add('fausse');
          });
          if (k === 0) { correction.className = 'message ok'; correction.textContent = 'Juste !'; }
          else { correction.className = 'message erreur'; correction.textContent = `Raté : c’était « ${reponses[0]} ».`; }
          suite.replaceChildren(el('button', { type: 'button', text: i + 1 < N ? 'Question suivante →' : 'Voir mon score', onclick: question }));
        }
      }));
      const score = partie.choix.filter((c) => c === 0).length;
      remplir(zone, 
        el('div', { class: 'progres-quiz' },
          el('span', { text: `Question ${i + 1} / ${N}` }),
          el('span', { text: `Score : ${score}` })),
        el('div', { class: 'barre-quiz' }, el('span', { style: `width:${(i / N) * 100}%` })),
        el('p', { class: 'categorie-quiz', text: categorie }),
        el('h3', { class: 'question-quiz', text: texte }),
        el('div', { class: 'reponses' }, boutons),
        correction,
        suite);
      window.scrollTo(0, 0);
    }

    function fin() {
      const score = partie.choix.filter((c) => c === 0).length;
      const meilleur = ctx.meilleur.lire();
      if (meilleur == null || score > meilleur) ctx.meilleur.ecrire(score);
      const [, nom, phrase] = titre(score);
      const erreurs = QUESTIONS.map((q, i) => ({ q, c: partie.choix[i] })).filter((x) => x.c !== 0);
      remplir(zone, 
        el('div', { class: 'fin-quiz' },
          el('p', { class: 'score-quiz', text: `${score} / ${N}` }),
          el('p', { class: 'titre-quiz', text: nom }),
          el('p', { class: 'doux', text: phrase }),
          meilleur != null && score > meilleur ? el('p', { class: 'message ok', text: 'Nouveau record !' }) : null),
        erreurs.length ? el('details', { class: 'regles panneau' },
          el('summary', { text: `Revoir tes ${erreurs.length} erreur${erreurs.length > 1 ? 's' : ''}` }),
          el('ul', {}, erreurs.map(({ q, c }) => el('li', {}, el('strong', { text: q[1] + ' ' }), `Ta réponse : ${q[2 + c]}. La bonne : ${q[2]}.`)))) : null,
        el('div', { class: 'actions' },
          el('button', { type: 'button', text: 'Rejouer', onclick: () => { partie = nouvellePartie(); ctx.memoire.ecrire(partie); question(); } }),
          el('button', { type: 'button', class: 'discret', text: '← Les bonus', onclick: ctx.retour })));
      window.scrollTo(0, 0);
    }

    if (valide && partie.choix.length >= N) fin(); else accueil();
  }

  Sceaux.enregistrerBonus({
    id: 'quiz',
    titre: 'L’Épreuve de la Mémoire',
    description: `Un quiz de ${N} questions sur la saison 1 d’Harmonia. Rejouable à volonté.`,
    resume: (meilleur) => `Ton meilleur score : ${meilleur} / ${N}`,
    monter
  });
})();
