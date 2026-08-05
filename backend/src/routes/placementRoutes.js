const { Router } = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const authOptional = require("../middlewares/authOptional");
const ctrl = require("../controllers/placementController");
const { postulerSchema, accepterSchema, cloturerSchema, creerMissionSchema } = require("../validators/placementSchema");
const Offre = require("../models/Offre");
const Mission = require("../models/Mission");
const ValidationCompetence = require("../models/ValidationCompetence");
const { getProbabiliteSucces, getProfilOuNull } = require("../services/matchingScoreService");

const router = Router();

router.get("/placements/offres", authOptional, async (req, res) => {
    try {
        const filter = {};
        if (req.query.statut) { if (req.query.statut !== "all") filter.statut = req.query.statut; }
        else filter.statut = "ouverte";
        const items = await Offre.find(filter).populate("organisationId", "nom prenom email").sort({ createdAt: -1 }).lean();

        // Si le membre est authentifie, le matching score vient d'ai-predictive
        if (req.membre) {
            const profil = await getProfilOuNull(req.membre.id);
            if (profil) {
                await Promise.all(items.map(async (item) => {
                    const proba = await getProbabiliteSucces(item, profil);
                    if (proba !== undefined) {
                        item.matchingScore = proba;
                    }
                }));
            }
        }

        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/placements/missions", auth, async (req, res) => {
    try {
        const filter = req.query.membreId ? { membreId: req.query.membreId } : {};
        const items = await Mission.find(filter).populate("membreId", "nom prenom email").populate("offreId", "titre").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/placements/candidatures", auth, async (req, res) => {
    try {
        const Candidature = require("../models/Candidature");
        const filter = {};
        if (req.query.offreId) filter.offreId = req.query.offreId;
        if (req.query.statut) filter.statut = req.query.statut;
        if (req.query.membreId) filter.membreId = req.query.membreId;
        const items = await Candidature.find(filter)
            .populate("offreId", "titre description")
            .populate("membreId", "nom prenom email")
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/placements/validations", auth, async (req, res) => {
    try {
        const filter = req.query.membreId ? { membreId: req.query.membreId } : {};
        const Mission = require("../models/Mission");
        const items = await ValidationCompetence.find(filter)
            .populate("membreId", "nom prenom email")
            .populate("missionId", "titre description statut")
            .populate("validePar", "nom prenom email")
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/placements/postuler", auth, validate(postulerSchema), ctrl.postuler);
router.post("/placements/accepter", auth, validate(accepterSchema), ctrl.accepterCandidature);
router.post("/placements/cloturer", auth, validate(cloturerSchema), ctrl.cloturerMission);
router.post("/placements/missions", auth, validate(creerMissionSchema), ctrl.creerMission);

module.exports = router;
