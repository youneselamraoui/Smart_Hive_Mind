# Nouvelles routes POST ajoutées

## 1. POST /api/evenements

Créer un événement. Réservé aux rôles **encadrant** ou **organisation**.

```bash
curl -X POST http://localhost:5000/api/evenements \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<JWT>" \
  -d '{
    "type": "hackathon",
    "titre": "Hackathon IA 2026",
    "dates": {
      "debut": "2026-09-01T08:00:00Z",
      "fin": "2026-09-03T18:00:00Z"
    },
    "programme": ["Jour 1 : ideation", "Jour 2 : developpement", "Jour 3 : pitch"],
    "capaciteMax": 100,
    "espacePrive": false
  }'
```

**Validation Zod :** `createEvenementSchema` — type enum, titre 3-200, dates objet avec debut/fin, programme optionnel, capaciteMax optionnel, espacePrive optionnel.

---

## 2. POST /api/offres

Créer une offre (emploi/stage). Réservé aux rôles **encadrant** ou **organisation**.

```bash
curl -X POST http://localhost:5000/api/offres \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<JWT>" \
  -d '{
    "type": "stage",
    "titre": "Stage dev fullstack",
    "exigences": ["React", "Node.js", "MongoDB"]
  }'
```

**Validation Zod :** `createOffreSchema` — type enum (emploi|stage), titre 3-200, exigences optionnel.

---

## 3. POST /api/bounties

Créer une bounty. Accessible à tout membre authentifié.

```bash
curl -X POST http://localhost:5000/api/bounties \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<JWT>" \
  -d '{
    "titre": "Optimiser le moteur de recherche",
    "description": "Proposer une amélioration de l algorithme de recherche full-text. Le gagnant remportera 500 SMH.",
    "recompense": 500,
    "delai": "2026-08-15T23:59:59Z"
  }'
```

**Validation Zod :** `createBountySchema` — titre 3-200, description min 10, recompense positif, delai string.

---

## 4. POST /api/bourses-recherche

Créer une bourse de recherche. Accessible à tout membre authentifié.

```bash
curl -X POST http://localhost:5000/api/bourses-recherche \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<JWT>" \
  -d '{
    "montant": 15000,
    "criteres": ["Doctorat en informatique", "Sujet IA", "Publication minimum 1"]
  }'
```

**Validation Zod :** `createBourseRechercheSchema` — montant positif, criteres optionnel.

---

## 5. POST /api/taches-crowdsourcing

Créer une tâche de crowdsourcing. Accessible à tout membre authentifié.

```bash
curl -X POST http://localhost:5000/api/taches-crowdsourcing \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<JWT>" \
  -d '{
    "titre": "Traduire les articles en anglais",
    "lots": [
      { "description": "Lot 1 : Introduction et méthodologie" },
      { "description": "Lot 2 : Résultats et discussion" }
    ],
    "remunerationTotale": 200
  }'
```

**Validation Zod :** `createTacheCrowdsourcingSchema` — titre 3-200, lots optionnel (tableau d'objets avec description), remunerationTotale optionnel.

---

## Notes générales

- **Authentification** : toutes les routes exigent un cookie `token` (JWT, middleware `auth`).
- **Rôles restreints** : `POST /evenements` et `POST /offres` vérifient `req.membre.role in ["encadrant", "organisation"]` → 403 sinon.
- **Rôle `organisation` ajouté** : l'enum de `Membre.js` passe de `["etudiant", "encadrant", "admin"]` à `["etudiant", "encadrant", "admin", "organisation"]`.
- **Validation** : toutes les routes utilisent le middleware `validate(schema)` avec Zod. En cas d'échec, retour 400 avec `{ error: "Validation echouee.", details: [...] }`.
- **Réponse** : chaque création retourne 201 avec le document peuplé (références populates).
