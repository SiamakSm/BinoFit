# BINOFIT - Application de matching sportif

## Concept

Application qui connecte des sportifs pour pratiquer ensemble de manière ponctuelle.

## Stack technique

- Frontend: Vue 3 + Vite + TypeScript + Shadcn-Vue (/public), hébergé sur Vercel
- Backend: API Cloudflare Workers en TypeScript avec Hono (/workers)
- Base de données: Supabase Postgres (projet hébergé à Paris), schéma dans /specs/schema.sql — toutes les données, messages compris
- Auth: Firebase Authentication, uniquement pour la connexion (lien magique par e-mail) et le jeton d'identité vérifié par le Worker
- Carte: LeafletJS
- Géolocalisation: zones prédéfinies dans public/src/services/location.ts (Google Places API : À compléter, non utilisé dans le code actuel)
- Ancien hébergement du front encore configuré : Firebase Hosting (public/firebase.json)

## Structure

- /public → Frontend PWA mobile-first
- /workers → Backend API Cloudflare
- /docs → Documentation technique
- /specs → Spécifications OpenAPI (openapi.json), schéma SQL (schema.sql) et modèle de données (data-model.md)
- Maquettes : `BINOFIT v4 Wireframes.dc.html` à la racine
- Tests Playwright : À compléter (pas de dossier /tests dans le dépôt)

## Commandes

- cd public && npm run dev → Démarrer le frontend
- cd workers && npx wrangler dev → Démarrer le backend

## Conventions

- Réponses de l'API en camelCase, base de données en snake_case : la conversion se fait uniquement dans workers/src/lib/dbMapper.ts.
- Toutes les routes de l'API vérifient le jeton Firebase (`Authorization: Bearer <jeton>`, middleware workers/src/middleware/auth.ts), sauf /api/health, /docs et /openapi.json.
- Une branche par sujet ; jamais de commit sur main (passer par une pull request).
- Aucune clé ni secret dans le dépôt : les secrets vont dans .dev.vars (local, ignoré par git) ou dans les secrets Wrangler / variables Vercel.
