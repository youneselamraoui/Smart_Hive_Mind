import os
import time
from pymongo import MongoClient
from src.gemini_client import get_embeddings_batch

REFRESH_INTERVAL = 600
BATCH_SIZE = 25
BATCH_PAUSE = 1.5

_client = None
_cache_id_to_vec: dict[str, list[float]] = {}
_last_refresh = 0


def _get_mongo():
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _client = MongoClient(uri)
    return _client


def _load_corpus():
    db = _get_mongo().get_database()
    collection = db["publications"]
    docs = list(
        collection.find({}, {"_id": 1, "contenu": 1})
    )
    if not docs:
        return {}

    corpus: dict[str, list[float]] = {}

    batches = [docs[i : i + BATCH_SIZE] for i in range(0, len(docs), BATCH_SIZE)]
    for batch in batches:
        textes = [d.get("contenu", "") for d in batch]
        try:
            vectors = get_embeddings_batch(textes)
        except Exception:
            vectors = [None] * len(batch)

        for d, vec in zip(batch, vectors):
            doc_id = str(d["_id"])
            if vec is not None:
                corpus[doc_id] = vec

        if len(batches) > 1:
            time.sleep(BATCH_PAUSE)

    return corpus


def get_corpus_embeddings(force_refresh=False):
    global _cache_id_to_vec, _last_refresh
    now = time.time()
    if force_refresh or (now - _last_refresh > REFRESH_INTERVAL):
        _cache_id_to_vec = _load_corpus()
        _last_refresh = now
    return _cache_id_to_vec


def get_corpus_embedding_by_id(doc_id: str):
    return get_corpus_embeddings().get(doc_id)
