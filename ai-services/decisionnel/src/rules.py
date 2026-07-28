import re

SECTION_KEYWORDS = {
    "introduction": ["introduction", "contexte", "problématique"],
    "methode": ["méthode", "méthodologie", "approche", "materials and methods"],
    "resultats": ["résultats", "resultats", "analyse", "observation", "findings"],
    "conclusion": ["conclusion", "discussion", "synthèse", "synthese", "perspectives"],
}

LONGUEUR_SEUILS = {
    "these": 15000,
    "pfe": 5000,
    "pfa": 3000,
    "libre": 1000,
}

class RuleEngine:
    def __init__(self, contenu: str):
        self.contenu = contenu

    def score_citations(self) -> float:
        patterns = [
            r"\(\w+(?:\s+et\s+\w+)?,\s*\d{4}\)",
            r"\[\d+\]",
            r"\(\d{4}\)",
            r'"[^"]+"\s*\(\d{4}\)',
        ]
        total = 0
        for pat in patterns:
            total += len(re.findall(pat, self.contenu, re.UNICODE))
        if total >= 25:
            return 1.0
        if total >= 15:
            return 0.8
        if total >= 8:
            return 0.5
        if total >= 3:
            return 0.3
        return total / 3 * 0.3

    def score_structure(self) -> float:
        mots = self.contenu.lower()
        found = 0
        for section, keywords in SECTION_KEYWORDS.items():
            if any(kw in mots for kw in keywords):
                found += 1
        return found / len(SECTION_KEYWORDS)

    def score_longueur(self, type_publication: str) -> float:
        seuil = LONGUEUR_SEUILS.get(type_publication, 1000)
        nb_mots = len(self.contenu.split())
        if nb_mots >= seuil:
            return 1.0
        return round(nb_mots / seuil, 4)

    def evaluer(self, type_publication: str) -> dict:
        citations = self.score_citations()
        structure = self.score_structure()
        longueur = self.score_longueur(type_publication)
        rigueur = round((citations + structure) / 2, 4)
        completude = longueur
        return {
            "citations": citations,
            "structure": structure,
            "longueur": longueur,
            "rigueur": rigueur,
            "completude": completude,
        }
