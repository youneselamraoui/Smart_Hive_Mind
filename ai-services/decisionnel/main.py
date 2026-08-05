import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src_decisionnel.rules import RuleEngine
from src_decisionnel.ml_scorer import score_originalite

if not os.environ.get("GEMINI_API_KEY"):
    raise RuntimeError("GEMINI_API_KEY manquante")

app = FastAPI(title="Decisionnel IA - Score de publication")

@app.get("/health")
async def health():
    return {"status": "ok"}

POIDS_REGLES = 0.4
POIDS_ML = 0.6

TYPES_VALIDES = {"these", "pfe", "pfa", "libre"}

class ScoreRequest(BaseModel):
    contenu: str
    titre: str
    type: str

@app.post("/decisionnel/score-publication")
async def score_publication(req: ScoreRequest):
    if req.type not in TYPES_VALIDES:
        raise HTTPException(
            status_code=400,
            detail=f"Type invalide. Valeurs acceptees: {', '.join(sorted(TYPES_VALIDES))}",
        )
    if not req.contenu.strip() or not req.titre.strip():
        raise HTTPException(status_code=400, detail="Le titre et le contenu sont obligatoires.")

    engine = RuleEngine(req.contenu)
    regles = engine.evaluer(req.type)

    originalite = score_originalite(req.titre, req.contenu)

    score_ml = originalite
    score_global = round(POIDS_REGLES * regles["rigueur"] + POIDS_ML * score_ml, 4)

    return {
        "originalite": originalite,
        "rigueur": regles["rigueur"],
        "completude": regles["completude"],
        "scoreGlobal": score_global,
        "details": {
            "regles": {
                "citations": regles["citations"],
                "structure": regles["structure"],
                "longueur": regles["longueur"],
            },
            "ml": {
                "similariteTitreContenu": originalite,
            },
            "ponderation": {
                "poidsRegles": POIDS_REGLES,
                "poidsML": POIDS_ML,
            },
        },
    }


class SoumissionData(BaseModel):
    membreId: str
    contenuUrl: str
    dateSubmission: str | None = None
    contenu: str | None = None  # texte optionnel : si fourni, score regles + ML


class ClasserSoumissionsRequest(BaseModel):
    titre: str
    description: str
    soumissions: list[SoumissionData]


@app.post("/decisionnel/classer-soumissions")
async def classer_soumissions(req: ClasserSoumissionsRequest):
    if not req.soumissions:
        raise HTTPException(status_code=400, detail="Aucune soumission a classer.")
    for s in req.soumissions:
        if not s.membreId or not s.contenuUrl:
            raise HTTPException(
                status_code=400,
                detail="Chaque soumission doit avoir membreId et contenuUrl.",
            )

    now = datetime.now(timezone.utc)
    classement = []
    for s in req.soumissions:
        score = 0.5  # neutre : pas de contenu textuel
        if s.contenu and s.contenu.strip():
            engine = RuleEngine(s.contenu)
            regles = engine.evaluer("libre")
            originalite = score_originalite(req.titre, s.contenu)
            score = round(POIDS_REGLES * regles["rigueur"] + POIDS_ML * originalite, 4)
        if s.dateSubmission:
            try:
                date = datetime.fromisoformat(s.dateSubmission.replace("Z", "+00:00"))
                if date.tzinfo is None:
                    date = date.replace(tzinfo=timezone.utc)
                anciennete_sec = max(0, (now - date).total_seconds())
                bonus = min(0.1, anciennete_sec / (7 * 24 * 3600) * 0.1)
                score = round(min(1.0, score + bonus), 4)
            except ValueError:
                pass
        classement.append({"membreId": s.membreId, "score": score, "rang": 0})

    classement.sort(key=lambda c: c["score"], reverse=True)
    for i, c in enumerate(classement):
        c["rang"] = i + 1

    return {"classement": classement, "recommande": classement[0]["membreId"]}
