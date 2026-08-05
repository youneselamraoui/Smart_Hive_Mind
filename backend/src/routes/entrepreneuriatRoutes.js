const { Router } = require("express");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
    createIdeeSchema,
    promoteToProjetSchema,
    generateBusinessPlanSchema,
    contributeSchema,
    voteIdeeSchema,
    createCampagneSchema,
} = require("../validators/entrepreneuriatSchema");
const ctrl = require("../controllers/entrepreneuriatController");
const Idee = require("../models/Idee");
const CampagneCrowdfunding = require("../models/CampagneCrowdfunding");
const Projet = require("../models/Projet");

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
        const item = await Projet.findById(req.params.id)
            .populate("equipe", "nom prenom email")
            .populate("porteurId", "nom prenom email");
        if (!item) return res.status(404).json({ error: "Projet introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/entrepreneuriat/business-plans", ctrl.listBusinessPlans);
router.get("/entrepreneuriat/business-plans/:id", ctrl.getBusinessPlan);
router.post("/entrepreneuriat/business-plans", auth, ctrl.createBusinessPlan);
router.put("/entrepreneuriat/business-plans/:id", auth, ctrl.updateBusinessPlan);

router.post("/entrepreneuriat/idees", auth, validate(createIdeeSchema), ctrl.createIdee);
router.post("/entrepreneuriat/idees/vote", auth, validate(voteIdeeSchema), ctrl.voteIdee);
router.post("/entrepreneuriat/idees/promote", auth, validate(promoteToProjetSchema), ctrl.promoteToProjet);
router.post("/entrepreneuriat/idees/:id/ancrer", auth, ctrl.ancrerIdee);
router.post("/entrepreneuriat/business-plan/generate", auth, validate(generateBusinessPlanSchema), ctrl.generateBusinessPlan);
router.post("/entrepreneuriat/campagnes", auth, validate(createCampagneSchema), ctrl.createCampagne);
router.post("/entrepreneuriat/campagnes/contribute", auth, validate(contributeSchema), ctrl.contributeToCampaign);

module.exports = router;
