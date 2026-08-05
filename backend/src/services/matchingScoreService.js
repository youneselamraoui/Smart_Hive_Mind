const ProfilCertifie = require("../models/ProfilCertifie");

const IA_PREDICTIVE_URL = process.env.IA_PREDICTIVE_URL || "http://ai-predictive:8000";
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

function calculerFeatures(offre, profil) {
    const exigences = (offre.exigences || [])
        .map((e) => String(e).trim().toLowerCase())
        .filter(Boolean);
    const competences = (profil.competencesValidees || [])
        .map((c) => String(c.competence || "").trim().toLowerCase())
        .filter(Boolean);
    const nbCompetencesMatchees = exigences.filter((ex) =>
        competences.some((c) => c === ex || c.includes(ex) || ex.includes(c))
    ).length;

    const notes = [
        ...(profil.competencesValidees || [])
            .map((c) => c.note)
            .filter((n) => typeof n === "number"),
        ...(profil.historiqueMissions || [])
            .map((m) => m.evaluationClient)
            .filter((n) => typeof n === "number"),
    ];
    const noteProfilMoyenne = notes.length
        ? notes.reduce((acc, n) => acc + n, 0) / notes.length
        : 0;

    return {
        nbCompetencesMatchees,
        // Aucun champ d'anciennete n'existe dans ProfilCertifie : 0 par defaut.
        nbAnneesExperience: 0,
        noteProfilMoyenne,
        nbMissionsRealisees: (profil.historiqueMissions || []).length,
    };
}

/**
 * Calcule le score de matching via ai-predictive. Best-effort : renvoie
 * undefined si le service IA est indisponible (timeout 8s) ou en erreur,
 * sans bloquer le flux de candidature.
 */
async function getProbabiliteSucces(offre, profil) {
    try {
        const features = calculerFeatures(offre, profil);
        const iaRes = await fetchWithTimeout(`${IA_PREDICTIVE_URL}/predictive/matching-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(features),
        });
        if (!iaRes.ok) {
            return undefined;
        }
        const data = await iaRes.json();
        const proba = Number(data.probabiliteSucces);
        return Number.isFinite(proba) ? proba : undefined;
    } catch {
        return undefined;
    }
}

async function getProfilOuNull(membreId) {
    return ProfilCertifie.findOne({ membreId }).lean();
}

module.exports = { getProbabiliteSucces, calculerFeatures, getProfilOuNull };
