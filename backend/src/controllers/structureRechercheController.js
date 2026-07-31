const StructureRecherche = require("../models/StructureRecherche");

exports.createStructureRecherche = async (req, res) => {
    try {
        if (!["admin", "organisation"].includes(req.membre.role)) {
            return res
                .status(403)
                .json({ error: "Seuls les admins et les organisations peuvent creer une structure de recherche." });
        }

        const { type, nom, membres, axes, productions } = req.body;

        const structure = await StructureRecherche.create({
            type,
            nom,
            membres,
            axes,
            productions,
        });

        const peuple = await structure.populate("membres productions", "nom prenom email");

        res.status(201).json(peuple);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listStructuresRecherche = async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) {
            filter.type = req.query.type;
        }

        const structures = await StructureRecherche.find(filter)
            .populate("membres productions", "nom prenom email")
            .sort({ createdAt: -1 });

        res.json(structures);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.getStructureRechercheById = async (req, res) => {
    try {
        const structure = await StructureRecherche.findById(req.params.id)
            .populate("membres productions", "nom prenom email");

        if (!structure) {
            return res.status(404).json({ error: "Structure de recherche introuvable." });
        }

        res.json(structure);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.updateStructureRecherche = async (req, res) => {
    try {
        if (!["admin", "organisation"].includes(req.membre.role)) {
            return res
                .status(403)
                .json({ error: "Seuls les admins et les organisations peuvent modifier une structure de recherche." });
        }

        const structure = await StructureRecherche.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("membres productions", "nom prenom email");

        if (!structure) {
            return res.status(404).json({ error: "Structure de recherche introuvable." });
        }

        res.json(structure);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.deleteStructureRecherche = async (req, res) => {
    try {
        if (req.membre.role !== "admin") {
            return res.status(403).json({ error: "Seuls les admins peuvent supprimer une structure de recherche." });
        }

        const structure = await StructureRecherche.findByIdAndDelete(req.params.id);

        if (!structure) {
            return res.status(404).json({ error: "Structure de recherche introuvable." });
        }

        res.json({ message: "Structure de recherche supprimee avec succes." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
