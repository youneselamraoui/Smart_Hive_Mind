const Journal = require("../models/Journal");
const Publication = require("../models/Publication");

exports.createJournal = async (req, res) => {
    try {
        if (!["admin", "organisation"].includes(req.membre.role)) {
            return res
                .status(403)
                .json({ error: "Seuls les admins et les organisations peuvent creer un journal." });
        }

        const { nom, domaines, description, comite, administrateurs, statut } = req.body;

        const journal = await Journal.create({
            nom,
            domaines,
            description,
            comite,
            administrateurs,
            statut,
        });

        const peuple = await journal.populate("administrateurs comite.membreId", "nom prenom email");

        res.status(201).json(peuple);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listJournaux = async (req, res) => {
    try {
        const filter = {};
        if (req.query.domaine) {
            filter.domaines = { $in: [req.query.domaine] };
        }

        const journaux = await Journal.find(filter)
            .populate("administrateurs comite.membreId", "nom prenom email")
            .sort({ createdAt: -1 });

        res.json(journaux);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.getJournalById = async (req, res) => {
    try {
        const journal = await Journal.findById(req.params.id)
            .populate("administrateurs comite.membreId", "nom prenom email");

        if (!journal) {
            return res.status(404).json({ error: "Journal introuvable." });
        }

        res.json(journal);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.updateJournal = async (req, res) => {
    try {
        if (!["admin", "organisation"].includes(req.membre.role)) {
            return res
                .status(403)
                .json({ error: "Seuls les admins et les organisations peuvent modifier un journal." });
        }

        const journal = await Journal.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("administrateurs comite.membreId", "nom prenom email");

        if (!journal) {
            return res.status(404).json({ error: "Journal introuvable." });
        }

        res.json(journal);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.deleteJournal = async (req, res) => {
    try {
        if (req.membre.role !== "admin") {
            return res.status(403).json({ error: "Seuls les admins peuvent supprimer un journal." });
        }

        const journal = await Journal.findByIdAndDelete(req.params.id);

        if (!journal) {
            return res.status(404).json({ error: "Journal introuvable." });
        }

        res.json({ message: "Journal supprime avec succes." });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.soumettreAuJournal = async (req, res) => {
    try {
        const { journalId } = req.body;

        const journal = await Journal.findById(journalId);
        if (!journal) {
            return res.status(404).json({ error: "Journal introuvable." });
        }

        const publication = await Publication.findById(req.params.id);
        if (!publication) {
            return res.status(404).json({ error: "Publication introuvable." });
        }

        const auteurId = publication.auteur?.toString?.() || publication.auteur;
        if (auteurId !== req.membre._id.toString() && req.membre.role !== "admin") {
            return res
                .status(403)
                .json({ error: "Seul l'auteur de la publication peut la soumettre à un journal." });
        }

        publication.journalId = journalId;
        await publication.save();

        const peuple = await publication
            .populate("auteur", "nom prenom email")
            .populate("journalId", "nom");

        res.json(peuple);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
