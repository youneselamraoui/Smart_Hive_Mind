const TacheCrowdsourcing = require("../models/TacheCrowdsourcing");
const Membre = require("../models/Membre");

const IA_OPTIMISATION_URL =
    process.env.IA_OPTIMISATION_URL || "http://ai-optimisation:8000";

const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

exports.createTacheCrowdsourcing = async (req, res) => {
    try {
        const { titre, lots, remunerationTotale } = req.body;

        const tache = await TacheCrowdsourcing.create({
            titre,
            lots,
            remunerationTotale,
        });

        res.status(201).json(tache);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.repartirTaches = async (req, res) => {
    try {
        const tache = await TacheCrowdsourcing.findById(req.params.id);
        if (!tache) {
            return res.status(404).json({ error: "Tache introuvable." });
        }

        const nombreDeLots = tache.lots.length;
        if (nombreDeLots === 0) {
            return res.status(400).json({ error: "Cette tache n'a aucun lot a repartir." });
        }

        const membres = await Membre.find({}, "nom prenom role reputation");
        const contributeurs = membres.map((m) => ({
            id: String(m._id),
            nom: `${m.prenom} ${m.nom}`,
            reputation: m.reputation ?? 0.5,
        }));

        const optRes = await fetchWithTimeout(
            `${IA_OPTIMISATION_URL}/optimisation/repartir-taches`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contributeurs, nombreDeLots }),
            }
        );

        if (!optRes.ok) {
            const errBody = await optRes.json().catch(() => ({}));
            return res.status(502).json({
                error: "Le service d'optimisation n'a pas pu repartir les taches.",
                detail: errBody.detail || "Erreur inconnue.",
            });
        }

        const data = await optRes.json();

        for (const lot of data.repartition) {
            if (lot.lotsAttribues > 0) {
                const lotsModeles = tache.lots.filter(
                    (l) => String(l.assigneA) !== lot.contributeurId && l.statut === "ouverte"
                );
                for (let i = 0; i < lot.lotsAttribues && i < lotsModeles.length; i++) {
                    lotsModeles[i].assigneA = lot.contributeurId;
                    lotsModeles[i].statut = "assigne";
                }
            }
        }

        await tache.save();

        res.json({
            message: "Repartition effectuee.",
            tache,
            optimisation: data,
        });
    } catch (err) {
        if (err.name === "AbortError") {
            return res
                .status(504)
                .json({ error: "TimeOut du service d'optimisation." });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
