"""
Tests du service Conversationnel (RAG + Writing Assist).
Tous les appels a gemini_client sont mockes pour ne pas consommer le quota
gratuit Gemini. La generation est remplacee par un texte fixe, les embeddings
par des vecteurs factices 768d (text-embedding-004).

Pour un vrai test de bout en bout contre l API Gemini, lancer :
    pytest tests/test_conversational.py -k "e2e" --no-header -v
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from conftest import add_service_path

add_service_path("conversational")

FAKE_REPONSE_QA = "Voici la reponse basee sur le contexte fourni."
FAKE_REPONSE_WRITING = "[IA] Voici une introduction amelioree avec des transitions plus fluides. [/IA] [Utilisateur] Texte original. [/Utilisateur]"


@pytest.fixture(scope="module", autouse=True)
def _mock_gemini():
    """Remplace tous les appels Gemini par des reponses factices."""
    patches = [
        patch(
            "src.gemini_client.generate_completion",
            side_effect=lambda prompt, system="": FAKE_REPONSE_QA,
        ),
        patch(
            "src.gemini_client.get_embedding",
            return_value=[0.0] * 768,
        ),
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
async def test_ask_retourne_reponse_et_sources(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/ask",
            json={"question": "Qu est-ce que l IA ?", "scope": "publications"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "reponse" in data
    assert "sources" in data
    assert data["reponse"] == FAKE_REPONSE_QA


@pytest.mark.asyncio
async def test_ask_scope_invalide_erreur(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/ask",
            json={"question": "Test", "scope": "invalide"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_ask_question_vide_erreur(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/ask",
            json={"question": "", "scope": "publications"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_assist_writing_retourne_segments(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/assist-writing",
            json={"brouillon": "Mon texte a ameliorer.", "type": "pfe"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "texteEnrichi" in data
    assert "segments" in data
    assert isinstance(data["segments"], list)


@pytest.mark.asyncio
async def test_assist_writing_brouillon_vide_erreur(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/assist-writing",
            json={"brouillon": "", "type": "pfe"},
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
    from src.gemini_client import generate_completion, get_embedding, get_embeddings_batch

    # Test generate_completion
    text = generate_completion("Dis bonjour en francais.")
    assert isinstance(text, str)
    assert len(text) > 0

    # Test get_embedding
    vec = get_embedding("Test embedding.")
    assert len(vec) == 768, f"Dimension inattendue : {len(vec)}"

    # Test get_embeddings_batch
    vectors = get_embeddings_batch(["Phrase 1", "Phrase 2"])
    assert len(vectors) == 2
    for v in vectors:
        assert len(v) == 768
