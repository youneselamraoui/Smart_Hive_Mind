# ADR-004 : Trajectoire de décision sur le choix du modèle LLM (Llama 3.1 → API Gemini)

| Champ | Valeur |
|-------|--------|
| **Statut** | Accepté |
| **Date** | Août 2026 |
| **Décideur** | Équipe de développement |
| **Références** | Cahier des charges §5.7, ADR-001 (décision initiale), ADR-002 (embedding 768d), Loi marocaine 09-08 (protection des données personnelles), `docs/rag_eval_results.json` |

> **Relation avec ADR-001 :** ADR-001 enregistre la décision (choix de `gemini-2.5-flash`
> + `gemini-embedding-001`). Le présent ADR documente la **trajectoire** qui y a conduit —
> ce qui était prévu au cahier des charges, ce qui a été retenu pour le prototype, et les
> conséquences opérationnelles désormais constatées dans le code et les évaluations.

---

## Contexte

### 1. Ce qui était prévu (cahier des charges §5.7)

Le cahier des charges spécifiait **Llama 3.1 auto-hébergé** comme LLM de base pour les
microservices IA. Les motivations documentées :

- **Poids ouverts** (licence permissive) : déploiement sur l'infrastructure du porteur
  de projet, sans dépendance à un fournisseur.
- **Souveraineté numérique** : aucune donnée quittant le territoire, alignement avec la
  vision SAT (veille scientifique VI.3).
- **Fine-tuning possible** via QLoRA/LoRA (veille scientifique §6.6) et **apprentissage
  continu** (veille scientifique §6.7).
- **Coût d'inférence maîtrisé** : pas de coût par appel API.

### 2. La contrainte rencontrée

**Aucun GPU n'était disponible pendant le stage.** Cette contrainte rend irréalisables :

| Exigence du CDC | Impact de l'absence de GPU |
|-----------------|----------------------------|
| Auto-hébergement de Llama 3.1 (8B/70B) | Latence CPU inexploitable pour un service temps réel (testé : > 30 s par requête sur CPU seul, cf. ADR-001) |
| Fine-tuning QLoRA/LoRA (§6.6) | Impossible sans GPU : le fine-tuning exige de charger les poids et d'entraîner |
| Apprentissage continu (§6.7) | Idem : dépend du contrôle des poids, lui-même conditionné à l'auto-hébergement |
| Inférence 24/7 | Colab gratuit (GPU limité) écarté : sessions bornées, quotas, dépendance externe persistante |

---

## Décision

**Bascule vers l'API Google Gemini pour le prototype** : `gemini-2.5-flash` pour la
génération, `gemini-embedding-001` (768 dimensions, L2-normalisé) pour les embeddings.
La décision est **encapsulée par service** pour préserver la capacité de migration future.

### Modèles effectivement utilisés dans le code

| Usage | Modèle | API SDK `google-genai` |
|-------|--------|------------------------|
| Génération de texte (RAG, rédaction, scoring) | `gemini-2.5-flash` | `models.generate_content` |
| Embeddings (similarité, vector store) | `gemini-embedding-001` (768 dim, L2-normalisé) | `models.embed_content` (`output_dimensionality=768`) |
| Juge d'évaluation RAGAS (indépendant du service) | `gemini-flash-lite-latest` | — (`scripts/eval_rag.py`) |

### Encapsulation du client (facteur clé de la décision)

Chaque service IA concerné possède son propre `src/gemini_client.py`, structure identique
(`BATCH_SIZE=25`, `BATCH_PAUSE=1.5 s`, retry exponentiel `_with_retry` — 5 tentatives sur
`RESOURCE_EXHAUSTED`/`UNAVAILABLE`) :

| Service | Fichier | Usage du modèle |
|---------|---------|-----------------|
| `ai-diagnostic` (détection de plagiat) | `ai-services/diagnostic/src_diagnostic/gemini_client.py` | Embeddings uniquement |
| `ai-decisionnel` (score de publication) | `ai-services/decisionnel/src_decisionnel/gemini_client.py` | Génération (analyse LLM) |
| `ai-conversational` (RAG + rédaction) | `ai-services/conversational/src_conversational/gemini_client.py` | Génération + embeddings (vector store ChromaDB, cf. ADR-002) |
| `ai-predictive`, `ai-agentic`, `ai-optimisation` | — | **Non concernés** (RandomForest / orchestration / logique déterministe) |

Toute migration ultérieure (retour à un modèle auto-hébergé, vLLM/Ollama/TGI, ou
multi-fournisseur) ne modifie que cette couche : la logique métier des services et le
pipeline RAG restent inchangés.

### Variables d'environnement (définies dans chaque `.env.example` de service)

| Variable | Rôle | Défaut dans le code |
|----------|------|---------------------|
| `GEMINI_API_KEY` | Clé API (obligatoire au démarrage, `os.environ[...]` en dur) | — |
| `GEMINI_LLM_MODEL` | Modèle de génération | `gemini-2.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | Modèle d'embedding | `gemini-embedding-001` |

Le backend Express appelle les services via `AI_DIAGNOSTIC_URL`, `AI_DECISIONNEL_URL`,
`AI_CONVERSATIONAL_URL` (`http://ai-<service>:8000` interne, port hôte `8001`/`8002`/`8004`
dans `docker-compose.yml`), avec un timeout de 30 s (`TIMEOUT_MS=30000` +
`fetchWithTimeout`/AbortController dans `backend/src/controllers/aiAssistController.js`).

---

## Justification / Raisons

1. **Faisabilité dans le délai du stage** : dimensionner et commander une infrastructure
   GPU, mettre en place l'auto-hébergement (vLLM, Ollama ou TGI), puis adapter les
   pipelines de fine-tuning dépasse le périmètre temporel. L'API Gemini est opérationnelle
   immédiatement.
2. **Volume du prototype** : usage interne et faible charge (évaluations RAGAS de
   6 questions, indexation d'un corpus de 13 publications) — le tier gratuit suffit.
3. **Qualité démontrée** : les évaluations RAGAS du pipeline conversationnel
   (`docs/rag_eval_results.json`) atteignent faithfulness 1.0 et answer_relevancy 0.83,
   indépendamment du fournisseur (RAGAS est agnostique au modèle).
4. **Évitement du piège Colab** : le recours à un GPU cloud gratuit aurait conservé la
   même nature de dépendance externe sans les garanties de disponibilité d'une API
   managée.
5. **Choix du fournisseur** : Gemini retenu face à GPT-4o (coût), Mistral/Claude
   (pas d'API embedding native, cf. ADR-001) ; le SDK `google-genai` est déjà intégré
   dans `requirements.txt` des trois services.

---

## Conséquences

### 1. Transfert de données personnelles hors Maroc — **à traiter**

Les textes indexés et les requêtes transitaient par les serveurs Google (zone
nord-américaine). Ce transfert est soumis à la **loi marocaine 09-08** (protection des
personnes physiques à l'égard du traitement des données à caractère personnel) et à la
**CNDP** (Commission Nationale de contrôle de la protection des Données à caractère
Personnel) :

- **À vérifier** : déclaration ou autorisation CNDP selon la nature des données traitées
  (le corpus du prototype est académique, mais la version industrielle traitera des
  données de membres).
- **Atténuation dans le prototype** : les données sensibles restent dans MongoDB
  (Atlas) / ChromaDB ; seuls les passages récupérés (chunks) et les réponses sont
  envoyés à l'API.
- **Option de conformité à étudier pour la V2** : auto-hébergement (souveraineté
  totale) ou région Google data-residency si disponible.

### 2. Coûts d'API à surveiller

| Poste | Situation constatée |
|-------|---------------------|
| Tier gratuit | Suffisant pour le prototype (volume évalué : RAGAS 6 questions + corpus 13 publications) |
| Défenses existantes | Retries/backoff exponentiel (5 tentatives), batch d'embeddings (`BATCH_SIZE=25`, `BATCH_PAUSE=1.5 s`), timeout backend 30 s avec fallback gracieux |
| **Fait observé le 02/08/2026** | `gemini-2.5-flash` (canonique) a renvoyé **404 « model no longer available to new users »** pour la clé du stage ; contournement **transitoire** documenté dans `docs/rag_eval_results.json` (`GEMINI_LLM_MODEL=gemini-3.5-flash-lite` au lancement, config par défaut **non modifiée** dans le code). **Diagnostic définitif : restriction de clé** (voir Annexe A) — le modèle n'est pas déprécié, il est inaccessible aux clés « new users ». |

### 3. Fonctionnalités reportées en version industrielle

| Fonctionnalité | Statut |
|----------------|--------|
| Fine-tuning QLoRA/LoRA (§6.6) | **Reporté** — impossible sur un modèle accessible uniquement par API |
| Apprentissage continu (§6.7) | **Reporté** — pas de contrôle des poids |
| **Routage hybride SLM/LLM** | **Reporté** — un petit modèle local (SLM) pour les tâches simples + LLM distant pour les tâches complexes réduirait les coûts et le volume de données transférées ; nécessite l'infrastructure locale (GPU) |
| Souveraineté numérique (vision SAT VI.3) | Limite assumée du prototype, réversible via l'encapsulation `gemini_client.py` |

### 4. Ce qui reste valable

- **Architecture RAG** : inchangée et agnostique au modèle (cf. ADR-002 — ChromaDB +
  chunking par paragraphe/fenêtre 500 mots).
- **Framework RAGAS** : inchangé, juge unique `gemini-flash-lite-latest` indépendant du
  modèle de génération du service.
- **Hub-and-spoke** des microservices : inchangé ; seule la couche client Gemini serait
  réécrite lors d'une migration.

---

## Risques à ajouter au registre

| Risque | Probabilité | Impact | Atténuation |
|--------|------------|--------|-------------|
| **Conformité loi 09-08 / CNDP** : transfert de données personnelles hors Maroc | Moyenne (à évaluer selon périmètre V2) | Élevé | Vérification CNDP avant intégration des données de membres ; minimisation des données envoyées à l'API ; option auto-hébergement en V2 |
| **Disparition / indisponibilité du modèle canonique** — **tranché le 02/08/2026** : restriction de clé confirmée (404 « no longer available to new users », modèle toujours listé et servi aux comptes existants — Annexe A) | Faible (résolu par une nouvelle clé ; aucune action de code requise) | Moyen | Diagnostic documenté en Annexe A ; `GEMINI_LLM_MODEL` reste une variable surchargeable ; provisionner une clé de production/soutenance dès que disponible |
| **Quotas du tier gratuit** (RPM/RPD) | Moyenne | Moyen | Retry backoff déjà en place ; batch embeddings ; surveillance du registre d'évaluation |
| **Coût non maîtrisé en V2** si passage au payant | Faible (prototype) / élevé (V2) | Élevé | Alerte budgétaire ; routage hybride SLM/LLM reporté en V2 comme levier de réduction |

---

## Pistes futures

1. **Routage hybride SLM/LLM** (V2) : un modèle local léger pour les tâches simples
   (classification, extraction) et Gemini uniquement pour les tâches complexes —
   réduction conjointe des coûts et du volume de données transférées.
2. **Retour à l'auto-hébergement** (Llama, Mistral, ou SLM) dès qu'une infrastructure GPU
   est disponible : seule la couche `src/gemini_client.py` est à réécrire.
3. **Fine-tuning et apprentissage continu** : conditionnés à la migration auto-hébergée,
   priorité basse.
4. **Vérification CNDP formalisée** avant toute donnée personnelle réelle dans le
   pipeline IA.

---

## Annexe A : Diagnostic de l'erreur 404 sur `gemini-2.5-flash` (02/08/2026)

**Question** : le modèle canonique `gemini-2.5-flash` renvoie-t-il 404 pour la clé du
projet à cause d'une restriction spécifique à la clé ou d'une dépréciation générale ?

### Méthode

Appels HTTP directs à `https://generativelanguage.googleapis.com/v1beta` avec la clé
du projet (lue depuis le `.env` racine) :

1. `GET /models` — liste de tous les modèles avec leurs `supportedGenerationMethods`.
2. `POST /models/<modèle>:generateContent` — appel réel de génération (payload minimal).

### Résultats

| Modèle | Liste `/models` | `generateContent` réel | Code HTTP | Réponse |
|--------|-----------------|------------------------|-----------|---------|
| `gemini-2.5-flash` | ✅ présent | 404 | `NOT_FOUND` | `"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use a newer model for the latest features and improvements."` |
| `gemini-2.5-flash-lite` | ✅ présent | 404 | `NOT_FOUND` | Même message (famille 2.5-flash coupée pour cette clé) |
| `gemini-2.5-pro` | ✅ présent | 429 | `RESOURCE_EXHAUSTED` | Quota/limite de débit (nom de modèle reconnu, non bloqué) |
| `gemini-2.0-flash` | ✅ présent | 429 | `RESOURCE_EXHAUSTED` | Quota/limite de débit (nom de modèle reconnu, non bloqué) |
| `gemini-3.5-flash-lite` | ✅ présent | 200 | — | Réponse générée (override transitoire des évaluations RAGAS) |
| `gemini-flash-lite-latest` | ✅ présent | 200 | — | Réponse générée (juge RAGAS) |

Contexte de la liste : 50 modèles au total, 42 avec `generateContent`.

### Conclusion

**Restriction spécifique à la clé, pas une dépréciation générale.** Le modèle
`gemini-2.5-flash` est toujours listé pour cette clé (donc toujours servi par Google)
mais reçoit `404 NOT_FOUND "no longer available to new users"` : la clé du stage est une
clé « new user » créée après la date de coupure d'accès des modèles de la famille 2.5.
Les comptes existants conservent l'accès ; seuls les codes créés après coupure sont
bloqués. Les modèles `3.x` et `*-latest` restent pleinement utilisables avec la même clé.

### Décision (action a — restriction de clé)

- **Aucun changement de code** : `gemini-2.5-flash` reste le modèle canonique du projet
  (défaut `GEMINI_LLM_MODEL` dans les 3 `gemini_client.py` et les `.env.example`).
- **Le modèle reste valide** pour une clé provisionnée sur un compte existant ou pour la
  clé de production/soutenance dès qu'elle est disponible.
- **Contournement opérationnel** (déjà utilisé pour l'évaluation RAGAS) : surcharger
  `GEMINI_LLM_MODEL=gemini-3.5-flash-lite` dans l'environnement d'exécution du service
  concerné — jamais en dur dans le code.
- Les tests Python mockent Gemini : ils ne dépendent d'aucun modèle réel.

---

## Références

- [gemini_client.py — conversational](../ai-services/conversational/src_conversational/gemini_client.py) — encapsulé par service
- [gemini_client.py — diagnostic](../ai-services/diagnostic/src_diagnostic/gemini_client.py)
- [gemini_client.py — decisionnel](../ai-services/decisionnel/src_decisionnel/gemini_client.py)
- [.env.example — conversational](../ai-services/conversational/.env.example) — `GEMINI_API_KEY`, `GEMINI_LLM_MODEL`, `GEMINI_EMBEDDING_MODEL`
- [eval_rag.py](../scripts/eval_rag.py) — juge `gemini-flash-lite-latest`, modèle canonique `gemini-2.5-flash`
- [rag_eval_results.json](../docs/rag_eval_results.json) — scores RAGAS + note sur le contournement transitoire du 02/08/2026
- [aiAssistController.js](../backend/src/controllers/aiAssistController.js) — `TIMEOUT_MS=30000`, URLs des services (`AI_*_URL`)
- [docker-compose.yml](../docker-compose.yml) — ports hôte 8001/8002/8004 (services IA)
- ADR-001 — décision initiale (modèle de fondation), ADR-002 — base vectorielle ChromaDB
- Loi 09-08 / CNDP (document externe) — conformité du transfert de données hors Maroc
