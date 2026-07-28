const { Router } = require("express");
const validate = require("../middlewares/validate");
const publicationSchema = require("../validators/publicationSchema");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/publicationController");

const router = Router();

router.get("/publications", async (req, res) => {
    const publications = await require("../models/Publication").find()
        .populate("auteur", "nom prenom email")
        .sort({ createdAt: -1 });
    res.json(publications);
});

router.get("/publications/:id", async (req, res) => {
    const publication = await require("../models/Publication").findById(req.params.id)
        .populate("auteur", "nom prenom email");
    if (!publication) return res.status(404).json({ error: "Publication introuvable." });
    res.json(publication);
});

router.post("/publications", auth, validate(publicationSchema), ctrl.createPublication);

router.put("/publications/:id", auth, validate(publicationSchema), async (req, res) => {
    const publication = await require("../models/Publication").findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    if (!publication) return res.status(404).json({ error: "Publication introuvable." });
    res.json(publication);
});

router.get("/publications/:id/verify", ctrl.verifyPublication);

router.post("/publications/:id/evaluate-ia", auth, ctrl.evaluatePublication);

module.exports = router;
