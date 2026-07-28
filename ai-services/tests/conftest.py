import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SERVICES = {
    "diagnostic": PROJECT_ROOT / "diagnostic",
    "predictive": PROJECT_ROOT / "predictive",
    "decisionnel": PROJECT_ROOT / "decisionnel",
    "conversational": PROJECT_ROOT / "conversational",
}

def add_service_path(name: str):
    path = str(SERVICES[name])
    if path not in sys.path:
        sys.path.insert(0, path)
