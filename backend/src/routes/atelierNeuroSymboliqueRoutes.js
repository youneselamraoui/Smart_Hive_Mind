const { Router } = require("express");
const validate = require("../middlewares/validate");
const {
    createAtelierNeuroSymboliqueSchema,
    updateReglesSchema,
    testerReglesSchema,
} = require("../validators/atelierNeuroSymboliqueSchema");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/atelierNeuroSymboliqueController");

const router = Router();

router.post("/smart-tools/ateliers/neuro-symbolique", auth, validate(createAtelierNeuroSymboliqueSchema), ctrl.createAtelierNeuroSymbolique);

router.put("/smart-tools/ateliers/neuro-symbolique/:id/regles", auth, validate(updateReglesSchema), ctrl.updateRegles);

router.post("/smart-tools/ateliers/neuro-symbolique/:id/tester", auth, validate(testerReglesSchema), ctrl.testerRegles);

router.get("/smart-tools/ateliers/neuro-symbolique/:id/status", auth, ctrl.getStatus);

module.exports = router;
