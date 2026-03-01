#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  PlexIQ — Script d'installation locale (macOS)                     ║
# ║  Usage: chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh║
# ╚══════════════════════════════════════════════════════════════════════╝

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  PlexIQ — Installation locale (macOS)    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── 1. Vérifier les prérequis ──────────────────────────────────────
echo -e "${YELLOW}[1/6] Vérification des prérequis...${NC}"

# Check Homebrew
if ! command -v brew &> /dev/null; then
  echo -e "${RED}Homebrew n'est pas installé.${NC}"
  echo "Installe-le avec: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  exit 1
fi
echo "  ✓ Homebrew"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}  Node.js non trouvé, installation via Homebrew...${NC}"
  brew install node@20
else
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}  Node.js $NODE_VERSION trouvé, version 18+ requise.${NC}"
    echo "  Mets à jour: brew install node@20"
    exit 1
  fi
  echo "  ✓ Node.js $(node -v)"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}  Docker non trouvé.${NC}"
  echo "  Installe Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi
echo "  ✓ Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# Check if Docker is running
if ! docker info &> /dev/null 2>&1; then
  echo -e "${RED}  Docker n'est pas démarré. Lance Docker Desktop d'abord.${NC}"
  exit 1
fi
echo "  ✓ Docker est actif"

# ─── 2. Copier le fichier .env.local ────────────────────────────────
echo ""
echo -e "${YELLOW}[2/6] Configuration de l'environnement...${NC}"

if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "  ✓ .env.local créé depuis .env.local.example"
  echo -e "  ${YELLOW}⚠ N'oublie pas de remplir tes clés Stripe dans .env.local${NC}"
else
  echo "  ✓ .env.local existe déjà (aucune modification)"
fi

# ─── 3. Lancer Docker (PostgreSQL + Supabase) ───────────────────────
echo ""
echo -e "${YELLOW}[3/6] Lancement des services Docker...${NC}"

docker compose up -d
echo "  ✓ PostgreSQL démarré (port 5432)"
echo "  ✓ Supabase Auth démarré (port 9999)"
echo "  ✓ Supabase API Gateway démarré (port 8000)"

# Wait for PostgreSQL to be ready
echo "  Attente que PostgreSQL soit prêt..."
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U postgres &> /dev/null; then
    echo "  ✓ PostgreSQL est prêt"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "${RED}  PostgreSQL n'est pas prêt après 30s.${NC}"
    exit 1
  fi
  sleep 1
done

# ─── 4. Installer les dépendances Node.js ───────────────────────────
echo ""
echo -e "${YELLOW}[4/6] Installation des dépendances npm...${NC}"

npm install
echo "  ✓ Dépendances installées"

# ─── 5. Initialiser la base de données ──────────────────────────────
echo ""
echo -e "${YELLOW}[5/6] Initialisation de la base de données...${NC}"

npx prisma generate
echo "  ✓ Prisma client généré"

npx prisma db push
echo "  ✓ Schéma appliqué à la base locale"

# Seed optionnel
if [ -f prisma/seed.ts ]; then
  echo "  Exécution du seed..."
  npx tsx prisma/seed.ts 2>/dev/null && echo "  ✓ Données de test insérées" || echo "  ⚠ Seed ignoré (optionnel)"
fi

# ─── 6. Résumé ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  PlexIQ est prêt en local !                                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  Démarrer l'app:     npm run dev                           ║${NC}"
echo -e "${GREEN}║  App:                http://localhost:3000                  ║${NC}"
echo -e "${GREEN}║  Supabase Studio:    http://localhost:54323                ║${NC}"
echo -e "${GREEN}║  PostgreSQL:         localhost:5432 (user: postgres)       ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  Arrêter les services: docker compose down                 ║${NC}"
echo -e "${GREEN}║  Voir les logs:        docker compose logs -f              ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
