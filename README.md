# BINOFIT

Application web mobile-first qui connecte des sportifs pour pratiquer ensemble de manière
ponctuelle : un utilisateur trouve des partenaires proches (sport, niveau, disponibilités),
leur propose une activité (sport, date, lieu), puis échange avec eux par messages.

## Adresses

| Quoi                     | Adresse                                                    |
| ------------------------ | ---------------------------------------------------------- |
| Site (front)             | https://bino-fit.vercel.app                                |
| API (back)               | https://binofit-api.siamak036.workers.dev                  |
| Documentation de l'API   | https://binofit-api.siamak036.workers.dev/docs (Swagger UI) |
| Contrat OpenAPI          | https://binofit-api.siamak036.workers.dev/openapi.json      |

## Architecture

```
  Navigateur (PWA mobile-first)
  Vue 3 + Vite + TypeScript + Shadcn-Vue + Leaflet
  hébergé sur Vercel
        │                         │
        │ 1. connexion            │ 2. appels HTTPS + "Authorization: Bearer <jeton Firebase>"
        │    (lien magique)       │    réponses JSON en camelCase
        ▼                         ▼
  Firebase Authentication     API Cloudflare Workers (TypeScript, Hono)
  (e-mail + jeton             ├─ vérifie le jeton Firebase (clés publiques Google)
   d'identité uniquement)     ├─ valide les données et les droits
                              └─ dbMapper.ts : camelCase ⇄ snake_case
                                          │
                                          │ 3. PostgREST (clé secrète Supabase)
                                          ▼
                              Supabase Postgres (Paris)
                              users, user_sports, user_availability, activities,
                              conversations, participants, messages, favorites
```

Le front ne parle jamais directement à la base : toutes les données passent par l'API.

## Dossiers

| Dossier / fichier                  | Contenu                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| `public/`                          | Front Vue 3 (PWA mobile-first)                                  |
| `workers/`                         | API Cloudflare Workers (voir `workers/README.md`)               |
| `specs/`                           | `openapi.json` (contrat de l'API), `schema.sql`, `data-model.md` |
| `docs/`                            | Documentation technique (diagramme du modèle de données)        |
| `BINOFIT v4 Wireframes.dc.html`    | Maquettes                                                       |
| `AGENTS.md`                        | Stack, structure et conventions du projet                       |

## Lancer en local

Prérequis : Node.js 22 (via nvm).

### Back (API)

```bash
cd workers
nvm use 22
npm install
cp .dev.vars.example .dev.vars   # puis renseigner SUPABASE_SECRET_KEY (jamais commité)
npm run dev                      # wrangler dev, API sur http://localhost:8787
```

`FIREBASE_PROJECT_ID`, `SUPABASE_URL` et `ENVIRONMENT` sont déjà dans `workers/wrangler.toml`.

### Front

```bash
cd public
nvm use 22
npm install
cp .env.example .env             # puis renseigner les variables listées ci-dessous
npm run dev                      # Vite, sur http://localhost:5173
```

Variables du fichier `public/.env` (sans valeurs ici) :

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=
```

Pour utiliser l'API locale, `VITE_API_BASE_URL` pointe vers `http://localhost:8787`
(origine `http://localhost:5173` autorisée par le CORS de l'API).

## Déployer

### API (Cloudflare Workers)

```bash
cd workers
npx wrangler secret put SUPABASE_SECRET_KEY   # une seule fois, ou pour changer la clé
npm run deploy                                # wrangler deploy
```

Toute nouvelle origine du front doit être ajoutée à `ALLOWED_ORIGINS` dans
`workers/src/index.ts`.

### Front (Vercel)

`public/vercel.json` redirige toutes les routes vers `index.html` (routeur Vue).
La commande de build est `npm run build` (dans `public/`), qui produit `dist/`.

> À compléter : configuration du projet Vercel (dossier racine, déclenchement des
> déploiements, variables `VITE_*` définies dans Vercel).

### Base de données (Supabase)

Le schéma de référence est `specs/schema.sql`.

> À compléter : procédure d'application du schéma sur le projet Supabase.

Données de test : `workers/scripts/seed.mjs` (voir `workers/README.md`).

## Variables d'environnement

### Back (`workers/`)

| Variable              | Où                                          | Rôle                                                                 |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `SUPABASE_SECRET_KEY` | secret Wrangler / `.dev.vars` (local)       | Clé secrète Supabase, accès complet à la base. Ne jamais la commiter. |
| `SUPABASE_URL`        | `wrangler.toml` (`[vars]`)                  | URL du projet Supabase                                               |
| `FIREBASE_PROJECT_ID` | `wrangler.toml` (`[vars]`)                  | Vérification des jetons Firebase (audience et émetteur)              |
| `ENVIRONMENT`         | `wrangler.toml` (`[vars]`)                  | Nom de l'environnement                                               |

### Front (`public/.env`, et variables du projet Vercel)

| Variable                            | Rôle                                         |
| ----------------------------------- | -------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Configuration Firebase Auth (application web) |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Configuration Firebase Auth                  |
| `VITE_FIREBASE_PROJECT_ID`          | Configuration Firebase Auth                  |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Configuration Firebase (application web)     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Configuration Firebase (application web)     |
| `VITE_FIREBASE_APP_ID`              | Configuration Firebase (application web)     |
| `VITE_API_BASE_URL`                 | Adresse de l'API appelée par le front        |

### Scripts de test (`workers/scripts/`)

| Variable                         | Rôle                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Chemin vers le JSON du compte de service Firebase (`get-test-token.mjs`) |
| `FIREBASE_WEB_API_KEY`           | Clé API web Firebase (`get-test-token.mjs`)                        |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Accès à la base pour `seed.mjs`                               |

## Captures d'écran

<!-- À compléter : ajouter ici les captures d'écran de l'application. -->

## Documentation

- Modèle de données : `specs/data-model.md`, diagramme : `docs/data-model.md`
- Contrat de l'API : `specs/openapi.json`, consultable sur `/docs`
- Back : `workers/README.md`
