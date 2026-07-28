const { Router } = require("express");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
    createIdeeSchema,
    promoteToProjetSchema,
    generateBusinessPlanSchema,
    contributeSchema,
    voteIdeeSchema,
} = require("../validators/entrepreneuriatSchema");
const ctrl = require("../controllers/entrepreneuriatController");
const Idee = require("../models/Idee");
const CampagneCrowdfunding = require("../models/CampagneCrowdfunding");
const Projet = require("../models/Projet");
const BusinessPlan = require("../models/BusinessPlan");

const router = Router();

router.get("/entrepreneuriat/idees", async (req, res) => {
    try {
        const items = await Idee.find().populate("auteurId", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/entrepreneuriat/campagnes", async (req, res) => {
    try {
        const items = await CampagneCrowdfunding.find().populate("projetId").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/entrepreneuriat/projets/:id", async (req, res) => {
    try {
        const item = await Projet.findById(req.params.id).populate("equipe", "nom prenom email");
        if (!item) return res.status(404).json({ error: "Projet introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/entrepreneuriat/business-plans", async (req, res) => {
    try {
        const filter = req.query.projetId ? { projetId: req.query.projetId } : {};
        const items = await BusinessPlan.find(filter).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/entrepreneuriat/idees", auth, validate(createIdeeSchema), ctrl.createIdee);
router.post("/entrepreneuriat/idees/vote", auth, validate(voteIdeeSchema), ctrl.voteIdee);
router.post("/entrepreneuriat/idees/promote", auth, validate(promoteToProjetSchema), ctrl.promoteToProjet);
router.post("/entrepreneuriat/business-plan/generate", auth, validate(generateBusinessPlanSchema), ctrl.generateBusinessPlan);
router.post("/entrepreneuriat/campagnes/contribute", auth, validate(contributeSchema), ctrl.contributeToCampaign);

module.exports = router;
