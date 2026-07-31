const { Router } = require("express");
const validate = require("../middlewares/validate");
const { createStructureRechercheSchema, updateStructureRechercheSchema } = require("../validators/structureRechercheSchema");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/structureRechercheController");

const router = Router();

router.get("/structures-recherche", ctrl.listStructuresRecherche);

router.get("/structures-recherche/:id", ctrl.getStructureRechercheById);

router.post("/structures-recherche", auth, validate(createStructureRechercheSchema), ctrl.createStructureRecherche);

router.put("/structures-recherche/:id", auth, validate(updateStructureRechercheSchema), ctrl.updateStructureRecherche);

router.delete("/structures-recherche/:id", auth, ctrl.deleteStructureRecherche);

module.exports = router;
