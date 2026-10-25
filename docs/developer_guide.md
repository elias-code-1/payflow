# Guide développeur PayFlow

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

## Règles d’édition

- Modifier le code de manière ciblée
- Respecter l’architecture existante
- Ne pas mélanger le front et le back dans les mêmes fichiers
- Ne pas introduire de webhook automatique comme flux principal
- Documenter les nouveaux modules

## Points d’entrée

- Frontend : `src/main.jsx` et `src/dashboard/main.jsx`
- Backend : `server.js` + `server/app.js`
- DB : `server/db.js`
- Routes : `server/routes/api.js`

## Vérifications recommandées

```bash
npm run build
```

## Conventions

- Français pour les messages utilisateur
- Noms de fichiers clairs et explicites
- Documentation à jour au fil des fonctionnalités
