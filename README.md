# Harmonia — Jeux

Mini-jeux en ligne pour les joueurs de la campagne **Harmonia**, publiés avec GitHub Pages.

- `recap/` : **Précédemment dans Harmonia**, récap animé de la saison 1 avec compte à rebours jusqu'à la reprise. Copie publique de `Harmonia/Harmonia/PROPS/Précédemment dans Harmonia/` (coffre `Notes`) : toute correction se fait dans les deux, et rien de MJ n'y entre.
- `teaser/` : **bande-annonce de la saison 2**. **Obligatoire** : l'accueil y redirige tant que le joueur n'a pas vu la version en cours (cookie `harmonia_teaser`, secours `localStorage`). « Passer » ou la fin enregistrent la version et ramènent à l'accueil. Pour la faire revoir à tout le monde : changer `VERSION_TEASER` dans `index.html` **et** `VERSION` dans `teaser/index.html` (même valeur). Copie de `Harmonia/Harmonia/PROPS/Teaser saison 2/` (coffre `Notes`), avec `RETOUR = '../index.html'`.
- `sept-sceaux/` : **Les Sept Sceaux**, teaser de la saison 2 (7 énigmes de plus en plus difficiles).

## Règle d'or : ce dépôt est PUBLIC

Tout ce qui est ici est lisible par n'importe qui, joueurs compris.
- **Jamais de secret MJ en clair** : les parchemins sont chiffrés, les réponses stockées sous forme d'empreintes (hash).
- Les textes en clair (secrets, codes personnels, solutions) restent dans le coffre privé `Notes`, dans `mini-jeux/Sept Sceaux - MJ.md`.

## Tester en local

Ouvrir `index.html` dans Chrome, ou lancer un petit serveur :

```
npx serve .
```
