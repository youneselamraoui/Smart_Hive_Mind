// Atelier neuro-symbolique — périmètre volontairement restreint à des règles stables
// (critères d'évaluation de publication), conformément à la synthèse IA v1 section 2.7
// qui traite le neuro-symbolique comme axe de recherche appliqué et non comme produit stabilisé.

const Atelier = require("../models/Atelier");
const { appliquerRegles, REGLES_PAR_DEFAUT } = require("../services/rulesEngine");

exports.createAtelierNeuroSymbolique = async (req, res) => {
    try {
        const atelier = await Atelier.create({
            nom: "Atelier neuro-symbolique",
            type: "neuro_symbolique",
            createdBy: req.membre._id,
            regles: REGLES_PAR_DEFAUT.map((r) => ({
                nom: r.nom,
                condition: r.condition,
                poids: r.poids,
                actif: r.actif,
                impactSiDeclenchee: r.impactSiDeclenchee,
            })),
            etapes: [
                { label: "Initialisation des regles", statut: "termine" },
                { label: "Pret pour les tests", statut: "en_cours" },
            ],
            statutGlobal: "en_cours",
        });

        res.status(201).json(atelier);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.updateRegles = async (req, res) => {
    try {
        const atelier = await Atelier.findById(req.params.id);
        if (!atelier) {
            return res.status(404).json({ error: "Atelier introuvable." });
        }

        if (atelier.createdBy.toString() !== req.membre._id.toString() && req.membre.role !== "admin") {
            return res.status(403).json({ error: "Seul le proprietaire de l'atelier peut modifier ses regles." });
        }

        atelier.regles = req.body.regles;
        atelier.etapes.push({ label: "Regles mises a jour", statut: "termine" });
        await atelier.save();

        res.json(atelier);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.testerRegles = async (req, res) => {
    try {
        const atelier = await Atelier.findById(req.params.id);
        if (!atelier) {
            return res.status(404).json({ error: "Atelier introuvable." });
        }

        if (atelier.createdBy.toString() !== req.membre._id.toString() && req.membre.role !== "admin") {
            return res.status(403).json({ error: "Seul le proprietaire de l'atelier peut executer des tests." });
        }

        const reglesActives = atelier.regles.filter((r) => r.actif);
        const scores = {
            similarite: req.body.similarite,
            originalite: req.body.originalite,
            rigueur: req.body.rigueur,
            completude: req.body.completude,
        };

        const nbPositives = req.body.originalite > 0.3 ? 1 : 0;
        const scoreGlobal =
            (scores.originalite + scores.rigueur + scores.completude) / 3;

        const scoresComplets = { ...scores, scoreGlobal };

        const justifications = appliquerRegles(reglesActives, scoresComplets);

        const resultat = {
            scores: scoresComplets,
            justifications,
            nbReglesDeclenchees: justifications.length,
            nbReglesActives: reglesActives.length,
        };

        atelier.etapes.push({
            label: "Test execute",
            statut: "termine",
            resultat,
        });
        atelier.resultatFinal = resultat;
        await atelier.save();

        res.json(resultat);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const atelier = await Atelier.findById(req.params.id)
            .populate("createdBy", "nom prenom email");

        if (!atelier) {
            return res.status(404).json({ error: "Atelier introuvable." });
        }

        if (atelier.createdBy.toString() !== req.membre._id.toString() && req.membre.role !== "admin") {
            return res.status(403).json({ error: "Seul le proprietaire de l'atelier peut consulter son statut." });
        }

        res.json({
            id: atelier._id,
            type: atelier.type,
            statut: atelier.statutGlobal,
            etapes: atelier.etapes,
            regles: atelier.regles,
            resultatFinal: atelier.resultatFinal,
            createdAt: atelier.createdAt,
            updatedAt: atelier.updatedAt,
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
