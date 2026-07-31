# ADR-002 : Choix de la base vectorielle

| Champ | Valeur |
|-------|--------|
| **Statut** | Accepté |
| **Date** | Juillet 2026 |
| **Décideur** | Équipe de développement |
| **Références** | Veille IA (section RAG), Cahier des charges §5.2, Veille technologique §8, ADR-001 |

---

## Contexte

Le projet a besoin d'une base vectorielle pour le Retrieval-Augmented Generation (RAG) du
service `ai-conversational`. Les candidats documentés sont :

| Technologie | Source | Statut dans les documents |
|-------------|--------|--------------------------|
| **pgvector** (PostgreSQL) | Veille IA, section RAG | Recommandé explicitement |
| **MongoDB Atlas Vector Search** | Veille technologique §8, radar technologique | Classé "Tester" |
| **ChromaDB** | Aucun document de cadrage | **Non mentionné** mais déjà implémenté dans le code |

Au moment de la rédaction du présent ADR, ChromaDB est déjà opérationnel dans le service
`ai-services/conversational/src/vectorstore.py` et utilisé par les endpoints `/ask`,
`/assist-writing`, et `/index-publications` du pipeline RAG.

---

## Décision

**ChromaDB est retenu comme base vectorielle du prototype**, en remplacement des suggestions
pgvector et MongoDB Atlas Vector Search des documents de cadrage.

### Détail de l'implémentation

| Élément | Valeur |
|---------|--------|
| Bibliothèque | `chromadb>=1.0.0` |
| Mode | Persistant (`PersistentClient`) |
| Chemin de persistance | Variable d'env `CHROMA_PERSIST_DIR` (défaut : `/data/chroma`) |
| Collections | `publications` (scope principal), `business_plans` |
| Modèle d'embedding | `gemini-embedding-001` (768 dimensions, L2-normalisé) |
| Stockage | Volume Docker `chroma-data` persistant |

---

## Justification / Raisons

### 1. Adéquation au besoin du prototype

ChromaDB est une base vectorielle légère, conçue pour le prototypage et les charges
modérées. Ses caractéristiques correspondent au volume attendu pour le stage :
quelques centaines à milliers de publications à indexer, avec un nombre de requêtes
limité (usage interne à l'équipe).

### 2. Simplicité d'intégration dans la stack existante

La stack actuelle est une architecture **MEAN-like** (MongoDB + Express + Angular + Node).
Ajouter PostgreSQL uniquement pour pgvector aurait introduit une dépendance supplémentaire
lourde :

- Un nouveau service Docker à maintenir (PostgreSQL)
- Une gestion de deux SGBD hétérogènes (MongoDB + PostgreSQL) dans la même stack
- Une complexité opérationnelle accrue (sauvegardes, réplications, monitoring)

ChromaDB s'intègre comme une simple bibliothèque Python sans serveur externe (mode
persistant avec fichiers sur disque), ce qui évite toute dépendance supplémentaire.

### 3. Facilité de conteneurisation

ChromaDB ne nécessite pas de service dédié : il s'initialise dans le processus Python
du service `ai-conversational`. La persistance se fait via un volume Docker standard
`chroma-data:/data/chroma`, déjà configuré dans `docker-compose.yml` et désormais
également dans `docker-compose.prod.yml`.

### 4. Fonctionnel et testé

Contrairement aux alternatives documentées mais non implémentées, ChromaDB est déjà
opérationnel : le pipeline RAG complet (indexation → requête → retrieval → réponse)
est fonctionnel et testé dans `ai-services/conversational`.

---

## Alternatives évaluées et écartées

### pgvector (PostgreSQL)

| Pour | Contre |
|------|--------|
| Solution mature, performante en production | Nécessite PostgreSQL (techno absente de la stack actuelle) |
| Indexation HNSW efficace pour grands volumes | Complexité opérationnelle (deux SGBD) |
| Requêtes vectorielles + métadonnées combinées | Surcharge de migration des données depuis MongoDB |
| Recommandé par la veille IA | La veille IA n'a pas été révisée depuis le choix MongoDB |

**Verdict :** Écarté pour le prototype. Piste pour la version industrielle si le volume
de données justifie une infrastructure dédiée.

### MongoDB Atlas Vector Search

| Pour | Contre |
|------|--------|
| Cohérent avec la base principale (MongoDB) | Technologie classée "Tester" dans le radar — pas encore maîtrisée par l'équipe |
| Pas de dépendance externe supplémentaire | Dépend de MongoDB Atlas (version cloud) — pas utilisable en local |
| Requêtes vectorielles natives dans l'agrégation MongoDB | Non disponible sur l'instance MongoDB locale du prototype |

**Verdict :** Écarté pour le prototype. À réévaluer pour la version industrielle
(cohérent avec l'axe 4 de la veille technologique : réduction du nombre de composants).

---

## Conséquences

### Ce qui change

| Document | Action |
|----------|--------|
| Veille IA, section RAG | Doit être corrigée : remplacer la recommandation pgvector par ChromaDB, avec mention des alternatives et des raisons du choix |
| Cahier des charges §5.2 (stack technique) | Ajouter ChromaDB dans la liste des composants du prototype |

### Ce qui reste valable

- **Architecture RAG** : inchangée. ChromaDB est interchangeable avec n'importe quelle
  autre base vectorielle (le code client est encapsulé dans `vectorstore.py`).
- **Pipeline d'indexation** : inchangé. Les publications sont indexées via
  `POST /conversational/index-publications` quel que soit le stockage sous-jacent.
- **Évaluation RAGAS** : inchangée. RAGAS est agnostique au stockage vectoriel comme
  au modèle de fondation (déjà noté dans ADR-001).

---

## Risques

| Risque | Probabilité | Impact | Atténuation |
|--------|------------|--------|-------------|
| **Volume de données** : ChromaDB en mode persistant peut montrer des limites de performance au-delà de quelques dizaines de milliers de documents | Faible pour le prototype | Moyen | Surveillance de la latence des requêtes RAG. Seuil d'alerte à définir. Migration vers MongoDB Atlas Vector Search ou pgvector envisagée en V2 si nécessaire. |
| **Perte de données** : le stockage est un volume Docker, vulnérable à une suppression accidentelle (`docker compose down -v`) | Moyen | Élevé | Le volume `chroma-data` est exclu des commandes de purge courantes. La ré-indexation est possible via `POST /conversational/index-publications` à partir de MongoDB (source de vérité). |
| **Absence de support enterprise** : ChromaDB est un projet open-source récent, sans support commercial | Faible | Faible | Le code est encapsulé ; remplacer ChromaDB par une autre base vectorielle ne nécessite de modifier que `vectorstore.py`. |

---

## Pistes futures

1. **Réévaluer MongoDB Atlas Vector Search** pour la version industrielle. Si l'équipe
   monte en compétence sur cette fonctionnalité et que le volume de données dépasse la
   capacité de ChromaDB en conteneur unique, MongoDB Vector Search permettrait de
   supprimer un composant de la stack (cohérent avec l'axe 4 de la veille technologique).

2. **Migration vers pgvector** si le projet adopte PostgreSQL comme base principale
   (scénario non envisagé à court terme).

3. **Multi-collection** : ChromaDB supporte nativement plusieurs collections ; le
   prototype en utilise déjà deux (`publications`, `business_plans`). Cette capacité
   peut être étendue à d'autres scopes sans changement d'infrastructure.

---

## Références

- [vectorstore.py](../ai-services/conversational/src/vectorstore.py) — implémentation ChromaDB
- [.env.example — conversationnel](../ai-services/conversational/.env.example) — variable `CHROMA_PERSIST_DIR`
- [docker-compose.yml](../docker-compose.yml) — volume `chroma-data` (dev)
- [docker-compose.prod.yml](../docker-compose.prod.yml) — volume `chroma-data` (production, ajouté par ADR-002)
- ADR-001 — choix du modèle d'embedding (`gemini-embedding-001`)
- Veille IA, section RAG (document externe) — à corriger
- Veille technologique §8, radar technologique (document externe) — colonne "Vector Search" à mettre à jour de "Tester" vers "Adopté (remplacé par ChromaDB)"
