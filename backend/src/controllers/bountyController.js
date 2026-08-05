const Bounty = require("../models/Bounty");
const Notification = require("../models/Notification");

const IA_DECISIONNEL_URL =
    process.env.IA_DECISIONNEL_URL || "http://ai-decisionnel:8000";

const TIMEOUT_MS = 8000;

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
 * Creer une nouvelle bounty. Accessible a tout membre authentifie.
 */
exports.createBounty = async (req, res) => {
    try {
        const { titre, description, recompense, delai } = req.body;

        const bounty = await Bounty.create({
            titre,
            description,
            recompense,
            delai: new Date(delai),
            publiePar: req.membre.id,
        });

        const peuplée = await bounty.populate("publiePar", "nom prenom email");

        res.status(201).json(peuplée);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Soumettre une solution a une bounty.
 * L'auteur de la soumission est le membre authentifie.
 */
exports.submitSolution = async (req, res) => {
    try {
        const bounty = await Bounty.findById(req.params.id);
        if (!bounty) {
            return res.status(404).json({ error: "Bounty introuvable." });
        }

        if (new Date() > new Date(bounty.delai)) {
            return res.status(400).json({ error: "Delai de la bounty expire." });
        }

        if (bounty.gagnantId) {
            return res.status(400).json({ error: "Bounty deja attribuee." });
        }

        const { contenuUrl } = req.body;
        if (!contenuUrl) {
            return res.status(400).json({ error: "contenuUrl requis." });
        }

        const dejaSoumis = bounty.soumissions.some(
            (s) => s.membreId.toString() === req.membre.id
        );
        if (dejaSoumis) {
            return res.status(400).json({ error: "Vous avez deja soumis une solution." });
        }

        bounty.soumissions.push({
            membreId: req.membre.id,
            contenuUrl,
            dateSubmission: new Date(),
        });

        await bounty.save();

        res.status(201).json({
            message: "Solution soumise avec succes.",
            soumissions: bounty.soumissions,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Selectionner le gagnant d'une bounty.
 * Reserve a l'auteur de la bounty ou a un admin.
 * L'IA decisionnelle classe les soumissions ; le gagnant est soit celui
 * confirme dans le corps (gagnantId), soit le premier du classement IA.
 * Une notification "bounty" est envoyee au gagnant.
 */
exports.selectWinner = async (req, res) => {
    try {
        const bounty = await Bounty.findById(req.params.id);
        if (!bounty) {
            return res.status(404).json({ error: "Bounty introuvable." });
        }

        if (
            bounty.publiePar.toString() !== req.membre.id &&
            req.membre.role !== "admin"
        ) {
            return res.status(403).json({
                error: "Seul l'auteur de la bounty ou un admin peut choisir le gagnant.",
            });
        }

        if (bounty.gagnantId) {
            return res.status(400).json({ error: "Un gagnant a deja ete choisi." });
        }

        if (bounty.soumissions.length === 0) {
            return res.status(400).json({ error: "Aucune soumission a classer." });
        }

        // Appel a l'IA decisionnelle pour classer les soumissions
        const classementIA = await classerSoumissions(bounty);

        let gagnantId = req.body.gagnantId;
        if (!gagnantId && classementIA && classementIA.recommande) {
            gagnantId = classementIA.recommande;
        }

        if (!gagnantId) {
            const raison =
                classementIA && classementIA.erreur
                    ? `IA indisponible (${classementIA.erreur}). Fournissez gagnantId.`
                    : "gagnantId requis.";
            return res.status(400).json({ error: raison });
        }

        const soumissionValide = bounty.soumissions.some(
            (s) => s.membreId.toString() === gagnantId
        );
        if (!soumissionValide) {
            return res
                .status(400)
                .json({ error: "Ce membre n'a pas soumis de solution." });
        }

        bounty.gagnantId = gagnantId;
        await bounty.save();

        await Notification.create({
            destinataire: gagnantId,
            type: "bounty",
            message: `Felicitations ! Votre solution a la bounty "${bounty.titre}" a ete selectionnee comme gagnante.`,
            lien: `/marketplace/bounty/${bounty._id}`,
        });

        res.json({
            message: "Gagnant selectionne.",
            gagnantId,
            classementIA, // recommandation IA
            notificationEnvoyee: true,
        });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

/**
 * Appeler l'IA decisionnelle pour classer les soumissions.
 * Retourne un tableau classe ou null en cas d'echec.
 */
async function classerSoumissions(bounty) {
    const soumissionsData = bounty.soumissions.map((s) => ({
        membreId: s.membreId.toString(),
        contenuUrl: s.contenuUrl,
        dateSubmission: s.dateSubmission,
    }));

    try {
        const response = await fetchWithTimeout(
            `${IA_DECISIONNEL_URL}/decisionnel/classer-soumissions`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titre: bounty.titre,
                    description: bounty.description,
                    soumissions: soumissionsData,
                }),
            }
        );

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            return {
                recommande: null,
                erreur: errBody.error || "Echec du classement IA.",
            };
        }

        const data = await response.json();
        if (data && Array.isArray(data)) {
            return {
                classement: data,
                recommande: data[0] ? data[0].membreId : null,
            };
        }
        return data;
    } catch (err) {
        return {
            recommande: null,
            erreur: err.name === "AbortError"
                ? "TimeOut du service IA decisionnel."
                : "Service IA decisionnel injoignable.",
        };
    }
}
