const BourseRecherche = require("../models/BourseRecherche");

exports.createBourseRecherche = async (req, res) => {
    try {
        const { montant, criteres } = req.body;

        const bourse = await BourseRecherche.create({
            montant,
            criteres,
            financeurId: req.membre.id,
        });

        const peuplée = await bourse.populate("financeurId", "nom prenom email");

        res.status(201).json(peuplée);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
