const Badge = require("../models/Badge");

exports.attribuer = async (req, res) => {
    try {
        const { utilisateurId, badgeType, justification } = req.body;
        if (!utilisateurId || !badgeType) {
            return res.status(400).json({ error: "utilisateurId et badgeType sont requis." });
        }
        const badge = await Badge.create({
            attribueA: utilisateurId,
            badgeType,
            justification: justification || "",
            attribuePar: req.membre.id,
        });
        res.status(201).json({ message: "Badge attribue.", badge });
    } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.lister = async (req, res) => {
    try {
        const filter = req.query.utilisateurId ? { attribueA: req.query.utilisateurId } : {};
        const badges = await Badge.find(filter)
            .populate("attribueA", "nom prenom email")
            .populate("attribuePar", "nom prenom email")
            .sort({ createdAt: -1 });
        res.json(badges);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};
