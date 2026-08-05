const { Router } = require("express");
const mongoose = require("mongoose");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const Outil = require("../models/Outil");
const {
    creerOutilSchema,
    majOutilSchema,
    listOutilsSchema,
} = require("../validators/outilSchema");

const router = Router();

function adminOnly(req, res, next) {
    if (req.membre?.role !== "admin") {
        return res.status(403).json({ error: "Acces reserve aux administrateurs." });
    }
    next();
}

// GET /outils — liste publique, filtres optionnels categorie / fonction
router.get("/outils", validate(listOutilsSchema), async (req, res) => {
    try {
        const filter = {};
        if (req.query.categorie) filter.categorie = req.query.categorie;
        if (req.query.fonction) {
            filter.fonction = { $regex: req.query.fonction, $options: "i" };
        }
        const items = await Outil.find(filter).sort({ nom: 1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

// GET /outils/:id — lecture publique
router.get("/outils/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: "ID invalide." });
        }
        const item = await Outil.findById(req.params.id).lean();
        if (!item) return res.status(404).json({ error: "Outil introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

// POST /outils — admin uniquement
router.post("/outils", auth, adminOnly, validate(creerOutilSchema), async (req, res) => {
    try {
        const outil = await Outil.create(req.body);
        res.status(201).json(outil);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne." });
    }
});

// PUT /outils/:id — admin uniquement
router.put("/outils/:id", auth, adminOnly, validate(majOutilSchema), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: "ID invalide." });
        }
        const item = await Outil.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!item) return res.status(404).json({ error: "Outil introuvable." });
        res.json(item);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne." });
    }
});

// DELETE /outils/:id — admin uniquement
router.delete("/outils/:id", auth, adminOnly, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: "ID invalide." });
        }
        const item = await Outil.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: "Outil introuvable." });
        res.json({ message: "Outil supprime.", id: item._id });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
});

module.exports = router;
