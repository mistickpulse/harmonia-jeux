# Les Sept Sceaux

Teaser de la saison 2 d'Harmonia : sept énigmes de plus en plus difficiles. Les briser toutes ouvre le parchemin personnel du joueur.

## Structure

- `index.html` : la page ; `style.css` : l'apparence (téléphone et ordinateur).
- `js/config.js` : empreintes SHA-256 des codes personnels acceptés (jamais de code en clair).
- `js/moteur.js` : écran du code, porte, navigation, sauvegarde dans le navigateur, fragments.
- `js/sceauN-nom.js` : un fichier par sceau, qui s'enregistre avec `Sceaux.enregistrer({ numero, monter(zone, ctx) })`.

## Ajouter un sceau

1. Créer `js/sceauN-nom.js` sur le modèle des sceaux existants.
2. L'ajouter dans `index.html`, après les autres.
3. Utiliser `ctx.hasard` pour tout ce qui varie : le même code donne toujours la même énigme, deux codes donnent deux énigmes différentes.
4. Appeler `ctx.reussir()` quand le sceau est résolu. **Essais illimités** : aucun blocage après une erreur. Sauvegarder le travail en cours avec `ctx.memoire.ecrire(etat)` à chaque action, et le restaurer au montage avec `ctx.memoire.lire()` (stockage local + cookie).
5. Faire renvoyer à `monter` un objet `{ solution: () => ({ reponse: [...], pourquoi: [...] }) }` : la solution de l'énigme générée et le raisonnement qui y mène (texte ou nœuds DOM). Le moteur l'affiche dans un panneau latéral quand on entre la clé du sceau (empreintes dans `config.solutions`).
6. Ne pas conditionner le résultat à une animation : si l'onglet est caché, le navigateur les met en pause (voir `document.hidden` dans les sceaux I et II).
7. À chaque mise en ligne, augmenter le numéro `?v=` de tous les fichiers dans `index.html` (sinon les navigateurs gardent l'ancienne version en cache une dizaine de minutes).

## État

| Sceau | Fichier | État |
|---|---|---|
| I. Le Cadran des Rois | `sceau1-cadran.js` | fait |
| II. Les Engrenages | `sceau2-engrenages.js` | fait |
| III. La Relève de la Garde | `sceau3-garde.js` | fait |
| IV. L'Inscription | `sceau4-inscription.js` | fait |
| V. Le Chant des Diapasons | `sceau5-diapasons.js` | fait |
| VI. La Herse | `sceau6-herse.js` | fait |
| VII. Le Sceau du Maître | `sceau7-maitre.js` | fait |
| Parchemins chiffrés | `recompenses.js` (généré) | mécanisme fait ; textes à fournir par le MJ |

## Récompenses

`js/recompenses.js` est **généré** : ne pas le modifier à la main. Il contient les parchemins chiffrés (AES-256-GCM), une clé par code joueur ; les textes en clair restent dans le coffre privé du MJ. Trois paliers : parchemin personnel (sceau II), lambeaux d'une phrase commune (sceau IV), secret final (sceau VII).
