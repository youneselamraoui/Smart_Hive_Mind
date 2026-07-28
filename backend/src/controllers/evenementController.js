const Evenement = require("../models/Evenement");
const Publication = require("../models/Publication");
const { anchorContent } = require("../services/blockchainService");

const ROLES_CREATEUR = ["encadrant", "organisation"];

/**
 * Creer un evenement. Reserve aux encadrants et organisations.
 */
exports.createEvenement = async (req, res) => {
    try {
        if (!ROLES_CREATEUR.includes(req.membre.role)) {
            return res.status(403).json({
                error: "Seuls les encadrants et les organisations peuvent creer un evenement.",
            });
        }

        const { type, titre, dates, programme, capaciteMax, espacePrive } = req.body;

        const evenement = await Evenement.create({
            type,
            titre,
            dates: { debut: new Date(dates.debut), fin: new Date(dates.fin) },
            programme,
            organisateurId: req.membre.id,
            capaciteMax,
            espacePrive,
        });

        const peuplé = await evenement.populate("organisateurId", "nom prenom email");

        res.status(201).json(peuplé);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Inscrire un membre a un evenement.
 * Verifie la capacite maximale si definie.
 */
exports.inscrireMembre = async (req, res) => {
    try {
        const { evenementId } = req.body;
        const membreId = req.membre.id;

        const evenement = await Evenement.findById(evenementId);
        if (!evenement) {
            return res.status(404).json({ error: "Evenement introuvable." });
        }

        const dejaInscrit = evenement.inscrits.some(
            (id) => id.toString() === membreId
        );
        if (dejaInscrit) {
            return res.status(409).json({ error: "Vous etes deja inscrit." });
        }

        if (
            evenement.capaciteMax &&
            evenement.inscrits.length >= evenement.capaciteMax
        ) {
            return res.status(400).json({
                error: "Capacite maximale atteinte.",
            });
        }

        evenement.inscrits.push(membreId);
        await evenement.save();

        res.json({
            message: "Inscription reussie.",
            inscrits: evenement.inscrits.length,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Soumettre une oeuvre a un evenement.
 * Cree une Publication (reutilise le flux blockchain existant) et la lie a
 * l'evenement.
 */
exports.soumettreOeuvre = async (req, res) => {
    try {
        const { evenementId, titre, contenu } = req.body;
        const auteurId = req.membre.id;

        const evenement = await Evenement.findById(evenementId);
        if (!evenement) {
            return res.status(404).json({ error: "Evenement introuvable." });
        }

        const publication = await Publication.create({
            titre,
            contenu,
            type: "libre",
            auteur: auteurId,
            statut: "brouillon",
        });

        try {
            const { hashContenu, preuve } = await anchorContent(contenu);
            publication.hashContenu = hashContenu;
            publication.preuve = preuve;
        } catch (anchorErr) {
            publication.preuve = anchorErr.preuve || {
                hash: "",
                statut: "echec",
            };
            await publication.save();
            return res.status(anchorErr.status || 502).json({
                error: anchorErr.message || "Echec de l'ancrage blockchain.",
                detail: anchorErr.detail,
            });
        }

        await publication.save();

        evenement.oeuvresSoumises.push(publication._id);
        await evenement.save();

        res.status(201).json({
            message: "Oeuvre soumise et ancre sur la blockchain.",
            publication: {
                id: publication._id,
                titre: publication.titre,
                hashContenu: publication.hashContenu,
                preuve: publication.preuve,
                dateCreation: publication.createdAt,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.ajouterProgramme = async (req, res) => {
    try {
        const { intitule, heure, description } = req.body;
        const Evenement = require("../models/Evenement");
        const evenement = await Evenement.findById(req.params.id);
        if (!evenement) return res.status(404).json({ error: "Événement introuvable." });
        if (!evenement.programme) evenement.programme = [];
        evenement.programme.push({ intitule, heure, description });
        await evenement.save();
        res.status(201).json({ message: "Élément ajouté au programme.", programme: evenement.programme });
    } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.supprimerProgramme = async (req, res) => {
    try {
        const Evenement = require("../models/Evenement");
        const evenement = await Evenement.findById(req.params.id);
        if (!evenement) return res.status(404).json({ error: "Événement introuvable." });
        const index = parseInt(req.params.index, 10);
        if (index < 0 || index >= (evenement.programme || []).length) {
            return res.status(400).json({ error: "Index invalide." });
        }
        evenement.programme.splice(index, 1);
        await evenement.save();
        res.json({ message: "Élément supprimé du programme.", programme: evenement.programme });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};
