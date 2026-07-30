# Smart Hive Mind

Plateforme collaborative de gestion de publications scientifiques, marketplace de services, bounties et offres, avec modules IA intégrés (diagnostic anti-plagiat, prédiction académique, assistant rédactionnel).

---

## Démarrer après un clone

### Prérequis

| Outil | Version | Vérification |
|-------|---------|-------------|
| Node.js | ≥ 20 | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Docker & Compose | — | `docker compose version` |
| Python | 3.11 (services IA) | `python --version` |

### 1. Configuration

```bash
git clone <repo> smart-hive-mind
cd smart-hive-mind

cp .env.example .env
```

Remplir les variables obligatoires dans `.env` :

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `GEMINI_API_KEY` | https://aistudio.google.com (gratuit) |
| `SEPOLIA_RPC_URL` | https://sepolia.infura.io/v3/VOTRE_PROJECT_ID (Infura gratuit) |

`MONGO_URI` est pré-rempli vers MongoDB Atlas (fonctionne sans modification).  
`PRIVATE_KEY` / `CONTRACT_ADDRESS` sont optionnels si vous n'utilisez pas la blockchain.

---

### 2. Avec Docker (recommandé — tout est automatisé)

```bash
# Stack complète — TOUS les services (MongoDB + Backend + Frontend + IA + Blockchain)
docker compose up -d

# Seed les données de démonstration
docker compose exec backend node seed.js
```

Ouvrir http://localhost:4200 — l'application est prête.

**Stack minimale (si vous voulez juste le cœur sans IA ni blockchain) :**

```bash
docker compose up -d mongo backend frontend
```

**Rebuild du frontend après modification :**

```bash
docker compose build frontend && docker compose up -d frontend
```

**Logs :**

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ai-conversational
```

**Arrêt :**

```bash
docker compose down
```

---

### 3. Manuellement (sans Docker)

Lancer dans l'ordre : MongoDB → Backend → Frontend → Services IA → Blockchain.

#### 1. MongoDB

```bash
docker run -d --name shm-mongo -p 27017:27017 mongo:7
```

Ou utiliser MongoDB local / Atlas (déjà pré-rempli dans `.env`).

#### 2. Backend (port 3000)

```bash
cd backend
npm install
npm run seed       # données de démonstration
npm run dev        # watch mode — redémarre automatiquement
```

#### 3. Frontend (port 4200)

```bash
cd frontend
npm install --legacy-peer-deps
npm start          # ng serve avec hot-reload
```

#### 4. Services IA

Chaque service est un microservice FastAPI à lancer indépendamment dans un terminal séparé :

```bash
cd ai-services/diagnostic
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Répéter pour les autres services (changer le dossier et le port) :

| Service | Port | Dossier |
|---------|------|---------|
| Diagnostic (anti-plagiat) | 8001 | `ai-services/diagnostic` |
| Prédiction académique | 8002 | `ai-services/predictive` |
| Décisionnel (score) | 8003 | `ai-services/decisionnel` |
| Conversationnel (RAG) | 8004 | `ai-services/conversational` |
| Agentic (orchestration) | 8005 | `ai-services/agentic` |

#### 5. Blockchain Service (port 4000)

```bash
cd blockchain-service
npm install
npm start
```

---

## Structure du projet

```
smart-hive-mind/
├── backend/                  # API Express + Mongoose (port 3000)
├── frontend/                 # Angular 22 (port 4200)
├── ai-services/              # Microservices IA Python FastAPI
│   ├── diagnostic/           #   Détection de plagiat (port 8001)
│   ├── predictive/           #   Prédiction académique (port 8002)
│   ├── decisionnel/          #   Score publication (port 8003)
│   ├── conversational/       #   Assistant RAG (port 8004)
│   ├── agentic/              #   Orchestration ateliers (port 8005)
│   └── optimisation/         #   Crowdsourcing (PoC)
├── blockchain-service/       # Wrapper Ethereum Sepolia (port 4000)
├── contracts/                # Smart contracts Solidity + Hardhat
├── nginx/                    # Reverse proxy production avec SSL
├── monitoring/               # Promtail config pour Loki
├── docker-compose.yml        # Dev stack complète
├── docker-compose.prod.yml   # Production stack (SSL, backup, uptime)
└── .env.example              # Template variables d'environnement
```

---

## Production (`docker-compose.prod.yml`)

Stack complète avec reverse proxy TLS/SSL, logs centralisés (Loki), monitoring (Uptime‑Kuma), et sauvegarde automatique MongoDB vers Backblaze B2.

```bash
docker compose -f docker-compose.prod.yml up -d
```

Éditer les domaines dans `docker-compose.prod.yml` (certbot) et `nginx/nginx.conf` (`server_name`) avant le premier déploiement.

---

## API

L'API backend est accessible via `http://localhost:3000/api` (ou via le proxy nginx en production).

| Groupe | Route | Description |
|--------|-------|-------------|
| Auth | `POST /api/auth/register` | Inscription |
| Auth | `POST /api/auth/login` | Connexion |
| Publications | `GET /api/publications` | Liste |
| Publications | `POST /api/publications` | Soumettre |
| IA | `POST /api/ai/ask` | Assistant RAG |
| IA | `POST /api/ai/generate-content` | Génération contenu |
| IA | `POST /api/ai/analyze-text` | Anti-plagiat |
| IA | `POST /api/ai/assist-writing` | Rédaction |
| Marketplace | `GET /api/bounties` | Bounties |
| Marketplace | `POST /api/placements/postuler` | Postuler |
| Communauté | `GET /api/communaute/sujets` | Forum |
| Dashboard | `GET /api/dashboard/summary` | Statistiques |

---

## Scripts utiles

```bash
# Seed
docker compose exec backend node seed.js
cd backend && node seed.js          # manuel

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend

# Shell MongoDB
docker compose exec mongo mongosh smart-hive-mind

# Smart contracts
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```
