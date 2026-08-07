const { Router } = require("express");
const validate = require("../middlewares/validate");
const ctrl = require("../controllers/prestationController");
const auth = require("../middlewares/auth");
const { createPrestationSchema, updatePrestationSchema } = require("../validators/prestationSchema");
const { evaluerPrestationSchema } = require("../validators/evaluationSchema");

const router = Router();

router.get("/prestations", ctrl.list);
router.get("/prestations/:id", ctrl.getById);
router.post("/prestations", auth, validate(createPrestationSchema), ctrl.create);
router.put("/prestations/:id", auth, validate(updatePrestationSchema), ctrl.update);
router.delete("/prestations/:id", auth, ctrl.remove);
router.post("/prestations/:id/evaluation", auth, validate(evaluerPrestationSchema), ctrl.evaluate);
router.get("/prestations/:id/evaluation", ctrl.getEvaluation);

module.exports = router;
