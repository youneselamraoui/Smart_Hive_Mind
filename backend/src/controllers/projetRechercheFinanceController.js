const ProjetRechercheFinance = require("../models/ProjetRechercheFinance");
const StructureRecherche = require("../models/StructureRecherche");

exports.createProjetRechercheFinance = async (req, res) => {
    try {
        if (!["admin", "organisation"].includes(req.membre.role)) {
            return res
                .status(403)
                .json({ error: "Seuls les admins et les organisations peuvent creer un projet de recherche finance." });
        }

        const { theme, budget, livrables, structureRechercheId } = req.body;

        const projet = await ProjetRechercheFinance.create({
            theme,
            budget,
            livrables,
            industrielId: req.membre._id,
            structureRechercheId,
        });

        const peuple = await projet.populate("industrielId structureRechercheId", "nom prenom email");

        res.status(201).json(peuple);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listProjetsRechercheFinance = async (req, res) => {
    try {
        const filter = {};
        if (req.query.statut) {
            filter.statut = req.query.statut;
        }

        const projets = await ProjetRechercheFinance.find(filter)
            .populate("industrielId structureRechercheId", "nom prenom email")
            .sort({ createdAt: -1 });

        res.json(projets);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.getProjetRechercheFinanceById = async (req, res) => {
    try {
        const projet = await ProjetRechercheFinance.findById(req.params.id)
            .populate("industrielId structureRechercheId", "nom prenom email");

        if (!projet) {
            return res.status(404).json({ error: "Projet de recherche finance introuvable." });
        }

        res.json(projet);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.updateProjetRechercheFinance = async (req, res) => {
    try {
        if (!["admin", "organisation"].includes(req.membre.role)) {
            return res
                .status(403)
                .json({ error: "Seuls les admins et les organisations peuvent modifier un projet de recherche finance." });
        }

        const projet = await ProjetRechercheFinance.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("industrielId structureRechercheId", "nom prenom email");

        if (!projet) {
            return res.status(404).json({ error: "Projet de recherche finance introuvable." });
        }

        res.json(projet);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.deleteProjetRechercheFinance = async (req, res) => {
    try {
        if (req.membre.role !== "admin") {
            return res.status(403).json({ error: "Seuls les admins peuvent supprimer un projet de recherche finance." });
        }

        const projet = await ProjetRechercheFinance.findByIdAndDelete(req.params.id);

        if (!projet) {
            return res.status(404).json({ error: "Projet de recherche finance introuvable." });
        }

        res.json({ message: "Projet de recherche finance supprime avec succes." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.candidaterProjet = async (req, res) => {
    try {
        const { equipeId } = req.body;

        const structure = await StructureRecherche.findById(equipeId);
        if (!structure) {
            return res.status(404).json({ error: "Structure de recherche introuvable." });
        }

        const estMembre = structure.membres.some(
            (m) => m.toString() === req.membre._id.toString()
        );
        if (!estMembre) {
            return res
                .status(403)
                .json({ error: "Vous n'etes pas membre de cette equipe de recherche." });
        }

        const projet = await ProjetRechercheFinance.findById(req.params.id);
        if (!projet) {
            return res.status(404).json({ error: "Projet de recherche finance introuvable." });
        }

        if (projet.statut !== "candidature") {
            return res.status(400).json({ error: "Les candidatures ne sont plus ouvertes pour ce projet." });
        }

        const dejaCandidat = projet.candidatures.find(
            (c) => c.equipeId.toString() === equipeId
        );
        if (dejaCandidat) {
            return res.status(400).json({ error: "Cette equipe a deja candidate a ce projet." });
        }

        projet.candidatures.push({
            equipeId,
            dateCandidature: new Date(),
            statut: "en_attente",
        });

        await projet.save();

        const peuple = await projet.populate("industrielId structureRechercheId candidatures.equipeId", "nom prenom email");

        res.json(peuple);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.attribuerProjet = async (req, res) => {
    try {
        const { equipeId } = req.body;

        const projet = await ProjetRechercheFinance.findById(req.params.id);
        if (!projet) {
            return res.status(404).json({ error: "Projet de recherche finance introuvable." });
        }

        if (projet.industrielId.toString() !== req.membre._id.toString()) {
            return res
                .status(403)
                .json({ error: "Seul l'industriel ayant publie ce projet peut l'attribuer." });
        }

        if (projet.statut !== "candidature") {
            return res.status(400).json({ error: "Ce projet n'est plus en phase de candidature." });
        }

        const candidature = projet.candidatures.find(
            (c) => c.equipeId.toString() === equipeId
        );
        if (!candidature) {
            return res.status(400).json({ error: "Cette equipe n'a pas candidate a ce projet." });
        }

        projet.structureRechercheId = equipeId;
        projet.statut = "en_cours";
        candidature.statut = "retenue";

        await projet.save();

        const peuple = await projet.populate("industrielId structureRechercheId candidatures.equipeId", "nom prenom email");

        res.json(peuple);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
