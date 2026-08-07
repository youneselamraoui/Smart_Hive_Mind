const { Router } = require("express");
const validate = require("../middlewares/validate");
const { createJournalSchema, updateJournalSchema, soumettreJournalSchema } = require("../validators/journalSchema");
const auth = require("../middlewares/auth");
const ctrl = require("../controllers/journalController");

const router = Router();

router.get("/journaux", ctrl.listJournaux);

router.get("/journaux/:id", ctrl.getJournalById);

router.post("/journaux", auth, validate(createJournalSchema), ctrl.createJournal);

router.put("/journaux/:id", auth, validate(updateJournalSchema), ctrl.updateJournal);

router.delete("/journaux/:id", auth, ctrl.deleteJournal);

router.post("/publications/:id/soumettre-journal", auth, validate(soumettreJournalSchema), ctrl.soumettreAuJournal);

module.exports = router;
