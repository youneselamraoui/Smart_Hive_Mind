import subprocess
import sys
import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from conftest import load_service_main, SERVICES

PREDICTIVE_DIR = SERVICES["predictive"]
MODEL_PATH = PREDICTIVE_DIR / "src_predictive" / "model.joblib"

def test_erreur_si_modele_absent():
    if MODEL_PATH.exists():
        pytest.skip("model.joblib present — ce test verifie son absence")
    result = subprocess.run(
        [sys.executable, "-c", "from main import app"],
        cwd=str(PREDICTIVE_DIR),
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "Modele non entraine" in result.stderr or "Modele non entraine" in result.stdout

@pytest.fixture(scope="module")
def app():
    if not MODEL_PATH.exists():
        pytest.skip("model.joblib absent — impossible de tester le endpoint")
    yield load_service_main("predictive").app

@pytest.mark.asyncio
async def test_probabilite_entre_0_et_1(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/predictive/matching-score",
            json={
                "nbCompetencesMatchees": 15,
                "nbAnneesExperience": 8,
                "noteProfilMoyenne": 4.2,
                "nbMissionsRealisees": 12,
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert 0.0 <= data["probabiliteSucces"] <= 1.0

@pytest.mark.asyncio
async def test_faible_score_petites_valeurs(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/predictive/matching-score",
            json={
                "nbCompetencesMatchees": 0,
                "nbAnneesExperience": 0,
                "noteProfilMoyenne": 1.0,
                "nbMissionsRealisees": 0,
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["probabiliteSucces"] < 0.5
