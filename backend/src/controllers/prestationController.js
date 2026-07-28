const Prestation = require("../models/Prestation");

exports.list = async (req, res) => {
    try {
        const items = await Prestation.find()
            .populate("prestataireId", "nom prenom email")
            .populate("clientId", "nom prenom email")
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.getById = async (req, res) => {
    try {
        const item = await Prestation.findById(req.params.id)
            .populate("prestataireId", "nom prenom email")
            .populate("clientId", "nom prenom email");
        if (!item) return res.status(404).json({ error: "Prestation introuvable." });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.create = async (req, res) => {
    try {
        const { description, tarif, clientId } = req.body;
        const item = await Prestation.create({
            description,
            tarif,
            clientId,
            prestataireId: req.membre.id,
        });
        res.status(201).json(item);
    } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.update = async (req, res) => {
    try {
        const updates = {};
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.tarif !== undefined) updates.tarif = req.body.tarif;
        const item = await Prestation.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ error: "Prestation introuvable." });
        res.json(item);
    } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.remove = async (req, res) => {
    try {
        const item = await Prestation.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: "Prestation introuvable." });
        res.json({ message: "Supprime avec succes." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};
