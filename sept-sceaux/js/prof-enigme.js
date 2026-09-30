// Les Profondeurs — L'Énigme des Profondeurs (boss final)
// Une porte qui demande le code d'accès trouvé dans le Registre chiffré (propre à chaque joueur),
// puis une seule question, un seul champ. La réponse est la même pour tous ; les indices sont
// disséminés un peu partout sur le site. La bonne réponse donne un code final propre au joueur,
// à transmettre au MJ : il est calculé à partir de la réponse, donc introuvable sans elle.
(function () {
  'use strict';
  const { el } = Sceaux;
  // Remplit un nœud en ignorant les emplacements vides (sinon « null » s'affiche à l'écran).
  const remplir = (noeud, ...enfants) => noeud.replaceChildren(...enfants.flat().filter((x) => x != null));
  const QUESTION = 'Qu’entend la pierre quand plus personne ne chante ?';
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const normaliser = (t) => t.toUpperCase().replace(/Œ/g, 'OE').replace(/Æ/g, 'AE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');

  // La réponse, sous une forme qui ne saute pas aux yeux en lisant le code source.
  const CANON = atob('Q09FVVJWSUJSQU5U');
  const CIBLE = atob('S0VSVklCUkFO'); // forme « à l’oreille » de la réponse

  // Forme « à l’oreille » : l’orthographe ne compte pas (fautes, accents, articles, lettres doublées…).
  const ARTICLES = new Set(['LE', 'LA', 'LES', 'L', 'UN', 'UNE', 'DU', 'DES', 'D']);
  function oreille(texte) {
    const mots = texte.toUpperCase().replace(/Œ/g, 'OE').replace(/Æ/g, 'AE').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z]+/g, ' ').trim().split(' ').filter((m) => m && !ARTICLES.has(m));
    let x = mots.join('');
    x = x.replace(/PH/g, 'F').replace(/QU/g, 'K').replace(/C(?=[EIY])/g, 'S').replace(/C/g, 'K')
      .replace(/EAU/g, 'O').replace(/AU/g, 'O').replace(/OEU|OE|EU/g, 'E').replace(/Y/g, 'I').replace(/H/g, '').replace(/W/g, 'V').replace(/Z/g, 'S')
      .replace(/[AE][MN](?![AEIOU])/g, 'AN').replace(/(.)\1+/g, '$1');
    while (/[TDSXE]$/.test(x) && x.length > 3) x = x.slice(0, -1);
    return x;
  }
  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (x, i) => [i, ...new Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // Deux fautes tolérées, mais la première lettre « à l’oreille » doit être la bonne (sinon des mots voisins passeraient).
  const bonneReponse = (texte) => { const o = oreille(texte); return o[0] === CIBLE[0] && distance(o, CIBLE) <= 2; };

  // Le nain qui garde la porte se moque des mauvaises réponses… et laisse filer un indice quand on brûle.
  const pioche = (liste, n) => liste[n % liste.length];
  const MOQUERIES = [
    'Hin hin hin. Non.',
    'Par la barbe de mon arrière-grand-mère… Même elle aurait trouvé, et elle est morte depuis trois siècles.',
    'La pierre a entendu ta réponse. Elle rigole encore.',
    'Tu as vraiment tapé ça ? Avec tes doigts ? Devant tout le monde ?',
    'Faux. Retourne casser des cailloux, ça t’ira mieux.',
    'Un gobelin bourré aurait fait mieux. Et en chantant, en plus.',
    'Non. Et arrête de me regarder comme ça, c’est pas moi qui ai écrit la question.',
    'Silence. (Ça, c’est la pierre qui se retient de rire.)',
    'Encore raté. On va finir par graver ton nom sur le mur des perdants.',
    'T’as fouillé le site, ou t’as tapé le premier mot qui t’est passé par la tête ?',
    'Ma hache a plus de jugeote que toi. Et elle est rouillée.',
    'Non, non et re-non. Tu veux un indice ? Moi aussi : l’indice de ton intelligence.'
  ];
  function reponseDuNain(texte, n) {
    const brut = texte.toUpperCase().replace(/Œ/g, 'OE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const o = oreille(texte);
    const coeur = /KER|KUR/.test(o), vibre = /VIBR|VIBER/.test(o);
    if (coeur && vibre) return 'Tu y es presque ! Mais les nains lui ont donné un nom, pas une phrase de poète elfique. Deux mots, pas un de plus.';
    if (coeur) return pioche([
      'Un cœur… Ah ! Enfin un mot qui sert à quelque chose. Mais un cœur tout seul, ça fait pas grand-chose, gamin. Il fait quoi, ce cœur ?',
      'Tu tiens le cœur. Bravo, champion. Il lui manque encore la moitié de son nom.',
      'Oui, oui, un cœur. Ton cœur à toi, il bat au moins ? Parce que ton cerveau, lui, il est à l’arrêt. Il manque un mot.'
    ], n);
    if (vibre) return pioche([
      'Ça vibre, oui. Mais qu’est-ce qui vibre, tête de gravier ? Tes genoux ?',
      'Tu chauffes. Mais un adjectif sans son nom, c’est comme une hache sans manche.'
    ], n);
    if (/BAT|POUL|PULS|RITM|RYTHM/.test(brut)) return 'Ça bat, ça pulse, oui oui. Tu entends bien. Maintenant trouve comment les nains l’appellent.';
    if (/ENTIT/.test(brut)) return '« L’Entité » ? Ha ! C’est comme ça que l’appellent ceux qui ont peur du noir. Les nains, eux, lui ont donné un vrai nom.';
    if (/ECHO/.test(brut)) return 'L’écho ? Trop facile. Si c’était ça, même un elfe l’aurait trouvé. Cherche plus profond.';
    if (/SILENC/.test(brut)) return 'Le silence ? Bravo, t’as répondu à la question par la question. On t’applaudit… en silence.';
    if (/CHANT|CHANS|MELOD|MUSIQ/.test(brut)) return 'On t’a dit : quand PLUS PERSONNE ne chante. Lis la question, ça aide.';
    if (/ENCLUM|MARTEAU|FORGE/.test(brut)) return 'Toujours à penser à la forge, hein ? Pas bête, pour un nain. Mais c’est pas ça. Cherche en dessous.';
    if (/RIEN/.test(brut)) return 'Rien ? C’est surtout ce qu’il y a dans ta caboche.';
    return pioche(MOQUERIES, n);
  }

  async function codeFinal(reponse, code) {
    const h = await Sceaux.sha256('enigme-des-profondeurs:' + reponse + ':' + code);
    let s = '';
    for (let i = 0; i < 8; i++) s += ALPHA[parseInt(h.slice(i * 2, i * 2 + 2), 16) % ALPHA.length];
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  }

  function monter(zone, ctx) {
    const attendu = (window.SCEAUX_CONFIG.enigme || {}).reponse;
    const garde = ctx.memoire.lire() || {};
    const pourTous = !!(window.SCEAUX_CONFIG.enigme || {}).ouverteATous;
    const souvenirs = () => (typeof ctx.garde.lire() === 'object' && ctx.garde.lire()) || {};

    // Code MJ : la carte complète des indices de l’Énigme (contenu encodé, pour ne pas la laisser lisible dans le code).
    function carteMJ() {
      if (!ctx.mj) return null;
      const bloc = el('div', { class: 'carte-indices-mj' });
      return el('div', { class: 'panneau carte-mj' },
        el('button', { type: 'button', class: 'discret', text: 'MJ : voir où se trouve chaque indice', onclick: (ev) => {
          if (bloc.childNodes.length) { bloc.replaceChildren(); ev.target.textContent = 'MJ : voir où se trouve chaque indice'; return; }
          const c = JSON.parse(Sceaux.voile('eyJyZXBvbnNlIjoiTGUgQ8WTdXIgVmlicmFudCIsImluZGljZXMiOltbIkFjY3VlaWwgZGVzIFNlcHQgU2NlYXV4ICjDqWNyYW4gZHUgY29kZSkiLCJMYSBwcmnDqHJlLCBlbiBoYXV0IDogY2lucSBsZXR0cmVzIGzDqWfDqHJlbWVudCBkb3LDqWVzIGV0IGVuIGdyYXMsIGRhbnMgbOKAmW9yZHJlIGR1IHRleHRlLiIsIkMsIE8sIEUsIFUsIFIiLCJUb3Vqb3VycyB2aXNpYmxlLCBtYWlzIHVuIGpvdWV1ciBkw6lqw6AgdmVudSBlc3QgcmVjb25uZWN0w6kgYXV0b21hdGlxdWVtZW50IDogaWwgbmUgcmV2b2l0IGxhIHByacOocmUgcXXigJlhdmVjIMKrIENoYW5nZXIgZGUgY29kZSDCuyAob3Ugc3VyIHVuIG5vdXZlbCBhcHBhcmVpbCkuIl0sWyJQb3J0ZSBkZXMgU2VwdCBTY2VhdXgsIHNlY3Rpb24gwqsgw4ljbGF0cyDCuyIsIlRvdWNoZXIgdW4gw6ljbGF0IDogc2EgZ3JhdnVyZSBz4oCZYWZmaWNoZSwgc3VpdmllIGRlIMKrIEF1IGRvcywgdW5lIGxldHRyZSBtaW51c2N1bGUgOiDigKYgwrsuIiwiViAoc2NlYXUgSSksIEkgKElJKSwgQiAoSUlJKSwgUiAoSVYpLCBBIChWKSwgTlQgKFZJKSIsIlNldWxlbWVudCBwb3VyIGxlcyBzY2VhdXggZMOpasOgIGJyaXPDqXMgcGFyIGxlIGpvdWV1ci4iXSxbIk9uZ2xldCBQcm9mb25kZXVycywgc291cyBs4oCZYXZlcnRpc3NlbWVudCIsIlVuZSBwaHJhc2UgcHJlc3F1ZSBpbnZpc2libGUgKHRyw6hzIGZhaWJsZSBjb250cmFzdGUpLCBlbiBkZXNzb3VzIGR1IHRleHRlIGTigJlhdmVydGlzc2VtZW50LiIsIsKrIExlcyBuYWlucyBuZSBs4oCZYXBwZWxsZW50IHBhcyBs4oCZRW50aXTDqS4gwrsgKGxhIHLDqXBvbnNlIGVzdCB1biBub20gbmFpbikiLCJUb3Vqb3VycyB2aXNpYmxlLCBzaSBvbiByZWdhcmRlIGJpZW4uIl0sWyJQcm9mb25kZXVycyA6IExhIFRhcGlzc2VyaWUgZWZmYWPDqWUiLCJSZXZlbmlyIHN1ciBs4oCZw6lwcmV1dmUgdW5lIGZvaXMgcsOpdXNzaWUgOiB1bmUgcGhyYXNlIGFwcGFyYcOudC4iLCLCqyDigKYgdG91dCBhdSBjZW50cmUsIGxlcyB0aXNzZXJhbmRzIGF2YWllbnQgYnJvZMOpIHVuIGPFk3VyIGRlIHBpZXJyZS4gwrsiLCJBcHLDqHMgcsOpdXNzaXRlIGRlIGzigJnDqXByZXV2ZS4iXSxbIlByb2ZvbmRldXJzIDogTGUgUsOpc2VhdSBydW5pcXVlIiwiUmV2ZW5pciBzdXIgbOKAmcOpcHJldXZlIHVuZSBmb2lzIHLDqXVzc2llIDogdW5lIHBocmFzZSBhcHBhcmHDrnQuIiwiwqsg4oCmIGF1IGNlbnRyZSwgbGUgQ8WTdXIgbuKAmWEgcGFzIGNlc3PDqSA6IHNvdXMgdGVzIGRvaWd0cywgcXVlbHF1ZSBjaG9zZSBjb250aW51ZSBkZSBiYXR0cmUuIMK7IiwiQXByw6hzIHLDqXVzc2l0ZSBkZSBs4oCZw6lwcmV1dmUuIl0sWyJQcm9mb25kZXVycyA6IExlcyBHbGFjZXMgZHUgQ29sIiwiUmV2ZW5pciBzdXIgbOKAmcOpcHJldXZlIHVuZSBmb2lzIHLDqXVzc2llIDogdW5lIHBocmFzZSBhcHBhcmHDrnQuIiwiwqsg4oCmIHR1IHNlbnMgcXVlbHF1ZSBjaG9zZSB2aWJyZXIsIHRyw6hzIGxvaW4gZGVzc291cywgbGVudGVtZW50LiDCuyIsIkFwcsOocyByw6l1c3NpdGUgZGUgbOKAmcOpcHJldXZlLiJdLFsiT25nbGV0IEJvbnVzIDogTOKAmcOJcHJldXZlIGRlIGxhIE3DqW1vaXJlIChxdWl6KSIsIlVuZSA0MGUgcXVlc3Rpb24sIGNhdMOpZ29yaWUgwqsgTGVzIFByb2ZvbmRldXJzIMK7LiIsIsKrIENvbW1lbnQgbGVzIG5haW5zIG5vbW1lbnQtaWxzIGNlIHF1aSBiYXQgc291cyBsYSBwaWVycmUgPyDCuyDihpIgTGUgQ8WTdXIgVmlicmFudCAobGV1cnJlcyA6IGxlIFNvdWZmbGUgQW5jaWVuLCBsYSBGb3JnZSBNdWV0dGUsIGxlIERvcm1ldXIpIiwiU2V1bGVtZW50IHF1YW5kIGzigJnDiW5pZ21lIGVzdCBvdXZlcnRlIMOgIHRvdXMgKG91dmVydGVBVG91czogdHJ1ZSkuIFVuZSBwYXJ0aWUgZGUgcXVpeiBlbiBjb3VycyByZWNvbW1lbmNlIGFsb3JzLiJdLFsiUGFnZSBkZSBs4oCZw4luaWdtZSIsIkxhIMKrIHByZW1pw6hyZSBwaXN0ZSDCuywgc291cyBsYSBxdWVzdGlvbi4iLCLCqyBRdWFuZCB0dSBhcyByw6l1c3NpIHVuZSDDqXByZXV2ZSBkZXMgUHJvZm9uZGV1cnMsIHJldmllbnMgbGEgdm9pci4gwrsgOyBldCwgdW5lIGZvaXMgbOKAmcOJbmlnbWUgb3V2ZXJ0ZSDDoCB0b3VzIDogwqsgY2VydGFpbmVzIMOpcHJldXZlcyBkdSBzaXRlIG9udCBjaGFuZ8OpIMK7IChj4oCZZXN0IGxlIHF1aXopLiIsIlRvdWpvdXJzIHZpc2libGUgZGFucyBs4oCZw4luaWdtZS4iXSxbIlBhZ2UgZGUgbOKAmcOJbmlnbWUgOiBsZSBuYWluIGdhcmRpZW4iLCJTZXMgcsOpcG9uc2VzIGF1eCBtYXV2YWlzIGVzc2FpcyBtZXR0ZW50IHN1ciBsYSB2b2llLiIsIsKrIGPFk3VyIMK7IHNldWwsIMKrIHZpYnJhbnQgwrsgc2V1bCwgwqsgbGUgY8WTdXIgcXVpIHZpYnJlIMK7IChwcmVzcXVlKSwgYmF0dGVtZW50LCBFbnRpdMOpLCDDqWNobywgc2lsZW5jZSwgY2hhbnQsIGZvcmdlLiIsIsOAIGNoYXF1ZSBtYXV2YWlzZSByw6lwb25zZS4iXV19'));
          ev.target.textContent = 'MJ : masquer la carte des indices';
          bloc.replaceChildren(
            el('p', {}, el('strong', { text: 'Réponse : ' }), c.reponse),
            el('ol', {}, c.indices.map(([ou, comment, quoi, quand]) => el('li', {},
              el('strong', { text: ou }), el('br'),
              el('span', { text: comment }), el('br'),
              el('span', { class: 'quoi', text: quoi }), el('br'),
              el('span', { class: 'doux petit', text: quand })))));
        } }),
        bloc);
    }

    function porte() {
      const champ = el('input', { type: 'text', placeholder: 'Code d’accès', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Code d’accès aux Profondeurs' });
      const msg = el('p', { class: 'message' });
      remplir(zone,
        el('div', { class: 'panneau porte-enigme' },
          el('p', { text: 'Une dernière porte, sans poignée ni serrure. Seulement une fente, et une voix qui demande le mot de passage.' }),
          el('p', {}, el('strong', { text: 'Cette énigme est commune à tous.' }), ' Derrière la porte, chacun trouvera la même question, et elle n’a qu’une seule réponse. Seuls les codes d’accès, cachés dans le Registre chiffré, sont personnels.'),
          el('p', {}, el('strong', { text: 'Le premier voyageur qui déchiffre le Registre ouvre cette porte pour tout le monde.' }), ' Il doit envoyer aussitôt son code d’accès au MJ, qui ouvrira alors l’Énigme à tous. Si elle est ensuite résolue, c’est lui qui recevra la grande récompense.')),
        el('form', { class: 'form-mot', onsubmit: (ev) => {
          ev.preventDefault();
          if (normaliser(champ.value) === Sceaux.codeRegistre(ctx.code)) {
            ctx.garde.ecrire({ ...souvenirs(), porte: true });
            question();
          } else { ctx.secouer(champ); msg.className = 'message erreur'; msg.textContent = 'La porte ne répond pas.'; }
        } }, champ, el('button', { type: 'submit', text: 'Prononcer' })),
        msg,
        carteMJ());
    }

    let essais = 0;
    function question() {
      const champ = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Ta réponse', value: garde.essai || '' });
      const msg = el('p', { class: 'message' });
      const resultat = el('div', {});
      champ.addEventListener('input', () => ctx.memoire.ecrire({ ouverte: true, essai: champ.value }));
      remplir(zone,
        el('div', { class: 'salle-enigme' },
          pourTous
            ? el('div', { class: 'panneau annonce-enigme' },
              el('p', {}, el('strong', { text: 'Un voyageur a déchiffré le Registre et ouvert cette porte pour tous.' }), ' L’Énigme est commune : mettez vos indices en commun, cherchez ensemble, parlez-vous. Seul, personne n’y arrivera. Si elle est résolue, celui qui a ouvert la porte recevra la grande récompense, et chacun de ceux qui l’auront aidé gagnera +10 points de Transcendance MAX.'))
            : el('div', { class: 'panneau annonce-enigme' },
              el('p', {}, el('strong', { text: 'La porte a reconnu ta voix.' }), ` Envoie tout de suite ton code d’accès au MJ : ${Sceaux.codeRegistreLisible(ctx.code)}. S’il est le premier à lui parvenir, c’est toi qui ouvres l’Énigme pour tout le monde, et la grande récompense sera pour toi si elle est résolue.`),
              el('p', { class: 'doux', text: 'Tu peux déjà chercher. Mais cette énigme est faite pour être résolue à plusieurs : dès que le MJ l’aura ouverte à tous, aidez-vous.' })),
          el('p', { class: 'doux petit', text: 'Énigme commune à tous les voyageurs' }),
          el('p', { class: 'question-enigme', text: QUESTION }),
          el('form', { class: 'form-mot', onsubmit: async (ev) => {
            ev.preventDefault();
            if (!normaliser(champ.value)) return;
            if (!attendu) { msg.className = 'message'; msg.textContent = 'La pierre se tait encore. Reviens plus tard.'; return; }
            const r = CANON;
            if (bonneReponse(champ.value) && await Sceaux.sha256('reponse-enigme:' + r) === attendu) {
              const code = await codeFinal(r, ctx.code);
              msg.className = 'message ok'; msg.textContent = (normaliser(champ.value).replace(/^LE/, '') === CANON ? '' : 'Tu écris comme un troll, mais la pierre a compris. ') + 'La pierre se tait. Puis, très loin, quelque chose lui répond.';
              resultat.replaceChildren(el('div', { class: 'panneau souvenir-registre' },
                el('p', { text: 'Donne ce code au MJ, et à personne d’autre :' }),
                el('p', { class: 'code-registre', text: code })));
              ctx.garde.ecrire({ ...souvenirs(), reponse: r });
              setTimeout(ctx.reussir, 4000);
            } else { ctx.secouer(champ); msg.className = 'message erreur nain'; msg.textContent = reponseDuNain(champ.value, essais++); }
          } }, champ, el('button', { type: 'submit', text: 'Répondre' })),
          msg, resultat,
          el('p', { class: 'murmure-enigme', text: 'La réponse n’est pas ici. Des indices sont disséminés partout dans les pages du site, et sur n’importe quelle page. Ceux qui savent regarder les trouveront.' }),
          pourTous ? el('p', { class: 'murmure-enigme' }, el('strong', { text: 'Depuis que la porte a été ouverte à tous, certaines épreuves du site ont changé.' }), ' Retourne les voir, même celles que tu crois connaître par cœur.') : null,
          el('p', { class: 'murmure-enigme exemple' }, el('strong', { text: 'Un premier murmure, pour l’exemple : ' }), 'quand tu as réussi une épreuve des Profondeurs, reviens la voir. Certaines ont encore quelque chose à te dire.')),
        carteMJ());
    }

    if (pourTous || souvenirs().porte) question(); else porte();
    return {
      solution: () => JSON.parse(Sceaux.voile('eyJyZXBvbnNlIjpbIkxlIEPFk3VyIFZpYnJhbnQgKGzigJlvcnRob2dyYXBoZSBuZSBjb21wdGUgcGFzIDogbGEgcsOpcG9uc2UgZXN0IGNvbXBhcsOpZSDCqyDDoCBs4oCZb3JlaWxsZSDCuykiXSwicG91cnF1b2kiOlsiQ+KAmWVzdCBsZSBub20gcXVlIGxlcyBuYWlucyBkb25uZW50IMOgIGzigJlFbnRpdMOpLiBRdWFuZCBwbHVzIHBlcnNvbm5lIG5lIGNoYW50ZSwgbGEgcGllcnJlIGVudGVuZCBjZSBxdWkgYmF0IGRlc3NvdXMuIiwiTGVzIGluZGljZXMgOiBsYSBwcmnDqHJlIGRlIGzigJnDqWNyYW4gZOKAmWFjY3VlaWwgKGNpbnEgbGV0dHJlcyBkb3LDqWVzIDogQywgTywgRSwgVSwgUikgOyBsZSBkb3MgZGVzIMOpY2xhdHMgZGVzIHNjZWF1eCAoViwgSSwgQiwgUiwgQSwgTlQpIDsgbGEgcGhyYXNlIHByZXNxdWUgaW52aXNpYmxlIHNvdXMgbOKAmWF2ZXJ0aXNzZW1lbnQgZGVzIFByb2ZvbmRldXJzICjCqyBMZXMgbmFpbnMgbmUgbOKAmWFwcGVsbGVudCBwYXMgbOKAmUVudGl0w6kgwrspIDsgbGVzIMOpcHJldXZlcyByw6l1c3NpZXMgZGUgbGEgVGFwaXNzZXJpZSwgZHUgUsOpc2VhdSBydW5pcXVlIGV0IGRlcyBHbGFjZXMgZHUgQ29sLCBxdWFuZCBvbiByZXZpZW50IGxlcyB2b2lyIDsgZXQsIHVuZSBmb2lzIGzigJnDiW5pZ21lIG91dmVydGUgw6AgdG91cywgdW5lIHF1ZXN0aW9uIGR1IHF1aXogwqsgTOKAmcOJcHJldXZlIGRlIGxhIE3DqW1vaXJlIMK7IChCb251cykuIl19'))
    };
  }

  // Une fois l'Énigme résolue, le code final reste affiché (recalculé avec la réponse gardée).
  function souvenir(ctx) {
    const bloc = el('div', { class: 'panneau souvenir-registre' });
    codeFinal(CANON, ctx.code).then((code) => bloc.replaceChildren(el('p', { text: 'Ton code final, à donner au MJ :' }), el('p', { class: 'code-registre', text: code })));
    return bloc;
  }

  Sceaux.testEnigme = { bonneReponse, reponseDuNain, oreille }; // pour les tests hors navigateur
  Sceaux.enregistrerEpreuve({ id: 'enigme', nom: 'L’Énigme des Profondeurs', icone: '◯', etoiles: 7, rang: 'boss', resume: '…', monter, souvenir });
})();
