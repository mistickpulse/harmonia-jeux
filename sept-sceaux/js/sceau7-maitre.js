// Sceau VII — Le Sceau du Maître (★★★★★)
// Méta-énigme : les six éclats gagnés portent chacun une gravure sur l'ordre dans lequel
// la montagne les a forgés. Il faut les poser dans cet ordre. Les gravures désignent les
// autres éclats tantôt par leur rune, tantôt par le sceau d'où ils viennent.
(function () {
  'use strict';
  const { el } = Sceaux;

  function monter(zone, ctx) {
    const O = Sceaux.ordreDuMaitre(ctx.code);
    const { runes, ordre, gravures } = O;
    const garde = ctx.memoire.lire() || {};
    const valide = (t) => Array.isArray(t) && t.length === 6 && t.every((x) => x === null || (x >= 0 && x < 6));
    let cases = valide(garde.cases) ? garde.cases : new Array(6).fill(null); // cases[i] = éclat posé en i
    let choisi = null; // éclat sélectionné dans la réserve
    const memoriser = () => ctx.memoire.ecrire({ cases });

    const rangee = el('div', { class: 'alveoles' });
    const reserve = el('div', { class: 'reserve-eclats' });
    const msg = el('p', { class: 'message' });

    function dessiner() {
      rangee.replaceChildren();
      cases.forEach((f, i) => {
        rangee.append(el('button', {
          type: 'button', class: 'alveole' + (f === null ? ' vide' : ''), 'aria-label': `Alvéole ${i + 1}` + (f === null ? ', vide' : `, éclat ${runes[f]}`),
          onclick: () => {
            if (choisi !== null) {
              const ancienne = cases.indexOf(choisi);
              if (ancienne >= 0) cases[ancienne] = cases[i]; // échange si l'éclat était déjà posé
              cases[i] = choisi; choisi = null;
            } else if (f !== null) {
              cases[i] = null; // reprendre l'éclat
            }
            memoriser(); dessiner();
          }
        }, el('span', { class: 'numero', text: String(i + 1) }), el('span', { class: 'rune', text: f === null ? '' : runes[f] })));
      });
      reserve.replaceChildren();
      runes.forEach((r, f) => {
        const pose = cases.includes(f);
        reserve.append(el('button', {
          type: 'button', class: 'eclat' + (choisi === f ? ' choisi' : '') + (pose ? ' pose' : ''),
          onclick: () => { choisi = choisi === f ? null : f; dessiner(); }
        },
          el('span', { class: 'fragment', text: r }),
          el('span', { class: 'texte', text: '« ' + gravures[f] + ' »' })));
      });
    }

    const bouton = el('button', {
      type: 'button', text: 'Sceller les éclats',
      onclick: () => {
        if (cases.includes(null)) { msg.className = 'message erreur'; msg.textContent = 'Il manque des éclats dans les alvéoles.'; return; }
        if (cases.every((f, i) => f === ordre[i])) {
          msg.className = 'message ok'; msg.textContent = 'Les éclats s’embrasent l’un après l’autre, du premier forgé au dernier.';
          setTimeout(ctx.reussir, 1400);
          return;
        }
        msg.className = 'message erreur';
        msg.textContent = 'Les éclats restent froids. Ce n’est pas l’ordre de la montagne.';
        ctx.secouer(rangee);
      }
    });

    zone.append(
      el('p', { class: 'consigne', text: 'Au centre de la porte, six alvéoles creusées dans la pierre. Au-dessus, une dernière inscription :' }),
      el('p', { class: 'devise', text: '« Rends-moi mes éclats dans l’ordre où la montagne les a forgés, du premier au dernier. »' }),
      rangee,
      msg,
      el('div', { class: 'actions' }, bouton),
      el('h3', { class: 'centre', text: 'Tes éclats et leurs gravures' }),
      el('p', { class: 'doux centre petit', text: 'Touche un éclat, puis une alvéole. Touche une alvéole occupée pour reprendre l’éclat.' }),
      reserve
    );
    dessiner();

    return {
      solution: () => {
        // Raisonnement : appliquer les gravures en commençant par les plus fortes.
        let restants = O.PERMS6;
        const aFaire = O.tests.map((t, f) => ({ t, f }));
        const etapes = [];
        const connu = new Array(6).fill(false);
        while (aFaire.length) {
          let m = 0, taille = Infinity;
          aFaire.forEach((x, i) => { const n = restants.filter(x.t).length; if (n < taille) { taille = n; m = i; } });
          const { t, f } = aFaire.splice(m, 1)[0];
          restants = restants.filter(t);
          const faits = [];
          for (let g = 0; g < 6; g++) {
            if (!connu[g] && restants.every((p) => p[g] === restants[0][g])) { connu[g] = true; faits.push(`${runes[g]} est le ${restants[0][g] === 0 ? '1er' : restants[0][g] + 1 + 'e'} forgé`); }
          }
          etapes.push(`${runes[f]} : « ${gravures[f]} » ${faits.length ? '→ ' + faits.join(' ; ') + '.' : '→ élimine des possibilités.'}`);
        }
        return {
          reponse: [`De gauche à droite : ${ordre.map((f) => runes[f]).join('  ')}`, ...ordre.map((f, i) => `${i + 1}. ${runes[f]} (${Sceaux.ECLAT_DE[f]})`)],
          pourquoi: [
            'Chaque gravure parle de son propre éclat (« je », « moi »). Quand elle cite un autre éclat par son sceau d’origine, il faut se souvenir de quel sceau vient quelle rune : c’est écrit sur la porte, dans les médaillons brisés.',
            'On applique les gravures en commençant par les plus contraignantes :',
            ...etapes,
            'Il ne reste alors qu’un seul ordre possible.'
          ]
        };
      }
    };
  }

  Sceaux.enregistrer({ numero: 7, monter });
})();
