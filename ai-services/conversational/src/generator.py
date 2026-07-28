import re
from src.gemini_client import generate_completion

SYSTEM_PROMPT_QA = (
    "Tu es un assistant specialise dans l'accompagnement de porteurs de projets "
    "et d'etudiants. Reponds en francais UNIQUEMENT. Base tes reponses "
    "exclusivement sur le contexte fourni. Si le contexte ne permet pas de "
    "repondre, dis-le clairement."
)

SYSTEM_PROMPT_WRITING = (
    "Tu es un assistant de redaction academique et professionnelle. "
    "Ameliore le texte fourni par l'utilisateur sans en changer le sens. "
    "Ajoute des transitions, des formulations plus claires, une meilleure "
    "structure. Pour chaque ajout ou modification significative, marque-le "
    "explicitement comme venant de l'IA. Reponds en francais UNIQUEMENT."
)


def generate_answer(query: str, context_chunks: list[dict]) -> dict:
    context = "\n\n".join(
        f"[Document {i+1}] {c['texte']}" for i, c in enumerate(context_chunks)
    )
    prompt = (
        f"Contexte :\n{context}\n\n"
        f"Question : {query}\n\n"
        "Reponds en francais en te basant uniquement sur le contexte ci-dessus."
    )
    reponse = generate_completion(prompt, system=SYSTEM_PROMPT_QA)
    return {"reponse": reponse, "sources": [c["id"] for c in context_chunks]}


def assist_writing(brouillon: str, type_texte: str) -> dict:
    prompt = (
        f"Voici un brouillon de type '{type_texte}' :\n\n{brouillon}\n\n"
        "1. Enrichis et re-structure ce texte.\n"
        "2. Pour chaque passage significatif que tu AJOUTES, "
        "prefixe-le par [IA] et mets-le entre crochets.\n"
        "3. Laisse les passages originaux de l'utilisateur inchanges, "
        "prefixes par [Utilisateur].\n"
        "4. Retourne le texte complet avec ces marqueurs."
    )
    raw = generate_completion(prompt, system=SYSTEM_PROMPT_WRITING)
    segments = _parse_segments(raw)
    return {"texteEnrichi": raw, "segments": segments}


def _parse_segments(text: str) -> list[dict]:
    pattern = r"\[(IA|Utilisateur)\]\s*([\s\S]*?)(?=\[IA\]|\[Utilisateur\]|\Z)"
    matches = re.findall(pattern, text, re.IGNORECASE)
    segments = []
    for tag, content in matches:
        segments.append({"text": content.strip(), "source": tag.lower()})
    if not segments:
        segments.append({"text": text.strip(), "source": "utilisateur"})
    return segments
