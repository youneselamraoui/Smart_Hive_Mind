const { Router } = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const authOrInternal = require("../middlewares/authOrInternal");
const ctrl = require("../controllers/smartToolsController");
const { createDatasetSchema } = require("../validators/datasetSchema");
const { createAtelierSchema } = require("../validators/atelierSchema");
const { publishModelSchema, publishModelJsonSchema } = require("../validators/modeleIASchema");
const Atelier = require("../models/Atelier");

const router = Router();

router.post("/smart-tools/ateliers", auth, validate(createAtelierSchema), ctrl.createAtelier);
router.get("/smart-tools/ateliers/:id", async (req, res) => {
    try {
        const item = await Atelier.findById(req.params.id).populate("createdBy", "nom prenom email");
        if (!item) return res.status(404).json({ error: "Atelier introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});
router.post("/smart-tools/ateliers/:id/progress", authOrInternal, ctrl.reportProgress);
router.post("/smart-tools/ateliers/:id/finalize", authOrInternal, ctrl.finalizeAtelier);

router.get("/smart-tools/datasets", async (req, res) => {
    try {
        const items = await require("../models/JeuDeDonnees").find().populate("uploadePar", "nom prenom email").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});
router.post("/smart-tools/datasets", auth, ctrl.uploadMiddleware, validate(createDatasetSchema), ctrl.uploadDataset);
router.get("/smart-tools/datasets/:id/download", ctrl.downloadDataset);

router.get("/smart-tools/models", ctrl.listModels);
router.post("/smart-tools/models", auth, ctrl.uploadMiddleware, validate(publishModelSchema), ctrl.publishModel);
router.post("/smart-tools/models/json", authOrInternal, validate(publishModelJsonSchema), ctrl.publishModelJson);

module.exports = router;
