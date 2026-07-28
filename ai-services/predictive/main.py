import os
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "src", "model.joblib")

if not os.path.exists(MODEL_PATH):
    raise RuntimeError(
        "Modele non entraine : lancer 'python src/train.py' d'abord"
    )

model = joblib.load(MODEL_PATH)

app = FastAPI(title="Predictive IA - Matching Score")

@app.get("/health")
async def health():
    return {"status": "ok"}

if not hasattr(model, "predict_proba"):
    raise RuntimeError("Le modele charge ne supporte pas predict_proba")

class MatchingRequest(BaseModel):
    nbCompetencesMatchees: float
    nbAnneesExperience: float
    noteProfilMoyenne: float
    nbMissionsRealisees: float

@app.post("/predictive/matching-score")
async def matching_score(req: MatchingRequest):
    features = np.array(
        [[
            req.nbCompetencesMatchees,
            req.nbAnneesExperience,
            req.noteProfilMoyenne,
            req.nbMissionsRealisees,
        ]]
    )
    proba = model.predict_proba(features)[0, 1]
    return {"probabiliteSucces": round(float(proba), 4)}
