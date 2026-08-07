import os
import re
import chromadb
from chromadb.config import Settings
from src_conversational.gemini_client import get_embedding, get_embeddings_batch

PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "/data/chroma")
COLLECTION_PUBLICATIONS = "publications"
COLLECTION_BUSINESS_PLANS = "business_plans"

CHUNK_SIZE_MOTS = 500
CHUNK_OVERLAP_MOTS = 50


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


def _fenetre_glissante(texte: str, chunk_size: int, overlap: int) -> list[str]:
    """Fenetre glissante de chunk_size mots avec overlap mots de recouvrement."""
    mots = texte.split()
    if len(mots) <= chunk_size:
        return [texte]
    pas = max(chunk_size - overlap, 1)
    chunks = []
    i = 0
    while i < len(mots):
        chunks.append(" ".join(mots[i : i + chunk_size]))
        if i + chunk_size >= len(mots):
            break
        i += pas
    return chunks


def decouper_texte(
    texte: str,
    chunk_size: int = CHUNK_SIZE_MOTS,
    overlap: int = CHUNK_OVERLAP_MOTS,
) -> list[str]:
    """Decoupe un document en chunks indexables dans ChromaDB.

    - Document court (<= chunk_size mots, cas le plus frequent) : un seul chunk.
    - Document long avec plusieurs paragraphes : un chunk par paragraphe ;
      un paragraphe depassant chunk_size mots est lui-meme decoupe en fenetre
      glissante.
    - Document long sans paragraphes : fenetre glissante de chunk_size mots
      avec overlap mots de recouvrement.
    """
    if len(texte.split()) <= chunk_size:
        return [texte]
    paragraphes = [p.strip() for p in re.split(r"\n\s*\n", texte) if p.strip()]
    if len(paragraphes) <= 1:
        paragraphes = [p.strip() for p in re.split(r"\n", texte) if p.strip()]
    if len(paragraphes) > 1:
        chunks = []
        for paragraphe in paragraphes:
            if len(paragraphe.split()) <= chunk_size:
                chunks.append(paragraphe)
            else:
                chunks.extend(_fenetre_glissante(paragraphe, chunk_size, overlap))
        return chunks
    return _fenetre_glissante(texte, chunk_size, overlap)


def index_document(doc_id: str, texte: str, scope: str = "publications"):
    col_name = COLLECTION_PUBLICATIONS if scope == "publications" else COLLECTION_BUSINESS_PLANS
    col = _get_or_create_collection(col_name)
    # Nettoie les chunks existants du document (re-indexation) pour eviter
    # les chunks orphelins si le decoupage change.
    try:
        col.delete(where={"doc_id": doc_id})
    except Exception:
        pass
    chunks = decouper_texte(texte)
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {"scope": scope, "doc_id": doc_id, "chunk_index": i}
        for i in range(len(chunks))
    ]
    if len(chunks) == 1:
        embeddings = [get_embedding(chunks[0])]
    else:
        embeddings = get_embeddings_batch(chunks)
    col.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def search(query: str, k: int = 5, scope: str = "publications") -> list[dict]:
    col_name = COLLECTION_PUBLICATIONS if scope == "publications" else COLLECTION_BUSINESS_PLANS
    col = _get_or_create_collection(col_name)
    if col.count() == 0:
        return []
    results = col.query(query_embeddings=[get_embedding(query)], n_results=k)
    hits = []
    if results["ids"]:
        for i, chunk_id in enumerate(results["ids"][0]):
            meta = results["metadatas"][0][i] or {} if results.get("metadatas") else {}
            hits.append({
                "id": meta.get("doc_id", chunk_id),
                "chunk_id": chunk_id,
                "chunk_index": meta.get("chunk_index"),
                "texte": results["documents"][0][i],
                "score": results["distances"][0][i] if results["distances"] else None,
            })
    return hits


def delete_document(doc_id: str, scope: str = "publications"):
    col_name = COLLECTION_PUBLICATIONS if scope == "publications" else COLLECTION_BUSINESS_PLANS
    col = _get_or_create_collection(col_name)
    try:
        col.delete(where={"doc_id": doc_id})
    except Exception:
        pass
