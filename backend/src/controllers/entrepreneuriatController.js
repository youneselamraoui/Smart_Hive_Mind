const Idee = require("../models/Idee");
const Projet = require("../models/Projet");
const BusinessPlan = require("../models/BusinessPlan");
const CampagneCrowdfunding = require("../models/CampagneCrowdfunding");

const IA_CONVERSATIONAL_URL =
    process.env.IA_CONVERSATIONAL_URL || "http://ai-conversational:8000";

const SEUIL_VOTES_PROMOTION = 10;
const TIMEOUT_MS = 30000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Voter pour une idee.  Verifie que le membre n'a pas deja vote.
 */
exports.voteIdee = async (req, res) => {
    try {
        const { ideeId } = req.body;
        const membreId = req.membre.id;

        const idee = await Idee.findById(ideeId);
        if (!idee) {
            return res.status(404).json({ error: "Idee introuvable." });
        }

        const dejaVote = idee.votes.some((v) => v.toString() === membreId);
        if (dejaVote) {
            return res.status(409).json({ error: "Vous avez deja vote pour cette idee." });
        }

        idee.votes.push(membreId);
        await idee.save();

        res.json({
            message: "Vote enregistre.",
            nbVotes: idee.votes.length,
            seuilAtteint: idee.votes.length >= SEUIL_VOTES_PROMOTION,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Creer une nouvelle idee.
 */
exports.createIdee = async (req, res) => {
    try {
        const { titre, description } = req.body;
        const idee = await Idee.create({ titre, description, auteurId: req.membre.id });
        const peuplée = await idee.populate("auteurId", "nom prenom email");
        res.status(201).json(peuplée);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Promouvoir une idee en projet une fois le seuil de votes atteint (10).
 */
exports.promoteToProjet = async (req, res) => {
    try {
        const { ideeId } = req.body;

        const idee = await Idee.findById(ideeId);
        if (!idee) {
            return res.status(404).json({ error: "Idee introuvable." });
        }

        if (idee.statut !== "proposee") {
            return res.status(400).json({
                error: "Seules les idees avec statut 'proposee' peuvent etre promues.",
            });
        }

        if (idee.votes.length < SEUIL_VOTES_PROMOTION) {
            return res.status(400).json({
                error: `Seuil de ${SEUIL_VOTES_PROMOTION} votes non atteint. Votes actuels: ${idee.votes.length}.`,
            });
        }

        const projet = await Projet.create({
            ideeId: idee._id,
            equipe: [idee.auteurId],
            statut: "planification",
        });

        idee.statut = "en_projet";
        await idee.save();

        res.status(201).json({
            message: "Idee promue en projet.",
            projet: {
                id: projet._id,
                ideeId: projet.ideeId,
                equipe: projet.equipe,
                statut: projet.statut,
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
 * Generer un BusinessPlan via l'IA conversationnelle (assist-writing).
 * Enregistre les segments dans assistanceDetails pour tracer l'apport IA.
 */
exports.listBusinessPlans = async (req, res) => {
    try {
        const filter = req.query.projetId ? { projetId: req.query.projetId } : {};
        const items = await BusinessPlan.find(filter).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.getBusinessPlan = async (req, res) => {
    try {
        const bp = await BusinessPlan.findById(req.params.id);
        if (!bp) return res.status(404).json({ error: "Business plan introuvable." });
        res.json(bp);
    } catch (err) {
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.createBusinessPlan = async (req, res) => {
    try {
        const { titre, modeleEconomique, budgetGlobal, previsionsFinancieres } = req.body;
        const bp = await BusinessPlan.create({
            titre,
            modeleEconomique,
            budget: budgetGlobal,
            previsions: previsionsFinancieres,
        });
        res.status(201).json(bp);
    } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.updateBusinessPlan = async (req, res) => {
    try {
        const { titre, modeleEconomique, budgetGlobal, previsionsFinancieres } = req.body;
        const bp = await BusinessPlan.findByIdAndUpdate(
            req.params.id,
            { titre, modeleEconomique, budget: budgetGlobal, previsions: previsionsFinancieres },
            { new: true, runValidators: true }
        );
        if (!bp) return res.status(404).json({ error: "Business plan introuvable." });
        res.json(bp);
    } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
        res.status(500).json({ error: "Erreur interne." });
    }
};

exports.generateBusinessPlan = async (req, res) => {
    try {
        const { projetId, contenu } = req.body;

        let contexte = { titre: "Business Plan", description: "", objectifs: [] };
        let projetRef = null;

        if (projetId) {
            const projet = await Projet.findById(projetId).populate("ideeId", "titre description");
            if (!projet) return res.status(404).json({ error: "Projet introuvable." });
            contexte = {
                titre: projet.ideeId?.titre || projet._id,
                description: projet.ideeId?.description || "",
                objectifs: projet.objectifs || [],
            };
            projetRef = projet._id;
        }

        let assistanceSegments = [{ segment: contenu, source: "utilisateur" }];
        let iaReponse = null;

        try {
            const iaRes = await fetchWithTimeout(
                `${IA_CONVERSATIONAL_URL}/conversational/assist-writing`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        brouillon: contenu,
                        type: "business_plan",
                        contexte,
                    }),
                }
            );

            if (iaRes.ok) {
                const data = await iaRes.json();
                iaReponse = data;
                if (data.segments) {
                    for (const seg of data.segments) {
                        assistanceSegments.push({
                            segment: seg.text || seg,
                            source: seg.source || "ia",
                        });
                    }
                } else if (data.reponse) {
                    assistanceSegments.push({ segment: data.reponse, source: "ia" });
                }
            }
        } catch {
            // L'IA peut ne pas etre disponible; on cree le BP sans assistance IA
        }

        const businessPlan = await BusinessPlan.create({
            ...(projetRef ? { projetId: projetRef } : {}),
            modeleEconomique: iaReponse?.reponse || "",
            budget: 0,
            previsions: "",
            version: "1.0.0",
            assistanceDetails: assistanceSegments,
        });

        res.status(201).json({
            message: "Business plan genere.",
            businessPlan: {
                id: businessPlan._id,
                version: businessPlan.version,
                nbSegmentsIA: assistanceSegments.filter((s) => s.source === "ia").length,
                assistanceDetails: businessPlan.assistanceDetails,
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
 * Contribuer a une campagne de crowdfunding.
 * Utilise $inc atomique pour eviter les race conditions.
 * Verifie que la campagne n'a pas expire avant d'accepter.
 */
exports.contributeToCampaign = async (req, res) => {
    try {
        const { campagneId, montant } = req.body;
        const membreId = req.membre.id;

        const campagne = await CampagneCrowdfunding.findById(campagneId);
        if (!campagne) {
            return res.status(404).json({ error: "Campagne introuvable." });
        }

        // Verifier l'expiration via la duree en jours
        const dateCreation = campagne.createdAt || campagne._id.getTimestamp();
        const dateLimite = new Date(dateCreation.getTime() + campagne.dureeJours * 86400000);
        if (new Date() > dateLimite) {
            return res.status(400).json({
                error: "Campagne expiree. Les contributions ne sont plus acceptees.",
            });
        }

        // Ajout atomique de la contribution et increment de fondsCollectes
        const updated = await CampagneCrowdfunding.findOneAndUpdate(
            { _id: campagneId },
            {
                $push: {
                    contributions: {
                        financeurId: membreId,
                        montant,
                        date: new Date(),
                    },
                },
                $inc: { fondsCollectes: montant },
            },
            { new: true }
        );

        res.json({
            message: "Contribution enregistree.",
            campagne: {
                id: updated._id,
                fondsCollectes: updated.fondsCollectes,
                objectifFinancier: updated.objectifFinancier,
                progression:
                    Math.round((updated.fondsCollectes / updated.objectifFinancier) * 10000) /
                    100,
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
 * Creer une campagne de crowdfunding.
 */
exports.createCampagne = async (req, res) => {
    try {
        const { titre, description, objectif, dateFin } = req.body;

        const dureeJours = Math.max(1, Math.ceil((new Date(dateFin) - new Date()) / 86400000));

        const campagne = await CampagneCrowdfunding.create({
            titre,
            description,
            objectifFinancier: objectif,
            dureeJours,
            statut: dureeJours > 0 ? "active" : "terminee",
        });

        res.status(201).json(campagne);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
