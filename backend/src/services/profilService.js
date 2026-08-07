const ProfilCertifie = require("../models/ProfilCertifie");
const Membre = require("../models/Membre");

async function getOrCreateProfil(membreId) {
    let profil = await ProfilCertifie.findOne({ membreId });
    if (!profil) {
        profil = await ProfilCertifie.create({ membreId });
    }
    return profil;
}

async function recalculerReputationScore(membreId) {
    const profil = await getOrCreateProfil(membreId);

    // Ponderation : les missions reelles (evaluationClient) ont un poids double (2)
    // par rapport aux validations de competences (poids 1), car une mission evaluee
    // par un client reel est plus significative qu'une validation isolee.
    const POIDS_MISSION = 2;
    const POIDS_COMPETENCE = 1;

    const notesMissions = profil.historiqueMissions
        .filter((m) => m.evaluationClient != null)
        .map((m) => ({ note: m.evaluationClient, poids: POIDS_MISSION }));

    const notesCompetences = profil.competencesValidees
        .filter((c) => c.note != null)
        .map((c) => ({ note: c.note, poids: POIDS_COMPETENCE }));

    const toutesNotes = [...notesMissions, ...notesCompetences];
    if (toutesNotes.length === 0) {
        profil.reputationScore = 0;
    } else {
        const sommePonderee = toutesNotes.reduce((acc, n) => acc + n.note * n.poids, 0);
        const sommePoids = toutesNotes.reduce((acc, n) => acc + n.poids, 0);
        const moyennePonderee = sommePonderee / sommePoids;
        profil.reputationScore = Math.round(Math.min(moyennePonderee * 20, 100) * 100) / 100;
    }

    await profil.save();

    await Membre.findByIdAndUpdate(membreId, { reputationScore: profil.reputationScore });

    return profil;
}

module.exports = { getOrCreateProfil, recalculerReputationScore };
