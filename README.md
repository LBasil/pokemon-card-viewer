# Pokémon Card Viewer

Visionneuse de cartes Pokémon : choix d'une extension, liste des cartes, collection et decks enregistrés dans le `localStorage`. JavaScript vanilla et Bootstrap 4, données de l'API [pokemontcg.io](https://pokemontcg.io/).

## Lancer

Ouvrir `index.html` dans un navigateur.

## Ce que fait l'application

- Accueil : 9 cartes tirées d'une page au hasard.
- Sets : liste des extensions, les plus récentes d'abord, et leurs cartes.
- Cartes : recherche par nom (`pika` trouve Pikachu), avec Entrée au clavier.
- Détails d'une carte, ajout et retrait de la collection et du deck. Les listes sont gardées dans le `localStorage` ; la collection et le deck se chargent en une seule requête.
- Erreurs réseau, quota dépassé et délai trop long affichés dans l'interface au lieu d'échouer en silence.
- Texte de l'API échappé avant affichage, cartes utilisables au clavier, thème sombre.

## Organisation du code

- `lib.js` : fonctions sans DOM (échappement, construction des requêtes, lecture du stockage). Elles sont testées avec Node.
- `index.js` : accès à l'API et affichage.

## Tests

```bash
npm test
```

## Clé d'API

Aucune clé n'est nécessaire : l'API est utilisable sans, avec un quota réduit. Le code est servi tel quel au navigateur, une clé y serait lisible par tous.

Démo : https://pokemon-card-viewer-ashy.vercel.app/
