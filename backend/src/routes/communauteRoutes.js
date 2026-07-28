const { Router } = require("express");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
    createSujetSchema,
    addDiscussionSchema,
    listSujetsSchema,
    createSondageSchema,
    votePollSchema,
    createTemoignageSchema,
    listTemoignagesSchema,
    createGroupementSchema,
    joinGroupementSchema,
} = require("../validators/communauteSchema");
const ctrl = require("../controllers/communauteController");
const Forum = require("../models/Forum");
const Sondage = require("../models/Sondage");

const router = Router();

router.get("/communaute/forums", async (req, res) => {
    try {
        const items = await Forum.find().populate("thematiques").sort({ _id: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/communaute/sondages/:id", async (req, res) => {
    try {
        const item = await Sondage.findById(req.params.id).populate("auteurId", "nom prenom email");
        if (!item) return res.status(404).json({ error: "Sondage introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.post("/communaute/sujets", auth, validate(createSujetSchema), ctrl.createSujet);
router.post("/communaute/discussions", auth, validate(addDiscussionSchema), ctrl.addDiscussion);
router.get("/communaute/sujets/:id", async (req, res) => {
    try {
        const Sujet = require("../models/Sujet");
        const sujet = await Sujet.findById(req.params.id)
            .populate("auteurId", "nom prenom email")
            .populate("thematiqueId", "nom")
            .populate({
                path: "discussions",
                populate: { path: "auteurId", select: "nom prenom email" },
            });
        if (!sujet) return res.status(404).json({ error: "Sujet introuvable." });
        res.json(sujet);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

router.get("/communaute/sujets", validate(listSujetsSchema), ctrl.listSujetsByThematique);

router.post("/communaute/sondages", auth, validate(createSondageSchema), ctrl.createSondage);
router.post("/communaute/sondages/vote", auth, validate(votePollSchema), ctrl.votePoll);

router.post("/communaute/temoignages", auth, validate(createTemoignageSchema), ctrl.createTemoignage);
router.get("/communaute/temoignages", validate(listTemoignagesSchema), ctrl.listTemoignages);

router.get("/communaute/groupements", ctrl.listGroupements);
router.post("/communaute/groupements", auth, validate(createGroupementSchema), ctrl.createGroupement);
router.post("/communaute/groupements/join", auth, validate(joinGroupementSchema), ctrl.joinGroupement);

module.exports = router;
