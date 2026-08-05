from google import genai
from google.genai import types
import os
import time
import math

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

EMBEDDING_MODEL = os.environ.get("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
LLM_MODEL = os.environ.get("GEMINI_LLM_MODEL", "gemini-flash-latest")
EMBEDDING_DIM = 768
BATCH_SIZE = 25
BATCH_PAUSE = 1.5


def _l2_normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return vec
    return [x / norm for x in vec]


def _with_retry(fn, max_retries=5):
    for attempt in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if "RESOURCE_EXHAUSTED" in str(e) and attempt < max_retries - 1:
                time.sleep(2**attempt)
                continue
            raise


def get_embedding(texte: str) -> list[float]:
    def call():
        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=texte,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
        )
        return response.embeddings[0].values

    return _l2_normalize(_with_retry(call))


def get_embeddings_batch(textes: list[str]) -> list[list[float]]:
    if not textes:
        return []

    result = []
    for i in range(0, len(textes), BATCH_SIZE):
        batch = textes[i : i + BATCH_SIZE]

        def call(b=batch):
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=b,
                config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
            )
            return [e.values for e in response.embeddings]

        vectors = _with_retry(call)
        result.extend(_l2_normalize(v) for v in vectors)

        if i + BATCH_SIZE < len(textes):
            time.sleep(BATCH_PAUSE)

    return result


def generate_completion(prompt: str, system: str = "") -> str:
    def call():
        config = (
            types.GenerateContentConfig(system_instruction=system) if system else None
        )
        response = client.models.generate_content(
            model=LLM_MODEL, contents=prompt, config=config
        )
        return response.text

    return _with_retry(call)
