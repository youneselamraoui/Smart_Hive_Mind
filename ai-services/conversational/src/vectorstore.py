import os
import chromadb
from chromadb.config import Settings
from src.gemini_client import get_embedding

PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "/data/chroma")
COLLECTION_PUBLICATIONS = "publications"
COLLECTION_BUSINESS_PLANS = "business_plans"


_client = None


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _get_or_create_collection(name: str):
    client = _get_client()
    try:
        return client.get_collection(name)
    except (ValueError, chromadb.errors.NotFoundError):
        return client.create_collection(name)


def index_document(doc_id: str, texte: str, scope: str = "publications"):
    col_name = COLLECTION_PUBLICATIONS if scope == "publications" else COLLECTION_BUSINESS_PLANS
    col = _get_or_create_collection(col_name)
    col.upsert(
        ids=[doc_id],
        documents=[texte],
        embeddings=[get_embedding(texte)],
        metadatas=[{"scope": scope, "doc_id": doc_id}],
    )


def search(query: str, k: int = 5, scope: str = "publications") -> list[dict]:
    col_name = COLLECTION_PUBLICATIONS if scope == "publications" else COLLECTION_BUSINESS_PLANS
    col = _get_or_create_collection(col_name)
    if col.count() == 0:
        return []
    results = col.query(query_embeddings=[get_embedding(query)], n_results=k)
    hits = []
    if results["ids"]:
        for i, doc_id in enumerate(results["ids"][0]):
            hits.append({
                "id": doc_id,
                "texte": results["documents"][0][i],
                "score": results["distances"][0][i] if results["distances"] else None,
            })
    return hits


def delete_document(doc_id: str, scope: str = "publications"):
    col_name = COLLECTION_PUBLICATIONS if scope == "publications" else COLLECTION_BUSINESS_PLANS
    col = _get_or_create_collection(col_name)
    try:
        col.delete(ids=[doc_id])
    except Exception:
        pass
