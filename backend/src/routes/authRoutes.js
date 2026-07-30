const { Router } = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { inscriptionSchema, connexionSchema } = require("../validators/membreSchema");
const { demanderResetSchema, verifierCodeSchema, reinitialiserMotDePasseSchema, updateProfilSchema } = require("../validators/authSchema");
const ctrl = require("../controllers/authController");
const Membre = require("../models/Membre");

const router = Router();

router.get("/membres", async (req, res) => {
    try {
        const { search, role } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) {
            const r = new RegExp(search, "i");
            filter.$or = [{ nom: r }, { prenom: r }, { email: r }];
        }
        const items = await Membre.find(filter).select("nom prenom email role").sort({ nom: 1 }).limit(100);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/membres/:id", async (req, res) => {
    try {
        const item = await Membre.findById(req.params.id).select("-motDePasse");
        if (!item) return res.status(404).json({ error: "Membre introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/auth/inscription", validate(inscriptionSchema), ctrl.inscription);
router.post("/auth/connexion", validate(connexionSchema), ctrl.connexion);
router.get("/auth/me", auth, ctrl.me);
router.put("/auth/mon-profil", auth, validate(updateProfilSchema), ctrl.updateProfil);
router.post("/auth/deconnexion", ctrl.deconnexion);
router.post("/auth/demander-reset", validate(demanderResetSchema), ctrl.demanderResetMotDePasse);
router.post("/auth/verifier-code", validate(verifierCodeSchema), ctrl.verifierCodeReset);
router.post("/auth/reinitialiser-mot-de-passe", validate(reinitialiserMotDePasseSchema), ctrl.reinitialiserMotDePasse);

module.exports = router;
