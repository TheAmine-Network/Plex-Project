# PlexIQ — Migration Cloud vers Local (macOS)

## Architecture actuelle (Cloud)

| Service          | Cloud                         | Local (après migration)        |
|------------------|-------------------------------|--------------------------------|
| App Next.js      | Vercel / Cloud                | `localhost:3000`               |
| Base de données  | Supabase Postgres (cloud)     | PostgreSQL Docker `localhost:5432` |
| Auth             | Supabase Auth (cloud)         | Supabase Auth Docker `localhost:8000` |
| Paiements        | Stripe (API)                  | Stripe Test Mode (identique)   |
| Studio DB        | `app.supabase.co`             | `localhost:54323`              |

---

## Prérequis Mac

1. **Homebrew** — gestionnaire de paquets macOS
2. **Node.js 18+** — runtime JavaScript
3. **Docker Desktop** — pour PostgreSQL et Supabase local
4. **Git** — déjà installé si tu lis ceci

### Installer les prérequis

```bash
# Homebrew (si pas encore installé)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 20
brew install node@20

# Docker Desktop — télécharger depuis:
# https://www.docker.com/products/docker-desktop/
```

---

## Installation rapide (1 commande)

```bash
# Cloner le repo
git clone <ton-repo-url> PlexIQ
cd PlexIQ

# Lancer le script d'installation automatique
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

Le script fait tout automatiquement :
1. Vérifie les prérequis (Node, Docker, Homebrew)
2. Crée le fichier `.env.local`
3. Lance PostgreSQL + Supabase via Docker
4. Installe les dépendances npm
5. Initialise la base de données (Prisma)

---

## Installation manuelle (étape par étape)

### Étape 1 — Cloner et configurer l'environnement

```bash
git clone <ton-repo-url> PlexIQ
cd PlexIQ

# Copier le template d'environnement local
cp .env.local.example .env.local
```

### Étape 2 — Configurer `.env.local`

Ouvre `.env.local` et configure tes clés Stripe (mode test) :

```env
STRIPE_SECRET_KEY=sk_test_TA_VRAIE_CLE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TA_VRAIE_CLE
STRIPE_WEBHOOK_SECRET=whsec_TON_SECRET
```

Les clés Supabase locales sont déjà pré-remplies (clés de démo standard).

### Étape 3 — Lancer les services Docker

```bash
# Démarrer PostgreSQL + Supabase en arrière-plan
docker compose up -d

# Vérifier que tout tourne
docker compose ps
```

Services disponibles :

| Service           | URL                      |
|-------------------|--------------------------|
| Supabase API      | `http://localhost:8000`  |
| Supabase Studio   | `http://localhost:54323` |
| PostgreSQL        | `localhost:5432`         |
| Auth (GoTrue)     | `localhost:9999`         |

### Étape 4 — Installer les dépendances et initialiser la DB

```bash
# Installer les packages npm
npm install

# Générer le client Prisma
npx prisma generate

# Appliquer le schéma à la base locale
npx prisma db push

# (Optionnel) Insérer des données de test
npm run db:seed
```

### Étape 5 — Lancer l'application

```bash
npm run dev
```

Ouvre http://localhost:3000 dans ton navigateur.

---

## Migrer les données du cloud

Si tu veux récupérer tes données existantes de Supabase Cloud :

### Option A — Export/Import SQL

```bash
# 1. Exporter depuis Supabase Cloud
# Va dans Supabase Dashboard > Settings > Database > Connection string
# Utilise pg_dump avec l'URL cloud :
pg_dump "postgresql://postgres:[MOT_DE_PASSE]@db.[PROJET].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-acl \
  -t users -t properties -t property_units -t assumptions \
  -t mortgages -t analyses -t comparisons -t exports -t audit_logs \
  > data-export.sql

# 2. Importer dans la base locale
psql "postgresql://postgres:postgres@localhost:5432/plexiq" < data-export.sql
```

### Option B — Prisma Studio (visuel)

```bash
# Ouvrir Prisma Studio pour voir/modifier les données
npx prisma studio
```

---

## Commandes utiles

```bash
# ─── App ─────────────────────────────────────
npm run dev          # Démarrer en mode développement
npm run build        # Build de production
npm run test         # Lancer les tests

# ─── Base de données ─────────────────────────
npm run db:generate  # Régénérer le client Prisma
npm run db:push      # Appliquer les changements de schéma
npm run db:migrate   # Créer une migration
npm run db:seed      # Insérer des données de test
npx prisma studio    # Interface visuelle pour la DB

# ─── Docker ──────────────────────────────────
docker compose up -d     # Démarrer les services
docker compose down      # Arrêter les services
docker compose logs -f   # Voir les logs en temps réel
docker compose ps        # Voir l'état des services

# ─── Stripe (webhooks locaux) ────────────────
# Installer Stripe CLI: brew install stripe/stripe-cli/stripe
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Stripe en local

Pour tester les paiements en local, utilise le **Stripe CLI** :

```bash
# Installer
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks et les rediriger vers ton app locale
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Le CLI affichera un webhook secret (whsec_...) — mets-le dans .env.local
```

---

## Dépannage

### Docker ne démarre pas
```bash
# Vérifier que Docker Desktop est lancé
open -a Docker
# Attendre 30s puis réessayer
docker compose up -d
```

### Port 5432 déjà utilisé
```bash
# Si PostgreSQL tourne déjà localement via Homebrew
brew services stop postgresql
# Puis relancer Docker
docker compose up -d
```

### Erreur Prisma "Can't reach database"
```bash
# Vérifier que PostgreSQL Docker tourne
docker compose ps
# Le status doit être "Up" et "healthy"

# Vérifier la connexion
docker compose exec db psql -U postgres -d plexiq -c "SELECT 1"
```

### Réinitialiser complètement
```bash
# Supprimer tous les containers et données
docker compose down -v
# Relancer
docker compose up -d
npx prisma db push
```
