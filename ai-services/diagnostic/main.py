import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from src.gemini_client import get_embedding
from src.corpus import get_corpus_embeddings

if not os.environ.get("GEMINI_API_KEY"):
    raise RuntimeError("GEMINI_API_KEY manquante")

app = FastAPI(title="Diagnostic IA - Anti-plagiat")

SEUIL_ALERTE = 0.85


class PlagiarismRequest(BaseModel):
    texte: str
    publicationId: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    get_corpus_embeddings()


@app.post("/diagnostic/plagiarism")
async def detect_plagiarism(req: PlagiarismRequest):
    if not req.texte.strip():
        raise HTTPException(status_code=400, detail="Le texte ne peut pas etre vide.")

    texte_emb = np.array(get_embedding(req.texte)).reshape(1, -1)
    corpus = get_corpus_embeddings()

    best_score = 0.0
    best_id = None

    for doc_id, doc_vec in corpus.items():
        if doc_id == req.publicationId:
            continue
        doc_emb = np.array(doc_vec).reshape(1, -1)
        sim = float(cosine_similarity(texte_emb, doc_emb)[0, 0])
        if sim > best_score:
            best_score = sim
            best_id = doc_id

    return {
        "scoreMaxSimilarite": round(best_score, 4),
        "publicationSimilaireId": best_id,
        "seuil_alerte": best_score > SEUIL_ALERTE,
    }
