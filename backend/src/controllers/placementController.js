const Candidature = require("../models/Candidature");

exports.creerMission = async (req, res) => {
    try {
        const { titre, description, competencesRequises, budget, dateLimite } = req.body;
        const mission = await Mission.create({
            titre,
            description,
            competencesRequises: competencesRequises ? competencesRequises.split(',').map(s => s.trim()) : [],
            budget: budget || 0,
            dateLimite: dateLimite ? new Date(dateLimite) : undefined,
            membreId: req.membre.id,
            periode: { debut: new Date() },
            statut: 'en_cours',
        });
        res.status(201).json({ message: 'Mission créée.', mission });
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
        res.status(500).json({ error: 'Erreur interne.' });
    }
};
const Offre = require("../models/Offre");
const Mission = require("../models/Mission");
const ValidationCompetence = require("../models/ValidationCompetence");
const Membre = require("../models/Membre");
const profilService = require("../services/profilService");

/**
 * Postuler a une offre (cree une candidature).
 */
exports.postuler = async (req, res) => {
    try {
        const { offreId, lettreMotivation } = req.body;
        const membreId = req.membre.id;

        const offre = await Offre.findById(offreId);
        if (!offre) {
            return res.status(404).json({ error: "Offre introuvable." });
        }
        if (offre.statut !== "ouverte") {
            return res.status(400).json({ error: "Cette offre n est pas ouverte aux candidatures." });
        }

        const existante = await Candidature.findOne({ offreId, membreId });
        if (existante) {
            return res.status(409).json({ error: "Vous avez deja postule a cette offre." });
        }

        const candidature = await Candidature.create({
            offreId,
            membreId,
            lettreMotivation: lettreMotivation || "",
        });

        res.status(201).json({
            message: "Candidature envoyee.",
            candidature: {
                id: candidature._id,
                statut: candidature.statut,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Accepter une candidature (reserve a l'organisation).
 * Cree la Mission et ferme l'offre.
 */
exports.accepterCandidature = async (req, res) => {
    try {
        const { candidatureId, periodeDebut, periodeFin } = req.body;

        const candidature = await Candidature.findById(candidatureId).populate("offreId");
        if (!candidature) {
            return res.status(404).json({ error: "Candidature introuvable." });
        }

        const offre = candidature.offreId;
        if (offre.organisationId.toString() !== req.membre.id) {
            return res.status(403).json({
                error: "Seul l organisateur de l offre peut accepter une candidature.",
            });
        }

        if (candidature.statut !== "en_attente") {
            return res.status(400).json({ error: "Cette candidature a deja ete traitee." });
        }

        candidature.statut = "acceptee";
        await candidature.save();

        offre.statut = "pourvue";
        await offre.save();

        const mission = await Mission.create({
            offreId: offre._id,
            membreId: candidature.membreId,
            periode: {
                debut: periodeDebut ? new Date(periodeDebut) : new Date(),
                fin: periodeFin ? new Date(periodeFin) : undefined,
            },
            statut: "en_cours",
        });

        res.status(201).json({
            message: "Candidature acceptee, mission creee.",
            mission: {
                id: mission._id,
                statut: mission.statut,
                periode: mission.periode,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Cloturer une mission (reserve au client / organisation).
 * Recoit evaluationClient + commentaire, cree une ValidationCompetence,
 * met a jour le reputationScore du membre (moyenne ponderee).
 */
exports.cloturerMission = async (req, res) => {
    try {
        const { missionId, evaluationClient, commentaire, competence } = req.body;
        const clientId = req.membre.id;

        const mission = await Mission.findById(missionId).populate("offreId");
        if (!mission) {
            return res.status(404).json({ error: "Mission introuvable." });
        }

        const offre = mission.offreId;
        if (offre) {
            if (offre.organisationId.toString() !== clientId) {
                return res.status(403).json({
                    error: "Seul le client de l offre peut cloturer la mission.",
                });
            }
        } else {
            if (mission.membreId.toString() !== clientId) {
                return res.status(403).json({
                    error: "Seul le createur de la mission peut la cloturer.",
                });
            }
        }

        if (mission.statut !== "en_cours") {
            return res.status(400).json({ error: "Cette mission n est pas en cours." });
        }

        if (evaluationClient === undefined || evaluationClient === null) {
            return res.status(400).json({ error: "evaluationClient est requis (0-5)." });
        }
        const note = Number(evaluationClient);
        if (note < 0 || note > 5) {
            return res.status(400).json({ error: "evaluationClient doit etre entre 0 et 5." });
        }

        mission.evaluationClient = note;
        mission.statut = "terminee";
        await mission.save();

        // Creer une validation de competence
        if (competence) {
            await ValidationCompetence.create({
                membreId: mission.membreId,
                missionId: mission._id,
                competence,
                note,
                validePar: clientId,
            });

            const profil = await profilService.getOrCreateProfil(mission.membreId);
            profil.competencesValidees.push({
                competence,
                note,
                missionId: mission._id,
                validePar: clientId,
                date: new Date(),
            });
            await profil.save();
        }

        const profil = await profilService.getOrCreateProfil(mission.membreId);
        profil.historiqueMissions.push({
            missionId: mission._id,
            evaluationClient: note,
        });
        await profil.save();

        await profilService.recalculerReputationScore(mission.membreId);

        const membre = await Membre.findById(mission.membreId);

        res.json({
            message: "Mission cloturee et evaluation enregistree.",
            mission: {
                id: mission._id,
                statut: mission.statut,
                evaluationClient: mission.evaluationClient,
            },
            membre: membre
                ? {
                      id: membre._id,
                      reputationScore: membre.reputationScore,
                  }
                : null,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
