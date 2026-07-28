const Offre = require("../models/Offre");

const ROLES_CREATEUR = ["encadrant", "organisation"];

exports.createOffre = async (req, res) => {
    try {
        if (!ROLES_CREATEUR.includes(req.membre.role)) {
            return res.status(403).json({
                error: "Seuls les encadrants et les organisations peuvent creer une offre.",
            });
        }

        const { type, titre, exigences } = req.body;

        const offre = await Offre.create({
            type,
            titre,
            exigences,
            organisationId: req.membre.id,
        });

        const peuplée = await offre.populate("organisationId", "nom prenom email");

        res.status(201).json(peuplée);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
