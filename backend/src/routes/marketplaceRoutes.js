const { Router } = require("express");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createBountySchema, submitBountySchema } = require("../validators/bountySchema");
const { createOffreSchema } = require("../validators/offreSchema");
const { createBourseRechercheSchema } = require("../validators/bourseRechercheSchema");
const { createTacheCrowdsourcingSchema } = require("../validators/tacheCrowdsourcingSchema");
const bountyCtrl = require("../controllers/bountyController");
const offreCtrl = require("../controllers/offreController");
const bourseCtrl = require("../controllers/bourseRechercheController");
const tacheCtrl = require("../controllers/tacheCrowdsourcingController");
const Bounty = require("../models/Bounty");
const TacheCrowdsourcing = require("../models/TacheCrowdsourcing");
const Offre = require("../models/Offre");
const BourseRecherche = require("../models/BourseRecherche");

const router = Router();

router.get("/bounties", async (req, res) => {
    try {
        const items = await Bounty.find().populate("publiePar", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/bounties/:id", async (req, res) => {
    try {
        const item = await Bounty.findById(req.params.id).populate("publiePar", "nom prenom email");
        if (!item) return res.status(404).json({ error: "Bounty introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/bounties", auth, validate(createBountySchema), bountyCtrl.createBounty);
router.post("/bounties/:id/soumettre", auth, validate(submitBountySchema), bountyCtrl.submitSolution);
router.post("/bounties/:id/selectionner-gagnant", auth, bountyCtrl.selectWinner);
router.post("/offres", auth, validate(createOffreSchema), offreCtrl.createOffre);
router.post("/bourses-recherche", auth, validate(createBourseRechercheSchema), bourseCtrl.createBourseRecherche);
router.post("/taches-crowdsourcing", auth, validate(createTacheCrowdsourcingSchema), tacheCtrl.createTacheCrowdsourcing);
router.post("/taches-crowdsourcing/:id/repartir", auth, tacheCtrl.repartirTaches);
router.post("/taches-crowdsourcing/:id/ancrer", auth, tacheCtrl.ancrerTacheCrowdsourcing);

router.get("/taches-crowdsourcing", async (req, res) => {
    try {
        const items = await TacheCrowdsourcing.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/offres", async (req, res) => {
    try {
        const items = await Offre.find().populate("organisationId", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/bourses-recherche", async (req, res) => {
    try {
        const items = await BourseRecherche.find().populate("financeurId", "nom prenom email").populate("doctorantId", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

module.exports = router;
