"""
Tests du service Decisionnel (Score de publication).
Tous les appels a gemini_client sont mockes. Les vecteurs d embedding
factices font 768 dimensions (text-embedding-004).
Le score ML (originalite) est fixe a 0.75 via le mock de score_originalite.

Pour un vrai test de bout en bout contre l API Gemini, lancer :
    pytest tests/test_decisionnel.py -k "e2e" --no-header -v
"""
import pytest
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport
from conftest import add_service_path

add_service_path("decisionnel")

BON_TEXTE = """
Introduction
Dans le cadre de cette recherche, nous explorons l'impact des reseaux de neurones profonds sur la classification d'images medicales.

Methode
Nous avons utilise un jeu de donnees de 10 000 images radiographiques, divise en ensembles d'entraınement (80%) et de test (20%). Un CNN a ete entraine avec transfer learning (ResNet50) pendant 50 epochs.

Resultats
Le modele a atteint une precision de 94.5% sur l'ensemble de test, depassant les methodes traditionnelles (SVM: 82.1%, Random Forest: 78.3%). La matrice de confusion revele un taux de faux positifs de 2.1%.

Conclusion
Ces resultats demontrent que l'apprentissage profond peut significativement ameliorer le diagnostic assiste par ordinateur. Des travaux futurs exploreront l'integration de donnees multimodales.

References
(Brown, 2020) a pose les bases de cette approche. (Smith, 2019) a montre des resultats complementaires. [1] propose une revue de litterature exhaustive. (LeCun, 2015) a introduit les CNN modernes.
""" * 5  # assez long pour depasser 1000 mots

MAUVAIS_TEXTE = "Salut c'est mon devoir."

POIDS_REGLES = 0.4
POIDS_ML = 0.6


@pytest.fixture(scope="module", autouse=True)
def _mock_gemini():
    """Remplace get_embeddings_batch par des vecteurs factices 768d."""
    patches = [
        patch(
            "src.gemini_client.get_embeddings_batch",
            return_value=[[0.1] * 768, [0.1] * 768],
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
async def test_bon_texte_scores_eleves(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/decisionnel/score-publication",
            json={"titre": "Deep Learning pour la classification d'images medicales", "contenu": BON_TEXTE, "type": "these"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["rigueur"] > 0.5
    assert data["completude"] >= 0.9
    # originalite = similarite cosinus entre [0.1]*768 et [0.1]*768 = 1.0
    assert data["originalite"] == 1.0
    assert 0.0 <= data["scoreGlobal"] <= 1.0


@pytest.mark.asyncio
async def test_mauvais_texte_scores_faibles(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/decisionnel/score-publication",
            json={"titre": "Mon devoir", "contenu": MAUVAIS_TEXTE, "type": "libre"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["rigueur"] < 0.5
    assert data["completude"] < 0.5
    assert 0.0 <= data["scoreGlobal"] <= 1.0


@pytest.mark.asyncio
async def test_score_global_toujours_entre_0_et_1(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for texte, titre, typ in [
            ("a" * 500, "Court", "libre"),
            ("Introduction. Methode. Resultats. Conclusion. " * 20, "article test", "pfa"),
            (BON_TEXTE[:2000], "Long", "these"),
        ]:
            resp = await client.post(
                "/decisionnel/score-publication",
                json={"titre": titre, "contenu": texte, "type": typ},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert 0.0 <= data["scoreGlobal"] <= 1.0, f"scoreGlobal hors limite pour {typ}"
            assert 0.0 <= data["originalite"] <= 1.0
            assert 0.0 <= data["rigueur"] <= 1.0
            assert 0.0 <= data["completude"] <= 1.0


@pytest.mark.asyncio
async def test_type_invalide_erreur(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/decisionnel/score-publication",
            json={"titre": "Test", "contenu": "Contenu", "type": "invalide"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_details_explicabilite_presents(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/decisionnel/score-publication",
            json={"titre": "Titre", "contenu": "Introduction. Methode. Resultats. Conclusion.", "type": "pfe"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "details" in data
    assert "regles" in data["details"]
    assert "ml" in data["details"]
    assert "ponderation" in data["details"]
    assert data["details"]["ponderation"] == {"poidsRegles": POIDS_REGLES, "poidsML": POIDS_ML}


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
    from src.gemini_client import get_embeddings_batch

    vectors = get_embeddings_batch([
        "Titre de test",
        "Contenu de test pour validation manuelle de l'API Gemini.",
    ])
    assert len(vectors) == 2
    for v in vectors:
        assert len(v) == 768, f"Dimension inattendue : {len(v)} (attendu: 768)"
        assert all(isinstance(x, float) for x in v)
