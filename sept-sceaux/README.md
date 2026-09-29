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
4. Appeler `ctx.reussir()` quand le sceau est résolu, et `ctx.penalite(bouton, secondes)` après une erreur.

## État

| Sceau | Fichier | État |
|---|---|---|
| I. Le Cadran des Rois | `sceau1-cadran.js` | fait |
| II. Les Engrenages | `sceau2-engrenages.js` | fait |
| III. La Relève de la Garde | | à faire |
| IV. L'Inscription | | à faire |
| V. Le Chant des Diapasons | | à faire |
| VI. La Herse | | à faire |
| VII. Le Sceau du Maître + parchemins chiffrés | | à faire |
