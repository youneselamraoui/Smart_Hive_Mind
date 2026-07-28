const Formation = require("../models/Formation");
const Mentorat = require("../models/Mentorat");

/**
 * Creer une formation avec upload GridFS (fichier video/texte).
 */
exports.creerFormation = async (req, res) => {
    try {
        const { titre, format } = req.body;

        if (!titre || !format) {
            return res.status(400).json({ error: "titre et format requis." });
        }

        const contenuUrl = req.file ? req.file.id.toString() : "";

        const formation = await Formation.create({
            titre,
            format,
            contenuUrl,
            auteurId: req.membre.id,
        });

        res.status(201).json({
            message: "Formation creee.",
            formation: {
                id: formation._id,
                titre: formation.titre,
                format: formation.format,
                contenuUrl: formation.contenuUrl,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Noter une formation (moyenne ponderee des notes).
 */
exports.noterFormation = async (req, res) => {
    try {
        const { formationId, note } = req.body;
        const membreId = req.membre.id;

        if (note === undefined || note < 0 || note > 5) {
            return res.status(400).json({ error: "La note doit etre entre 0 et 5." });
        }

        const formation = await Formation.findById(formationId);
        if (!formation) {
            return res.status(404).json({ error: "Formation introuvable." });
        }

        const existante = formation.notes.find(
            (n) => n.membreId.toString() === membreId
        );
        if (existante) {
            existante.note = note;
        } else {
            formation.notes.push({ membreId, note });
        }

        const total = formation.notes.reduce((s, n) => s + n.note, 0);
        formation.certificationCommunautaire =
            Math.round((total / formation.notes.length) * 100) / 100;

        await formation.save();

        res.json({
            message: "Note enregistree.",
            certificationCommunautaire: formation.certificationCommunautaire,
            nbNotes: formation.notes.length,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Demander un mentorat (cote apprenant).
 */
exports.demanderMentorat = async (req, res) => {
    try {
        const { mentorId } = req.body;
        const apprenantId = req.membre.id;

        if (!mentorId) {
            return res.status(400).json({ error: "mentorId requis." });
        }

        const existant = await Mentorat.findOne({
            mentorId,
            apprenantId,
            statut: "actif",
        });
        if (existant) {
            return res
                .status(409)
                .json({ error: "Un mentorat actif existe deja entre ces deux membres." });
        }

        const mentorat = await Mentorat.create({
            mentorId,
            apprenantId,
        });

        res.status(201).json({
            message: "Demande de mentorat envoyee.",
            mentorat: { id: mentorat._id, statut: mentorat.statut },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Accepter une demande de mentorat (cote mentor).
 */
exports.accepterMentorat = async (req, res) => {
    try {
        const { mentoratId, remunerationParHeure } = req.body;
        const membreId = req.membre.id;

        const mentorat = await Mentorat.findById(mentoratId);
        if (!mentorat) {
            return res.status(404).json({ error: "Mentorat introuvable." });
        }

        if (mentorat.mentorId.toString() !== membreId) {
            return res
                .status(403)
                .json({ error: "Seul le mentor peut accepter." });
        }

        if (mentorat.statut !== "actif") {
            return res.status(400).json({ error: "Mentorat deja traite." });
        }

        if (remunerationParHeure !== undefined) {
            mentorat.remunerationParHeure = remunerationParHeure;
        }

        await mentorat.save();

        res.json({
            message: "Mentorat accepte.",
            mentorat: {
                id: mentorat._id,
                statut: mentorat.statut,
                remunerationParHeure: mentorat.remunerationParHeure,
            },
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Ajouter un suivi a un mentorat (cote mentor).
 */
exports.ajouterSuiviMentorat = async (req, res) => {
    try {
        const { mentoratId, note } = req.body;
        const membreId = req.membre.id;

        if (!note || !note.trim()) {
            return res.status(400).json({ error: "La note de suivi est requise." });
        }

        const mentorat = await Mentorat.findById(mentoratId);
        if (!mentorat) {
            return res.status(404).json({ error: "Mentorat introuvable." });
        }

        if (mentorat.mentorId.toString() !== membreId) {
            return res
                .status(403)
                .json({ error: "Seul le mentor peut ajouter un suivi." });
        }

        if (mentorat.statut !== "actif") {
            return res
                .status(400)
                .json({ error: "Le mentorat n est pas actif." });
        }

        mentorat.suivi.push({ date: new Date(), note });
        await mentorat.save();

        res.json({
            message: "Suivi ajoute.",
            suivi: mentorat.suivi,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
