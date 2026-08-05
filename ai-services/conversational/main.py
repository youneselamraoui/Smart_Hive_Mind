import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src_conversational.vectorstore import search, index_document
from src_conversational.generator import generate_answer, assist_writing, generate_contenu

if not os.environ.get("GEMINI_API_KEY"):
    raise RuntimeError("GEMINI_API_KEY manquante")

app = FastAPI(title="Conversational IA - RAG")

SCOPES_VALIDES = {"publications", "business-plan"}

class AskRequest(BaseModel):
    question: str
    scope: str = "publications"

class AssistWritingRequest(BaseModel):
    brouillon: str
    type: str

class GenerateRequest(BaseModel):
    prompt: str
    type: str = "libre"
    ton: str = "neutre"

class IndexDocumentRequest(BaseModel):
    id: str
    texte: str
    scope: str = "publications"

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/conversational/ask")
async def ask(req: AskRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="La question ne peut pas etre vide.")
    if req.scope not in SCOPES_VALIDES:
        raise HTTPException(
            status_code=400,
            detail=f"Scope invalide. Valeurs acceptees: {', '.join(sorted(SCOPES_VALIDES))}",
        )
    context = search(req.question, k=5, scope=req.scope.replace("-", "_"))
    result = generate_answer(req.question, context)
    result["contextes"] = [c["texte"] for c in context]
    # Dedoublonne les sources par doc_id : si plusieurs chunks d'un meme
    # document sont recuperes, la source ne doit apparaitre qu'une fois.
    vus, sources = set(), []
    for c in context:
        if c["id"] not in vus:
            vus.add(c["id"])
            sources.append(c["id"])
    result["sources"] = sources
    return result

@app.post("/conversational/index-publications")
async def index_publications(documents: list[IndexDocumentRequest]):
    for document in documents:
        index_document(document.id, document.texte, scope=document.scope)
    return {"indexed": len(documents)}

@app.post("/conversational/assist-writing")
async def assist(req: AssistWritingRequest):
    if not req.brouillon.strip():
        raise HTTPException(status_code=400, detail="Le brouillon ne peut pas etre vide.")
    result = assist_writing(req.brouillon, req.type)
    return result

@app.post("/conversational/generate")
async def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Le prompt ne peut pas etre vide.")
    return generate_contenu(req.prompt, req.type, req.ton)
