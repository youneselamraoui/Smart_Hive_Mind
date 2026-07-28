const { Router } = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { upload } = require("../config/gridfs");
const ctrl = require("../controllers/skillsController");
const { noterFormationSchema, demanderMentoratSchema, creerFormationSchema } = require("../validators/skillsSchema");
const { accepterMentoratSchema, ajouterSuiviMentoratSchema } = require("../validators/mentoratSchema");
const Formation = require("../models/Formation");
const Mentorat = require("../models/Mentorat");

const router = Router();

router.get("/skills/formations", async (req, res) => {
    try {
        const items = await Formation.find().populate("auteurId", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/skills/mentorats", async (req, res) => {
    try {
        const items = await Mentorat.find().populate("mentorId", "nom prenom email").populate("apprenantId", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/skills/formations", auth, upload("fichier"), validate(creerFormationSchema), ctrl.creerFormation);
router.post("/skills/formations/noter", auth, validate(noterFormationSchema), ctrl.noterFormation);
router.post("/skills/mentorats/demander", auth, validate(demanderMentoratSchema), ctrl.demanderMentorat);
router.post("/skills/mentorats/accepter", auth, validate(accepterMentoratSchema), ctrl.accepterMentorat);
router.post("/skills/mentorats/suivi", auth, validate(ajouterSuiviMentoratSchema), ctrl.ajouterSuiviMentorat);

module.exports = router;
