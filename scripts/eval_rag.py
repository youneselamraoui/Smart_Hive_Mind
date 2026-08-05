#!/usr/bin/env python3
"""
Evaluation RAGAS du pipeline RAG conversationnel (cahier des charges 5.7).

Usage :
    python scripts/eval_rag.py [--service-url http://localhost:8004]
                               [--judge-model gemini-flash-lite-latest]
                               [--note-execution "texte"]

Pre-requis :
    1. Service ai-conversational demarre (voir docker-compose.yml, port 8004).
    2. GEMINI_API_KEY definie dans l'environnement (juge RAGAS + embeddings).
    3. Dependances d'evaluation installees :
       pip install -r ai-services/conversational/requirements-eval.txt

Deroulement :
    1. Indexe le corpus seed (scripts/seed_publications_eval.json) via
       POST /conversational/index-publications (flux de production reel).
    2. Interroge POST /conversational/ask pour chaque question du jeu de test
       (scripts/rag_eval_questions.json).
    3. Calcule faithfulness et answer_relevancy avec RAGAS, sur UN SEUL
       modele juge (cohérence de la metrique).
    4. Affiche un resume console et sauvegarde docs/rag_eval_results.json.

Modele de generation du service (canonique, inchange) vs modele juge de
l'evaluation (choisi pour sa fiabilite au format JSON structure et son
quota disponible) : le juge est independant du modele qui genere les
reponses. La config par defaut du service (GEMINI_LLM_MODEL=gemini-2.5-flash)
n'est jamais modifiee ; tout contournement de quota occasionnel (ex. quota
journalier gemini-2.5-flash epuise) est documente dans le champ
"note_execution" du rapport, jamais applique en dur.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SERVICE_URL = os.getenv("CONVERSATIONAL_URL", "http://localhost:8004")
DEFAULT_CORPUS = REPO_ROOT / "scripts" / "seed_publications_eval.json"
DEFAULT_QUESTIONS = REPO_ROOT / "scripts" / "rag_eval_questions.json"
DEFAULT_OUTPUT = REPO_ROOT / "docs" / "rag_eval_results.json"
DEFAULT_JUDGE_MODEL = "gemini-flash-lite-latest"
GENERATION_MODEL_CANONIQUE = "gemini-2.5-flash"
EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

METRIQUES = ["faithfulness", "answer_relevancy"]


def post_json(url: str, payload: dict, timeout: int = 60) -> dict:
    """POST JSON avec retries sur erreurs transitoires."""
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    last_error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise SystemExit(
                f"[ERREUR] {url} a repondu HTTP {e.code}: "
                f"{e.read().decode('utf-8', errors='replace')[:300]}"
            ) from e
        except (urllib.error.URLError, TimeoutError) as e:
            last_error = e
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
    raise SystemExit(
        f"[ERREUR] Service conversationnel injoignable sur {url} "
        f"({last_error}). Demarrez le service, ou utilisez --service-url."
    )


def verifier_service(url: str) -> None:
    try:
        with urllib.request.urlopen(f"{url}/health", timeout=10) as response:
            if response.status != 200:
                raise SystemExit(f"[ERREUR] /health a repondu {response.status}")
    except (urllib.error.URLError, TimeoutError) as e:
        raise SystemExit(
            f"[ERREUR] Service conversationnel injoignable sur {url} ({e}).\n"
            f"  Demarrez-le : cd ai-services/conversational && "
            f"GEMINI_API_KEY=... python -m uvicorn main:app --port 8004"
        ) from e


def verifier_cle_api() -> str:
    cle = os.getenv("GEMINI_API_KEY", "").strip()
    if not cle:
        raise SystemExit(
            "[ERREUR] GEMINI_API_KEY manquante : elle est requise pour generer "
            "les reponses et pour le juge RAGAS. Exportez-la avant de lancer."
        )
    return cle


def charger_json(chemin: Path, champ: str) -> list[dict]:
    if not chemin.exists():
        raise SystemExit(f"[ERREUR] Fichier introuvable : {chemin}")
    with open(chemin, encoding="utf-8") as f:
        data = json.load(f)
    if champ not in data:
        raise SystemExit(f"[ERREUR] Champ '{champ}' absent de {chemin}")
    return data[champ]


def indexer_corpus(url: str, corpus: list[dict]) -> None:
    documents = [
        {"id": p["id"], "texte": f"{p['titre']}. {p['contenu']}", "scope": "publications"}
        for p in corpus
    ]
    resultat = post_json(f"{url}/conversational/index-publications", documents)
    print(f"[INDEX] {resultat.get('indexed', len(documents))} publications indexees dans ChromaDB")


def interroger(url: str, question: str) -> dict:
    resultat = post_json(f"{url}/conversational/ask", {"question": question, "scope": "publications"})
    return {
        "reponse": resultat["reponse"],
        "sources": resultat.get("sources", []),
        "contextes": resultat.get("contextes", []),
    }


def calculer_metriques(rows: list[dict], cle: str, modele_juge: str) -> dict:
    """Calcule faithfulness et answer_relevancy avec RAGAS, un seul juge."""
    from datasets import Dataset
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    from ragas import evaluate
    from ragas.embeddings import LangchainEmbeddingsWrapper
    from ragas.llms import LangchainLLMWrapper
    from ragas.metrics import answer_relevancy, faithfulness
    from ragas.run_config import RunConfig

    llm = LangchainLLMWrapper(
        ChatGoogleGenerativeAI(model=modele_juge, api_key=cle, temperature=0.0)
    )
    embeddings = LangchainEmbeddingsWrapper(
        GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL, api_key=cle)
    )

    dataset = Dataset.from_dict(
        {
            "question": [r["question"] for r in rows],
            "answer": [r["reponse"] for r in rows],
            "contexts": [r["contextes"] for r in rows],
            "ground_truth": [r["ground_truth"] for r in rows],
        }
    )

    resultat = evaluate(
        dataset,
        metrics=[faithfulness, answer_relevancy],
        llm=llm,
        embeddings=embeddings,
        show_progress=True,
        raise_exceptions=True,
        # Quota gratuit Gemini : workers reduits + timeout et retries larges.
        run_config=RunConfig(timeout=600, max_retries=8, max_workers=4),
    )
    return {
        "faithfulness": list(resultat["faithfulness"]),
        "answer_relevancy": list(resultat["answer_relevancy"]),
    }


def moyenne(valeurs: list[float]) -> float:
    valeurs = [v for v in valeurs if v is not None]
    if not valeurs:
        return float("nan")
    return round(sum(valeurs) / len(valeurs), 4)


def interpretation(nom: str, score: float) -> str:
    if score != score:  # NaN
        return "non calcule"
    if score >= 0.8:
        return "excellent"
    if score >= 0.6:
        return "bon"
    if score >= 0.4:
        return "moyen"
    return "faible"


def principal() -> None:
    parser = argparse.ArgumentParser(description="Evaluation RAGAS du pipeline RAG conversational")
    parser.add_argument("--service-url", default=DEFAULT_SERVICE_URL, help="URL du service ai-conversational")
    parser.add_argument("--corpus", default=DEFAULT_CORPUS, type=Path, help="Corpus seed des publications")
    parser.add_argument("--questions", default=DEFAULT_QUESTIONS, type=Path, help="Jeu de test Q/R")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, type=Path, help="Fichier de resultats JSON")
    parser.add_argument(
        "--judge-model",
        default=DEFAULT_JUDGE_MODEL,
        help="Modele juge RAGAS unique (defaut: gemini-flash-lite-latest).",
    )
    parser.add_argument(
        "--note-execution",
        default="",
        help="Note d'execution libre (contournement de quota eventuel) ajoutee au rapport.",
    )
    args = parser.parse_args()

    cle = verifier_cle_api()
    verifier_service(args.service_url)

    corpus = charger_json(args.corpus, "publications")
    jeu = charger_json(args.questions, "questions")
    if not 10 <= len(jeu) <= 15:
        print(f"[AVERTISSEMENT] Le jeu de test contient {len(jeu)} questions (10-15 recommande).")

    print(f"[EVAL] Service : {args.service_url}")
    print(f"[EVAL] Corpus : {len(corpus)} publications, {len(jeu)} questions")
    print(f"[EVAL] Juge RAGAS unique : {args.judge_model} / embeddings {EMBEDDING_MODEL}")
    print(f"[EVAL] Metriques : {', '.join(METRIQUES)}")

    indexer_corpus(args.service_url, corpus)

    rows = []
    for i, q in enumerate(jeu, start=1):
        print(f"[ASK] {i}/{len(jeu)} : {q['question'][:80]}...")
        try:
            reponse = interroger(args.service_url, q["question"])
        except Exception as e:  # erreur JSON ou champ manquant
            print(f"  -> echec : {e}")
            reponse = {"reponse": "", "sources": [], "contextes": []}
        rows.append(
            {
                "question": q["question"],
                "ground_truth": q["ground_truth"],
                "docs_attendus": q.get("docs_attendus", []),
                "reponse": reponse["reponse"],
                "sources": reponse["sources"],
                "contextes": reponse["contextes"],
            }
        )

    scores = calculer_metriques(rows, cle, args.judge_model)

    print("\n================= RESUME PAR QUESTION =================")
    lignes = []
    for i, (row, f, r) in enumerate(zip(rows, scores["faithfulness"], scores["answer_relevancy"]), start=1):
        f_val = round(f, 4) if f is not None else None
        r_val = round(r, 4) if r is not None else None
        ligne = {
            "numero": i,
            "question": row["question"],
            "ground_truth": row["ground_truth"],
            "docs_attendus": row["docs_attendus"],
            "sources_retrouvees": row["sources"],
            "reponse": row["reponse"],
            "faithfulness": f_val,
            "answer_relevancy": r_val,
        }
        lignes.append(ligne)
        print(
            f"  {i}. {row['question'][:70]}\n"
            f"     sources: {row['sources']}\n"
            f"     faithfulness={f_val}  answer_relevancy={r_val}"
        )

    resume = {
        "faithfulness_moyenne": moyenne(scores["faithfulness"]),
        "answer_relevancy_moyenne": moyenne(scores["answer_relevancy"]),
    }
    print("\n================= SCORES MOYENS ======================")
    for nom, val in resume.items():
        print(f"  {nom} = {val}  ({interpretation(nom, val)})")

    note_execution = (
        args.note_execution
        or (
            "Juge RAGAS unique et coherent sur tout le jeu de test "
            f"({args.judge_model}). Generation des reponses par le service "
            "avec sa configuration par defaut (canonique, inchangee)."
        )
    )
    resultat = {
        "metodologie": "RAGAS (faithfulness, answer_relevancy) - juge unique",
        "cahier_des_charges": "partie 5.7",
        "date": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "service_url": args.service_url,
        "modele_juge": args.judge_model,
        "modele_generation_canonique": GENERATION_MODEL_CANONIQUE,
        "modele_embedding": EMBEDDING_MODEL,
        "corpus": {"fichier": str(args.corpus), "nb_publications": len(corpus)},
        "jeu_de_test": {"fichier": str(args.questions), "nb_questions": len(jeu)},
        "note_execution": note_execution,
        "scores_moyens": resume,
        "par_question": lignes,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(resultat, f, ensure_ascii=False, indent=2)
    print(f"\n[OK] Resultats sauvegardes dans {args.output}")


if __name__ == "__main__":
    sys.exit(principal())
