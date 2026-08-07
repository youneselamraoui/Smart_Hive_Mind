"""
Configuration partagee des tests IA.

Chaque service possede son propre package src_<service> (ex. src_decisionnel)
pour eviter toute collision de namespace : les 4 services peuvent etre
importes dans un meme process pytest sans ecrasement mutuel.

load_service_main(name) charge le main.py du service dans un module au nom
unique (<service>_main) via importlib, ce qui evite aussi la collision du
module 'main' entre services.
"""
import os
import sys
from importlib import util
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Les gemini_client.py des services font os.environ["GEMINI_API_KEY"] au
# niveau module : charge la cle depuis le .env racine si presente, sinon un
# placeholder (tous les appels Gemini sont mockes, aucune requete reelle).
if not os.environ.get("GEMINI_API_KEY"):
    dotenv_path = PROJECT_ROOT / ".env"
    if dotenv_path.exists():
        for line in dotenv_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())
    os.environ.setdefault("GEMINI_API_KEY", "test-placeholder")

SERVICES = {
    "diagnostic": PROJECT_ROOT / "diagnostic",
    "predictive": PROJECT_ROOT / "predictive",
    "decisionnel": PROJECT_ROOT / "decisionnel",
    "conversational": PROJECT_ROOT / "conversational",
}

# Rend les packages src_<service> importables des le chargement du conftest,
# avant tout patch/mock (les noms de packages sont uniques, pas de collision).
for _service_dir in SERVICES.values():
    _path = str(_service_dir)
    if _path not in sys.path:
        sys.path.insert(0, _path)


def _ensure_service_path(name: str):
    path = str(SERVICES[name])
    if path not in sys.path:
        sys.path.insert(0, path)


def load_service_main(name: str):
    """Charge le main.py d'un service dans sys.modules sous un nom unique.

    Le dossier du service est ajoute a sys.path pour que ses imports
    internes (src_<service>.*) soient resolubles.
    """
    _ensure_service_path(name)
    module_name = f"{name}_main"
    if module_name in sys.modules:
        return sys.modules[module_name]
    main_file = SERVICES[name] / "main.py"
    spec = util.spec_from_file_location(module_name, main_file)
    module = util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module
