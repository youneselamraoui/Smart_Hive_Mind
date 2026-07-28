const Publication = require("../models/Publication");
const { anchorContent } = require("../services/blockchainService");
const { generateJustification } = require("../services/rulesEngine");

const BLOCKCHAIN_SERVICE_URL =
    process.env.BLOCKCHAIN_SERVICE_URL || "http://blockchain-service:4000";
const IA_DIAGNOSTIC_URL =
    process.env.IA_DIAGNOSTIC_URL || "http://ai-diagnostic:8000";
const IA_PREDICTIVE_URL =
    process.env.IA_PREDICTIVE_URL || "http://ai-predictive:8000";
const IA_DECISIONNEL_URL =
    process.env.IA_DECISIONNEL_URL || "http://ai-decisionnel:8000";

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
}

exports.createPublication = async (req, res) => {
    try {
        const { titre, contenu, type, auteur } = req.body;

        const publication = await Publication.create({
            titre,
            contenu,
            type,
            auteur,
            statut: "brouillon",
        });

        try {
            const { hashContenu, preuve } = await anchorContent(contenu);
            publication.hashContenu = hashContenu;
            publication.preuve = preuve;
        } catch (anchorErr) {
            publication.preuve = anchorErr.preuve || { hash: "", statut: "echec" };
            await publication.save();
            return res.status(anchorErr.status || 502).json({
                error: anchorErr.message || "Echec de l'ancrage blockchain.",
                detail: anchorErr.detail,
            });
        }

        await publication.save();

        res.status(201).json({
            message: "Publication creee et ancre sur la blockchain.",
            publication: {
                id: publication._id,
                titre: publication.titre,
                type: publication.type,
                statut: publication.statut,
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

exports.verifyPublication = async (req, res) => {
    try {
        const publication = await Publication.findById(req.params.id);
        if (!publication) {
            return res.status(404).json({ error: "Publication introuvable." });
        }
        if (!publication.hashContenu) {
            return res.status(400).json({ error: "Aucun hash associe a cette publication." });
        }

        const hashContenu = publication.hashContenu.startsWith('0x') ? publication.hashContenu : '0x' + publication.hashContenu;
        const verifyRes = await fetchWithTimeout(
            `${BLOCKCHAIN_SERVICE_URL}/verify/${hashContenu}`
        );

        if (!verifyRes.ok) {
            if (verifyRes.status === 404) {
                return res.json({
                    submitter: null,
                    timestamp: null,
                    exists: false,
                    etherscanUrl: null,
                });
            }
            const errBody = await verifyRes.json().catch(() => ({}));
            return res.status(502).json({
                error: "Echec de la verification blockchain.",
                detail: errBody.error || "Service blockchain injoignable.",
            });
        }

        const data = await verifyRes.json();
        res.json({
            submitter: data.submitter,
            timestamp: data.timestamp,
            exists: data.exists,
            etherscanUrl: data.etherscanUrl,
        });
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({
                error: "TimeOut : le service blockchain n'a pas repondu dans les 8s.",
            });
        }
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.evaluatePublication = async (req, res) => {
    try {
        const publication = await Publication.findById(req.params.id);
        if (!publication) {
            return res.status(404).json({ error: "Publication introuvable." });
        }

        const iaCalls = [];

        iaCalls.push(
            fetchWithTimeout(`${IA_DIAGNOSTIC_URL}/diagnostic/plagiarism`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    texte: publication.contenu,
                    publicationId: String(publication._id),
                }),
            })
                .then((r) => r.json().catch(() => null))
                .catch(() => null)
        );

        iaCalls.push(
            fetchWithTimeout(`${IA_DECISIONNEL_URL}/decisionnel/score-publication`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titre: publication.titre,
                    contenu: publication.contenu,
                    type: publication.type,
                }),
            })
                .then((r) => r.json().catch(() => null))
                .catch(() => null)
        );

        const [diagnosticResult, decisionnelResult] = await Promise.all(iaCalls);

        const justification = generateJustification(diagnosticResult, decisionnelResult);

        const evaluation = {
            niveau: "ia",
            dateEvaluation: new Date(),
        };

        if (diagnosticResult && diagnosticResult.scoreMaxSimilarite !== undefined) {
            evaluation.noteOriginalite = Math.round(
                (1 - diagnosticResult.scoreMaxSimilarite) * 10 * 10
            ) / 10;
            evaluation._plagiatScore = diagnosticResult.scoreMaxSimilarite;
            evaluation._plagiatAlerte = diagnosticResult.seuil_alerte;
        }

        if (decisionnelResult && decisionnelResult.scoreGlobal !== undefined) {
            evaluation.scoreGlobal = decisionnelResult.scoreGlobal;
            evaluation._originaliteML = decisionnelResult.originalite;
            evaluation._rigueur = decisionnelResult.rigueur;
            evaluation._completude = decisionnelResult.completude;
            if (evaluation.noteOriginalite === undefined) {
                evaluation.noteOriginalite = Math.round(decisionnelResult.originalite * 10 * 10) / 10;
            }
            evaluation.noteRigueur = Math.round(decisionnelResult.rigueur * 10 * 10) / 10;
            evaluation.notePertinence = Math.round(
                ((decisionnelResult.originalite + decisionnelResult.rigueur + decisionnelResult.completude) / 3) *
                    10 * 10
            ) / 10;
        }

        publication.evaluations.push(evaluation);
        await publication.save();

        res.json({
            message: "Evaluation IA terminee.",
            evaluation: {
                noteOriginalite: evaluation.noteOriginalite ?? null,
                noteRigueur: evaluation.noteRigueur ?? null,
                notePertinence: evaluation.notePertinence ?? null,
                scoreGlobal: evaluation.scoreGlobal ?? null,
                niveau: "ia",
                dateEvaluation: evaluation.dateEvaluation,
                _plagiatScore: evaluation._plagiatScore ?? null,
                _plagiatAlerte: evaluation._plagiatAlerte ?? null,
                _originaliteML: evaluation._originaliteML ?? null,
                _rigueur: evaluation._rigueur ?? null,
                _completude: evaluation._completude ?? null,
            },
            justification,
        });
    } catch (err) {
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
