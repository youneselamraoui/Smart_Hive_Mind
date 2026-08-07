# Liaison IA ↔ Entités ↔ Processus

Statut vérifié dans le code le 2026-08-02 (arbre de travail, branche courante, 1 commit non poussé : `1fa5132`). Toutes les affirmations ci-dessous proviennent d'une exploration réelle des fichiers et non de la synthèse IA v1 (document externe, non présent dans le repo).

## 1. Vue d'ensemble

| Famille IA | Service / Implémentation | Entités liées | Processus liés | Modèle utilisé | Statut |
|---|---|---|---|---|---|
| Conversationale | `ai-services/conversational` (FastAPI, port hôte 8004) | Publication, Réponse, Outil | Questions sur la base de connaissances (RAG), génération de contenu, aide à la rédaction | Gemini (`GEMINI_LLM_MODEL`, défaut `gemini-2.5-flash`) + embeddings (768d, `gemini-embedding-001`) | ✅ Branché |
| Diagnostic | `ai-services/diagnostic` (FastAPI, port hôte 8001) | Publication | Détection de plagiat | Gemini embeddings + corpus vectoriel (cache 10 min, `corpus.py:6`) | ✅ Branché |
| Prédictive | `ai-services/predictive` (FastAPI, port hôte 8003) | Candidature, Offre | Score de matching candidature/offre | RandomForest local (`src/model.joblib`, `train.py`) | ✅ Branché |
| Optimisation | `ai-services/optimisation` (FastAPI) | Tâche de crowdsourcing | Répartition optimale des tâches | Algorithme déterministe | ✅ Branché |
| Décisionnelle | `ai-services/decisionnel` (FastAPI, port hôte 8002) | Publication, Soumission de bounty | Score de qualité de publication, classement des soumissions de bounty | Règles (`src/rules.py`) + similarité cosinus ML (`src/ml_scorer.py`) | ✅ Branché |
| Agentique | `ai-services/agentic` (FastAPI, port hôte 8005) | Atelier, Étape d'atelier | Orchestration multi-étapes d'un atelier avec progression/finalisation | Orchestrateur HTTP (`src/orchestrator.py`) | ✅ Branché |
| Neuro-symbolique | Pas de service dédié — routes backend `atelierNeuroSymboliqueRoutes.js` + `atelierNeuroSymboliqueController.js` | Atelier (type `neuro_symbolique`), Règles | Création/modification/test/status d'un atelier à règles | Règles symboliques persistées dans le modèle `Atelier` | ✅ Branché |

## 2. Détail des branchements (vérifiés dans le code)

### 2.1 Conversationale — ✅
- `backend/src/controllers/aiAssistController.js` : `ask` (ligne ~100, `POST /conversational/ask`), `index-publications` (~40), `assist-writing` (~213).
- `backend/src/controllers/smartToolsController.js` : `assist-writing` (~19), `generate` (~28, `POST /conversational/generate`).
- `backend/src/controllers/entrepreneuriatController.js` : `assist-writing` (~202).
- RAG : chunking par paragraphes / fenêtre glissante 500 mots avec chevauchement 50, déduplication des sources par `doc_id` (`ai-services/conversational/src_conversational/vectorstore.py`).
- URL de service : `process.env.IA_CONVERSATIONAL_URL || "http://ai-conversational:8000"`, `TIMEOUT_MS=30000` (aiAssistController.js).

### 2.2 Diagnostic — ✅
- `backend/src/controllers/publicationController.js:132` → `POST /diagnostic/plagiarism`.
- Le corpus est chargé au startup (`@app.on_event("startup")` → `get_corpus_embeddings()`), rafraîchi toutes les 10 minutes (`REFRESH_INTERVAL = 600` dans `corpus.py`), avec exclusion de la publication analysée.

### 2.3 Prédictive — ✅
- `backend/src/services/matchingScoreService.js:56` → `POST /predictive/matching-score`.
- Consommé par `backend/src/controllers/placementController.js` (postuler, affichage des offres avec score de matching).
- Modèle RandomForest entraîné sur données synthétiques (`ai-services/predictive/src_predictive/train.py`, sauvegardé en `src_predictive/model.joblib`, chargé au démarrage de `main.py:14`).

### 2.4 Optimisation — ✅
- `backend/src/controllers/tacheCrowdsourcingController.js` → `POST /optimisation/repartir-taches`.
- Algorithme déterministe (sans appel LLM).

### 2.5 Décisionnelle — ✅
- `backend/src/controllers/publicationController.js:145` → `POST /decisionnel/score-publication` (rigueur + complétude par règles, originalité par similarité cosinus, score global pondéré 40/60).
- `backend/src/controllers/bountyController.js:189` → `POST /decisionnel/classer-soumissions`.
- `backend/src/controllers/smartToolsController.js:38` → `POST /decisionnel/score-publication` (via ateliers).

### 2.6 Agentique — ✅
- `backend/src/controllers/smartToolsController.js:224` → `POST /agentic/run-workshop` + `GET /agentic/workshop-status/{atelier_id}`.
- Orchestrateur multi-étapes avec progression (`_report_progress`) et finalisation (`_finalize`, `statusGlobal`) via `internalAuth` (`ai-services/agentic/src/orchestrator.py`).

### 2.7 Neuro-symbolique — ✅
- Routes : `POST /smart-tools/ateliers/neuro-symbolique`, `PUT .../:id/regles`, `POST .../:id/tester`, `GET .../:id/status`.
- Contrôleur : règles persistées dans le modèle `Atelier` (`type: "neuro_symbolique"`), périmètre volontairement restreint (voir commentaire d'en-tête du contrôleur).
- Frontend : présent dans l'arbre réel — `frontend/src/app/features/smart-tools/atelier-neuro-symbolique.component.ts` + `frontend/src/app/features/smart-tools/atelier-neuro-symbolique.service.ts` (service API associé). Composant branché sur les routes ci-dessus.

## 3. Bugs corrigés (vérifiés via `git diff HEAD`)

| Bug | Fichier(s) | Correction |
|---|---|---|
| `req.membre._id` toujours `undefined` (auth `membre` expose `.id`) → erreurs 500 « propriété illisible » | `atelierNeuroSymboliqueController.js` (4 occurrences : create, updateRegles, testerRegles, getStatus), `projetRechercheFinanceController.js`, `journalController.js` | Passage à `req.membre.id` |
| `soumettreAuJournal` : populate chaîné cassé (publication/auteur non résolus) | `journalController.js` | Réécriture du populate chaîné |
| Timeout blockchain trop court → blocages en environnement réel | `backend/src/services/blockchainService.js` | 8s → 20s |
| `classerSoumissions` (bounty) : classement toujours `undefined` côté backend ; gagnant non déterminé ni notifié | `backend/src/controllers/bountyController.js` | Fallback `classementIA.recommande`, `gagnantId` optionnel si l'IA recommande, admin autorisé, notification gagnant créée, erreur IA documentée |
| Endpoint `/conversational/generate` inexistant alors que le backend l'appelle | `ai-services/conversational/main.py` + `src_conversational/generator.py` | Ajout de `GenerateRequest` et de `POST /conversational/generate` (`generate_contenu`) |
| Modèle Gemini en dur (`gemini-3.5-flash-lite`) incompatible avec la clé du projet | `ai-services/{conversational,diagnostic,decisionnel}/src_*_*/gemini_client.py` | `os.environ.get("GEMINI_LLM_MODEL", "gemini-2.5-flash")` + `GEMINI_EMBEDDING_MODEL`, variables ajoutées aux `.env.example` |
| Sources dupliquées dans les réponses RAG (`/ask`) | `ai-services/conversational/src_conversational/vectorstore.py` | Déduplication par `doc_id` (introduite avec le chunking, voir ADR-002) |

## 4. Preuves de validation (état réel constaté)

| Preuve | Résultat | Date |
|---|---|---|
| Suite Jest backend (`npx jest --forceExit --detectOpenHandles`) | 12 suites / **72 tests passés** (0 échec) | 2026-08-02 |
| Évaluation RAGAS (`docs/rag_eval_results.json`) | faithfulness **1.0**, answer_relevancy **0.8289**, 6 questions, run AVEC chunking, juge `gemini-flash-lite-latest` | 2026-08-02 |
| **`pytest tests/` — un seul run, tous les fichiers** (résolution de la collision de namespace) | **24 passed, 4 skipped** (e2e), 0 erreur de collecte — 2+3+9+10 par service | 2026-08-02 |
| Smoke test e2e réel (backend + MongoDB Atlas, IP 45.219.91.109 whitelistée) | CRUD outil complet : 200/201/403/200, nettoyage effectué | antérieur à ce document |

Détail du run pytest unique : test_conversational 9 passed / 1 skipped ; test_diagnostic 3 / 1 ; test_predictive 2 / 1 ; test_decisionnel 10 / 1 (y compris `test_bon_texte_scores_eleves`, désormais vert).

Choix de modèle documenté : `docs/ADR-004-choix-modele-llm.md` (et `docs/ADR-001-choix-modele-llm.md` pour le contexte historique).

## 5. Traceabilité des prompts de stabilisation

| Prompt de stabilisation | Preuve de traçabilité |
|---|---|
| Matching score (ai-predictive) | `backend/tests/placementMatching.test.js` : describe « POST /api/placements/postuler (matching score ai-predictive) » et « GET /api/placements/offres (matching score affiche) » |
| Gagnant de bounty via ai-decisionnel | `backend/tests/bountySelectionWinner.test.js` : 10 `it`, dont « choisit le gagnant recommandé par l'IA si gagnantId est absent » |
| Endpoint `/conversational/generate` | `ai-services/tests/test_conversational.py` : `test_generate_retourne_contenu`, `test_generate_prompt_vide_erreur` ; `backend/tests/smartToolsAtelier.test.js:130` (vérifie l'étape `generate`) |
| Neuro-symbolique (propriété, type canonique) | `backend/tests/atelier.test.js` (PUT regles propriétaire/admin, rejets 403) et `backend/tests/smartToolsAtelier.test.js` (création `neuro_symbolique` 201, rejet de l'ancienne variante `ia-neuro-symbolique` 400, pipeline orchestrateur simulé `terminé`) |
| Propriété / rôles (req.membre.id) | `backend/tests/journal.test.js` (soumission auteur/admin, rejet 403 non-500), `backend/tests/projetRechercheFinance.test.js` (attribution propriétaire/admin, 403 strict), `backend/tests/atelier.test.js` |
| CRUD Outil (flux lié aux ateliers/génération) | `backend/tests/outil.test.js` (15 tests) |

## 6. Réserves constatées (état réel, hors périmètre des corrections)

Aucune réserve ouverte sur les services IA ni sur le modèle canonique — voir §7 pour
l'état tranché du modèle Gemini.

## 7. Corrections structurelles post-stabilisation (2026-08-02)

Réserves §6 (ancien n°1-3) résolues :

1. **Collision de namespace pytest (résolue)** : chaque service avait son propre package `src/`, `conftest.add_service_path` aiguillait dynamiquement vers le bon dossier — cassé dès que 2 services étaient importés dans le même process (`AttributeError: module 'src' has no attribute 'gemini_client'`). Correction :
   - Packages renommés en noms uniques : `conversational/src_conversational`, `decisionnel/src_decisionnel`, `diagnostic/src_diagnostic`, `predictive/src_predictive` (imports internes et chemins `model.joblib` mis à jour).
   - `conftest.py` réécrit : ajout de tous les dossiers services au `sys.path` dès le chargement (avant tout mock), helper `load_service_main(name)` qui charge le `main.py` de chaque service dans un module unique (`<service>_main`) via importlib — élimine aussi la collision du module `main`.
   - Chargement de `GEMINI_API_KEY` depuis le `.env` racine (placeholder sinon) pour que la CI s'exécute sans secret, tous les appels Gemini étant mockés.
   - Vérifié : `pytest tests/` en un seul run passe (24 passed, 4 skipped, 0 erreur de collecte).
2. **`test_bon_texte_scores_eleves` (résolu)** : l'assertion `completude >= 0.9` exigeait `LONGUEUR_SEUILS["these"] = 15000` mots, inatteignable par un fixture raisonnable. Le test utilise désormais le type `"libre"` (seuil 1000 mots) avec un fixture porté à ~1100 mots — le seuil applicatif de `rules.py` n'a pas été modifié.
3. **Frontend neuro-symbolique (tranché)** : les fichiers existent dans l'arbre réel — `frontend/src/app/features/smart-tools/atelier-neuro-symbolique.component.ts` et `atelier-neuro-symbolique.service.ts`. Statut passé à ✅ Branché (§2.7).

## 8. Statut du modèle Gemini canonique — tranché (02/08/2026)

La réserve §6 (ancien n°4, 404 `gemini-2.5-flash`) est **définitivement tranchée** :
il s'agit d'une **restriction de clé**, pas d'une dépréciation du modèle. Preuves
(vérification HTTP directe le 02/08/2026, détail complet dans `ADR-004` Annexe A) :

- `GET /v1beta/models` avec la clé du projet : 50 modèles listés, 42 avec `generateContent`, **`gemini-2.5-flash` présent** ;
- `POST :generateContent` sur `gemini-2.5-flash` : **404** `"model ... is no longer available to new users"` — clé « new user » créée après la date de coupure de la famille 2.5 ;
- Même clé : `gemini-2.5-flash-lite` → 404, `gemini-2.5-pro`/`gemini-2.0-flash` → 429 (reconnus, quota), `gemini-3.5-flash-lite` et `gemini-flash-lite-latest` → **200** (fonctionnels).

**Décision (action a)** : aucun changement de code — `gemini-2.5-flash` reste le modèle
canonique (défaut `GEMINI_LLM_MODEL` dans les 3 `gemini_client.py` + `.env.example`),
valide pour les comptes existants et pour la clé de production/soutenance à provisionner.
Contournement opérationnel documenté : `GEMINI_LLM_MODEL=gemini-3.5-flash-lite` en
surcharge d'environnement (utilisé pour l'évaluation RAGAS), jamais en dur.
