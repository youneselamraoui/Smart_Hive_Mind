# Audit de cohérence Backend ↔ Modèles ↔ Frontend

Audit de constat (aucune correction appliquée) réalisé le 2026-08-02 sur l'arbre de
travail (branche courante, 1 commit non poussé : `1fa5132`). Chaque anomalie est
localisée fichier:ligne avec une suggestion de correction ; les corrections seront
traitées dans des prompts séparés.

---

## Phase 1 — Inventaire du backend

### 1.1 Routes exposées (méthode + chemin + middleware + contrôleur)

**134 routes** dans 20 fichiers `backend/src/routes/*.js`, toutes montées dans
`backend/src/app.js:37-59` (préfixe `/api`). `app.js:50-51` monte en plus un **alias
`/api/marketplace`** vers `marketplaceRoutes` (documenté, chemin canonique `/api/bounties`, `/api/offres`…).

**Vérification scriptée** : les 134 routes appellent toutes une fonction réellement
exportée par le contrôleur importé — **0 fonction manquante** (aucun `undefined` silencieux).

| Domaine | Méthodes | Exemples (chemin, auth, contrôleur) |
|---|---|---|
| Auth / Membres (`authRoutes.js`) | GET, POST, PUT | `GET /membres` (public, inline), `GET /membres/:id/profil-certifie` (auth, authController), `POST /auth/inscription`, `POST /auth/connexion`, `GET /auth/me` (auth), `PUT /auth/mon-profil`, `POST /auth/deconnexion`, `POST /auth/demander-reset`, `POST /auth/verifier-code`, `POST /auth/reinitialiser-mot-de-passe` |
| IA (`aiRoutes.js`) | POST | `/ai/index-publications`, `/ai/ask`, `/ai/assist-writing`, `/ai/generate-content`, `/ai/analyze-text` (tous auth, aiAssistController) |
| Publications (`publicationRoutes.js`) | GET, POST, PUT | `GET /publications` (public), `GET /publications/:id`, `POST /publications` (auth), `PUT /publications/:id` (auth), `GET /publications/:id/verify` (public), `POST /publications/:id/evaluate-ia` (auth) |
| Journaux (`journalRoutes.js`) | GET, POST, PUT, DELETE | `GET /journaux`, `GET /journaux/:id`, `POST /journaux` (auth), `PUT /journaux/:id`, `DELETE /journaux/:id`, `POST /publications/:id/soumettre-journal` (auth) |
| Communauté (`communauteRoutes.js`) | GET, POST | `GET /communaute/thematiques` (public), `GET /communaute/forums`, `GET /communaute/sujets`, `POST /communaute/sujets`, `POST /communaute/discussions`, `POST /communaute/sondages`, `POST /communaute/sondages/vote`, `POST /communaute/temoignages`, `GET /communaute/groupements`, `POST /communaute/groupements`, `POST /communaute/groupements/join` (écritures auth, lectures en partie inline) |
| Smart tools (`smartToolsRoutes.js`, `atelierNeuroSymboliqueRoutes.js`) | GET, POST | `POST /smart-tools/ateliers` (auth), `GET /smart-tools/ateliers/:id`, `POST /smart-tools/ateliers/:id/progress` (internalAuth), `POST /smart-tools/ateliers/:id/finalize` (internalAuth), `GET /smart-tools/datasets`, `POST /smart-tools/datasets` (auth), `GET /smart-tools/datasets/:id/download`, `GET /smart-tools/models`, `POST /smart-tools/models` (auth) ; `POST/PUT/POST/GET /smart-tools/ateliers/neuro-symbolique[/:id/regles|/tester|/status]` (auth + validate) |
| Entrepreneuriat (`entrepreneuriatRoutes.js`) | GET, POST, PUT | `GET /entrepreneuriat/idees`, `GET /entrepreneuriat/campagnes`, `GET /entrepreneuriat/projets/:id`, `GET/POST/PUT /entrepreneuriat/business-plans`, `POST /entrepreneuriat/idees`, `/idees/vote`, `/idees/promote`, `POST /entrepreneuriat/business-plan/generate`, `POST /entrepreneuriat/campagnes`, `/campagnes/contribute` (écritures auth) |
| Placements (`placementRoutes.js`) | GET, POST | `GET /placements/offres` (authOptional), `GET /placements/missions`, `GET /placements/candidatures`, `GET /placements/validations`, `POST /placements/postuler`, `/accepter`, `/cloturer`, `/missions` (auth) |
| Événements (`evenementRoutes.js`) | GET, POST, DELETE | `GET /evenements`, `GET /evenements/:id`, `POST /evenements` (auth), `/evenements/inscrire`, `/evenements/soumettre`, `/evenements/:id/programme`, `DELETE /evenements/:id/programme/:index` |
| Skills (`skillsRoutes.js`) | GET, POST | `GET /skills/formations`, `GET /skills/mentorats`, `POST /skills/formations` (auth + upload), `/formations/noter`, `/mentorats/demander`, `/mentorats/accepter`, `/mentorats/suivi` |
| Dashboard (`dashboardRoutes.js`) | GET | `GET /dashboard/summary` (public) |
| Marketplace (`marketplaceRoutes.js`) | GET, POST | `GET /bounties`, `GET /bounties/:id`, `POST /bounties` (auth), `/bounties/:id/soumettre`, `/bounties/:id/selectionner-gagnant`, `GET/POST /offres`, `GET/POST /bourses-recherche`, `GET /taches-crowdsourcing`, `POST /taches-crowdsourcing`, `/taches-crowdsourcing/:id/repartir` (auth) |
| Prestations (`prestationRoutes.js`) | GET, POST, PUT, DELETE | CRUD `/prestations` + `GET/POST /prestations/:id/evaluation` |
| Badges (`badgeRoutes.js`) | GET, POST | `POST /badges/attribuer` (auth), `GET /badges` (auth) |
| Notifications (`notificationRoutes.js`) | GET, PUT | `GET /notifications`, `GET /notifications/non-lus`, `PUT /notifications/:id/lu`, `PUT /notifications/tout-lu` (auth) |
| Recherche & structures (`projetRechercheFinanceRoutes.js`, `structureRechercheRoutes.js`) | GET, POST, PUT, DELETE | CRUD `/projets-recherche` + `/candidater`, `/attribuer` ; CRUD `/structures-recherche` |
| Preuves (`preuveRoutes.js`) | GET | `GET /preuves/verify/:txHash` (public) |
| Outils (`outilRoutes.js`) | GET, POST, PUT, DELETE | `GET /outils`, `GET /outils/:id`, `POST/PUT/DELETE /outils/:id` (auth + **adminOnly**) |

### 1.2 Modèles Mongoose

**35 modèles** dans `backend/src/models/*.js` (+ `schemas/preuveSchema.js`). Vérifié
par script : **0 modèle orphelin** (les 35 sont importés par au moins un contrôleur,
route ou service) et **0 `ref:` vers un modèle inexistant**.

| Modèle | Utilisé par | Exposé en CRUD ? |
|---|---|---|
| Membre | authController, aiAssistController, dashboardController, placementController, tacheCrowdsourcingController, profilService | ✅ partiel (GET /membres, GET /membres/:id, PUT /auth/mon-profil) |
| Publication | publicationController, aiAssistController, dashboardController, evenementController, journalController, preuveController, blockchainService | ✅ CRUD + verify + evaluate-ia + soumettre-journal |
| Outil | outilRoutes (handlers inline) | ✅ CRUD complet (admin) — **seul le GET /outils est consommé par le frontend** (voir Phase 3) |
| Atelier | atelierNeuroSymboliqueController, smartToolsController, smartToolsRoutes | ✅ (ateliers + neuro-symbolique) |
| Bounty / Offre / BourseRecherche / TacheCrowdsourcing | bountyController, offreController, bourseRechercheController, tacheCrowdsourcingController (+ preuveController, blockchainService pour TacheCrowdsourcing) | ✅ |
| Publication/Idée/Projet/BusinessPlan/CampagneCrowdfunding | entrepreneuriatController, dashboardController, preuveController, blockchainService | ✅ |
| Evenement, Formation, Mentorat, Mission, Candidature, ValidationCompetence, Offre | evenementController, skillsController, placementController, dashboardController, aiAssistController | ✅ |
| Communauté (Thematique, Forum, Sujet, Discussion, Sondage, Temoignage, Groupement) | communauteController, dashboardController, communauteRoutes (inline) | ✅ |
| Journal | journalController | ✅ CRUD |
| Notification | notificationController, bountyController | ✅ (lecture + marquage) |
| Prestation, Evaluation | prestationController | ✅ CRUD + évaluation |
| Badge, ProfilCertifie | badgeController, authController, blockchainService, matchingScoreService, profilService | ✅ (badges) / partiel (profil-certifie via GET /membres/:id/profil-certifie) |
| ProjetRechercheFinance, StructureRecherche | projetRechercheFinanceController, structureRechercheController | ✅ CRUD |
| JeuDeDonnees, ModeleIA | smartToolsController, smartToolsRoutes | ✅ (datasets, models) |

**Aucune anomalie Phase 1.**

---

## Phase 2 — Cohérence backend ↔ services IA / blockchain

Les 7 URLs de services externes et les endpoints appelés (grep `fetchWithTimeout` /
`fetch(` sur `backend/src`) :

| URL (env lue) | Défaut | Endpoint(s) appelé(s) | Endpoint existant côté service ? |
|---|---|---|---|
| `IA_CONVERSATIONAL_URL` (aiAssistController.js:5, entrepreneuriatController.js:6) | `http://ai-conversational:8000` | `/conversational/ask`, `/index-publications`, `/assist-writing`, `/generate` | ✅ tous (conversational/main.py:36,58,64,71) |
| `IA_DIAGNOSTIC_URL` (publicationController.js:7) | `http://ai-diagnostic:8000` | `/diagnostic/plagiarism` | ✅ (diagnostic/main.py:32) |
| `IA_DECISIONNEL_URL` (publicationController.js:11, bountyController.js:4, smartToolsController.js:9) | `http://ai-decisionnel:8000` | `/decisionnel/score-publication`, `/decisionnel/classer-soumissions` | ✅ (decisionnel/main.py:27,80) |
| `IA_PREDICTIVE_URL` (publicationController.js:9, matchingScoreService.js:3) | `http://ai-predictive:8000` | `/predictive/matching-score` | ✅ (predictive/main.py:31) |
| `IA_OPTIMISATION_URL` (tacheCrowdsourcingController.js:4) | `http://ai-optimisation:8000` | `/optimisation/repartir-taches` | ✅ (optimisation/main.py:45) |
| `IA_AGENTIC_URL` (smartToolsController.js:7 — renommé de `AI_AGENTIC_URL` le 2026-08-02) | `http://ai-agentic:8000` | `/agentic/run-workshop` | ✅ (agentic/main.py:51) ; callbacks retour `/api/smart-tools/ateliers/:id/progress` et `/finalize` (orchestrator.py:117,124) → ✅ routes smartToolsRoutes.js:23-24 avec `internalAuth` (clé `X-Internal-Key`, orchestrator.py:114) |
| `BLOCKCHAIN_SERVICE_URL` (publicationController.js:5, preuveController.js via blockchainService.js:3) | `http://blockchain-service:4000` | `POST /anchor`, `GET /verify/:hash` | ✅ (blockchain-service/src/routes/proof.js:6,40) |

**Aucun appel vers un endpoint inexistant.** Aucun cas type `/conversational/generate`
ne subsiste.

### ⚠️ ~~Anomalie C1~~ — **CORRIGÉE le 2026-08-02**

État initial (contexte de l'audit) : le **code** lisait `IA_CONVERSATIONAL_URL`,
`IA_DIAGNOSTIC_URL`, `IA_DECISIONNEL_URL`, `IA_PREDICTIVE_URL`,
`IA_OPTIMISATION_URL` (11 occurrences `process.env.IA_*`), et `AI_AGENTIC_URL`
(smartToolsController.js:7) — tandis que les **fichiers de config** définissaient
`AI_*` (backend/.env.example, docker-compose.yml) jamais lus, et que
`IA_OPTIMISATION_URL`, `AI_AGENTIC_URL`, `BACKEND_URL` étaient absents des configs.

Correction appliquée :
- **Préfixe canonique retenu : `IA_`** (majoritaire : 11 lectures existantes vs 1
  `AI_AGENTIC_URL` → changement minimal de code).
- **12 points de lecture harmonisés** vers `IA_*` : `IA_AGENTIC_URL`
  (smartToolsController.js:7 — renommé de `AI_AGENTIC_URL`, const locale et usage
  ligne 224 inclus), `IA_CONVERSATIONAL_URL` (×3 : aiAssistController.js:6,
  entrepreneuriatController.js:7, smartToolsController.js:8 — const locales
  `AI_CONVERSATIONAL_URL` renommées), `IA_DECISIONNEL_URL` (×3 : bountyController.js:5,
  publicationController.js:12, smartToolsController.js:9), `IA_DIAGNOSTIC_URL`
  (publicationController.js:8), `IA_PREDICTIVE_URL` (×2 : publicationController.js:10,
  matchingScoreService.js:3), `IA_OPTIMISATION_URL` (tacheCrowdsourcingController.js:5).
  Plus aucune lecture `process.env.AI_*` dans backend/src.
- **backend/.env.example** : les 4 `AI_*` → `IA_*` + ajout de `IA_OPTIMISATION_URL`,
  `IA_AGENTIC_URL`, `BACKEND_INTERNAL_URL` (smartToolsController.js:10),
  `BACKEND_URL` (agentic Python), `AUTH_RATE_LIMIT_MAX` et `SEED_WIPE` (optionnels,
  documentés en commentaire).
- **docker-compose.yml** : environment du backend passé en `IA_*` + ajout de
  `IA_OPTIMISATION_URL`, `IA_AGENTIC_URL`, `BACKEND_INTERNAL_URL` ; service
  `ai-agentic` : ajout de `BACKEND_URL=http://backend:3000` (lu par
  orchestrator.py:6, jusqu'ici implicite).

**Validation (test réel, backend + MongoDB Atlas)** : backend démarré avec
`IA_DIAGNOSTIC_URL=http://localhost:9999` + un serveur d'écoute sur le port 9999.
`POST /publications/:id/evaluate-ia` a déclenché une requête **`POST /diagnostic/plagiarism`
reçue sur le port 9999** (visible dans les logs du serveur d'écoute), et la réponse de
ce serveur (scoreMaxSimilarite 0.05) a alimenté l'évaluation (`noteOriginalite: 9.5`,
`_plagiatScore: 0.05`) — preuve que la surcharge est **effective et plus ignorée**
(avant correction, l'appel partait vers le défaut docker `ai-diagnostic:8000`).
`npm test` backend : **72/72 passés** (aucune régression).

**Audit transversal (autres variables d'environnement, backend + ai-services) —
divergences mineures signalées, non corrigées** (sans impact fonctionnel, défauts
appliqués ou redondance) :
1. `GEMINI_API_KEY` envoyée au service `backend` dans docker-compose.yml:38 mais
   **jamais lue par backend/src** (grep `GEMINI` : aucun hit) → variable morte côté
   backend (utile pour les services IA qui la reçoivent individuellement). À retirer
   de l'environment backend si confirmé.
2. `CORS_ORIGIN` déclarée dans backend/.env.example:31 mais **jamais lue** (aucun
   middleware CORS dans backend/src — dev via proxy ng, prod via nginx) → variable
   morte à retirer ou à brancher sur un futur middleware.
3. `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS` : lues par
   **blockchain-service** (contractService.js:8,14,15) mais **exigées par
   validateEnv.js du backend** (REQUIRED) sans être lues par le backend → couplage
   via .env partagé ; le backend refuserait de démarrer sans elles même sans
   blockchain-service. `CONTRACT_ADDRESS` n'est pas dans REQUIRED.
4. `GEMINI_EMBEDDING_MODEL`, `GEMINI_LLM_MODEL` (gemini_client.py ×3 services) :
   défauts codés (`gemini-embedding-001`, `gemini-2.5-flash`), absents des configs →
   optionnels, documenter dans docker-compose si personnalisation souhaitée.
5. Cohérentes, sans divergence : `MONGO_URI`/`MONGODB_URI` (backend index.js:13
   fallback ; compose conforme pour backend et ai-diagnostic), `CHROMA_PERSIST_DIR`
   (compose ai-conversational:115 ✅), `INTERNAL_SERVICE_KEY` (backend + ai-agentic
   dans compose ✅), `PORT` (3000 backend / 4000 blockchain ✅), `NODE_ENV` ✅.

---

## Phase 3 — Inventaire du frontend

### 3.1 Routes Angular

- **16 fichiers** `*.routes.ts` (`app.routes.ts` + 15 features), tous **montés**
  (0 fichier de routes orphelin ; `recherche.routes.ts` monté 2× avec deux exports
  distincts, conforme).
- **113 entrées de routes** (racine + `/app` + features, redirects inclus).
- **90 références `loadComponent`/`component`** vérifiées sur disque : **0 fichier
  inexistant** ; 98 exports de classes vérifiés : 0 incohérence. Aucune route
  lazy-loadée vers un fichier supprimé/renommé (confirmé par `ng build` : 0 erreur).

### 3.2 Navigation

- **104 `routerLink`** (sidebar main-layout.component.ts:43-124 + pages + features) :
  **0 lien mort**.
- ⚠️ ~~**Anomalie F1**~~ — **CORRIGÉE le 2026-08-02** : les 3 `router.navigate` vers
  `/marketplace/offres`, `/marketplace/bourses`, `/marketplace/taches-crowdsourcing`
  (routes inexistantes) pointaient sur des pages 404 après soumission de formulaire.
  Les 6 navigations (2 par composant : bouton Annuler + succès de soumission) pointent
  désormais vers `/marketplace` (hub à onglets, marketplace.component.ts:30-34).
  **Validation** : lecture de code (`grep` sur les 6 cibles de navigate) + `ng build`
  sans erreur (routes résolues).

### 3.3 Pages orphelines (routes définies, aucun lien ni redirect — accès URL directe uniquement)

**⚠️ CORRIGÉ le 2026-08-02 — 0 page orpheline restante, 0 composant mort.** Tableau
d'origine conservé pour trace (18 routes) :

1. `/app/membre/:id` — app.routes.ts:102 (atteint uniquement via lien dynamique ? non : aucune navigation ne pointe dessus ; les profils sont ouverts ailleurs)
2. `/app/publications/verify` — publications.routes.ts:11
3. `/app/communaute/sondages/:id` — communaute.routes.ts:33
4. `/app/smart-tools/datasets/upload` — smart-tools.routes.ts:12
5. `/app/marketplace/offres/new` — marketplace.routes.ts:12
6. `/app/marketplace/bourses/new` — marketplace.routes.ts:20
7. `/app/entrepreneuriat/business-plans/new` — entrepreneuriat.routes.ts:15
8. `/app/entrepreneuriat/idees` — entrepreneuriat.routes.ts:25
9. `/app/entrepreneuriat/projets/:id` — entrepreneuriat.routes.ts:31
10. `/app/entrepreneuriat/campagnes` — entrepreneuriat.routes.ts:37
11. `/app/entrepreneuriat/mentorats/demander` — entrepreneuriat.routes.ts:48
12. `/app/placements/accepter-candidature` — placements.routes.ts:22
13. `/app/placements/cloturer-mission` — placements.routes.ts:28
14. `/app/placements/candidatures` — placements.routes.ts:34
15. `/app/evenements/new` — evenements.routes.ts:12
16. `/app/skills/formations/creer` — skills.routes.ts:16
17. `/app/skills/mentorats/accepter` — skills.routes.ts:28
18. `/app/skills/mentorats/demander` — skills.routes.ts:34

Composant mort supplémentaire : `pages/forbidden/forbidden.component.ts` — **aucune
route ne le référence** (role.guard.ts:25 redirige vers `/dashboard` au lieu de
`/forbidden`).

Actions appliquées le 2026-08-02 (détail et validation dans §5) : 14 pages **reliées**
par des liens/boutons, page sondages **remplacée par une vraie liste** (widget retiré,
endpoint `GET /communaute/sondages` ajouté au backend), routes #10 et #11
**supprimées** (aucune référence frontend), ForbiddenComponent **routé** sur
`/forbidden` et le roleGuard y redirige. Page #13 (`/app/placements/cloturer-mission`)
**conservée volontairement** : doublon apparent avec `validation-form.component.ts`
(marketplace), mais vérification approfondie (§5) a montré qu'il ne s'agit pas d'un
doublon strict (flux guidé vs formulaire simplifié, champ `competence`, vérification
backend sur `POST /placements/cloturer`).

### 3.4 Appels HTTP frontend → backend (158 sites d'appel, HttpClient, base `/api` relative)

**158 sites d'appel conformes** (plus aucune anomalie d'URL : A1-A5 **CORRIGÉES le
2026-08-02**, voir §5). Tableau d'origine conservé pour trace :

| # | Anomalie (état initial) | Localisation | Correction appliquée |
|---|---|---|---|
| A1 | `GET /api/evenements/{id}/oeuvres` → 404 | `evenement-detail.component.ts:242` | Populate `oeuvresSoumises` (+ nested `auteur`) ajouté à la route existante `GET /evenements/:id` (evenementRoutes.js:19) ; le composant lit `ev.oeuvresSoumises` (2e appel HTTP supprimé) ; champs du template alignés sur le modèle Publication (`contenu`, `preuve.statut === "ancre"`) |
| A2 | `GET /api/publications/verify/{hash}` → 404 | `verify-publication.component.ts:152` | Appel vers la route existante `GET /api/preuves/verify/:txHash` ; chaînage `GET /publications/:entiteId` pour reconstituer les champs du certificat (titre, auteur, hashContenu, preuve) |
| A3 | `POST /api/entrepreneuriat/mentorat/demander` → 404 | `mentorat-demander.component.ts:88` | URL → `POST /api/skills/mentorats/demander` + sélection du mentor (liste `GET /api/membres`, comme skills/mentorat-demand) + envoi de `mentorId` (obligatoire, schéma skillsSchema.js:13) |
| A4 | `GET /api/entrepreneuriat/crowdfunding/campagne-active` → 404 | `campagne-crowdfunding.component.ts:120` | URL → `GET /api/entrepreneuriat/campagnes` (liste) ; prise de la 1re campagne `active` ; champs alignés (`objectifFinancier`, `fondsCollectes`) |
| A5 | `POST /api/entrepreneuriat/crowdfunding/contribuer` → 404 | `campagne-crowdfunding.component.ts:136` | URL → `POST /api/entrepreneuriat/campagnes/contribute` avec `campagneId` + `montant` ; fusion `res.campagne` dans l'état local (pas d'écrasement du titre/contributions) |

- ⚠️ **Doublons fonctionnels signalés (non fusionnés, décision conjointe requise)** :
  - `mentorat-demander.component.ts` (entrepreneuriat) ≈ `skills/mentorat-demand.component.ts` — même action « demander un mentor » ; le premier reste spécifique (formulaire ouvert + sélection mentor).
  - `campagne-crowdfunding.component.ts` (entrepreneuriat) ≈ `crowdfunding/campagne-detail.component.ts` — même affichage campagne + contribution ; le second est plus riche (route par id, erreurs détaillées).

Autres constats (non bloquants) :
- **Routes backend jamais consommées par le frontend** : `POST /bounties/:id/selectionner-gagnant`,
  `GET|POST /prestations/:id/evaluation`, `GET /preuves/verify/:txHash`,
  `POST|PUT|DELETE /outils/:id` (seul `GET /outils` est utilisé).
- Pas de `environment.ts` (`frontend/src/environments/` inexistant) : base URL
  `/api` en dur partout + proxy dev (`proxy.conf.json`) / nginx prod — fonctionnel,
  mais toute évolution cross-origin imposera une centralisation.

---

## Phase 4 — Smoke test réel (backend local + MongoDB Atlas)

Backend démarré sur le port 3000 (MONGO_URI Atlas, workaround DNS `dns.setServers`
de index.js:10). **23 routes GET publiques → 200** (publications, evenements, bounties,
offres, taches-crowdsourcing, bourses-recherche, idees, campagnes, business-plans,
thematiques, sujets, smart-tools/models, smart-tools/datasets, outils, formations,
mentorats, dashboard/summary, journaux, structures-recherche, prestations,
placements/offres, placements/missions, projets-recherche, membres).
**8 routes protégées sans cookie → 401** (notifications, badges, neuro-symbolique/status,
auth/me, placements/postuler, outils POST, ateliers POST, evenements/inscrire).
`POST /auth/connexion` (creds invalides) → **401** (pas de 500).
**Les 5 endpoints cassés du frontend → 404 confirmés** (A1-A5) au moment de l'audit ;
**corrigés et re-testés le 2026-08-02** (voir §5).

Testé réellement vs vérifié par lecture : le comportement HTTP des routes listées
ci-dessus (statuts 200/401/404) ; la liste des routes/middlewares eux-mêmes reste une
vérification de code. **Non testé réellement** : endpoints IA (services non démarrés —
mais vérifiés par grep endpoint dans les main.py), blockchain réel (`/anchor`/`/verify`
vers Sepolia — vérifiés par lecture des routes proof.js ; le test des corrections
A1/A2 a utilisé un faux service blockchain local répondant `/anchor` et `/verify`,
sans toucher au code applicatif), authentification complète
(inscription/connexion avec JWT), rôles admin.

`ng build` (frontend) : **0 erreur** — aucune route lazy-loadée en échec de résolution
de module. Warnings budget uniquement (bundle initial 554.98 kB > 500 kB ;
home.component.css 11.47 kB > 8 kB).

---

## Résumé chiffré

| Indicateur | Nombre |
|---|---|
| Routes backend (20 fichiers, montées sous /api) | **134** |
| Routes backend testées réellement en smoke test | 33 (23×200, 8×401, 2×404 ciblés) |
| Contrôleurs vérifiés (fonctions exportées) | 22 — **0 fonction manquante** |
| Modèles Mongoose | **35** — 0 orphelin, 0 `ref:` invalide |
| Endpoints services IA/blockchain appelés | 11 — **0 endpoint inexistant** |
| Fichiers de routes frontend / routes Angular | 16 / **112** — 0 loadComponent cassé, 0 routes file non monté |
| Routes frontend orphelines (aucun lien) | ~~18~~ → **1** (`cloturer-mission`, assumée — décision §5 ; corrigé au sens « 0 » le 2026-08-02 par PC3) |
| Liens morts `routerLink` | 0 |
| Cibles mortes `router.navigate` | ~~3~~ → **0** (F1 corrigé) |
| Appels HTTP frontend ↔ backend | 158 — ~~5 anomalies~~ → **0** (A1-A5 corrigés) |
| Anomalies variables d'environnement services | ~~1~~ → **0** (C1 corrigé : préfixe unifié `IA_*`, toutes les variables lues sont dans les configs) |
| Composants non routés | ~~1 (ForbiddenComponent)~~ → **0** (routé sur `/forbidden`, roleGuard redirige) |
| **Total anomalies restantes** | **0 code** (20 + 2 corrigées : A1-A5, F1, C1, D1, E1-E14, PC1, PC2) — 1 orpheline assumée (PC3), 2 préexistants hors périmètre (PC4, PC5) |

*Légende catégories : route orpheline (1 assumée — `cloturer-mission`, décision §5,
PC3) / lien mort (0) / appel vers endpoint inexistant (0) / config env incohérente (0)
/ composant mort (0).*

---

## §5 — Anomalies corrigées (2026-08-02)

Toutes les anomalies ci-dessous ont été corrigées puis validées **réellement** avec un
backend Node démarré localement (port 3000, MongoDB Atlas) et, pour A1/A2, un faux
service blockchain local répondant `POST /anchor` et `GET /verify/:hash` (aucune
modification du code applicatif). `ng build` : 0 erreur après corrections.

| # | Correction | Méthode de validation | Résultat |
|---|---|---|---|
| A1 | Populate `oeuvresSoumises` (nested `auteur`) sur `GET /evenements/:id` (evenementRoutes.js:19) + suppression du 2e appel HTTP dans le composant + alignement des champs du template sur le modèle Publication | Création d'un événement hackathon (compte encadrant) + soumission d'une œuvre (`POST /evenements/soumettre`) + `GET /evenements/:id` | **200** : `oeuvresSoumises` peuplé avec `titre`, `contenu`, `auteur.{prenom,nom}`, `preuve.{hash,txHash,blockNumber,statut:"ancre"}` — tous les champs lus par le template |
| A2 | `verify-publication.component.ts` → `GET /api/preuves/verify/:txHash` + chaînage `GET /api/publications/:entiteId` | `GET /preuves/verify/:txHash` (txHash réel issu de A1) puis `GET /publications/:id` | **200** : `{entiteId, type:"publication", exists:true, ...}` puis publication complète (titre, auteur, hashContenu, preuve.txHash) — certificat alimenté |
| A3 | `mentorat-demander.component.ts` → `POST /api/skills/mentorats/demander` + sélection du mentor (GET /membres) + payload avec `mentorId` | Inscription d'un étudiant + connexion + `POST /skills/mentorats/demander {mentorId, …}` | **201** : `{"message":"Demande de mentorat envoyee.","mentorat":{…}}` |
| A4 | `campagne-crowdfunding.component.ts` → `GET /api/entrepreneuriat/campagnes` (liste) + prise de la 1re campagne `active` + champs `objectifFinancier`/`fondsCollectes` | `GET /entrepreneuriat/campagnes` | **200** : liste de campagnes avec `objectifFinancier`, `fondsCollectes`, `contributions` |
| A5 | `campagne-crowdfunding.component.ts` → `POST /api/entrepreneuriat/campagnes/contribute` avec `campagneId` + fusion de la réponse | `POST /entrepreneuriat/campagnes/contribute {campagneId, montant:500}` | **200** : `{"message":"Contribution enregistree.","campagne":{"fondsCollectes":1569,...}}` |
| F1 | 6 `router.navigate` → `/marketplace` (offre-form, bourse-form, tache-crowdsourcing-form) | Lecture de code (grep des 6 cibles) + `ng build` | **0 erreur** de compilation ; cibles vers une route existante |
| C1 | Préfixe unifié `IA_*` (12 points de lecture harmonisés) ; `.env.example` et `docker-compose.yml` alignés (6 URLs IA_* + `BACKEND_INTERNAL_URL` + `BACKEND_URL` pour ai-agentic) | Surcharge réelle `IA_DIAGNOSTIC_URL=http://localhost:9999` + serveur d'écoute sur 9999 ; `POST /publications/:id/evaluate-ia` | Requête `POST /diagnostic/plagiarism` **reçue sur le port 9999** et sa réponse (0.05) intégrée à l'évaluation (noteOriginalite 9.5) → surcharge effective, plus ignorée ; `npm test` 72/72 |
| D1 | Mismatch `description` vs `contenu` dans `evenement-detail.component.ts:soumettre()` (frontend envoyait `description` ; validateur `soumettreOeuvreSchema` evenementSchema.js:50-63 et contrôleur evenementController.js:92 exigent `contenu` → rejet 400 à chaque soumission depuis l'UI) | Flux réel A1 reproduit : compte encadrant + événement hackathon + `POST /evenements/soumettre` | Payload `description` (avant) → **400** « Le contenu de l'oeuvre est requis. » (bug reproduit) ; payload `contenu` (après) → **201** + œuvre présente dans `oeuvresSoumises` du `GET /evenements/:id` avec `contenu` et `auteur` peuplés ; `ng build` 0 erreur ; `npm test` 72/72 |
| E1 | `membre/:id` relié : auteurs dans `publication-detail.component.ts`, mentors/apprenants dans `mentorat-dashboard.component.ts`, porteur + équipe dans `projet-detail.component.ts` (3 fichiers, RouterLink ajouté) | `ng build` + vérification route `membre/:id` (app.routes.ts:107) | **0 erreur** de compilation ; chaque lien pointe une route existante |
| E2 | `publications/verify` relié : entrée sidebar « Vérifier une preuve » (main-layout.component.ts:56) + bouton « Vérifier une autre preuve » dans publication-detail | `ng build` + route `verify` (publications.routes.ts:11) | **0 erreur** ; route résolue |
| E3 | Page sondages reconstruite : widget (`sondage-widget/`) remplacé par `sondage-list.component.ts` (cartes cliquables → `sondages/:id`, bouton « Créer un sondage ») ; endpoint liste `GET /communaute/sondages` ajouté (communauteRoutes.js) ; widget supprimé (aucune autre référence) | Backend réel (Atlas) : `GET /api/communaute/sondages` + `GET /api/communaute/sondages/:id` ; `ng build` | **200** : liste peuplée (`question`, `options`, `votes`, `auteurId` nom/prenom) ; **0 erreur** de compilation |
| E4 | `datasets/upload` relié : bouton « Uploader un dataset » (dataset-download.component.ts) | `ng build` + route `datasets/upload` (smart-tools.routes.ts:12) | **0 erreur** |
| E5 | `marketplace/offres/new` + `marketplace/bourses/new` reliés : boutons conditionnels sur l'onglet actif du hub marketplace (marketplace.component.ts) | `ng build` + routes `offres/new`/`bourses/new` (marketplace.routes.ts:12,20) | **0 erreur** |
| E6 | `entrepreneuriat/business-plans/new` relié : bouton « Nouveau business plan » (business-plan-list.component.ts) | `ng build` + route `business-plans/new` (entrepreneuriat.routes.ts:15) | **0 erreur** |
| E7 | `entrepreneuriat/idees` relié : entrée sidebar « Idées » (main-layout.component.ts:92) | `ng build` + route `idees` (entrepreneuriat.routes.ts:25) | **0 erreur** |
| E8 | `entrepreneuriat/projets/:id` relié : après promotion d'une idée, navigation vers le projet créé (boite-idees.component.ts, réponse `projet.id` du `POST /idees/promote`) | Lecture du contrat backend `promoteToProjet` (entrepreneuriatController.js:97-112 retourne `projet.id`) + `ng build` | **0 erreur** ; navigation vers une route existante |
| E9 | `placements/accepter-candidature` + `placements/candidatures` reliés : entrées sidebar Carrière (roles encadrant/organisation/admin pour la gestion) + liens « Mes candidatures » / « Gérer les candidatures » dans le hub placements (offre-list.component.ts) | `ng build` + routes (placements.routes.ts:22,34) ; backend `POST /placements/accepter` n'autorise que l'organisateur de l'offre (placementController.js:93) | **0 erreur** |
| E10 | `placements/candidatures` : **bug corrigé** — la page « Mes candidatures » appelait `GET /placements/candidatures` sans filtre (affichait toutes les candidatures en attente) ; filtre `membreId` ajouté au backend (placementRoutes.js, paramètre `membreId` supporté) + appel avec `localStorage.membreId` dans candidature-list.component.ts | Backend réel : `GET /placements/candidatures?membreId=<id>` | **0 candidature** pour un membre sans candidature vs **3** pour un membre avec (filtre effectif) ; `npm test` 72/72 |
| E11 | `evenements/new` relié : bouton « Créer un événement » (evenement-list.component.ts) | `ng build` + route `new` (evenements.routes.ts:12) | **0 erreur** |
| E12 | `skills/formations/creer` relié : bouton « Créer une formation » (formation-list.component.ts) | `ng build` + route `formations/creer` (skills.routes.ts:16) | **0 erreur** |
| E13 | `skills/mentorats/accepter` + `skills/mentorats/demander` reliés : boutons « Demander un mentor » / « Demandes à accepter » (mentorat-dashboard.component.ts) | `ng build` + routes (skills.routes.ts:28,34) | **0 erreur** |
| E14 | Fusion/suppression : route `entrepreneuriat/campagnes` (entrepreneuriat.routes.ts:37) + composant `campagne-crowdfunding.component.ts` supprimés (0 référence frontend — l'API `campagnes` reste utilisée par `crowdfunding/`), idem route `entrepreneuriat/mentorats/demander` + `mentorat-demander.component.ts` (la vraie page skills/mentorats/demander est l'entrée unique) ; route `forbidden` déclarée (app.routes.ts) + roleGuard redirige vers `/forbidden` (role.guard.ts:25) au lieu de `/dashboard` | `grep` global : **0 référence** aux 2 routes/composants supprimés ; `ng build` | **0 erreur** de compilation ; `forbidden.component.ts` référencé par une route |

Limites de la validation :
- A1/A2 : l'ancrage on-chain réel (Sepolia) n'a pas été exécuté ; le contrat de test
  avec le faux service blockchain vérifie les chemins HTTP et le format des réponses,
  pas la transaction réelle.
- E1-E14 : les liens ajoutés sont validés par compilation (`ng build`) et par
  correspondance route-à-route avec les fichiers de routes ; aucune exécution
  navigateur automatisée n'a été effectuée.

**Décision structurante — page #13 non fusionnée** : `/app/placements/cloturer-mission`
et `/app/marketplace/validations/new` se ressemblent (toutes deux clôturent une
mission) mais ne sont **pas un doublon strict** : `cloturer-mission.component.ts` est
un flux guidé (liste réelle des missions en cours, évaluation 0-5, champ
`competence`, liens vers les profils) tandis que `validation-form.component.ts` est un
formulaire simplifié (saisie manuelle du `missionId`, aucun champ `competence`). Le
backend `POST /placements/cloturer` (placementRoutes.js:83) exige
`missionId, evaluationClient (0-5), commentaire, competence` et refuse si le membre
n'est ni client de l'offre ni son créateur, ou si la mission n'est pas `en_cours`.
Les deux pages sont donc conservées.
- **Point de vigilance (non bloquant, laissé tel quel)** : le select « résultat »
  (valide/rejete/en_attente) de `validation-form.component.ts` est un **leurre** — le
  backend ne lit aucun champ `resultat` ; la mission est toujours clôturée avec la
  note fournie par `evaluationClient`. À corriger si la sémantique importe.
- A3 : les champs libres du formulaire (`domaine`, `objectifs`, `disponibilites`) sont
  envoyés mais non persistés (le schéma `demanderMentoratSchema` et le modèle
  `Mentorat` n'en ont pas — zod les ignore silencieusement). À décider : extension du
  schéma/modèle ou simplification du formulaire.

---

# Phase 5 — Phase de contrôle (re-vérification du 2026-08-02)

Re-vérification post-corrections de l'intégralité de l'audit, phase par phase, par
lecture **et** par tests réels (backend + navigateur). But : confirmer que chaque
anomalie marquée « corrigée » (§5) l'est réellement, et signaler tout écart.

## 5.1 Méthodologie

| Phase | Vérification | Moyens |
|---|---|---|
| 1 | État du working tree (git) | `git status` (110 fichiers), `git diff --stat` contenu |
| 2 | Backend : routes + modèles + cohérence | `audit_routes.js` (135 routes), `audit_models2.js` (35 modèles), lecture app.js/routes |
| 3 | Frontend : croisement liens ↔ routes | `audit_croisement.js` (187 liens, 93 chemins, 16 montages) + vérification manuelle des faux positifs |
| 4a | Smoke tests API réels | Backend port 3000 + MongoDB Atlas + faux service blockchain (port 4000), compte `audit_enc@test.local` (encadrant) |
| 4b | Build + tests + navigation physique | `ng build`, `npm test` (backend, 72 tests), Playwright (Edge headless, login réel encadrant) |

## 5.2 Résultats confirmés

- **Phase 1** : aucune modification inexpliquée ; renommages `src/` → `src_conversational/`
  (ai-services), lecture `GEMINI_LLM_MODEL`/`GEMINI_EMBEDDING_MODEL`, endpoint
  `POST /conversational/generate`, `requirements-eval.txt` — cohérents avec les sessions
  antérieures (C1). Aucun `.env` réel modifié.
- **Phase 2** : 135 routes (134 + `GET /communaute/sondages`), 0 handler non exporté ;
  35 modèles, 0 orphelin, 0 `ref:` invalide.
- **Phase 3** (croisement automatisé, 187 liens) : **0 lien mort réel** — les 3 signalés
  par le script sont des faux positifs vérifiés manuellement (`boite-idees` : navigate
  dynamique vers `projets/:id` ; dashboard : slash final sur `publications/` et
  `evenements/`) ; 1 vraie route orpheline résiduelle → §5.4.
- **Phase 4a** (29 vérifications réelles, **29/29 PASS**) : connexion (`/auth/connexion`,
  mauvais mot de passe → 401), `GET /auth/me` 200, GETs communautaires publics
  (forums, thematiques, **sondages**) 200, POSTs communautaires sans cookie → 401,
  filtre `membreId`/`statut` des candidatures (cohabitation OK, filtrage effectif),
  création événement (201), `POST /evenements/soumettre` (201, `{}` → 400),
  `POST /publications/:id/evaluate-ia` (200, blockchain via faux service),
  entrepreneuriat/marketplace/smart-tools (GETs 200, `POST /smart-tools/ateliers` 201).
- **Phase 4b** : `ng build` **0 erreur** (2 warnings budget préexistants) ; `npm test`
  backend **72/72** (12 suites) ; navigation physique Playwright (login réel encadrant,
  16 captures d'écran) :
  - E1 sidebar : « Vérifier une preuve » → `/app/publications/verify` ✓ ; « Idées » ✓ ;
    « Mes candidatures » → `/app/placements/candidatures` ✓ ; « Gérer les
    candidatures » → `/app/placements/accepter-candidature` ✓ (rôle encadrant).
  - E2/E3 : onglets hub — « Publier une offre » (onglet Offres) → `/app/marketplace/offres/new` ✓ ;
    « Créer une bourse » (onglet Bourses) → `/app/marketplace/bourses/new` ✓ (boutons
    conditionnés à l'onglet actif, conformes au code).
  - E4 « Nouveau business plan » ✓ ; E6 lien auteur (publication-detail) ✓ (href
    `/app/membre/<id>`, « Enc MentorTest ») ; E7 « Vérifier une autre preuve » ✓ ;
    E8 « Créer un événement » ✓ ; E9 2 boutons mentorat-dashboard ✓ ; E10 « Uploader un
    dataset » ✓.
  - E5 : 30 boutons « Promouvoir en projet » affichés ; le clic déclenche bien le POST
    mais l'API rejette à bon escient (idée à 3 votes < seuil 10 — règle métier
    `promoteToProjet`, pas une anomalie) ; la navigation `projets/:id` ne se produit
    qu'après promotion réussie (contrat vérifié par lecture : `projet.id` retourné).
  - E13 : liens équipe projet-detail **4/4 fonctionnels** ✓ (populate `equipe`).
  - E14 : routes supprimées (campagnes, mentorats/demander) : 0 référence (grep),
    `GET /entrepreneuriat/campagnes` répond toujours côté API ✓.

## 5.3 Écarts par rapport à l'état annoncé « 0 anomalie »

> Les écarts sont préfixés **PC** (Phase de contrôle) pour les distinguer de l'ancien
> code C1 (anomalie env IA_*, §5) — PC1/C2/C3 du compte rendu de la session.

| # | Écart | Preuve | Sévérité |
|---|---|---|---|
| PC1 | **E12 (lien « Porteur » de projet-detail) ne peut jamais s'afficher** : le lien `projet-detail.component.ts:41-42` lit `p().porteur?._id`, mais le modèle `Projet.js` ne définit **aucun champ porteur** et `GET /entrepreneuriat/projets/:id` (entrepreneuriatRoutes.js:37-46) ne peuple que `equipe`. La rangée Porteur rend un `<b></b>` vide. Navigation réelle (projet `6a66c7fb098b0587acfeb608`) : lien = NON, 0 erreur frontend. | Navigation Playwright + lecture modèle/route | Élevée (annonce §5 E1 « porteur relié » incorrecte) |
| PC2 | **`GET /placements/candidatures`, `/placements/missions`, `/placements/validations` sans middleware auth** (placementRoutes.js:40,50,67) → toute personne non authentifiée liste les candidatures peuplées (`offreId`, `membreId` nom/prenom/**email**). Vérifié en live : 200 sans cookie. | `curl` sans cookie + lecture route | Élevée (exposition de données personnelles) |
| PC3 | **Route orpheline résiduelle** : `/app/placements/cloturer-mission` (aucun lien d'entrée de navigation ; accès URL directe uniquement). Conservée par décision §5 (non-doublon avec validation-form) — mais l'affirmation « 0 route orpheline » du Résumé chiffré est inexacte. | `audit_croisement.js` + grep `cloturer-mission` (0 référence hors route/composant) | Moyenne |
| PC4 | **Test frontend `app.spec.ts` « should render title » en échec** (NG05105 `@routeAnimations` sans `provideAnimationsAsync` dans le spec). **Préexistant** : spec Angular par défaut, fichiers `app.spec.ts`/`app.html` non modifiés dans le working tree (0 diff). Non lié à la campagne E-series. | `npm test` (frontend) — 1 échec / 2 tests | Faible (préexistant) |
| PC5 | **Donnée corrompue en DB de test** : un événement existant (`6a66c7fb098b0587acfeb61d`) a un `programme` malformé (objet `{"0":"V","1":"e",...}` au lieu de `[{heure,intitule}, ...]`) → `POST /evenements/soumettre` sur ce record renvoie 400 (validation Mongoose `programme.0.heure` requis). Le flux fonctionne (201 sur un événement sain). Qualité des données de test, pas un bug de code. | Smoke test réel (400 vs 201) | Faible (données) |

## 5.4 Bilan chiffré re-vérifié (2026-08-02)

| Indicateur | Annoncé (§5) | Re-vérifié | Verdict |
|---|---|---|---|
| Routes backend | 134 | **135** (134 + `GET /communaute/sondages`) | ✅ cohérent |
| Modèles Mongoose | 35 — 0 orphelin | 35 — 0 orphelin, 0 ref invalide | ✅ |
| Routes frontend | 112 | 112 (83 fichiers + 29 app.routes) | ✅ |
| Liens morts | 0 | **0** (3 signalés = faux positifs vérifiés) | ✅ |
| Routes orphelines | 0 | **1** (`cloturer-mission`, assumée) | ⚠️ PC3 |
| Appels HTTP frontend ↔ backend | 0 anomalie | 0 anomalie (A1-A5 re-testés 200/201) | ✅ |
| Smoke tests API | — | **29/29 PASS** | ✅ |
| `ng build` | 0 erreur | 0 erreur | ✅ |
| `npm test` backend | 72/72 | **74/74** (72 + 2 tests de régression PC2) | ✅ |
| Navigation physique | non réalisée | **14/14 liens E1-E14 fonctionnels** (E12 corrigé PC1) | ✅ PC1 corrigé |
| Anomalies restantes | 0 | **0 code** (PC1, PC2 corrigés §5.5) + 1 orpheline assumée (PC3) + 2 préexistants (PC4, PC5) | ✅ |

## 5.5 Corrections appliquées (2026-08-02, PC1-PC3)

| # | Correction | Validation (réelle) | Résultat |
|---|---|---|---|
| PC2 | Middleware `auth` ajouté sur `GET /placements/candidatures`, `/placements/missions`, `/placements/validations` (placementRoutes.js:40,50,67) — cohérent avec le reste de l'API ; aucun appel frontend légitime impacté (tous passent par l'intercepteur `withCredentials: true` derrière des pages `/app/*`, vérifié par grep des 8 appels). | `curl` sans cookie → **401** sur les 3 endpoints ; avec cookie valide → **200** (40 candidatures peuplées) ; smoke tests Phase 4a relancés **29/29** ; 2 tests de régression Jest ajoutés (`placementMatching.test.js`) | ✅ **401/200 conformes**, `npm test` **74/74** |
| PC1 | **Décision : « Porteur » = auteur de l'idée originale** (preuve : `promoteToProjet` place `idee.auteurId` en premier membre de l'équipe à la promotion ; l'UI distingue déjà Porteur / Équipe). Champ `porteurId` ajouté au modèle `Projet.js`, peuplé à la promotion (`porteurId: idee.auteurId`), populate `porteurId` sur `GET /entrepreneuriat/projets/:id` ; frontend : fallback `porteur() = p().porteur ?? equipe[0]` (projets legacy créés avant le fix → équipe[0] qui est l'auteur par construction, pas de crash). | Promotion réelle via l'API (idée portée à 10 votes en DB puis `POST /idees/promote`) → `GET /projets/:id` : `porteurId` peuplé (« Chris Schoen », auteur de l'idée) ; navigation Playwright : projet legacy → lien « Dominick Kirlin » (fallback), projet post-fix → lien « Chris Schoen » — plus aucun `<b></b>` vide | ✅ testé réellement (API + navigateur) |
| PC3 | **Résumé chiffré corrigé** : « 0 route orpheline » → « **1** (`cloturer-mission`, assumée — décision §5 : non-doublon strict avec validation-form) ». Aucun changement de code ; un lien d'entrée (ex. hub placements) reste possible si la décision produit évolue. | Relu dans ce document | ✅ reflété fidèlement |

**PC4 / PC5 (préexistants, hors périmètre)** : spec frontend Angular par défaut en échec
(NG05105, fichiers non modifiés par les campagnes) ; événement de test à `programme`
corrompu en DB (affecte `soumettre` sur ce seul record). À traiter séparément si
souhaité.

**Bilan de la phase de contrôle** : les écarts de code identifiés (PC1, PC2) ont été
corrigés et validés réellement (§5.5) ; PC3 est documenté fidèlement (orpheline
assumée) ; PC4-PC5 sont préexistants et non liés aux campagnes de corrections.
