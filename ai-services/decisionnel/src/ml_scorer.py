from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from src.gemini_client import get_embeddings_batch


def score_originalite(titre: str, contenu: str) -> float:
    vectors = get_embeddings_batch([titre, contenu])
    if len(vectors) < 2:
        return 0.0
    emb_titre = np.array(vectors[0]).reshape(1, -1)
    emb_contenu = np.array(vectors[1]).reshape(1, -1)
    sim = float(cosine_similarity(emb_titre, emb_contenu)[0, 0])
    return round(sim, 4)
