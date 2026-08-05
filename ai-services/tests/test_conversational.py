"""
Tests du service Conversationnel (RAG + Writing Assist).
Tous les appels a gemini_client sont mockes pour ne pas consommer le quota
gratuit Gemini. La generation est remplacee par un texte fixe, les embeddings
par des vecteurs factices 768d (gemini-embedding-001).

Pour un vrai test de bout en bout contre l API Gemini, lancer :
    pytest tests/test_conversational.py -k "e2e" --no-header -v
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from conftest import load_service_main

FAKE_REPONSE_QA = "Voici la reponse basee sur le contexte fourni."
FAKE_REPONSE_WRITING = "[IA] Voici une introduction amelioree avec des transitions plus fluides. [/IA] [Utilisateur] Texte original. [/Utilisateur]"


@pytest.fixture(scope="module", autouse=True)
def _mock_gemini():
    """Remplace tous les appels Gemini par des reponses factices."""
    patches = [
        patch(
            "src_conversational.gemini_client.generate_completion",
            side_effect=lambda prompt, system="": FAKE_REPONSE_QA,
        ),
        patch(
            "src_conversational.gemini_client.get_embedding",
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
    yield load_service_main("conversational").app


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
    assert "contextes" in data
    assert isinstance(data["contextes"], list)
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
async def test_ask_dedoublonne_sources_par_doc_id(app):
    """Deux chunks du meme document ne doivent produire qu'une seule source."""
    fake_context = [
        {"id": "pub-a", "chunk_id": "pub-a_0", "texte": "Passage 1 du doc A."},
        {"id": "pub-a", "chunk_id": "pub-a_1", "texte": "Passage 2 du doc A."},
        {"id": "pub-b", "chunk_id": "pub-b_0", "texte": "Passage 1 du doc B."},
    ]
    with patch("conversational_main.search", return_value=fake_context):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post(
                "/conversational/ask",
                json={"question": "Qu est-ce que l IA ?", "scope": "publications"},
            )
    assert resp.status_code == 200
    data = resp.json()
    assert data["sources"] == ["pub-a", "pub-b"]
    assert len(data["contextes"]) == 3
    assert data["reponse"] == FAKE_REPONSE_QA


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


@pytest.mark.asyncio
async def test_generate_retourne_contenu(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/generate",
            json={"prompt": "Génère un paragraphe synthétique.", "type": "these", "ton": "academique"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "contenu" in data
    assert data["contenu"] == FAKE_REPONSE_QA
    assert data["type"] == "these"
    assert data["ton"] == "academique"


@pytest.mark.asyncio
async def test_generate_prompt_vide_erreur(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/conversational/generate",
            json={"prompt": "", "type": "these", "ton": "academique"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_index_document_long_produit_plusieurs_chunks():
    """Un document > 500 mots doit etre indexe en plusieurs chunks distincts,
    avec des ids f"{doc_id}_{chunk_index}" et les metadonnees doc_id/chunk_index."""
    from src_conversational.vectorstore import (
        COLLECTION_PUBLICATIONS,
        _get_or_create_collection,
        delete_document,
        index_document,
    )

    doc_id = "test-long-doc-chunking"
    long_texte = " ".join(["mot"] * 1200)  # 1200 mots > 500
    with patch(
        "src_conversational.vectorstore.get_embeddings_batch",
        side_effect=lambda textes: [[0.0] * 768 for _ in textes],
    ):
        index_document(doc_id, long_texte, scope="publications")
    try:
        col = _get_or_create_collection(COLLECTION_PUBLICATIONS)
        res = col.get(where={"doc_id": doc_id}, include=["metadatas", "documents"])
        assert len(res["ids"]) >= 2, "le document long doit produire plusieurs chunks"
        assert res["ids"] == [f"{doc_id}_{i}" for i in range(len(res["ids"]))]
        for i, meta in enumerate(res["metadatas"]):
            assert meta["doc_id"] == doc_id
            assert meta["chunk_index"] == i
            assert meta["scope"] == "publications"
    finally:
        delete_document(doc_id)


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
    from src_conversational.gemini_client import generate_completion, get_embedding, get_embeddings_batch

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
