# Services IA — Smart Hive Mind

Ce dossier contient les microservices d'intelligence artificielle de la plateforme Smart Hive Mind.

## Services disponibles

| Service | Rôle | Statut |
|---|---|---|
| `diagnostic/` | Détection de plagiat par similarité cosine | Production |
| `predictive/` | Prédiction de succès académique (ML) | Production |
| `decisionnel/` | Score de publication (règles + ML) | Production |
| `conversational/` | Assistant rédactionnel (LLM) | Production |
| `agentic/` | Orchestration d'ateliers IA | Beta |
| `optimisation/` | Répartition de tâches de crowdsourcing | **Proof of Concept** |

## Brique manquante : Optimisation (`optimisation/`)

**Ce qui est promis par le cahier des charges :** une IA d'optimisation capable de répartir
intelligemment les lots de crowdsourcing entre les contributeurs en tenant compte de leur
réputation, de leur charge de travail et de la difficulté des tâches.

**Ce qui est livré :** un endpoint unique `POST /optimisation/repartir-taches` qui applique
une logique simple : 20 % des lots sont réservés aux profils à basse réputation (≤ 0.4) pour
favoriser l'inclusion, le reste est distribué proportionnellement à la réputation. Une
implémentation plus sophistiquée (programmation linéaire, optimisation multi-objectifs, file
d'attente priorisée) est identifiée comme axe de recherche dans la veille technologique et
dépasse le cadre d'un stage de validation.

## Brique manquante : IA neuro-symbolique

**Ce qui est promis par le cahier des charges :** un moteur de règles explicites qui
justifie les décisions des IA boîtes noires (diagnostic, décisionnel) par des règles
transparentes et interprétables.

**Ce qui est livré :** un module JavaScript `backend/src/services/rulesEngine.js` qui
génère une liste de règles textuelles (`{ regle, valeur, impact, justification }`) à
partir des scores des IA diagnostic et décisionnel. Ce module est intégré dans la réponse
de `POST /publications/:id/evaluate-ia` sous la clé `justification`. Une version
productivisable nécessiterait un vrai moteur d'inférence (Drools, Eye, ou equivalent)
capable de chaîner des règles complexes et de raisonner sur des ontologies — identifié
comme axe de recherche dans la veille technologique.

## Note générale

Ces deux briques sont des **preuves de concept volontairement simplifiées**, conformément à
la veille technologique qui les identifie comme des axes de recherche actifs plutôt que des
solutions matures industrialisables. Leur objectif est de démontrer l'architecture
d'intégration (appel HTTP, chaînage de services, réponse enrichie) sans prétendre à une
performance ou une robustesse de production.
