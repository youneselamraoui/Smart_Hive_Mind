const Prestation = require("../models/Prestation");
const Evaluation = require("../models/Evaluation");

exports.list = async (req, res) => {
    try {
        const items = await Prestation.find()
            .populate("prestataireId", "nom prenom email")
            .populate("clientId", "nom prenom email")
            .populate("evaluationFinale")
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
            .populate("clientId", "nom prenom email")
            .populate("evaluationFinale");
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

/**
 * Evaluer une prestation (reserve au client).
 * Cree une Evaluation independante, la lie a la prestation (evaluationFinale)
 * et cloture la prestation (statut "terminee").
 */
exports.evaluate = async (req, res) => {
    try {
        const { note, commentaire } = req.body;
        const membreId = req.membre.id;

        const prestation = await Prestation.findById(req.params.id);
        if (!prestation) {
            return res.status(404).json({ error: "Prestation introuvable." });
        }
        if (prestation.clientId.toString() !== membreId) {
            return res.status(403).json({ error: "Seul le client peut evaluer cette prestation." });
        }
        if (prestation.evaluationFinale) {
            return res.status(409).json({ error: "Cette prestation est deja evaluee." });
        }

        const evaluation = await Evaluation.create({
            entiteType: "prestation",
            entiteId: prestation._id,
            evaluateurId: membreId,
            note,
            commentaire,
            niveau: "pair",
        });

        prestation.evaluationFinale = evaluation._id;
        prestation.statut = "terminee";
        await prestation.save();

        res.status(201).json({
            message: "Evaluation enregistree et prestation cloturee.",
            evaluation,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: "Cette prestation est deja evaluee." });
        }
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.getEvaluation = async (req, res) => {
    try {
        const prestation = await Prestation.findById(req.params.id).populate("evaluationFinale");
        if (!prestation) return res.status(404).json({ error: "Prestation introuvable." });
        if (!prestation.evaluationFinale) {
            return res.status(404).json({ error: "Aucune evaluation pour cette prestation." });
        }
        res.json(prestation.evaluationFinale);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};
