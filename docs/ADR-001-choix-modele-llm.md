# ADR-001 : Choix du modèle de fondation LLM

| Champ | Valeur |
|-------|--------|
| **Statut** | Accepté |
| **Date** | Juillet 2026 |
| **Décideur** | Équipe de développement |
| **Références** | Cahier des charges §5.7, Veille scientifique §6.6–6.7, Veille technologique §4 |

---

## Contexte

Le cahier des charges (section 5.7) spécifiait **Llama 3.1** comme modèle de langage (LLM) de
base pour l'ensemble des microservices IA. Ce choix était motivé par :

- **Poids ouverts** permettant un déploiement sur l'infrastructure du porteur de projet
- **Souveraineté numérique** : pas de dépendance à un fournisseur américain, alignement avec
  la vision SAT (veille scientifique VI.3)
- **Fine-tuning possible** via QLoRA/LoRA (veille scientifique §6.6)
- **Apprentissage continu** possible (veille scientifique §6.7)
- **Coût à l'inférence maîtrisé** une fois le matériel acquis (pas de coût par appel API)

Les six microservices IA concernés par cette décision sont :

| Service | Rôle | Modèle actuel |
|---------|------|---------------|
| `ai-diagnostic` | Détection de plagiat (embeddings) | `gemini-embedding-001` |
| `ai-decisionnel` | Score de publication (LLM analyse) | `gemini-2.5-flash` |
| `ai-conversational` | Assistant RAG + rédaction | `gemini-2.5-flash` + `gemini-embedding-001` |
| `ai-predictive` | Matching candidat-mission | RandomForest (scikit-learn) — **non concerné** |
| `ai-agentic` | Orchestration ateliers | Aucun LLM direct — **non concerné** |
| `ai-optimisation` | Répartition crowdsourcing | Logique déterministe — **non concerné** |

---

## Décision

**Utiliser l'API Google Gemini** (`gemini-2.5-flash` pour la génération, `gemini-embedding-001`
pour les embeddings) à la place de Llama 3.1 auto-hébergé pour tous les microservices IA
du prototype.

### Détail des modèles retenus

| Usage | Modèle | API |
|-------|--------|-----|
| Génération de texte (RAG, rédaction, scoring) | `gemini-2.5-flash` | `generate_content` |
| Embeddings (similarité, vector store) | `gemini-embedding-001` (768 dimensions) | `embed_content` |

---

## Justification / Raisons

### Contrainte matérielle (motif principal)

L'équipe ne dispose pas de GPU capable d'exécuter Llama 3.1 (8B ou 70B paramètres) en
inférence locale dans des temps acceptables, ni a fortiori de GPU pour du fine-tuning
QLoRA/LoRA. L'alternative Google Colab (GPU gratuit limité) a été écartée pour les raisons
suivantes :

- Sessions limitées en durée, incompatibles avec un service backend devant répondre 24/7
- Quotas restrictifs en environnement gratuit
- Dépendance à un service externe malgré tout (changement de natures de dépendance)

### Délai du stage

Le temps nécessaire pour (a) dimensionner et commander une infrastructure GPU adaptée,
(b) mettre en place l'auto-hébergement de Llama (vLLM, Ollama, ou TGI), et (c) adapter
les pipelines de fine-tuning dépasse le périmètre temporel du stage.

### Alternatives évaluées et écartées

| Alternative | Raison de l'écart |
|-------------|-------------------|
| GPT-4o (OpenAI) | Même dépendance fournisseur ; coût plus élevé que Gemini |
| Mistral Large / Mixtral | API payante sans équivalent embedding ; auto-hébergement soumis à la même contrainte GPU que Llama |
| Claude (Anthropic) | Pas d'API embedding native ; dépendance fournisseur identique |
| Modèle local quantifié (Llama 3.1 8B Q4) | Testé, latence > 30s par requête sur CPU seul, inexploitable pour un service temps réel |
| MongoDB Atlas Vector Search | Technologie non maîtrisée par l'équipe ; ChromaDB déjà opérationnel |

---

## Conséquences

### Ce qui reste valable

- **Architecture RAG** (veille scientifique VI.5) : inchangée, le RAG est agnostique au modèle.
  ChromaDB + retrieval + LLM fonctionne à l'identique quel que soit le modèle de fondation.
- **Framework d'évaluation RAGAS** : inchangé, RAGAS mesure la qualité du pipeline RAG
  indépendamment du LLM sous-jacent.
- **Architecture hub-and-spoke** des microservices : inchangée. Chaque service IA appelle son
  modèle via un client HTTP ; remplacer Gemini par un autre modèle ne change que la couche
  `src/gemini_client.py` (déjà isolée).
- **Explicabilité par `rulesEngine.js`** : inchangée, le moteur de règles est côté backend
  Express et ne dépend pas du LLM.

### Ce qui change

| Point du CDC | Impact |
|-------------|--------|
| **§5.7 — Llama 3.1 comme modèle de base** | Remplacé par Gemini API. Le CDC doit être mis à jour en §5.7 et §8.5 (budget). |
| **§6.6 — QLoRA/LoRA** | **Non applicable au stage.** Le fine-tuning est impossible sur un modèle accessible uniquement par API. Reste une piste pour la version industrielle si migration vers un modèle auto-hébergé. |
| **§6.7 — Apprentissage continu** | **Non applicable au stage.** Même raison : pas de contrôle sur les poids du modèle. À marquer comme "hors périmètre stage". |
| **Argument souveraineté numérique (VI.3)** | Perdu dans le prototype. À mentionner comme limite assumée (section 6.2 du CDC) : la version industrielle viserait un retour à l'auto-hébergement. |

### Budget

| Poste | Prévision CDC (Llama) | Réel (Gemini) |
|-------|----------------------|---------------|
| Infrastructure calcul | Coût GPU significatif (location cloud ou achat matériel) | 0 € (API cloud) |
| API modèle | 0 € (auto-hébergé) | Gratuit (tier gratuit, quotas limités) |
| **Total mensuel** | **Coût GPU significatif** | **0 € (tier gratuit)** |

Le tier gratuit Gemini suffit pour le volume du prototype. Le registre des risques doit
être mis à jour (voir ci-dessous).

> **Note :** les chiffres précis (coût GPU, tarification Gemini par token, seuils de quotas)
> sont à confirmer auprès de la documentation tarifaire officielle avant intégration au
> cahier des charges final. Les valeurs mentionnées ici sont indicatives et basées sur
> les grilles publiées au moment de la rédaction.

---

## Risques à ajouter au registre

| Risque | Probabilité | Impact | Atténuation |
|--------|------------|--------|-------------|
| **Dépendance fournisseur** : Google peut modifier les tarifs, les quotas, ou les conditions d'utilisation de Gemini API | Faible à moyen | Élevé (migration forcée vers un autre modèle) | Architecture client encapsulé dans `src/gemini_client.py` — remplacer le module suffit. Code agnostique au fournisseur. |
| **Quotas du tier gratuit** : le nombre de requêtes par minute (RPM) et par jour (RPD) peut être insuffisant pour une charge réelle | Moyen | Moyen | Retry exponential backoff déjà implémenté dans tous les services. Batch d'embeddings configurable (`BATCH_SIZE=25`, `BATCH_PAUSE=1.5s`). Cache du corpus (10 min) dans le diagnostic. |
| **Changement de tarification** : Google peut rendre payant ce qui était gratuit | Faible | Élevé | Ajouter une alerte budgétaire. Prévoir une estimation des coûts avant mise en production. |
| **Disponibilité du service** : panne de l'API Gemini | Très faible | Élevé | Les appels IA ne bloquent pas le flux principal (timeout 30s, fallback gracieux). L'application reste utilisable sans les fonctionnalités IA. |

---

## Pistes futures

1. **Migration vers un modèle auto-hébergé** (Llama, Mistral, ou autre) si l'infrastructure
   GPU devient disponible en version industrielle. L'architecture actuelle le permet : seul
   `src/gemini_client.py` serait à réécrire pour pointer vers l'API locale (vLLM / Ollama /
   TGI).

2. **Fine-tuning et apprentissage continu** : deviendrait possible après la migration vers
   un modèle auto-hébergé. Priorité basse dans l'état actuel, identifié comme axe de
   recherche pour la version 2.

3. **Multi-fournisseur** : à plus long terme, envisager une abstraction qui permette de
   basculer dynamiquement entre plusieurs fournisseurs (Gemini, OpenAI, Mistral API) selon
   le coût, la latence, ou la disponibilité — pattern "LLM Gateway".

---

## Références

- [Code client Gemini partagé](../ai-services/diagnostic/src_diagnostic/gemini_client.py) — exemple de l'encapsulation
- Cahier des charges §5.7 (document externe) — section à mettre à jour
- Veille scientifique §6.6–6.7 (document externe) — sections à marquer "hors périmètre"
- [Client embedding batch avec retry](../ai-services/diagnostic/src_diagnostic/gemini_client.py) — gestion des quotas
- [Client génération avec system prompt](../ai-services/conversational/src_conversational/gemini_client.py)
