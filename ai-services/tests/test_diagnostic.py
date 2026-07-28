"""
Tests du service Diagnostic (Anti-plagiat).
Tous les appels a gemini_client sont mockes pour ne pas consommer le quota
gratuit Gemini a chaque run de CI. Les vecteurs d embedding sont des factices
de dimension 768 (dimension de text-embedding-004, confirmee par la doc
Google : https://cloud.google.com/vertex-ai/docs/vector-search-2/embeddings/autogenerating-embeddings).

Pour un vrai test de bout en bout contre l API Gemini, lancer :
    pytest tests/test_diagnostic.py -k "e2e" --no-header -v
"""
import pytest
import numpy as np
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from conftest import add_service_path

add_service_path("diagnostic")

EMBEDDING_DIM = 768  # text-embedding-004


def _fake_vec(seed: int = 0) -> list[float]:
    """Vecteur factice deterministic de dimension EMBEDDING_DIM."""
    rng = np.random.RandomState(seed)
    return rng.randn(EMBEDDING_DIM).tolist()


def _fake_vec_np(seed: int = 0) -> np.ndarray:
    return np.array(_fake_vec(seed))


CORPUS_TEXTES = {
    "doc1": "La photosynthese est le processus par lequel les plantes convertissent la lumiere solaire en energie chimique.",
    "doc2": "Les chercheurs ont decouvert une nouvelle espece de papillon dans la foret amazonienne.",
    "doc3": "L'intelligence artificielle transforme profondement les methodes de diagnostic medical.",
}

# Vecteurs factices : doc1 ~ doc3 (proches), doc2 orthogonal
_C1 = _fake_vec_np(1)  # doc1
_C2 = _fake_vec_np(2)  # doc2
_C3 = _C1 + 0.01 * np.random.RandomState(99).randn(EMBEDDING_DIM)  # doc3 tres proche de doc1
_C3 = _C3.tolist()
_C1 = _C1.tolist()
_C2 = _C2.tolist()

FAKE_CORPUS = {"doc1": _C1, "doc2": _C2, "doc3": _C3}


@pytest.fixture(scope="module", autouse=True)
def _mock_gemini():
    """Remplace tous les appels a gemini_client par des reponses factices."""
    def fake_get_embedding(texte: str) -> list[float]:
        # Retourne _C1 pour le texte "identique", un vecteur aleatoire sinon
        if texte == CORPUS_TEXTES["doc1"]:
            return _C1
        return _fake_vec(abs(hash(texte)) % 1000)

    patches = [
        patch("src.gemini_client.get_embedding", side_effect=fake_get_embedding),
        patch("src.corpus.get_corpus_embeddings", return_value=FAKE_CORPUS),
    ]
    for p in patches:
        p.start()
    yield
    for p in patches:
        p.stop()


@pytest.fixture(scope="module")
def app():
    from main import app as _app
    yield _app


@pytest.mark.asyncio
async def test_texte_identique_score_eleve(app):
    """Un texte identique a un document du corpus doit declencher l alerte (>0.85)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/diagnostic/plagiarism",
            json={"texte": CORPUS_TEXTES["doc1"], "publicationId": "doc1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["scoreMaxSimilarite"] > 0.85, f"score={data['scoreMaxSimilarite']}"
    assert data["publicationSimilaireId"] is not None
    assert data["seuil_alerte"] is True


@pytest.mark.asyncio
async def test_texte_different_score_bas(app):
    """Un texte sans rapport doit rester sous 0.5."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/diagnostic/plagiarism",
            json={
                "texte": "Le sport est essentiel pour maintenir une bonne sante physique et mentale.",
                "publicationId": "doc999",
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["scoreMaxSimilarite"] < 0.5


@pytest.mark.asyncio
async def test_texte_vide_erreur(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/diagnostic/plagiarism",
            json={"texte": "", "publicationId": "doc1"},
        )
    assert resp.status_code == 400


# =============================================================================
# Test de validation manuel contre la vraie API Gemini
# =============================================================================
@pytest.mark.skip(reason="Appel API Gemini reel — necessite GEMINI_API_KEY et consomme le quota")
@pytest.mark.asyncio
async def test_e2e_reelle_api_gemini():
    """
    Verification ponctuelle que l API Gemini repond correctement.
    Lancer avec : GEMINI_API_KEY=... pytest ... -k e2e
    """
    from src.gemini_client import get_embedding

    vec = get_embedding("Texte de test pour validation manuelle.")
    assert len(vec) == EMBEDDING_DIM, f"Dimension inattendue : {len(vec)} (attendu: {EMBEDDING_DIM})"
    assert all(isinstance(v, float) for v in vec), "Les valeurs doivent etre des floats"
