const Sujet = require("../models/Sujet");
const Thematique = require("../models/Thematique");
const Discussion = require("../models/Discussion");
const Sondage = require("../models/Sondage");
const Temoignage = require("../models/Temoignage");
const Groupement = require("../models/Groupement");

exports.listThematiques = async (req, res) => {
    try {
        const items = await Thematique.find().select("nom forumId").populate("forumId", "nom").sort({ nom: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.createSujet = async (req, res) => {
    try {
        const thematique = await Thematique.findById(req.body.thematiqueId);
        if (!thematique) {
            return res.status(404).json({ error: "Thematique introuvable." });
        }
        const sujet = await Sujet.create({
            titre: req.body.titre,
            thematiqueId: req.body.thematiqueId,
            auteurId: req.membre.id,
        });
        const discussion = await Discussion.create({
            sujetId: sujet._id,
            auteurId: req.membre.id,
            contenu: req.body.contenu,
        });
        sujet.discussions.push(discussion._id);
        await sujet.save();
        thematique.sujets.push(sujet._id);
        await thematique.save();
        res.status(201).json(sujet);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.addDiscussion = async (req, res) => {
    try {
        const sujet = await Sujet.findById(req.body.sujetId);
        if (!sujet) {
            return res.status(404).json({ error: "Sujet introuvable." });
        }
        const discussion = await Discussion.create({
            sujetId: sujet._id,
            auteurId: req.membre.id,
            contenu: req.body.contenu,
        });
        sujet.discussions.push(discussion._id);
        await sujet.save();
        res.status(201).json(discussion);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listSujetsByThematique = async (req, res) => {
    try {
        const { thematiqueId, page, limit } = req.query;
        let sujets, total;
        if (thematiqueId) {
            const thematique = await Thematique.findById(thematiqueId)
                .populate({
                    path: "sujets",
                    options: {
                        sort: { createdAt: -1 },
                        skip: (page - 1) * limit,
                        limit: Number(limit),
                    },
                    populate: {
                        path: "auteurId",
                        select: "nom prenom",
                    },
                });
            if (!thematique) {
                return res.status(404).json({ error: "Thematique introuvable." });
            }
            sujets = thematique.sujets;
            total = await Sujet.countDocuments({ thematiqueId });
        } else {
            sujets = await Sujet.find()
                .populate("auteurId", "nom prenom")
                .populate("thematiqueId", "nom")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));
            total = await Sujet.countDocuments();
        }
        res.json({
            sujets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.createSondage = async (req, res) => {
    try {
        if (req.body.options.length < 2) {
            return res.status(400).json({ error: "Au moins 2 options sont requises." });
        }
        const sondage = await Sondage.create({
            question: req.body.question,
            options: req.body.options,
            auteurId: req.membre.id,
            dateFin: req.body.dateFin ? new Date(req.body.dateFin) : undefined,
        });
        res.status(201).json(sondage);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.votePoll = async (req, res) => {
    try {
        const sondage = await Sondage.findById(req.body.sondageId);
        if (!sondage) {
            return res.status(404).json({ error: "Sondage introuvable." });
        }
        if (sondage.dateFin && new Date() > sondage.dateFin) {
            return res.status(400).json({ error: "Ce sondage est clos." });
        }
        const membreId = req.membre.id;
        const optionIndex = req.body.optionIndex;
        if (optionIndex < 0 || optionIndex >= sondage.options.length) {
            return res.status(400).json({ error: "Index d option invalide." });
        }
        const votes = sondage.votes || {};
        for (const key of Object.keys(votes)) {
            const voters = votes[key] || [];
            if (voters.some((v) => v.toString() === membreId)) {
                return res.status(409).json({ error: "Vous avez deja vote pour ce sondage." });
            }
        }
        const key = String(optionIndex);
        if (!votes[key]) {
            votes[key] = [];
        }
        votes[key].push(membreId);
        sondage.votes = votes;
        await sondage.save();
        res.json({ message: "Vote enregistre.", sondage });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.createTemoignage = async (req, res) => {
    try {
        const temoignage = await Temoignage.create({
            auteurId: req.membre.id,
            titre: req.body.titre,
            contenu: req.body.contenu,
            tags: req.body.tags || [],
        });
        res.status(201).json(temoignage);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listTemoignages = async (req, res) => {
    try {
        const { tags, page, limit } = req.query;
        const filter = {};
        if (tags) {
            const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
            if (tagList.length > 0) {
                filter.tags = { $in: tagList };
            }
        }
        const total = await Temoignage.countDocuments(filter);
        const temoignages = await Temoignage.find(filter)
            .populate("auteurId", "nom prenom")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        res.json({
            temoignages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.createGroupement = async (req, res) => {
    try {
        const groupement = await Groupement.create({
            nom: req.body.nom,
            theme: req.body.theme || "",
            description: req.body.description || "",
            reglesAdhesion: req.body.reglesAdhesion || "",
        });
        res.status(201).json(groupement);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.listGroupements = async (req, res) => {
    try {
        const items = await Groupement.find()
            .populate("membres", "nom prenom email")
            .sort({ createdAt: -1 });
        const result = items.map(g => ({
            ...g.toObject(),
            nbMembres: g.membres.length,
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.joinGroupement = async (req, res) => {
    try {
        const groupement = await Groupement.findById(req.body.groupementId);
        if (!groupement) {
            return res.status(404).json({ error: "Groupement introuvable." });
        }
        const membreId = req.membre.id;
        if (groupement.membres.some((m) => m.toString() === membreId)) {
            return res.status(409).json({ error: "Vous etes deja membre de ce groupement." });
        }
        groupement.membres.push(membreId);
        await groupement.save();
        res.json({ message: "Inscription au groupement reussie.", groupement });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
