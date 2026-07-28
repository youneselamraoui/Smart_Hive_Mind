const SEUIL_ALERTE_SIMILARITE = 0.85;
const SEUIL_ORIGINALITE_MIN = 0.3;
const SEUIL_RIGUEUR_MIN = 0.4;
const SEUIL_COMPLETUDE_MIN = 0.4;

function generateJustification(diagnosticResult, decisionnelResult) {
    const regles = [];

    if (!diagnosticResult && !decisionnelResult) {
        return [];
    }

    // Regles issues du diagnostic (anti-plagiat)
    if (diagnosticResult && diagnosticResult.scoreMaxSimilarite !== undefined) {
        const score = diagnosticResult.scoreMaxSimilarite;

        if (score === 0) {
            regles.push({
                regle: "score_similarite_nul",
                valeur: score,
                impact: "positif",
                justification: "Aucune similarite detectee avec le corpus → note d'originalite maximale.",
            });
        } else if (score < SEUIL_ALERTE_SIMILARITE) {
            regles.push({
                regle: "similarite_moderee",
                valeur: score,
                impact: "neutre",
                justification: `Similarite (${score}) inferieure au seuil d'alerte (${SEUIL_ALERTE_SIMILARITE}) → pas de penalite automatique.`,
            });
        } else {
            regles.push({
                regle: "similarite_excessive",
                valeur: score,
                impact: "negatif",
                justification: `Similarite (${score}) superieure au seuil d'alerte (${SEUIL_ALERTE_SIMILARITE}) → signalement recommande.`,
            });
        }
    }

    // Regles issues du decisionnel (score publication)
    if (decisionnelResult) {
        if (
            decisionnelResult.originalite !== undefined &&
            decisionnelResult.originalite < SEUIL_ORIGINALITE_MIN
        ) {
            regles.push({
                regle: "originalite_insuffisante",
                valeur: decisionnelResult.originalite,
                impact: "negatif",
                justification: `Originalite (${decisionnelResult.originalite}) inferieure au seuil minimal (${SEUIL_ORIGINALITE_MIN}) → le score global est reduit.`,
            });
        }

        if (decisionnelResult.rigueur !== undefined && decisionnelResult.rigueur < SEUIL_RIGUEUR_MIN) {
            regles.push({
                regle: "rigueur_insuffisante",
                valeur: decisionnelResult.rigueur,
                impact: "negatif",
                justification: `Rigueur (${decisionnelResult.rigueur}) inferieure au seuil minimal (${SEUIL_RIGUEUR_MIN}) → la note de rigueur est penalisee.`,
            });
        }

        if (
            decisionnelResult.completude !== undefined &&
            decisionnelResult.completude < SEUIL_COMPLETUDE_MIN
        ) {
            regles.push({
                regle: "completude_insuffisante",
                valeur: decisionnelResult.completude,
                impact: "negatif",
                justification: `Completude (${decisionnelResult.completude}) inferieure au seuil minimal (${SEUIL_COMPLETUDE_MIN}) → la note de pertinence est reduite.`,
            });
        }

        if (
            decisionnelResult.originalite !== undefined &&
            decisionnelResult.originalite > SEUIL_ORIGINALITE_MIN * 2
        ) {
            regles.push({
                regle: "originalite_elevee",
                valeur: decisionnelResult.originalite,
                impact: "positif",
                justification: `Originalite (${decisionnelResult.originalite}) nettement au-dessus du seuil → contribution originale reconnue.`,
            });
        }

        if (decisionnelResult.scoreGlobal !== undefined) {
            if (decisionnelResult.scoreGlobal >= 0.7) {
                regles.push({
                    regle: "score_global_eleve",
                    valeur: decisionnelResult.scoreGlobal,
                    impact: "positif",
                    justification: `Score global (${decisionnelResult.scoreGlobal}) ≥ 0.7 → publication recommande pour evaluation humaine.`,
                });
            } else if (decisionnelResult.scoreGlobal < 0.3) {
                regles.push({
                    regle: "score_global_faible",
                    valeur: decisionnelResult.scoreGlobal,
                    impact: "negatif",
                    justification: `Score global (${decisionnelResult.scoreGlobal}) < 0.3 → des ameliorations substantielles sont requises avant publication.`,
                });
            }
        }
    }

    // Regle croisee : coherence diagnostic + decisionnel
    if (
        diagnosticResult &&
        diagnosticResult.scoreMaxSimilarite !== undefined &&
        decisionnelResult &&
        decisionnelResult.originalite !== undefined
    ) {
        if (
            diagnosticResult.scoreMaxSimilarite < 0.3 &&
            decisionnelResult.originalite > 0.7
        ) {
            regles.push({
                regle: "coherence_ia",
                valeur: null,
                impact: "positif",
                justification: "Faible similarite corpus + originalite elevee → les deux IA convergent vers un avis favorable.",
            });
        } else if (
            diagnosticResult.scoreMaxSimilarite > SEUIL_ALERTE_SIMILARITE &&
            decisionnelResult.originalite < SEUIL_ORIGINALITE_MIN
        ) {
            regles.push({
                regle: "coherence_ia",
                valeur: null,
                impact: "negatif",
                justification: "Similarite elevee ET originalite faible → confirmation croisee d'un probleme de fond.",
            });
        }
    }

    return regles;
}

module.exports = { generateJustification };
