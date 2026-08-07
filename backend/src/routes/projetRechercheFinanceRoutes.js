const { Router } = require("express");
const validate = require("../middlewares/validate");
const {
    createProjetRechercheFinanceSchema,
    updateProjetRechercheFinanceSchema,
    candidaterProjetSchema,
    attribuerProjetSchema,
} = require("../validators/projetRechercheFinanceSchema");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/projetRechercheFinanceController");

const router = Router();

router.get("/projets-recherche", ctrl.listProjetsRechercheFinance);

router.get("/projets-recherche/:id", ctrl.getProjetRechercheFinanceById);

router.post("/projets-recherche", auth, validate(createProjetRechercheFinanceSchema), ctrl.createProjetRechercheFinance);

router.put("/projets-recherche/:id", auth, validate(updateProjetRechercheFinanceSchema), ctrl.updateProjetRechercheFinance);

router.delete("/projets-recherche/:id", auth, ctrl.deleteProjetRechercheFinance);

router.post("/projets-recherche/:id/candidater", auth, validate(candidaterProjetSchema), ctrl.candidaterProjet);

router.put("/projets-recherche/:id/attribuer", auth, validate(attribuerProjetSchema), ctrl.attribuerProjet);

module.exports = router;
