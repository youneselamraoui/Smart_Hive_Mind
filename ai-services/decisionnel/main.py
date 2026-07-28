import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.rules import RuleEngine
from src.ml_scorer import score_originalite

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
