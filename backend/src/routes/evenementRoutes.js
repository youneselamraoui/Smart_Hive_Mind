const { Router } = require("express");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createEvenementSchema, soumettreOeuvreSchema, ajouterProgrammeSchema, inscrireMembreSchema } = require("../validators/evenementSchema");
const ctrl = require("../controllers/evenementController");
const Evenement = require("../models/Evenement");

const router = Router();

router.get("/evenements", async (req, res) => {
    try {
        const items = await Evenement.find().populate("organisateurId", "nom prenom email").sort({ "dates.debut": -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/evenements/:id", async (req, res) => {
    try {
        const item = await Evenement.findById(req.params.id)
            .populate("organisateurId", "nom prenom email")
            .populate({ path: "oeuvresSoumises", populate: { path: "auteur", select: "nom prenom" } });
        if (!item) return res.status(404).json({ error: "Evenement introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/evenements", auth, validate(createEvenementSchema), ctrl.createEvenement);
router.post("/evenements/inscrire", auth, validate(inscrireMembreSchema), ctrl.inscrireMembre);
router.post("/evenements/soumettre", auth, validate(soumettreOeuvreSchema), ctrl.soumettreOeuvre);
router.post("/evenements/:id/programme", auth, validate(ajouterProgrammeSchema), ctrl.ajouterProgramme);
router.delete("/evenements/:id/programme/:index", auth, ctrl.supprimerProgramme);

module.exports = router;
